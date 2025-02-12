import { stringToDate } from './date.js'

export const getTaskStatus = (task) => {
    let status
    if(task.complete_status == true){
        status = "completed"
    } else if(task.end < new Date()){
        status = "delayed"
    } else if(task.start <= new Date() && task.end >= new Date()){
        status = "in_progress"
    } else {
        status = "scheduled"
    }
    return status
}

export const taskBuilder = (task) => {
    return {
        "id": task.id,
        "name": task.name,
        "start": stringToDate(task.sched_start),
        "end": stringToDate(task.sched_end),
        "pin_start": stringToDate(task.pin_start),
        "pin_end": stringToDate(task.pin_end),
        "days_length": task.days_length,
        "progress": task.progress,
        "complete_status": task.complete_status, 
        //"dependencies": task.dependencies.map(task => taskBuilder(task)) //as of now we dont need full recursive dependencies.
        "dependencies": task.dependencies ? task.dependencies.map(task => task.id) : [], //sending array of IDs. if changing this, ensure that updated in GanttChart.jsx as well 
        "group": {
            "id": task.group ? task.group.id : null,
            "name": task.group ? task.group.name : null,
        },
    }
}

export const taskDefault = {
    "id": null,
    "name": null,
    "start": null,
    "end": null,
    "pin_start": null,
    "pin_end": null,
    "days_length": null,
    "progress": null,
    "complete_status": null
}