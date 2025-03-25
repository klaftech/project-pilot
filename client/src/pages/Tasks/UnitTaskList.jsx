import TaskCardColumn from './TaskCardColumn'
import TaskCard from './TaskCard'
import { getToday, isDateToday, getDiffToday } from '@/utils/date.js'
import { useState } from 'react'

export const UnitTaskList = ({ tasks, isLoaded, handleClickEdit, handleClickView, handleClickComplete, handleClickDelete }) => {
    
    // if(tasks.length > 0){
    //     const task_start = tasks[0].start
    //     task_start.setHours(0,0,0,0)
    //     //console.log("TS",task_start)
    //     //console.log("TD",getToday())
    //     //console.log("M",task_start.getTime() === getToday().getTime())
    // }
    
    const displayOptions = {
        displayUnit: false,
        displayStatus: false,
        displaySchedule: false,
        displayProgress: true,
        clickEdit: false,
        clickView: true,
        clickDelete: false,
        clickComplete: true,
        clickStatusUpdate: true
    }

    const tasksToday = tasks.filter(task => {
        return isDateToday(task.start) && task.complete_status == false 
    }).map((task) => {                               
        return <TaskCard key={task.id} task={task} displayOptions={displayOptions} onClickEdit={handleClickEdit} onClickView={handleClickView} onClickComplete={handleClickComplete} onClickDelete={handleClickDelete} />
    })

    const tasksUpcoming = tasks.filter(task => {
        return getDiffToday(task.start) <= 7 && getDiffToday(task.start) > 0 && task.complete_status == false
    }).map((task) => {
        return <TaskCard key={task.id} task={task} displayOptions={displayOptions} onClickEdit={handleClickEdit} onClickView={handleClickView} onClickComplete={handleClickComplete} onClickDelete={handleClickDelete} />
    })

    const tasksDue = tasks.filter(task => {
        return getDiffToday(task.start) < 0 && task.complete_status == false
    }).map((task) => {
        return <TaskCard key={task.id} task={task} displayOptions={displayOptions} onClickEdit={handleClickEdit} onClickView={handleClickView} onClickComplete={handleClickComplete} onClickDelete={handleClickDelete} />
    })
    
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            { /*
            // grid-cols-1: For very small screens (mobile phones), it will show one column.
            // sm:grid-cols-2: For small screens, it will display two cards per row.
            // md:grid-cols-3: For medium screens (tablets), it will display three cards per row.
            // lg:grid-cols-4: For larger screens (laptops), it will display four cards per row.
            // xl:grid-cols-5: For extra large screens (desktops), it will display five cards per row.
            */ }
            <TaskCardColumn title="TODAY" isLoaded={isLoaded} tasklist={tasksToday} />
            <TaskCardColumn title="UPCOMING" isLoaded={isLoaded} tasklist={tasksUpcoming} />
            <TaskCardColumn title="DUE" isLoaded={isLoaded} tasklist={tasksDue} />
        </div>
    )
}
export default UnitTaskList