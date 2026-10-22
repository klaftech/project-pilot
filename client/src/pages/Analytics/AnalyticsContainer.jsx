import { useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts'

import AppWrapper from '@/components/AppWrapper'
import LoadingWrapper from '@/components/LoadingWrapper'
import ShowAlert from '@/components/ShowAlert'
import UserContext from '@/context/UserContext'
import ProjectsContext from '@/context/ProjectsContext'
import { formatDatePretty, stringToDate } from '@/utils/date'

// chart tokens (reference palette, light mode): one series per chart -> slot 1; magnitude -> one-hue ramp
const SERIES = '#2a78d6'
const GRID = '#e7e6e2'
const INK_SECONDARY = '#52514e'
const RAMP = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b']
const RAMP_TEXT_DARK_FROM = 3   // steps 400+ need light text

const PERIODS = [
    { label: 'All time', days: null },
    { label: 'Last 12 months', days: 365 },
    { label: 'Last 6 months', days: 182 },
    { label: 'Last 90 days', days: 90 },
]

const isoDaysAgo = (days) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
const fmtDays = (v) => v === null || v === undefined ? '—' : `${v} d`
const fmtDate = (s) => s ? formatDatePretty(stringToDate(s)) : '—'

function Card({ title, subtitle, children, action }) {
    return (
        <section className="min-w-0 rounded-lg border bg-white p-4 md:p-5">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h2 className="font-semibold">{title}</h2>
                    {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
                </div>
                {action}
            </div>
            {children}
        </section>
    )
}

function Stat({ label, value, detail }) {
    return (
        <div className="rounded-lg border bg-white p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
            {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
        </div>
    )
}

function ChartTooltip({ active, payload, render }) {
    if (!active || !payload?.length) return null
    return <div className="rounded-md border bg-white px-3 py-2 text-xs shadow-sm">{render(payload[0].payload)}</div>
}

// horizontal bars, one series, sorted by value; labels live on the category axis
function RankedBars({ data, valueKey, valueLabel, tooltip }) {
    const height = Math.max(120, data.length * 28 + 40)
    return (
        <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }} barCategoryGap={6}>
                    <CartesianGrid horizontal={false} stroke={GRID} />
                    <XAxis type="number" tick={{ fill: INK_SECONDARY, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="task" width={170} tick={{ fill: INK_SECONDARY, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f3f2ee' }} position={{ x: 0 }} wrapperStyle={{ maxWidth: '70vw', zIndex: 10 }} content={<ChartTooltip render={tooltip} />} />
                    <Bar dataKey={valueKey} name={valueLabel} fill={SERIES} radius={[0, 4, 4, 0]} maxBarSize={16} isAnimationActive={false} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

function TableToggle({ open, onClick }) {
    return <button type="button" onClick={onClick} className="text-sm text-muted-foreground underline-offset-4 hover:underline">{open ? 'Hide table' : 'Show table'}</button>
}

function Heatmap({ tasks, projects, cells }) {
    const lookup = new Map(cells.map(c => [`${c.task}|${c.project_id}`, c]))
    const max = Math.max(1, ...cells.map(c => c.median_excess_days ?? 0))
    const step = (v) => Math.min(RAMP.length - 1, Math.floor((v / max) * RAMP.length))
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-separate text-xs" style={{ borderSpacing: 2 }}>
                <thead>
                    <tr>
                        <th className="sticky left-0 bg-white px-2 py-1 text-left font-medium text-muted-foreground">Task</th>
                        {projects.map(p => <th key={p.id} className="px-2 py-1 text-left font-medium text-muted-foreground">{p.name}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {tasks.map(task => (
                        <tr key={task}>
                            <th className="sticky left-0 bg-white px-2 py-1 text-left font-normal">{task}</th>
                            {projects.map(p => {
                                const cell = lookup.get(`${task}|${p.id}`)
                                if (!cell || cell.median_excess_days === null) {
                                    return <td key={p.id} className="rounded bg-muted/40 px-2 py-1 text-center text-muted-foreground">—</td>
                                }
                                const s = cell.median_excess_days > 0 ? step(cell.median_excess_days) : -1
                                return (
                                    <td key={p.id} title={`${task} · ${p.name}: median ${cell.median_excess_days} days beyond plan (${cell.n} completed)`}
                                        className="rounded px-2 py-1 text-center tabular-nums"
                                        style={{ background: s < 0 ? '#f5f5f3' : RAMP[s], color: s >= RAMP_TEXT_DARK_FROM ? '#ffffff' : '#0b0b0b' }}>
                                        {cell.median_excess_days}
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span>0 d</span>
                <div className="flex">{RAMP.map(c => <span key={c} className="h-3 w-6" style={{ background: c }} />)}</div>
                <span>{max} d beyond plan (median)</span>
            </div>
        </div>
    )
}

function AnalyticsContainer() {
    const { user } = useContext(UserContext)
    const { projects } = useContext(ProjectsContext)
    const [selected, setSelected] = useState(null)   // null = all accessible projects
    const [period, setPeriod] = useState(PERIODS[0])
    const [data, setData] = useState(null)
    const [error, setError] = useState(null)
    const [tables, setTables] = useState({})
    const toggleTable = (key) => setTables(t => ({ ...t, [key]: !t[key] }))

    useEffect(() => {
        if (!user?.is_admin) return
        const params = new URLSearchParams()
        if (selected && selected.length) params.set('project_ids', selected.join(','))
        if (period.days) params.set('from', isoDaysAgo(period.days))
        setData(null); setError(null)
        fetch('/api/analytics?' + params.toString())
            .then(res => res.ok ? res.json() : res.json().then(d => Promise.reject(d.error || res.status)))
            .then(setData)
            .catch(err => setError(typeof err === 'string' ? err : 'Unable to load analytics.'))
    }, [user?.is_admin, selected, period])

    const toggleProject = (id) => {
        const all = projects.map(p => p.id)
        const current = selected ?? all
        const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id]
        setSelected(next.length === all.length ? null : next.length ? next : current)
    }

    const views = useMemo(() => {
        if (!data) return null
        const measured = data.tasks.filter(t => t.completed >= 5)
        return {
            excess: [...measured].sort((a, b) => b.median_excess_days - a.median_excess_days).slice(0, 15),
            critical: [...data.tasks].filter(t => t.critical_days > 0).sort((a, b) => b.critical_days - a.critical_days).slice(0, 12),
            heatTasks: [...data.tasks].sort((a, b) => a.order - b.order).map(t => t.task),
            stuckByTask: [...data.tasks].filter(t => t.stuck_episodes > 0).sort((a, b) => b.stuck_days - a.stuck_days),
        }
    }, [data])

    if (user && !user.is_admin) {
        return <AppWrapper><ShowAlert message="Analytics are available to administrators." /></AppWrapper>
    }

    const k = data?.kpis
    const activeIds = selected ?? projects.map(p => p.id)

    return (
        <AppWrapper>
            <div className="min-w-0 space-y-5">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Delays &amp; blockers</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Measured from when each task&apos;s prerequisites were completed. Tasks are compared across projects by task type.
                    </p>
                </div>

                {/* filters: one row above the charts */}
                <div className="flex flex-wrap items-center gap-2">
                    {projects.map(p => {
                        const on = activeIds.includes(p.id)
                        return (
                            <button key={p.id} type="button" aria-pressed={on} onClick={() => toggleProject(p.id)}
                                className={`rounded-full border px-3 py-1 text-sm ${on ? 'border-foreground bg-foreground text-background' : 'bg-white text-muted-foreground'}`}>
                                {p.name}
                            </button>
                        )
                    })}
                    <select aria-label="Period" value={period.label} onChange={e => setPeriod(PERIODS.find(p => p.label === e.target.value))}
                        className="ml-auto h-9 rounded-md border bg-white px-2 text-sm">
                        {PERIODS.map(p => <option key={p.label}>{p.label}</option>)}
                    </select>
                </div>

                {error && <ShowAlert message={error} />}
                {!data && !error && <LoadingWrapper />}

                {data && views && (
                    <>
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
                            <Stat label="Units behind plan" value={`${k.units_behind_plan} / ${k.units - k.units_not_started}`} detail={`${k.units_not_started} not started`} />
                            <Stat label="Median build vs plan" value={k.median_unit_over_plan_days === null ? '—' : `+${k.median_unit_over_plan_days} d`} detail={`plan ${fmtDays(k.median_planned_duration_days)}`} />
                            <Stat label="Tasks over plan" value={`${k.pct_tasks_over_plan}%`} detail={`${k.tasks_completed_in_period} completed`} />
                            <Stat label="Ready, not done" value={k.tasks_waiting_now} detail="tasks waiting now" />
                            <Stat label="Stuck now" value={k.open_stuck} detail="open stuck episodes" />
                            <Stat label="Units finished" value={k.units_finished} detail={`${k.open_units} in progress`} />
                        </div>

                        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-2">
                            <Card title="Days beyond plan, by task" subtitle="Median days past the planned length, once prerequisites were done (tasks with 5+ completions)"
                                action={<TableToggle open={tables.excess} onClick={() => toggleTable('excess')} />}>
                                <RankedBars data={views.excess} valueKey="median_excess_days" valueLabel="Median days beyond plan"
                                    tooltip={(t) => <>
                                        <p className="font-semibold">{t.task}</p>
                                        <p>Planned {t.planned_days} d · median {t.median_days} d · p75 {t.p75_days} d</p>
                                        <p>{t.pct_over_plan}% over plan · {t.completed} completed</p>
                                    </>} />
                                {tables.excess && (
                                    <div className="mt-3 overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1">Task</th><th>Plan</th><th>Median</th><th>p75</th><th>% over</th><th>n</th></tr></thead>
                                            <tbody className="tabular-nums">{views.excess.map(t => (
                                                <tr key={t.task} className="border-t"><td className="py-1">{t.task}</td><td>{t.planned_days}</td><td>{t.median_days}</td><td>{t.p75_days}</td><td>{t.pct_over_plan}%</td><td>{t.completed}</td></tr>
                                            ))}</tbody>
                                        </table>
                                    </div>
                                )}
                            </Card>

                            <Card title="What delayed unit finishes" subtitle="Days beyond plan on each unit's critical chain (the sequence that set its finish), summed across units"
                                action={<TableToggle open={tables.critical} onClick={() => toggleTable('critical')} />}>
                                <RankedBars data={views.critical} valueKey="critical_days" valueLabel="Critical-chain days"
                                    tooltip={(t) => <>
                                        <p className="font-semibold">{t.task}</p>
                                        <p>{t.critical_days} days added to unit finishes</p>
                                        <p>{t.open_now} ready now · {t.open_over_plan} already over plan</p>
                                    </>} />
                                {tables.critical && (
                                    <div className="mt-3 overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1">Task</th><th>Critical-chain days</th><th>Ready now</th><th>Over plan now</th></tr></thead>
                                            <tbody className="tabular-nums">{views.critical.map(t => (
                                                <tr key={t.task} className="border-t"><td className="py-1">{t.task}</td><td>{t.critical_days}</td><td>{t.open_now}</td><td>{t.open_over_plan}</td></tr>
                                            ))}</tbody>
                                        </table>
                                    </div>
                                )}
                            </Card>
                        </div>

                        <Card title="Where each project loses time" subtitle="Median days beyond plan per task and project (darker = later). Hover a cell for counts.">
                            <Heatmap tasks={views.heatTasks} projects={data.projects} cells={data.heatmap} />
                        </Card>

                        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-2">
                            <Card title="Blockers by reason" subtitle="Days stuck, by reason inferred from the stuck note (no reason codes are recorded yet)">
                                {data.reasons.length === 0
                                    ? <p className="text-sm text-muted-foreground">No stuck updates in this period.</p>
                                    : <RankedBars data={data.reasons.map(r => ({ ...r, task: r.reason }))} valueKey="days" valueLabel="Days stuck"
                                        tooltip={(r) => <><p className="font-semibold">{r.reason}</p><p>{r.days} days stuck · {r.episodes} episodes</p></>} />}
                                {views.stuckByTask.length > 0 && (
                                    <p className="mt-3 text-sm text-muted-foreground">
                                        Most stuck: {views.stuckByTask.slice(0, 4).map(t => `${t.task} (${t.stuck_days} d)`).join(' · ')}
                                    </p>
                                )}
                            </Card>

                            <Card title="Share of tasks finishing over plan, by month" subtitle="Completed tasks per month that took longer than planned after prerequisites were done">
                                <div style={{ height: 240 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data.monthly} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
                                            <CartesianGrid vertical={false} stroke={GRID} />
                                            <XAxis dataKey="month" tick={{ fill: INK_SECONDARY, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={24} />
                                            <YAxis domain={[0, 100]} unit="%" tick={{ fill: INK_SECONDARY, fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <Tooltip wrapperStyle={{ maxWidth: '70vw' }} content={<ChartTooltip render={(m) => <>
                                                <p className="font-semibold">{m.month}</p>
                                                <p>{m.pct_over_plan}% over plan · {m.completed} completed</p>
                                                <p>median {m.median_excess_days} d beyond plan</p>
                                            </>} />} />
                                            <Line type="linear" dataKey="pct_over_plan" stroke={SERIES} strokeWidth={2} dot={{ r: 4, fill: SERIES, stroke: '#ffffff', strokeWidth: 2 }} isAnimationActive={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </div>

                        <Card title="Stuck episodes" subtitle="Open first, then most recent">
                            {data.blockers.length === 0 ? <p className="text-sm text-muted-foreground">None in this period.</p> : (
                                <div className="max-h-96 overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-white text-left text-xs text-muted-foreground">
                                            <tr><th className="py-1">Unit</th><th>Task</th><th>From</th><th>Days</th><th>Reason</th><th>Note</th></tr>
                                        </thead>
                                        <tbody>
                                            {[...data.blockers].sort((a, b) => (b.open - a.open) || b.start.localeCompare(a.start)).map((b, i) => (
                                                <tr key={i} className="border-t align-top">
                                                    <td className="py-1.5 pr-2"><Link to={`/unit/${b.unit_id}`} className="hover:underline">{b.unit}</Link><div className="text-xs text-muted-foreground">{b.project}</div></td>
                                                    <td className="pr-2"><Link to={`/task/${b.task_id}`} className="hover:underline">{b.task}</Link></td>
                                                    <td className="pr-2 tabular-nums">{fmtDate(b.start)}</td>
                                                    <td className="pr-2 tabular-nums">{b.days}{b.open && <span className="ml-1 rounded bg-red-100 px-1 text-xs font-medium text-red-700">open</span>}</td>
                                                    <td className="pr-2">{b.reason}</td>
                                                    <td className="text-muted-foreground">{b.note || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>

                        <Card title="Units" subtitle="Build length (first activity to finish, projected if open) against planned length">
                            <div className="max-h-[28rem] overflow-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-white text-left text-xs text-muted-foreground">
                                        <tr><th className="py-1">Unit</th><th>Progress</th><th>Build vs plan</th><th>Finish</th><th>Biggest delays</th></tr>
                                    </thead>
                                    <tbody>
                                        {data.units.map(u => (
                                            <tr key={u.id} className="border-t align-top">
                                                <td className="py-1.5 pr-2"><Link to={`/unit/${u.id}`} className="hover:underline">{u.name}</Link><div className="text-xs text-muted-foreground">{u.project}</div></td>
                                                <td className="pr-2 tabular-nums">{u.not_started ? 'Not started' : `${u.progress}%`}</td>
                                                <td className="pr-2 tabular-nums">{u.duration_over_plan_days === null ? '—' : `${u.duration_days} d vs ${u.planned_duration_days} d (${u.duration_over_plan_days > 0 ? '+' : ''}${u.duration_over_plan_days})`}</td>
                                                <td className="pr-2 tabular-nums">{u.finish ? <>{fmtDate(u.finish)}{u.finish_is_projection && <span className="text-xs text-muted-foreground"> projected</span>}</> : '—'}</td>
                                                <td className="text-muted-foreground">{u.top_contributors.map(c => `${c.task} ${c.days} d${c.open ? ' (open)' : ''}`).join(' · ') || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        <p className="text-xs text-muted-foreground">
                            Data health: {data.data_health.completed_before_prerequisites} of {data.data_health.completed_tasks} completed tasks were recorded complete before their
                            prerequisites and are left out of durations; {data.data_health.start_after_completion} have a start date after their completion (not used here);
                            {' '}{data.data_health.stuck_without_note} stuck episodes have no note. Grouping: {data.data_health.grouping}.
                        </p>
                    </>
                )}
            </div>
        </AppWrapper>
    )
}

export default AnalyticsContainer
