from app import app
from models import db, User, Project, Group, Task, TaskDependency, TaskUser
from datetime import datetime

with app.app_context():

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



    print('Deleting existing TaskUsers...')
    TaskUser.query.delete()

    print('Deleting existing TaskDependencies...')
    TaskDependency.query.delete()

    print('Deleting existing Tasks...')
    Task.query.delete()

    print('Deleting existing Groups...')
    Group.query.delete()

    print('Deleting existing Projects...')
    Project.query.delete()

    print('Deleting existing Users...')
    User.query.delete()



    print('Creating Users...')
    user_1 = User(
        name="Admin", 
        email="admin@example.com"
    )
    user_2 = User(
        name='User',
        email="user@example.com"
    )
    user_1.password_hash = "123"
    user_2.password_hash = "123"
    print('Adding User objects to transaction...')
    db.session.add_all([user_1, user_2])
    print('Committing transaction...')
    db.session.commit()
    print('Complete.')


    print('Creating Projects...')
    project_1 = Project(
        name='123 Main Street Building',
        project_type='house',
        description="Single-Family Home"
    )
    project_2 = Project(
        name='Factory Warehouse',
        project_type='commercial',
        description="Steel work"
    )
    print('Adding Project objects to transaction...')
    db.session.add_all([project_1, project_2])
    print('Committing transaction...')
    db.session.commit()
    print('Complete.')


    print('Creating Groups...')
    group_1 = Group(
        name='Site Prep',
        project_id=project_1.id
    )
    group_2 = Group(
        name='Foundation',
        project_id=project_1.id
    )
    print('Adding Group objects to transaction...')
    db.session.add_all([group_1, group_2])
    print('Committing transaction...')
    db.session.commit()
    print('Complete.')


    print('Creating Tasks...')
    task_1 = Task(
        name='Sign Contract',
        project_id=project_1.id,
        group_id=group_1.id,
        #pin_start="",
        #pin_end="",
        days_length=7
    )
    task_2 = Task(
        name='Site Work',
        project_id=project_1.id,
        group_id=group_1.id,
        # pin_start=datetime.strptime("2026-01-01", "%Y-%m-%d"),
        #pin_end="",
        days_length=30
    )
    task_3 = Task(
        name='Level Site',
        project_id=project_1.id,
        group_id=group_1.id,
        #pin_start="",
        #pin_end="",
        days_length=14
    )
    task_4 = Task(
        name='Foundation',
        project_id=project_1.id,
        group_id=group_1.id,
        #pin_start="",
        #pin_end="",
        days_length=14
    )
    task_5 = Task(
        name='Survey',
        project_id=project_1.id,
        group_id=group_1.id,
        #pin_start="",
        #pin_end="",
        days_length=3
    )
    task_6 = Task(
        name='Apply for Permits',
        project_id=project_1.id,
        group_id=group_1.id,
        #pin_start="",
        #pin_end="",
        days_length=7
    )

    print('Adding Task objects to transaction...')
    db.session.add_all([task_1, task_2, task_3, task_4, task_5, task_6])
    print('Committing transaction...')
    db.session.commit()
    print('Complete.')


    print('Creating TaskDependencies...')
    td_1 = TaskDependency(
        task_id=task_2.id,
        dependent_task_id=task_1.id
    )
    td_11 = TaskDependency(
        task_id=task_2.id,
        dependent_task_id=task_1.id
    )
    td_2 = TaskDependency(
        task_id=task_3.id,
        dependent_task_id=task_2.id
    )
    td_3 = TaskDependency(
        task_id=task_4.id,
        dependent_task_id=task_3.id
    )
    td_4 = TaskDependency(
        task_id=task_5.id,
        dependent_task_id=task_3.id
    )
    td_5 = TaskDependency(
        task_id=task_5.id,
        dependent_task_id=task_6.id
    )
    td_6 = TaskDependency(
        task_id=task_6.id,
        dependent_task_id=task_1.id
    )
    print('Adding TaskDependency objects to transaction...')
    db.session.add_all([td_1, td_2, td_3, td_4, td_5, td_6])
    print('Committing transaction...')
    db.session.commit()
    print('Complete.')


    print('Creating TaskUsers...')
    tu_1 = TaskUser(
        task_id=task_1.id,
        user_id=user_1.id
    )
    tu_2 = TaskUser(
        task_id=task_2.id,
        user_id=user_1.id
    )
    tu_3 = TaskUser(
        task_id=task_3.id,
        user_id=user_1.id
    )
    print('Adding TaskUser objects to transaction...')
    db.session.add_all([tu_1, tu_2, tu_3])
    print('Committing transaction...')
    db.session.commit()
    print('Complete.')


    print('Recursively updating dependencies for all tasks...')
    recursively_update_children(task_1)
    recursively_update_children(task_2)
    recursively_update_children(task_3)
    recursively_update_children(task_4)
    recursively_update_children(task_5)
    recursively_update_children(task_6)
    print('Committing transaction...')
    db.session.commit()
    print('Complete.')