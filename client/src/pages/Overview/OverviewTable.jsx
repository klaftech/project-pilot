import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AlertOctagon, Download, MonitorPlay, Search, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'

import LoadingWrapper from '@/components/LoadingWrapper'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import UserContext from '@/context/UserContext'
import ProjectsContext from '@/context/ProjectsContext'
import { useUpdateUser } from '@/hooks/useUpdateUser'
import { taskBuilder } from '@/utils/task'
import { getReadableStatus } from '@/utils/status_codes'
import { DialogPopupForm, DialogFooter } from '@/pages/Tasks/DialogPopupForm'
import FormFields from '@/components/form/status_update/FormFields'
import FormWrapper from '@/components/form/status_update/FormWrapper'
import { C, fmt, fmtDate, downloadCsv } from '@/pages/Reports/report-format'
import { Segmented, Meter } from '@/pages/Reports/report-ui'
import { CELL, CELL_ORDER, cellLabel, cellStyle, PILL, updatePillColor, daysSince, fmtAgo, fmtTimestamp, overLabel } from '@/pages/Overview/overview-format'

const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'stuck', label: 'Stuck' },
    { value: 'behind', label: 'Behind plan' },
    { value: 'late', label: 'Late update' },
]
const SORTS = {
    name: { label: 'Unit name', fn: (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }) },
    behind: { label: 'Furthest behind', fn: (a, b) => (b.schedule.over_plan_days ?? -1e6) - (a.schedule.over_plan_days ?? -1e6) },
    quiet: { label: 'Longest since update', fn: (a, b) => (daysSince(b.last_update) ?? 1e6) - (daysSince(a.last_update) ?? 1e6) },
    progress: { label: 'Most complete', fn: (a, b) => b.stats.completion.percent - a.stats.completion.percent },
}
const PREFS_KEY = 'overview-grid-prefs'

const readPrefs = () => {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {} } catch { return {} }
}
const writePrefs = (prefs) => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)) } catch { /* private window: preferences just don't stick */ }
}

const CSV_COLUMNS = [
    { label: 'Unit', value: u => u.name },
    { label: 'Stage', value: u => u.stage.replace('_', ' ') },
    { label: 'Complete %', value: u => u.stats.completion.percent },
    { label: 'Tasks done', value: u => u.stats.counts.count_completed },
    { label: 'Tasks', value: u => u.stats.counts.count_tasks },
    { label: 'Length (months)', value: u => u.stats.completion.months },
    { label: 'Days over plan', value: u => u.schedule.over_plan_days },
    { label: 'Finish', value: u => u.schedule.finish },
    { label: 'Finish is projected', value: u => (u.schedule.finish_is_projection ? 'yes' : 'no') },
    { label: 'Planned finish', value: u => u.schedule.planned_finish },
    { label: 'Now', value: u => u.current.join('; ') },
    { label: 'Next', value: u => u.next },
    { label: 'Stuck tasks', value: u => u.stuck },
    { label: 'Late updates', value: u => u.late_updates },
    { label: 'Last update', value: u => u.last_update },
]

function Summary({ s, latest }) {
    const items = [
        { label: 'Complete', value: `${s.completion_pct}%`, detail: `${fmt(s.tasks_done)} of ${fmt(s.tasks_total)} tasks` },
        { label: 'Units', value: `${s.finished} / ${s.units}`, detail: `finished · ${s.in_progress} in progress · ${s.not_started} not started` },
        { label: 'Completed, last 7 days', value: fmt(s.completed_7d), detail: `${fmt(s.completed_prev_7d)} the week before` },
        { label: 'Behind plan', value: fmt(s.behind_plan), detail: 'units' },
        { label: 'Open blockers', value: fmt(s.open_stuck), detail: 'stuck tasks', critical: s.open_stuck > 0 },
        { label: 'Late updates', value: fmt(s.late_updates), detail: `no update since ${fmtDate(s.late_window_start)}` },
        { label: s.completion_is_projection ? 'Projected completion' : 'Completed', value: s.completion_date ? fmtDate(s.completion_date) : '—', detail: `last field update ${fmtAgo(latest)}` },
    ]
    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            {items.map(i => (
                <div key={i.label} className="rounded-xl border bg-white p-3.5">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {i.critical && <AlertOctagon className="size-3.5" style={{ color: C.critical }} aria-hidden />}{i.label}
                    </p>
                    <p className="mt-1 text-xl font-semibold tracking-tight">{i.value}</p>
                    <p className="text-xs text-muted-foreground">{i.detail}</p>
                </div>
            ))}
        </div>
    )
}

