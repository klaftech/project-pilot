import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react";

import AppWrapper from '@/components/AppWrapper'
import UserContext from '@/context/UserContext'
import UnitTaskList from './UnitTaskList'
import ToDoList from './ToDoList'
import { taskBuilder } from '@/utils/task';

import { DialogPopupForm, DialogFooter } from './DialogPopupForm'
import FormFields from '@/components/form/status_update/FormFields'
import FormWrapper from '@/components/form/status_update/FormWrapper'

export function TasksHomeContainer() {
    
    const navigate = useNavigate();
    const {user, setUser} = useContext(UserContext);

    // ********************************************************************
    // ******************** START MANAGE TASKS DATA ***********************
    // ********************************************************************
    const [tasks, setTasks] = useState([])
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        fetchTasks()
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
    //console.log(tasks)
    // ********************************************************************
    // ******************** END MANAGE TASKS DATA *************************
    // ********************************************************************


    const [isOpen, setIsOpen] = useState(false)
    const [formScenario, setFormScenario] = useState(false)
    const [modelObj, setModelObj] = useState(null)


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

    // see TasksContainer.jsx for code
    const handleClickDelete = async (task) => {
        console.log("No action")
    }

    const handleClickStatusUpdate = (task) => {
        setModelObj({task_id: task.id})
        setFormScenario("add")
        setIsOpen(!isOpen)
    }


    
    const handleSubmitHook = (data) => {
        //console.log('status saved')
        
        // close dialog popup
        setIsOpen(!isOpen)

        //filter out this task using task_id
        const newTasks = tasks.filter(task => task.id !== data.task_id)
        setTasks(newTasks)
    }

    return (
        <AppWrapper>
            <div className="flex items-center px-2 m-1">
                {user && user.selectedProject && <Badge>Project {user.selectedProject}</Badge>}
            </div>

            <DialogPopupForm isOpen={isOpen} setIsOpen={setIsOpen} title="Save Update" description="Enter Weekly Task Status Update" >
                <FormWrapper formScenario={formScenario} modelObj={modelObj} onSubmitHook={handleSubmitHook} >
                    <FormFields form="" />
                    <DialogFooter>
                        <Button type="submit">Save</Button>    
                    </DialogFooter>
                </FormWrapper>
            </DialogPopupForm>

            <ToDoList tasks={tasks} isLoaded={isLoaded} handleClickEdit={handleClickEdit} handleClickView={handleClickView} handleClickComplete={handleClickComplete} handleClickDelete={handleClickDelete} handleClickStatusUpdate={handleClickStatusUpdate} />
            {/* <UnitTaskList tasks={tasks} handleClickEdit={handleClickEdit} handleClickView={handleClickView} handleClickComplete={handleClickComplete} handleClickDelete={handleClickDelete} /> */}
        </AppWrapper>
    )
}
export default TasksHomeContainer