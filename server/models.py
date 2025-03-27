from sqlalchemy_serializer import SerializerMixin
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.orm import validates, Session
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm.attributes import set_committed_value
from sqlalchemy.orm import attributes
#from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy import event, func

from config import db, bcrypt
from helpers import get_next_monday, get_previous_monday

import json
import ipdb
from datetime import datetime, timedelta, time, date
from collections import defaultdict, deque

class User(db.Model, SerializerMixin):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    _password_hash = db.Column(db.String)
    selectedProject = db.Column(db.Integer, nullable=True)
    selectedUnit = db.Column(db.Integer, nullable=True)

    @hybrid_property
    def password_hash(self):
        raise AttributeError('Password is not readable')

    @password_hash.setter
    def password_hash(self, password):
        self._password_hash = bcrypt.generate_password_hash(password.encode('utf-8')).decode('utf-8') 

    def authenticate(self, password):
        return bcrypt.check_password_hash(self._password_hash, password.encode('utf-8'))

    completed_tasks = db.relationship('UnitTask', back_populates="complete_user")
    serialize_rules = (
        '-_password_hash',
        '-completed_tasks.complete_user',
        '-completed_tasks.unit',
        '-completed_tasks.unit_tasks'
    )

    @validates('email')
    def validate_email(self, key, value):
        if not value or User.query.filter(User.email == value).first() != None:
            raise ValueError('Email must be unique')
        return value
    

    def handle_project_change(self):
        if self.selectedProject:
            # check that current selectedUnit is valid
            unit_in_project = Unit.query.filter(Unit.id==self.selectedUnit).filter(Unit.project_id==self.selectedProject).first()
            if unit_in_project == None:
                get_project_default_unit = Unit.query.filter(Unit.project_id==self.selectedProject).first()
                if get_project_default_unit != None:
                    self.selectedUnit = get_project_default_unit.id
                else:
                    # selected project has no units
                    self.selectedUnit = None

    def __repr__(self):
        return f'<User {self.name}>'

class Project(db.Model, SerializerMixin):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True, nullable=False)
    start = db.Column(db.DateTime, nullable=True, server_default=db.func.now()) #default=datetime.strptime("2025-01-05", "%Y-%m-%d")
    end = db.Column(db.DateTime, nullable=True, server_default=db.func.now())
    project_type = db.Column(db.String, default="house")
    description = db.Column(db.String, nullable=True)

    groups = db.relationship('Group', back_populates="project")
    units = db.relationship('Unit', back_populates="project")
    master_tasks = db.relationship('MasterTask', back_populates="project")

    serialize_rules = (
        'stats',
        'schedule',
        '-groups.project',
        '-groups.master_tasks',
        '-units.project',
        # '-units.unit_tasks',
        '-units.unit_tasks.unit',
        '-master_tasks.project',
        '-master_tasks.group',
        '-master_tasks.parents',
        '-master_tasks.children',
        '-master_tasks.unit_tasks'
    )

    @property
    def schedule(self):
        #dataset = self.tasks
        dataset = [unit_task for unit_task in UnitTask.query.join(MasterTask, MasterTask.id == UnitTask.task_id).filter(MasterTask.project_id == self.id).all()]
        
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
        return get_stats(self)
        

    def __repr__(self):
        return f'<Project {self.name} (ID: {self.id})>'


