//import { Gantt, Task, EventOption, StylingOption, ViewMode /*, DisplayOption*/ } from 'gantt-task-react';
import { Gantt } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
//https://github.com/MaTeMaTuK/gantt-task-react

// DAG Task Data: Each task has dependencies defined as an array of task IDs
const dagTasks = [
  { id: "1", name: "Task 1", start: "2025-01-20", end: "2025-01-27", progress: 50, dependencies: [] },
  { id: "2", name: "Task 2", start: "2025-01-28", end: "2025-02-03", progress: 20, dependencies: ["1"] },
  { id: "3", name: "Task 3", start: "2025-01-25", end: "2025-02-05", progress: 70, dependencies: ["1"] },
  { id: "4", name: "Task 4", start: "2025-02-01", end: "2025-02-07", progress: 30, dependencies: ["2", "3"] },
];


let constructionTasks = [
  { "id": "1", "name": "Site Survey and Soil Testing", "start": "2024-10-01", "end": "2025-01-05", "days_to_complete": 65, "progress": 0, "dependencies": [] },
  { "id": "2", "name": "Site Clearing and Demolition (if required)", "start": "2025-02-06", "end": "2025-02-15", "days_to_complete": 10, "progress": 0, "dependencies": ["1"] },
  { "id": "3", "name": "Temporary Utilities Setup (Water/Electricity)", "start": "2025-02-16", "end": "2025-02-20", "days_to_complete": 5, "progress": 0, "dependencies": ["2"] },
  { "id": "4", "name": "Excavation for Foundation", "start": "2025-02-21", "end": "2025-03-05", "days_to_complete": 13, "progress": 0, "dependencies": ["3"] },
  { "id": "5", "name": "Compaction and Grading", "start": "2025-03-06", "end": "2025-03-12", "days_to_complete": 7, "progress": 0, "dependencies": ["4"] },
  { "id": "6", "name": "Foundation Footing Formwork and Rebar", "start": "2025-03-13", "end": "2025-03-25", "days_to_complete": 13, "progress": 0, "dependencies": ["5"] },
  { "id": "7", "name": "Pour Concrete for Footings", "start": "2025-03-26", "end": "2025-04-02", "days_to_complete": 7, "progress": 0, "dependencies": ["6"] },
  { "id": "8", "name": "Foundation Wall Formwork and Rebar", "start": "2025-04-03", "end": "2025-04-15", "days_to_complete": 13, "progress": 0, "dependencies": ["7"] },
  { "id": "9", "name": "Pour Concrete for Foundation Walls", "start": "2025-04-16", "end": "2025-04-23", "days_to_complete": 8, "progress": 0, "dependencies": ["8"] },
  { "id": "10", "name": "Foundation Curing and Waterproofing", "start": "2025-04-24", "end": "2025-05-06", "days_to_complete": 13, "progress": 0, "dependencies": ["9"] },
  { "id": "11", "name": "Backfilling Around Foundation", "start": "2025-05-07", "end": "2025-05-13", "days_to_complete": 7, "progress": 0, "dependencies": ["10"] },
  { "id": "12", "name": "Install Underground Utilities (Water, Sewer, Electric)", "start": "2025-05-14", "end": "2025-05-28", "days_to_complete": 15, "progress": 0, "dependencies": ["11"] },
  { "id": "13", "name": "Pour Basement or Slab-on-Grade Floor", "start": "2025-05-29", "end": "2025-06-10", "days_to_complete": 13, "progress": 0, "dependencies": ["12"] },
  { "id": "14", "name": "Erect Structural Framing (Walls, Beams, Columns)", "start": "2025-06-11", "end": "2025-06-30", "days_to_complete": 20, "progress": 0, "dependencies": ["13"] },
  { "id": "15", "name": "Install Subflooring", "start": "2025-07-01", "end": "2025-07-10", "days_to_complete": 10, "progress": 0, "dependencies": ["14"] },
  { "id": "16", "name": "Install Roof Trusses and Sheathing", "start": "2025-07-11", "end": "2025-07-25", "days_to_complete": 15, "progress": 0, "dependencies": ["15"] },
  { "id": "17", "name": "Install Roofing Material (Shingles or Metal)", "start": "2025-07-26", "end": "2025-08-10", "days_to_complete": 16, "progress": 0, "dependencies": ["16"] },
  { "id": "18", "name": "Install Exterior Doors and Windows", "start": "2025-08-11", "end": "2025-08-20", "days_to_complete": 10, "progress": 0, "dependencies": ["17"] },
  { "id": "19", "name": "Rough-In Electrical Wiring", "start": "2025-08-21", "end": "2025-09-05", "days_to_complete": 16, "progress": 0, "dependencies": ["18"] },
  { "id": "20", "name": "Rough-In Plumbing", "start": "2025-09-06", "end": "2025-09-20", "days_to_complete": 15, "progress": 0, "dependencies": ["18"] },
  { "id": "21", "name": "Rough-In HVAC", "start": "2025-09-21", "end": "2025-10-05", "days_to_complete": 15, "progress": 0, "dependencies": ["19", "20"] },
  { "id": "22", "name": "Insulation Installation", "start": "2025-10-06", "end": "2025-10-15", "days_to_complete": 10, "progress": 0, "dependencies": ["21"] },
  { "id": "23", "name": "Drywall Hanging and Finishing", "start": "2025-10-16", "end": "2025-11-05", "days_to_complete": 20, "progress": 0, "dependencies": ["22"] },
  { "id": "24", "name": "Interior Painting (Walls and Ceilings)", "start": "2025-11-06", "end": "2025-11-20", "days_to_complete": 15, "progress": 0, "dependencies": ["23"] },
  { "id": "25", "name": "Install Interior Doors and Trim", "start": "2025-11-21", "end": "2025-12-05", "days_to_complete": 15, "progress": 0, "dependencies": ["24"] },
  { "id": "26", "name": "Install Cabinetry and Countertops", "start": "2025-12-06", "end": "2025-12-20", "days_to_complete": 15, "progress": 0, "dependencies": ["25"] },
  { "id": "27", "name": "Flooring Installation (Tile, Hardwood, Carpet)", "start": "2025-12-21", "end": "2026-01-10", "days_to_complete": 20, "progress": 0, "dependencies": ["26"] },
  { "id": "28", "name": "Install Electrical Fixtures", "start": "2026-01-11", "end": "2026-01-20", "days_to_complete": 10, "progress": 0, "dependencies": ["27"] },
  { "id": "29", "name": "Install Plumbing Fixtures", "start": "2026-01-21", "end": "2026-01-30", "days_to_complete": 10, "progress": 0, "dependencies": ["28"] },
  { "id": "30", "name": "Final HVAC Testing and Balancing", "start": "2026-01-31", "end": "2026-02-10", "days_to_complete": 10, "progress": 0, "dependencies": ["29"] },
  { "id": "31", "name": "Exterior Painting and Finishing", "start": "2026-02-11", "end": "2026-02-25", "days_to_complete": 15, "progress": 0, "dependencies": ["30"] },
  { "id": "32", "name": "Driveway and Walkway Construction", "start": "2026-02-26", "end": "2026-03-10", "days_to_complete": 13, "progress": 0, "dependencies": ["31"] },
  { "id": "33", "name": "Landscaping and Final Grading", "start": "2026-03-11", "end": "2026-03-25", "days_to_complete": 15, "progress": 0, "dependencies": ["32"] },
  { "id": "34", "name": "Final Cleaning", "start": "2026-03-26", "end": "2026-03-31", "days_to_complete": 6, "progress": 0, "dependencies": ["33"] },
  { "id": "35", "name": "Final Inspection and Punch List", "start": "2026-04-01", "end": "2026-04-10", "days_to_complete": 10, "progress": 0, "dependencies": ["34"] },
  { "id": "36", "name": "Handover to Client", "start": "2026-04-11", "end": "2026-04-15", "days_to_complete": 5, "progress": 0, "dependencies": ["35"] }
]


// Convert DAG to Gantt-compatible format
const convertDagToGanttTasks = (dag) => {
  return dag.map((task) => ({
    start: new Date(task.start),
    end: new Date(task.end),
    name: task.name,
    id: task.id,
    type: 'task',
    progress: task.progress,
    isDisabled: true,
    styles: { progressColor: '#ffbb54', progressSelectedColor: '#ff9e0d' },
    dependencies: task.dependencies,
  }));
};

const GanttChart = () => {
  const tasks = convertDagToGanttTasks(constructionTasks);

  const handleTaskChange = (updatedTask) => {
    console.log("Updated Task:", updatedTask);
  };

  return (
    <div>
      <h1>Project Workflow</h1>
      <Gantt
        tasks={tasks}
        onTaskChange={handleTaskChange}
        viewMode="Month" // Day, Week, Month
        listCellWidth=""
      />
    </div>
  );
};

export default GanttChart;