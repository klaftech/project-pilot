import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react";

import AppWrapper from '@/components/AppWrapper'
import UserContext from '@/context/UserContext'
import ProjectsContext from '@/context/ProjectsContext'
import UnitTaskList from './UnitTaskList'
import ToDoList from './ToDoList'
import { taskBuilder } from '@/utils/task';

import { DialogPopupForm, DialogFooter } from './DialogPopupForm'
import FormFields from '@/components/form/status_update/FormFields'
import FormWrapper from '@/components/form/status_update/FormWrapper'

export function TasksHomeContainer() {
    
    const navigate = useNavigate();
    const {user, setUser} = useContext(UserContext);
    const {projects} = useContext(ProjectsContext);
    const activeProjectName = projects.find(p => p.id === user?.selectedProject)?.name ?? null;

    // ********************************************************************
    // ******************** START MANAGE TASKS DATA ***********************
    // ********************************************************************
    const [tasks, setTasks] = useState([])
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        if (user && user.selectedProject) {
            fetchTasks()
        }
    }, [])

    const fetchTasks = () => {
        fetch('/api/unittasks/pending_update/project/'+user.selectedProject)
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
        setIsLoaded(true)
        console.log('TasksHomeContainer: ToDo List loaded')
    }
    console.log(tasks)
    // ********************************************************************
    // ******************** END MANAGE TASKS DATA *************************
    // ********************************************************************


    const [isOpen, setIsOpen] = useState(false)
    const [formScenario, setFormScenario] = useState(false)
    const [modelObj, setModelObj] = useState(null)
    const [taskObj, setTaskObj] = useState(null)

    const handleClickEdit = (task) => {
        console.log("No action")
    }

    const handleClickView = (task) => {
        navigate('/task/'+task.id)
    }

    const handleClickComplete = async (task) => {
        const url = "api/unittasks/"+task.id
        try {
            const response = await fetch(
                url,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        complete_status: true,
                    }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            )
            if(!response.ok){
                //throw new Error(`Response status: ${response.status}`);
                throw new Error(response.status);
            }
            
            const data = await response.json()
            console.log("onClickComplete(): task updated")
            console.log("onClickComplete() response: ",data)
            
            pushUpdateTask(data)
        } catch (error) {
            console.log(error)
        }
    }

    const handleClickStatusUpdate = (task) => {
        setModelObj({task_id: task.id})
        setTaskObj(task)
        setFormScenario("create")
        setIsOpen(!isOpen)
    }


    
    const handleSubmitHook = (data) => {
        //console.log('status saved')
        
        // close dialog popup
        setIsOpen(!isOpen)

        //filter out this task using task_id
        const newTasks = tasks.filter(task => task.id !== data.task_id)
        setTasks(newTasks)

        setTaskObj(null)
    }

    return (
        <AppWrapper>
            {activeProjectName && (
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold tracking-tight">{activeProjectName}</h1>
                    <p className="text-sm text-muted-foreground mt-1">Weekly task status updates</p>
                </div>
            )}

            <DialogPopupForm isOpen={isOpen} setIsOpen={setIsOpen} title={taskObj ? taskObj.name : "Save Update"} description={taskObj?.unit ? taskObj.unit.name : "Weekly task status update"} >
                <FormWrapper formScenario={formScenario} modelObj={modelObj} onSubmitHook={handleSubmitHook} >
                    <FormFields form="" taskObj={taskObj} />
                    <DialogFooter>
                        <Button type="submit">Save Update</Button>    
                    </DialogFooter>
                </FormWrapper>
            </DialogPopupForm>

            <ToDoList tasks={tasks} isLoaded={isLoaded} handleClickEdit={handleClickEdit} handleClickView={handleClickView} handleClickComplete={handleClickComplete} handleClickStatusUpdate={handleClickStatusUpdate} />
            {/* <UnitTaskList tasks={tasks} handleClickEdit={handleClickEdit} handleClickView={handleClickView} handleClickComplete={handleClickComplete} /> */}
        </AppWrapper>
    )
}
export default TasksHomeContainer