import { useState } from 'react'
import ProjectContext from './ProjectContext'

export default function ProjectContextProvider({ children }) {
    const [project, setProject] = useState(null);
    return (
        <ProjectContext.Provider value={{project, setProject}}>
            {children}
        </ProjectContext.Provider>
    )
}