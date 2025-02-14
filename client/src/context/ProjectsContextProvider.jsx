import { useState } from 'react'
import ProjectsContext from './ProjectsContext'

export default function ProjectsContextProvider({ children }) {
    const [projects, setProjects] = useState([]);
    return (
        <ProjectsContext.Provider value={{projects, setProjects}}>
            {children}
        </ProjectsContext.Provider>
    )
}