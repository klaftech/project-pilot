# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource

from config import db
from models import User, Project, Task, Unit, UnitTask
from app_helpers import validate_date_input, unit_task_recursively_update_children
from datetime import datetime, time


class Units(Resource):
    def get(self):
        units_query = Unit.query

        project_filter = request.args.get("project_id")
        if project_filter != None:
            units_query = units_query.filter(Unit.project_id == project_filter)
        
        units = [unit.to_dict(rules=('-project','-tasks')) for unit in units_query.all()]
        return make_response(units, 200)
    
    def post(self):
        data = request.get_json()
        try:
            new_record = Unit(
                name = data['name'],
                project_id = data['project_id']
            )
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
        return make_response(model.to_dict(rules=('-tasks.unit','-project.stats','-project.schedule')), 200)
           
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
                tasks_list = tasks_list + f'(TaskUnit ID: {task.id}), '
            return make_response({"error": f"There are tasks linked to this group: {tasks_list}"}, 424) # 424: failed dependency
        
        db.session.delete(model)
        db.session.commit()
        return make_response("", 204)




class UnitTasks(Resource):
    def get(self):
        tasks_query = UnitTask.query.order_by(UnitTask.sched_start.desc())  

        project_filter = request.args.get("project_id")
        if project_filter != None:
            tasks_query = tasks_query.filter(UnitTask.project_id == project_filter)
          
        tasks = [task.to_dict(rules=('-complete_user','-unit','-master_task')) for task in tasks_query.all()]
        return make_response(tasks, 200)
    
    def post(self):
        data = request.get_json()
        try:
            new_record = Task(
                unit_id = data['unit_id'],
                task_id = data['task_id']
            )

            if 'pin_start' in data and validate_date_input(data['pin_start'], "%Y-%m-%d"):
                new_record.pin_start = datetime.strptime(data['pin_start'], "%Y-%m-%d")
            if 'pin_end' in data and validate_date_input(data['pin_end'], "%Y-%m-%d"):
                new_record.pin_end = datetime.strptime(data['pin_end'], "%Y-%m-%d")

        except ValueError as e:
            abort(422, e.args[0])
        
        db.session.add(new_record)
        db.session.commit()

        return make_response(new_record.to_dict(), 201)
    


class UnitTaskByID(Resource):
    @classmethod
    def find_model_by_id(cls, id):
        model = UnitTask.query.filter_by(id=id).first()
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
            # # determine if changes are non-schedule affecting, to bypass recursively updating dependencies
            # non_affecting_fields = ['name','group_id']
            # non_affected = False
            # for field in non_affecting_fields:
            #     if field in data:
            #         non_affected = True

            if ('complete_status' in data) and (data['complete_status']) and not (model.complete_status):
                print('UNIT TASK MARKED COMPLETE')
                user = User.query.filter_by(id=session["user_id"]).first()

                model.complete_status = data['complete_status']
                model.complete_comment = "marked complete on app"
                model.complete_date = datetime.combine(datetime.now(), time.min)
                model.complete_user_id = user.id

            for attr,value in data.items():
               setattr(model, attr, value)

        except ValueError as e:
            return make_response({"error": e.args}, 422)
        
        db.session.commit()

        # if non_affected == True:
        #recursively process dependencies
        unit_task_recursively_update_children(model)
        
        return make_response(model.to_dict(), 202)