def get_stats(model):
    if isinstance(model, Project):
        # for project
        base_query = db.session.query(func.count(UnitTask.id)).join(MasterTask, MasterTask.id == UnitTask.task_id).filter(MasterTask.project_id == model.id)
    elif isinstance(model, Unit):
        # for unit
        base_query = db.session.query(func.count(UnitTask.id)).join(MasterTask, MasterTask.id == UnitTask.task_id).filter(UnitTask.unit_id == model.id)
    else:
        raise Exception('Unsupported Model Instance')


    today = date.today()
    previous_monday = get_previous_monday()
    next_monday = get_next_monday()

    get_completed = base_query.filter(UnitTask.complete_status == True)
    get_upcoming = base_query.filter(UnitTask.complete_status == False).filter(UnitTask.sched_start < today).filter(UnitTask.sched_start > today-timedelta(days=7))
    get_overdue = base_query.filter(UnitTask.complete_status == False).filter(UnitTask.sched_end < today)

    count_project_total = base_query.first()[0]
    count_project_completed = get_completed.first()[0]
    count_project_overdue = get_overdue.first()[0]
    count_project_upcoming = get_upcoming.first()[0]
    
    count_week_scheduled = base_query.filter(UnitTask.sched_start > previous_monday).filter(UnitTask.sched_start < next_monday).first()[0]
    count_week_scheduled_completed = get_completed.filter(UnitTask.sched_start > previous_monday).filter(UnitTask.sched_start < next_monday).first()[0]
    count_week_completed = get_completed.filter(UnitTask.complete_date > previous_monday).filter(UnitTask.complete_date < next_monday).first()[0]

    # calculate project completion percentage
    if count_project_completed == 0 or count_project_total == 0:
        completion_percent = 0
    else:
        completion_percent = int((count_project_completed / count_project_total)*100)
    
    # define model (project/unit) completion status
    # options: on_schedule, in_progress, delayed, completed, pre
    if count_project_total == 0:
        model_status = "planning"
    elif count_project_completed == count_project_total:
        model_status = "completed"
    elif base_query.filter(UnitTask.complete_status == False).filter(UnitTask.sched_end < today).first()[0] > 0:
        # if there are any tasks that completed=False and sched_end is smaller than today = should have been completed already
        model_status = "delayed" 
    elif base_query.filter(UnitTask.complete_status == False).filter(UnitTask.sched_end < today).first()[0] <= 0:
        model_status = "on_schedule"
    else:
        model_status = "in_progress" # default catch-all
        
    stats = {
        "status": model_status,
        "completion_percent": completion_percent,
        "counts": {
            "count_tasks": count_project_total,
            "count_completed": count_project_completed,
            "count_overdue": count_project_overdue,
            "count_upcoming": count_project_upcoming,
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

class Group(db.Model, SerializerMixin):
    __tablename__ = "groups"
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    name = db.Column(db.String)

    project = db.relationship('Project', back_populates="groups")
    master_tasks = db.relationship('MasterTask', back_populates="group")
    serialize_rules = (
        '-project.groups',
        '-project.units',
        '-project.master_tasks',
        '-master_tasks.project',
        '-master_tasks.group',
        '-master_tasks.parents',
        '-master_tasks.children'
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



class MasterTask(db.Model, SerializerMixin):
    __tablename__ = "master_tasks"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id'), nullable=False)
    days_length = db.Column(db.Integer, nullable=False)
    pin_start = db.Column(db.DateTime, default=None, nullable=True)
    pin_end = db.Column(db.DateTime, default=None, nullable=True)

    project = db.relationship('Project', back_populates="master_tasks")
    group = db.relationship('Group', back_populates="master_tasks")
    unit_tasks = db.relationship('UnitTask', back_populates="master_task")

    serialize_rules = (
        '-parent_tasks',
        '-children_tasks',
        '-children',
        # '-children.owner_task', #copied rules from dependencies
        # '-children.children_tasks', #copied rules from dependencies
        # '-children.parent_task', #copied rules from dependencies
        # '-children.parent_tasks', #copied rules from dependencies
        #'-children.dependencies', #copied rules from dependencies
        '-parents',
        # '-parents.owner_task', #copied rules from dependencies
        # '-parents.children_tasks', #copied rules from dependencies
        # '-parents.parent_task', #copied rules from dependencies
        # '-parents.parent_tasks', #copied rules from dependencies
        #'-parents.dependencies', #copied rules from dependencies
        #'dependencies', #default does not serializer association proxy
        #'-parent_tasks.owner_task', #avoid recursion
        #'-children_tasks.parent_task', #avoid recursion
        #'-children_tasks.owner_task.children_tasks', #avoid nested recursive data (a tasks child's owner is itself... so don't show it's child all over again)
        #'-children_tasks.owner_task.dependencies', #avoid nested recursive data (a tasks child's owner is itself... so don't show dependencies)
        #'-dependencies.owner_task',
        #'-dependencies.children_tasks',
        #'-dependencies.parent_task',
        #'-dependencies.parent_tasks',
        #'-dependencies.dependencies',
        '-unit_tasks.unit',
        '-unit_tasks.master_task',
        '-unit_tasks.complete_user',
        '-unit_tasks.updates',
        #'-unit_tasks.dependencies',
        '-unit_tasks.parents',
        '-unit_tasks.children',
        #'-project', #block all
        #'-group', #block all
        '-project.master_tasks',
        '-project.units',
        '-project.groups',
        '-project.stats',
        '-project.schedule',
        '-group.master_tasks',
        '-group.project'
    )

    @validates('days_length')
    def validate_days_length(self, key, value):
        if not isinstance(value, int):
            try:
                return int(value)
            except ValueError:
                raise ValueError('Days length must be an integer')
        return value
    
    # validates date inputs
    @validates('pin_start','pin_end')
    def validate_dates(self, attr, value):
        if not isinstance(value, datetime):
            for format in ('%Y-%m-%d', '%Y-%m-%d %H:%M:%S'):
                try:
                    return datetime.strptime(value, format)
                except ValueError:
                    pass
            raise ValueError(f'{attr} must be a valid date.')
        return value
    
    
    # in a DAG relationship, from every task's perspective: 
    # it itself is the vertex/node, 
    # tasks dependent on it are edges, 
    # tasks it is dependent on are adjacent 

    # MasterTaskDependency is owned by the child of the DAG relationship (dependent_task_id is the dependencies (parent node)) 
    
    # Relationship to MasterTaskDependency for tasks where this is the owner of the record, which is the parent in the dependency relationship 
    parent_tasks = db.relationship(
       "MasterTaskDependency",
        foreign_keys="MasterTaskDependency.task_id",
        back_populates="owner_task",
        cascade="all, delete-orphan"
    )

    # Relationship to MasterTaskDependency for tasks where this is the dependent task in the record, which is the children of the dependency relationship
    children_tasks = db.relationship(
        "MasterTaskDependency",
        foreign_keys="MasterTaskDependency.dependent_task_id",
        back_populates="parent_task"
    )

    # REPLACED BY PARENTS
    # Association proxy to access dependent tasks directly
    # list of tasks that this task is dependent on (all TaskDependecy where task_id=self.id)
    # essentially just a prettier version of parent_tasks (without the joining table)
    # dependencies = association_proxy(
    #     "parent_tasks",                                         # connector
    #     "parent_task",                                          # name of the model we're connecting to
    #     creator=lambda task: MasterTaskDependency(parent_task=task)   # function accepts object of the other independent class and returns the corresponding object of the 'connecting' class that made the connection possible. 
    # )

    ################################################################
    # 03/26/2025 
    # ideally, we should only use these values across the board, and slowly deprecate:
    # dependencies
    # parent_tasks.parent_task
    # children_tasks.owner_task
    ################################################################

    # Association proxy to access dependent tasks directly
    # list of tasks that this task is dependent on (all TaskDependecy where task_id=self.id)
    # essentially just a prettier version of parent_tasks (without the joining table)
    # === this was previously called dependencies (prior to 03/26/2025)
    parents = association_proxy(
        "parent_tasks",                                         # connector
        "parent_task",                                          # name of the model we're connecting to
        creator=lambda task: MasterTaskDependency(parent_task=task)   # function accepts object of the other independent class and returns the corresponding object of the 'connecting' class that made the connection possible. 
    )

    children = association_proxy(
        "children_tasks",                                         # connector
        "owner_task",                                             # name of the model we're connecting to
        creator=lambda task: MasterTaskDependency(owner_task=task)   # function accepts object of the other independent class and returns the corresponding object of the 'connecting' class that made the connection possible. 
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
        all_tasks = set([task for task in MasterTask.query.filter(MasterTask.id != self.id).filter(MasterTask.project_id == self.project_id).all()])
        available_tasks_set = all_tasks - ancestors - descendents
        return available_tasks_set
    

    # this function is not used, precursor for UniTask.build_unit_tasklist()
    # notations may not be accurate
    @classmethod
    def topological_sort(cls, project_id):
        from collections import defaultdict, deque
        from datetime import datetime, timedelta

        master_tasks = MasterTask.query.filter(MasterTask.project_id==project_id).all()

        # In a DAG, "in-degree" of a node refers to the number of directed edges that are coming into that node, 
        # essentially representing how many other nodes are pointing to it; 
        # it's a measure of how many dependencies a node has within the graph
        # 
        # "DAG adjacency" refers to the concept of neighboring nodes (considered "adjacent") within a 
        # Directed Acyclic Graph (DAG), where a node is considered adjacent to another if there 
        # is a directed edge connecting them, 
        # meaning one node "points" to the other in the graph, with no cyclic dependencies between nodes; 
        # essentially, it describes the relationship between nodes in a DAG based on the direction of 
        # their connections.
        # Imagine a DAG representing a workflow with tasks as nodes: 
        # If task A needs to be completed before task B can start, then A is considered "adjacent" to B, 
        # meaning there is a directed edge going from A to B.

        in_degree = defaultdict(int) #count amount of dependencies in a task (incoming edges)
        adjacency_list = defaultdict(list) #list of tasks pointing to a dependency

        # Step 1: Calculate in-degrees and construct the adjacency list
        for task in master_tasks:
            # Initialize in-degree for the current task
            in_degree[task.id] = in_degree.get(task.id, 0)
            # task.parents are dependecies
            for dependency in task.parents:
                adjacency_list[dependency.id].append(task) #task.id
                in_degree[task.id] += 1

        # Step 2: Collect all tasks with in-degree 0 (tasks with no dependencies) for initial adding
        zero_in_degree = deque([task for task in master_tasks if in_degree[task.id] == 0])

        # Step 3: Process tasks with in-degree 0
        top_order = []
        while zero_in_degree:
            # 3.1: add tasks that have no dependencies
            current_task = zero_in_degree.popleft()
            top_order.append(current_task)

            # Reduce the in-degree of dependent tasks
            # 3.2: process dependent tasks 
            # get list of tasks that point to this task
            for dependent_task in adjacency_list[current_task.id]:
                
                # subtract -1 to account for the parent task that points to this
                in_degree[dependent_task.id] -= 1  # Step 1: Reduce the in-degree of each dependent task

                # this dependent task has no other dependencies
                if in_degree[dependent_task.id] == 0: # Step 2: Check if this dependent task now has no incoming edges (all depedendencies are resolved)
                    zero_in_degree.append(dependent_task) # Step 3: Add it to the processing queue (tasks with no incoming edges)

        # Step 4: Check for cycles (if the graph isn't a DAG)
        if len(top_order) != len(master_tasks):
            raise ValueError("The graph contains cycles and is not a valid DAG.")
        
        return top_order


    def __repr__(self):
        return f'<MasterTask {self.name}>'
    

class TaskUser(db.Model, SerializerMixin):
    __tablename__ = "task_users"
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('master_tasks.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def __repr__(self):
        return f'<TaskUser ID: {self.id}, Task: {self.task_id}, User: {self.user_id}>'
    

class MasterTaskDependency(db.Model, SerializerMixin):
    __tablename__ = "master_task_dependencies"
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('master_tasks.id'), nullable=False) #child node
    dependent_task_id = db.Column(db.Integer, db.ForeignKey('master_tasks.id'), nullable=False) #parent node (that must happen first)
    
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
        "MasterTask",
        foreign_keys=[task_id],
        back_populates="parent_tasks"
    )

    # Relationship to the parent task
    parent_task = db.relationship(              
        "MasterTask",
        foreign_keys=[dependent_task_id],
        back_populates="children_tasks"
    )

    serialize_rules = ('-owner_task.parent_tasks','-parent_tasks.children_tasks')

    # validate dependency link before insertion to prevent recursion errors and DAG invalidation
    @validates('dependent_task_id')
    def validate_dependency(self, attr, value):
        task_model = MasterTask.query.filter_by(id=self.task_id).first()
        if value not in [task.id for task in task_model.get_available()]:
            raise ValueError(f"Invalid Depedency Link. ID: {value} not in the available list.")
        return value
    
    def __repr__(self):
        return f'<MasterTaskDependency ID: {self.id}, Task: {self.task_id}, DependentTask: {self.dependent_task_id}>'


class Unit(db.Model, SerializerMixin):
    __tablename__ = "units"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    start = db.Column(db.DateTime, default=None, nullable=True)
    end = db.Column(db.DateTime, default=None, nullable=True)
    status = db.Column(db.String)

    project = db.relationship('Project', back_populates="units")
    unit_tasks = db.relationship('UnitTask', back_populates="unit", order_by="UnitTask.sched_start")

    serialize_rules = (
        'stats',
        '-project.groups',
        '-project.units',
        '-project.master_tasks',
        '-unit_tasks.unit',
        '-unit_tasks.master_task',
        '-unit_task.complete_user',
        '-unit_task.updates'
    )

    @property
    def stats(self):
        return get_stats(self)

    def __repr__(self):
        return f'<Unit ID: {self.id}, Project: {self.project_id}, Name: {self.name}>'


    # builds out Unit specific copy for all project tasks
    def build_tasklist(self):
        
        # ensure that there are not other unit_tasks associated with this unit yet.
        if self.unit_tasks:
            raise ValueError(f'Could not build tasklist, tasks already exist for this Unit.')
        
        def create_unit_task(master_task, start_date):
            unit_task = UnitTask(unit_id=self.id,task_id=master_task.id)
            unit_task.sched_start = start_date
            unit_task.sched_end = unit_task.sched_start + timedelta(days = master_task.days_length)
            db.session.add(unit_task)
                
            unit_tasks.append(unit_task)
            processed_tasks.append(master_task)
            processed_list[master_task.id] = unit_task
            return unit_task
        
        # In a DAG, "in-degree" of a node refers to the number of directed edges that are coming into that node, 
        # essentially representing how many other nodes are pointing to it; 
        # it's a measure of how many dependencies a node has within the graph
        # 
        # "DAG adjacency" refers to the concept of neighboring nodes (considered "adjacent") within a 
        # Directed Acyclic Graph (DAG), where a node is considered adjacent to another if there 
        # is a directed edge connecting them, 
        # meaning one node "points" to the other in the graph, with no cyclic dependencies between nodes; 
        # essentially, it describes the relationship between nodes in a DAG based on the direction of 
        # their connections.
        # Imagine a DAG representing a workflow with tasks as nodes: 
        # If task A needs to be completed before task B can start, then A is considered "adjacent" to B, 
        # meaning there is a directed edge going from A to B.

        # Initialize dicts and lists
        in_degree = defaultdict(int) #count amount of dependencies in a task (incoming edges)
        parent_list = defaultdict(list) #dict with list of parent tasks (in-degrees)
        processed_list = defaultdict(list) #dict of UnitTasks using key of MasterTask
        unit_tasks = [] #list to final UnitTasks
        processed_tasks = [] #list of Tasks that have been processed off tasks_to_process
        
        # Step 1: Get all master tasks for indicated project
        master_tasks = MasterTask.query.filter(MasterTask.project_id==self.project_id).all()

        # Step 2: Calculate in-degrees and construct the parent (in-degree) list
        for task in master_tasks:
            # Initialize in-degree for the current task
            in_degree[task.id] = in_degree.get(task.id, 0)
            for parent_link in task.parent_tasks:
                parent_list[task.id].append(parent_link.parent_task)
                in_degree[task.id] += 1

        # Step 3: Collect all tasks putting those with in-degree=0 (tasks with no dependencies) first
        tasks_to_process = deque(sorted(master_tasks, key=lambda task: in_degree[task.id] == 0, reverse=True))
        
        # run through tasks_to_process
        # current_task.popleft, 
        # check if parent tasks have scheds yet, 
        # if yes, run max compare, and add to processed_list
        # if not, append and continue the merry-go-round
        
        # Step 4: Process tasks
        while tasks_to_process:
            current_task = tasks_to_process.popleft()
            
            # Step 4.1: add tasks that have no incoming edges (parents)
            if in_degree[current_task.id] == 0:
                #print(f"========> pushing because HEADLESS {current_task}")
                start_date = datetime.combine(datetime.now(), time.min) # use today as start
                unit_task = create_unit_task(current_task, start_date)

            else:
                # Step 4.2: Process tasks that have parents 
                
                #unify both, use all to determine the merrygoround
                #commit at end
                #NoneType def master_task.name

                # if all parents of this task have already been processed (first headless with single parent)
                parents = parent_list[current_task.id]
                parents_set = set(parents)
                if all(parent_task in processed_tasks for parent_task in parents_set):
                    #print(f"========> pushing because all parents are procesed {current_task}")
                    default_start = datetime.combine(datetime.now(), time.min) # use today as start
                    earliest_start = default_start
                    processed_parents = [processed_parent for processed_parent in parents if processed_parent in parents]
                    for parent_task in processed_parents:
                        parent_unit_task = processed_list[parent_task.id]
                        earliest_start = max(
                            earliest_start,
                            parent_unit_task.sched_end + timedelta(days=1)  # child task to start day after completion of parent task
                        )
                        
                        unit_task = create_unit_task(current_task, earliest_start)
                else:
                    # some of parents are not yet procceed, simply pop back on to the merry-go-round
                    # push it back onto the stack to continue the merry-go-round
                    
                    default_start = datetime.combine(datetime.now(), time.min) # use today as start
                    earliest_start = default_start
                    processed_parents = [processed_parent for processed_parent in parents if processed_parent in parents]
                    for parent_task in processed_parents:
                        #ipdb.set_trace()
                        parent_unit_task = processed_list[parent_task.id]
                        earliest_start = max(
                            earliest_start,
                            parent_unit_task.sched_end + timedelta(days=1)  # child task to start day after completion of parent task
                        )

                        unit_task = create_unit_task(current_task, earliest_start)
                        
                    tasks_to_process.append(current_task)

        try:
            db.session.commit()
        except Exception as e:
            raise Exception(e)
        
        #ipdb.set_trace()
        return unit_tasks



class UnitTask(db.Model, SerializerMixin):
    def __repr__(self):
        if self.master_task:
            task_name = self.master_task.name
            sched_start = datetime.strftime(self.sched_start, "%Y-%m-%d")
            sched_end = datetime.strftime(self.sched_end, "%Y-%m-%d")
            master_task = f'TaskName: {task_name}, SchedStart: {sched_start} SchedEnd: {sched_end}'
            master_task = "Loading"
        else:
            master_task = "N/A"
        return f'<TaskUnit ID: {self.id} MasterTask: {master_task}>'

    __tablename__ = "unit_tasks"
    id = db.Column(db.Integer, primary_key=True)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('master_tasks.id'), nullable=False)
    sched_start = db.Column(db.DateTime, default=None, nullable=True)
    sched_end = db.Column(db.DateTime, default=None, nullable=True)
    pin_start = db.Column(db.DateTime, default=None, nullable=True)
    pin_end = db.Column(db.DateTime, default=None, nullable=True)
    pin_honored = db.Column(db.Boolean, default=False)
    progress = db.Column(db.Integer, nullable=False, default=0)
    started_status = db.Column(db.Boolean, default=False)
    started_date = db.Column(db.DateTime, default=None, nullable=True)
    complete_status = db.Column(db.Boolean, default=False)
    complete_date = db.Column(db.DateTime, default=None, nullable=True)
    complete_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    complete_comment = db.Column(db.String)
    
    unit = db.relationship('Unit', back_populates="unit_tasks")
    master_task = db.relationship('MasterTask', back_populates="unit_tasks")
    complete_user = db.relationship('User', back_populates="completed_tasks")
    updates = db.relationship("StatusUpdate", back_populates="unit_task", order_by="StatusUpdate.timestamp")

    @property
    def latest_update(self):
        if result := StatusUpdate.query.filter(StatusUpdate.task_id == self.id).order_by(StatusUpdate.timestamp.desc()).first():
            return {
                "id": result.id,
                "status": result.task_status,
                "timestamp": result.timestamp,
            }
            
    @latest_update.setter
    def latest_update(self):
        raise AttributeError('latest update is read-only')


    # # TODO: remove
    # @property
    # def dependencies(self):
    #     # Get this unit's UnitTasks corresponding to the MasterTask's dependencies (parent tasks)
    #     # deps = []
    #     # for master_dependency in self.master_task.dependencies:
    #     #     for dependent_ut in master_dependency.unit_tasks:
    #     #         if dependent_ut.unit_id == self.unit_id:
    #     #             deps.append(dependent_ut)
    #     # return deps
    #     return [dependent_ut for master_dependency in self.master_task.dependencies for dependent_ut in master_dependency.unit_tasks if dependent_ut.unit_id == self.unit_id]

    # #TODO: remove
    # @dependencies.setter
    # def dependencies(self):
    #     raise AttributeError('UnitTask dependencies is read-only')
    

    # dependencies
    @property
    def parents(self):
        # Get this unit's UnitTasks corresponding to the MasterTask's dependencies (parent tasks)
        # deps = []
        # for master_dependency in self.master_task.dependencies:
        #     for dependent_ut in master_dependency.unit_tasks:
        #         if dependent_ut.unit_id == self.unit_id:
        #             deps.append(dependent_ut)
        # return deps
        return [dependent_ut for master_dependency in self.master_task.parents for dependent_ut in master_dependency.unit_tasks if dependent_ut.unit_id == self.unit_id]

    @parents.setter
    def parents(self):
        raise AttributeError('UnitTask parents/dependencies is read-only')


    @property
    def children(self):
        # Get this unit's UnitTasks corresponding to the MasterTask's children
        # deps = []
        # for master_child in self.master_task.children:
        #     for dependent_ut in master_child.unit_tasks:
        #         if dependent_ut.unit_id == self.unit_id:
        #             deps.append(dependent_ut)
        # return deps
        return [dependent_ut for master_child in self.master_task.children for dependent_ut in master_child.unit_tasks if dependent_ut.unit_id == self.unit_id]

    @children.setter
    def children(self):
        raise AttributeError('UnitTask children is read-only')    
   

    serialize_rules = (
        #'latest_update',
        #'dependencies', #should be removed one day soon...
        #'-dependencies.dependencies', #should be removed one day soon...
        'parents',
        '-parents.parents',
        '-parents.children',
        'children',
        '-children.parents',
        '-children.children',
        '-master_task.parent_tasks',
        '-master_task.children_tasks',
        '-master_task.parents',
        '-master_task.children',
        '-master_task.unit_tasks',
        '-unit.project',
        '-unit.unit_tasks',
        '-complete_user.completed_tasks',
        '-complete_user._password',
        '-updates.unit_task'
    )


    # validate date inputs
    @validates('pin_start','pin_end','sched_start','sched_end','started_date','complete_date')
    def validate_dates(self, attr, value):
        if not isinstance(value, datetime):
            for format in ('%Y-%m-%d', '%Y-%m-%d %H:%M:%S'):
                try:
                    return datetime.strptime(value, format)
                except ValueError:
                    pass
            raise ValueError(f'{attr} must be a valid date.')
        return value
    
    

    
    # function to be ran after updating task as completed, to set start date of all children tasks to be the following date
    def mark_children_started(self):
        # ensure that task is completed
        if self.complete_status != True or not isinstance(self.complete_date, date):
            return
            raise ValueError('Task must be completed before beginning children tasks.')
        
        # ensure that children exist
        if self.children:
            for child_task in self.children:
                # if child is not completed yet, set start date of child to be the following day
                if child_task.complete_status != True and not isinstance(child_task.complete_date, date):
                    if child_task.started_status != True and not isinstance(child_task.started_date, date):
                        child_task.started_status = True
                        child_task.started_date = self.complete_date + timedelta(days=1)
                        db.session.commit()
        #             else:
        #                 raise ValueError(f'Child Task "{child_task.id}" is already started.')
        #         else:
        #             raise ValueError(f'Child Task "{child_task.id}" is already completed.')
        # else:
        #     raise ValueError("Final task. No children to begin")





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
        if not MasterTask.validate_before_after(start, end):  
            if not exception_response:
                return False
            else:
                raise Exception("Invalid times. Start can't be before end")
        else:
            # ensure timeframe is large enough for task.
            days_allocated = MasterTask.get_difference_days(start,end)
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
        # function is not to be used, because we are no longer using schedule calculations (03/26/2025)
        # using simple started_date instead.
        return
        
        def handle_pin_start():
            if self.pin_start:
                allow_move = True
                logger.append(f'Processing Pinned Start Date.')

                # we only need to validate_before_after for task with parents
                # check that pin_start is later than sched_start
                #if pin is earlier than earliest possible start (from parent/pointing tasks), simply ignore pin start
                if not self.master_task.parent_tasks and not self.validate_before_after(self.sched_start, self.pin_start):
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
                if not self.master_task.parent_tasks and not self.validate_before_after(self.sched_end, self.pin_end):
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
            

        def handle_completed_task():
            logger.append(f'Task Completed. Recalculating sched_end date')
            # since task is already completed, we dont need to factor days_length 
            # sched_end must only be after sched_start. so we want the earlier of sched_end or complete_date 
            earliest_end = min(
                self.complete_date,
                self.sched_end
            )
            # check that earliest_end is after sched_start
            if self.validate_before_after(self.sched_start, earliest_end):
                self.sched_end = earliest_end
                logger.append(f'Task completed, using earliest sched_end date: {self.sched_end}')
            else:
                # otherwise stay with current sched_end (determined from start+days_length)
                #pass 

                # if task was completed before it was scheduled, sched_end should be same day as start
                self.sched_end = self.sched_start
                logger.append(f'Task was completed before scheduled to begin. Start & Ends on same day.')
                        
        
        logger = []
        logger.append(f'##################################################')
        logger.append(f'UnitTask: #{self.id}')

        # ensure that master task is found
        if not self.master_task:
            logger.append('No Master Task Found')
            return logger
        
        logger.append(f'Task: #{self.master_task.id} {self.master_task.name}')

        # default task start is project.start, otherwise use today's date
        if not self.master_task.project:
            # if we're running before initial commit, project serialization not set create, so get project data manually
            project = Project.query.filter(Project.id == self.master_task.project_id).first()
            if not project:
                # if for any reason project start is not yet defined, use today's date for the task
                default_start = datetime.combine(datetime.now(), time.min) # use today as start
            else:
                default_start = project.start
        else:
            default_start = self.master_task.project.start
        logger.append(f'Default Start from Project: {default_start}')


        # Task: headless task
        if not self.master_task.parent_tasks:
            logger.append('Task: Headless Task')

            self.sched_start = default_start
            self.sched_end = self.sched_start + timedelta(days = self.master_task.days_length) 

            # if task has a pinned start or end
            if self.pin_start:
                handle_pin_start()
            if self.pin_end:
                handle_pin_end()
            
            # if task is already completed, override all calculations to make sched_end date to be task completion date as long as it is after sched_start.
            if self.complete_status == True and isinstance(self.complete_date, date):
                handle_completed_task() 
        


        # Task: has parents/dependencies
        # if there are parent_tasks, then task can't be scheduled before its dependent parents.
        # get all parents
        # get latest end of all parents as instance's earliest start date
        # factor instances's own pins
        # update schedule

        else:
            logger.append('Task: Has dependencies. Looping through each parent task to determine latest end date of all parents.')
            earliest_start = default_start

            for parent in self.master_task.parent_tasks:
                # using the master_tasks's parent_task, get the corresponding UnitTask's (for this unit) sched_end
                parent_unit_task = UnitTask.query.filter(UnitTask.task_id == parent.parent_task.id).first()
                
                # ensure that a UnitTask is found for master task's parent_task
                #if not self.unit_id in parent.parent_task.unit_tasks:
                if not parent_unit_task:
                    raise Exception(f'Task is dependent on another task not found in Unit Task List.')
                
                # ensure that we can get parent's schedule end date
                #if not parent.parent_task.sched_end:
                #    raise Exception(f'Parent Task with TaskDependency ID: {parent.id} missing schedule end date. {parent.parent_task.name} {parent.parent_task.id}')
                if not parent_unit_task.sched_end:
                    raise Exception(f"Parent Task with TaskDependency ID: {parent.id}'s UnitTask missing schedule end date. {parent_unit_task.master_task.name} {parent_unit_task.master_task.id}")
                
                logger.append(f'    Parent Task: {parent_unit_task.master_task.id} {parent_unit_task.master_task.name}')
                logger.append(f'    Parent End: {parent_unit_task.sched_end + timedelta(days=1)}')
                logger.append(f'    ----------------------------------------------')
                # Calculate the earliest start time for the child task, which is the latest of all parents
                earliest_start = max(
                    earliest_start,
                    parent_unit_task.sched_end + timedelta(days=1)  # child task to start day after completion of parent task
                )

            # earliest possible start date, based on all parent task completions
            # determine if completion actually changed
            if earliest_start != self.sched_start:
                pass
            self.sched_start = earliest_start
            logger.append(f'Earliest Start From Parents: {earliest_start}')

            # once we have determined correct start date, recalculate end_date
            self.sched_end = self.sched_start + timedelta(days=self.master_task.days_length)
            logger.append(f'End Date Using Parents: {self.sched_end}')

            # factor in task pinned start/end
            if self.pin_start:
                handle_pin_start()
            if self.pin_end:
                handle_pin_end()

            # if task is already completed, override all calculations to make sched_end date to be task completion date as long as it is after sched_start.
            if self.complete_status == True and isinstance(self.complete_date, date):
                handle_completed_task()


        #return new_start
        #print(self.sched_start)
        print(*logger, sep='\n')
        return logger
    

class StatusUpdate(db.Model, SerializerMixin):
    __tablename__ = "status_updates"
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('unit_tasks.id'), nullable=False)
    task_status = db.Column(db.Integer, nullable=False)
    message = db.Column(db.String)
    timestamp = db.Column(db.DateTime, server_default=db.func.now())

    unit_task = db.relationship("UnitTask", back_populates="updates")
    serialize_rules = ('-unit_task',)

    @validates('task_id')
    def validate_task(self, key, value):
        if not value or UnitTask.query.filter(UnitTask.id == value).first() == None:
            raise ValueError('Status must be linked to valid task')
        return value
    
    @validates('task_status')
    def validate_status(self, key, value):
        if not value or not isinstance(value, int):
            raise ValueError('Status must be an integer')
        return value

    def __repr__(self):
        return f'<StatusUpdate ID: {self.id}, Task: {self.task_id}, Status: {self.task_status}>'





def update_schedule_insert(mapper, connection, target):
    # target.calculate_schedule(allow_null)
    pass
    # we insert with calculate predone.

def update_schedule_update(mapper, connection, target):
    # TODO: only run if there are changes to scheduling values
    target.calculate_schedule()

def handle_project_change(mapper, connection, target):
    target.handle_project_change()
event.listen(User, 'before_update', handle_project_change)

event.listen(UnitTask, 'before_insert', update_schedule_insert)
event.listen(UnitTask, 'before_update', update_schedule_update)





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

