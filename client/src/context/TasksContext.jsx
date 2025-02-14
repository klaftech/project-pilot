import { createContext } from "react";
const TasksContext = createContext({tasks: null, setTasks: () => null});
export default TasksContext