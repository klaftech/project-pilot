# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload

from config import db, app
from models import User, Project, MasterTask, Unit, UnitTask, StatusUpdate
from app_helpers import unit_task_recursively_update_children
#from datetime import datetime, time, date, timedelta
from datetime import datetime, timezone
from helpers import get_previous_monday

# used for project todo list of tasks pending status updates
@app.route('/api/unittasks/pending_update/project/<project_id>', methods=['GET'])
def get_project_pending_update(project_id):
    model = Project.query.filter_by(id=project_id).first()
    if not model:
        return make_response({"error": f"Project ID: {project_id} not found"}, 404)
    
    #today = date.today()
    today = datetime.now(timezone.utc).date()
    previous_monday = get_previous_monday()

    # Subquery to get the latest timestamp per task
    latest_timestamp_subquery = (
        select(StatusUpdate.task_id, func.max(StatusUpdate.timestamp).label("latest_timestamp"))
        .group_by(StatusUpdate.task_id)
        .subquery()
    )
    #print(latest_timestamp_subquery)
    
    base_query = (UnitTask.query
                  .join(Unit, Unit.id == UnitTask.unit_id)
                  .join(MasterTask, MasterTask.id == UnitTask.task_id)
                  .filter(
                    Unit.project_id == model.id,
                    UnitTask.started_status == True,
                    UnitTask.complete_status == False
                  )
                  #.filter(UnitTask.sched_start < (today + timedelta(days=7)))
                  .order_by(UnitTask.sched_start, MasterTask.name, Unit.name)
    )
    
    # inner join that only gets tasks with most recent update
    check_updates2 = (base_query
                    .join(latest_timestamp_subquery, 
                        (UnitTask.id == latest_timestamp_subquery.c.task_id))
                    )

    # LEFT OUTER JOIN to include tasks that have no status updates
    check_updates = (
        base_query
        .outerjoin(latest_timestamp_subquery, UnitTask.id == latest_timestamp_subquery.c.task_id)
        .filter(
            (latest_timestamp_subquery.c.latest_timestamp.is_(None)) |  # No status updates exist
            (latest_timestamp_subquery.c.latest_timestamp < previous_monday)  # Last update is > previous monday
        )
        .options(
            joinedload(UnitTask.master_task),  # Preload the related master_task
            joinedload(UnitTask.unit)  # Preload the related unit
        )
    )

    # print SQL query
    #print(check_updates)

    response_fields = (
        'id',
        #'latest_update',
        #'pin_start',
        #'pin_end',
        #'pin_honored',
        'sched_start', # needed for front-end taskObj
        'sched_end', # needed for front-end taskObj
        'started_status', # needed for front-end taskObj
        'started_date', # needed for front-end taskObj
        'complete_status', # needed for front-end taskObj
        'complete_date', # needed for front-end taskObj
        'progress',
        'status_code',
        'unit.id',
        'unit.name',
        'master_task.id',
        'master_task.name',
        'master_task.days_length',
        'master_task.pin_start',
        'master_task.pin_end',
        'master_task.group.id',
        'master_task.group.name'
    )

    dataset = [unit_task.to_dict(only=response_fields) for unit_task in check_updates.all()]

    return make_response(dataset, 200)


class UnitTasks(Resource):
    response_fields = (
        'id',
        #'latest_update',
        'pin_start',
        'pin_end',
        'pin_honored',
        'sched_start',
        'sched_end',
        'started_status',
        'started_date',
        'complete_status',
        'complete_date',
        'progress',
        'status_code',
        'unit.id',
        'unit.name',
        'master_task.id',
        'master_task.name',
        'master_task.days_length',
        'master_task.pin_start',
        'master_task.pin_end',
        'master_task.group.id',
        'master_task.group.name'
    )
    
    def get(self):
        # sort scheduled start, earliest first
        tasks_query = UnitTask.query.order_by(UnitTask.sched_start.asc())

        project_filter = request.args.get("project_id")
        if project_filter != None:        
            tasks_query = tasks_query.join(MasterTask, MasterTask.id == UnitTask.task_id).filter(MasterTask.project_id == project_filter)
        
        unit_filter = request.args.get("unit_id")
        if unit_filter != None:
            tasks_query = tasks_query.filter(UnitTask.unit_id == unit_filter)
        
        if not project_filter and not unit_filter:
            return make_response({"error": f"Result set must be filtered"}, 422)

        tasks = [task.to_dict(only=self.__class__.response_fields) for task in tasks_query.all()]
        return make_response(tasks, 200)
    
    # no reason to ever create new UnitTask, they are directly linked to MasterTasks
    # def post(self):
    #     data = request.get_json()
    #     try:
    #         new_record = MasterTask(
    #             unit_id = data['unit_id'],
    #             task_id = data['task_id']
    #         )

    #         if 'pin_start' in data and validate_date_input(data['pin_start'], "%Y-%m-%d"):
    #             new_record.pin_start = datetime.strptime(data['pin_start'], "%Y-%m-%d")
    #         if 'pin_end' in data and validate_date_input(data['pin_end'], "%Y-%m-%d"):
    #             new_record.pin_end = datetime.strptime(data['pin_end'], "%Y-%m-%d")

    #     except ValueError as e:
    #         abort(422, e.args[0])
        
    #     db.session.add(new_record)
    #     db.session.commit()

    #     return make_response(new_record.to_dict(), 201)
    


class UnitTaskByID(Resource):
    response_fields = (
        'id',
        #'latest_update',
        'pin_start',
        'pin_end',
        'pin_honored',
        'sched_start',
        'sched_end',
        'started_status',
        'started_date',
        'complete_status',
        'complete_date',
        'progress',
        'status_code',
        'unit.id',
        'unit.name',
        'master_task.id',
        'master_task.name',
        'master_task.days_length',
        'master_task.pin_start',
        'master_task.pin_end',
        'master_task.group.id',
        'master_task.group.name'
    )
    
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
        return make_response(model.to_dict(only=self.__class__.response_fields,rules=('latest_update',)), 200)
           
    def patch(self, id):
        # if the patch is marking task completed, all other data sent is ignored.
        mark_children_started = False

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
                mark_children_started = True
                print('UNIT TASK MARKED COMPLETE')
                user = User.query.filter_by(id=session["user_id"]).first()

                model.complete_status = True
                model.complete_comment = "marked complete on app"
                #model.complete_date = datetime.combine(datetime.now(), time.min)
                model.complete_date = datetime.now(timezone.utc)
                model.complete_user_id = user.id
                model.progress = 100

            else:
                for attr,value in data.items():
                    setattr(model, attr, value)

        except ValueError as e:
            return make_response({"error": e.args}, 422)
        
        db.session.commit()

        # if non_affected == True:
        #recursively process dependencies
        #unit_task_recursively_update_children(model)
        
        if mark_children_started == True:
            model.mark_children_started()

        return make_response(model.to_dict(only=self.__class__.response_fields), 202)