from app import app
from models import db, User, Project, Group, Task, TaskDependency, TaskUser, Unit, UnitTask
#from seed_dev import add_dev
#from seed_construction import add_construction, add_mini_construction
#from seed_helper import recursively_update_children, drop_tables, add_users

with app.app_context():

    seed_project = 5
    seed_status = ""

    # add units
    unit_1 = Unit(
        name='101',
        project_id=seed_project,
        status=seed_status
    )
    unit_2 = Unit(
        name='102',
        project_id=seed_project,
        status=seed_status
    )
    unit_3 = Unit(
        name='103',
        project_id=seed_project,
        status=seed_status
    )
    unit_4 = Unit(
        name='104',
        project_id=seed_project,
        status=seed_status
    )
    unit_5 = Unit(
        name='105',
        project_id=seed_project,
        status=seed_status
    )
    print('Adding Unit objects to transaction...')
    db.session.add_all([unit_1, unit_2, unit_3, unit_4, unit_5])
    print('Committing transaction...')
    db.session.commit()
    print('Complete.')


    # add units tasks
    ut_1 = UnitTask(
        unit_id=unit_1.id,
        task_id=16
    )
    ut_2 = UnitTask(
        unit_id=unit_1.id,
        task_id=17
    )
    ut_3 = UnitTask(
        unit_id=unit_1.id,
        task_id=18
    )
    ut_4 = UnitTask(
        unit_id=unit_2.id,
        task_id=16
    )
    ut_5 = UnitTask(
        unit_id=unit_2.id,
        task_id=17
    )

    print('Adding UnitTask objects to transaction...')
    db.session.add_all([ut_1, ut_2, ut_3, ut_4, ut_5])
    print('Committing transaction...')
    db.session.commit()
    print('Complete.')