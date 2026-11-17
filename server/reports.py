# Reports: an executive (portfolio) report for admins and a personal activity report for every user.
#
# Periods are rolling 7-day windows ending today (UTC), so the latest week is never a partial calendar
# week and "vs previous period" compares equal lengths. Unit finishes, projections and blockers come
# from analytics.build_analytics so both pages agree on what "behind plan" means.
from collections import defaultdict
from datetime import datetime, time, timedelta

from config import db
from helpers import utc_now, utc_today, update_due, update_late, late_window_start, get_previous_monday, completion_percent
from analytics import build_analytics
from models import Unit, UnitTask, MasterTask, StatusUpdate, User
from sqlalchemy import func, case

STUCK = 500
COMPLETED = 200
STATUS_LABELS = {1: 'Started', 25: '25%', 50: '50%', 75: '75%', 100: '100%', COMPLETED: 'Completed', STUCK: 'Stuck'}


def _status_group(code):
    if code == COMPLETED:
        return 'Completed'
    if code == STUCK:
        return 'Stuck'
    return 'Progress'


def _start_of(day):
    return datetime.combine(day, time.min)


class Period:
    def __init__(self, weeks, today=None):
        self.weeks = weeks
        self.today = today or utc_today()
        self.start = self.today - timedelta(days=7 * weeks - 1)
        self.prev_start = self.start - timedelta(days=7 * weeks)
        self.prev_end = self.start - timedelta(days=1)

    def week_index(self, day):
        """0 = oldest week of the period, weeks-1 = the 7 days ending today; None outside the period."""
        back = (self.today - day).days // 7
        return self.weeks - 1 - back if 0 <= back < self.weeks else None

    def in_period(self, day):
        return day is not None and self.start <= day <= self.today

    def in_previous(self, day):
        return day is not None and self.prev_start <= day <= self.prev_end

    def week_ends(self):
        return [(self.today - timedelta(days=7 * (self.weeks - 1 - i))) for i in range(self.weeks)]

    def to_dict(self):
        return {
            'weeks': self.weeks, 'from': self.start.isoformat(), 'to': self.today.isoformat(),
            'previous_from': self.prev_start.isoformat(), 'previous_to': self.prev_end.isoformat(),
        }


def _pct(part, whole):
    return completion_percent(part, whole)


def open_projects(projects):
    """Projects still being built: a project is closed once it has tasks and every one of them is complete.
    The company moves on when a project closes, so reports and the wall display cover open projects only."""
    ids = [p.id for p in projects]
    if not ids:
        return []
    rows = (db.session.query(Unit.project_id, func.count(UnitTask.id), func.sum(case((UnitTask.complete_status == True, 1), else_=0)))
            .join(UnitTask, UnitTask.unit_id == Unit.id).filter(Unit.project_id.in_(ids)).group_by(Unit.project_id).all())
    closed = {pid for pid, total, done in rows if total and done == total}
    return [p for p in projects if p.id not in closed]


def _scope_tasks(project_ids):
    return (db.session.query(UnitTask.id, UnitTask.unit_id, UnitTask.complete_status, UnitTask.complete_date,
                             UnitTask.complete_user_id, UnitTask.started_status, UnitTask.started_date, UnitTask.status_code,
                             Unit.project_id, Unit.name.label('unit_name'), MasterTask.name.label('task_name'))
            .join(Unit, Unit.id == UnitTask.unit_id)
            .join(MasterTask, MasterTask.id == UnitTask.task_id)
            .filter(Unit.project_id.in_(project_ids)).all())


def _scope_updates(project_ids, since, user_id=None):
    query = (db.session.query(StatusUpdate.id, StatusUpdate.task_id, StatusUpdate.user_id, StatusUpdate.task_status,
                              StatusUpdate.timestamp, StatusUpdate.message, UnitTask.unit_id, Unit.project_id,
                              Unit.name.label('unit_name'), MasterTask.name.label('task_name'))
             .join(UnitTask, UnitTask.id == StatusUpdate.task_id)
             .join(Unit, Unit.id == UnitTask.unit_id)
             .join(MasterTask, MasterTask.id == UnitTask.task_id)
             .filter(Unit.project_id.in_(project_ids)))
    if since:
        query = query.filter(StatusUpdate.timestamp >= _start_of(since))
    if user_id is not None:
        query = query.filter(StatusUpdate.user_id == user_id)
    return query.order_by(StatusUpdate.timestamp, StatusUpdate.id).all()


