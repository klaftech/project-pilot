from sqlalchemy_serializer import SerializerMixin
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.orm import validates, Session
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm.attributes import set_committed_value
from sqlalchemy.orm import attributes
#from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy import event, func

from server.config import db, bcrypt

import json
import ipdb
from datetime import datetime, timedelta, time, date

class User(db.Model, SerializerMixin):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    _password_hash = db.Column(db.String)

    @hybrid_property
    def password_hash(self):
        raise AttributeError('Password is not readable')

    @password_hash.setter
    def password_hash(self, password):
        self._password_hash = bcrypt.generate_password_hash(password.encode('utf-8')).decode('utf-8') 

    def authenticate(self, password):
        return bcrypt.check_password_hash(self._password_hash, password.encode('utf-8'))

    completed_tasks = db.relationship('Task', back_populates="complete_user")
    serialize_rules = (
        '-_password_hash',
        '-completed_tasks.complete_user',
        '-completed_tasks.project',
        '-completed_tasks.group',
        '-completed_tasks.dependencies',
        '-completed_tasks.parent_tasks',
        '-completed_tasks.children_tasks'
    )

    @validates('email')
    def validate_email(self, key, value):
        if not value or User.query.filter(User.email == value).first() != None:
            raise ValueError('Email must be unique')
        return value

    def __repr__(self):
        return f'<User {self.name}>'


class Project(db.Model, SerializerMixin):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True, nullable=False)
    start = db.Column(db.DateTime, nullable=True, default=datetime.strptime("2025-01-05", "%Y-%m-%d"))
    end = db.Column(db.DateTime, nullable=True, default=datetime.strptime("2025-01-01", "%Y-%m-%d"))
    project_type = db.Column(db.String, default="house")
    description = db.Column(db.String, nullable=True)

    groups = db.relationship('Group', back_populates="project")
    tasks = db.relationship('Task', back_populates="project")
    serialize_rules = (
        'stats',
        'schedule',
        '-groups.project',
        '-groups.tasks',
        '-tasks.complete_user',
        '-tasks.project',
        '-tasks.group',
        '-tasks.dependencies',
        '-tasks.parent_tasks',
        '-tasks.children_tasks'
    )

    @property
    def schedule(self):
        dataset = self.tasks
        
        if len(dataset) < 1:
            return {
                "project_start": self.start,
                "project_end": self.end,
                "project_days": 0 
            }
        
        project_start = min(task.sched_start for task in dataset)
        project_end = max(task.sched_end for task in dataset)
        time_diff = project_end - project_start
        data = {
            "project_start": project_start,
            "project_end": project_end,
            "project_days": int(time_diff.total_seconds()/3600/24)
        }
        #response = f"Project Scheduele: {data['project_start']} - {data['project_end']} ({data['project_days']} days)"
        return data

    @property
    def stats(self):
        # determine current week 
        # Monday is 0, Sunday is 6
        today = date.today()
        day_of_week = today.weekday()
        days_to_subtract = day_of_week if day_of_week != 0 else 7
        previous_monday = today - timedelta(days=days_to_subtract)
        days_until_monday = (7 - day_of_week) % 7
        next_monday = today + timedelta(days=days_until_monday)
        #print(next_monday)
        #print(previous_monday)

        project_tasks_query = db.session.query(func.count(Task.id)).filter(Task.project_id == self.id)
        get_completed = project_tasks_query.filter(Task.complete_status == True)
        get_upcoming = project_tasks_query.filter(Task.complete_status == False).filter(Task.sched_start < today).filter(Task.sched_start > today-timedelta(days=7))
        get_overdue = project_tasks_query.filter(Task.complete_status == False).filter(Task.sched_end < today)

        count_project_total = project_tasks_query.first()[0]
        count_project_completed = get_completed.first()[0]
        count_project_overdue = get_overdue.first()[0]
        count_project_upcoming = get_upcoming.first()[0]
        
        count_week_scheduled = project_tasks_query.filter(Task.sched_start > previous_monday).filter(Task.sched_start < next_monday).first()[0]
        count_week_scheduled_completed = get_completed.filter(Task.sched_start > previous_monday).filter(Task.sched_start < next_monday).first()[0]
        count_week_completed = get_completed.filter(Task.complete_date > previous_monday).filter(Task.complete_date < next_monday).first()[0]

        # calculate project completion percentage
        if count_project_completed == 0 or count_project_total == 0:
            completion_percent = 0
        else:
            completion_percent = int((count_project_completed / count_project_total)*100)
        
        # define project completion status
        # options: on_schedule, in_progress, delayed, completed, pre
        if count_project_total == 0:
            project_status = "planning"
        elif count_project_completed == count_project_total:
            project_status = "completed"
        elif project_tasks_query.filter(Task.complete_status == False).filter(Task.sched_end < today).first()[0] > 0:
            # if there are any tasks that completed=False and sched_end is smaller than today = should have been completed already
            project_status = "delayed" 
        elif project_tasks_query.filter(Task.complete_status == False).filter(Task.sched_end < today).first()[0] <= 0:
            project_status = "on_schedule"
        else:
            project_status = "in_progress" # default catch-all
            
        stats = {
            "project": {
                "count_tasks": count_project_total,
                "count_completed": count_project_completed,
                "count_overdue": count_project_overdue,
                "count_upcoming": count_project_upcoming,
                "completion_percent": completion_percent,
                "status": project_status
            },
            "week": {
                "count_scheduled": count_week_scheduled,
                "count_scheduled_completed": count_week_scheduled_completed,
                "count_completed": count_week_completed,
                "range_start": f'{previous_monday} 00:00:00', # working with date, not datetime. export valid datetime string
                "range_end": f'{next_monday} 00:00:00', # working with date, not datetime. export valid datetime string
            }
        }
        return stats

    
    def __repr__(self):
        return f'<Project {self.name} (ID: {self.id})>'


