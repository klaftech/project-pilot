import { Routes, Route, useNavigate, useLocation } from "react-router";
import { useState, useEffect, useContext } from 'react'

import { taskBuilder } from '@/utils/task.js'
import UserContext from '@/context/UserContext'

const TaskFetchWrapper = ({ children }) => {

    const {user, setUser} = useContext(UserContext);
    let location = useLocation()

    // ********************************************************************
    // ******************** START MANAGE TASKS DATA ***********************
    // ********************************************************************
    const [tasks, setTasks] = useState([])

    useEffect(() => {
        if((user) && (location.pathname != "/signup") && (location.pathname != "/login")){
            fetchTasks()
            console.log("useEffect fired: fetching tasks: "+location.pathname)
            console.log(user)
        }
    }, [location.pathname, user]) //reload on user change because that is where we store changes of selectedProject and selectedUnit

    const fetchTasks = () => {
        const unit_filter = "?unit_id="+user.selectedUnit
        fetch('/api/unittasks'+unit_filter)
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

    // TODO: must diffrentiate between mastertasks and unittasks
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
    //console.log(user)

    return (
        <>
            {children}
        </>
    )
}
export default TaskFetchWrapper