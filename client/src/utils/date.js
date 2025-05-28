//convert string to javascript date object
export const stringToDate = (dateString, asUtc = true) => {
    if(dateString != null){
        //return new Date(string.replace(" ","T"))
        let isoString = dateString.trim().replace(" ", "T");
        if (asUtc) {
            isoString += "Z";
        }
        return new Date(isoString);
    } else {
        return dateString
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
        timeZone: 'America/New_York',
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    });   
}

export const formatDatePrettyMMDD = (date) => {
    return date.toLocaleDateString('en-US', { 
        timeZone: 'America/New_York',
        month: '2-digit', 
        day: '2-digit' 
    });   
}

export const formatDateTimePretty = (date) => {
    return date.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true  // Set to true for 12-hour format
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

//returns difference in days count (integer) between 2 days
export const getDaysDiff = (date1, date2) => {
    const timeDifference = date2.getTime() - date1.getTime();
    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    return daysDifference;
}

export const getDiffToday = (date) => {
    //set to midnight
    date.setHours(0, 0, 0, 0)
    
    return (date.getTime() - getToday().getTime())/1000/60/60/24
}

export function getNextMonday() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const daysUntilMonday = (7 - dayOfWeek) % 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday;
}

export function getPreviousMonday() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const daysToSubtract = dayOfWeek === 0 ? 7 : dayOfWeek;
    
    const previousMonday = new Date(today);
    previousMonday.setDate(today.getDate() - daysToSubtract);

    return previousMonday;
}

export function getPreviousPreviousMonday() {
    const prevprevMonday = new Date(getPreviousMonday());
    prevprevMonday.setDate(prevprevMonday.getDate() - 7);

    return prevprevMonday;
}