import Navbar from '@/components/Navbar'
import TaskCard from './TaskCard'
import DialogTaskForm from './DialogTaskForm'
//import { tasks_data } from './tasks_data.js' 
import ShowAlert from '@/components/ShowAlert'
import { getToday, isDateToday, getDiffToday } from '@/utils/date.js'

import { useState, useContext } from 'react'
import { useNavigate } from 'react-router'

import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react";

import UserContext from '@/context/UserContext'
import ProjectContext from '@/context/ProjectContext'

export function TasksContainer({ tasks, pushUpdateTask, reloadTasks }) {
    
    const navigate = useNavigate();
    const {user, setUser} = useContext(UserContext);
    //const {userProject, setUserProject} = useContext(ProjectContext);

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
        const url = "api/tasks/"+task.id
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

    const handleClickDelete = async (task) => {
        const url = "api/tasks/"+task.id
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

    // if(tasks.length > 0){
    //     const task_start = tasks[0].start
    //     task_start.setHours(0,0,0,0)
    //     //console.log("TS",task_start)
    //     //console.log("TD",getToday())
    //     //console.log("M",task_start.getTime() === getToday().getTime())
    // }

    const tasksToday = tasks.filter(task => {
        return isDateToday(task.start) && task.complete_status == false 
    }).map((task) => {                               
        return <TaskCard key={task.id} task={task} onClickEdit={handleClickEdit} onClickView={handleClickView} onClickComplete={handleClickComplete} onClickDelete={handleClickDelete} />
    })

    const tasksUpcoming = tasks.filter(task => {
        return getDiffToday(task.start) <= 7 && getDiffToday(task.start) > 0 && task.complete_status == false
    }).map((task) => {
        return <TaskCard key={task.id} task={task} onClickEdit={handleClickEdit} onClickView={handleClickView} onClickComplete={handleClickComplete} onClickDelete={handleClickDelete} />
    })

    const tasksDue = tasks.filter(task => {
        return getDiffToday(task.start) < 0 && task.complete_status == false
    }).map((task) => {
        return <TaskCard key={task.id} task={task} onClickEdit={handleClickEdit} onClickView={handleClickView} onClickComplete={handleClickComplete} onClickDelete={handleClickDelete} />
    })
    
    return (
        <>
            <Navbar/>

            {alert && <ShowAlert message={alert}/>}
            
            <div className="flex items-center px-2 m-1">
                <Button onClick={()=>{
                        setIsOpen(!isOpen)
                        setFormScenario("create")
                        setTaskEditObject(null)
                    }} variant="outline">Create Task
                </Button>
                <ChevronRight />
                {user && user.selectedProject && <Badge>Project {user.selectedProject}</Badge>}
            </div>

            <DialogTaskForm isOpen={isOpen} setIsOpen={setIsOpen} taskEditObject={taskEditObject} formScenario={formScenario} pushUpdateTask={pushUpdateTask} />
            
            {/* <div className="container mx-auto p-6">
                { 
                // grid-cols-1: For very small screens (mobile phones), it will show one column.
                // sm:grid-cols-2: For small screens, it will display two cards per row.
                // md:grid-cols-3: For medium screens (tablets), it will display three cards per row.
                // lg:grid-cols-4: For larger screens (laptops), it will display four cards per row.
                // xl:grid-cols-5: For extra large screens (desktops), it will display five cards per row.
                }
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    
                    {tasks.map((task) => {
                        return <TaskCard key={task.id} task={task} />
                    })}

                </div>
            </div> */}

            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                <div className="bg-white p-6 shadow-lg rounded-lg flex flex-col">
                    <div className="text-center">
                        TODAY
                    </div>
                    <Separator orientation="horizontal" />
                    <div className="container mx-auto p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-6">
                            {tasksToday.length > 0 ? tasksToday : "All caught up!"}
                        </div>
                    </div>
                </div>
                

                <div className="bg-white p-6 shadow-lg rounded-lg flex flex-col">
                    <div className="text-center">
                        UPCOMING
                    </div>
                    <Separator orientation="horizontal" />
                    <div className="container mx-auto p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-6">
                            {tasksUpcoming.length > 0 ? tasksUpcoming : "All caught up!"}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 shadow-lg rounded-lg flex flex-col">
                    <div className="text-center">
                        DUE
                    </div>
                    <Separator orientation="horizontal" />
                    <div className="container mx-auto p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-6">
                            {tasksDue.length > 0 ? tasksDue : "All caught up!"}
                        </div>
                    </div>
                </div>

            </div>
        </>
    )
}
export default TasksContainer