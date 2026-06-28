import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CircleCheckBig, Trash, Eye, Pencil, TrendingUp } from "lucide-react";
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

    return (
        <div className="group bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
            <div>
                <p className="font-semibold text-sm leading-snug">{task.name}</p>
                {displayOptions.displayUnit && task.unit && <p className="text-xs text-muted-foreground mt-0.5">{task.unit.name}</p>}
            </div>

            {displayOptions.displayProgress && 
            <Progress value={task.progress} className="h-1.5" />
            }

            {displayOptions.displayStatus && 
                <div>
                    <StatusBadge task={task} />
                </div>
            }

            {displayOptions.displaySchedule && 
                <p className="text-xs text-muted-foreground">
                    {isDateToday(task.start) ? "Today" : formatDatePretty(task.start)} — {isDateToday(task.end) ? "Today" : formatDatePretty(task.end)}
                </p>
            }

            {/* Secondary icon actions */}
            {(displayOptions.clickEdit || displayOptions.clickView || displayOptions.clickComplete || displayOptions.clickDelete) && (
            <div className="flex gap-3 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {displayOptions.clickEdit && 
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Pencil className="size-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" onClick={()=>onClickEdit(task)} />
                        </TooltipTrigger>
                        <TooltipContent><p>Edit Task</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                }
                {displayOptions.clickView && 
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Eye className="size-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" onClick={()=>onClickView(task)} />
                        </TooltipTrigger>
                        <TooltipContent><p>View Task</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                }
                {displayOptions.clickComplete && 
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <CircleCheckBig 
                                className={`size-4 cursor-pointer transition-colors ${task.complete_status ? "text-green-500" : "text-muted-foreground hover:text-green-500"}`}
                                onClick={()=>{ if(!task.complete_status){ onClickComplete(task) }}}
                            />
                        </TooltipTrigger>
                        <TooltipContent><p>Mark Complete</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                }
                {displayOptions.clickDelete && 
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Trash className="size-4 text-muted-foreground hover:text-destructive cursor-pointer transition-colors" onClick={()=>onClickDelete(task)} />
                        </TooltipTrigger>
                        <TooltipContent><p>Delete Task</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                }
            </div>
            )}

            {/* Primary CTA */}
            {displayOptions.clickStatusUpdate && (
                <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1.5 text-xs mt-auto"
                    onClick={() => onClickStatusUpdate(task)}
                >
                    <TrendingUp className="size-3.5" />
                    Update Status
                </Button>
            )}
        </div>
    )
}
export default TaskCard