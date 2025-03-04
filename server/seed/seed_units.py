from app import app
from models import db, User, Project, Group, MasterTask, MasterTaskDependency, TaskUser, Unit, UnitTask
#from seed_dev import add_dev
#from seed_construction import add_construction, add_mini_construction
#from seed_helper import recursively_update_children, drop_tables, add_users

with app.app_context():

    seed_project = 15
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



    print('Building tasklist for each Unit...')
    for unit in [unit_1, unit_2, unit_3, unit_4, unit_5]:
        print(f'Building tasklist for Unit ID: {unit.id}')
        unit.build_tasklist()
    print('Finished building tasklists')