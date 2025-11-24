# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource
from datetime import datetime, timezone, time

from config import db
from models import StatusUpdate, UnitTask
from app_helpers import unit_task_recursively_update_children

class StatusUpdates(Resource):
    response_fields = (
        'id',
        'message',
        'task_id',
        'task_status',
        'timestamp',
        'user_id',
        'user.first_name',
        'user.last_name'
    )

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

        updates = [update.to_dict(only=self.__class__.response_fields) for update in updates_query.all()]
        return make_response(updates, 200)
    
    def post(self):
        data = request.get_json()
        
        # ensure task_id is valid
        task = UnitTask.query.filter(UnitTask.id == data['task_id']).first()
        if task == None:
            return make_response({"error": "UnitTask associated with this StatusUpdate not found."}, 422)
        
        # ensure status is valid and progressing forward
        if task.latest_update != None:
            is_valid, message = validate_status_change(task.latest_update['status'], data['task_status'])
            if not is_valid:
                #raise ValueError(message)
                return make_response({"errors": message}, 422)
                #abort(422, message)
            
        try:
            # cast to int if is string
            status = data['task_status']
            if isinstance(status, str):
                status = int(status)
            
            new_record = StatusUpdate(
                task_id = data['task_id'],
                task_status = status,
                user_id = session["user_id"]
            )
        except ValueError as e:
            return make_response({"errors": e.args[0]}, 422)
            #abort(422, e.args[0])
        
        if 'record_date' in data:
            new_record.timestamp = data['record_date']

        if 'message' in data:
            new_record.message = data['message']

        db.session.add(new_record)
        db.session.commit()

        update_unit_task(task, new_record)

        return make_response(new_record.to_dict(only=self.__class__.response_fields), 201)
    
class StatusUpdateByID(Resource):
    response_fields = (
        'id',
        'message',
        'task_id',
        'task_status',
        'timestamp',
        'user_id',
        'user.first_name',
        'user.last_name'
    )
    
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
        return make_response(model.to_dict(only=self.__class__.response_fields), 200)
           
    def patch(self, id):
        model = self.__class__.find_model_by_id(id)
        if not model:
            return make_response({"error": f"Model ID: {id} not found"}, 404)
        
        data = request.get_json()
        
        # if status is completed, can't modify status
        if ('task_status' in data) and (model.task_status == "200"):
            return make_response({"error": "Completed Status can't be changed."}, 422)

        try:
            # only allow updating specific fields
            data_changed = False

            # TODO: validate that passing valid status number
            if 'task_status' in data:

                # cast to int if is string
                status = data['task_status']
                if isinstance(status, str):
                    status = int(status)
                    
                model.task_status = status
                data_changed = True
            if 'message' in data:
                model.message = data['message']
                data_changed = True
            if 'record_date' in data:
                model.timestamp = data['record_date']
                data_changed = True

            if data_changed == False:
                raise Exception('No valid data fields being modified')
        except ValueError as e:
            return make_response({"error": e.args}, 422)
        
        db.session.commit()

        update_unit_task(model.unit_task, model)
        
        return make_response(model.to_dict(only=self.__class__.response_fields), 202)
    
    # def delete(self, id):
    #     model = self.__class__.find_model_by_id(id)
    #     if not model:
    #         return make_response({"error": f"Model ID: {id} not found"}, 404)
        
    #     db.session.delete(model)
    #     db.session.commit()
    #     return make_response("", 204)



def update_unit_task(task, status_update_record):
    # default is False
    mark_children_started = False

    # new status code
    status = status_update_record.task_status

    ### ensure task is started, except if status is stuck ###
    if status != 500 and (task.started_status != True or not isinstance(task.started_date, datetime)):
        if task.started_status != True:
            task.started_status = True
        if not isinstance(task.started_date, datetime):
            #task.started_date = datetime.combine(datetime.now(), time.min) # use today as start
            #task.started_date = datetime.now(timezone.utc) # UTC
            task.started_date = status_update_record.timestamp # use StatusUpdate timestamp
        db.session.commit()


    ### update task progress ###
    # update UnitTask based on StatusUpdate
    if status == 100 or status == 200:
        task.progress = 100
        task.complete_status = True
        #task.complete_date = datetime.combine(datetime.now(), time.min)
        #task.complete_date = datetime.now(timezone.utc) # UTC
        task.complete_date = status_update_record.timestamp # use StatusUpdate timestamp
        task.complete_user_id = session.get("user_id")
        task.complete_comment = "marked complete via status update"
        
        mark_children_started = True

        # reschedule dependent tasks to account for completed task
        #unit_task_recursively_update_children(task)
    elif status == 1:
        task.progress = 1
        
        # override started_date (from previous task) with date from started status update
        if task.master_task.override_start_date:
            task.started_date = status_update_record.timestamp
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
    
    # update task status
    task.set_status_code()

    db.session.commit()

    if mark_children_started == True:
        task.mark_children_started()


def validate_status_change(old: int, new: int):
    """
    Check if the status change follows the allowed progression rules.
    
    :param old: The previous status.
    :param new: The new status.
    :return: True if the status change is valid, otherwise False.
    
    1   % started
    25  %
    50  %
    75  %
    100 %
    200 completed
    300 scheduled
    310 pending
    311 in progress
    500 Stuck
    """
    valid_statuses = [1, 25, 50, 75, 100, 200, 300, 310, 311, 400, 500]
    
    # allow continued status update of stuck
    if old == 500 and new == 500:
        return True, "Success"
    
    if old == new:
        return False, "No change in status."

    # ensure new status is valid
    if old not in valid_statuses or new not in valid_statuses:
        return False, "Invalid status value."
    
    # Once status is 200, don't allow change
    if old == 200:
        return False, "Completed task cannot be changed."
    
    # 1-100 can only be changed to 1-100 or 200 or 500
    if old in [1, 25, 50, 75, 100] and new not in [1, 25, 50, 75, 100, 200, 500]:
        return False, "Task in progress can only be changed to completed or stuck."
    
    # 300, 310 can only be changed to 1-100 or 100, 311 or 500
    if old in [300, 310] and new not in [1, 25, 50, 75, 100, 200, 311, 500]:
        return False, "Scheduled cannot be changed to Pending and vice versa."
    
    # if changing completion percentage, can only be greater value
    if old in [1, 25, 50, 75, 100] and new in [1, 25, 50, 75, 100] and valid_statuses.index(old) > valid_statuses.index(new):
        return False, "Completion can only move forward"

    # using array index, ensure new value is larger than old value
    #return valid_statuses.index(old) < valid_statuses.index(new)
    return True, "Success"
