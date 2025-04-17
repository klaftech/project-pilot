import { stringToDate } from '@/utils/date.js'
import { getReadableStatus } from '@/utils/status_codes.js'

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
        "status_code": task.status_code,
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
    "status_code": null,
    "started_status": null,
    "started_date": null,
    "complete_status": null
}

//accepts taskBuilder object, returns string
export const getTaskStatus = (task) => {
    return getReadableStatus(task.status_code)
    // let status
    // if(task.complete_status == true){
    //     status = "completed"
    // } else if(task.end < new Date()){
    //     status = "delayed"
    // } else if(task.start <= new Date() && task.end >= new Date()){
    //     status = "in_progress"
    // } else {
    //     status = "scheduled"
    // }
    // return status
}