class Group(db.Model, SerializerMixin):
    __tablename__ = "groups"
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    name = db.Column(db.String)

    project = db.relationship('Project', back_populates="groups")
    tasks = db.relationship('Task', back_populates="group")
    serialize_rules = (
        '-project.groups',
        '-project.tasks',
        '-tasks.complete_user',
        '-tasks.project',
        '-tasks.group',
        '-tasks.dependencies',
        '-tasks.parent_tasks',
        '-tasks.children_tasks'
    )

    @validates('name','project_id')
    def validate_unique_name(self, key, value):
        if key == "project_id":
            if Project.query.filter(Project.id == value).first() == None:
                raise ValueError('Project ID must be linked to existing project.')
        name = None
        project_id = None
        if key == "name" and self.project_id != None:
            name = value
            project_id = self.project_id
        if key == "project_id" and self.name != None:
            name = self.name
            project_id = value

        if project_id != None and name != None:
            if Group.query.filter(Group.id != self.id).filter(Group.name == name).filter(Group.project_id == project_id).first() != None:
                raise ValueError('Project & Name combination must be unique')
            
        return value

    def __repr__(self):
        return f'<Group {self.name} (ID: {self.id}, Project: {self.project_id})>'



class Task(db.Model, SerializerMixin):
    __tablename__ = "tasks"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id'), nullable=False)
    plan_start = db.Column(db.DateTime, default=None, nullable=True)
    plan_end = db.Column(db.DateTime, default=None, nullable=True)
    pin_start = db.Column(db.DateTime, default=None, nullable=True)
    pin_end = db.Column(db.DateTime, default=None, nullable=True)
    pin_honored = db.Column(db.Boolean, default=False)
    sched_start = db.Column(db.DateTime, default=None, nullable=True)
    sched_end = db.Column(db.DateTime, default=None, nullable=True)
    days_length = db.Column(db.Integer, nullable=False)
    progress = db.Column(db.Integer, nullable=False, default=0)
    complete_status = db.Column(db.Boolean, default=False)
    complete_date = db.Column(db.DateTime, default=None, nullable=True)
    complete_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    complete_comment = db.Column(db.String)

    project = db.relationship('Project', back_populates="tasks")
    group = db.relationship('Group', back_populates="tasks")
    complete_user = db.relationship('User', back_populates="completed_tasks")
    updates = db.relationship('TaskUpdate', back_populates="task")

    @validates('days_length')
    def validate_days_length(self, key, value):
        if not isinstance(value, int):
            try:
                return int(value)
            except ValueError:
                raise ValueError('Days length must be an integer')
        return value
    
    # # run validation when any task schedule change happens
    @validates('plan_start','plan_end','pin_start','pin_end','sched_start','sched_end','complete_date')
    def validate_dates(self, attr, value):
        if not isinstance(value, datetime):
            for format in ('%Y-%m-%d', '%Y-%m-%d %H:%M:%S'):
                try:
                    return datetime.strptime(value, format)
                except ValueError:
                    pass
            raise ValueError(f'{attr} must be a valid date.')
        return value
    
    serialize_rules = (
        'dependencies', #default does not serializer association proxy
        '-parent_tasks.owner_task', #avoid recursion
        '-children_tasks.parent_task', #avoid recursion
        '-children_tasks.owner_task.children_tasks', #avoid nested recursive data (a tasks child's owner is itself... so don't show it's child all over again)
        '-children_tasks.owner_task.dependencies', #avoid nested recursive data (a tasks child's owner is itself... so don't show dependencies)
        '-dependencies.owner_task',
        '-dependencies.children_tasks',
        '-dependencies.parent_task',
        '-dependencies.parent_tasks',
        #'-project', #block all
        #'-group', #block all
        #'-complete_user', #block all
        '-updates.task',
        '-project.tasks',
        '-project.groups',
        '-project.stats',
        '-project.schedule',
        '-group.tasks',
        '-group.project',
        '-complete_user.completed_tasks',
        '-complete_user._password'
    )

    # in a DAG relationship, from every task's perspective: 
    # it itself is the vertex/node, 
    # tasks dependent on it are edges, 
    # tasks it is dependent on are adjacent 

    # TaskDependency is owned by the child of the DAG relationship (dependent_task_id is the dependencies (parent node)) 
    
    # Relationship to TaskDependency for tasks where this is the owner of the record, which is the parent in the dependency relationship 
    parent_tasks = db.relationship(
       "TaskDependency",
        foreign_keys="TaskDependency.task_id",
        back_populates="owner_task",
        cascade="all, delete-orphan"
    )

    # Relationship to TaskDependency for tasks where this is the dependent task in the record, which is the children of the dependency relationship
    children_tasks = db.relationship(
        "TaskDependency",
        foreign_keys="TaskDependency.dependent_task_id",
        back_populates="parent_task"
    )

    # Association proxy to access dependent tasks directly
    # list of tasks that this task is dependent on (all TaskDependecy where task_id=self.id)
    # essentially just a prettier version of parent_tasks (without the joining table)
    dependencies = association_proxy(
        "parent_tasks",                                         # connector
        "parent_task",                                          # name of the model we're connecting to
        creator=lambda task: TaskDependency(parent_task=task)   # function accepts object of the other independent class and returns the corresponding object of the 'connecting' class that made the connection possible. 
    )

    def get_ancestors(self):
        # recursively get ancestors
        ancestors = []
        if self.parent_tasks:
            from collections import deque
            parents = deque([parent.parent_task for parent in self.parent_tasks])
            while parents:
                current_task = parents.popleft()
                ancestors.append(current_task)
                
                if current_task.parent_tasks:
                    for parent in current_task.parent_tasks:
                        parents.append(parent.parent_task)
        return ancestors

    def get_descendents(self):
        #recursively get descendents
        descendents = []
        if self.children_tasks:
            from collections import deque
            children = deque([child.owner_task for child in self.children_tasks])
            while children:
                current_task = children.popleft()
                descendents.append(current_task)
                
                if current_task.children_tasks:
                    for child in current_task.children_tasks:
                        children.append(child.owner_task)
        return descendents

    def get_available(self):
        ancestors = set(self.get_ancestors())
        descendents = set(self.get_descendents())
        all_tasks = set([task for task in Task.query.filter(Task.id != self.id).filter(Task.project_id == self.project_id).all()])
        available_tasks_set = all_tasks - ancestors - descendents
        return available_tasks_set

    # validate before/after, returns Boolean
    # use: (start, end): returns True if valid timeframe, False if not
    # use: (sched_start, pin_start): returns True if planned start is before (allow pin to set start later)
    @staticmethod
    def validate_before_after(before, after):
        time_diff = (after - before).total_seconds()
        if not time_diff >= 0:
            return False
        return True
    
    # returns int or Exception
    @staticmethod
    def get_difference_days(start, end):
        time_diff = (end - start).total_seconds()
        if not time_diff >= 0:
            raise Exception("Invalid times. Start can't be before end")
        # +1 because difference from midnight-midnight is 1 day less
        return int(time_diff/3600/24)+1

    # ensure that enough time exists to complete task.. must handle conflict in response logic
    # returns Boolean, or Exception string defined in 4th paramether
    @staticmethod
    def validate_start_end_against_length(start, end, days_length, exception_response=False):
        # valid timeframe. returns Boolean
        if not Task.validate_before_after(start, end):  
            if not exception_response:
                return False
            else:
                raise Exception("Invalid times. Start can't be before end")
        else:
            # ensure timeframe is large enough for task.
            days_allocated = Task.get_difference_days(start,end)
            if days_allocated < days_length:
                if not exception_response:
                    return False
                else:
                    raise Exception(exception_response)
        return True


    

    # recalculates task schedule dates.
    # factoring in: 
    # 1. latest of all parent task (dependencies) end date, project start date for headless tasks (self.parent_tasks)
    # 2. pinned start or end dates  (self.pin_start, self.pin_end)
    # 3. task allocated length in days (self.days_length)
    # updates: self.sched_start, self.sched_end, self.pin_honored
    # logs action steps to 'logger' list
    def calculate_schedule(self):
        
        def handle_pin_start():
            if self.pin_start:
                allow_move = True
                logger.append(f'Processing Pinned Start Date.')

                # we only need to validate_before_after for task with parents
                # check that pin_start is later than sched_start
                #if pin is earlier than earliest possible start (from parent/pointing tasks), simply ignore pin start
                if not self.parent_tasks and not self.validate_before_after(self.sched_start, self.pin_start):
                    allow_move = False
                    logger.append(f'Pin Start Ignored. Pin start is earlier than earliest possible start from parent tasks.')
                    
                if allow_move:
                    # update task start
                    logger.append(f'Pin Start Honored. Start Date moved from {self.sched_start} to {self.pin_start}.')
                    self.sched_start = self.pin_start 
                    self.pin_honored = True

                    # confirm that there is valid timeframe to complete task, otherwise just push end date forward
                    if not self.validate_start_end_against_length(self.sched_start, self.sched_end, self.days_length):
                        # not enough time from pin start to today+days_length, so push up sched_end to be pin_start+days_length
                        new_sched_end = self.sched_start + timedelta(days = self.days_length)
                        logger.append(f'Pin Start-Schedule End Conflict. Insufficient time to complete task. Schedule End changed from {self.sched_end} to {new_sched_end}.')     
                        self.sched_end = new_sched_end      


        def handle_pin_end():
            if self.pin_end:
                allow_move = True
                logger.append(f'Processing Pinned End Date.')

                # everything takes precendence over pin_end, 
                # we will always ignore it in favor of any other calculation consideration

                # we only need to validate_before_after for task with parents
                # check that pin_end is later than sched_end
                # if pin end is before scheduled end (calculated from parent/pointing task or pinned start, ignore pin end, because that date is shorter task_length beginning after earliest pointing task's finish
                if not self.parent_tasks and not self.validate_before_after(self.sched_end, self.pin_end):
                    allow_move = False
                    logger.append(f'Pin End Ignored. Pin End is earlier than earliest possible end time from parent tasks.')
                
                if allow_move:
                    # ensure that enough time exists to complete task
                    # can only happen if pin end is very much in the future
                    if self.validate_start_end_against_length(self.sched_start, self.pin_end, self.days_length):
                        # update task end
                        logger.append(f'Pin End Honored. End Date moved from {self.sched_end} to {self.pin_end}.')
                        self.sched_end = self.pin_end
                        self.pin_honored = True                       
                    else:
                        # not enough time from scheduled start to pin_end, so push up sched_end to be pin_start+days_length
                        new_sched_end = self.sched_start + timedelta(days = self.days_length)
                        logger.append(f'Schedules Start-Pin End Conflict. Insufficient time to complete task. Schedule End changed from {self.sched_end} to {new_sched_end}.')
                        self.sched_end = new_sched_end
                        
                        #process conflict below, or:
                        #raise Exception(f'Invalid pinned time. Not enough time allocated for task. Defined dates: {self.sched_start} - {self.pin_end}. Task Length: {self.days_length}')
                        
                        
        
        logger = []
        logger.append(f'Task: #{self.id} {self.name}')

        # default task start is project.start, otherwise use today's date
        if not self.project:
            # if we're running before initial commit, project serialization not set create, so get project data manually
            project = Project.query.filter(Project.id == self.project_id).first()
            if not project:
                # if for any reason project start is not yet defined, use today's date for the task
                default_start = datetime.combine(datetime.now(), time.min) # use today as start
            else:
                default_start = project.start
        else:
            default_start = self.project.start
        logger.append(f'Default Start from Project: {default_start}')

        # Task: headless task
        if not self.parent_tasks:
            logger.append('Task: Headless Task')

            self.sched_start = default_start
            self.sched_end = self.sched_start + timedelta(days = self.days_length)

            # if task has a pinned start or end
            if self.pin_start:
                handle_pin_start()
            if self.pin_end:
                handle_pin_end()
        


        # Task: has parents/dependencies
        # if there are parent_tasks, then task can't be scheduled before its dependent parents.
        # get all parents
        # get latest end of all parents as instance's earliest start date
        # factor instances's own pins
        # update schedule

        else:
            logger.append('Task: Has dependents')
            earliest_start = default_start

            for parent in self.parent_tasks:
                # ensure that we can get parent's schedule end date
                if not parent.parent_task.sched_end:
                    raise Exception(f'Parent Task with TaskDependency ID: {parent.id} missing schedule end date. {parent.parent_task.name} {parent.parent_task.id}')
                
                logger.append(f'    Parent Task: {parent.parent_task.id} {parent.parent_task.name}')
                logger.append(f'    Parent End: {parent.parent_task.sched_end + timedelta(days=1)}')
                logger.append(f'    ----------------------------------------------')
                # Calculate the earliest start time for the child task, which is the latest of all parents
                earliest_start = max(
                    earliest_start,
                    parent.parent_task.sched_end + timedelta(days=1)  # child task to start day after completion of parent task
                )

            # earliest possible start date, based on all parent task completions
            # determine if completion actually changed
            if earliest_start != self.sched_start:
                pass
            self.sched_start = earliest_start
            logger.append(f'Earliest Start From Parents: {earliest_start}')

            # once we have determined correct start date, recalculate end_date
            self.sched_end = self.sched_start + timedelta(days=self.days_length)
            logger.append(f'End Date Using Parents: {self.sched_end}')

            # factor in task pinned start/end
            if self.pin_start:
                handle_pin_start()
            if self.pin_end:
                handle_pin_end()

        #return new_start
        #print(self.sched_start)
        print(*logger, sep='\n')
        return logger

    
    def __repr__(self):
        return f'<Task {self.name}>'
    

