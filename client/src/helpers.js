//convert string to javascript date object
export const stringToDate = (string) => {
    return new Date(string.replace(" ","T"))
    //"pin_start": task.pin_start.slice(0,10), //remove time
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
        "dependencies": task.dependencies.map(task => task.id), //sending array of IDs. if changing this, ensure that updated in GanttChart.jsx as well 
        "group": {
            "id": task.group.id,
            "name": task.group.name,
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

export const getToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
}

export const formatDatePretty = (date) => {
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    });   
}

export const formatDatePrettyMMDD = (date) => {
    return date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit' 
    });   
}

export const isDateToday = (date) => {
    const today = getToday()
    
    //set to midnight
    date.setHours(0, 0, 0, 0)
    
    //parse out date without time
    if(today.getTime() == date.getTime()){
        return true
    } else {
        return false
    }
}

export const getDiffToday = (date) => {
    //set to midnight
    date.setHours(0, 0, 0, 0)
    
    return (date.getTime() - getToday().getTime())/1000/60/60/24
}