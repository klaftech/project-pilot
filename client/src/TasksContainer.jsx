import Header from './Header'
import { tasks_data } from './tasks_data.js' 
import TaskCard from './TaskCard'

export function TasksContainer() {
    
    //convert object to array
    const tasks = Object.values(tasks_data)

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

    return (
        <>
            <Header />
            <div className="container mx-auto p-6">
                {/* 
                grid-cols-1: For very small screens (mobile phones), it will show one column.
                sm:grid-cols-2: For small screens, it will display two cards per row.
                md:grid-cols-3: For medium screens (tablets), it will display three cards per row.
                lg:grid-cols-4: For larger screens (laptops), it will display four cards per row.
                xl:grid-cols-5: For extra large screens (desktops), it will display five cards per row.
                */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    
                    {tasks.map((task) => {
                        return <TaskCard key={task.id} task={task} />
                    })}

                </div>
            </div>
        </>
    )
}
export default TasksContainer