def _latest_update_at(task_ids):
    """task id -> timestamp of its most recent status update (one query)."""
    if not task_ids:
        return {}
    rows = (db.session.query(StatusUpdate.task_id, db.func.max(StatusUpdate.timestamp))
            .filter(StatusUpdate.task_id.in_(task_ids)).group_by(StatusUpdate.task_id).all())
    return {task_id: ts for task_id, ts in rows if ts}


def _flagged(tasks, today, rule):
    """open tasks flagged by helpers.update_late ('late') or helpers.update_due ('due'), longest without an update
    first, plus their latest update times"""
    open_tasks = _open_started(tasks)
    heard = _latest_update_at([t.id for t in open_tasks])
    if rule == 'late':
        # as of the period's last day, at the current time of day (helpers.late_cutoff)
        now = datetime.combine(today, utc_now().time())
        flagged = [t for t in open_tasks if update_late(t.status_code, t.started_status, t.started_date, heard.get(t.id), now)]
    else:
        flagged = [t for t in open_tasks if update_due(t.started_status, t.complete_status, heard.get(t.id), today)]
    flagged.sort(key=lambda t: heard.get(t.id) or t.started_date or datetime.min)
    return flagged, heard


def _task_ref(t, heard, project_names):
    return {'task_id': t.id, 'unit_id': t.unit_id, 'unit': t.unit_name, 'task': t.task_name,
            'project': project_names[t.project_id],
            'last_update': heard[t.id].date().isoformat() if t.id in heard else None}


def _open_started(tasks):
    return [t for t in tasks if t.started_status and not t.complete_status]


def _update_row(u, project_names):
    return {
        'id': u.id, 'task_id': u.task_id, 'unit_id': u.unit_id, 'unit': u.unit_name, 'task': u.task_name,
        'project': project_names.get(u.project_id), 'status': STATUS_LABELS.get(u.task_status, str(u.task_status)),
        'status_group': _status_group(u.task_status), 'date': u.timestamp.date().isoformat(),
        'note': (u.message or '').strip(),
    }


