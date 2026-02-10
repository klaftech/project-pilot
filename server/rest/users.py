from flask import request, abort, make_response, session
from flask_restful import Resource

from config import db
from models import User


class Users(Resource):
    response_fields = (
        'id',
        'first_name',
        'last_name',
        'email',
        'is_admin',
    )
    
    def get(self):
        user = User.query.get(session.get('user_id'))
        if not user.is_admin:
            return make_response({"error": "Unauthorized"}, 401)
        
        users = [user.to_dict(only=self.__class__.response_fields) for user in User.query.order_by(User.first_name.asc()).all()]
        return make_response(users, 200)



class UserByID(Resource):
    response_fields = (
        'id',
        'first_name',
        'last_name',
        'email',
        'is_admin',
    )

    def patch(self, id):
        current_user = User.query.get(session.get('user_id'))
        if not current_user or not current_user.is_admin:
            return make_response({"error": "Unauthorized"}, 401)
        
        # Prevent admin from removing their own admin status
        if current_user.id == id and 'is_admin' in request.get_json() and not request.get_json()['is_admin']:
            return make_response({"error": "Cannot remove your own admin privileges"}, 403)
        
        user = User.query.get(id)
        if not user:
            return make_response({"error": f"User ID: {id} not found"}, 404)
        
        data = request.get_json()
        try:
            if 'is_admin' in data:
                user.is_admin = data['is_admin']
            
            db.session.commit()
            
            return make_response(user.to_dict(only=self.__class__.response_fields), 200)
        except Exception as e:
            db.session.rollback()
            return make_response({"error": f"Failed to update user: {str(e)}"}, 400)