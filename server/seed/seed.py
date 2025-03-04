from app import app
from models import db, User, Project, Group, MasterTask, MasterTaskDependency, TaskUser
from seed_dev import add_dev
from seed_development import add_construction_development
from seed_construction import add_construction, add_mini_construction
from seed_helper import recursively_update_children, drop_tables, add_users

with app.app_context():

    # prep database 
    drop_tables()
    add_users()

    # add seed data 
    #add_dev()
    #add_construction()
    # add_mini_construction()
    add_construction_development()

    # # add empty project
    # project_2 = Project(
    #     name='Factory Renovation',
    #     project_type='commercial',
    #     description="Steel work"
    # )
    # print('Adding Project objects to transaction...')
    # #db.session.add_all([project_2])
    # db.session.add(project_2)
    # print('Committing transaction...')
    # db.session.commit()
    # print('Complete.')