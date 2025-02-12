//convert string to javascript date object
export const stringToDate = (string) => {
    if(string != null){
        return new Date(string.replace(" ","T"))
    } else {
        return string
    }        
    //"pin_start": task.pin_start.slice(0,10), //remove time
}

export const isDate = (value) => {
    return value instanceof Date && !isNaN(value);
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