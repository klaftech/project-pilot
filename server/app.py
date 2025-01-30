#!/usr/bin/env python3

# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource

# local imports
from config import app, db, api
from models import db, User, Project, Group, Task, TaskDependency, TaskUser


class Tasks(Resource):
    def get(self):
        # user_id = session.get('user_id')
        # if not user_id:
        #     return make_response({"error": "User not logged in"}, 401)
        # tasks = [task.to_dict(rules=('-user',)) for task in Task.query.filter(Task.user_id == user_id).all()]
        tasks = [task.to_dict(rules=('-user',)) for task in Task.query.all()]
        return make_response(tasks, 200)
    
    def post(self):
        # user_id = session.get('user_id')
        # if not user_id:
        #     return make_response({"error": "User not logged in"}, 401)
        data = request.get_json()
        try:
            new_record = Task(
                # user_id = user_id,
                name = data['name'],
                project_id = data['project_id'],
                group_id = data['group_id'],
                plan_start = data['plan_start'],
                plan_end = data['plan_end'],
                pin_start = data['pin_start'],
                pin_end = data['pin_end'],
                days_length = data['days_length']
            )
        except ValueError as e:
            abort(422, e.args[0])
        
        db.session.add(new_record)
        db.session.commit()
        return make_response(new_record.to_dict(), 201)
    


class TaskByID(Resource):
    ## TODO: add validation. either with @before_request or to each method
    
    @classmethod
    def find_model_by_id(cls, id):
        #return RoutineItem.query.get_or_404(id)
        model = Task.query.filter_by(id=id).first()
        if model:
            return model
        else:
            return False

    def get(self, id):
        model = self.__class__.find_model_by_id(id)
        if not model:
            return make_response({"error": f"Model ID: {id} not found"}, 404)
        return make_response(model.to_dict(), 200)
    
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

api.add_resource(Tasks, '/api/tasks')
api.add_resource(TaskByID, '/api/tasks/<int:id>')

if __name__ == '__main__':
    app.run(port=5555, debug=True)