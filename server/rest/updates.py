# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource
from datetime import datetime, time

from config import db
from models import StatusUpdate, UnitTask
from app_helpers import unit_task_recursively_update_children


class StatusUpdates(Resource):
    def get(self):
        
        # TODO: see units for project/unit filtering. MUST ADD JOINS TO FILTER
        # updates_query = StatusUpdate.query

        # project_filter = request.args.get("project_id")
        # if project_filter != None:
        #     updates_query = updates_query.filter(StatusUpdate.project_id == project_filter)
        # else:
        #     return make_response({"error": "Project must be specified"}, 422)

        updates = [update.to_dict(rules=('-unit_task',)) for update in StatusUpdate.query.all()]
        return make_response(updates, 200)
    
    def post(self):
        data = request.get_json()
        
        # ensure task_id is valid
        task = UnitTask.query.filter(UnitTask.id == data['task_id']).first()
        if task == None:
            return make_response({"error": "UnitTask associated with this StatusUpdate not found."}, 422)
        
        try:
            new_record = StatusUpdate(
                task_id = data['task_id'],
                task_status = data['task_status']
            )
        except ValueError as e:
            abort(422, e.args[0])
        
        db.session.add(new_record)
        db.session.commit()

        # cast to int if is string
        status = new_record.task_status
        if isinstance(status, str):
            status = int(status)

        # update UnitTask based on StatusUpdate
        if status == 100 or status == 200:
            task.progress = 100
            task.complete_status = True
            task.complete_date = datetime.combine(datetime.now(), time.min)
            task.complete_user_id = session.get("user_id")
            task.complete_comment = "marked complete via status update"
            
            mark_children_started = True

            # reschedule dependent tasks to account for completed task
            unit_task_recursively_update_children(task)
        elif status == 25:
            task.progress = 25
        elif status == 50:
            task.progress = 50
        elif status == 75:
            task.progress = 75
        elif status == 300:
            #task scheduled
            pass
        elif status == 400:
            #task in-progress
            pass
        elif status == 500:
            #task stuck
            pass
        else:
            pass
        db.session.commit()

        if mark_children_started == True:
            task.mark_children_started()

        return make_response(new_record.to_dict(), 201)
    

class StatusUpdateByID(Resource):
    @classmethod
    def find_model_by_id(cls, id):
        model = StatusUpdate.query.filter_by(id=id).first()
        if model:
            return model
        else:
            return False

    def get(self, id):
        model = self.__class__.find_model_by_id(id)
        if not model:
            return make_response({"error": f"Model ID: {id} not found"}, 404)
        return make_response(model.to_dict(rules=('-unit_task',)), 200)
           
    # def patch(self, id):
    #     model = self.__class__.find_model_by_id(id)
    #     if not model:
    #         return make_response({"error": f"Model ID: {id} not found"}, 404)
    #     data = request.get_json()
    #     try:
    #         for attr,value in data.items():
    #             setattr(model, attr, value) 
    #     except ValueError as e:
    #         return make_response({"error": e.args}, 422)
        
    #     db.session.commit()

    #     return make_response(model.to_dict(), 202)
    
    # def delete(self, id):
    #     model = self.__class__.find_model_by_id(id)
    #     if not model:
    #         return make_response({"error": f"Model ID: {id} not found"}, 404)
        
    #     db.session.delete(model)
    #     db.session.commit()
    #     return make_response("", 204)
