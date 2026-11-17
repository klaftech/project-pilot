# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource

# joinedload tells SQLAlchemy to fetch related data using a SQL JOIN, all in one query, instead of doing separate queries later (lazy loading)
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta

from collections import defaultdict
from sqlalchemy import func

from config import db, app
from models import Project, ProjectUser, Unit, UnitTask, User, MasterTask, StatusUpdate, latest_updates_by_task, summarize_unit_tasks
from rest.auth import allowed_projects
from helpers import utc_now, utc_today, update_late, late_cutoff, late_window_start, completion_percent

@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = [project.to_dict() for project in allowed_projects()]
    return make_response(projects, 200)

@app.route('/api/projects/<project_id>', methods=['GET'])
def get_project_details(project_id):
    response_fields = (
        '-units.stats',
        '-master_tasks',
        '-units.unit_tasks'
    )
    
    if project_id == "null":
        return make_response({"error": "Project ID must be specified"}, 422)
    
    model = Project.query.filter_by(id=project_id).first()
    if not model:
        return make_response({"error": f"Project ID: {project_id} not found"}, 404)
    
    if model not in allowed_projects():
        return make_response({"error": "User not authorized for this project"}, 403)
    
    # if request includes include_stats flag, override response fields
    include_stats = request.args.get("include_stats")
    if include_stats == "true":        
        response_fields = (
            'units.stats',
            '-master_tasks',
            '-units.unit_tasks'
        )

    return make_response(model.to_dict(rules=(response_fields)), 200)

