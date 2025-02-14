import { createContext } from "react";
const ProjectsContext = createContext({projects: [], setProjects: () => null});
export default ProjectsContext