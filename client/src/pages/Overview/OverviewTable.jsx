import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TriangleAlert } from 'lucide-react';
import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router'
import { taskBuilder } from '@/utils/task.js';
import { getReadableStatus } from '@/utils/status_codes.js'
import { stringToDate, getNextMonday, getPreviousPreviousMonday, isDate, formatDatePretty, formatDateTimePretty, getDaysDiff, getToday } from '@/utils/date';
import LoadingWrapper from "@/components/LoadingWrapper"
import UserContext from '@/context/UserContext.jsx'
import { toast } from "sonner"

const statusBackgrounds = { 200: "bg-green-200", 310: "bg-yellow-200", 311: "bg-blue-200", 500: "bg-red-200" }

// most complete first, then the most active
const sortUnits = (units) => [...units].sort((a, b) =>
    b.stats.completion.percent - a.stats.completion.percent || b.stats.counts.count_in_progress - a.stats.counts.count_in_progress
)

function TaskCell({ raw_task }) {
    const task = taskBuilder(raw_task)
    const taskStatusCode = task.status_code
    const status_background = statusBackgrounds[taskStatusCode] ?? ""

    // badge for an update recorded this week (or last week)
    let status_update_badge = null
    if (raw_task.latest_update != null) {
        const updated = stringToDate(raw_task.latest_update.timestamp)
        if (updated > getPreviousPreviousMonday() && updated < getNextMonday()) {
            const latest_update_status = raw_task.latest_update.status
            const update_status_background = latest_update_status == 200 ? "bg-green-500" : latest_update_status == 500 ? "bg-red-500" : "bg-blue-500"
            status_update_badge = <>&nbsp;<Badge className={"text-grey-500 " + update_status_background}>{getReadableStatus(latest_update_status)}</Badge></>
        }
    } else if (raw_task.started_status == true && stringToDate(raw_task.started_date) > getPreviousPreviousMonday()) {
        status_update_badge = " "
    }
    if (taskStatusCode !== 200 && taskStatusCode !== 300 && status_update_badge == null) {
        status_update_badge = <>&nbsp;<Badge className="text-grey-500 bg-red-500" title="No recent status update"><TriangleAlert className="scale-75" aria-label="No recent status update" /></Badge></>
    }

    // days taken vs allotted
    let diff_badge = <>&nbsp;</>
    if (task.started_status == true && isDate(task.started_date)) {
        const range_to = task.complete_status == true && isDate(task.complete_date) ? task.complete_date : getToday()
        const days_diff = getDaysDiff(task.started_date, range_to)
        if (days_diff < 0) {
            // recorded start is after the completion date: a data problem, not a duration
            diff_badge = <>&nbsp;<Badge className="text-grey-500 bg-amber-400" title="Start date is after the completion date">check dates</Badge></>
        } else if (days_diff <= raw_task.master_task.days_length) {
            diff_badge = <>&nbsp;<Badge className="text-grey-500 bg-green-500">{days_diff} days</Badge></>
        } else {
            diff_badge = <>&nbsp;<Badge className="text-grey-500 bg-red-500">{days_diff} days</Badge></>
        }
    }

    return (
        <TableCell className={"px-6 py-4 whitespace-nowrap text-sm text-grey-500 " + status_background}>
            {task.name}{status_update_badge}
            <div className="flex flex-col">
                <span className="text-black">{task.started_status == true && isDate(task.started_date) ? formatDatePretty(task.started_date) : <>&nbsp;</>}</span>
                <span className="text-black">{task.complete_status == true && isDate(task.complete_date) ? formatDatePretty(task.complete_date) : <>&nbsp;</>}</span>
                <span className="text-black">{diff_badge}</span>
            </div>
        </TableCell>
    )
}