// the task-length pill (`large`) is the cell's main figure; the latest-update badge beside the status is secondary
function Pill({ color, children, title, dark = false, large = false }) {
    return <span title={title} className={`inline-flex items-center rounded font-semibold ${large ? 'px-1.5 text-[11px] leading-[1.125rem]' : 'px-1 text-[10px] leading-4'}`} style={{ background: color, color: dark ? '#0b0b0b' : '#ffffff' }}>{children}</span>
}

function Legend() {
    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {CELL_ORDER.map(code => (
                <span key={code} className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-3 rounded-sm border" style={{ background: CELL[code].bg }} />{cellLabel(code)}
                </span>
            ))}
            <span className="inline-flex items-center gap-1.5"><Pill color={PILL.info}>50%</Pill>latest update, if recent</span>
            <span className="inline-flex items-center gap-1.5"><Pill color={PILL.bad}><TriangleAlert className="size-3" aria-hidden /></Pill>update late: none for a full week after it was due</span>
            <span className="inline-flex items-center gap-1.5"><Pill large color={PILL.good}>4 days</Pill><Pill large color={PILL.bad}>21 days</Pill>task length: within plan / over plan (counted from when the prerequisites were done)</span>
        </div>
    )
}

function Cell({ task, onOpen }) {
    const style = cellStyle(task)
    const timing = task.timing
    const days = timing?.elapsed_days
    return (
        <td className="p-0.5">
            <button type="button" onClick={() => onOpen(task)}
                title={`${task.master_task.name} · ${cellLabel(task.status_code)}${days != null ? ` · ${days} of ${timing.planned_days} planned days` : ''}${task.update_late ? ' · update late' : ''}`}
                className="flex h-11 w-full min-w-[4.5rem] flex-col items-center justify-center gap-0.5 rounded border border-black/5 outline-offset-1 hover:brightness-95 focus-visible:outline focus-visible:outline-2"
                style={{ background: style.bg }}>
                <span className="flex gap-0.5">
                    {task.recent_update != null && <Pill color={updatePillColor(task.recent_update)}>{cellLabel(task.recent_update)}</Pill>}
                    {task.update_late && <Pill color={PILL.bad} title="Update late"><TriangleAlert className="size-3" aria-label="update late" /></Pill>}
                </span>
                {timing?.order_issue
                    ? <Pill large color={PILL.check} dark title="Recorded complete before its prerequisites">check dates</Pill>
                    : days != null && <Pill large color={days <= timing.planned_days ? PILL.good : PILL.bad} title={`${days} of ${timing.planned_days} planned days`}>{days} {days === 1 ? 'day' : 'days'}</Pill>}
            </button>
        </td>
    )
}

