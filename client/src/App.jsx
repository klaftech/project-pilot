import { Routes, Route, useNavigate, useLocation } from "react-router";
import { useEffect, useContext, lazy, Suspense } from 'react'
import LoadingWrapper from '@/components/LoadingWrapper'

// pages load on first visit; Home, Login and Signup stay in the main bundle
const ProjectDetailsById = lazy(() => import('@/pages/Project/ProjectDetailsById'))
const UnitDetailsById = lazy(() => import('@/pages/Unit/UnitDetailsById'))
const UnitCreateWrapper = lazy(() => import('@/pages/Unit/UnitCreateWrapper'))
const MasterTaskDetailsById = lazy(() => import('@/pages/MasterTask/MasterTaskDetailsById'))
const TaskDetailsById = lazy(() => import('@/pages/Task/TaskDetailsById'))
const TasksContainer = lazy(() => import('@/pages/Tasks/TasksContainer'))
const ListContainer = lazy(() => import('@/pages/List/ListContainer'))
const ScheduleContainer = lazy(() => import('@/pages/Schedule/ScheduleContainer'))
const OverviewContainer = lazy(() => import('@/pages/Overview/OverviewContainer'))
const AdminContainer = lazy(() => import('@/pages/Admin/AdminContainer'))
const ProfilePage = lazy(() => import('@/pages/Profile/Profile'))
const ToastDemo = lazy(() => import('@/dev/_ToastDemo'))
const TaskInnerForm = lazy(() => import('@/dev/_TaskInnerForm'))
const AppDev = lazy(() => import('@/dev/_AppDev'))

import TasksHomeContainer from '@/pages/Tasks/TasksHomeContainer';
import Signup from '@/pages/Signup/Signup'
import Login from '@/pages/Login/Login'
import Logout from '@/pages/Logout/Logout'
import HTTP404 from '@/pages/404/HTTP404'
import Navbar from '@/components/Navbar'


import UserContext from '@/context/UserContext'
import { toast } from "sonner"
import ShowAlert from "@/components/ShowAlert";
import AppWrapper from '@/components/AppWrapper'

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

    /* bypass issue of blank page showing on users with no project permissions, since they technically are "logged in" but have no access to any content */
    if(user && user.selectedProject == null && location.pathname != "/logout") return (
        <AppWrapper>
             <ShowAlert message="You do not have any project permissions. Please contact your administrator." />
        </AppWrapper>
    )

    return (
        <>
        {/* since adding to App instead of individual pages, navigation pane doesn't auto-close on selection, moved to save on projects reload */}
        <Suspense fallback={<AppWrapper><LoadingWrapper /></AppWrapper>}>
        <Routes>
            <Route index element={<TasksHomeContainer />} />
            <Route path="project/:projectId" element={<ProjectDetailsById />} />
            <Route path="unit/create" element={<UnitCreateWrapper />} />
            <Route path="unit/:unitId" element={<UnitDetailsById />} />
            <Route path="task/:taskId" element={<TaskDetailsById />} />
            <Route path="mastertask/:taskId" element={<MasterTaskDetailsById />} />
            <Route path="tasks" element={<TasksContainer />} />
            <Route path="list" element={<ListContainer />} />
            <Route path="schedule" element={<ScheduleContainer />} />
            <Route path="overview" element={<OverviewContainer />} />
            <Route path="admin" element={<AdminContainer />} />
            <Route path="signup" element={<Signup />} />
            <Route path="login" element={<Login />} />
            <Route path="logout" element={<Logout updateUser={setUser} />} />
            <Route path="profile" element={<ProfilePage />} />

            {import.meta.env.DEV && (
                <>
                    <Route path="form" element={<TaskInnerForm />} />
                    <Route path="toast" element={<ToastDemo />} />
                    <Route path="dev" element={<AppDev />} />
                </>
            )}
            
            <Route path="*" element={<HTTP404 endpoint={location.pathname} />} />
        </Routes>
        </Suspense>
        </>
    )
}

export default App