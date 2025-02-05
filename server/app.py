#!/usr/bin/env python3

# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource

from werkzeug.exceptions import NotFound, Unauthorized

# local imports
from config import app, db, api
from models import db, User, Project, Group, Task, TaskDependency, TaskUser

# the following adds route-specific authorization
@app.before_request
def authenticate_user():
    open_access_list = ["usersignup", "userlogin", "userlogout", "userauthorize"]
    
    # if the user is in session OR the request endpoint is open-access, the request will be processed as usual
    if request.endpoint not in open_access_list and not session.get("user_id"):
        raise Unauthorized    



class UserSignup(Resource):
    def post(self):
        try:
            data = request.get_json()
            user = User(
                name=data['name'],
                email=data['email']
            )
            user.password_hash=data['password']
            db.session.add(user)
            db.session.commit()

            session['user_id'] = user.id
            return make_response(user.to_dict(only=('id','name','email')), 201)
        
        except Exception as e:
            return make_response({"errors": e.args}, 422)

class UserLogin(Resource):
    def post(self):
        data = request.get_json()
        user = User.query.filter(User.email == data['email']).first()
        if user and user.authenticate(data['password']):
            session['user_id'] = user.id
            return make_response(user.to_dict(only=('id','name','email')), 200)
        return make_response({"errors": ["Login Error"]}, 402)

class UserLogout(Resource):
    def delete(self):
        user_id = session.get('user_id')
        if user_id != None:
            session['user_id'] = None
            return make_response("", 204)
        return make_response({"errors":"User not logged in"}, 401)
    
class UserAuthorize(Resource):
    def get(self):
        try:
            user = User.query.filter_by(id=session["user_id"]).first()
            response = make_response(user.to_dict(), 200)
            return response
        except:
            abort(401, "Unauthorized") #should be 401
            #raise Unauthorized

class Tasks(Resource):
    def get(self):
        # user_id = session.get('user_id')
        # if not user_id:
        #     return make_response({"error": "User not logged in"}, 401)
        tasks = [task.to_dict(rules=('-children_tasks','-parent_tasks')) for task in Task.query.order_by(Task.sched_start.desc()).all()]
        return make_response(tasks, 200)
    
    def post(self):
        # user_id = session.get('user_id')
        # if not user_id:
        #     return make_response({"error": "User not logged in"}, 401)
        data = request.get_json()
        try:
            new_record = Task(
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

        # calculate schedule for new record
        new_record.calculate_schedule()
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
        #return make_response(model.to_dict(rules=('-children_tasks','-parent_tasks')), 200) # apparently children_tasks can cause recursion error
        return make_response(model.to_dict(), 200)
           
    def patch(self, id):
        model = self.__class__.find_model_by_id(id)
        if not model:
            return make_response({"error": f"Model ID: {id} not found"}, 404)
        data = request.get_json()
        try:
            for attr,value in data.items():
                setattr(model, attr, value)
            
            # if 'name' in data:
            #     model.name = data['name']
            # if 'project_id' in data:
            #     model.project_id = data['project_id']
            # if 'group_id' in data:
            #     model.group_id = data['group_id']
            # if 'plan_start' in data:
            #     model.plan_start = data['plan_start']
            # if 'plan_end' in data:
            #     model.plan_end = data['plan_end']
            # if 'pin_start' in data:
            #     model.pin_start = data['pin_start']
            # if 'pin_end' in data:
            #     model.pin_end = data['pin_end']
            # if 'days_length' in data:
            #     model.days_length = data['days_length']
                
        except ValueError as e:
            return make_response({"error": e.args}, 422)
        db.session.commit()

        #recursively process dependencies
        recursively_update_children(model)
        
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
        
        db.session.delete(model)
        db.session.commit()
        return make_response("", 204)



class TaskDependencies(Resource):
    @classmethod
    def find_task_model_by_id(cls, id):
        #return RoutineItem.query.get_or_404(id)
        model = Task.query.filter_by(id=id).first()
        if model:
            return model
        else:
            return False

    
    def get(self, task_id):
        # user_id = session.get('user_id')
        # if not user_id:
        #     return make_response({"error": "User not logged in"}, 401)
        # tasks = [task.to_dict(rules=('-user',)) for task in Task.query.filter(Task.user_id == user_id).all()]
        
        task_model = self.__class__.find_task_model_by_id(task_id)
        if not task_model:
            return make_response({"error": f"Task Model ID: {task_id} not found"}, 404)
        
        tasks = [task.to_dict() for task in TaskDependency.query.filter(TaskDependency.task_id == task_model.id).all()]
        return make_response(tasks, 200)
    
    def post(self, task_id):
        # user_id = session.get('user_id')
        # if not user_id:
        #     return make_response({"error": "User not logged in"}, 401)
        
        task_model = self.__class__.find_task_model_by_id(task_id)
        if not task_model:
            return make_response({"error": f"Task Model ID: {task_id} not found"}, 404)
        
        data = request.get_json()
        try:
            request_data_id = data['dependent_task_id']
            dependent_task_model = self.__class__.find_task_model_by_id(request_data_id)
            if not dependent_task_model:
                return make_response({"error": f"DependentTask Model ID: {request_data_id} not found"}, 404)

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
        recursively_update_children(task_model)
        
        return make_response(new_record.to_dict(), 201)
    

class TaskDependencyByID(Resource):
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
        recursively_update_children(task_model)

        return make_response("", 204)



def recursively_update_children(task_model):
    logger = []
    logger.append("RECURSIVELY UPDATING CHILDREN: ")

    #recursively process dependencies
    if task_model.children_tasks:
        from collections import deque
        children = deque([child.owner_task for child in task_model.children_tasks])
        while children:
            current_task = children.popleft()
            
            logger.append('##############################################')
            logger.append(f'Recursively Updating: {current_task.name}')
            
            recalc = current_task.calculate_schedule()
            for message in recalc:
                logger.append(f'=> {message}')
            db.session.commit()
            logger.append(f'Successfully Updated')

            if current_task.children_tasks:
                for child in current_task.children_tasks:
                    children.append(child.owner_task)
                    logger.append(f'    Child Added: {child.owner_task.name}')
    else:
        logger.append("No children found")
    print(*logger, sep='\n')


api.add_resource(UserSignup, '/api/signup')
api.add_resource(UserLogin, '/api/login')
api.add_resource(UserLogout, '/api/logout')
api.add_resource(UserAuthorize, '/api/authorize')

api.add_resource(TaskDependencies, '/api/tasks/<int:task_id>/dependencies')
api.add_resource(TaskDependencyByID, '/api/tasks/dependencies/<int:id>')

api.add_resource(Tasks, '/api/tasks')
api.add_resource(TaskByID, '/api/tasks/<int:id>')

if __name__ == '__main__':
    app.run(port=5555, debug=True)