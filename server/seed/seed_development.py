from models import db, Project, Group, MasterTask, MasterTaskDependency
from seed_helper import recursively_update_children

def add_construction_development():
    print("***************************************************")
    print('Adding CONSTRUCTION Development project and tasks')

    # Create Project
    print('Creating Project...')
    project_1 = Project(
        name='Lenox Development',
        project_type='development',
        description="Multi-Family Development"
    )
    db.session.add(project_1)
    db.session.commit()
    print('Complete.')


    # Create Groups for Project 1
    print('Creating Groups...')
    group_1 = Group(name='Sitework', project_id=project_1.id)
    group_2 = Group(name='Shell', project_id=project_1.id)
    group_3 = Group(name='Utilities', project_id=project_1.id)
    group_4 = Group(name='Interior', project_id=project_1.id)
    group_5 = Group(name='Finishings', project_id=project_1.id)
    db.session.add_all([group_1, group_2, group_3, group_4, group_5])
    db.session.commit()
    print('Complete.')


    # Create Tasks for Project 1
    print('Creating MasterTasks...')
    task_1 = MasterTask(name='Digging', project_id=project_1.id, group_id=group_1.id, days_length=14)
    task_2 = MasterTask(name='Foundation', project_id=project_1.id, group_id=group_1.id, days_length=14)
    task_3 = MasterTask(name='Framing', project_id=project_1.id, group_id=group_2.id, days_length=28)
    task_4 = MasterTask(name='Roof', project_id=project_1.id, group_id=group_2.id, days_length=7)
    task_5 = MasterTask(name='Utilities', project_id=project_1.id, group_id=group_3.id, days_length=42)
    task_6 = MasterTask(name='Electric', project_id=project_1.id, group_id=group_3.id, days_length=14)
    task_7 = MasterTask(name='Plumbing', project_id=project_1.id, group_id=group_3.id, days_length=14)
    task_8 = MasterTask(name='HVAC', project_id=project_1.id, group_id=group_3.id, days_length=14)
    task_9 = MasterTask(name='Insulation', project_id=project_1.id, group_id=group_4.id, days_length=7)
    task_10 = MasterTask(name='Sheetrock', project_id=project_1.id, group_id=group_4.id, days_length=7)
    task_11 = MasterTask(name='Kitchen', project_id=project_1.id, group_id=group_4.id, days_length=7)
    task_12 = MasterTask(name='Doors And Moldings', project_id=project_1.id, group_id=group_5.id, days_length=7)
    task_13 = MasterTask(name='Painting', project_id=project_1.id, group_id=group_5.id, days_length=7)
    task_14 = MasterTask(name='Hardwood', project_id=project_1.id, group_id=group_5.id, days_length=7)
    task_15 = MasterTask(name='Tiles', project_id=project_1.id, group_id=group_5.id, days_length=14)
    task_16 = MasterTask(name='Closets', project_id=project_1.id, group_id=group_5.id, days_length=7)
    task_17 = MasterTask(name='Finishings', project_id=project_1.id, group_id=group_5.id, days_length=14)
    task_18 = MasterTask(name='Punch List', project_id=project_1.id, group_id=group_5.id, days_length=7)
    
    # Adding all tasks to the session
    db.session.add_all([task_1, task_2, task_3, task_4, task_5, task_6, task_7, task_8, task_9, task_10, task_11, task_12, task_13, task_14, task_15, task_16, task_17, task_18])
    db.session.commit()
    print('Complete.')


    # Create Task Dependencies for all tasks
    print('Creating MasterTaskDependencies...')
    td_1 = MasterTaskDependency(task_id=task_2.id, dependent_task_id=task_1.id)
    td_2 = MasterTaskDependency(task_id=task_3.id, dependent_task_id=task_2.id)
    td_3 = MasterTaskDependency(task_id=task_4.id, dependent_task_id=task_3.id)
    td_4 = MasterTaskDependency(task_id=task_5.id, dependent_task_id=task_4.id)
    td_5 = MasterTaskDependency(task_id=task_6.id, dependent_task_id=task_4.id)
    td_6 = MasterTaskDependency(task_id=task_7.id, dependent_task_id=task_4.id)
    td_7 = MasterTaskDependency(task_id=task_8.id, dependent_task_id=task_4.id)
    td_8 = MasterTaskDependency(task_id=task_9.id, dependent_task_id=task_5.id)
    td_9 = MasterTaskDependency(task_id=task_10.id, dependent_task_id=task_9.id)
    td_10 = MasterTaskDependency(task_id=task_11.id, dependent_task_id=task_10.id)
    td_11 = MasterTaskDependency(task_id=task_12.id, dependent_task_id=task_11.id)
    td_12 = MasterTaskDependency(task_id=task_13.id, dependent_task_id=task_12.id)
    td_13 = MasterTaskDependency(task_id=task_14.id, dependent_task_id=task_13.id)
    td_14 = MasterTaskDependency(task_id=task_15.id, dependent_task_id=task_14.id)
    td_15 = MasterTaskDependency(task_id=task_16.id, dependent_task_id=task_15.id)
    td_16 = MasterTaskDependency(task_id=task_17.id, dependent_task_id=task_16.id)
    td_17 = MasterTaskDependency(task_id=task_18.id, dependent_task_id=task_17.id)
    
    db.session.add_all([td_1, td_2, td_3, td_4, td_5, td_6, td_7, td_8, td_9, td_10, td_11, td_12, td_13, td_14, td_15, td_16, td_17])
    db.session.commit()
    print('Complete.')


    # moved to Unit.build_tasklist
    # # Recursively update children of tasks
    # print('Updating Task Dependencies recursively...')
    # for task in [task_1, task_2, task_3, task_4, task_5, task_6, task_7, task_8, task_9, task_10, task_11, task_12, task_13, task_14, task_15, task_16, task_17]:
    #     recursively_update_children(task)
    