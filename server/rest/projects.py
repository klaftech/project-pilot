# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource

from config import db, app
from models import Project


@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = [project.to_dict() for project in Project.query.all()]
    return make_response(projects, 200)

@app.route('/api/projects/<project_id>', methods=['GET'])
def get_project_details(project_id):
    model = Project.query.filter_by(id=project_id).first()
    if not model:
        return make_response({"error": f"Project ID: {project_id} not found"}, 404)
    
    return make_response(model.to_dict(rules=('-master_tasks','-units.unit_tasks')), 200)

# used for navigation menu
@app.route('/api/projects/minimal', methods=['GET'])
def get_projects_minimal():
    projects = [project.to_dict(only=('id','name','project_type','description','start','end','units'),rules=('-units.stats','-units.unit_tasks')) for project in Project.query.all()]
    return make_response(projects, 200)

# used for project overview report
@app.route('/api/projects/<project_id>/report', methods=['GET'])
def get_project_report(project_id):
    model = Project.query.filter_by(id=project_id).first()
    if not model:
        return make_response({"error": f"Project ID: {project_id} not found"}, 404)
    
    return make_response(model.to_dict(only=(
        'id',
        'name',
        'project_type',
        'description',
        #'start',
        #'end',
        #'schedule',
        #'stats',
        #'groups',
        'master_tasks', #used soley to determine columns
        'units.id',
        'units.name',
        'units.start',
        'units.end',
        'units.stats',
        'units.unit_tasks.id',
        'units.unit_tasks.sched_start',
        'units.unit_tasks.sched_end',
        'units.unit_tasks.progress',
        'units.unit_tasks.started_status',
        'units.unit_tasks.started_date',
        'units.unit_tasks.complete_status',
        'units.unit_tasks.complete_date',
        'units.unit_tasks.latest_update',
        'units.unit_tasks.master_task.name',
        'units.unit_tasks.master_task.days_length',
        )), 200)