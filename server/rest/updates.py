# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource
from datetime import datetime, time

from config import db
from models import StatusUpdate, UnitTask, MasterTask
from app_helpers import unit_task_recursively_update_children


class StatusUpdates(Resource):
    def get(self):
        
        updates_query = StatusUpdate.query

        task_filter = request.args.get("task_id")
        unit_filter = request.args.get("unit_id")
        #project_filter = request.args.get("project_id")
        
        if task_filter != None or unit_filter != None:
            updates_query = StatusUpdate.query.join(UnitTask, UnitTask.id == StatusUpdate.task_id)
            
            if task_filter != None:
                updates_query = updates_query.filter(UnitTask.id == task_filter)
            elif unit_filter != None:
                updates_query = updates_query.filter(UnitTask.unit_id == unit_filter)
        
        # elif project_filter != None:
        #    updates_query = updates_query.join(UnitTask, UnitTask.id == StatusUpdate.task_id).join(MasterTask, MasterTask.id == UnitTask.task_id).filter(MasterTask.project_id == project_filter)
        # else:
        #     return make_response({"error": "Task or Unit filter required."}, 422)
        
        response_fields = (
            'id',
            'message',
            'task_id',
            'task_status',
            'timestamp',
            'user_id',
            'user.name'
        )

        updates = [update.to_dict(only=response_fields) for update in updates_query.all()]
        return make_response(updates, 200)
    
    def post(self):
        data = request.get_json()
        mark_children_started = False

        # ensure task_id is valid
        task = UnitTask.query.filter(UnitTask.id == data['task_id']).first()
        if task == None:
            return make_response({"error": "UnitTask associated with this StatusUpdate not found."}, 422)
        
        try:
            new_record = StatusUpdate(
                task_id = data['task_id'],
                task_status = data['task_status'],
                user_id = session["user_id"]
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

        response_fields = (
            'id',
            'message',
            'task_id',
            'task_status',
            'timestamp',
            'user_id',
            'user.name'
        )

        return make_response(new_record.to_dict(only=response_fields), 201)
    

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
        
        response_fields = (
            'id',
            'message',
            'task_id',
            'task_status',
            'timestamp',
            'user_id',
            'user.name'
        )

        return make_response(model.to_dict(only=response_fields), 200)
           
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
