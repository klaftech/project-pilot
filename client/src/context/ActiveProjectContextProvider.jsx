import { useState } from 'react'
import ActiveProjectContext from './ActiveProjectContext'

export default function ActiveProjectContextProvider({ children }) {
    const [activeProject, setActiveProject] = useState([]);
    return (
        <ActiveProjectContext.Provider value={{activeProject, setActiveProject}}>
            {children}
        </ActiveProjectContext.Provider>
    )
}