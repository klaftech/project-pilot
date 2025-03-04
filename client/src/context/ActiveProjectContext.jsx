import { createContext } from "react";
const ActiveProjectContext = createContext({activeProject: null, setActiveProject: () => null});
export default ActiveProjectContext