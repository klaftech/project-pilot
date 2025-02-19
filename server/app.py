#!/usr/bin/env python3

# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource

from werkzeug.exceptions import NotFound, Unauthorized
from datetime import datetime, timedelta, time, date
from sqlalchemy import func

# local imports
# sets absolute path for deployment
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import app, db, api
from models import db, User, Project, Group, Task, TaskDependency, TaskUpdate, TaskUser, Unit, UnitTask


from app_helpers import find_task_model_by_id
from rest_login import UserSignup, UserLogin, UserLogout, UserAuthorize
from rest_groups import Groups, GroupByID
from rest_task_updates import TaskUpdates, TaskUpdateByID
from rest_tasks import Tasks, TaskByID, Dependencies, DependencyByID
from rest_units import Units, UnitByID, UnitTasks, UnitTaskByID


# the following adds route-specific authorization
@app.before_request
def authenticate_user():
    open_access_list = [None,"static","usersignup", "userlogin", "userlogout", "userauthorize"]
    
    # if the user is in session OR the request endpoint is open-access, the request will be processed as usual
    if request.endpoint not in open_access_list and not session.get("user_id"):
        raise Unauthorized    


@app.route('/api/tasks/<task_id>/dependencies', methods=['GET'])
def get_dependencies_current(task_id):
    task_model = find_task_model_by_id(task_id)
    if not task_model:
        return make_response({"error": f"Task Model ID: {task_id} not found"}, 404)
    
    tasks = [task.to_dict(rules=('-children_tasks','-parent_tasks','-dependencies')) for task in TaskDependency.query.filter(TaskDependency.task_id == task_model.id).all()]
    return make_response(tasks, 200)


@app.route('/api/tasks/<task_id>/descendents', methods=['GET'])
def get_dependencies_descendents(task_id):
    task_model = find_task_model_by_id(task_id)
    if not task_model:
        return make_response({"error": f"Task Model ID: {task_id} not found"}, 404)
    
    tasks = [task.to_dict(rules=('-children_tasks','-parent_tasks','-dependencies')) for task in set(task_model.get_descendents())]
    return make_response(tasks, 200)


@app.route('/api/tasks/<task_id>/ancestors', methods=['GET'])
def get_dependencies_ancestors(task_id):
    task_model = find_task_model_by_id(task_id)
    if not task_model:
        return make_response({"error": f"Task Model ID: {task_id} not found"}, 404)
    
    tasks = [task.to_dict(rules=('-children_tasks','-parent_tasks','-dependencies')) for task in set(task_model.get_ancestors())]
    return make_response(tasks, 200)


@app.route('/api/tasks/<task_id>/available', methods=['GET'])
def get_dependencies_available(task_id):
    task_model = find_task_model_by_id(task_id)
    if not task_model:
        return make_response({"error": f"Task Model ID: {task_id} not found"}, 404)
    
    tasks = [task.to_dict(rules=('-children_tasks','-parent_tasks','-dependencies')) for task in task_model.get_available()]
    return make_response(tasks, 200)


@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = [project.to_dict() for project in Project.query.all()]
    return make_response(projects, 200)

@app.route('/api/projects/<project_id>', methods=['GET'])
def get_project_details(project_id):
    model = Project.query.filter_by(id=project_id).first()
    if not model:
        return make_response({"error": f"Project ID: {project_id} not found"}, 404)
    
    return make_response(model.to_dict(), 200)


api.add_resource(UserSignup, '/api/signup')
api.add_resource(UserLogin, '/api/login')
api.add_resource(UserLogout, '/api/logout')
api.add_resource(UserAuthorize, '/api/authorize')

api.add_resource(Groups, '/api/groups')
api.add_resource(GroupByID, '/api/groups/<int:id>')

api.add_resource(TaskUpdates, '/api/updates')
api.add_resource(TaskUpdateByID, '/api/updates/<int:id>')

api.add_resource(Tasks, '/api/tasks')
api.add_resource(TaskByID, '/api/tasks/<int:id>')

api.add_resource(Dependencies, '/api/dependencies')
api.add_resource(DependencyByID, '/api/dependencies/<int:id>')

api.add_resource(Units, '/api/units')
api.add_resource(UnitByID, '/api/units/<int:id>')

api.add_resource(UnitTasks, '/api/unittasks')
api.add_resource(UnitTaskByID, '/api/unittasks/<int:id>')

if __name__ == '__main__':
    app.run(port=5555, debug=True)