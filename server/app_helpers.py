from datetime import datetime, timedelta, time, date
from config import db
from models import MasterTask
from helpers import validate_date_input

def find_task_model_by_id(id):
    #return RoutineItem.query.get_or_404(id)
    model = MasterTask.query.filter_by(id=id).first()
    if model:
        return model
    else:
        return False


# UnitTask
def recursively_update_dependencies(task_model):
    logger = []
    logger.append("RECURSIVELY UPDATING UNIT TASK DEPENDENCIES: ")

    #recursively process dependencies
    if task_model.dependencies:
        from collections import deque
        dependency_list = deque([dependency for dependency in task_model.dependencies])
        while dependency_list:
            current_task = dependency_list.popleft()
            
            logger.append('##############################################')
            logger.append(f'Recursively Updating: {current_task.master_task.name}')
            
            recalc = current_task.calculate_schedule()
            for message in recalc:
                logger.append(f'=> {message}')
            db.session.commit()
            logger.append(f'Successfully Updated')

            if current_task.dependencies:
                for dependent in current_task.dependencies:
                    dependency_list.append(dependent)
                    logger.append(f'    Child Added: {dependent.master_task.name}')
    else:
        logger.append("No dependencies found")
    print(*logger, sep='\n')


def master_task_recursively_update_children(task_model):
    recursively_update_children(task_model)

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

