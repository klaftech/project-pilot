# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload
from sqlalchemy.exc import IntegrityError

from config import db, app
from models import User, Project, ProjectUser

class ProjectUsers(Resource):
    response_fields = (
        'id',
        'user_id',
        'project_id',
        'deleted',
        #'user.id',
        #'user.first_name',
        #'user.last_name',
        #'user.email',
        #'user.is_admin',
        #'project.id',
        #'project.name'
    )
    
    def get(self):
        user = User.query.get(session.get('user_id'))
        if not user.is_admin:
            return make_response({"error": "Unauthorized"}, 401)
        
        #permissions = [permission.to_dict(only=self.__class__.response_fields) for permission in ProjectUser.query.filter(ProjectUser.deleted == False).order_by(ProjectUser.id.asc()).all()]
        permissions = [permission.to_dict(only=self.__class__.response_fields) for permission in ProjectUser.query.all()]
        return make_response(permissions, 200)

    def post(self):
        user = User.query.get(session.get('user_id'))
        if not user.is_admin:
            return make_response({"error": "Unauthorized"}, 401)
            
        data = request.get_json()
        try:
            new_project_user = ProjectUser(
                user_id = data['user_id'],
                project_id = data['project_id']
            )
            db.session.add(new_project_user)
            db.session.commit()
            # Refresh to load relationships
            db.session.refresh(new_project_user)
            return make_response(new_project_user.to_dict(only=self.__class__.response_fields), 201)
        except IntegrityError as e:
            db.session.rollback()
            error_msg = str(e.orig)
            #print("IntegrityError:", error_msg)

            # Check if it's a unique constraint violation
            if 'UNIQUE constraint failed' in error_msg or 'duplicate key' in error_msg:
                return make_response({"error": "User is already assigned to this project"}, 409)
            # Check if it's a foreign key violation
            elif 'FOREIGN KEY constraint failed' in error_msg or 'foreign key' in error_msg.lower():
                return make_response({"error": "Invalid user_id or project_id"}, 400)
            else:
                return make_response({"error": f"Database integrity error: {error_msg}"}, 400)
        except Exception as e:
            db.session.rollback()
            return make_response({"error": f"Failed to save record: {str(e)}"}, 400)


class ProjectUserByID(Resource):

    response_fields = (
        'id',
        'user_id',
        'project_id',
        'deleted',
        #'user.id',
        #'user.first_name',
        #'user.last_name',
        #'user.email',
        #'project.id',
        #'project.name'
    )
    
    @classmethod
    def find_model_by_id(cls, id):
        model = ProjectUser.query.filter_by(id=id, deleted=False).first()
        if model:
            return model
        else:
            return False

    def get(self, id):
        user = User.query.get(session.get('user_id'))
        if not user.is_admin:
            return make_response({"error": "Unauthorized"}, 401)
            
        model = self.__class__.find_model_by_id(id)
        if not model:
            return make_response({"error": f"Model ID: {id} not found"}, 404)
        return make_response(model.to_dict(only=self.__class__.response_fields), 200)

    def patch(self, id):
        user = User.query.get(session.get('user_id'))
        if not user.is_admin:
            return make_response({"error": "Unauthorized"}, 401)
            
        model = ProjectUser.query.filter_by(id=id).first()
        if not model:
            return make_response({"error": f"Model ID: {id} not found"}, 404)
        
        data = request.get_json()
        try:
            if 'deleted' in data:
                model.deleted = data['deleted']
            
            db.session.commit()
            return make_response(model.to_dict(only=self.__class__.response_fields), 200)
        except Exception as e:
            db.session.rollback()
            return make_response({"error": f"Failed to update record: {str(e)}"}, 400)
           
    def delete(self, id):
        user = User.query.get(session.get('user_id'))
        if not user.is_admin:
            return make_response({"error": "Unauthorized"}, 401)
        
        model = self.__class__.find_model_by_id(id)
        if not model:
            return make_response({"error": f"Model ID: {id} not found"}, 404)
        
        model.deleted = True
        model.user.handle_project_change()
        db.session.commit()
        return make_response({}, 204)