# Delay & blocker analytics across projects (docs/ANALYTICS_PLAN.md, Phase 1 on today's data).
#
# Delay is measured from when a task's prerequisites were completed ("ready"), not from started_date:
# started_date is set automatically at the parent's completion + 1 day, and ~29% of completed tasks were
# recorded as starting after they finished (see the 2026-10-21 investigation). Tasks are grouped across
# projects by master task name; all four projects currently share one 31-task template.
import re
import statistics
from collections import defaultdict
from datetime import timedelta

from config import db
from helpers import utc_now
from models import Project, Unit, UnitTask, MasterTask, MasterTaskDependency, StatusUpdate, User, TaskType

STUCK = 500

# Stuck notes are free text; until updates carry a reason code, infer one from keywords.
REASON_KEYWORDS = [
    ('Materials / delivery', r'truss|material|deliver|order|supplier|lumber|window|cabinet|granite|tile'),
    ('Inspection / permit', r'inspect|permit|approval|engineer'),
    ('Crew / subcontractor', r'crew|framer|plumber|electrician|sub\b|subcontract|worker|guys|team'),
    ('Owner / customer decision', r'customer|owner|client|decide|decision|meeting'),
    ('Rework / defect', r'wrong|redo|leak|fix|damage|mistake'),
    ('Weather', r'rain|snow|weather|cold|freez'),
]


def infer_reason(note):
    if not note or not note.strip():
        return 'No note'
    text = note.lower()
    for label, pattern in REASON_KEYWORDS:
        if re.search(pattern, text):
            return label
    return 'Other'


def _day(dt):
    return dt.date() if dt else None


def _median(values):
    return round(statistics.median(values), 1) if values else None


def _p75(values):
    if not values:
        return None
    if len(values) < 4:
        return float(max(values))
    return round(statistics.quantiles(values, n=4)[2], 1)


