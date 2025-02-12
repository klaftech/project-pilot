//https://github.com/wamra/gantt-task-react?tab=readme-ov-file
import { Gantt /*, Task, EventOption, StylingOption, ViewMode /*, DisplayOption*/ } from '@wamra/gantt-task-react';
import "@wamra/gantt-task-react/dist/style.css";

// DAG Task Data: Each task has dependencies defined as an array of task IDs
const dagTasks = [
  { id: "1", name: "Task 1", start: "2025-01-20", end: "2025-01-27", progress: 50, dependencies: [] },
  { id: "2", name: "Task 2", start: "2025-01-28", end: "2025-02-03", progress: 20, dependencies: ["1"] },
  { id: "3", name: "Task 3", start: "2025-01-25", end: "2025-02-05", progress: 70, dependencies: ["1"] },
  { id: "4", name: "Task 4", start: "2025-02-01", end: "2025-02-07", progress: 30, dependencies: ["2", "3"] },
];


let constructionTasks = [
  { "id": "1", "name": "Site Survey and Soil Testing", "start": "2025-02-01", "end": "2025-03-03", "days_to_complete": 2, "progress": 0, "dependencies": [] },
  { "id": "1.1", "name": "Site Survey and Soil Testing", "start": "2025-04-01", "end": "2025-04-03", "days_to_complete": 2, "progress": 0, "dependencies": [1] },
  { "id": "2", "name": "Site Clearing and Demolition (if required)", "start": "2025-03-04", "end": "2025-02-06", "days_to_complete": 3, "progress": 0, "dependencies": ["1"] },
  { "id": "3", "name": "Temporary Utilities Setup (Water/Electricity)", "start": "2025-02-07", "end": "2025-03-08", "days_to_complete": 2, "progress": 0, "dependencies": ["2"] },
  { "id": "4", "name": "Excavation for Foundation", "start": "2025-02-09", "end": "2025-02-12", "days_to_complete": 4, "progress": 0, "dependencies": ["3"] },
  { "id": "5", "name": "Compaction and Grading", "start": "2025-02-13", "end": "2025-02-14", "days_to_complete": 2, "progress": 0, "dependencies": ["4"] },
  { "id": "6", "name": "Foundation Footing Formwork and Rebar", "start": "2025-02-15", "end": "2025-02-18", "days_to_complete": 4, "progress": 0, "dependencies": ["5"] },
  { "id": "7", "name": "Pour Concrete for Footings", "start": "2025-02-19", "end": "2025-02-20", "days_to_complete": 2, "progress": 0, "dependencies": ["6"] },
  { "id": "8", "name": "Foundation Wall Formwork and Rebar", "start": "2025-02-21", "end": "2025-02-24", "days_to_complete": 4, "progress": 0, "dependencies": ["7"] },
  { "id": "9", "name": "Pour Concrete for Foundation Walls", "start": "2025-02-25", "end": "2025-02-26", "days_to_complete": 2, "progress": 0, "dependencies": ["8"] },
  { "id": "10", "name": "Foundation Curing and Waterproofing", "start": "2025-02-27", "end": "2025-03-02", "days_to_complete": 4, "progress": 0, "dependencies": ["9"] },
  { "id": "11", "name": "Backfilling Around Foundation", "start": "2025-03-03", "end": "2025-03-05", "days_to_complete": 3, "progress": 0, "dependencies": ["10"] },
  { "id": "12", "name": "Install Underground Utilities (Water, Sewer, Electric)", "start": "2025-03-06", "end": "2025-03-09", "days_to_complete": 4, "progress": 0, "dependencies": ["11"] },
  { "id": "13", "name": "Pour Basement or Slab-on-Grade Floor", "start": "2025-03-10", "end": "2025-03-13", "days_to_complete": 4, "progress": 0, "dependencies": ["12"] },
  { "id": "14", "name": "Erect Structural Framing (Walls, Beams, Columns)", "start": "2025-03-14", "end": "2025-03-21", "days_to_complete": 8, "progress": 0, "dependencies": ["13"] },
  { "id": "15", "name": "Install Subflooring", "start": "2025-03-22", "end": "2025-03-24", "days_to_complete": 3, "progress": 0, "dependencies": ["14"] },
  { "id": "16", "name": "Install Roof Trusses and Sheathing", "start": "2025-03-25", "end": "2025-03-30", "days_to_complete": 6, "progress": 0, "dependencies": ["15"] },
  { "id": "17", "name": "Install Roofing Material (Shingles or Metal)", "start": "2025-03-31", "end": "2025-04-05", "days_to_complete": 6, "progress": 0, "dependencies": ["16"] },
  { "id": "18", "name": "Install Exterior Doors and Windows", "start": "2025-04-06", "end": "2025-04-10", "days_to_complete": 5, "progress": 0, "dependencies": ["17", "16"] },
  { "id": "19", "name": "Rough-In Electrical Wiring", "start": "2025-04-11", "end": "2025-04-18", "days_to_complete": 8, "progress": 0, "dependencies": ["18"] },
  { "id": "20", "name": "Rough-In Plumbing", "start": "2025-04-19", "end": "2025-04-26", "days_to_complete": 8, "progress": 0, "dependencies": ["18"] },
  { "id": "21", "name": "Rough-In HVAC", "start": "2025-04-27", "end": "2025-05-02", "days_to_complete": 6, "progress": 0, "dependencies": ["19", "20"] },
  { "id": "22", "name": "Insulation Installation", "start": "2025-05-03", "end": "2025-05-08", "days_to_complete": 6, "progress": 0, "dependencies": ["21"] },
  { "id": "23", "name": "Drywall Hanging and Finishing", "start": "2025-05-09", "end": "2025-05-18", "days_to_complete": 10, "progress": 0, "dependencies": ["22"] },
  { "id": "24", "name": "Interior Painting (Walls and Ceilings)", "start": "2025-05-19", "end": "2025-05-26", "days_to_complete": 8, "progress": 0, "dependencies": ["23"] },
  { "id": "25", "name": "Install Interior Doors and Trim", "start": "2025-05-27", "end": "2025-05-31", "days_to_complete": 5, "progress": 0, "dependencies": ["24"] },
  { "id": "26", "name": "Install Cabinetry and Countertops", "start": "2025-06-01", "end": "2025-06-06", "days_to_complete": 6, "progress": 0, "dependencies": ["25"] },
  { "id": "27", "name": "Flooring Installation (Tile, Hardwood, Carpet)", "start": "2025-06-07", "end": "2025-06-14", "days_to_complete": 8, "progress": 0, "dependencies": ["26"] },
  { "id": "28", "name": "Install Electrical Fixtures", "start": "2025-06-15", "end": "2025-06-18", "days_to_complete": 4, "progress": 0, "dependencies": ["27"] },
  { "id": "29", "name": "Install Plumbing Fixtures", "start": "2025-06-19", "end": "2025-06-22", "days_to_complete": 4, "progress": 0, "dependencies": ["28"] },
  { "id": "30", "name": "Final HVAC Testing and Balancing", "start": "2025-06-23", "end": "2025-06-26", "days_to_complete": 4, "progress": 0, "dependencies": ["29"] },
  { "id": "31", "name": "Exterior Painting and Finishing", "start": "2025-06-27", "end": "2025-07-02", "days_to_complete": 6, "progress": 0, "dependencies": ["30"] },
  { "id": "32", "name": "Driveway and Walkway Construction", "start": "2025-07-03", "end": "2025-07-07", "days_to_complete": 5, "progress": 0, "dependencies": ["31"] },
  { "id": "33", "name": "Landscaping and Final Grading", "start": "2025-07-08", "end": "2025-07-15", "days_to_complete": 8, "progress": 0, "dependencies": ["32"] },
  { "id": "34", "name": "Final Cleaning", "start": "2025-07-16", "end": "2025-07-18", "days_to_complete": 3, "progress": 0, "dependencies": ["33"] },
  { "id": "35", "name": "Final Inspection and Punch List", "start": "2025-07-19", "end": "2025-07-22", "days_to_complete": 4, "progress": 0, "dependencies": ["34"] },
  { "id": "36", "name": "Handover to Client", "start": "2025-07-23", "end": "2025-07-24", "days_to_complete": 2, "progress": 0, "dependencies": ["35"] }
]


