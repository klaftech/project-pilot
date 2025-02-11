import { useState } from "react";
import { Gantt, ViewMode } from "gantt-task-react";
import { ViewSwitcher } from "./ViewSwitcher";
import { getStartEndDateForProject } from "./exampleHelper";

//import './app.css'
import "gantt-task-react/dist/index.css";

const App = ({tasks}) => {
  const [view, setView] = useState(ViewMode.Month);
  const [isChecked, setIsChecked] = useState(true);
  //console.log('raw tasks: ',tasks)

  const scheduledTasks = tasks.map((task) => ({
      id: task.id,
      name: task.name,
      type: 'task', //task.id == "20" ? 'project' : 'task',
      start: task.start,
      end: task.end,
      progress: task.progress,
      //assignees: ["admin"],
      //dependencies: task.dependencies.map(task => task.id), //if sending task object
      dependencies: task.dependencies, //assuming receiving array of IDs
      project: task.group.name,
      //styles: { progressColor: '#ffbb54', progressSelectedColor: '#ff9e0d' },
      isDisabled: true,
      //fontSize: '100',
      //project: 'SAS',
      hideChilren: false,
      // displayOrder: task.id
  }));

  const groups = {}
  tasks.forEach(task => {
    const get_group = groups[task.group.id] ?? 1
    
    let group_start
    if (get_group == false){
      group_start = task.start
    } else if(get_group['start'] < task.start){ //we want the earliest start date of all tasks
      group_start = get_group['start']
    } else {
      group_start = task.start
    }

    let group_end
    if (get_group == false){
      group_end = task.end
    } else if(get_group['end'] > task.end){ //we want the latest end date of all tasks
      group_end = get_group['end']
    } else {
      group_end = task.end
    }

    groups[task.group.id] = {
      "name": task.group.name,
      "start": group_start,
      "end": group_end,
    }
  })
  //console.log('groups ',groups)

  //const uniqueGroups = [...new Set(tasks.map(task => task.group.name))];
  const preppedGroups = []
  for (const [group_id, values] of Object.entries(groups)) {
    const group = {
      id: parseInt(10000+group_id),
      name: values.name,
      type: 'project',
      start: values.start,
      end: values.end,
      progress: 0,
      isDisabled: true,
      hideChilren: false,
      displayOrder: parseInt(group_id),
    }  
    preppedGroups.push(group)
  }
  const joinedTasks = scheduledTasks.concat(preppedGroups);
  const sortedTasks = joinedTasks.sort((a, b) => {
    if (a.start.getTime() !== b.start.getTime()) {
      return a.start.getTime() - b.start.getTime() //sort by start date
    }
    if(a.type !== b.type){
      return a.type.localeCompare(b.type) //sort type alphabetically (puts project before task)
    }
    return 0 //if all parameters are equal, maintain original order
    // return a.start.getTime() - b.start.getTime() || a.type - b.type
  }).map((element, index) => {
    const new_element = {...element}
    new_element['displayOrder'] = index+1
    return new_element
  })

  // console.log('preppedGroups ',preppedGroups)
  // console.log('joinedTasks ',joinedTasks)
  // console.log('formatted tasks: ',scheduledTasks)
  // console.log('sortedTasks: ',sortedTasks)


  let columnWidth = 65;
  if (view === ViewMode.Year) {
    columnWidth = 350;
  } else if (view === ViewMode.Month) {
    columnWidth = 300;
  } else if (view === ViewMode.Week) {
    columnWidth = 250;
  }

  const handleTaskChange = (task) => {
    console.log("On date change Id:" + task.id);
    let newTasks = tasks.map((t) => (t.id === task.id ? task : t));
    if (task.project) {
      const [start, end] = getStartEndDateForProject(newTasks, task.project);
      const project = newTasks[newTasks.findIndex((t) => t.id === task.project)];
      if (
        project.start.getTime() !== start.getTime() ||
        project.end.getTime() !== end.getTime()
      ) {
        const changedProject = { ...project, start, end };
        newTasks = newTasks.map((t) =>
          t.id === task.project ? changedProject : t
        );
      }
    }
    setTasks(newTasks);
  };

  const handleTaskDelete = (task) => {
    const conf = window.confirm("Are you sure about " + task.name + " ?");
    if (conf) {
      setTasks(tasks.filter((t) => t.id !== task.id));
    }
    return conf;
  };

  const handleProgressChange = async (task) => {
    setTasks(tasks.map((t) => (t.id === task.id ? task : t)));
    console.log("On progress change Id:" + task.id);
  };

  const handleDblClick = (task) => {
    alert("On Double Click event Id:" + task.id);
  };

  const handleClick = (task) => {
    console.log("On Click event Id:" + task.id);
  };

  const handleSelect = (task, isSelected) => {
    console.log(
      task.name + " has " + (isSelected ? "selected" : "unselected")
    );
  };

  const handleExpanderClick = (task) => {
    setTasks(tasks.map((t) => (t.id === task.id ? task : t)));
    console.log("On expander click Id:" + task.id);
  };

  return (
    <>
      <ViewSwitcher
        onViewModeChange={(viewMode) => setView(viewMode)}
        onViewListChange={setIsChecked}
        isChecked={isChecked}
        currentView={view}
      />
      
      <h2>Project Workflow</h2>

      <div className="flex gap-6">
        <Gantt
            tasks={sortedTasks}
            viewMode={view}
            onDateChange={handleTaskChange}
            onDelete={handleTaskDelete}
            onProgressChange={handleProgressChange}
            onDoubleClick={handleDblClick}
            onClick={handleClick}
            onSelect={handleSelect}
            onExpanderClick={handleExpanderClick}
            listCellWidth={isChecked ? "155px" : ""}
            columnWidth={columnWidth}
          />
      </div>
      
      {/*
      <h3>Project Workflow with Limited Height</h3>
      <Gantt
        tasks={scheduledTasks}
        viewMode={view}
        onDateChange={handleTaskChange}
        onDelete={handleTaskDelete}
        onProgressChange={handleProgressChange}
        onDoubleClick={handleDblClick}
        onClick={handleClick}
        onSelect={handleSelect}
        onExpanderClick={handleExpanderClick}
        listCellWidth={isChecked ? "155px" : ""}
        ganttHeight={300}
        columnWidth={columnWidth}
      /> 
      */}
    </>
  );
};

export default App;