// phone layout: one card per unit instead of the wide matrix
function UnitCard({ unit }) {
    const current = unit.tasks.filter(t => !t.complete_status && t.started_status)
    const next = unit.tasks.find(t => !t.complete_status && !t.started_status)
    const stuck = unit.tasks.filter(t => t.status_code === 500).length
    return (
        <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between gap-2">
                <Link to={`/unit/${unit.id}`} className="font-semibold hover:underline">{unit.name}</Link>
                <span className="text-sm text-muted-foreground">{unit.stats.counts.count_completed}/{unit.stats.counts.count_tasks}</span>
            </div>
            <Progress value={unit.stats.completion.percent} className="my-2 h-1.5" aria-label={`${unit.name} completion`} />
            <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Now: </span>{current.length ? current.map(t => t.master_task.name).join(', ') : unit.stats.completion.percent === 100 ? 'Complete' : '—'}</p>
                {next && <p><span className="text-muted-foreground">Next: </span>{next.master_task.name}</p>}
                {stuck > 0 && <p className="font-medium text-red-600">{stuck} stuck</p>}
            </div>
        </div>
    )
}

function OverviewTable() {
    const [project, setProject] = useState(null)
    const [error, setError] = useState(null)
    const { user } = useContext(UserContext);

    useEffect(() => {
        if (!user?.selectedProject) return
        setProject(null)
        setError(null)
        fetch('/api/projects/' + user.selectedProject + '/overview')
            .then(res => res.ok ? res.json() : Promise.reject(res.status))
            .then(data => setProject({ ...data, units: sortUnits(data.units) }))
            .catch(() => {
                toast("Failed to load the overview. Please check your connection and try again.")
                setError("Failed to load the overview. Please check your connection and try again.")
            })
    }, [user?.selectedProject])

    if (error) {
        return <p>{error}</p>
    }
    if (!project) {
        return <>Building your report...<LoadingWrapper /></>
    }

    const max_tasks = project.master_task_count
    const lastUpdate = stringToDate(project.latest_update)

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-3">
                <h2 className="text-xl font-semibold">{project.name}</h2>
                <span className="text-xs text-muted-foreground">
                    Last update: {isDate(lastUpdate) ? formatDateTimePretty(lastUpdate) : "none yet"}
                </span>
            </div>

            {project.units.length === 0 && <p className="px-2 text-sm text-muted-foreground">No units found.</p>}

            <div className="grid gap-3 md:hidden">
                {project.units.map(unit => <UnitCard key={unit.id} unit={unit} />)}
            </div>

            {project.units.length > 0 && (
                <div className="hidden md:block">
                    {/* capped height keeps the sideways scrollbar on screen; the unit column and header stay put */}
                    <TableContainer component={Paper} sx={{ maxHeight: '75vh' }}>
                        <Table stickyHeader size="small" className="min-w-full">
                            <TableHead>
                                <TableRow>
                                    <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" sx={{ left: 0, zIndex: 3 }}>Unit</TableCell>
                                    <TableCell colSpan={3} className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</TableCell>
                                    <TableCell colSpan={max_tasks} className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tasks &nbsp;
                                        <Badge className="bg-green-200 text-grey-50">Completed</Badge>&nbsp;
                                        <Badge className="bg-blue-200 text-grey-50">In Progress</Badge>&nbsp;
                                        <Badge className="bg-red-200 text-grey-50">Stuck</Badge>&nbsp;
                                        <Badge className="bg-yellow-200 text-grey-50">Pending</Badge>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {project.units.map((unit) => (
                                    <TableRow key={unit.id}>
                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 z-10 bg-white">
                                            <Link to={`/unit/${unit.id}`} className="hover:underline">{unit.name}</Link>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{unit.stats.completion.percent}%</TableCell>
                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{unit.stats.counts.count_completed}/{unit.stats.counts.count_tasks}</TableCell>
                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{unit.stats.completion.months} mo</TableCell>
                                        {unit.tasks.map(raw_task => <TaskCell key={raw_task.id} raw_task={raw_task} />)}
                                        {max_tasks > unit.tasks.length && (
                                            <TableCell colSpan={max_tasks - unit.tasks.length} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" />
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            )}
        </div>
    );
}
export default OverviewTable