def build_analytics(projects, date_from=None, date_to=None):
    """projects: Project models the caller may see. date_from/date_to (dates) filter completed tasks."""
    today = utc_now().date()
    project_ids = [p.id for p in projects]
    project_names = {p.id: p.name for p in projects}

    units = {u.id: u for u in Unit.query.filter(Unit.project_id.in_(project_ids)).all()}
    tasks = (UnitTask.query.filter(UnitTask.unit_id.in_(list(units)))
             .join(MasterTask, MasterTask.id == UnitTask.task_id).all()) if units else []
    masters = {m.id: m for m in MasterTask.query.filter(MasterTask.project_id.in_(project_ids)).all()}
    type_names = {t.id: t.name for t in TaskType.query.all()}
    # group by cross-project task type; fall back to the task's own name if it isn't linked yet
    group_name = lambda m: type_names.get(m.task_type_id, m.name)
    parents = defaultdict(list)
    for dep in MasterTaskDependency.query.filter(MasterTaskDependency.task_id.in_(list(masters))).all():
        parents[dep.task_id].append(dep.dependent_task_id)

    updates = defaultdict(list)
    if tasks:
        for update in (StatusUpdate.query.filter(StatusUpdate.task_id.in_([t.id for t in tasks]))
                       .order_by(StatusUpdate.timestamp, StatusUpdate.id).all()):
            updates[update.task_id].append(update)
    reporters = {u.id: f"{u.first_name} {u.last_name}" for u in User.query.all()}

    by_unit_master = {(t.unit_id, t.task_id): t for t in tasks}

    # ---- one fact per unit task ----
    facts = {}
    for t in tasks:
        master = masters[t.task_id]
        parent_tasks = [by_unit_master.get((t.unit_id, p)) for p in parents[t.task_id]]
        parent_tasks = [p for p in parent_tasks if p]
        if parent_tasks:
            ready = max(_day(p.complete_date) for p in parent_tasks) if all(p.complete_status and p.complete_date for p in parent_tasks) else None
        else:
            # first task of a unit: ready when work was first recorded
            first_update = updates[t.id][0].timestamp if updates[t.id] else None
            ready = min(d for d in (_day(t.started_date), _day(first_update), _day(t.complete_date)) if d) if (t.started_date or first_update or t.complete_date) else None

        done = bool(t.complete_status and t.complete_date)
        completed = _day(t.complete_date) if done else None
        elapsed = None
        before_prereq = False
        if ready:
            end = completed or today
            elapsed = (end - ready).days
            if elapsed < 0:
                before_prereq = True   # recorded complete before its prerequisites were
                elapsed = 0
        planned = master.days_length or 0
        excess = max(0, elapsed - planned) if elapsed is not None else None

        # stuck episodes: a Stuck update until the next non-Stuck update, completion, or today
        episodes = []
        current = None
        for update in updates[t.id]:
            if update.task_status == STUCK and current is None:
                current = update
            elif update.task_status != STUCK and current is not None:
                episodes.append((current, _day(update.timestamp)))
                current = None
        if current is not None:
            episodes.append((current, completed))  # completed is None while still open

        facts[t.id] = {
            'task': t, 'master': master, 'unit': units[t.unit_id], 'project_id': units[t.unit_id].project_id,
            'name': group_name(master), 'planned': planned, 'ready': ready, 'done': done, 'completed': completed,
            'elapsed': elapsed, 'excess': excess, 'before_prereq': before_prereq, 'episodes': episodes,
            'start_after_completion': bool(done and t.started_date and _day(t.started_date) > completed),
            'parents': parent_tasks, 'critical_days': 0,
        }

    def in_period(fact):
        return fact['completed'] and (not date_from or fact['completed'] >= date_from) and (not date_to or fact['completed'] <= date_to)

    def measurable(fact):
        # completed in the period with a known ready date and consistent ordering
        return in_period(fact) and fact['elapsed'] is not None and not fact['before_prereq']

    # ---- per unit: finish vs plan, and the critical chain that set the finish ----
    tasks_by_unit = defaultdict(list)
    for fact in facts.values():
        tasks_by_unit[fact['unit'].id].append(fact)

    unit_rows = []
    for unit_id, unit_facts in tasks_by_unit.items():
        unit = units[unit_id]
        planned_finish = max((_day(f['task'].sched_end) for f in unit_facts if f['task'].sched_end), default=None)
        finished = all(f['done'] for f in unit_facts)
        done_facts = [f for f in unit_facts if f['done']]

        # walk back from the last completion through the latest-finishing prerequisite each time
        chain = []
        if done_facts:
            node = max(done_facts, key=lambda f: (f['completed'], f['task'].id))
            seen = set()
            while node and node['task'].id not in seen:
                seen.add(node['task'].id)
                chain.append(node)
                done_parents = [facts[p.id] for p in node['parents'] if facts[p.id]['done']]
                node = max(done_parents, key=lambda f: (f['completed'], f['task'].id)) if done_parents else None
        # open tasks that are ready are holding the unit up right now
        holding = [f for f in unit_facts if not f['done'] and f['ready']]
        for fact in chain + holding:
            fact['critical_days'] = fact['excess'] or 0

        last_done = max((f['completed'] for f in done_facts), default=None)
        # no work recorded yet: a planned date from unit creation says nothing about delay
        not_started = not done_facts and not holding
        if not_started:
            finish = None
        elif finished:
            finish = last_done
        else:
            # rough projection: remaining planned days along the longest open path, from today
            remaining = defaultdict(int)
            open_facts = [f for f in unit_facts if not f['done']]
            for _ in range(len(open_facts)):
                for f in open_facts:
                    prior = max((remaining[p.id] for p in f['parents'] if not facts[p.id]['done']), default=0)
                    own = max(f['planned'] - (f['elapsed'] or 0), 1) if f['ready'] else f['planned']
                    remaining[f['task'].id] = prior + own
            finish = today + timedelta(days=max(remaining.values(), default=0))
        slip = (finish - planned_finish).days if finish and planned_finish else None
        # build length vs planned length, independent of when the unit was created
        planned_start = min((_day(f['task'].sched_start) for f in unit_facts if f['task'].sched_start), default=None)
        first_activity = min((f['ready'] for f in unit_facts if f['ready']), default=None)
        planned_days = (planned_finish - planned_start).days if planned_finish and planned_start else None
        actual_days = (finish - first_activity).days if finish and first_activity else None
        over_plan = actual_days - planned_days if actual_days is not None and planned_days is not None else None
        contributors = sorted((f for f in chain + holding if f['critical_days'] > 0), key=lambda f: -f['critical_days'])[:3]
        unit_rows.append({
            'id': unit.id, 'name': unit.name, 'project_id': unit.project_id, 'project': project_names[unit.project_id],
            'finished': finished, 'not_started': not_started, 'progress': round(100 * len(done_facts) / len(unit_facts)) if unit_facts else 0,
            'planned_finish': planned_finish.isoformat() if planned_finish else None,
            'finish': finish.isoformat() if finish else None, 'finish_is_projection': not finished,
            'slip_days': slip,
            'planned_duration_days': planned_days, 'duration_days': actual_days, 'duration_over_plan_days': over_plan,
            'first_activity': first_activity.isoformat() if first_activity else None,
            'top_contributors': [{'task': f['name'], 'days': f['critical_days'], 'open': not f['done']} for f in contributors],
        })

    # ---- per task name, across projects ----
    by_name = defaultdict(list)
    for fact in facts.values():
        by_name[fact['name']].append(fact)
    order = {}
    for i, m in enumerate(sorted(masters.values(), key=lambda m: m.id)):
        order.setdefault(group_name(m), i)

    task_rows = []
    for name, group in by_name.items():
        completed = [f for f in group if measurable(f)]
        elapsed = [f['elapsed'] for f in completed]
        excess = [f['excess'] for f in completed]
        open_ready = [f for f in group if not f['done'] and f['ready']]
        episodes = [e for f in group for e in f['episodes']]
        task_rows.append({
            'task': name,
            'order': order.get(name, 0),
            'planned_days': statistics.mode([f['planned'] for f in group]),
            'completed': len(completed),
            'median_days': _median(elapsed),
            'p75_days': _p75(elapsed),
            'pct_over_plan': round(100 * sum(1 for f in completed if f['excess'] > 0) / len(completed)) if completed else None,
            'median_excess_days': _median(excess),
            'total_excess_days': sum(excess),
            'critical_days': sum(f['critical_days'] for f in group if measurable(f) or not f['done']),
            'open_now': len(open_ready),
            'open_over_plan': sum(1 for f in open_ready if f['excess'] > 0),
            'stuck_episodes': len(episodes),
            'stuck_days': sum(((end or today) - _day(start.timestamp)).days for start, end in episodes),
        })
    task_rows.sort(key=lambda r: r['order'])

    # ---- task x project heatmap (median days beyond plan) ----
    heat = defaultdict(list)
    for fact in facts.values():
        if measurable(fact):
            heat[(fact['name'], fact['project_id'])].append(fact['excess'])
    heatmap = [{'task': name, 'project_id': pid, 'median_excess_days': _median(values), 'n': len(values)}
               for (name, pid), values in heat.items()]

    # ---- blockers ----
    blockers = []
    for fact in facts.values():
        for start, end in fact['episodes']:
            start_day = _day(start.timestamp)
            if date_from and (end or today) < date_from or date_to and start_day > date_to:
                continue
            blockers.append({
                'project': project_names[fact['project_id']], 'unit_id': fact['unit'].id, 'unit': fact['unit'].name,
                'task': fact['name'], 'task_id': fact['task'].id,
                'start': start_day.isoformat(), 'end': end.isoformat() if end else None, 'open': end is None,
                'days': ((end or today) - start_day).days,
                'note': (start.message or '').strip(), 'reason': infer_reason(start.message),
                'reported_by': reporters.get(start.user_id),
            })
    blockers.sort(key=lambda b: (not b['open'], b['start']), reverse=False)
    reasons = defaultdict(lambda: {'episodes': 0, 'days': 0})
    for b in blockers:
        reasons[b['reason']]['episodes'] += 1
        reasons[b['reason']]['days'] += b['days']

    # ---- monthly trend of completions ----
    months = defaultdict(list)
    for fact in facts.values():
        if measurable(fact):
            months[fact['completed'].strftime('%Y-%m')].append(fact['excess'])
    monthly = [{'month': m, 'completed': len(v), 'median_excess_days': _median(v), 'pct_over_plan': round(100 * sum(1 for x in v if x > 0) / len(v))}
               for m, v in sorted(months.items())]

    # ---- headline numbers & data health ----
    completed_all = [f for f in facts.values() if f['done']]
    open_units = [u for u in unit_rows if not u['finished'] and not u['not_started']]
    late_units = [u for u in unit_rows if u['duration_over_plan_days'] is not None and u['duration_over_plan_days'] > 0]
    kpis = {
        'units': len(unit_rows),
        'units_finished': sum(1 for u in unit_rows if u['finished']),
        'units_behind_plan': len(late_units),
        'median_unit_over_plan_days': _median([u['duration_over_plan_days'] for u in unit_rows if u['duration_over_plan_days'] is not None]),
        'median_planned_duration_days': _median([u['planned_duration_days'] for u in unit_rows if u['duration_over_plan_days'] is not None]),
        'tasks_completed_in_period': sum(1 for f in facts.values() if in_period(f)),
        'pct_tasks_over_plan': round(100 * sum(1 for f in facts.values() if measurable(f) and f['excess'] > 0)
                                     / max(1, sum(1 for f in facts.values() if measurable(f)))),
        'open_stuck': sum(1 for b in blockers if b['open']),
        'tasks_waiting_now': sum(r['open_now'] for r in task_rows),
        'open_units': len(open_units),
        'units_not_started': sum(1 for u in unit_rows if u['not_started']),
    }
    data_health = {
        'completed_tasks': len(completed_all),
        'start_after_completion': sum(1 for f in completed_all if f['start_after_completion']),
        'completed_before_prerequisites': sum(1 for f in completed_all if f['before_prereq'] or f['elapsed'] is None),
        'stuck_without_note': sum(1 for b in blockers if b['reason'] == 'No note'),
        'grouping': 'task type' if all(m.task_type_id for m in masters.values()) else 'task type (unlinked tasks by name)',
        'unlinked_master_tasks': sum(1 for m in masters.values() if not m.task_type_id),
    }

    return {
        'projects': [{'id': p.id, 'name': p.name} for p in projects],
        'period': {'from': date_from.isoformat() if date_from else None, 'to': date_to.isoformat() if date_to else None},
        'kpis': kpis,
        'tasks': task_rows,
        'heatmap': heatmap,
        'units': sorted(unit_rows, key=lambda u: -(u['duration_over_plan_days'] if u['duration_over_plan_days'] is not None else -10**6)),
        'blockers': blockers,
        'reasons': sorted(({'reason': k, **v} for k, v in reasons.items()), key=lambda r: -r['days']),
        'monthly': monthly,
        'data_health': data_health,
    }
