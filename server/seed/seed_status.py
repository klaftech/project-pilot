from app import app
from models import db, User, Project, StatusUpdate

import datetime
from faker import Faker
    
with app.app_context():

    seed_project = 15
    seed_status = ""

    fake = Faker()

    # fake.date_between(start_date='today', end_date='+30y')
    # # datetime.date(2025, 3, 12)

    # # datetime.datetime(2007, 2, 28, 11, 28, 16)
    # fake.date_time_between(start_date='-1y', end_date='now')
    
    # # Or if you need a more specific date boundaries, provide the start 
    # # and end dates explicitly.
    # start_date = datetime.date(year=2015, month=1, day=1)
    # fake.date_between(start_date=start_date, end_date='+30y')

    status_options = [25, 50, 75, 200, 500]
    tasks = [516, 517, 518, 519, 555, 523, 573, 522, 520, 521, 524, 534, 579, 525, 580, 535, 581, 570, 527, 552, 589, 528, 526, 529, 530, 531, 532, 533, 536, 537, 538, 539, 553, 540, 590, 541, 582, 571, 583, 542, 584, 543, 544, 545, 546, 547, 548, 549, 585, 550, 551, 554, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 572, 574, 575, 576, 577, 578, 586, 587, 588, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605]

    status_1 = StatusUpdate(
        task_id = fake.random_element(elements=tasks),
        task_status = fake.random_element(elements=status_options),
        user_id = 21,
        timestamp = fake.date_time_between(start_date='-30d', end_date='+30d')
    )

    # issue with this script is that we have no logic being processed
    #db.session.add(status_1)
    #db.session.commit()

    print(f"{status_1}")