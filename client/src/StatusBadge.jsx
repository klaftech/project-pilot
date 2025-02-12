import { Badge } from "@/components/ui/badge"
import { getTaskStatus } from './helpers.js' 

const StatusBadge = ({task}) => {
    const task_status = getTaskStatus(task)
    if(task_status == "completed"){
        return (<Badge className="bg-green-500">Completed</Badge>)
    } else if(task_status == "delayed"){
        //variant="destructive"
        return (<Badge className="bg-red-500">Delayed</Badge>)
    } else if(task_status == "in_progress"){
        return (<Badge className="bg-yellow-500">In Progress</Badge>)
    } else if(task_status == "scheduled"){
        return (<Badge className="bg-yellow-500">Scheduled</Badge>)
    }
}
export default StatusBadge