from sqlalchemy_serializer import SerializerMixin
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.orm import validates
from sqlalchemy.ext.hybrid import hybrid_property

from config import db, bcrypt

class User(db.Model, SerializerMixin):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    username = db.Column(db.String, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    _password = db.Column(db.String, nullable=False)

    @hybrid_property
    def password(self):
        raise AttributeError('Password is not readable')

    @password.setter
    def password(self, password):
        self._password = bcrypt.generate_password_hash(password.encode('utf-8')).decode('utf-8') 

    def verify_password(self, password):
        return bcrypt.check_password_hash(self._password, password.encode('utf-8'))

    completed_tasks = db.relationship('Task', back_populates="complete_user")
    serialize_rules = (
        '-completed_tasks.complete_user',
        '-completed_tasks.project',
        '-completed_tasks.group',
        '-completed_tasks.dependencies',
        '-completed_tasks.dependent_tasks',
        '-completed_tasks.dependency_links'
    )

    def __repr__(self):
        return f'<User {self.name}>'


class Project(db.Model, SerializerMixin):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True, nullable=False)

    groups = db.relationship('Group', back_populates="project")
    tasks = db.relationship('Task', back_populates="project")
    serialize_rules = (
        '-groups.project',
        '-groups.tasks',
        '-tasks.complete_user',
        '-tasks.project',
        '-tasks.group',
        '-tasks.dependencies',
        '-tasks.dependent_tasks',
        '-tasks.dependency_links'
    )

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
        '-tasks.dependent_tasks',
        '-tasks.dependency_links'
    )

    def __repr__(self):
        return f'<Group {self.name} (ID: {self.id}, Project: {self.project_id})>'



class Task(db.Model, SerializerMixin):
    __tablename__ = "tasks"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id'), nullable=False)
    plan_start = db.Column(db.DateTime, server_default=None, nullable=True)
    plan_end = db.Column(db.DateTime, server_default=None, nullable=True)
    pin_start = db.Column(db.DateTime, server_default=None, nullable=True)
    pin_end = db.Column(db.DateTime, server_default=None, nullable=True)
    pin_honored = db.Column(db.Boolean, default=False)
    sched_start = db.Column(db.DateTime, server_default=None, nullable=True)
    sched_end = db.Column(db.DateTime, server_default=None, nullable=True)
    days_length = db.Column(db.Integer, nullable=False)
    progress = db.Column(db.Integer, nullable=False, default=0)
    complete_status = db.Column(db.Boolean, default=False)
    complete_date = db.Column(db.DateTime, server_default=None, nullable=True)
    complete_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    complete_comment = db.Column(db.String)

    project = db.relationship('Project', back_populates="tasks")
    group = db.relationship('Group', back_populates="tasks")
    complete_user = db.relationship('User', back_populates="completed_tasks")
    
    serialize_rules = (
        '-dependent_tasks.parent_task', #block all
        '-dependency_links.dependent_task', #block all, allow parent_task (which is the owner of the dependency link)
        '-dependencies.parent_task', #block all
        '-project.tasks',
        '-project.groups',
        '-group.tasks',
        '-group.project',
        '-complete_user.completed_tasks'
    )


    # specific rules for dependency related
    #serialize_rules = ('-dependent_tasks.parent_task','-dependency_links.dependent_task','-dependencies.parent_task')
    #serialize_rules = ('-dependent_tasks','-dependency_links','-dependencies')


    # in a DAG relationship, from every task's perspective: 
    # it itself is the vertex/node, 
    # tasks dependent on it are edges, 
    # tasks it is dependent on are adjacent 

    # Relationship to TaskDependency for tasks where this is the parent
    dependent_tasks = db.relationship(
        "TaskDependency",
        foreign_keys="TaskDependency.task_id",
        back_populates="parent_task",
        cascade="all, delete-orphan"
    )

    # Relationship to TaskDependency for tasks where this is the dependent task
    dependency_links = db.relationship(
        "TaskDependency",
        foreign_keys="TaskDependency.dependent_task_id",
        back_populates="dependent_task"
    )

    # Association proxy to access dependent tasks directly
    # list of tasks that this task is dependent on (all TaskDependecy where task_id=self.id)
    dependencies = association_proxy(
        "dependent_tasks",                                          # connector
        "dependent_task",                                           # name of the model we're connecting to
        creator=lambda task: TaskDependency(dependent_task=task)    # function accepts object of the other independent class and returns the corresponding object of the 'connecting' class that made the connection possible. 
    )    

    
    def __repr__(self):
        return f'<Task {self.name}>'
    

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
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    dependent_task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    allow_complete_exception = db.Column(db.Boolean, default=False)

    # in a DAG relationship, from every task's perspective: 
    # it itself is the vertex/node, 
    # tasks dependent on it are edges, 
    # tasks it is dependent on are adjacent 
    #vertex = db.relationship('Task', back_populates="edges")
    #edge = db.relationship('Task', back_populates="adjacencies")
    #serialize_rules = ('-vertex.edges', '-edge.adjacencies')
    #vertex_link = db.relationship('Task', foreign_keys='TaskDependency.task_id', back_populates="edge_links")
    #vertex_link = db.relationship('Task', back_populates="edge_links")


    # Relationship to the parent task
    parent_task = db.relationship(
        "Task",
        foreign_keys=[task_id],
        back_populates="dependent_tasks"
    )

    # Relationship to the dependent task
    dependent_task = db.relationship(
        "Task",
        foreign_keys=[dependent_task_id],
        back_populates="dependency_links"
    )

    serialize_rules = ('-parent_task.dependent_tasks','-dependent_tasks.dependency_links')
    
    def __repr__(self):
        return f'<TaskDependency ID: {self.id}, Task: {self.task_id}, DependentTask: {self.dependent_task_id}>'
    