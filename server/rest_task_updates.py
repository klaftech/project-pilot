# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource

from config import db
from models import TaskUpdate


class TaskUpdates(Resource):
    def get(self):
        # user_id = session.get('user_id')
        # if not user_id:
        #     return make_response({"error": "User not logged in"}, 401)
        updates = [update.to_dict(rules=('-task',)) for update in TaskUpdate.query.all()]
        return make_response(updates, 200)
    
    def post(self):
        data = request.get_json()
        try:
            new_record = TaskUpdate(
                task_id = data['task_id'],
                task_status = data['task_status'],
                message = data['message'],
            )
        except ValueError as e:
            abort(422, e.args[0])
        
        db.session.add(new_record)
        db.session.commit()
        
        return make_response(new_record.to_dict(), 201)
    

class TaskUpdateByID(Resource):
    @classmethod
    def find_model_by_id(cls, id):
        model = TaskUpdate.query.filter_by(id=id).first()
        if model:
            return model
        else:
            return False

    def get(self, id):
        model = self.__class__.find_model_by_id(id)
        if not model:
            return make_response({"error": f"Model ID: {id} not found"}, 404)
        return make_response(model.to_dict(rules=('-task',)), 200)
           
    def patch(self, id):
        model = self.__class__.find_model_by_id(id)
        if not model:
            return make_response({"error": f"Model ID: {id} not found"}, 404)
        data = request.get_json()
        try:
            for attr,value in data.items():
                setattr(model, attr, value) 
        except ValueError as e:
            return make_response({"error": e.args}, 422)
        
        db.session.commit()

        return make_response(model.to_dict(), 202)
    
    def delete(self, id):
        model = self.__class__.find_model_by_id(id)
        if not model:
            return make_response({"error": f"Model ID: {id} not found"}, 404)
        
        db.session.delete(model)
        db.session.commit()
        return make_response("", 204)
