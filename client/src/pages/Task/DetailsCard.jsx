import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { formatDatePretty } from "@/utils/date"
import { useNavigate } from "react-router"

const DetailsCard = ({ task }) => {
    const navigate = useNavigate()
    return (
        <Card>
            <CardHeader>
                <CardTitle>Task Details for <u>{task.name}</u></CardTitle>
                {/* <CardDescription>
                    Make change to your task here. Click save when your done.
                    {show && <ShowAlert message="Changes saved" />}
                </CardDescription> */}
            </CardHeader>
            
            
            <CardContent className="space-y-2">
                <div className="space-y-1">
                    Unit: {task.unit.name}
                </div>
                <div className="space-y-1">
                    Group: {task.group.name}
                </div>
                <div className="space-y-1">
                    Task Length: {task.days_length} days
                </div>

                {task.pin_start &&
                <div className="space-y-1">
                    Pinned Start: {formatDatePretty(task.pin_start)}
                </div>
                }
                {task.pin_end &&
                <div className="space-y-1">
                    Pinned End: {formatDatePretty(task.pin_end)}
                </div>
                }
                
                {/* <div className="space-y-1">
                    Schedule: {formatDatePretty(task.start)} - {formatDatePretty(task.end)}
                </div> */}

                <div className="space-y-1">
                    Progress: {task.progress}%
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={()=>navigate(-1)}>Return</Button>
            </CardFooter>

                    
                {/* 
                <div className="space-y-1">
                    <Label htmlFor="current">Current password</Label>
                    <Input id="current" type="password" />
                    </div>
                    <div className="space-y-1">
                    <Label htmlFor="new">New password</Label>
                    <Input id="new" type="password" />
                </div> 
                */}
        </Card>
    )
}
export default DetailsCard