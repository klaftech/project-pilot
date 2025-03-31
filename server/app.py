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
from helpers import get_next_monday, get_previous_monday
from models import db, User, Project, Group, MasterTask, MasterTaskDependency, TaskUser, Unit, UnitTask, StatusUpdate


# from app_helpers import find_task_model_by_id
from rest.auth import UserSignup, UserLogin, UserLogout, UserAuthorize, UserProfile
from rest.groups import Groups, GroupByID
from rest.updates import StatusUpdates, StatusUpdateByID
from rest.master_tasks import MasterTasks, MasterTaskByID, Dependencies, DependencyByID, get_dependencies_ancestors, get_dependencies_descendents, get_dependencies_available
from rest.units import Units, UnitByID
from rest.unit_tasks import UnitTasks, UnitTaskByID, get_project_pending_update
from rest.projects import get_projects, get_project_details, get_projects_minimal, get_project_report


# the following adds route-specific authorization
@app.before_request
def authenticate_user():
    open_access_list = [None,"static","usersignup", "userlogin", "userlogout", "userauthorize"]
    
    # if the user is in session OR the request endpoint is open-access, the request will be processed as usual
    if request.endpoint not in open_access_list and not session.get("user_id"):
        raise Unauthorized    


# see rest.project for /api/project...
# see rest.unit_tasks for /api/unittasks/pending_update/project/<id>
# see rest.master_tasks for /api/mastertasks...

api.add_resource(UserSignup, '/api/signup')
api.add_resource(UserLogin, '/api/login')
api.add_resource(UserLogout, '/api/logout')
api.add_resource(UserAuthorize, '/api/authorize')
api.add_resource(UserProfile, '/api/profile')

api.add_resource(Groups, '/api/groups')
api.add_resource(GroupByID, '/api/groups/<int:id>')

api.add_resource(StatusUpdates, '/api/updates')
api.add_resource(StatusUpdateByID, '/api/updates/<int:id>')

api.add_resource(MasterTasks, '/api/mastertasks')
api.add_resource(MasterTaskByID, '/api/mastertasks/<int:id>')

api.add_resource(Dependencies, '/api/dependencies')
api.add_resource(DependencyByID, '/api/dependencies/<int:id>')

api.add_resource(Units, '/api/units')
api.add_resource(UnitByID, '/api/units/<int:id>')

api.add_resource(UnitTasks, '/api/unittasks')
api.add_resource(UnitTaskByID, '/api/unittasks/<int:id>')

if __name__ == '__main__':
    app.run(port=5555, debug=True)