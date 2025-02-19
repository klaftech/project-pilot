# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource

from config import db
from models import Group


class Groups(Resource):
    def get(self):
        # user_id = session.get('user_id')
        # if not user_id:
        #     return make_response({"error": "User not logged in"}, 401)
        groups_query = Group.query
        
        project_filter = request.args.get("project_id")
        if project_filter != None:
            groups_query = groups_query.filter(Group.project_id == project_filter)
        
        groups = [group.to_dict(rules=('-tasks','-project')) for group in groups_query.all()]
        return make_response(groups, 200)
    
    def post(self):
        data = request.get_json()
        try:
            new_record = Group(
                name = data['name'],
                project_id = data['project_id']
            )
        except ValueError as e:
            abort(422, e.args[0])
        
        db.session.add(new_record)
        db.session.commit()
        
        return make_response(new_record.to_dict(), 201)
    

class GroupByID(Resource):
    @classmethod
    def find_model_by_id(cls, id):
        model = Group.query.filter_by(id=id).first()
        if model:
            return model
        else:
            return False

    def get(self, id):
        model = self.__class__.find_model_by_id(id)
        if not model:
            return make_response({"error": f"Model ID: {id} not found"}, 404)
        return make_response(model.to_dict(rules=('-tasks','-project')), 200)
           
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
        
        # if there are tasks linked to this group, do not allow delete
        if model.tasks:
            tasks_list = ""
            for task in model.tasks:
                tasks_list = tasks_list + f'{task.name} (ID: {task.id}), '
            return make_response({"error": f"There are tasks linked to this group: {tasks_list}"}, 424) # 424: failed dependency
        
        db.session.delete(model)
        db.session.commit()
        return make_response("", 204)

