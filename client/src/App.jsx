import { Routes, Route, useNavigate, useLocation } from "react-router";
import { useEffect, useState, useContext } from 'react'

import ProjectDetailsById from '@/pages/Project/ProjectDetailsById'
import TaskDetailsById from '@/pages/Task/TaskDetailsById'
import TasksContainer from '@/pages/Tasks/TasksContainer';
import ListContainer from '@/pages/List/ListContainer'
import ScheduleContainer from "@/pages/Schedule/ScheduleContainer";
import OverviewContainer from '@/pages/Overview/OverviewContainer'
import Signup from '@/pages/Signup/Signup'
import Login from '@/pages/Login/Login'
import Logout from '@/pages/Logout/Logout'
import HTTP404 from '@/pages/404/HTTP404'
import Navbar from '@/components/Navbar'

import { taskBuilder } from '@/utils/task.js'
import UserContext from '@/context/UserContext'
import ProjectsContext from '@/context/ProjectsContext'

import ToastDemo from "@/dev/_ToastDemo";
import TaskInnerForm from '@/dev/_TaskInnerForm'
import AppDev from '@/dev/_AppDev'

function App() {
    
    // ********************************************************************
    // ********************* START USER AUTHORIZATION *********************
    // ********************************************************************
    const {user, setUser} = useContext(UserContext);
    const {projects, setsProject} = useContext(ProjectsContext);
    const navigate = useNavigate()
    let location = useLocation()
    //console.log("AppRoutes ContextsProject: ",projects)
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
        if((user) && (location.pathname != "/signup") && (location.pathname != "/login")){
            fetchTasks()
        }
    }, [location.pathname, user])

    const fetchTasks = () => {
        // let project_filter = ""
        // if(user && user.selectedProject){
            const project_filter = "?project_id="+user.selectedProject
        // }
        fetch('/api/tasks'+project_filter)
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
    }
    
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
        <Login />
    )

    /* bypass issue of Navbar showing on signup page */
    if(location.pathname == "/signup") return (
        <Signup />
    )

    return (
        <>
        {/* since adding to App instead of individual pages, navigation pane doesn't auto-close on selection, moved to save on projects reload */}
        <Routes>
            <Route index element={<TasksContainer tasks={tasks} pushUpdateTask={handleUpdateTask} reloadTasks={handleReloadTasks} />} />
            <Route path="project/:projectId" element={<ProjectDetailsById />} />
            <Route path="task/:taskId" element={<TaskDetailsById tasks={tasks} pushUpdateTask={handleUpdateTask} reloadTasks={handleReloadTasks} />} />
            <Route path="tasks" element={<TasksContainer tasks={tasks} pushUpdateTask={handleUpdateTask} reloadTasks={handleReloadTasks} />} />
            <Route path="list" element={<ListContainer tasks={tasks} />} />
            <Route path="schedule" element={<ScheduleContainer tasks={tasks} />} />
            <Route path="overview" element={<OverviewContainer tasks={tasks} />} />
            <Route path="signup" element={<Signup />} />
            <Route path="login" element={<Login />} />
            <Route path="logout" element={<Logout updateUser={setUser} />} />

            <Route path="form" element={<TaskInnerForm />} />
            <Route path="toast" element={<ToastDemo />} />
            <Route path="dev" element={<AppDev tasks={tasks} />} />
            
            <Route path="*" element={<HTTP404 endpoint={location.pathname} />} />
        </Routes>
        </>
    )
}

export default App