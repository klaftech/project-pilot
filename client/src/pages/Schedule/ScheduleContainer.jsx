import { useState } from 'react'
import GanttChart from './gantt-chart/GanttChart'
import AppWrapper from '@/components/AppWrapper'
import LoadingWrapper from "@/components/LoadingWrapper"
import UnitFilter from '@/components/UnitFilter'
import { useManageTasks } from '@/hooks/useManageTasks'
import { projectSchedule, scheduleSummary } from '@/utils/schedule'
import { formatDatePretty } from '@/utils/date'

const barStyles = {
    completed: { backgroundColor: '#22c55e', backgroundSelectedColor: '#16a34a', progressColor: '#16a34a', progressSelectedColor: '#15803d' },
    in_progress: { backgroundColor: '#3b82f6', backgroundSelectedColor: '#2563eb', progressColor: '#1d4ed8', progressSelectedColor: '#1e40af' },
    projected: { backgroundColor: '#94a3b8', backgroundSelectedColor: '#64748b', progressColor: '#64748b', progressSelectedColor: '#475569' },
}

function ScheduleContainer() {
    const { tasks, isLoaded } = useManageTasks()
    const [collapsed, setCollapsed] = useState(new Set())

    // 1. project the schedule from actual progress (stored dates are the original plan)
    const projected = projectSchedule(tasks.filter(task => task.start && task.end))
    const summary = scheduleSummary(projected)

    // 2. structure tasks as required for gantt chart
    const scheduledTasks = projected.map((task) => ({
        id: task.id,
        name: task.name,
        type: 'task',
        start: task.projectedStart,
        end: task.projectedEnd,
        plannedStart: task.start,
        plannedEnd: task.end,
        scheduleState: task.scheduleState,
        progress: task.progress,
        dependencies: task.dependencies,
        project: 10000 + task.group.id,
        styles: barStyles[task.scheduleState],
        isDisabled: true,
    }));

    // 3. one summary bar per group, spanning its tasks' projected dates
    const groups = {}
    scheduledTasks.forEach(task => {
        const group = groups[task.project]
        const source = projected.find(t => t.id === task.id)
        groups[task.project] = {
            name: source.group.name,
            start: group && group.start < task.start ? group.start : task.start,
            end: group && group.end > task.end ? group.end : task.end,
        }
    })
    const preppedGroups = Object.entries(groups).map(([id, values]) => ({
        id: parseInt(id),
        name: values.name,
        type: 'project',
        start: values.start,
        end: values.end,
        progress: 0,
        isDisabled: true,
        hideChildren: collapsed.has(parseInt(id)),
        styles: { backgroundColor: '#fcd34d', backgroundSelectedColor: '#fbbf24' },
    }))

    // 4. sort by date, groups before their tasks
    const sortedTasks = scheduledTasks.concat(preppedGroups).sort((a, b) => {
        if (a.start.getTime() !== b.start.getTime()) {
            return a.start.getTime() - b.start.getTime()
        }
        return a.type.localeCompare(b.type) // 'project' before 'task'
    }).map((element, index) => ({ ...element, displayOrder: index + 1 }))

    // group expand/collapse from the chart
    const handleSetTasks = (newTasks) => {
        setCollapsed(new Set(newTasks.filter(t => t.type === 'project' && t.hideChildren).map(t => t.id)))
    }

    return (
        <AppWrapper>
            <div className="mx-auto w-full min-w-0 py-2 md:p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Actual progress with the remaining work projected from today</p>
                    </div>
                    {isLoaded && <UnitFilter />}
                </div>
                {isLoaded && summary && (
                    <div className="mb-4 flex flex-wrap gap-x-8 gap-y-2 rounded-md border bg-white px-4 py-3 text-sm">
                        <span>Planned finish: <b>{formatDatePretty(summary.plannedEnd)}</b></span>
                        <span>{summary.done ? 'Finished' : 'Projected finish'}: <b>{formatDatePretty(summary.projectedEnd)}</b></span>
                        {!summary.done && (
                            <span className={summary.slipDays > 0 ? 'font-semibold text-red-600' : 'font-semibold text-green-700'}>
                                {summary.slipDays > 0 ? `${summary.slipDays} days behind plan` : 'On or ahead of plan'}
                            </span>
                        )}
                    </div>
                )}
                {!isLoaded && <LoadingWrapper />}
                {isLoaded && sortedTasks.length > 0 && <GanttChart tasks={sortedTasks} setTasks={handleSetTasks} />}
                {isLoaded && sortedTasks.length <= 0 && <p className="text-muted-foreground">No tasks found for this unit.</p>}
            </div>
        </AppWrapper>
    )
}

export default ScheduleContainer
