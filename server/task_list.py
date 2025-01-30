import json
import ipdb
from datetime import datetime, timedelta, time
from task import Task

# Define a custom encoder to serialize the objects
class TaskEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Task):
            return {
                "id": str(obj.id), 
                "name": obj.name,
                "start": obj.sched_start.strftime("%Y-%m-%d"),
                "end": obj.sched_end.strftime("%Y-%m-%d"),
                "days_length": obj.days_length,
                "progress": obj.progress,
                "dependencies": [str(dep.id) for dep in obj.dependencies]
            }
        return json.JSONEncoder.default(self, obj)


class TaskList:
    def __repr__(self):
        return f'<TaskList Object (Containing {len(self.tasks)} Tasks)>'
    
    def __init__(self, tasks):
        # getting dictionary of all tasks created by Task Object
        self.tasks = self.populate_dependencies(tasks) # TO BE MOVED TO TASKS FOR DEPLOY
        #self.tasks = tasks
    
    # @property
    # def tasks(self):
    #     return self._tasks
    
    # @tasks.setter
    # def tasks(self, tasks):
    #     self._tasks = self.populate_dependencies(tasks)
    #     #self._tasks = self.topological_sort(updated_list)
        
    # Add a method to export the graph as JSON
    def export_as_json(self):
        #return json.dumps(self.tasks)
        # Serialize the list of objects using custom serializer encoder class
        dataset = self.topological_sort(self.tasks)
        return json.dumps(dataset, cls=TaskEncoder)
    

    # TODO: see Tasks notes, this must be moved there for deploy
    # consider moving to Task and force dependency list to be of valid objects
    # replaces task.dependencies list containing id with list of task objects 
    def populate_dependencies(self, tasks):
        visited = set()
        def process_task(task):
            if task.id not in visited:
                visited.add(task.id)
                dependencies_objects = []
                for dependency in task.dependencies:
                    if isinstance(dependency, int):
                        # get object using object.id        
                        dependency = tasks[dependency]
                    dependencies_objects.append(dependency)
                # replaces id list with node list
                task.dependencies = dependencies_objects

        for id, task in tasks.items():
            if task.dependencies != []:
                process_task(task)

        return tasks

    
    
    # minimal working version
    def topological_sort(self, tasks):
        #tasks = self.tasks
        """
        Perform a topological sort on the tasks in the TaskList.
        :return: list, topologically sorted order of Task objects
        """
        from collections import defaultdict, deque
        from datetime import datetime, timedelta, time

        # ensure that date is valid datetime to ensure integrity across caluclations
        # returns datetime or Exception
        def validate_or_make_datetime(value, error="Undefined Error"):
            if not isinstance(value, datetime):
                try:
                    # convert string to datetime
                    value = datetime.strptime(value, "%Y-%m-%d")
                except ValueError:
                    # invalid date string
                    raise Exception(error)
                except Exception as e:
                    # unhandled exception
                    raise Exception(f'Error: {e}')
            return value
        
        # validate before/after, returns Boolean
        # use: (start, end): returns True if valid timeframe, False if not
        # use: (sched_start, pin_start): returns True if planned start is before (allow pin to set start later)
        def validate_before_after(before, after):
            time_diff = (after - before).total_seconds()
            if not time_diff >= 0:
                return False
            return True
        
        # returns int or Exception
        def get_difference_days(start, end):
            time_diff = (end - start).total_seconds()
            if not time_diff >= 0:
                raise Exception("Invalid times. Start can't be before end")
            # +1 because difference from midnight-midnight is 1 day less
            return int(time_diff/3600/24)+1
        
        # ensure that enough time exists to complete task.. must handle conflict
        # returns Boolean, or Exception string defined in 4th paramether
        def validate_start_end_against_length(start, end, days_length, exception_response=False):
            # valid timeframe. returns Boolean
            if not validate_before_after(start, end):  
                if not exception_response:
                    return False
                else:
                    raise Exception("Invalid times. Start can't be before end")
            else:
                # ensure timeframe is large enough for task.
                days_allocated = get_difference_days(start,end)
                if days_allocated < days_length:
                    if not exception_response:
                        return False
                    else:
                        raise Exception(exception_response)
            return True
        
        # Step 1: Calculate in-degrees and construct the adjacency list
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

        for task in tasks.values():
            # Initialize in-degree for the current task
            in_degree[task.id] = in_degree.get(task.id, 0)
            for dependency in task.dependencies:
                adjacency_list[dependency.id].append(task) #task.id
                in_degree[task.id] += 1

        # Step 2: Collect all tasks with in-degree 0 (tasks with no dependencies) for initial adding
        zero_in_degree = deque([task for task in tasks.values() if in_degree[task.id] == 0])
        
        # Initialize start and end dates for tasks with no dependencies
        for task in zero_in_degree:
            task.sched_start = datetime.combine(datetime.now(), time.min) # No dependencies, start today at midnight
            task.sched_end = task.sched_start + timedelta(days = task.days_length)

            # if task has a pinned start_date
            if task.pin_start:
                # validate: returns datetime or Exception
                task.pin_start = validate_or_make_datetime(task.pin_start, f'Task {task.id}: {task.name} has invalid pinned start date')
                task.pin_honored = True
                task.sched_start = task.pin_start
                
                # confirm that there is valid timeframe to complete task, otherwise push end date forward
                if not validate_start_end_against_length(task.sched_start, task.sched_end, task.days_length):
                    # not enough time from pin start to today+days_length, so push up sched_end to be pin_start+days_length
                    task.sched_end = task.sched_start + timedelta(days = task.days_length)
                    


            # if task has a pinned end_date
            if task.pin_end:
                # validate: returns datetime or Exception
                task.pin_end = validate_or_make_datetime(task.pin_end, f'Task {task.id}: {task.name} has invalid pinned end date')

                # ensure that enough time exists to complete task and handle conflict
                if not validate_start_end_against_length(task.sched_start, task.pin_end, task.days_length):
                    # returns Boolean
                    #process conflict here,
                    raise Exception(f'Invalid pinned time. Not enough time allocated for task. Defined dates: {task.sched_start} - {task.pin_end}. Task Length: {task.days_length}')

                task.pin_honored = True
                task.sched_end = task.pin_end
            
            
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
                                
                # for every edge pointing to a task, 
                # get latest start date (then calculated end from that)
                
                # validate: returns datetime or Exception
                current_task.sched_end = validate_or_make_datetime(current_task.sched_end, f'Task {current_task.id}: {current_task.name} is missing end date')

                # Goal: determine actual start_date for a task, based on the end_dates of task pointing to it
                # We iterate a task by the task pointing to it
                # if start_date was never set (first time iterating), set dependent_task.start using pointing_task.end
                if not isinstance(dependent_task.sched_start, datetime):
                    dependent_task.sched_start = current_task.sched_end + timedelta(days=1)
                else:
                    # Calculate the earliest start time for the dependent task
                    # if date was previously set, get the later of: previously set date OR using this pointing_task's end_date
                    actual_start = max(
                        dependent_task.sched_start,
                        current_task.sched_end + timedelta(days=1)  # Dependent task to start day after completion of pointing task
                    )
                    # determine if completion actually changed
                    if actual_start != dependent_task.sched_start:
                        pass
                    dependent_task.sched_start = actual_start

                # once we have determined correct start date, recalculate end_date
                dependent_task.sched_end = dependent_task.sched_start + timedelta(days=dependent_task.days_length)
                

                # Now that we have determined earliest start based on dependencies, attempt to use pinned dates
                
                if dependent_task.pin_start:
                    # validate: returns datetime or Exception
                    dependent_task.pin_start = validate_or_make_datetime(dependent_task.pin_start, f'Task {dependent_task.id}: {dependent_task.name} has invalid pinned start date')
                    # check that pin_start is later than sched_start
                    if validate_before_after(dependent_task.sched_start, dependent_task.pin_start):
                        # update task start
                        dependent_task.sched_start = dependent_task.pin_start 
                        dependent_task.pin_honored = True
                    #otherwise ignore pin start, because that date conflicts with pointing task's end

                if dependent_task.pin_end:
                    # validate: returns datetime or Exception
                    dependent_task.pin_end = validate_or_make_datetime(dependent_task.pin_end, f'Task {dependent_task.id}: {dependent_task.name} has invalid pinned end date')
                    # check that pin_end is later than sched_end
                    if validate_before_after(dependent_task.sched_end, dependent_task.pin_end):
                        # update task end
                        dependent_task.sched_end = dependent_task.pin_end
                        dependent_task.pin_honored = True
                    #otherwise ignore pin end, because that date is shorter task_length beginning after earliest pointing task's finish



                # this dependent task has no other dependencies
                if in_degree[dependent_task.id] == 0: # Step 2: Check if this dependent task now has no incoming edges (all depedendencies are resolved)
                    zero_in_degree.append(tasks[dependent_task.id]) # Step 3: Add it to the processing queue (tasks with no incoming edges)

        # Step 4: Check for cycles (if the graph isn't a DAG)
        if len(top_order) != len(tasks):
            raise ValueError("The graph contains cycles and is not a valid DAG.")
        
        return top_order
    
    # return project completion data
    def display_project_schedule(self):
        dataset = self.topological_sort(self.tasks)
        
        project_start = min(task.sched_start for task in dataset)
        project_end = max(task.sched_end for task in dataset)
        time_diff = project_end - project_start
        data = {
            "project_start": datetime.strftime(project_start, "%Y-%m-%d"),
            "project_end": datetime.strftime(project_end, "%Y-%m-%d"),
            "project_days": int(time_diff.total_seconds()/3600/24)
        }
        response = f"Project Scheduele: {data['project_start']} - {data['project_end']} ({data['project_days']} days)"
        return data

    def topological_sort_dev(self):
        """
        Perform a topological sort on the tasks in the TaskList.
        :return: list, topologically sorted order of Task objects
        """
        from collections import defaultdict, deque
        from datetime import datetime, timedelta
    
        # Step 1: Calculate in-degrees and construct the adjacency list
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
        completion_time = defaultdict(int)  # Earliest completion times

        for task in self.tasks.values():
            # Initialize in-degree for the current task
            in_degree[task.id] = in_degree.get(task.id, 0)
            completion_time[task.id] = 0  # Initialize to 0
            for dependency in task.dependencies:
                adjacency_list[dependency.id].append(task) #task.id
                in_degree[task.id] += 1

        # Step 2: Collect all tasks with in-degree 0 (tasks with no dependencies) for initial adding
        zero_in_degree = deque([task for task in self.tasks.values() if in_degree[task.id] == 0])
        
        # Initialize start and end dates for tasks with no dependencies
        for task in zero_in_degree:
            task.start = datetime.now() # No dependencies, start immediately
            task.end = task.start + timedelta(days = task.days_length)

        # Step 3: Process tasks with in-degree 0
        top_order = []
        while zero_in_degree:
            # 3.1: add tasks that have no dependencies
            current_task = zero_in_degree.popleft()

            # # Adjust start date if the task is pinned
            # if current_task.pin_start:
            #     pinned_start = datetime.strptime(current_task.pin_start, "%Y-%m-%d")
            #     current_task.start = pinned_start.strftime("%Y-%m-%d")
            #     current_task.end = (pinned_start + timedelta(days=current_task.days_to_complete)).strftime("%Y-%m-%d")

            # recalculated end date using start+days_length
            #start_time = datetime.strptime(current_task.start, "%Y-%m-%d")
            #current_task.end = (start_time + timedelta(days=current_task.days_length)).strftime("%Y-%m-%d")
   
            # use first task as project_start_date
            #if top_order == []:
            #    project_start_date = current_task.start

            # using days_length, push up finish and current
            # # Update the earliest completion time for this task
            # current_time = completion_time[current_task.id]
            # completion_time[current_task.id] = max(completion_time[current_task.id], current_time + current_task.days_length)
            # print(f'Task: {current_task.name}, CurrentTime: {current_time}, CompletionTime: {completion_time[current_task.id]}')

            top_order.append(current_task)
            

            #print(f'{current_task.name} ({current_task.id}): {adjacency_list[current_task.id]}')

            # Reduce the in-degree of dependent tasks
            # 3.2: process dependent tasks 
            # get list of tasks that point to this task
            for dependent_task in adjacency_list[current_task.id]:
                
                #print(f'DepID: {dependent_id}, DepInDegree: {in_degree[dependent_id]}')

                # subtract -1 to account for the parent task that points to this
                in_degree[dependent_task.id] -= 1  # Step 1: Reduce the in-degree of each dependent task
                
                # Calculate the earliest start time for the dependent task
                # Calculate the earliest start time for the dependent task
                dependent_task.start = max(
                    dependent_task.start if isinstance(dependent_task.start, datetime) else datetime.strptime(dependent_task.start, "%Y-%m-%d"),  # Handle uninitialized start_date
                    current_task.end if isinstance(current_task.end, datetime) else datetime.strptime(current_task.end, "%Y-%m-%d")  # Dependent task can start after current task ends
                )
                dependent_task.end = dependent_task.start + timedelta(days=dependent_task.days_length)
                completion_time[dependent_task.id] = dependent_task.days_length
                #print(f'Dates: {dependent_task.start} - {dependent_task.end} Length: {dependent_task.days_length}')

                # this dependent task has no other dependencies
                if in_degree[dependent_task.id] == 0: # Step 2: Check if this dependent task now has no incoming edges (all depedendencies are resolved)
                    zero_in_degree.append(self.tasks[dependent_task.id]) # Step 3: Add it to the processing queue (tasks with no incoming edges)


        # # Step 3: Process tasks with in-degree 0
        # top_order = []
        # while zero_in_degree:
        #     # 3.1: add tasks that have no dependencies
        #     current_task = zero_in_degree.popleft()
        #     top_order.append(current_task)

        #     # Reduce the in-degree of dependent tasks
        #     # 3.2: get list of tasks that are dependent on this task
        #     for dependent_id in adjacency_list[current_task.id]:
        #         in_degree[dependent_task.id] -= 1
        #         if in_degree[dependent_task.id] == 0:
        #             zero_in_degree.append(self.tasks[dependent_task.id])

        # Step 4: Check for cycles (if the graph isn't a DAG)
        if len(top_order) != len(self.tasks):
            raise ValueError("The graph contains cycles and is not a valid DAG.")

        # print(f'ProjectStart: {project_start_date}')
        # print(f'ProjectFinish: {project_finish_date}')
        # print(f'CurrentDate: {current_date}')
        
        # Calculate total completion time
        #total_completion_time = max(completion_time.values(), default=0)
        #print(f'Total: {total_completion_time}')
        #print(completion_time[1])
        # Step 4: Get the total completion time
        #print(f'ProjectStart: {min(task.start for task in self.tasks.values())}')
        #print(f'ProjectEnd: {max(task.end for task in self.tasks.values())}')
        
        return top_order


    def build_schedule(self):
        visited = set()
        stack = []

        def process_task(task):
            if task.id not in visited:
                visited.add(task.id)
                for dependent_task in task.dependencies:
                    process_task(dependent_task)
                stack.append(task)

        for id, task in self.tasks.items():
            process_task(task)

        #return stack[::-1]  # Reverse the stack to get the correct order
        return stack
    

    def validate_list(self):
        tasks = self.tasks

        """Detects if the TaskList/DAG has any cycles."""
        visited = set()
        rec_stack = set()

        def process_task(task):
            id = task.id

            if id in rec_stack:  # Cycle detected
                return True
            if id in visited:
                return False

            visited.add(id)
            rec_stack.add(id)

            for dependent_task in task.dependencies:
                if process_task(dependent_task):
                    return True

            rec_stack.remove(id)
            return False

        for id,task in tasks.items():
            if process_task(task):
                return True

        return False
        # if validate_list(Task.taskList):
        #     print("The graph has a cycle. Not a valid DAG.")
        # else:
        #     print("The graph is a valid DAG.")


    def show_graph(self):
        """Displays the DAG as adjacency lists."""
        for task in self.tasks.values():
            print(f"{task.name} ({task.id}) -> {[f'{dep.name} ({dep.id})' for dep in task.dependencies]}")

    

    # COLD STORAGE OF WORKING METHOD
    # def topological_sort_dev(self):
    #     """
    #     Perform a topological sort on the tasks in the TaskList.
    #     :return: list, topologically sorted order of Task objects
    #     """
    #     from collections import defaultdict, deque
    #     from datetime import datetime, timedelta
    
    #     # Step 1: Calculate in-degrees and construct the adjacency list
    #     # In a DAG, "in-degree" of a node refers to the number of directed edges that are coming into that node, 
    #     # essentially representing how many other nodes are pointing to it; 
    #     # it's a measure of how many dependencies a node has within the graph
    #     # 
    #     # "DAG adjacency" refers to the concept of neighboring nodes (considered "adjacent") within a 
    #     # Directed Acyclic Graph (DAG), where a node is considered adjacent to another if there 
    #     # is a directed edge connecting them, 
    #     # meaning one node "points" to the other in the graph, with no cyclic dependencies between nodes; 
    #     # essentially, it describes the relationship between nodes in a DAG based on the direction of 
    #     # their connections.
    #     # Imagine a DAG representing a workflow with tasks as nodes: 
    #     # If task A needs to be completed before task B can start, then A is considered "adjacent" to B, 
    #     # meaning there is a directed edge going from A to B.

    #     in_degree = defaultdict(int) #count amount of dependencies in a task (incoming edges)
    #     adjacency_list = defaultdict(list) #list of tasks pointing to a dependency
    #     completion_time = defaultdict(int)  # Earliest completion times

    #     for task in self.tasks.values():
    #         # Initialize in-degree for the current task
    #         in_degree[task.id] = in_degree.get(task.id, 0)
    #         completion_time[task.id] = 0  # Initialize to 0
    #         for dependency in task.dependencies:
    #             adjacency_list[dependency.id].append(task) #task.id
    #             in_degree[task.id] += 1

    #     # Step 2: Collect all tasks with in-degree 0 (tasks with no dependencies) for initial adding
    #     zero_in_degree = deque([task for task in self.tasks.values() if in_degree[task.id] == 0])
        
    #     # Initialize start and end dates for tasks with no dependencies
    #     for task in zero_in_degree:
    #         task.start = datetime.now() # No dependencies, start immediately
    #         task.end = task.start + timedelta(days = task.days_length)

    #     # Step 3: Process tasks with in-degree 0
    #     top_order = []
    #     while zero_in_degree:
    #         # 3.1: add tasks that have no dependencies
    #         current_task = zero_in_degree.popleft()

    #         # # Adjust start date if the task is pinned
    #         # if current_task.pin_start:
    #         #     pinned_start = datetime.strptime(current_task.pin_start, "%Y-%m-%d")
    #         #     current_task.start = pinned_start.strftime("%Y-%m-%d")
    #         #     current_task.end = (pinned_start + timedelta(days=current_task.days_to_complete)).strftime("%Y-%m-%d")

    #         # recalculated end date using start+days_length
    #         #start_time = datetime.strptime(current_task.start, "%Y-%m-%d")
    #         #current_task.end = (start_time + timedelta(days=current_task.days_length)).strftime("%Y-%m-%d")
   
    #         # use first task as project_start_date
    #         #if top_order == []:
    #         #    project_start_date = current_task.start

    #         # using days_length, push up finish and current
    #         # # Update the earliest completion time for this task
    #         # current_time = completion_time[current_task.id]
    #         # completion_time[current_task.id] = max(completion_time[current_task.id], current_time + current_task.days_length)
    #         # print(f'Task: {current_task.name}, CurrentTime: {current_time}, CompletionTime: {completion_time[current_task.id]}')

    #         top_order.append(current_task)
            

    #         #print(f'{current_task.name} ({current_task.id}): {adjacency_list[current_task.id]}')

    #         # Reduce the in-degree of dependent tasks
    #         # 3.2: process dependent tasks 
    #         # get list of tasks that point to this task
    #         for dependent_task in adjacency_list[current_task.id]:
                
    #             #print(f'DepID: {dependent_id}, DepInDegree: {in_degree[dependent_id]}')

    #             # subtract -1 to account for the parent task that points to this
    #             in_degree[dependent_task.id] -= 1  # Step 1: Reduce the in-degree of each dependent task
                
    #             # Calculate the earliest start time for the dependent task
    #             # Calculate the earliest start time for the dependent task
    #             dependent_task.start = max(
    #                 dependent_task.start if isinstance(dependent_task.start, datetime) else datetime.strptime(dependent_task.start, "%Y-%m-%d"),  # Handle uninitialized start_date
    #                 current_task.end if isinstance(current_task.end, datetime) else datetime.strptime(current_task.end, "%Y-%m-%d")  # Dependent task can start after current task ends
    #             )
    #             dependent_task.end = dependent_task.start + timedelta(days=dependent_task.days_length)
    #             completion_time[dependent_task.id] = dependent_task.days_length
    #             #print(f'Dates: {dependent_task.start} - {dependent_task.end} Length: {dependent_task.days_length}')

    #             # this dependent task has no other dependencies
    #             if in_degree[dependent_task.id] == 0: # Step 2: Check if this dependent task now has no incoming edges (all depedendencies are resolved)
    #                 zero_in_degree.append(self.tasks[dependent_task.id]) # Step 3: Add it to the processing queue (tasks with no incoming edges)


    #     # # Step 3: Process tasks with in-degree 0
    #     # top_order = []
    #     # while zero_in_degree:
    #     #     # 3.1: add tasks that have no dependencies
    #     #     current_task = zero_in_degree.popleft()
    #     #     top_order.append(current_task)

    #     #     # Reduce the in-degree of dependent tasks
    #     #     # 3.2: get list of tasks that are dependent on this task
    #     #     for dependent_id in adjacency_list[current_task.id]:
    #     #         in_degree[dependent_task.id] -= 1
    #     #         if in_degree[dependent_task.id] == 0:
    #     #             zero_in_degree.append(self.tasks[dependent_task.id])

    #     # Step 4: Check for cycles (if the graph isn't a DAG)
    #     if len(top_order) != len(self.tasks):
    #         raise ValueError("The graph contains cycles and is not a valid DAG.")

    #     # print(f'ProjectStart: {project_start_date}')
    #     # print(f'ProjectFinish: {project_finish_date}')
    #     # print(f'CurrentDate: {current_date}')
        
    #     # Calculate total completion time
    #     #total_completion_time = max(completion_time.values(), default=0)
    #     #print(f'Total: {total_completion_time}')
    #     #print(completion_time[1])
    #     # Step 4: Get the total completion time
    #     #print(f'ProjectStart: {min(task.start for task in self.tasks.values())}')
    #     #print(f'ProjectEnd: {max(task.end for task in self.tasks.values())}')
        
    #     return top_order
