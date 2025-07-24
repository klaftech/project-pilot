# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource

from config import db, app
from models import Project, Unit
from app_helpers import validate_date_input
from datetime import datetime


class Units(Resource):
    def get(self):
        units_query = Unit.query

        project_filter = request.args.get("project_id")
        if project_filter != None:
            units_query = units_query.filter(Unit.project_id == project_filter)
        else:
            return make_response({"error": "Project must be specified"}, 422)
        
        units = [unit.to_dict(rules=('-project','-unit_tasks')) for unit in units_query.all()]
        return make_response(units, 200)
    
    def post(self):
        data = request.get_json()
        try:
            new_record = Unit(
                name = data['name'],
                project_id = data['project_id']
            )

            if 'start' in data and validate_date_input(data['start'], "%Y-%m-%d"):
                new_record.start = datetime.strptime(data['start'], "%Y-%m-%d")
            if 'end' in data and validate_date_input(data['end'], "%Y-%m-%d"):
                new_record.end = datetime.strptime(data['end'], "%Y-%m-%d")

        except ValueError as e:
            abort(422, e.args[0])
        
        db.session.add(new_record)
        db.session.commit()

        try:
            # build tasklist from master_task
            new_record.build_tasklist()
        except Exception as e:
            abort(422, e.args[0])

        return make_response(new_record.to_dict(), 201)
    


# used for overview stats
@app.route('/api/units/<unit_id>/stats', methods=['GET'])
def get_unit_stats(unit_id):
    model = Unit.query.filter_by(id=unit_id).first()
    if not model:
        return make_response({"error": f"Model ID: {id} not found"}, 404)
    return make_response(model.to_dict(only=('id','stats')), 200)


class UnitByID(Resource):
    @classmethod
    def find_model_by_id(cls, id):
        model = Unit.query.filter_by(id=id).first()
        if model:
            return model
        else:
            return False

    def get(self, id):
        model = self.__class__.find_model_by_id(id)
        if not model:
            return make_response({"error": f"Model ID: {id} not found"}, 404)
        return make_response(model.to_dict(rules=('-unit_tasks.unit','-project.stats','-project.schedule')), 200)
           
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
    
    # currently (02/19/2025) this will always result in error, because tasks are auto-generated at Unit creation
    # def delete(self, id):
    #     model = self.__class__.find_model_by_id(id)
    #     if not model:
    #         return make_response({"error": f"Model ID: {id} not found"}, 404)
        
    #     # if there are tasks linked to this group, do not allow delete
    #     if model.tasks:
    #         tasks_list = ""
    #         for task in model.tasks:
    #             tasks_list = tasks_list + f'(TaskUnit ID: {task.id}), '
    #         return make_response({"error": f"There are tasks linked to this group: {tasks_list}"}, 424) # 424: failed dependency
        
    #     db.session.delete(model)
    #     db.session.commit()
    #     return make_response("", 204)