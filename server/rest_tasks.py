# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource

from config import db
from models import User, Task, TaskDependency
from app_helpers import validate_date_input, master_task_recursively_update_children
from datetime import datetime, time


class Tasks(Resource):
    def get(self):
        # user_id = session.get('user_id')
        # if not user_id:
        #     return make_response({"error": "User not logged in"}, 401)
        
        tasks_query = Task.query.order_by(Task.sched_start.desc())  

        project_filter = request.args.get("project_id")
        if project_filter != None:
            tasks_query = tasks_query.filter(Task.project_id == project_filter)
          
        tasks = [task.to_dict(rules=('-children_tasks','-parent_tasks')) for task in tasks_query.all()]
        return make_response(tasks, 200)
    
    def post(self):
        data = request.get_json()
        try:
            new_record = Task(
                name = data['name'],
                project_id = data['project_id'],
                group_id = data['group_id'],
                days_length = data['days_length']
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
    


class TaskByID(Resource):
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
            # # determine if changes are non-schedule affecting, to bypass recursively updating dependencies
            # non_affecting_fields = ['name','group_id']
            # non_affected = False
            # for field in non_affecting_fields:
            #     if field in data:
            #         non_affected = True

            if ('complete_status' in data) and (data['complete_status']) and not (model.complete_status):
                print('TASK MARKED COMPLETE')
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
        master_task_recursively_update_children(model)
        
        return make_response(model.to_dict(), 202)
    
    def delete(self, id):
        model = self.__class__.find_model_by_id(id)
        if not model:
            return make_response({"error": f"Model ID: {id} not found"}, 404)
        
        # if there are tasks dependent on this task (childrent_task), do not allow delete
        # no need to validate parent_tasks, because model cascade="delete-orphan" will delete all associated TaskDependency links that this task is dependent on
        # TODO: automatically reschedule children_tasks:
        # if they have other parent_tasks, get latest date of all parents
        # if they are orphaned, reschedule start=now, end=now+length. all pinned dates should be ok, because it is parentless task.
        # Front-end should have alert: "Deleting will cause tasks only dependent on this to be rescheduled immediately unless they have pinned start date."
        if model.children_tasks:
            dependents_list = ""
            for dependents in model.children_tasks:
                dependents_list = dependents_list + f'{dependents.owner_task.name} (ID: {dependents.owner_task.id}), '
            return make_response({"error": f"There are tasks dependent on this task: {dependents_list}"}, 424) # 424: failed dependency
        
        if model.unit_tasks:
            return make_response({"error": f"There are UnitTasks associated with this task."}, 424)

        db.session.delete(model)
        db.session.commit()
        return make_response("", 204)





class Dependencies(Resource):
    @classmethod
    def find_task_model_by_id(cls, id):
        #return RoutineItem.query.get_or_404(id)
        model = Task.query.filter_by(id=id).first()
        if model:
            return model
        else:
            return False
        
    # def get(self, task_id):
        # task_model = self.__class__.find_task_model_by_id(task_id)
        # if not task_model:
        #     return make_response({"error": f"Task Model ID: {task_id} not found"}, 404)
        # tasks = [task.to_dict() for task in TaskDependency.query.filter(TaskDependency.task_id == task_model.id).all()]
        # return make_response(tasks, 200)
    
    def post(self):
        data = request.get_json()
        try:
            task_id = data['task_id']
            parent_task_id = data['dependent_task_id']

            task_model = self.__class__.find_task_model_by_id(task_id)
            if not task_model:
                return make_response({"error": f"Task Model ID: {task_id} not found"}, 404)

            dependent_task_model = self.__class__.find_task_model_by_id(parent_task_id)
            if not dependent_task_model:
                return make_response({"error": f"Task Model ID: {parent_task_id} not found"}, 404)

            new_record = TaskDependency(
                task_id = task_model.id,
                dependent_task_id = dependent_task_model.id
            )
        except ValueError as e:
            abort(422, e.args[0])
        except Exception as e:
            abort(422, e.args[0])
        
        db.session.add(new_record)
        db.session.commit()
        
        # the task_model now has a new PARENT 
        # update its schedule based on new dependency
        task_model.calculate_schedule()
        db.session.commit()
        
        #recursively process dependencies
        master_task_recursively_update_children(task_model)
        
        return make_response(new_record.to_dict(), 201)
    

class DependencyByID(Resource):
    @classmethod
    def find_model_by_id(cls, id):
        #return RoutineItem.query.get_or_404(id)
        model = TaskDependency.query.filter_by(id=id).first()
        if model:
            return model
        else:
            return False

    def get(self, id):
        model = self.__class__.find_model_by_id(id)
        if not model:
            return make_response({"error": f"Model ID: {id} not found"}, 404)
        return make_response(model.to_dict(), 200)
    
    def delete(self, id):
        model = self.__class__.find_model_by_id(id)
        if not model:
            return make_response({"error": f"Model ID: {id} not found"}, 404)
        
        task_model = Task.query.filter_by(id=model.task_id).first()

        db.session.delete(model)
        db.session.commit()
        
        # upon deletion of a TaskDependency, recalculate owner_task schedule
        task_model.calculate_schedule()
        db.session.commit()

        # then, recursively process all its dependencies
        master_task_recursively_update_children(task_model)

        return make_response("", 204)

