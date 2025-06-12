import sys
from app import app
from models import db, User, Project, Group, MasterTask, MasterTaskDependency, TaskUser, Unit, UnitTask, StatusUpdate

with app.app_context():
    
    # do not allow script to run in production
    sys.exit("Terminating the script")

    def add_users(): 
        print('Creating Users...')
        user_1 = User(
            first_name="Elchonon",
            last_name="Klafter", 
            email="ekn400@gmail.com"
        )
        user_1.password_hash = "123"
        print('Adding User objects to transaction...')
        db.session.add_all([user_1])
        print('Committing transaction...')
        db.session.commit()
        print('Complete.')


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


    # prep database 
    drop_tables()
    add_users()
    
    print("***************************************************")
    print('Creating Development project and tasks')

    # Create Project
    print('Creating Project...')
    project_1 = Project(
        name='Amsterdam Development',
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
    task_1 = MasterTask(name='Stake & Digging', project_id=project_1.id, group_id=group_1.id, days_length=7, override_start_date=True)
    task_2 = MasterTask(name='Foundation & Backfill', project_id=project_1.id, group_id=group_1.id, days_length=14)
    task_3 = MasterTask(name='Framing', project_id=project_1.id, group_id=group_1.id, days_length=28, override_start_date=True)
    task_4 = MasterTask(name='Roof', project_id=project_1.id, group_id=group_1.id, days_length=7)
    task_5 = MasterTask(name='Slab Basement Framing', project_id=project_1.id, group_id=group_1.id, days_length=7)
    task_6 = MasterTask(name='Plumbing', project_id=project_1.id, group_id=group_1.id, days_length=7)
    task_7 = MasterTask(name='HVAC', project_id=project_1.id, group_id=group_1.id, days_length=7)
    task_8 = MasterTask(name='Gas & Boxing', project_id=project_1.id, group_id=group_1.id, days_length=7)
    task_9 = MasterTask(name='Electric', project_id=project_1.id, group_id=group_1.id, days_length=7)
    task_10 = MasterTask(name='Rough Inspections/Point Loads', project_id=project_1.id, group_id=group_1.id, days_length=14)
    task_11 = MasterTask(name='Insulation', project_id=project_1.id, group_id=group_1.id, days_length=2)
    task_12 = MasterTask(name='Sheetrock', project_id=project_1.id, group_id=group_1.id, days_length=14)
    task_13 = MasterTask(name='Priming', project_id=project_1.id, group_id=group_1.id, days_length=3)
    task_14 = MasterTask(name='Tiles', project_id=project_1.id, group_id=group_1.id, days_length=14)
    task_15 = MasterTask(name='Hardwood', project_id=project_1.id, group_id=group_1.id, days_length=7)
    task_16 = MasterTask(name='Vinyl Trim', project_id=project_1.id, group_id=group_1.id, days_length=7)
    task_17 = MasterTask(name='Final Electric', project_id=project_1.id, group_id=group_1.id, days_length=7)
    task_18 = MasterTask(name='Final Plumbing', project_id=project_1.id, group_id=group_1.id, days_length=7)
    task_19 = MasterTask(name='Touch Ups', project_id=project_1.id, group_id=group_1.id, days_length=7)
    task_20 = MasterTask(name='Painting', project_id=project_1.id, group_id=group_1.id, days_length=7)
    task_21 = MasterTask(name='Staining', project_id=project_1.id, group_id=group_1.id, days_length=7)
    task_22 = MasterTask(name='Cleaning', project_id=project_1.id, group_id=group_1.id, days_length=2)

    # non-blocking tasks should be autostart_children=False, override_start_date=True
    task_30 = MasterTask(name='Water & Sewer', project_id=project_1.id, group_id=group_1.id, days_length=2, autostart_children=False, override_start_date=True)
    task_31 = MasterTask(name='Slab Plumbing', project_id=project_1.id, group_id=group_1.id, days_length=7, autostart_children=False, override_start_date=True)
    task_32 = MasterTask(name='Siding', project_id=project_1.id, group_id=group_1.id, days_length=7, autostart_children=False, override_start_date=True)
    task_33 = MasterTask(name='Stone', project_id=project_1.id, group_id=group_1.id, days_length=7, autostart_children=False, override_start_date=True)
    task_34 = MasterTask(name='Doors & Moldings', project_id=project_1.id, group_id=group_1.id, days_length=7, autostart_children=False, override_start_date=True)
    task_35 = MasterTask(name='Shelving', project_id=project_1.id, group_id=group_1.id, days_length=7, autostart_children=False, override_start_date=True)
    task_36 = MasterTask(name='Kitchen', project_id=project_1.id, group_id=group_1.id, days_length=2, autostart_children=False, override_start_date=True)
    task_37 = MasterTask(name='Granite', project_id=project_1.id, group_id=group_1.id, days_length=7, autostart_children=False, override_start_date=True)
    task_38 = MasterTask(name='Driveway/Landscaping', project_id=project_1.id, group_id=group_1.id, days_length=7, autostart_children=False, override_start_date=True)
    
    # Adding all tasks to the session
    db.session.add_all([task_1, task_2, task_3, task_4, task_5, task_6, task_7, task_8, task_9, task_10, task_11, task_12, task_13, task_14, task_15, task_16, task_17, task_18, task_19, task_20, task_21, task_22])
    db.session.add_all([task_30, task_31, task_32, task_33, task_34, task_35, task_36, task_37, task_38])
    db.session.commit()
    print('Complete.')


    # Create Task Dependencies for all tasks
    print('Creating MasterTaskDependencies...')
    td_1 = MasterTaskDependency(task_id=task_2.id, dependent_task_id=task_1.id)
    td_2 = MasterTaskDependency(task_id=task_3.id, dependent_task_id=task_2.id)
    td_3 = MasterTaskDependency(task_id=task_4.id, dependent_task_id=task_3.id)
    td_4 = MasterTaskDependency(task_id=task_5.id, dependent_task_id=task_4.id)
    td_5 = MasterTaskDependency(task_id=task_6.id, dependent_task_id=task_5.id)
    td_6 = MasterTaskDependency(task_id=task_7.id, dependent_task_id=task_6.id)
    td_7 = MasterTaskDependency(task_id=task_8.id, dependent_task_id=task_7.id)
    td_8 = MasterTaskDependency(task_id=task_9.id, dependent_task_id=task_8.id)
    td_9 = MasterTaskDependency(task_id=task_10.id, dependent_task_id=task_9.id)
    td_10 = MasterTaskDependency(task_id=task_11.id, dependent_task_id=task_10.id)
    td_11 = MasterTaskDependency(task_id=task_12.id, dependent_task_id=task_11.id)
    td_12 = MasterTaskDependency(task_id=task_13.id, dependent_task_id=task_12.id)
    td_13 = MasterTaskDependency(task_id=task_14.id, dependent_task_id=task_13.id)
    td_14 = MasterTaskDependency(task_id=task_15.id, dependent_task_id=task_14.id)
    td_15 = MasterTaskDependency(task_id=task_16.id, dependent_task_id=task_15.id)
    td_16 = MasterTaskDependency(task_id=task_17.id, dependent_task_id=task_16.id)
    td_17 = MasterTaskDependency(task_id=task_18.id, dependent_task_id=task_17.id)
    td_18 = MasterTaskDependency(task_id=task_19.id, dependent_task_id=task_18.id)
    td_19 = MasterTaskDependency(task_id=task_20.id, dependent_task_id=task_19.id)
    td_20 = MasterTaskDependency(task_id=task_21.id, dependent_task_id=task_20.id)
    td_21 = MasterTaskDependency(task_id=task_22.id, dependent_task_id=task_21.id)
    
    # define non-blocking & special task dependencies

    # slab plumbing #31, dependent on framing #3
    td_sp_1 = MasterTaskDependency(task_id=task_31.id, dependent_task_id=task_3.id)
    # basement framing #5, is also dependent on slab plumbing #31
    #td_sp_2 = MasterTaskDependency(task_id=task_5.id, dependent_task_id=task_31.id)

    # water & sewer #30, dependent on foundation #2
    td_sp_3 = MasterTaskDependency(task_id=task_30.id, dependent_task_id=task_2.id)
    
    # siding #32, dependent on HVAC #7
    td_sp_4 = MasterTaskDependency(task_id=task_32.id, dependent_task_id=task_7.id)

    # stone #33, dependent on siding #32
    td_sp_5 = MasterTaskDependency(task_id=task_33.id, dependent_task_id=task_32.id)
    
    # doors & moldings #34, dependent on sheetrock #12
    td_sp_6 = MasterTaskDependency(task_id=task_34.id, dependent_task_id=task_12.id)
    
    # shelving #35, dependent on vinyl trim #16
    td_sp_7 = MasterTaskDependency(task_id=task_35.id, dependent_task_id=task_16.id)
    
    # kitchen #36, dependent on tiles #14
    td_sp_8 = MasterTaskDependency(task_id=task_36.id, dependent_task_id=task_14.id)
    # granite #37, dependent on kitchen #36
    td_sp_9 = MasterTaskDependency(task_id=task_37.id, dependent_task_id=task_36.id)
    
    # driveway/landscaping #38, dependent on tiles #14
    td_sp_10 = MasterTaskDependency(task_id=task_38.id, dependent_task_id=task_14.id)
    

    db.session.add_all([td_1, td_2, td_3, td_4, td_5, td_6, td_7, td_8, td_9, td_10, td_11, td_12, td_13, td_14, td_15, td_16, td_17, td_18, td_19, td_20, td_21])
    db.session.add_all([td_sp_1, td_sp_3, td_sp_4, td_sp_5, td_sp_6, td_sp_7, td_sp_8, td_sp_9, td_sp_10])
    db.session.commit()
    print('Complete.')

    seed_status = ""
    
    # add units
    unit_1 = Unit(name='89 Amsterdam Ave',project_id=project_1.id,status=seed_status)
    unit_2 = Unit(name='91 Amsterdam Ave',project_id=project_1.id,status=seed_status)
    unit_3 = Unit(name='105 Amsterdam Ave',project_id=project_1.id,status=seed_status)
    unit_4 = Unit(name='107 Amsterdam Ave',project_id=project_1.id,status=seed_status)
    unit_5 = Unit(name='93 Amsterdam Ave',project_id=project_1.id,status=seed_status)
    unit_6 = Unit(name='95 Amsterdam Ave',project_id=project_1.id,status=seed_status)
    unit_7 = Unit(name='97 Amsterdam Ave',project_id=project_1.id,status=seed_status)
    unit_8 = Unit(name='99 Amsterdam Ave',project_id=project_1.id,status=seed_status)
    unit_9 = Unit(name='101 Amsterdam Ave',project_id=project_1.id,status=seed_status)
    unit_10 = Unit(name='103 Amsterdam Ave',project_id=project_1.id,status=seed_status)
    unit_11 = Unit(name='90 Java Ave',project_id=project_1.id,status=seed_status)
    unit_12 = Unit(name='92 Java Ave',project_id=project_1.id,status=seed_status)
    unit_13 = Unit(name='106 Java Ave',project_id=project_1.id,status=seed_status)
    unit_14 = Unit(name='108 Java Ave',project_id=project_1.id,status=seed_status)
    unit_15 = Unit(name='94 Java Ave',project_id=project_1.id,status=seed_status)
    unit_16 = Unit(name='96 Java Ave',project_id=project_1.id,status=seed_status)
    unit_17 = Unit(name='98 Java Ave',project_id=project_1.id,status=seed_status)
    unit_18 = Unit(name='100 Java Ave',project_id=project_1.id,status=seed_status)
    unit_19 = Unit(name='102 Java Ave',project_id=project_1.id,status=seed_status)
    unit_20 = Unit(name='104 Java Ave',project_id=project_1.id,status=seed_status)
    
    units = [unit_1, unit_2, unit_3, unit_4, unit_5, unit_6, unit_7, unit_8, unit_9, unit_10, unit_11, unit_12, unit_13, unit_14, unit_15, unit_16, unit_17, unit_18, unit_19, unit_20]
    print('Adding Unit objects to transaction...')
    db.session.add_all(units)
    print('Committing transaction...')
    db.session.commit()
    print('Complete.')


    print('Building tasklist for each Unit...')
    for unit in units:
        print(f'Building tasklist for Unit ID: {unit.id}')
        unit.build_tasklist()
    print('Finished building tasklists')

    print('Import is complete')