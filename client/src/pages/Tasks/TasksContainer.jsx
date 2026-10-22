import AppWrapper from '@/components/AppWrapper'
import TaskCard from './TaskCard'
import ShowAlert from '@/components/ShowAlert'


import { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router'
import ProjectsContext from '@/context/ProjectsContext'
import UnitsContext from '@/context/UnitsContext'
import UnitFilter from '@/components/UnitFilter'

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
    
    const { tasks, isLoaded, removeTask, updateTask, reloadTasks } = useManageTasks();

    const navigate = useNavigate();
    const {user, setUser} = useContext(UserContext);
    const {projects} = useContext(ProjectsContext);
    const {units} = useContext(UnitsContext);
    const selectedProject = projects.find(p => p.id == user?.selectedProject)
    const selectedUnit = units.find(u => u.id == user?.selectedUnit)

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
            
            // TODO: updateTask(data) instead
            removeTask(data)
            reloadTasks()
        } catch (error) {
            console.log(error)
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
                
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-2">
                <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
                    {selectedProject && <Link to={`/project/${selectedProject.id}`} className="font-medium hover:underline">{selectedProject.name}</Link>}
                    <ChevronRight className="size-4 text-muted-foreground" />
                    {selectedUnit && <Link to={`/unit/${selectedUnit.id}`} className="font-medium hover:underline">{selectedUnit.name}</Link>}
                </nav>
                <div className="flex flex-wrap items-center gap-3">
                    <UnitFilter />
                    <Button asChild variant="outline" size="sm"><Link to="/list">All tasks for this unit</Link></Button>
                </div>
            </div>

            <DialogPopupForm isOpen={isOpen} setIsOpen={setIsOpen} title="Create Task" description="Make changes to your task here. Click save when you're done." >
                <FormWrapper formScenario={formScenario} taskEditObj={taskEditObject} pushUpdateTask={updateTask} submitHook={handleSubmitHook} >
                    <FormFields form="" />
                    <DialogFooter>
                        <Button type="submit">Save changes</Button>    
                    </DialogFooter>
                </FormWrapper>
            </DialogPopupForm>
            
            <UnitTaskList tasks={tasks} isLoaded={isLoaded} handleClickEdit={handleClickEdit} handleClickView={handleClickView} handleClickComplete={handleClickComplete} />
        
        </AppWrapper>
    )
}
export default TasksContainer