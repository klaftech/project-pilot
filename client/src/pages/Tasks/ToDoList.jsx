import TaskCardColumn from './TaskCardColumn'
import TaskCard from './TaskCard'
import { getToday, isDateToday, getDiffToday } from '@/utils/date.js'
import { useContext,useState } from 'react'
import { Separator } from "@/components/ui/separator"
import UserContext from '@/context/UserContext'

export const ToDoList = ({ tasks, isLoaded, handleClickEdit, handleClickView, handleClickComplete, handleClickDelete, handleClickStatusUpdate }) => {

    const {user, setUser} = useContext(UserContext);
    
    const displayOptions = {
        displayUnit: true,
        displayStatus: false,
        displaySchedule: false,
        displayProgress: true,
        clickEdit: false,
        clickView: false,
        clickDelete: false,
        clickComplete: false,
        clickStatusUpdate: true
    }
    
    const title = "Pending Updates"

    const tasklist = tasks.map((task) => {
        return <TaskCard key={task.id} task={task} displayOptions={displayOptions} onClickStatusUpdate={handleClickStatusUpdate} />
    })

    return (
        <>
            <div className="bg-white p-6 shadow-lg rounded-lg flex flex-col gap-6">
                <div className="text-center">
                    {title}
                </div>
                <Separator orientation="horizontal" />
                <div className="container mx-auto p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {!isLoaded ? "Tasks are still loading..." : tasklist.length > 0 ? tasklist : "All caught up!"}
                    </div>
                </div>
            </div>
            
            { /*
            // grid-cols-1: For very small screens (mobile phones), it will show one column.
            // sm:grid-cols-2: For small screens, it will display two cards per row.
            // md:grid-cols-3: For medium screens (tablets), it will display three cards per row.
            // lg:grid-cols-4: For larger screens (laptops), it will display four cards per row.
            // xl:grid-cols-5: For extra large screens (desktops), it will display five cards per row.
            */ }
            {/* <TaskCardColumn title="TODAY" isLoaded={isLoaded} tasklist={tasksToday} />
            <TaskCardColumn title="UPCOMING" isLoaded={isLoaded} tasklist={tasksUpcoming} />
            <TaskCardColumn title="DUE" isLoaded={isLoaded} tasklist={tasksDue} /> */}
        </>
    )
}
export default ToDoList