function TaskDrawer({ selection, onClose, onPostUpdate }) {
    const open = !!selection
    const task = selection?.task
    const unit = selection?.unit
    const t = task?.timing
    return (
        <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                {task && (
                    <>
                        <SheetHeader>
                            <SheetTitle>{task.master_task.name}</SheetTitle>
                            <SheetDescription>{unit.name}</SheetDescription>
                        </SheetHeader>
                        <div className="mt-5 space-y-5 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium" style={{ background: cellStyle(task).bg }}>
                                    {task.status_code === 500 && <AlertOctagon className="size-3.5" aria-hidden />}{cellLabel(task.status_code)}
                                </span>
                                {task.update_late && <Pill color={PILL.bad}><TriangleAlert className="mr-0.5 size-3" aria-hidden />update late</Pill>}
                                {t?.stuck_since && <span className="text-xs text-muted-foreground">since {fmtDate(t.stuck_since)}</span>}
                            </div>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                                <div><dt className="text-xs text-muted-foreground">Prerequisites done</dt><dd>{t?.ready ? fmtDate(t.ready) : 'not yet'}</dd></div>
                                <div><dt className="text-xs text-muted-foreground">Completed</dt><dd>{task.complete_status && task.complete_date ? fmtTimestamp(task.complete_date) : '—'}</dd></div>
                                <div><dt className="text-xs text-muted-foreground">Days taken</dt><dd>{t?.order_issue ? 'unknown' : t?.elapsed_days ?? '—'}</dd></div>
                                <div><dt className="text-xs text-muted-foreground">Planned days</dt><dd>{task.master_task.days_length}</dd></div>
                                <div><dt className="text-xs text-muted-foreground">Over plan</dt><dd style={{ color: t?.excess_days > 0 ? C.critical : undefined }}>{t?.excess_days > 0 ? `+${t.excess_days} days` : t?.elapsed_days != null ? 'no' : '—'}</dd></div>
                                <div><dt className="text-xs text-muted-foreground">Latest update</dt><dd>{task.latest_update ? `${getReadableStatus(task.latest_update.status)} · ${fmtAgo(task.latest_update.timestamp)}` : 'none'}</dd></div>
                            </dl>
                            {t?.order_issue && <p className="text-xs text-muted-foreground">This task was recorded complete before its prerequisites, so its duration isn&apos;t counted.</p>}
                            <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Unit</p>
                                <p className="mt-0.5">{unit.stats.completion.percent}% complete · {overLabel(unit.schedule.over_plan_days)} vs plan</p>
                                <p className="text-xs text-muted-foreground">
                                    {unit.schedule.finish ? `${unit.schedule.finish_is_projection ? 'Projected finish' : 'Finished'} ${fmtDate(unit.schedule.finish)}` : 'Not started'}
                                    {unit.schedule.top_contributors?.length ? ` · held up by ${unit.schedule.top_contributors.map(c => c.task).join(', ')}` : ''}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {!task.complete_status && <Button onClick={() => onPostUpdate(task, unit)}>Post status update</Button>}
                                <Button variant="outline" asChild><Link to={`/task/${task.id}`}>Open task</Link></Button>
                                <Button variant="outline" asChild><Link to={`/unit/${unit.id}`}>Open unit</Link></Button>
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}

// phone layout: one card per unit instead of the wide grid
function UnitCard({ unit, onOpen }) {
    const openTasks = unit.tasks.filter(t => !t.complete_status && t.started_status)
    return (
        <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between gap-2">
                <Link to={`/unit/${unit.id}`} className="font-semibold hover:underline">{unit.name}</Link>
                <span className="text-sm tabular-nums text-muted-foreground">{unit.stats.completion.percent}% · {unit.stats.counts.count_completed}/{unit.stats.counts.count_tasks} · {unit.stats.completion.months} mo</span>
            </div>
            <div className="my-2"><Meter pct={unit.stats.completion.percent} label={`${unit.name} completion`} /></div>
            <p className="text-sm">{overLabel(unit.schedule.over_plan_days)} vs plan{unit.schedule.finish ? ` · ${unit.schedule.finish_is_projection ? 'projected' : 'finished'} ${fmtDate(unit.schedule.finish)}` : ''}</p>
            {openTasks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {openTasks.map(t => (
                        <button key={t.id} type="button" onClick={() => onOpen(t, unit)} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs" style={{ background: cellStyle(t).bg }}>
                            {t.status_code === 500 && <AlertOctagon className="size-3" aria-hidden />}{t.master_task.name}
                            {t.update_late && <TriangleAlert className="size-3" style={{ color: PILL.bad }} aria-label="update late" />}
                        </button>
                    ))}
                </div>
            )}
            {unit.next && <p className="mt-2 text-xs text-muted-foreground">Next: {unit.next} · last update {fmtAgo(unit.last_update)}</p>}
        </div>
    )
}

function OverviewTable() {
    const { user } = useContext(UserContext)
    const { projects } = useContext(ProjectsContext)
    const updateUser = useUpdateUser()
    const [project, setProject] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [prefs, setPrefs] = useState(() => {
        const saved = { filter: 'all', sort: 'name', showFinished: false, hideDoneColumns: true, ...readPrefs() }
        // a filter or sort saved by an earlier version may no longer exist
        if (!FILTERS.some(f => f.value === saved.filter)) saved.filter = 'all'
        if (!SORTS[saved.sort]) saved.sort = 'name'
        return saved
    })
    const [search, setSearch] = useState('')
    const [selection, setSelection] = useState(null)
    const [updating, setUpdating] = useState(null)
    const setPref = (key, value) => setPrefs(p => { const next = { ...p, [key]: value }; writePrefs(next); return next })

    const load = useCallback(() => {
        if (!user?.selectedProject) return
        setLoading(true); setError(null)
        fetch(`/api/projects/${user.selectedProject}/overview`)
            .then(res => res.ok ? res.json() : Promise.reject(res.status))
            .then(setProject)
            .catch(() => {
                toast('Failed to load the overview. Please check your connection and try again.')
                setError('Failed to load the overview. Please check your connection and try again.')
            })
            .finally(() => setLoading(false))
    }, [user?.selectedProject])
    useEffect(load, [load])

    const view = useMemo(() => {
        if (!project) return null
        const q = search.trim().toLowerCase()
        const units = project.units
            .filter(u => prefs.showFinished || u.stage !== 'finished')
            .filter(u => !q || u.name.toLowerCase().includes(q))
            .filter(u => prefs.filter === 'all'
                || (prefs.filter === 'stuck' && u.stuck > 0)
                || (prefs.filter === 'behind' && (u.schedule.over_plan_days ?? 0) > 0)
                || (prefs.filter === 'late' && u.late_updates > 0))
            .sort(SORTS[prefs.sort]?.fn ?? SORTS.name.fn)
        // collapse columns every shown unit has already finished
        const doneEverywhere = new Set(project.columns.map(c => c.id))
        for (const u of units) for (const t of u.tasks) if (!t.complete_status) doneEverywhere.delete(t.master_task.id)
        const columns = prefs.hideDoneColumns && units.length ? project.columns.filter(c => !doneEverywhere.has(c.id)) : project.columns
        const groups = [...new Set(project.columns.map(c => c.group))]
        return { units, columns, hiddenColumns: project.columns.length - columns.length, grouped: groups.length > 1 }
    }, [project, prefs, search])

    if (error && !project) return <p>{error}</p>
    if (!project) return <>Building your overview...<LoadingWrapper /></>

    const s = project.summary
    const finishedHidden = !prefs.showFinished ? s.finished : 0
    const openTask = (task, unit) => setSelection({ task, unit })
    const postUpdate = (task, unit) => { setSelection(null); setUpdating({ task, unit, taskObj: taskBuilder(task) }) }

    return (
        <div className={`min-w-0 space-y-4 ${loading ? 'opacity-70' : ''}`}>
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.series }}>Overview</p>
                    {projects.length > 1 ? (
                        <select aria-label="Project" value={user.selectedProject ?? ''} onChange={e => updateUser({ selectedProject: Number(e.target.value) })}
                            className="mt-1 max-w-full rounded-md bg-transparent text-2xl font-semibold tracking-tight md:text-3xl">
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    ) : <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{project.name}</h1>}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => downloadCsv(`${project.name}-units.csv`, CSV_COLUMNS, view.units)}><Download className="size-4" aria-hidden />Export CSV</Button>
                    <Button asChild><Link to="/overview/display"><MonitorPlay className="size-4" aria-hidden />Wall display</Link></Button>
                </div>
            </header>

            <Summary s={s} latest={project.latest_update} />

            <div className="flex flex-wrap items-center gap-2">
                <label className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a unit" aria-label="Find a unit"
                        className="h-9 w-44 rounded-md border bg-white pl-8 pr-2 text-sm" />
                </label>
                <Segmented label="Filter units" options={FILTERS} value={prefs.filter} onChange={v => setPref('filter', v)} />
                <select aria-label="Sort units" value={prefs.sort} onChange={e => setPref('sort', e.target.value)} className="h-9 rounded-md border bg-white px-2 text-sm">
                    {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>Sort: {v.label}</option>)}
                </select>
                <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" className="size-4 accent-foreground" checked={prefs.showFinished} onChange={e => setPref('showFinished', e.target.checked)} />
                    Show finished units
                </label>
                <label className="hidden items-center gap-2 text-sm md:inline-flex">
                    <input type="checkbox" className="size-4 accent-foreground" checked={prefs.hideDoneColumns} onChange={e => setPref('hideDoneColumns', e.target.checked)} />
                    Hide tasks already done for every unit shown
                </label>
            </div>

            <div className="hidden md:block"><Legend /></div>

            {view.units.length === 0 ? (
                <p className="rounded-xl border bg-white p-6 text-center text-sm text-muted-foreground">
                    No units match. {finishedHidden > 0 && !prefs.showFinished && `${finishedHidden} finished units are hidden.`}
                </p>
            ) : (
                <>
                    <div className="grid gap-3 md:hidden">
                        {view.units.map(u => <UnitCard key={u.id} unit={u} onOpen={openTask} />)}
                    </div>

                    <div className="hidden max-h-[calc(100vh-11rem)] overflow-auto rounded-xl border bg-white md:block">
                        <table className="border-separate text-sm" style={{ borderSpacing: 0 }}>
                            <thead>
                                {view.grouped && (
                                    <tr className="text-xs text-muted-foreground">
                                        <th colSpan={5} className="sticky left-0 top-0 z-30 bg-white" />
                                        {view.columns.reduce((acc, c) => {
                                            const last = acc[acc.length - 1]
                                            if (last && last.group === c.group) last.span++
                                            else acc.push({ group: c.group, span: 1 })
                                            return acc
                                        }, []).map((g, i) => <th key={i} colSpan={g.span} className="sticky top-0 z-20 border-b bg-white px-1 py-1 text-left font-medium">{g.group}</th>)}
                                    </tr>
                                )}
                                <tr className="text-left align-bottom text-xs text-muted-foreground">
                                    <th className="sticky left-0 top-0 z-30 w-48 min-w-48 border-b bg-white px-3 py-2 font-medium">Unit</th>
                                    <th className="sticky left-48 top-0 z-30 w-28 min-w-28 border-b bg-white px-2 py-2 font-medium">Completion</th>
                                    <th className="sticky left-[19rem] top-0 z-30 w-20 min-w-20 border-b bg-white px-2 py-2 font-medium" title="Time since the unit's first task started (to its last completion once finished)">Length</th>
                                    <th className="sticky left-[24rem] top-0 z-30 w-20 min-w-20 border-b bg-white px-2 py-2 font-medium">Vs plan</th>
                                    <th className="sticky left-[29rem] top-0 z-30 w-28 min-w-28 border-b border-r bg-white px-2 py-2 font-medium">Finish</th>
                                    {view.columns.map(c => (
                                        <th key={c.id} className="sticky top-0 z-20 w-16 min-w-16 border-b bg-white px-1 py-2 font-medium leading-tight" title={`${c.name} · ${c.days_length} planned days`}>
                                            <span className="line-clamp-3">{c.name}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {view.units.map(u => {
                                    const byColumn = new Map(u.tasks.map(t => [t.master_task.id, t]))
                                    return (
                                        <tr key={u.id} className="group">
                                            <td className="sticky left-0 z-10 border-b bg-white px-3 py-1 group-hover:bg-muted">
                                                <Link to={`/unit/${u.id}`} className="font-medium hover:underline">{u.name}</Link>
                                                <p className="truncate text-xs text-muted-foreground" title={u.current.join(', ')}>
                                                    {u.stuck > 0 && <AlertOctagon className="mr-1 inline size-3" style={{ color: C.critical }} aria-label="stuck" />}
                                                    {u.stage === 'finished' ? 'Finished' : u.current.length ? `Now: ${u.current.join(', ')}` : u.next ? `Next: ${u.next}` : '—'}
                                                </p>
                                            </td>
                                            <td className="sticky left-48 z-10 border-b bg-white px-2 group-hover:bg-muted">
                                                <div className="flex justify-between tabular-nums"><span>{u.stats.completion.percent}%</span><span className="text-muted-foreground">{u.stats.counts.count_completed}/{u.stats.counts.count_tasks}</span></div>
                                                <div className="mt-1"><Meter pct={u.stats.completion.percent} label={`${u.name} completion`} /></div>
                                            </td>
                                            <td className="sticky left-[19rem] z-10 whitespace-nowrap border-b bg-white px-2 tabular-nums group-hover:bg-muted">{u.stats.completion.months} mo</td>
                                            <td className="sticky left-[24rem] z-10 border-b bg-white px-2 tabular-nums group-hover:bg-muted" style={{ color: (u.schedule.over_plan_days ?? 0) > 0 ? C.critical : undefined }}>
                                                {overLabel(u.schedule.over_plan_days)}
                                            </td>
                                            <td className="sticky left-[29rem] z-10 border-b border-r bg-white px-2 tabular-nums group-hover:bg-muted">
                                                {u.schedule.finish ? fmtDate(u.schedule.finish) : '—'}
                                                <div className="text-xs text-muted-foreground">{u.schedule.finish ? (u.schedule.finish_is_projection ? 'projected' : 'finished') : ''}</div>
                                            </td>
                                            {view.columns.map(c => {
                                                const task = byColumn.get(c.id)
                                                return task ? <Cell key={c.id} task={task} onOpen={(t) => openTask(t, u)} /> : <td key={c.id} className="border-b" />
                                            })}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Showing {view.units.length} of {project.units.length} units
                        {finishedHidden > 0 && ` · ${finishedHidden} finished hidden`}
                        {view.hiddenColumns > 0 && ` · ${view.hiddenColumns} tasks done for every unit shown are hidden`}
                    </p>
                </>
            )}

            <TaskDrawer selection={selection} onClose={() => setSelection(null)} onPostUpdate={postUpdate} />
            <DialogPopupForm isOpen={!!updating} setIsOpen={() => setUpdating(null)}
                title={updating ? updating.task.master_task.name : 'Save Update'}
                description={updating ? `${updating.unit.name} · ${getReadableStatus(updating.task.status_code)} · last update ${fmtAgo(updating.task.latest_update?.timestamp)}` : ''}>
                {updating && (
                    <FormWrapper formScenario="create" modelObj={{ task_id: updating.task.id }} onSubmitHook={() => { setUpdating(null); toast.success('Update saved'); load() }}>
                        <FormFields form="" taskObj={updating.taskObj} />
                        <DialogFooter><Button type="submit">Save Update</Button></DialogFooter>
                    </FormWrapper>
                )}
            </DialogPopupForm>
        </div>
    )
}
export default OverviewTable
