from models import db, User, Project, Group, Task, TaskDependency, TaskUser
from seed_helper import recursively_update_children
from datetime import datetime

def add_construction():
    print("***************************************************")
    print('Adding CONSTRUCTION project and tasks')

    # Create Project
    print('Creating Project...')
    project_1 = Project(
        name='3261 Shady Lane',
        project_type='house',
        description="Single-Family Home"
    )
    db.session.add(project_1)
    db.session.commit()
    print('Complete.')


    # Create Groups for Project 1 (123 Main Street Building)
    print('Creating Groups...')
    group_1 = Group(name='Site Prep', project_id=project_1.id)
    group_2 = Group(name='Foundation', project_id=project_1.id)
    group_3 = Group(name='Framing', project_id=project_1.id)
    group_4 = Group(name='Roofing', project_id=project_1.id)
    group_5 = Group(name='Exterior', project_id=project_1.id)
    group_6 = Group(name='Interior', project_id=project_1.id)
    group_7 = Group(name='Electrical', project_id=project_1.id)
    group_8 = Group(name='Plumbing', project_id=project_1.id)
    group_9 = Group(name='HVAC', project_id=project_1.id)
    db.session.add_all([group_1, group_2, group_3, group_4, group_5, group_6, group_7, group_8, group_9])
    db.session.commit()
    print('Complete.')


    # Create Tasks for Project 1 (123 Main Street Building)
    print('Creating Tasks...')
    task_1 = Task(name='Sign Contract', project_id=project_1.id, group_id=group_1.id, days_length=7)
    task_2 = Task(name='Site Work', project_id=project_1.id, group_id=group_1.id, days_length=30)
    task_3 = Task(name='Level Site', project_id=project_1.id, group_id=group_1.id, days_length=14)
    task_4 = Task(name='Foundation', project_id=project_1.id, group_id=group_2.id, days_length=14)
    task_5 = Task(name='Survey', project_id=project_1.id, group_id=group_2.id, days_length=3)
    task_6 = Task(name='Apply for Permits', project_id=project_1.id, group_id=group_1.id, days_length=7)
    task_7 = Task(name='Framing', project_id=project_1.id, group_id=group_3.id, days_length=14)
    task_8 = Task(name='Roofing', project_id=project_1.id, group_id=group_4.id, days_length=10)
    task_9 = Task(name='Exterior Finishes', project_id=project_1.id, group_id=group_5.id, days_length=21)
    task_10 = Task(name='Interior Work', project_id=project_1.id, group_id=group_6.id, days_length=30)
    task_11 = Task(name='Electrical Rough-in', project_id=project_1.id, group_id=group_7.id, days_length=14)
    task_12 = Task(name='Electrical Trim', project_id=project_1.id, group_id=group_7.id, days_length=7)
    task_13 = Task(name='Plumbing Rough-in', project_id=project_1.id, group_id=group_8.id, days_length=14)
    task_14 = Task(name='Plumbing Trim', project_id=project_1.id, group_id=group_8.id, days_length=7)
    task_15 = Task(name='HVAC Rough-in', project_id=project_1.id, group_id=group_9.id, days_length=14)
    task_16 = Task(name='HVAC Trim', project_id=project_1.id, group_id=group_9.id, days_length=7)
    task_17 = Task(name='Rough Inspection', project_id=project_1.id, group_id=group_6.id, days_length=5)
    task_18 = Task(name='Install Drywall', project_id=project_1.id, group_id=group_6.id, days_length=14)
    task_19 = Task(name='Paint Interior', project_id=project_1.id, group_id=group_6.id, days_length=10)
    task_20 = Task(name='Flooring Installation', project_id=project_1.id, group_id=group_6.id, days_length=7)
    task_21 = Task(name='Install Windows', project_id=project_1.id, group_id=group_5.id, days_length=10)
    task_22 = Task(name='Install Doors', project_id=project_1.id, group_id=group_5.id, days_length=7)
    task_23 = Task(name='Install Insulation', project_id=project_1.id, group_id=group_6.id, days_length=7)
    task_24 = Task(name='Install Cabinets', project_id=project_1.id, group_id=group_6.id, days_length=10)
    task_25 = Task(name='Install Fixtures', project_id=project_1.id, group_id=group_6.id, days_length=7)
    task_26 = Task(name='Landscaping', project_id=project_1.id, group_id=group_5.id, days_length=10)
    task_27 = Task(name='Punch List', project_id=project_1.id, group_id=group_6.id, days_length=7)
    task_28 = Task(name='Close Out', project_id=project_1.id, group_id=group_6.id, days_length=7)
    task_29 = Task(name='HVAC Inspection', project_id=project_1.id, group_id=group_9.id, days_length=7)
    task_30 = Task(name='Plumbing Inspection', project_id=project_1.id, group_id=group_8.id, days_length=7)
    task_31 = Task(name='Electrical Inspection', project_id=project_1.id, group_id=group_7.id, days_length=7)
    task_32 = Task(name='Final Punch List', project_id=project_1.id, group_id=group_6.id, days_length=7)
    task_33 = Task(name='Owner Occupancy', project_id=project_1.id, group_id=group_6.id, days_length=7)
    task_34 = Task(name='Project Handover', project_id=project_1.id, group_id=group_6.id, days_length=7)

    # Adding all tasks to the session
    db.session.add_all([task_1, task_2, task_3, task_4, task_5, task_6, task_7, task_8, task_9, task_10, task_11, task_12, task_13, task_14, task_15, task_16, task_17, 
                        task_18, task_19, task_20, task_21, task_22, task_23, task_24, task_25, task_26, task_27, task_28, task_29, task_30, task_31, task_32, task_33, task_34])
    db.session.commit()
    print('Complete.')


    # Create Task Dependencies for all tasks
    print('Creating TaskDependencies...')
    td_1 = TaskDependency(task_id=task_2.id, dependent_task_id=task_1.id)
    td_2 = TaskDependency(task_id=task_3.id, dependent_task_id=task_2.id)
    td_3 = TaskDependency(task_id=task_4.id, dependent_task_id=task_3.id)
    td_4 = TaskDependency(task_id=task_5.id, dependent_task_id=task_3.id)
    td_5 = TaskDependency(task_id=task_6.id, dependent_task_id=task_1.id)
    td_6 = TaskDependency(task_id=task_7.id, dependent_task_id=task_6.id)
    td_7 = TaskDependency(task_id=task_8.id, dependent_task_id=task_7.id)
    td_8 = TaskDependency(task_id=task_9.id, dependent_task_id=task_8.id)
    td_9 = TaskDependency(task_id=task_10.id, dependent_task_id=task_9.id)
    td_10 = TaskDependency(task_id=task_11.id, dependent_task_id=task_10.id)
    td_11 = TaskDependency(task_id=task_12.id, dependent_task_id=task_11.id)
    td_12 = TaskDependency(task_id=task_13.id, dependent_task_id=task_12.id)
    td_13 = TaskDependency(task_id=task_14.id, dependent_task_id=task_13.id)
    td_14 = TaskDependency(task_id=task_15.id, dependent_task_id=task_14.id)
    td_15 = TaskDependency(task_id=task_16.id, dependent_task_id=task_15.id)
    td_16 = TaskDependency(task_id=task_17.id, dependent_task_id=task_16.id)
    td_17 = TaskDependency(task_id=task_18.id, dependent_task_id=task_17.id)
    td_18 = TaskDependency(task_id=task_19.id, dependent_task_id=task_18.id)
    td_19 = TaskDependency(task_id=task_20.id, dependent_task_id=task_19.id)
    td_20 = TaskDependency(task_id=task_21.id, dependent_task_id=task_19.id)
    td_21 = TaskDependency(task_id=task_22.id, dependent_task_id=task_21.id)
    td_22 = TaskDependency(task_id=task_23.id, dependent_task_id=task_22.id)
    td_23 = TaskDependency(task_id=task_24.id, dependent_task_id=task_23.id)
    td_24 = TaskDependency(task_id=task_25.id, dependent_task_id=task_24.id)
    td_25 = TaskDependency(task_id=task_26.id, dependent_task_id=task_25.id)
    td_26 = TaskDependency(task_id=task_27.id, dependent_task_id=task_26.id)
    td_27 = TaskDependency(task_id=task_28.id, dependent_task_id=task_27.id)
    td_28 = TaskDependency(task_id=task_29.id, dependent_task_id=task_28.id)
    td_29 = TaskDependency(task_id=task_30.id, dependent_task_id=task_29.id)
    td_30 = TaskDependency(task_id=task_31.id, dependent_task_id=task_30.id)
    td_31 = TaskDependency(task_id=task_32.id, dependent_task_id=task_31.id)
    td_32 = TaskDependency(task_id=task_33.id, dependent_task_id=task_32.id)
    td_33 = TaskDependency(task_id=task_34.id, dependent_task_id=task_33.id)

    db.session.add_all([td_1, td_2, td_3, td_4, td_5, td_6, td_7, td_8, td_9, td_10, td_11, td_12, td_13, td_14, td_15, td_16,
                        td_17, td_18, td_19, td_20, td_21, td_22, td_23, td_24, td_25, td_26, td_27, td_28, td_29, td_30, td_31, td_32, td_33])
    db.session.commit()
    print('Complete.')


    # Recursively update children of tasks
    print('Updating Task Dependencies recursively...')
    for task in [task_1, task_2, task_3, task_4, task_5, task_6, task_7, task_8, task_9, task_10, task_11, task_12, task_13, task_14, task_15, task_16, task_17, 
                        task_18, task_19, task_20, task_21, task_22, task_23, task_24, task_25, task_26, task_27, task_28, task_29, task_30, task_31, task_32, task_33, task_34]:
        recursively_update_children(task)


def add_mini_construction():
    print("***************************************************")
    print('Adding CONSTRUCTION MINI project and tasks')

    print('Creating Projects...')
    project_1 = Project(
        name='123 Main Street Building',
        project_type='house',
        description="Single-Family Home"
    )
    project_2 = Project(
        name='Factory Renovation',
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
        group_id=group_2.id,
        #pin_start="",
        #pin_end="",
        days_length=14
    )
    task_5 = Task(
        name='Survey',
        project_id=project_1.id,
        group_id=group_2.id,
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


    # print('Creating TaskUsers...')
    # tu_1 = TaskUser(
    #     task_id=task_1.id,
    #     user_id=user_1.id
    # )
    # tu_2 = TaskUser(
    #     task_id=task_2.id,
    #     user_id=user_1.id
    # )
    # tu_3 = TaskUser(
    #     task_id=task_3.id,
    #     user_id=user_1.id
    # )
    # print('Adding TaskUser objects to transaction...')
    # db.session.add_all([tu_1, tu_2, tu_3])
    # print('Committing transaction...')
    # db.session.commit()
    # print('Complete.')


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

    