// Convert DAG to Gantt-compatible format
const convertDagToGanttTasks = (dag) => {
  return dag.map((task) => ({
    id: task.id,
    name: task.name,
    type: 'task',
    start: new Date(task.start),
    end: new Date(task.end),
    progress: task.progress,
    assignees: ["admin"],
    dependencies: task.dependencies,
    styles: { progressColor: '#ffbb54', progressSelectedColor: '#ff9e0d' },
    isDisabled: true,
    fontSize: '100',
    project: 'SAS',
    hideChilren: false,
  }));
};

const GanttChartFork = () => {
  const tasks = convertDagToGanttTasks(constructionTasks);

  const handleTaskChange = (updatedTask) => {
    console.log("Updated Task:", updatedTask);
  };

  const alertClick = (display) => {
    alert('clicked: '+display)
  }

  return (
    <div>
      <h1>Gantt Chart with DAG Tasks</h1>
      <Gantt
        tasks={tasks}
        onTaskChange={()=>alertClick("onTaskChange")}
        /*// onClick={handleTaskChange}*/
        onDateChange={()=>alertClick("onDateChange")}
        onProgressChange={()=>alertClick("onProgressChange")}
        onDoubleClick={()=>alertClick}
        //onClick={()=>alertClick("onClick")}
        viewMode="Month" // Day, Week, Month
        taskListCellWidth=""
        dependencies={true}
      />
    </div>
  );
};

export default GanttChartFork;