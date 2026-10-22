import { useParams, useNavigate, Link } from "react-router"
import { useEffect, useState, useContext } from 'react'

import AppWrapper from '@/components/AppWrapper.jsx'
import LoadingWrapper from "@/components/LoadingWrapper.jsx"
import ShowAlert from '@/components/ShowAlert'
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import UserContext from '@/context/UserContext'
import ProjectsContext from '@/context/ProjectsContext'
import ActiveProjectContext from '@/context/ActiveProjectContext'
import { useUpdateUser } from '@/hooks/useUpdateUser'
import { taskBuilder } from '@/utils/task'
import { projectSchedule, scheduleSummary } from '@/utils/schedule'
import { stringToDate, formatDatePretty, isDate } from '@/utils/date'
import { getReadableStatus } from '@/utils/status_codes'

const statusLabels = {
    planning: "Planning",
    in_progress: "In progress",
    on_schedule: "On schedule",
    delayed: "Delayed",
    completed: "Completed",
}

const Stat = ({ label, value, className = "" }) => (
    <div className="rounded-lg border bg-white p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={"mt-1 text-xl font-semibold " + className}>{value}</p>
    </div>
)

function UnitDetailsById() {
    const { unitId } = useParams()
    const navigate = useNavigate()
    const updateUser = useUpdateUser()
    const { user } = useContext(UserContext)
    const { projects } = useContext(ProjectsContext)
    const { setActiveProject } = useContext(ActiveProjectContext)

    const [unit, setUnit] = useState(null)
    const [tasks, setTasks] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        setUnit(null); setTasks(null); setError(null)
        fetch('/api/units/' + unitId)
            .then(res => res.ok ? res.json() : Promise.reject(res.status))
            .then(setUnit)
            .catch(() => setError("Unable to load this unit."))
        fetch('/api/unittasks?unit_id=' + unitId)
            .then(res => res.ok ? res.json() : Promise.reject(res.status))
            .then(data => setTasks(data.map(taskBuilder)))
            .catch(() => setError("Unable to load this unit's tasks."))
    }, [unitId])

    if (error) {
        return <AppWrapper><ShowAlert message={error} /></AppWrapper>
    }
    if (!unit || !tasks) {
        return <AppWrapper><LoadingWrapper /></AppWrapper>
    }

    const stats = unit.stats
    const projected = projectSchedule(tasks.filter(t => t.start && t.end))
    const summary = scheduleSummary(projected)
    const inProgress = projected.filter(t => t.scheduleState === 'in_progress')
    const upNext = projected
        .filter(t => t.scheduleState === 'projected')
        .sort((a, b) => a.projectedStart - b.projectedStart)
        .slice(0, 3)
    const lastUpdate = stringToDate(stats.updates.latest_update !== 'None' ? stats.updates.latest_update : null)

    // open another page for this unit: make it the selected unit (and its project) first
    const openFor = (path) => {
        const project = projects.find(p => p.id == unit.project_id)
        if (project && user.selectedProject != project.id) {
            setActiveProject(project)
            updateUser({ selectedProject: project.id, selectedUnit: unit.id })
        } else {
            updateUser({ selectedUnit: unit.id })
        }
        navigate(path)
    }

    return (
        <AppWrapper>
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            <Link to={`/project/${unit.project.id}`} className="hover:underline">{unit.project.name}</Link>
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight">{unit.name}</h1>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => openFor('/schedule')}>Schedule</Button>
                        <Button variant="outline" size="sm" onClick={() => openFor('/list')}>Task list</Button>
                    </div>
                </div>

                <div className="rounded-lg border bg-white p-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium">{stats.completion.percent}% complete</span>
                        <Badge variant="outline">{statusLabels[stats.status] ?? stats.status}</Badge>
                    </div>
                    <Progress value={stats.completion.percent} className="h-2" aria-label="Unit completion" />
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Stat label="Completed" value={`${stats.counts.count_completed} / ${stats.counts.count_tasks}`} />
                    <Stat label="Underway" value={inProgress.length} />
                    <Stat label="Past planned end" value={stats.counts.count_overdue} className={stats.counts.count_overdue > 0 ? "text-red-600" : ""} />
                    <Stat label="Last update" value={isDate(lastUpdate) ? formatDatePretty(lastUpdate) : "None yet"} />
                </div>

                {summary && (
                    <div className="flex flex-wrap gap-x-8 gap-y-2 rounded-lg border bg-white p-4 text-sm">
                        <span>Planned finish: <b>{formatDatePretty(summary.plannedEnd)}</b></span>
                        <span>{summary.done ? 'Finished' : 'Projected finish'}: <b>{formatDatePretty(summary.projectedEnd)}</b></span>
                        {!summary.done && summary.slipDays > 0 && <span className="font-semibold text-red-600">{summary.slipDays} days behind plan</span>}
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <section className="rounded-lg border bg-white p-4">
                        <h2 className="mb-3 font-semibold">Underway</h2>
                        {inProgress.length === 0 && <p className="text-sm text-muted-foreground">Nothing underway.</p>}
                        <ul className="space-y-2">
                            {inProgress.map(t => (
                                <li key={t.id} className="flex justify-between gap-2 text-sm">
                                    <Link to={`/task/${t.id}`} className="hover:underline">{t.name}</Link>
                                    <span className="text-muted-foreground">{getReadableStatus(t.status_code)} since {formatDatePretty(t.started_date)}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                    <section className="rounded-lg border bg-white p-4">
                        <h2 className="mb-3 font-semibold">Up next</h2>
                        {upNext.length === 0 && <p className="text-sm text-muted-foreground">{summary?.done ? "All tasks are complete." : "Nothing scheduled."}</p>}
                        <ul className="space-y-2">
                            {upNext.map(t => (
                                <li key={t.id} className="flex justify-between gap-2 text-sm">
                                    <Link to={`/task/${t.id}`} className="hover:underline">{t.name}</Link>
                                    <span className="text-muted-foreground">projected {formatDatePretty(t.projectedStart)}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </div>
        </AppWrapper>
    )
}
export default UnitDetailsById
