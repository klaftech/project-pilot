import { Badge } from "@/components/ui/badge"

const StatusBadge = ({task}) => {
    if(task.complete_status == true){
        return (<Badge className="bg-green-500">Completed</Badge>)
    } else if(task.end < new Date()){
        //variant="destructive"
        return (<Badge className="bg-red-500">Delayed</Badge>)
    } else if(task.start < new Date() && task.end > new Date()){
        return (<Badge className="bg-yellow-500">In Progress</Badge>)
    }
    return (<Badge className="bg-yellow-500">Pending</Badge>)
}
export default StatusBadge