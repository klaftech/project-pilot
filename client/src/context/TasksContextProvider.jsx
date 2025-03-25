import { useState } from 'react'
import TasksContext from './TasksContext'

// used by useManageTasks hook to save selected project+unit's tasks
export default function TasksContextProvider({ children }) {
    const [tasks, setTasks] = useState([]);
    return (
        <TasksContext.Provider value={{tasks, setTasks}}>
            {children}
        </TasksContext.Provider>
    )
}