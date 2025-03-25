# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource

from config import db
from models import User, Project, Unit

class UserSignup(Resource):
    def post(self):
        try:
            data = request.get_json()
            if data['password'] != data['confirmPassword']:
                raise Exception("Passwords do not match")
            
            user = User(
                name=data['name'],
                email=data['email'],
            )
            user.password_hash=data['password']
            db.session.add(user)
            db.session.commit()

            session['user_id'] = user.id
            return make_response(user.to_dict(only=('id','name','email','selectedProject','selectedUnit')), 201)
        
        except Exception as e:
            return make_response({"errors": e.args}, 422)

class UserLogin(Resource):
    def post(self):
        data = request.get_json()
        user = User.query.filter(User.email == data['email']).first()
        if user and user.authenticate(data['password']):
            session['user_id'] = user.id

            user_obj = user.to_dict(only=('id','name','email','selectedProject','selectedUnit'))

            user_obj.get('selectedProject')
            if not user_obj.get('selectedProject'):
                get_project = Project.query.first()
                if get_project:
                    user_obj['selectedProject'] = get_project.id
                else:
                    user_obj['selectedProject'] = 0
                
            if not user_obj.get('selectedUnit'):
                get_unit = Unit.query.filter(Unit.project_id==user_obj['selectedProject']).first()
                if get_unit:
                    user_obj['selectedUnit'] = get_unit.id
                else:
                    user_obj['selectedUnit'] = 0

            return make_response(user_obj, 200)
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
            user_obj = user.to_dict(only=('id','name','email','selectedProject','selectedUnit'))
            
            if not user_obj.get('selectedProject'):
                get_project = Project.query.first()
                if get_project:
                    user_obj['selectedProject'] = get_project.id
                else:
                    user_obj['selectedProject'] = 0
                
            if not user_obj.get('selectedUnit'):
                get_unit = Unit.query.filter(Unit.project_id==user_obj['selectedProject']).first()
                if get_unit:
                    user_obj['selectedUnit'] = get_unit.id
                else:
                    user_obj['selectedUnit'] = 0
            
            response = make_response(user_obj, 200)
            return response
        except:
            abort(401, "Unauthorized")
            #raise Unauthorized


class UserProfile(Resource):
    def patch(self):
        user = User.query.filter_by(id=session["user_id"]).first()
        data = request.get_json()
        try:
            if 'name' in data:
                setattr(user, 'name', data['name'])
            if 'selectedProject' in data:
                setattr(user, 'selectedProject', data['selectedProject'])
            if 'selectedUnit' in data:
                setattr(user, 'selectedUnit', data['selectedUnit'])
        except ValueError as e:
            return make_response({"error": e.args}, 422)
        
        db.session.commit()

        user_obj = user.to_dict(only=('id','name','email','selectedProject','selectedUnit'))
        return make_response(user_obj, 202)