def build_portfolio_report(projects, weeks, today=None):
    period = Period(weeks, today)
    project_ids = [p.id for p in projects]
    project_names = {p.id: p.name for p in projects}
    analytics = build_analytics(projects)
    units = analytics['units']
    tasks = _scope_tasks(project_ids)
    updates = _scope_updates(project_ids, period.prev_start)
    names = {u.id: f"{u.first_name} {u.last_name}" for u in User.query.all()}

    # ---- weekly series ----
    completions = [0] * weeks
    update_counts = [0] * weeks
    reporters = [set() for _ in range(weeks)]
    for t in tasks:
        if t.complete_status and t.complete_date:
            i = period.week_index(t.complete_date.date())
            if i is not None:
                completions[i] += 1
    for u in updates:
        i = period.week_index(u.timestamp.date())
        if i is not None:
            update_counts[i] += 1
            reporters[i].add(u.user_id)
    series = [{'week_end': end.isoformat(), 'completed': completions[i], 'updates': update_counts[i],
               'reporters': len(reporters[i])} for i, end in enumerate(period.week_ends())]

    def done_in(t, check):
        return t.complete_status and t.complete_date and check(t.complete_date.date())

    completed_now = sum(1 for t in tasks if done_in(t, period.in_period))
    completed_prev = sum(1 for t in tasks if done_in(t, period.in_previous))
    updates_now = [u for u in updates if period.in_period(u.timestamp.date())]
    updates_prev = [u for u in updates if period.in_previous(u.timestamp.date())]

    # ---- late updates: the executive rule (helpers.update_late) ----
    late, last_heard = _flagged(tasks, period.today, 'late')

    # ---- units ----
    def stage(u):
        return 'finished' if u['finished'] else 'not_started' if u['not_started'] else 'in_progress'

    delivered_now = [u for u in units if u['finished'] and u['finish'] and period.in_period(datetime.fromisoformat(u['finish']).date())]
    delivered_prev = [u for u in units if u['finished'] and u['finish'] and period.in_previous(datetime.fromisoformat(u['finish']).date())]
    behind = [u for u in units if u['duration_over_plan_days'] is not None and u['duration_over_plan_days'] > 0]
    # Stuck = status_code 500, the same code every task view shows; the analytics episode adds days and the note
    stuck_ids = {t.id for t in tasks if t.status_code == STUCK and not t.complete_status}
    open_blockers = [b for b in analytics['blockers'] if b['open'] and b['task_id'] in stuck_ids]

    # ---- per project scorecard ----
    tasks_by_project = defaultdict(list)
    for t in tasks:
        tasks_by_project[t.project_id].append(t)
    projects_out = []
    for p in sorted(projects, key=lambda p: p.name):
        p_units = [u for u in units if u['project_id'] == p.id]
        p_tasks = tasks_by_project[p.id]
        finishes = [u for u in p_units if u['finish']]
        last = max(finishes, key=lambda u: u['finish']) if finishes else None
        projects_out.append({
            'id': p.id, 'name': p.name,
            'units': len(p_units),
            'finished': sum(1 for u in p_units if stage(u) == 'finished'),
            'in_progress': sum(1 for u in p_units if stage(u) == 'in_progress'),
            'not_started': sum(1 for u in p_units if stage(u) == 'not_started'),
            'completion_pct': _pct(sum(1 for t in p_tasks if t.complete_status), len(p_tasks)),
            'tasks_completed': sum(1 for t in p_tasks if done_in(t, period.in_period)),
            'tasks_completed_prev': sum(1 for t in p_tasks if done_in(t, period.in_previous)),
            'behind_plan': sum(1 for u in behind if u['project_id'] == p.id),
            'open_stuck': sum(1 for b in open_blockers if b['project'] == p.name),
            'late_updates': sum(1 for t in late if t.project_id == p.id),
            'completion_date': last['finish'] if last else None,
            'completion_is_projection': bool(last and any(not u['finished'] for u in p_units)),
        })

    # ---- handover forecast: units by finish month, delivered vs projected ----
    first_month = (period.today.replace(day=1) - timedelta(days=150)).replace(day=1)
    last_month = (period.today.replace(day=1) + timedelta(days=550)).replace(day=1)
    months = defaultdict(lambda: {'delivered': [], 'projected': []})
    beyond = 0
    for u in units:
        if not u['finish']:
            continue
        finish = datetime.fromisoformat(u['finish']).date().replace(day=1)
        if finish < first_month:
            continue
        if finish > last_month:
            beyond += 1
            continue
        months[finish]['delivered' if u['finished'] else 'projected'].append(
            {'id': u['id'], 'name': u['name'], 'project': u['project'], 'finish': u['finish'],
             'slip_days': u['duration_over_plan_days']})
    forecast = []
    month = first_month
    max_month = max(months) if months else period.today.replace(day=1)
    while month <= max(max_month, period.today.replace(day=1)):
        entry = months.get(month, {'delivered': [], 'projected': []})
        forecast.append({'month': month.strftime('%Y-%m'), 'delivered': len(entry['delivered']),
                         'projected': len(entry['projected']), 'units': entry['delivered'] + entry['projected']})
        month = (month + timedelta(days=32)).replace(day=1)

    # ---- team activity ----
    team = defaultdict(lambda: {'updates': 0, 'completed': 0, 'stuck': 0, 'recent': []})
    for u in updates_now:
        row = team[u.user_id]
        row['updates'] += 1
        row['stuck'] += u.task_status == STUCK
    for t in tasks:
        if done_in(t, period.in_period) and t.complete_user_id:
            team[t.complete_user_id]['completed'] += 1
    for u in reversed(updates_now):
        if len(team[u.user_id]['recent']) < 5:
            team[u.user_id]['recent'].append(_update_row(u, project_names))
    last_active = dict(db.session.query(StatusUpdate.user_id, db.func.max(StatusUpdate.timestamp))
                       .join(UnitTask, UnitTask.id == StatusUpdate.task_id)
                       .join(Unit, Unit.id == UnitTask.unit_id)
                       .filter(Unit.project_id.in_(project_ids)).group_by(StatusUpdate.user_id).all())
    team_out = sorted(({'user_id': uid, 'name': names.get(uid, 'Unknown'), **row,
                        'last_active': last_active[uid].date().isoformat() if last_active.get(uid) else None}
                       for uid, row in team.items()), key=lambda r: (-r['updates'], -r['completed'], r['name']))

    total_tasks = len(tasks)
    return {
        'scope': 'portfolio',
        'period': period.to_dict(),
        'projects': [{'id': p.id, 'name': p.name} for p in projects],
        'kpis': {
            'completion_pct': _pct(sum(1 for t in tasks if t.complete_status), total_tasks),
            'tasks_total': total_tasks,
            'tasks_done': sum(1 for t in tasks if t.complete_status),
            'tasks_completed': completed_now, 'tasks_completed_prev': completed_prev,
            'updates': len(updates_now), 'updates_prev': len(updates_prev),
            'reporters': len({u.user_id for u in updates_now}), 'reporters_prev': len({u.user_id for u in updates_prev}),
            'units': len(units),
            'units_finished': sum(1 for u in units if stage(u) == 'finished'),
            'units_in_progress': sum(1 for u in units if stage(u) == 'in_progress'),
            'units_not_started': sum(1 for u in units if stage(u) == 'not_started'),
            'units_delivered': len(delivered_now), 'units_delivered_prev': len(delivered_prev),
            'units_behind_plan': len(behind),
            'units_measured': sum(1 for u in units if u['duration_over_plan_days'] is not None),
            'median_over_plan_days': analytics['kpis']['median_unit_over_plan_days'],
            'open_stuck': len(open_blockers),
            'late_updates': len(late),
            'late_window_start': late_window_start(datetime.combine(period.today, utc_now().time())).isoformat(),
        },
        'series': series,
        'project_scorecard': projects_out,
        'forecast': forecast,
        'forecast_beyond': beyond,
        'team': team_out,
        'attention': {
            'blockers': sorted(open_blockers, key=lambda b: -b['days'])[:8],
            'behind_units': sorted((u for u in behind if not u['finished']), key=lambda u: -u['duration_over_plan_days'])[:6],
            'late_updates': [_task_ref(t, last_heard, project_names) for t in late[:8]],
        },
    }


