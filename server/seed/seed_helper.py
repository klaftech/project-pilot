from models import db, User, Project, Group, MasterTask, MasterTaskDependency, TaskUser, Unit, UnitTask, StatusUpdate

def add_users(): 
    print('Creating Users...')
    user_1 = User(
        first_name="Admin",
        last_name="Admin", 
        email="admin@example.com"
    )
    user_2 = User(
        first_name='User',
        last_name='User',
        email="user@example.com"
    )
    user_1.password_hash = "123"
    user_2.password_hash = "123"
    print('Adding User objects to transaction...')
    db.session.add_all([user_1, user_2])
    print('Committing transaction...')
    db.session.commit()
    print('Complete.')


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


def drop_tables():
    
    print('Deleting existing StatusUpdates...')
    StatusUpdate.query.delete()

    print('Deleting existing UnitTasks...')
    UnitTask.query.delete()

    print('Deleting existing Units...')
    Unit.query.delete()
    
    print('Deleting existing TaskUsers...')
    TaskUser.query.delete()

    print('Deleting existing MasterTaskDependencies...')
    MasterTaskDependency.query.delete()

    print('Deleting existing MasterTasks...')
    MasterTask.query.delete()

    print('Deleting existing Groups...')
    Group.query.delete()

    print('Deleting existing Projects...')
    Project.query.delete()

    print('Deleting existing Users...')
    User.query.delete()