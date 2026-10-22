import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CircleCheckBig, Eye, Pencil, TrendingUp } from "lucide-react";
import { formatDatePretty, isDateToday, formatDaysAgo, isDate, getToday } from '@/utils/date.js'
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
        clickComplete: true,
        clickStatusUpdate: true
    }, 
    onClickEdit = ()=>console.log("clicked"), 
    onClickView = ()=>console.log("clicked"), 
    onClickComplete = ()=>console.log("clicked"), 
    onClickStatusUpdate = ()=>console.log("clicked") 
}) {

    return (
        <div className="group bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
            <div>
                <p className="font-semibold text-sm leading-snug">{task.name}</p>
                {displayOptions.displayUnit && task.unit && <p className="text-xs text-muted-foreground mt-0.5">{task.unit.name}</p>}
            </div>

            {displayOptions.displayStaleness && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Last update: {formatDaysAgo(task.latest_update?.timestamp)}</span>
                    {!task.complete_status && isDate(task.end) && task.end < getToday() && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 font-medium text-red-700">Past planned end</span>
                    )}
                </div>
            )}

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
            {(displayOptions.clickEdit || displayOptions.clickView || displayOptions.clickComplete) && (
            <div className="flex gap-3 pt-1 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                {displayOptions.clickEdit && 
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button type="button" aria-label="Edit task" onClick={()=>onClickEdit(task)} className="text-muted-foreground hover:text-foreground transition-colors"><Pencil className="size-4" /></button>
                        </TooltipTrigger>
                        <TooltipContent><p>Edit Task</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                }
                {displayOptions.clickView && 
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button type="button" aria-label="View task" onClick={()=>onClickView(task)} className="text-muted-foreground hover:text-foreground transition-colors"><Eye className="size-4" /></button>
                        </TooltipTrigger>
                        <TooltipContent><p>View Task</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                }
                {displayOptions.clickComplete && 
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                aria-label="Mark complete"
                                disabled={task.complete_status}
                                onClick={()=>{ if(!task.complete_status){ onClickComplete(task) }}}
                                className={`transition-colors ${task.complete_status ? "text-green-500" : "text-muted-foreground hover:text-green-500"}`}
                            >
                                <CircleCheckBig className="size-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent><p>Mark Complete</p></TooltipContent>
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