def build_personal_report(user, projects, weeks, today=None):
    period = Period(weeks, today)
    project_ids = [p.id for p in projects]
    project_names = {p.id: p.name for p in projects}
    tasks = _scope_tasks(project_ids) if project_ids else []
    team_updates = _scope_updates(project_ids, period.prev_start) if project_ids else []
    mine = [u for u in team_updates if u.user_id == user.id]

    updates_series = [0] * weeks
    completed_series = [0] * weeks
    for u in mine:
        i = period.week_index(u.timestamp.date())
        if i is not None:
            updates_series[i] += 1
    my_done = [t for t in tasks if t.complete_status and t.complete_date and t.complete_user_id == user.id]
    for t in my_done:
        i = period.week_index(t.complete_date.date())
        if i is not None:
            completed_series[i] += 1
    series = [{'week_end': end.isoformat(), 'updates': updates_series[i], 'completed': completed_series[i]}
              for i, end in enumerate(period.week_ends())]

    mine_now = [u for u in mine if period.in_period(u.timestamp.date())]
    mine_prev = [u for u in mine if period.in_previous(u.timestamp.date())]
    team_now = [u for u in team_updates if period.in_period(u.timestamp.date())]
    status_mix = defaultdict(int)
    for u in mine_now:
        status_mix[_status_group(u.task_status)] += 1

    # due updates: the Home rule (helpers.update_due), what field staff are asked for
    awaiting, last_heard = _flagged(tasks, period.today, 'due')

    tasks_by_project = defaultdict(list)
    for t in tasks:
        tasks_by_project[t.project_id].append(t)
    projects_out = []
    for p in sorted(projects, key=lambda p: p.name):
        p_tasks = tasks_by_project[p.id]
        by_unit = defaultdict(list)
        for t in p_tasks:
            by_unit[t.unit_id].append(t)
        p_team = [u for u in team_now if u.project_id == p.id]
        p_mine = [u for u in p_team if u.user_id == user.id]
        projects_out.append({
            'id': p.id, 'name': p.name,
            'completion_pct': _pct(sum(1 for t in p_tasks if t.complete_status), len(p_tasks)),
            'units': len(by_unit),
            'units_finished': sum(1 for ts in by_unit.values() if ts and all(t.complete_status for t in ts)),
            'team_updates': len(p_team), 'my_updates': len(p_mine),
            'awaiting': sum(1 for t in awaiting if t.project_id == p.id),
        })

    recent = (_scope_updates(project_ids, None, user_id=user.id)[-10:] if project_ids else [])
    return {
        'scope': 'personal',
        'period': period.to_dict(),
        'user': {'id': user.id, 'first_name': user.first_name, 'last_name': user.last_name},
        'kpis': {
            'updates': len(mine_now), 'updates_prev': len(mine_prev),
            'completed': sum(1 for t in my_done if period.in_period(t.complete_date.date())),
            'completed_prev': sum(1 for t in my_done if period.in_previous(t.complete_date.date())),
            'active_days': len({u.timestamp.date() for u in mine_now}),
            'active_days_prev': len({u.timestamp.date() for u in mine_prev}),
            'awaiting': len(awaiting),
            'share_of_team_pct': _pct(len(mine_now), len(team_now)),
            'stuck_reported': status_mix.get('Stuck', 0),
        },
        'series': series,
        'status_mix': [{'status': k, 'count': status_mix.get(k, 0)} for k in ('Completed', 'Progress', 'Stuck')],
        'projects': projects_out,
        'awaiting': [_task_ref(t, last_heard, project_names) for t in awaiting[:10]],
        'due_since': get_previous_monday(period.today).isoformat(),
        'recent': [_update_row(u, project_names) for u in reversed(recent)],
    }
