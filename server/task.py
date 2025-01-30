from datetime import datetime

class Task:
    tasks = {}

    def __repr__(self):
        #return f'<Task ID: {self.id}, Name: {self.name}, Days: {self.days_length}. Date: {self.start} - {self.end}, Deps: {len(self.dependencies)}>'
        pin_status = ""
        if self.pin_start or self.pin_end:
            if self.pin_honored:
                pin_status = " PINNED"
            else:
                pin_status = " IGNORED"
        
        return f'<Task ID: {self.id}, Name: {self.name}, Days: {self.days_length}. Schedule: {self.sched_start.strftime("%Y-%m-%d") if isinstance(self.sched_start, datetime) else self.sched_start} - {self.sched_end.strftime("%Y-%m-%d") if isinstance(self.sched_end, datetime) else self.sched_end}{pin_status}, Deps: {len(self.dependencies)}>'
        #return f'<Task: {self.name}>'

    def __init__(self, id, name, plan_start, plan_end, days_length, progress, dependencies = [], pin_start=False, pin_end=False, sched_start=False, sched_end=False):
        self.id = id
        self.name = name
        self.plan_start = plan_start #initial planning
        self.plan_end = plan_end #initial planning
        self.pin_start = pin_start #pin on initial
        self.pin_end = pin_end #pin on initial
        self.pin_honored = False #pin honored on schedule
        self.sched_start = "" #actual, to be updated by system
        self.sched_end = "" #actual, to be updated by system
        self.days_length = days_length
        self.progress = progress
        #self.dependencies = self.build_dependencies(dependencies)
        self.dependencies = dependencies
        self.__class__.tasks[self.id] = self

    # TODO: once we have Tasks persisting in DB, we must build_dependencies in the Tasks Model, 
    # with an obvious constraint that dependent task must already exist

    # # replaces task.dependencies list containing id with list of task objects 
    # # TODO: add as propery decorator 
    # # TODO: throw Error if task not found in class.tasks
    # def build_dependencies(self, dependencies):
    #     dependencies_objects = []
    #     for dependency in dependencies:
    #         if isinstance(dependency, int):
    #             # get object using object.id
    #             #if not None self.__class__.tasks.get(dependency)
    #             #dependency = self.__class__.tasks[dependency]
    #             #must use get, if none, return int, then is processed in tasklist istead
    #             pass
    #         dependencies_objects.append(dependency)
    #     # replaces id list with node list
    #     #self.dependencies = dependencies_objects
    #     return dependencies_objects
    

    # def add_dependencies(self, dependent_tasks):
    #     """Adds multiple dependencies for a task (task -> dependent_tasks)."""
    #     for dependent_task in dependent_tasks:
    #         if dependent_task not in self.dependencies:
    #             self.dependencies.append(dependent_task)

    # # not to be used until confirm if will be forcing dependency list to be objects
    # def show_depencencies(self):
    #     """Displays the DAG as adjacency lists."""
    #     for dependency in self.dependencies:
    #         print(f" -> {dependency.name} ({dependency.id})")