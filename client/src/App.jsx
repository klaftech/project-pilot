import { Routes, Route, useNavigate, useLocation } from "react-router";
import { useEffect, useContext } from 'react'

import ProjectDetailsById from '@/pages/Project/ProjectDetailsById'
import MasterTaskDetailsById from '@/pages/MasterTask/MasterTaskDetailsById'
import TaskDetailsById from '@/pages/Task/TaskDetailsById'
import TasksContainer from '@/pages/Tasks/TasksContainer';
import TasksHomeContainer from '@/pages/Tasks/TasksHomeContainer';
import ListContainer from '@/pages/List/ListContainer'
import ScheduleContainer from "@/pages/Schedule/ScheduleContainer";
import OverviewContainer from '@/pages/Overview/OverviewContainer'
import Signup from '@/pages/Signup/Signup'
import Login from '@/pages/Login/Login'
import Logout from '@/pages/Logout/Logout'
import HTTP404 from '@/pages/404/HTTP404'
import Navbar from '@/components/Navbar'

import ToastDemo from "@/dev/_ToastDemo";
import TaskInnerForm from '@/dev/_TaskInnerForm'
import AppDev from '@/dev/_AppDev'

import UserContext from '@/context/UserContext'

function App() {
    
    // ********************************************************************
    // ********************* START USER AUTHORIZATION *********************
    // ********************************************************************
    const {user, setUser} = useContext(UserContext);
    const navigate = useNavigate()
    let location = useLocation()
    
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
            <Route index element={<TasksHomeContainer />} />
            <Route path="project/:projectId" element={<ProjectDetailsById />} />
            <Route path="task/:taskId" element={<TaskDetailsById />} />
            <Route path="mastertask/:taskId" element={<MasterTaskDetailsById />} />
            <Route path="tasks" element={<TasksContainer />} />
            <Route path="list" element={<ListContainer />} />
            <Route path="schedule" element={<ScheduleContainer />} />
            <Route path="overview" element={<OverviewContainer />} />
            <Route path="signup" element={<Signup />} />
            <Route path="login" element={<Login />} />
            <Route path="logout" element={<Logout updateUser={setUser} />} />

            <Route path="form" element={<TaskInnerForm />} />
            <Route path="toast" element={<ToastDemo />} />
            <Route path="dev" element={<AppDev />} />
            
            <Route path="*" element={<HTTP404 endpoint={location.pathname} />} />
        </Routes>
        </>
    )
}

export default App