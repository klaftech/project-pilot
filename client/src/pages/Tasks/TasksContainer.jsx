import AppWrapper from '@/components/AppWrapper'
import TaskCard from './TaskCard'
import ShowAlert from '@/components/ShowAlert'


import { useState, useContext } from 'react'
import { useNavigate } from 'react-router'

import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react";

import { useManageTasks } from '@/hooks/useManageTasks'
import UserContext from '@/context/UserContext'
import UnitTaskList from './UnitTaskList'

import { DialogPopupForm, DialogFooter } from './DialogPopupForm'
import FormFields from '@/components/form/master_task/FormFields'
import FormWrapper from '@/components/form/master_task/FormWrapper'

export function TasksContainer() {
    
    const { tasks, isLoaded, updateTask, reloadTasks } = useManageTasks();

    const navigate = useNavigate();
    const {user, setUser} = useContext(UserContext);

    const [isOpen, setIsOpen] = useState(false)
    const [formScenario, setFormScenario] = useState(false)
    const [taskEditObject, setTaskEditObject] = useState(null)
    const [alert, setAlert] = useState(null)

    const handleClickEdit = (task) => {
        setTaskEditObject(task)
        setFormScenario("update")
        setIsOpen(!isOpen)
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
            
            updateTask(data)
        } catch (error) {
            console.log(error)
        }
    }

    const handleClickDelete = async (task) => {
        const url = "api/unittasks/"+task.id
        try {
            const response = await fetch(
                url,
                {
                    method: "DELETE",
                },
            )
            if(!response.ok){
                //throw new Error(`Response status: ${response.status}`);
                if(response.status == "424"){
                    const data = await response.json()
                    throw new Error(data.error)
                } else {
                    throw new Error(response.status);
                }
            }
            
            console.log("onClickDelete(): task deleted")
            
            reloadTasks()
        } catch (error) {
            console.log(error.message)
            setAlert(error.message)
        }
    }

    const handleSubmitHook = (data) => {
        // close the dialog box
        setIsOpen(!isOpen)
    }

    return (
        <AppWrapper>
            {alert && <ShowAlert message={alert}/>}
            
            <div className="flex items-center px-2 m-1">
                 {/*
                <Button onClick={()=>{
                        setIsOpen(!isOpen)
                        setFormScenario("create")
                        setTaskEditObject(null)
                    }} variant="outline">Create Task
                </Button>
                <ChevronRight />
                */}
                
                {user && user.selectedProject && <Badge>Project {user.selectedProject}</Badge>}
                <ChevronRight />
                {user && user.selectedUnit && <Badge>Unit {user.selectedUnit}</Badge>}
            </div>

            <DialogPopupForm isOpen={isOpen} setIsOpen={setIsOpen} title="Create Task" description="Make changes to your task here. Click save when you're done." >
                <FormWrapper formScenario={formScenario} taskEditObj={taskEditObject} pushUpdateTask={updateTask} submitHook={handleSubmitHook} >
                    <FormFields form="" />
                    <DialogFooter>
                        <Button type="submit">Save changes</Button>    
                    </DialogFooter>
                </FormWrapper>
            </DialogPopupForm>
            
            <UnitTaskList tasks={tasks} isLoaded={isLoaded} handleClickEdit={handleClickEdit} handleClickView={handleClickView} handleClickComplete={handleClickComplete} handleClickDelete={handleClickDelete} />
        
        </AppWrapper>
    )
}
export default TasksContainer