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
    
    return make_response(model.to_dict(rules=(
        'id',
        'name',
        'project_type',
        'description',
        'start',
        'end',
        'schedule',
        'stats',
        'groups',
        'master_tasks',
        'units',
        'units.stats',
        'units.unit_tasks',
        'units.unit_tasks.latest_update',
        '-units.unit_tasks.dependencies',
        '-units.unit_tasks.updates',
        'units.unit_tasks.master_task',
        '-units.unit_tasks.master_task.group',
        '-units.unit_tasks.master_task.project'
        )), 200)


