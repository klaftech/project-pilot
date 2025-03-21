//import { useLocation } from "react-router";
import { useState, useEffect, useContext } from 'react'
import { taskBuilder } from '@/utils/task.js'
import UserContext from '@/context/UserContext'
import TasksContext from '@/context/TasksContext'

// custom hook that retrieves and updates tasks
export function useManageTasks() {
    const {user, setUser} = useContext(UserContext);
    const {tasks, setTasks} = useContext(TasksContext);
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        if(tasks.length == 0){
            fetchTasks()
            console.log("useEffect fired: fetching tasks")
        } else {
            setIsLoaded(true)
        }
    }, [])
    
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
            task.unit = {id: user.selectedUnit}
            return taskBuilder(task)
        })
        setTasks(tasklist)
        setIsLoaded(true)
        console.log('ManageTasksHook: tasklist reloaded')
    }

    // TODO: must diffrentiate between mastertasks and unittasks
    const updateTask = (data) => {
        // ideally, we can just filter and replace the object in the tasklist state,
        // howeve, since updating a task may cause cascading schedule changes, we must re-load all tasklist data
        // 
        // we can check if this task already exists in state (otherwise, new record, must re-update?), 
        // if it does, check if dates changed (we only have cascading changes on date edit, otherwise was simple name change)
        // only if there is any date change must we re-load full tasklist
        // WHAT ABOUT MARKING COMPLETE???? that would cascade dependent tasks....
        
        // for now, just reload all date....
        //setIsLoaded(false)
        fetchTasks()
    }

    const reloadTasks = () => {
        setIsLoaded(false)
        fetchTasks()
    }
       
    //reload tasks on selectedUnit change
    if(isLoaded && tasks.length > 0 && tasks[0].unit.id != user.selectedUnit){
        console.log("detected change to user.selectedUnit, reloading tasks")
        reloadTasks()
    }

    return { tasks, isLoaded, updateTask, reloadTasks }
}