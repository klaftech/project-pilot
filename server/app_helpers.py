from datetime import datetime, timedelta, time, date
from config import db
from models import Task


def validate_date_input(date_string, date_format):
    try:
        datetime.strptime(date_string, date_format)
        return True
    except ValueError:
        return False


def find_task_model_by_id(id):
    #return RoutineItem.query.get_or_404(id)
    model = Task.query.filter_by(id=id).first()
    if model:
        return model
    else:
        return False




def master_task_recursively_update_children(task_model):
    recursively_update_children(task_model)

def unit_task_recursively_update_children(task_model):
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