# used for the overview grid and the wall display: one request for every unit, its summary and its tasks.
# Timing and unit finishes come from analytics.build_analytics so the overview agrees with Analytics and Reports.
@app.route('/api/projects/<int:project_id>/overview', methods=['GET'])
def get_project_overview(project_id):
    from rest.unit_tasks import UnitTasks
    from analytics import build_analytics, STUCK
    model = Project.query.filter_by(id=project_id).first()
    if not model:
        return make_response({"error": f"Project ID: {project_id} not found"}, 404)
    if model not in allowed_projects():
        return make_response({"error": "User not authorized for this project"}, 403)

    tasks = (UnitTask.query
             .join(Unit, Unit.id == UnitTask.unit_id)
             .filter(Unit.project_id == model.id)
             .options(joinedload(UnitTask.master_task).joinedload(MasterTask.group), joinedload(UnitTask.unit))
             .order_by(UnitTask.sched_start, UnitTask.task_id)
             .all())
    latest = latest_updates_by_task([t.id for t in tasks])
    fields = tuple(f for f in UnitTasks.response_fields if f != 'latest_update')
    analytics = build_analytics([model], include_task_facts=True)
    facts = analytics['task_facts']
    unit_rows = {u['id']: u for u in analytics['units']}

    tasks_by_unit = defaultdict(list)
    for task in tasks:
        tasks_by_unit[task.unit_id].append(task)

    # columns in template order: each master task's typical planned start, relative to its unit's first task
    unit_start = {uid: min((t.sched_start for t in ts if t.sched_start), default=None) for uid, ts in tasks_by_unit.items()}
    offsets = defaultdict(list)
    for task in tasks:
        if task.sched_start and unit_start.get(task.unit_id):
            offsets[task.task_id].append((task.sched_start - unit_start[task.unit_id]).days)
    masters = MasterTask.query.filter_by(project_id=model.id).options(joinedload(MasterTask.group)).all()
    masters.sort(key=lambda m: (sorted(offsets[m.id])[len(offsets[m.id]) // 2] if offsets[m.id] else 10**6, m.id))
    position = {m.id: i for i, m in enumerate(masters)}
    columns = [{'id': m.id, 'name': m.name, 'group': m.group.name if m.group else None, 'days_length': m.days_length} for m in masters]

    # ?compact=1 (wall display): just what a cell needs, skipping the slow per-task serializer
    compact = request.args.get('compact') == '1'
    today = utc_today()
    now = utc_now()
    window = late_window_start(now)
    cutoff = late_cutoff(now)
    units = []
    for unit in Unit.query.filter_by(project_id=model.id).order_by(Unit.name).all():
        unit_tasks = sorted(tasks_by_unit.get(unit.id, []), key=lambda t: position.get(t.task_id, 10**6))
        rows = []
        for task in unit_tasks:
            heard = latest.get(task.id)
            heard_at = datetime.strptime(heard['timestamp'], StatusUpdate.datetime_format) if heard and heard['timestamp'] else None
            if compact:
                row = {'id': task.id, 'status_code': task.status_code, 'progress': task.progress,
                       'started_status': task.started_status, 'complete_status': task.complete_status}
            else:
                row = task.to_dict(only=fields)
                row['latest_update'] = heard
                row['complete_comment'] = task.complete_comment   # shown in the task panel's timeline
            # the Overview's update pills (executive rule, helpers.update_late): an update inside the late window
            # shows its status; a late one shows the warning
            row['update_late'] = update_late(task.status_code, task.started_status, task.started_date, heard_at, now)
            # as before: any task whose latest update falls after the cutoff shows that update's status
            row['recent_update'] = heard['status'] if heard_at and heard_at > cutoff else None
            row['column'] = position.get(task.task_id)
            row['timing'] = facts.get(task.id)
            rows.append(row)
        info = unit_rows.get(unit.id, {})
        open_now = [t for t in unit_tasks if t.started_status and not t.complete_status]
        upcoming = next((t for t in unit_tasks if not t.started_status and not t.complete_status), None)
        heard = [latest[t.id]['timestamp'] for t in unit_tasks if t.id in latest]
        units.append({
            'id': unit.id, 'name': unit.name, 'stats': summarize_unit_tasks(unit_tasks), 'tasks': rows,
            'stage': 'finished' if info.get('finished') else 'not_started' if info.get('not_started') else 'in_progress',
            'schedule': {
                'finish': info.get('finish'), 'finish_is_projection': info.get('finish_is_projection'),
                'planned_finish': info.get('planned_finish'),
                'over_plan_days': info.get('duration_over_plan_days'),
                'top_contributors': info.get('top_contributors', []),
            },
            'current': [t.master_task.name for t in open_now],
            'next': upcoming.master_task.name if upcoming else None,
            'stuck': sum(1 for t in unit_tasks if t.status_code == STUCK),
            'late_updates': sum(1 for r in rows if r['update_late']),
            'last_update': max(heard) if heard else None,
        })

    stuck_ids = {t.id for t in tasks if t.status_code == STUCK and not t.complete_status}
    week_ago, two_weeks_ago = today - timedelta(days=7), today - timedelta(days=14)
    done_days = [t.complete_date.date() for t in tasks if t.complete_status and t.complete_date]
    finishes = [u for u in analytics['units'] if u['finish']]
    last_finish = max(finishes, key=lambda u: u['finish']) if finishes else None
    recent = (db.session.query(StatusUpdate, User.first_name, User.last_name)
              .join(UnitTask, UnitTask.id == StatusUpdate.task_id)
              .join(Unit, Unit.id == UnitTask.unit_id)
              .outerjoin(User, User.id == StatusUpdate.user_id)
              .filter(Unit.project_id == model.id)
              .order_by(StatusUpdate.timestamp.desc(), StatusUpdate.id.desc())
              .options(joinedload(StatusUpdate.unit_task).joinedload(UnitTask.master_task), joinedload(StatusUpdate.unit_task).joinedload(UnitTask.unit))
              .limit(12).all())

    latest_update = recent[0][0].timestamp if recent else None
    return make_response({
        'id': model.id,
        'name': model.name,
        'master_task_count': len(masters),
        'latest_update': latest_update.strftime(StatusUpdate.datetime_format) if latest_update else None,
        'generated_at': utc_now().strftime(StatusUpdate.datetime_format),
        'columns': columns,
        'summary': {
            'units': len(units),
            'finished': sum(1 for u in units if u['stage'] == 'finished'),
            'in_progress': sum(1 for u in units if u['stage'] == 'in_progress'),
            'not_started': sum(1 for u in units if u['stage'] == 'not_started'),
            'tasks_total': len(tasks),
            'tasks_done': len(done_days),
            'completion_pct': completion_percent(len(done_days), len(tasks)),
            # closed once every task is complete (reports.open_projects uses the same rule)
            'is_open': not tasks or len(done_days) < len(tasks),
            'late_updates': sum(u['late_updates'] for u in units),
            'late_window_start': window.isoformat(),
            'completed_7d': sum(1 for d in done_days if d > week_ago),
            'completed_prev_7d': sum(1 for d in done_days if two_weeks_ago < d <= week_ago),
            'behind_plan': sum(1 for u in analytics['units'] if (u['duration_over_plan_days'] or 0) > 0),
            # Stuck = status_code 500, the same code every task view shows
            'open_stuck': sum(u['stuck'] for u in units),
            'completion_date': last_finish['finish'] if last_finish else None,
            'completion_is_projection': bool(last_finish and any(not u['finished'] for u in analytics['units'])),
        },
        'blockers': sorted((b for b in analytics['blockers'] if b['open'] and b['task_id'] in stuck_ids), key=lambda b: -b['days']),
        'recent': [{
            'id': su.id, 'task_id': su.task_id, 'unit_id': su.unit_task.unit_id, 'unit': su.unit_task.unit.name,
            'task': su.unit_task.master_task.name, 'status': su.task_status,
            'user': f"{first or ''} {last or ''}".strip() or None,
            'timestamp': su.timestamp.strftime(StatusUpdate.datetime_format),
        } for su, first, last in recent],
        'units': units,
    }, 200)

# used for navigation menu
@app.route('/api/projects/minimal', methods=['GET'])
def get_projects_minimal():
    user = User.query.filter_by(id=session.get('user_id')).first()
    if not user:
        return make_response({"error": "User not found"}, 404)
    
    projects = [project.to_dict(only=('id','name','project_type','description','start','end','units'),rules=('-units.stats','-units.unit_tasks')) for project in allowed_projects()]
    
    print(allowed_projects())
    print("ProjectUser Links Found: ",len(projects))
    return make_response(projects, 200)


# deprecated 07/23/2025 in favor of breaking up request
# # used for project overview report
# @app.route('/api/projects/<project_id>/report', methods=['GET'])
# def get_project_report(project_id):
#     # model = Project.query.filter_by(id=project_id).first()
#     model = Project.query.options(
#         joinedload(Project.units)
#         .joinedload(Unit.unit_tasks)
#         .joinedload(UnitTask.master_task)
#     ).filter_by(id=project_id).first()

#     if not model:
#         return make_response({"error": f"Project ID: {project_id} not found"}, 404)
    
#     # Sort units by name (case-insensitive)
#     #model.units.sort(key=lambda u: u.name.lower() if u.name else '')

#     # Sort units by completion percentage
#     model.units.sort(key=lambda u: u.stats['completion']['percent'], reverse=True)

#     # Sort unit_tasks within each unit
#     for unit in model.units:
#         unit.unit_tasks.sort(
#             key=lambda ut: (
#                 ut.sched_start or datetime.min,
#                 ut.master_task.name.lower() if ut.master_task and ut.master_task.name else ''
#             )
#         )

#     return make_response(model.to_dict(only=(
#         'id',
#         'name',
#         'project_type',
#         'description',
#         'master_tasks', #used soley to determine columns
#         'units.id',
#         'units.name',
#         'units.start',
#         'units.end',
#         'units.stats',
#         'units.unit_tasks.id',
#         'units.unit_tasks.sched_start',
#         'units.unit_tasks.sched_end',
#         'units.unit_tasks.progress',
#         'units.unit_tasks.status_code',
#         'units.unit_tasks.started_status',
#         'units.unit_tasks.started_date',
#         'units.unit_tasks.complete_status',
#         'units.unit_tasks.complete_date',
#         'units.unit_tasks.latest_update',
#         'units.unit_tasks.master_task.name',
#         'units.unit_tasks.master_task.days_length',
#     )), 200)