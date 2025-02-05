import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Pencil , CircleCheck, CircleCheckBig, Calendar } from "lucide-react";
import { useState } from 'react'


import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"

export function TaskCard({ task, onClickEdit }) {
    const [isHoveringEdit, setIsHoveringEdit] = useState(false);
    const [isHoveringComplete, setIsHoveringComplete] = useState(false);

    const [showForm, setShowForm] = useState(false);

    
    const formatDatePretty = (date_string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        
        const date = new Date(date_string+" 00:00:00");
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        });
        
        if((today < date) || (today > date)){
            return formattedDate
        } else {
            return "Today"
        }
        
        
    }
    
    return (

        <div className="bg-white p-6 shadow-lg rounded-lg flex flex-col">
            {/* <div className="flex p-1">
                <Progress value={50} className="w-[60%]" />
            </div> */}
            <p className="font-medium">{task.name}</p>
            <p className="text-muted-foreground">{task.progress}%</p>
            <p className="py-3 text-sm text-muted-foreground">
            {formatDatePretty(task.start)} - {formatDatePretty(task.end)}
            </p>
            <div className="mt-2 flex gap-4">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Pencil 
                                className="size-5 text-muted-foreground" 
                                onClick={()=>onClickEdit(task)} 
                                color={isHoveringEdit ? "red" : "black"}
                                onMouseEnter={() => setIsHoveringEdit(true)}
                                onMouseLeave={() => setIsHoveringEdit(false)}
                            />            
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Update Task</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                    
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <CircleCheckBig 
                                className="size-5 text-muted-foreground" 
                                onClick={()=>alert("click")} 
                                color={isHoveringComplete ? "red" : "black"}
                                onMouseEnter={() => setIsHoveringComplete(true)}
                                onMouseLeave={() => setIsHoveringComplete(false)}
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Mark Complete</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                        
              <a href="#">
                <div className="size-5 text-muted-foreground" />
              </a>
            </div>

            
        </div>
    )
}
export default TaskCard