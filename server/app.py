#!/usr/bin/env python3

# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource

from werkzeug.exceptions import NotFound, Unauthorized
from datetime import datetime, timedelta, time, date
from sqlalchemy import func

# local imports
from config import app, db, api
from models import db, User, Project, Group, Task, TaskDependency, TaskUpdate, TaskUser



# the following adds route-specific authorization
@app.before_request
def authenticate_user():
    open_access_list = [None,"static","usersignup", "userlogin", "userlogout", "userauthorize"]
    
    # if the user is in session OR the request endpoint is open-access, the request will be processed as usual
    if request.endpoint not in open_access_list and not session.get("user_id"):
        raise Unauthorized    


def validate_date_input(date_string, date_format):
    try:
        datetime.strptime(date_string, date_format)
        return True
    except ValueError:
        return False

class UserSignup(Resource):
    def post(self):
        try:
            data = request.get_json()
            if data['password'] != data['confirmPassword']:
                raise Exception("Passwords do not match")
            
            user = User(
                name=data['name'],
                email=data['email'],
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

            user_obj = user.to_dict(only=('id','name','email'))
            user_obj['selectedProject'] = Project.query.first().id
            return make_response(user_obj, 200)
        return make_response({"errors": ["Login Error"]}, 403)

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
            user_obj = user.to_dict(only=('id','name','email'))
            user_obj['selectedProject'] = Project.query.first().id

            response = make_response(user_obj, 200)
            return response
        except:
            abort(401, "Unauthorized")
            #raise Unauthorized


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
        #new_record.calculate_schedule() moved to model.before_insert
        
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
            
            # if 'pin_start' in data:
            #     model.pin_start = datetime.strptime(data['pin_start'], "%Y-%m-%d")
            # if 'pin_end' in data:
            #     model.pin_end = datetime.strptime(data['pin_end'], "%Y-%m-%d")
                
        except ValueError as e:
            return make_response({"error": e.args}, 422)
        
        #model.calculate_schedule() moved to model.before_insert
        db.session.commit()

        # if non_affected == True:
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
        recursively_update_children(task_model)
        
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
        recursively_update_children(task_model)

        return make_response("", 204)



def find_task_model_by_id(id):
    #return RoutineItem.query.get_or_404(id)
    model = Task.query.filter_by(id=id).first()
    if model:
        return model
    else:
        return False


@app.route('/api/tasks/<task_id>/dependencies', methods=['GET'])
def get_dependencies_current(task_id):
    task_model = find_task_model_by_id(task_id)
    if not task_model:
        return make_response({"error": f"Task Model ID: {task_id} not found"}, 404)
    
    tasks = [task.to_dict(rules=('-children_tasks','-parent_tasks','-dependencies')) for task in TaskDependency.query.filter(TaskDependency.task_id == task_model.id).all()]
    return make_response(tasks, 200)


@app.route('/api/tasks/<task_id>/descendents', methods=['GET'])
def get_dependencies_descendents(task_id):
    task_model = find_task_model_by_id(task_id)
    if not task_model:
        return make_response({"error": f"Task Model ID: {task_id} not found"}, 404)
    
    tasks = [task.to_dict(rules=('-children_tasks','-parent_tasks','-dependencies')) for task in set(task_model.get_descendents())]
    return make_response(tasks, 200)


@app.route('/api/tasks/<task_id>/ancestors', methods=['GET'])
def get_dependencies_ancestors(task_id):
    task_model = find_task_model_by_id(task_id)
    if not task_model:
        return make_response({"error": f"Task Model ID: {task_id} not found"}, 404)
    
    tasks = [task.to_dict(rules=('-children_tasks','-parent_tasks','-dependencies')) for task in set(task_model.get_ancestors())]
    return make_response(tasks, 200)


@app.route('/api/tasks/<task_id>/available', methods=['GET'])
def get_dependencies_available(task_id):
    task_model = find_task_model_by_id(task_id)
    if not task_model:
        return make_response({"error": f"Task Model ID: {task_id} not found"}, 404)
    
    tasks = [task.to_dict(rules=('-children_tasks','-parent_tasks','-dependencies')) for task in task_model.get_available()]
    return make_response(tasks, 200)


@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = [project.to_dict() for project in Project.query.all()]
    return make_response(projects, 200)

@app.route('/api/projects/<project_id>', methods=['GET'])
def get_project_details(project_id):
    model = Project.query.filter_by(id=project_id).first()
    if not model:
        return make_response({"error": f"Project ID: {project_id} not found"}, 404)
    
    return make_response(model.to_dict(), 200)


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

api.add_resource(Groups, '/api/groups')
api.add_resource(GroupByID, '/api/groups/<int:id>')

api.add_resource(TaskUpdates, '/api/updates')
api.add_resource(TaskUpdateByID, '/api/updates/<int:id>')

api.add_resource(Tasks, '/api/tasks')
api.add_resource(TaskByID, '/api/tasks/<int:id>')

api.add_resource(Dependencies, '/api/dependencies')
api.add_resource(DependencyByID, '/api/dependencies/<int:id>')

if __name__ == '__main__':
    app.run(port=5555, debug=True)