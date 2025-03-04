from models import db, User, Project, Group, MasterTask, MasterTaskDependency, TaskUser
from seed_helper import recursively_update_children

def add_dev():
    print("***************************************************")
    print('Adding APP DEV project and tasks')
    
    print('Creating Project...')
    project_code = Project(
        name='App Development',
        project_type='coding',
        description="Coding sample"
    )
    print('Adding Project object to transaction...')
    db.session.add(project_code)
    print('Committing transaction...')
    db.session.commit()
    print('Complete.')


    print('Creating Groups...')
    group_1 = Group(
        name='Planning',
        project_id=project_code.id
    )
    group_2 = Group(
        name='Execution',
        project_id=project_code.id
    )
    group_3 = Group(
        name='Deployment',
        project_id=project_code.id
    )
    print('Adding Group objects to transaction...')
    db.session.add_all([group_1, group_2, group_3])
    print('Committing transaction...')
    db.session.commit()
    print('Complete.')


    task_1 = MasterTask(
        project_id=project_code.id,
        group_id=group_1.id,
        name="Project Kickoff", 
        days_length=1, 
        pin_start="2025-02-01 09:00:00", 
        complete_status=True
    )
    task_2 = MasterTask(
        project_id=project_code.id,
        group_id=group_1.id,
        name="Requirement Gathering", 
        days_length=4, 
        pin_end="2025-02-05 17:00:00"
    )
    task_3 = MasterTask(
        project_id=project_code.id,
        group_id=group_1.id,
        name="Design System Architecture", 
        days_length=5
    )
    task_4 = MasterTask(
        project_id=project_code.id,
        group_id=group_1.id,
        name="Database Schema Definition", 
        days_length=2, 
        pin_start="2025-02-11 09:00:00"
    )
    task_5 = MasterTask(
        project_id=project_code.id,
        group_id=group_2.id,
        name="API Development", 
        days_length=6, 
        pin_end="2025-02-20 18:00:00"
    )
    task_6 = MasterTask(
        project_id=project_code.id,
        group_id=group_2.id,
        name="Frontend Development", 
        days_length=10
    )
    task_7 = MasterTask(
        project_id=project_code.id,
        group_id=group_2.id,
        name="Testing & QA", 
        days_length=5, 
        pin_start="2025-03-06 09:00:00"
    )
    task_8 = MasterTask(
        project_id=project_code.id,
        group_id=group_3.id,
        name="Deployment", 
        days_length=3
    )
    task_9 = MasterTask(
        project_id=project_code.id,
        group_id=group_3.id,
        name="Project Review & Closure", 
        days_length=3, 
        pin_end="2025-03-18 17:00:00"
    )
    print('Adding Task objects to transaction...')
    db.session.add_all([task_1, task_2, task_3, task_4, task_5, task_6, task_7, task_8, task_9])
    print('Committing transaction...')
    db.session.commit()
    print('Complete.')


    td_1 = MasterTaskDependency(task_id=task_2.id, dependent_task_id=task_1.id)
    td_2 = MasterTaskDependency(task_id=task_3.id, dependent_task_id=task_2.id)
    td_3 = MasterTaskDependency(task_id=task_4.id, dependent_task_id=task_3.id)
    td_4 = MasterTaskDependency(task_id=task_5.id, dependent_task_id=task_3.id)
    td_5 = MasterTaskDependency(task_id=task_5.id, dependent_task_id=task_4.id)
    td_6 = MasterTaskDependency(task_id=task_6.id, dependent_task_id=task_5.id)
    td_7 = MasterTaskDependency(task_id=task_7.id, dependent_task_id=task_5.id)
    td_8 = MasterTaskDependency(task_id=task_7.id, dependent_task_id=task_6.id)
    td_9 = MasterTaskDependency(task_id=task_8.id, dependent_task_id=task_7.id)
    td_10 = MasterTaskDependency(task_id=task_9.id, dependent_task_id=task_8.id)
    print('Adding TaskDependency objects to transaction...')
    db.session.add_all([td_1, td_2, td_3, td_4, td_5, td_6, td_7, td_8, td_9, td_10])
    print('Committing transaction...')
    db.session.commit()
    print('Complete.')

    # calculate_schedule moved to UnitTask
    # print('Recursively updating dependencies for all tasks...')
    # for task in [task_1, task_2, task_3, task_4, task_5, task_6, task_7, task_8, task_9]:
    #     recursively_update_children(task)
    # print('Committing transaction...')
    # db.session.commit()
    # print('Complete.')