class TaskUpdate(db.Model, SerializerMixin):
    __tablename__ = "task_updates"
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    task_status = db.Column(db.String)
    message = db.Column(db.String)
    timestamp = db.Column(db.DateTime, server_default=db.func.now())

    task = db.relationship("Task", back_populates="updates")
    serialize_rules = ('-task',)

    def __repr__(self):
        return f'<TaskUpdate ID: {self.id}, Task: {self.task_id}, Status: {self.task_status}>'
    


class TaskUser(db.Model, SerializerMixin):
    __tablename__ = "task_users"
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def __repr__(self):
        return f'<TaskUser ID: {self.id}, Task: {self.task_id}, User: {self.user_id}>'
    

class TaskDependency(db.Model, SerializerMixin):
    __tablename__ = "task_dependencies"
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False) #child node
    dependent_task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False) #parent node (that must happen first)
    allow_complete_exception = db.Column(db.Boolean, default=False)

    __table_args__ = (
        db.UniqueConstraint('task_id','dependent_task_id'),
        db.CheckConstraint('task_id != dependent_task_id',name='tasknotmatchdependent')
    )

    # in a DAG relationship, from every task's perspective: 
    # it itself is the vertex/node, 
    # tasks dependent on it are edges, 
    # tasks it is dependent on are adjacent 
    #vertex = db.relationship('Task', back_populates="edges")
    #edge = db.relationship('Task', back_populates="adjacencies")
    #serialize_rules = ('-vertex.edges', '-edge.adjacencies')
    #vertex_link = db.relationship('Task', foreign_keys='TaskDependency.task_id', back_populates="edge_links")
    #vertex_link = db.relationship('Task', back_populates="edge_links")

    # Relationship to the child task (owner of this record)
    owner_task = db.relationship(
        "Task",
        foreign_keys=[task_id],
        back_populates="parent_tasks"
    )

    # Relationship to the parent task
    parent_task = db.relationship(              
        "Task",
        foreign_keys=[dependent_task_id],
        back_populates="children_tasks"
    )

    serialize_rules = ('-owner_task.parent_tasks','-parent_tasks.children_tasks')

    # validate dependency link before insertion to prevent recursion errors and DAG invalidation
    @validates('dependent_task_id')
    def validate_dependency(self, attr, value):
        task_model = Task.query.filter_by(id=self.task_id).first()
        if value not in [task.id for task in task_model.get_available()]:
            raise ValueError(f"Invalid Depedency Link. ID: {value} not in the available list.")
        return value
    
    def __repr__(self):
        return f'<TaskDependency ID: {self.id}, Task: {self.task_id}, DependentTask: {self.dependent_task_id}>'





