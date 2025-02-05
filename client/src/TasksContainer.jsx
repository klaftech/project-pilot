import Navbar from './Navbar'
//import { tasks_data } from './tasks_data.js' 
import TaskCard from './TaskCard'
import { Separator } from "@/components/ui/separator"
import TaskForm from './TaskForm'
import { useState } from 'react'
import { Button } from "@/components/ui/button"

export function TasksContainer({tasks}) {
    
    //convert object to array
    //const tasks = Object.values(tasks_data)

    // // data shape
    // const tasks = [
    //     {
    //       "id": "206",
    //       "name": "Sign Contract",
    //       "start": "2025-01-29",
    //       "end": "2025-02-05",
    //       "days_length": 7,
    //       "progress": 0
    //     },

    const [isOpen, setIsOpen] = useState(false)
    const [formScenario, setFormScenario] = useState(false)
    const [taskEditObject, setTaskEditObject] = useState(null)

    const handleClickEdit = (task) => {
        setTaskEditObject(task)
        setFormScenario("update")
        setIsOpen(!isOpen)
    }

    return (
        <>
            <Navbar />

            <Button onClick={()=>{
                setIsOpen(!isOpen)
                setFormScenario("create")
                setTaskEditObject(null)
            }} variant="outline">Create Task</Button>
            
            <TaskForm isOpen={isOpen} setIsOpen={setIsOpen} taskEditObject={taskEditObject} formScenario={formScenario} />
            
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
                            {tasks.map((task) => {
                                return <TaskCard key={task.id} task={task} onClickEdit={handleClickEdit} />
                            })}
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
                            {tasks.map((task) => {
                                return <TaskCard key={task.id} task={task} />
                            })}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 shadow-lg rounded-lg flex flex-col">
                    <div className="text-center">
                        DELAYED
                    </div>
                    <Separator orientation="horizontal" />
                    <div className="container mx-auto p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-6">
                            {tasks.map((task) => {
                                return <TaskCard key={task.id} task={task} />
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </>
    )
}
export default TasksContainer