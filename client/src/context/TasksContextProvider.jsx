import { useState } from 'react'
import TasksContext from './TasksContext'

export default function TasksContextProvider({ children }) {
    const [tasks, setTasks] = useState([]);
    return (
        <TasksContext.Provider value={{tasks, setTasks}}>
            {children}
        </TasksContext.Provider>
    )
}