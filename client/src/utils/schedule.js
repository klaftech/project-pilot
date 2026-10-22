// Projects a unit's schedule forward from what has actually happened.
//
// The stored sched_start/sched_end are the original plan and never move (review finding C8), so on
// their own they make every unfinished task look late. For display we derive, per task:
//   completed   -> actual dates (started_date .. complete_date)
//   in progress -> started_date .. max(started_date + length, today)
//   not started -> starts no earlier than today, the planned start, or the day after its
//                  latest parent's projected end; ends after its length
// Input: taskBuilder objects (dependencies = parent task ids). Output: same objects plus
// { projectedStart, projectedEnd, scheduleState: 'completed' | 'in_progress' | 'projected' }.

const DAY = 24 * 60 * 60 * 1000

const startOfDay = (date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
}
const addDays = (date, days) => new Date(date.getTime() + days * DAY)
const isValidDate = (value) => value instanceof Date && !isNaN(value)
const latest = (...dates) => new Date(Math.max(...dates.filter(isValidDate).map(d => d.getTime())))

export const projectSchedule = (tasks, today = startOfDay(new Date())) => {
    const byId = new Map(tasks.map(task => [task.id, task]))
    const projected = new Map()

    const project = (task, visiting = new Set()) => {
        if (projected.has(task.id)) return projected.get(task.id)
        if (visiting.has(task.id)) return null  // defensive: the template is a DAG, but never loop
        visiting.add(task.id)

        const length = Math.max(task.days_length || 0, 0)
        let result
        if (task.complete_status && isValidDate(task.complete_date)) {
            const end = task.complete_date
            // a start recorded after completion (C18) is clamped so the bar never runs backwards
            const start = isValidDate(task.started_date) && task.started_date <= end ? task.started_date : end
            result = { projectedStart: start, projectedEnd: end, scheduleState: 'completed' }
        } else if (task.started_status && isValidDate(task.started_date)) {
            const start = task.started_date
            result = { projectedStart: start, projectedEnd: latest(addDays(start, length), today), scheduleState: 'in_progress' }
        } else {
            const parentEnds = (task.dependencies || [])
                .map(id => byId.get(id))
                .filter(Boolean)
                .map(parent => project(parent, visiting)?.projectedEnd)
                .filter(isValidDate)
                .map(end => addDays(end, 1))
            const start = latest(today, task.start, ...parentEnds)
            result = { projectedStart: start, projectedEnd: addDays(start, length), scheduleState: 'projected' }
        }
        projected.set(task.id, result)
        return result
    }

    return tasks.map(task => ({ ...task, ...project(task) }))
}

// planned vs projected finish for the whole unit
export const scheduleSummary = (projectedTasks) => {
    if (projectedTasks.length === 0) return null
    const plannedEnd = latest(...projectedTasks.map(t => t.end))
    const projectedEnd = latest(...projectedTasks.map(t => t.projectedEnd))
    const done = projectedTasks.every(t => t.scheduleState === 'completed')
    return {
        plannedEnd,
        projectedEnd,
        done,
        slipDays: Math.round((startOfDay(projectedEnd) - startOfDay(plannedEnd)) / DAY),
    }
}
