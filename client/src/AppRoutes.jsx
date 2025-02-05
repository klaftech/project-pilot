import { Routes, Route, useNavigate } from "react-router";
import { useEffect, useState, useContext } from 'react'
import ScheduleContainer from "./ScheduleContainer";
import ListContainer from './ListContainer'
import TasksContainer from './TasksContainer';
import Login from './Login'
import Logout from './Logout'

import UserContext from './context/UserContext'

import TaskInnerForm from './TaskInnerForm'
import App from './App'
import ComingSoon from './ComingSoon'
import CSS from './CSS'

function AppRoutes() {
    const {user, setUser} = useContext(UserContext);
    const navigate = useNavigate()

    useEffect(() => {
        fetchUser()
    }, [])

    const fetchUser = () => (
        fetch('/api/authorize')
        .then(res => {
            if(res.ok){
                res.json()
                .then(data => {
                    setUser(data)
                    console.log("user validated by session: "+data.email+" ID:"+data.id)
                })
            } else {
                navigate('/login')
            }
        })
    )

    



    // ********************************************************************
    // ******************** START MANAGE TASKS DATA ***********************
    // ********************************************************************
    const defaultTask = [
        {
            "id": null,
            "name": null,
            "start": null,
            "end": null,
            "days_length": null,
            "progress": null
        }
    ]
    const [tasks, setTasks] = useState([])

    useEffect(() => {
        fetchTasks()
    }, [])

    const fetchTasks = () => (
        fetch('/api/tasks')
        .then(res => {
            if(res.ok){
                res.json()
                .then(data => {
                    buildTasksShape(data)
                    //console.log(data)
                })
            } else {
                console.log("error fetching tasks")
            }
        })
    )
    
    const buildTasksShape = (tasks) => {
        const task_json = tasks.map(task => {
            return {
                "id": task.id,
                "name": task.name,
                "start": task.sched_start.slice(0,10), //remove time
                "end": task.sched_end.slice(0,10), // remove time
                "days_length": task.days_length,
                "progress": task.progress
            }
        })
        setTasks(task_json)
    }

    //console.log(tasks)
    // ********************************************************************
    // ******************** END MANAGE TASKS DATA *************************
    // ********************************************************************





    if(!user) return (
        <Login/>
    )
    
    return (
        <Routes>
            <Route path="/" element={<App tasks={tasks} />} />
            <Route path="tasks" element={<TasksContainer tasks={tasks} />} />
            <Route path="list" element={<ListContainer tasks={tasks} />} />
            <Route path="schedule" element={<ScheduleContainer />} />
            <Route path="css" element={<CSS />} />
            <Route path="login" element={<Login />} />
            <Route path="logout" element={<Logout updateUser={setUser} />} />
            <Route path="form" element={<TaskInnerForm />} />
            <Route path="*" element={<ComingSoon endpoint="404" />} />
        </Routes>
    )
}

export default AppRoutes