def update_schedule(mapper, connection, target):
    # TODO: only run if there are changes to scheduling values
    target.calculate_schedule()

event.listen(Task, 'before_insert', update_schedule) #dependencies do not yet exist
event.listen(Task, 'before_update', update_schedule)

# FINAL NOTE: working. however, moved in favor of null on default and calculate simplisticly
# # FINAL: validate DAG as validates.
# # run event to update times after
# # Function to execute on save
# def update_timestamp(mapper, connection, target):
#     if not target.sched_start:
#         target.sched_start = datetime.combine(datetime.now(), time.min)
#     if not target.sched_end:
#         target.sched_end = datetime.combine(datetime.now(), time.min)
    
#     if not target.pin_start:
#         target.pin_start = datetime.combine(datetime.now(), time.min)
#     if not target.pin_end:
#         target.pin_end = datetime.combine(datetime.now(), time.min)

#     if not target.plan_start:
#         target.plan_start = datetime.combine(datetime.now(), time.min)
#     if not target.plan_end:
#         target.plan_end = datetime.combine(datetime.now(), time.min)

# # Attach the event listener
# #event.listen(Task, 'before_insert', update_timestamp)
# #event.listen(Task, 'before_update', update_timestamp)


# #@event.listens_for(Task, "after_insert")
# def update_dependencies_recursively(mapper, connection, target):
#     pass
#     #target.calculate_schedule()
#     #target.progress = target.progress+1
#     #recursively_process_dependencies(target)
#     # if target.children_tasks:
#     #     for child in target.children_tasks:
#     #         # ensure that we can get parent's schedule end date
#     #         if not child.child_task.id:
#     #             raise Exception(f'Fatal Error loading TaskDependency ID: {child.id}. Dependency: {child.child_task.name} {child.child_task.id}')
            
#     #         #print(f'{child.child_task.id} {child.child_task.name} {type(child.child_task)}')
#     #         #child.child_task.progress = 5
#     #         set_committed_value(child.child_task, 'progress', 5)
#     #         #child.child_task.calculate_schedule()
#     #         #print(f'Dependencies Updated')
    

# #event.listen(Task, 'before_insert', update_dependencies_recursively)
# #event.listen(Task, 'before_update', update_dependencies_recursively)

# # not in use, handled on app.py
# # def recursively_process_dependencies(self):
# #     #self.progress = 5
# #     #print('updated')

# #     if self.children_tasks:
# #         for child in self.children_tasks:
# #             # ensure that we can get parent's schedule end date
# #             if not child.owner_task.id:
# #                 raise Exception(f'Fatal Error loading TaskDependency ID: {child.id}. Dependency: {child.child_task.name} {child.child_task.id}')
# #             #child.child_task.progress = 5
# #             child.owner_task.calculate_schedule()
# #             print(f'Dependencies Updated')

