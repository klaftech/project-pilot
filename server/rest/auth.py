# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource

from config import db
from models import ProjectUser, User, Project, Unit

def allowed_projects():
    user = User.query.filter_by(id=session.get('user_id')).first()
    if not user:
        return []
    
    if user.is_admin:
        #print("Admin user, returning all projects")
        projects = Project.query.order_by(Project.name.asc()).all()
    else:
        projects = Project.query.join(ProjectUser, ProjectUser.project_id == Project.id).filter(
            ProjectUser.user_id == session.get('user_id')
        ).order_by(Project.name.asc()).all()
    return projects

def get_user_object(user):
    user_obj = user.to_dict(only=('id','first_name','last_name','email','is_admin','selectedProject','selectedUnit'))

    user_obj.get('selectedProject')
    if not user_obj.get('selectedProject') or user_obj['selectedProject'] not in [p.id for p in allowed_projects()]:
        if allowed_projects():
            user_obj['selectedProject'] = allowed_projects()[0].id
        else:
            user_obj['selectedProject'] = None
        
    if not user_obj.get('selectedUnit') or user_obj['selectedUnit'] not in [u.id for u in Unit.query.filter(Unit.project_id==user_obj['selectedProject']).all()]:
        get_unit = Unit.query.filter(Unit.project_id==user_obj['selectedProject']).first()
        if get_unit:
            user_obj['selectedUnit'] = get_unit.id
        else:
            user_obj['selectedUnit'] = None
    return user_obj

class UserSignup(Resource):
    def post(self):
        try:
            data = request.get_json()
            if data['password'] != data['confirmPassword']:
                raise Exception("Passwords do not match")
            
            user = User(
                first_name=data['first_name'],
                last_name=data['last_name'],
                email=data['email'],
            )
            user.password_hash=data['password']
            db.session.add(user)
            db.session.commit()

            session['user_id'] = user.id

            return make_response(get_user_object(user), 201)
        
        except Exception as e:
            return make_response({"errors": e.args}, 422)

class UserLogin(Resource):
    def post(self):
        data = request.get_json()
        user = User.query.filter(User.email == data['email']).first()
        if user and user.authenticate(data['password']):
            session['user_id'] = user.id

            return make_response(get_user_object(user), 200)
        return make_response({"errors": ["Login Error"]}, 403)

class UserLogout(Resource):
    def delete(self):
        user_id = session.get('user_id')
        if user_id != None:
            session['user_id'] = None
            return make_response("", 204)
        return make_response({"errors":"User not logged in"}, 401)
    
class UserAuthorize(Resource):
    def get(self):
        try:
            user = User.query.filter_by(id=session["user_id"]).first()          
            response = make_response(get_user_object(user), 200)
            return response
        except:
            abort(401, "Unauthorized")
            #raise Unauthorized


class UserProfile(Resource):
    def patch(self):
        user = User.query.filter_by(id=session["user_id"]).first()
        data = request.get_json()
        try:
            if 'first_name' in data:
                setattr(user, 'first_name', data['first_name'])
            if 'last_name' in data:
                setattr(user, 'last_name', data['last_name'])
            if 'selectedProject' in data:
                setattr(user, 'selectedProject', data['selectedProject'])
            if 'selectedUnit' in data:
                setattr(user, 'selectedUnit', data['selectedUnit'])
        except ValueError as e:
            return make_response({"error": e.args}, 422)
        
        db.session.commit()

        return make_response(get_user_object(user), 202)