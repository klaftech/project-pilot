import { Routes, Route, useNavigate, useLocation } from "react-router";
import { useEffect, useState, useContext } from 'react'
import ScheduleContainer from "./ScheduleContainer";
import ListContainer from './ListContainer'
import TasksContainer from './TasksContainer';
import Signup from './Signup'
import Login from './Login'
import Logout from './Logout'

import { taskBuilder, taskDefault } from './helpers.js'

import UserContext from './context/UserContext'
import ProjectContext from './context/ProjectContext'

import ToastDemo from "./ToastDemo";
import TaskInnerForm from './_TaskInnerForm'
import TaskDetailsById from './TaskDetailsById'
import ProjectDetailsById from './ProjectDetailsById'
import ProjectOverview from './ProjectOverview'
import App from './App'
import ComingSoon from './ComingSoon'
import CSS from './_CSS'

function AppRoutes() {
    
    // ********************************************************************
    // ********************* START USER AUTHORIZATION *********************
    // ********************************************************************
    const {user, setUser} = useContext(UserContext);
    const {project, setProject} = useContext(ProjectContext);
    const navigate = useNavigate()
    let location = useLocation()
    //console.log("AppRoutes ContextProject: ",project)
    //console.log("AppRoutes ContextUser: ",user)
    //console.log(location)

    useEffect(() => {
        if(location.pathname != "/signup"){
            fetchUser()
        }
    }, [])

    const fetchUser = () => (
        fetch('/api/authorize')
        .then(res => {
            if(res.ok){
                res.json()
                .then(data => {
                    setUser(data)
                    console.log("user validated by session: "+data.email+" ID:"+data.id)
                    
                    //set default selected project to 1
                    setProject(1)
                })
            } else {
                navigate('/login')
            }
        })
    )
    // ********************************************************************
    // ********************** ENG USER AUTHORIZATION **********************
    // ********************************************************************
    

    
    // ********************************************************************
    // ******************** START MANAGE TASKS DATA ***********************
    // ********************************************************************
    const [tasks, setTasks] = useState([])

    useEffect(() => {
        if((location.pathname != "/signup") && (location.pathname != "/login")){
            fetchTasks()
        }
    }, [])

    const fetchTasks = () => (
        fetch('/api/tasks')
        .then(res => {
            if(res.ok){
                res.json()
                .then(data => {
                    buildTaskList(data)
                    //console.log(data)
                })
            } else {
                console.log("error fetching tasks")
            }
        })
    )
    
    const buildTaskList = (tasks) => {
        const tasklist = tasks.map(task => {
            return taskBuilder(task)
        })
        setTasks(tasklist)
        console.log('AppRoutes: tasklist reloaded')
    }

    const handleUpdateTask = (data) => {
        // ideally, we can just filter and replace the object in the tasklist state,
        // howeve, since updating a task may cause cascading schedule changes, we must re-load all tasklist data
        // 
        // we can check if this task already exists in state (otherwise, new record, must re-update?), 
        // if it does, check if dates changed (we only have cascading changes on date edit, otherwise was simple name change)
        // only if there is any date change must we re-load full tasklist
        // WHAT ABOUT MARKING COMPLETE???? that would cascade dependent tasks....
        
        // for now, just reload all date....
        fetchTasks()
    }

    const handleReloadTasks = () => {
        fetchTasks()
    }
    //console.log(tasks)
    // ********************************************************************
    // ******************** END MANAGE TASKS DATA *************************
    // ********************************************************************



    if((!user) && (location.pathname != "/signup")) return (
        <Login/>
    )
    
    return (
        <Routes>
            <Route path="/" element={<TasksContainer tasks={tasks} pushUpdateTask={handleUpdateTask} reloadTasks={handleReloadTasks} />} />
            {/*}
            <Route path="project/:projectId" element={<ProjectDetailsById />} />
            <Route path="task/:taskId" element={<TaskDetailsById tasks={tasks} pushUpdateTask={handleUpdateTask} reloadTasks={handleReloadTasks} />} />
            <Route path="tasks" element={<TasksContainer tasks={tasks} pushUpdateTask={handleUpdateTask} reloadTasks={handleReloadTasks} />} />
            <Route path="list" element={<ListContainer tasks={tasks} />} />
            <Route path="schedule" element={<ScheduleContainer tasks={tasks} />} />
            <Route path="signup" element={<Signup />} />
            */}
            <Route path="login" element={<Login />} />
            <Route path="logout" element={<Logout updateUser={setUser} />} />

            {/* <Route path="overview" element={<ProjectOverview tasks={tasks} />} />
            <Route path="form" element={<TaskInnerForm />} />
            <Route path="toast" element={<ToastDemo />} />
            <Route path="css" element={<CSS />} /> */}
            {/*<Route path="/" element={<App tasks={tasks} />} />*/}
            
            <Route path="*" element={<ComingSoon endpoint="404" />} />
        </Routes>
    )
}

export default AppRoutes