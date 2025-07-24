# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource

# joinedload tells SQLAlchemy to fetch related data using a SQL JOIN, all in one query, instead of doing separate queries later (lazy loading)
from sqlalchemy.orm import joinedload
from datetime import datetime

from config import db, app
from models import Project, Unit, UnitTask


@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = [project.to_dict() for project in Project.query.all()]
    return make_response(projects, 200)

@app.route('/api/projects/<project_id>', methods=['GET'])
def get_project_details(project_id):
    response_fields = (
        '-units.stats',
        '-master_tasks',
        '-units.unit_tasks'
    )
    
    model = Project.query.filter_by(id=project_id).first()
    if not model:
        return make_response({"error": f"Project ID: {project_id} not found"}, 404)
    
    # if request includes include_stats flag, override response fields
    include_stats = request.args.get("include_stats")
    if include_stats == "true":        
        response_fields = (
            'units.stats',
            '-master_tasks',
            '-units.unit_tasks'
        )

    return make_response(model.to_dict(rules=(response_fields)), 200)

# used for navigation menu
@app.route('/api/projects/minimal', methods=['GET'])
def get_projects_minimal():
    projects = [project.to_dict(only=('id','name','project_type','description','start','end','units'),rules=('-units.stats','-units.unit_tasks')) for project in Project.query.all()]
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