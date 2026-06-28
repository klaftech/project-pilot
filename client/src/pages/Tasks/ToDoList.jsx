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
            <div className="bg-white border rounded-xl shadow-sm flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">{title}</h2>
                        {isLoaded && <p className="text-sm text-muted-foreground mt-0.5">{tasklist.length} task{tasklist.length !== 1 ? 's' : ''} awaiting update</p>}
                    </div>
                </div>
                <Separator orientation="horizontal" />
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {!isLoaded ? "Tasks are still loading..." : tasklist.length > 0 ? tasklist : (
                            <p className="col-span-full text-center text-muted-foreground py-8">All caught up! No pending updates.</p>
                        )}
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