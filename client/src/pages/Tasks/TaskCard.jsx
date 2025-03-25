import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { CircleCheckBig, Trash, Eye, Pencil , TrendingUp, CircleCheck, Calendar, ArrowUpDown, Workflow } from "lucide-react";
import { useState } from 'react'
import { formatDatePretty, isDateToday } from '@/utils/date.js'
import StatusBadge from "@/components/StatusBadge.jsx";

export function TaskCard({ 
    task, 
    displayOptions = {
        displayUnit: false,
        displayStatus: false,
        displaySchedule: false,
        displayProgress: true,
        clickEdit: false,
        clickView: true,
        clickDelete: false,
        clickComplete: true,
        clickStatusUpdate: true
    }, 
    onClickEdit = ()=>console.log("clicked"), 
    onClickView = ()=>console.log("clicked"), 
    onClickDelete = ()=>console.log("clicked"), 
    onClickComplete = ()=>console.log("clicked"), 
    onClickStatusUpdate = ()=>console.log("clicked") 
}) {

    const [isHoveringEdit, setIsHoveringEdit] = useState(false);
    const [isHoveringView, setIsHoveringView] = useState(false);
    const [isHoveringDelete, setIsHoveringDelete] = useState(false);
    const [isHoveringComplete, setIsHoveringComplete] = useState(false);
    const [isHoveringStatusUpdate, setIsHoveringStatusUpdate] = useState(false);

    return (
        <div className="bg-white p-6 shadow-lg rounded-lg flex flex-col">
            <p className="font-medium">{task.name}</p>
            {displayOptions.displayUnit && task.unit && <p className="text-muted-foreground">Unit: {task.unit.name}</p>}
            
            {displayOptions.displayProgress && 
            <div className="flex p-1">
                <Progress value={task.progress} /*className="w-[%60]"}*/ />
            </div>
            }

            {displayOptions.displayStatus && 
                <div>
                    <StatusBadge task={task} />
                </div>
            }

            {displayOptions.displaySchedule && 
                <p className="py-3 text-sm text-muted-foreground">
                    {isDateToday(task.start) ? "Today" : formatDatePretty(task.start)} - {isDateToday(task.end) ? "Today" : formatDatePretty(task.end)}
                </p>
            }
            
            <div className="mt-2 flex gap-4">
                
                {displayOptions.clickEdit && 
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
                }

                {displayOptions.clickView && 
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Eye 
                                className="size-5 text-muted-foreground" 
                                onClick={()=>onClickView(task)}
                                color={isHoveringView ? "red" : "black"}
                                onMouseEnter={() => setIsHoveringView(true)}
                                onMouseLeave={() => setIsHoveringView(false)}
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>View Task</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                }

                {displayOptions.clickComplete && 
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <CircleCheckBig 
                                className="size-5 text-muted-foreground" 
                                onClick={()=>{
                                    if(!task.complete_status){
                                        onClickComplete(task)
                                    }}}
                                color={isHoveringComplete || task.complete_status ? "red" : "black"}
                                onMouseEnter={() => setIsHoveringComplete(true)}
                                onMouseLeave={() => setIsHoveringComplete(false)}
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Mark Complete</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                }

                {displayOptions.clickDelete && 
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Trash 
                                className="size-5 text-muted-foreground" 
                                onClick={()=>onClickDelete(task)}
                                color={isHoveringDelete ? "red" : "black"}
                                onMouseEnter={() => setIsHoveringDelete(true)}
                                onMouseLeave={() => setIsHoveringDelete(false)}
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Delete Task</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                }

                {displayOptions.clickStatusUpdate && 
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <TrendingUp 
                                className="size-5 text-muted-foreground" 
                                onClick={()=>onClickStatusUpdate(task)}
                                color={isHoveringStatusUpdate ? "red" : "black"}
                                onMouseEnter={() => setIsHoveringStatusUpdate(true)}
                                onMouseLeave={() => setIsHoveringStatusUpdate(false)}
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Status Update</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                }
                        
              <a href="#">
                <div className="size-5 text-muted-foreground" />
              </a>
            </div>

            
        </div>
    )
}
export default TaskCard