import { stringToDate, isDate } from './date.js'

//accepts taskBuilder object, returns string
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

//accepts taskBuilder object, returns integer
export const getTaskStatusCode = (task) => {
    // if((raw_task.latest_update != null) && (raw_task.latest_update.status == 500)){
    //     //stuck. task is not completed and there is a status update 500
    //     return 500
    if(task.complete_status == true || isDate(task.complete_date)){
        //completed
        return 200
    } else if(task.progress === 0 && (task.started_status === true || isDate(task.started_date))){
        //pending. previous task is completed, but task not yet begun
        return 310
    } else if(task.progress != 0 || task.started_status){
        //in progress. task is not completed, is not stuck and progress in more than 0
        return 311
    } else {
        //scheduled. task is not completed and there is no progress yet
        return 300
    }
}

//accepts string, returns string
export const getReadableTaskStatus = (status) => {
    let read = "N/A"
    if(status == "completed"){
        read = "Completed"
    } else if(status == "delayed"){
        read = "Delayed"
    } else if(status == "in_progress"){
        read = "In Progress"
    } else if(status == "on_schedule"){
        read = "On Schedule"
    } else if(status == "scheduled"){
        read = "Scheduled"
    }
    return read
}

//accepts raw api json response, return taskBuilder object
export const taskBuilder = (task) => {
    //console.log(task)
    const isUnit = task.unit ? true : false
    const isMasterTask = task.master_task ? true : false
    return {
        "id": task.id,
        "name": isMasterTask ? task.master_task.name : null,
        "start": stringToDate(task.sched_start),
        "end": stringToDate(task.sched_end),
        "pin_start": stringToDate(task.pin_start),
        "pin_end": stringToDate(task.pin_end),
        "days_length": isMasterTask ? task.master_task.days_length : null,
        "progress": task.progress,
        "started_status": task.started_status,
        "started_date": stringToDate(task.started_date),
        "complete_status": task.complete_status,
        "complete_date": stringToDate(task.complete_date),
        //"dependencies": task.dependencies.map(task => taskBuilder(task)) //as of now we dont need full recursive dependencies.
        "dependencies": task.parents ? task.parents.map(task => task.id) : [], //sending array of IDs. if changing this, ensure that updated in GanttChart.jsx as well 
        "group": {
            "id": isMasterTask && task.master_task.group ? task.master_task.group.id : null,
            "name": isMasterTask && task.master_task.group ? task.master_task.group.name : null,
        },
        "unit": {
            "id": isUnit && task.unit ? task.unit.id : null,
            "name": isUnit && task.unit ? task.unit.name : null,
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
    "started_status": null,
    "started_date": null,
    "complete_status": null
}