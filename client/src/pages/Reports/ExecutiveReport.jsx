import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea } from 'recharts'
import { AlertOctagon, Clock, Download } from 'lucide-react'

import { C, AXIS_TICK, fmt, fmtDay, fmtDate, fmtMonth, downloadCsv } from '@/pages/Reports/report-format'
import { Card, Delta, StatTile, Meter, ChartTooltip, Legend, Segmented, TableToggle, Empty } from '@/pages/Reports/report-ui'

const THROUGHPUT_METRICS = [
    { value: 'completed', label: 'Tasks completed', noun: 'tasks completed' },
    { value: 'updates', label: 'Status updates', noun: 'status updates' },
    { value: 'reporters', label: 'Active reporters', noun: 'people posting updates' },
]

const STAGES = [
    { key: 'finished', label: 'Finished', color: C.stageDark },
    { key: 'in_progress', label: 'In progress', color: C.stageMid },
    { key: 'not_started', label: 'Not started', color: C.stageLight },
]

const SCORECARD_COLUMNS = [
    { label: 'Project', value: p => p.name },
    { label: 'Complete %', value: p => p.completion_pct },
    { label: 'Units', value: p => p.units },
    { label: 'Units finished', value: p => p.finished },
    { label: 'Units in progress', value: p => p.in_progress },
    { label: 'Units not started', value: p => p.not_started },
    { label: 'Tasks completed (period)', value: p => p.tasks_completed },
    { label: 'Tasks completed (previous period)', value: p => p.tasks_completed_prev },
    { label: 'Units behind plan', value: p => p.behind_plan },
    { label: 'Open blockers', value: p => p.open_stuck },
    { label: 'Quiet tasks', value: p => p.stale },
    { label: 'Completion date', value: p => p.completion_date },
    { label: 'Completion is projected', value: p => (p.completion_is_projection ? 'yes' : 'no') },
]

function Hero({ k }) {
    return (
        <section className="flex min-w-0 flex-col justify-between gap-5 rounded-xl border bg-white p-5 print:break-inside-avoid lg:row-span-2">
            <div>
                <p className="text-sm text-muted-foreground">Portfolio completion</p>
                <p className="mt-1 text-6xl font-semibold tracking-tight">{k.completion_pct}%</p>
                <div className="mt-4"><Meter pct={k.completion_pct} label="Portfolio completion" /></div>
                <p className="mt-2 text-sm text-muted-foreground">{fmt(k.tasks_done)} of {fmt(k.tasks_total)} tasks done</p>
            </div>
            <dl className="grid grid-cols-3 gap-3 border-t pt-4 text-sm">
                {STAGES.map(s => (
                    <div key={s.key}>
                        <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="inline-block size-2.5 rounded-sm" style={{ background: s.color }} />{s.label}</dt>
                        <dd className="mt-0.5 text-xl font-semibold">{fmt(k[`units_${s.key}`])}</dd>
                    </div>
                ))}
            </dl>
            <p className="-mt-2 text-xs text-muted-foreground">{fmt(k.units)} units across the selected projects</p>
        </section>
    )
}

function Throughput({ series, weeks }) {
    const [metric, setMetric] = useState('completed')
    const [table, setTable] = useState(false)
    const m = THROUGHPUT_METRICS.find(x => x.value === metric)
    const total = series.reduce((sum, s) => sum + s[metric], 0)
    const peak = series.reduce((best, s) => (s[metric] > (best?.[metric] ?? -1) ? s : best), null)
    return (
        <Card title="Weekly throughput" className="lg:col-span-2"
            subtitle={metric === 'reporters'
                ? `Distinct people posting updates each week · peak ${peak ? fmt(peak.reporters) : 0}`
                : `${fmt(total)} ${m.noun} over ${weeks} weeks${peak && peak[metric] ? ` · busiest week ending ${fmtDay(peak.week_end)} (${fmt(peak[metric])})` : ''}`}
            action={<div className="flex items-center gap-3"><Segmented label="Metric" options={THROUGHPUT_METRICS} value={metric} onChange={setMetric} /><TableToggle open={table} onClick={() => setTable(t => !t)} /></div>}>
            <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={series} margin={{ top: 8, right: 8, bottom: 4, left: -16 }} barCategoryGap="20%">
                        <CartesianGrid vertical={false} stroke={C.grid} />
                        <XAxis dataKey="week_end" tickFormatter={fmtDay} tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={16} />
                        <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: C.hover }} content={<ChartTooltip render={(s) => <>
                            <p className="text-sm font-semibold">{fmt(s[metric])} {m.noun}</p>
                            <p className="text-muted-foreground">7 days ending {fmtDate(s.week_end)}</p>
                            <p className="mt-1 text-muted-foreground">{fmt(s.completed)} completed · {fmt(s.updates)} updates · {fmt(s.reporters)} {s.reporters === 1 ? 'reporter' : 'reporters'}</p>
                        </>} />} />
                        <Bar dataKey={metric} fill={C.series} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {table && (
                <div className="mt-3 max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white text-left text-xs text-muted-foreground"><tr><th className="py-1">Week ending</th><th>Completed</th><th>Updates</th><th>Reporters</th></tr></thead>
                        <tbody className="tabular-nums">{[...series].reverse().map(s => (
                            <tr key={s.week_end} className="border-t"><td className="py-1">{fmtDate(s.week_end)}</td><td>{s.completed}</td><td>{s.updates}</td><td>{s.reporters}</td></tr>
                        ))}</tbody>
                    </table>
                </div>
            )}
        </Card>
    )
}

function Pipeline({ projects, selected, onSelect }) {
    // selection is a band behind the row: dimming the bars would collide with the stage ramp's lightness
    const selectedName = projects.find(p => p.id === selected)?.name
    const height = Math.max(140, projects.length * 44 + 40)
    return (
        <Card title="Unit pipeline by project" subtitle="Units by stage. Select a project to highlight it in the scorecard.">
            <Legend items={STAGES.map(s => ({ label: s.label, color: s.color }))} />
            <div style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projects} layout="vertical" margin={{ top: 0, right: 16, bottom: 4, left: 8 }} barCategoryGap={10}>
                        <CartesianGrid horizontal={false} stroke={C.grid} />
                        <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={150} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: C.hover }} content={<ChartTooltip render={(p) => <>
                            <p className="text-sm font-semibold">{p.name}</p>
                            <p>{p.finished} finished · {p.in_progress} in progress · {p.not_started} not started</p>
                            <p className="text-muted-foreground">{p.completion_pct}% of tasks done</p>
                        </>} />} />
                        {selectedName && <ReferenceArea y1={selectedName} y2={selectedName} fill={C.selected} fillOpacity={1} ifOverflow="visible" />}
                        {STAGES.map(s => (
                            <Bar key={s.key} dataKey={s.key} name={s.label} stackId="units" fill={s.color} stroke={C.surface} strokeWidth={2}
                                maxBarSize={24} isAnimationActive={false} cursor="pointer" onClick={(d) => onSelect((d.payload ?? d).id)} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <table className="mt-3 w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                    <tr className="[&>th]:pb-1 [&>th]:font-medium"><th>Project</th>{STAGES.map(s => <th key={s.key} className="text-right">{s.label}</th>)}<th className="text-right">Tasks done</th></tr>
                </thead>
                <tbody className="tabular-nums">
                    {projects.map(p => (
                        <tr key={p.id} onClick={() => onSelect(p.id)} className={`cursor-pointer border-t [&>td]:py-1.5 ${selected === p.id ? 'bg-[#eef5fd]' : 'hover:bg-muted/40'}`}>
                            <td>{p.name}</td>{STAGES.map(s => <td key={s.key} className="text-right">{p[s.key]}</td>)}<td className="text-right">{p.completion_pct}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    )
}

function Forecast({ forecast, beyond }) {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const firstUpcoming = forecast.find(f => f.month >= currentMonth && f.units.length)?.month
    const [month, setMonth] = useState(firstUpcoming ?? forecast.findLast(f => f.units.length)?.month)
    const active = forecast.find(f => f.month === month)
    const projectedTotal = forecast.reduce((s, f) => s + f.projected, 0)
    return (
        <Card title="Handover forecast" subtitle={`Units delivered by month, and projected finishes for open units (${fmt(projectedTotal)} projected). Select a month for its units.`}>
            <Legend items={[{ label: 'Delivered', color: C.stageMid }, { label: 'Projected', color: C.stageLight }]} />
            <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecast} margin={{ top: 8, right: 8, bottom: 4, left: -16 }} barCategoryGap="18%"
                        onClick={(e) => e?.activeLabel && setMonth(e.activeLabel)} style={{ cursor: 'pointer' }}>
                        <CartesianGrid vertical={false} stroke={C.grid} />
                        <XAxis dataKey="month" tickFormatter={fmtMonth} tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={8} />
                        <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: C.hover }} content={<ChartTooltip render={(f) => <>
                            <p className="text-sm font-semibold">{fmtMonth(f.month)}</p>
                            {f.delivered > 0 && <p>{f.delivered} delivered</p>}
                            {f.projected > 0 && <p>{f.projected} projected</p>}
                            {!f.delivered && !f.projected && <p className="text-muted-foreground">No handovers</p>}
                        </>} />} />
                        {active && <ReferenceArea x1={active.month} x2={active.month} fill={C.selected} fillOpacity={1} ifOverflow="visible" />}
                        {[['delivered', C.stageMid], ['projected', C.stageLight]].map(([key, color]) => (
                            <Bar key={key} dataKey={key} stackId="m" fill={color} stroke={C.surface} strokeWidth={2} maxBarSize={24}
                                isAnimationActive={false} cursor="pointer" onClick={(d) => setMonth((d.payload ?? d).month)} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-3 border-t pt-3">
                {active && active.units.length ? (
                    <>
                        <p className="mb-2 text-sm font-medium">{fmtMonth(active.month)}: {active.units.length} unit{active.units.length === 1 ? '' : 's'}</p>
                        <ul className="grid max-h-40 grid-cols-1 gap-x-4 gap-y-1 overflow-auto text-sm sm:grid-cols-2">
                            {active.units.map(u => (
                                <li key={u.id} className="flex justify-between gap-2">
                                    <Link to={`/unit/${u.id}`} className="truncate hover:underline">{u.name}</Link>
                                    <span className="shrink-0 tabular-nums text-muted-foreground">{fmtDay(u.finish)}</span>
                                </li>
                            ))}
                        </ul>
                    </>
                ) : <p className="text-sm text-muted-foreground">Select a month with handovers to list its units.</p>}
                {beyond > 0 && <p className="mt-2 text-xs text-muted-foreground">{beyond} more unit{beyond === 1 ? '' : 's'} projected beyond this range.</p>}
            </div>
        </Card>
    )
}

function Scorecard({ projects, weeks, selected, onSelect, period }) {
    return (
        <Card title="Project scorecard" subtitle={`Activity over the last ${weeks} weeks; status as of ${fmtDate(period.to)}`}
            action={<button type="button" onClick={() => downloadCsv(`project-scorecard-${period.to}.csv`, SCORECARD_COLUMNS, projects)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline print:hidden"><Download className="size-4" aria-hidden />Export CSV</button>}>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                    <thead className="text-left text-xs text-muted-foreground">
                        <tr className="[&>th]:pb-2 [&>th]:pr-3 [&>th]:font-medium">
                            <th>Project</th><th className="w-48">Complete</th><th>Units finished</th><th>Tasks completed</th>
                            <th>Behind plan</th><th>Blockers</th><th>Quiet</th><th>Completion</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map(p => (
                            <tr key={p.id} onClick={() => onSelect(p.id)} aria-selected={selected === p.id}
                                className={`cursor-pointer border-t align-middle [&>td]:py-3 [&>td]:pr-3 ${selected === p.id ? 'bg-[#eef5fd]' : 'hover:bg-muted/40'}`}>
                                <td className="font-medium">{p.name}</td>
                                <td><div className="flex items-center gap-2"><Meter pct={p.completion_pct} label={`${p.name} completion`} /><span className="w-10 shrink-0 text-right tabular-nums">{p.completion_pct}%</span></div></td>
                                <td className="tabular-nums">{p.finished} / {p.units}</td>
                                <td><span className="tabular-nums">{fmt(p.tasks_completed)}</span><div><Delta now={p.tasks_completed} prev={p.tasks_completed_prev} weeks={weeks} /></div></td>
                                <td className="tabular-nums">{p.behind_plan}</td>
                                <td className="tabular-nums">{p.open_stuck > 0
                                    ? <span className="inline-flex items-center gap-1 font-medium" style={{ color: C.critical }}><AlertOctagon className="size-3.5" aria-hidden />{p.open_stuck} open</span>
                                    : <span className="text-muted-foreground">0</span>}</td>
                                <td className="tabular-nums">{p.stale}</td>
                                <td className="tabular-nums">{p.completion_date ? <>{fmtDate(p.completion_date)}<div className="text-xs text-muted-foreground">{p.completion_is_projection ? 'projected' : 'delivered'}</div></> : '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}

function Team({ team, weeks }) {
    const [selected, setSelected] = useState(team[0]?.user_id ?? null)
    const person = team.find(t => t.user_id === selected)
    const data = team.slice(0, 10)
    const height = Math.max(120, data.length * 32 + 30)
    return (
        <Card title="Field team activity" subtitle={`Status updates posted in the last ${weeks} weeks. Select a person for their latest updates.`}>
            {team.length === 0 ? <Empty>No updates were posted in this period.</Empty> : (
                <>
                    <div style={{ height }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 8 }} barCategoryGap={8}>
                                <CartesianGrid horizontal={false} stroke={C.grid} />
                                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="name" width={130} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: C.hover }} content={<ChartTooltip render={(t) => <>
                                    <p className="text-sm font-semibold">{fmt(t.updates)} updates</p>
                                    <p>{t.name}</p>
                                    <p className="text-muted-foreground">{fmt(t.completed)} tasks completed · {t.stuck} stuck reports · last active {fmtDate(t.last_active)}</p>
                                </>} />} />
                                {person && data.includes(person) && <ReferenceArea y1={person.name} y2={person.name} fill={C.selected} fillOpacity={1} ifOverflow="visible" />}
                                <Bar dataKey="updates" fill={C.series} radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={false}
                                    cursor="pointer" onClick={(d) => setSelected((d.payload ?? d).user_id)}
                                    label={{ position: 'right', fill: C.ink2, fontSize: 12 }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {person && (
                        <div className="mt-3 border-t pt-3">
                            <p className="text-sm font-medium">{person.name}</p>
                            <p className="mb-2 text-xs text-muted-foreground">{fmt(person.updates)} updates · {fmt(person.completed)} tasks completed · last active {fmtDate(person.last_active)}</p>
                            <ul className="space-y-1.5 text-sm">
                                {person.recent.map(u => (
                                    <li key={u.id} className="flex items-baseline justify-between gap-3">
                                        <Link to={`/task/${u.task_id}`} className="min-w-0 truncate hover:underline">{u.unit} · {u.task}</Link>
                                        <span className="shrink-0 text-xs text-muted-foreground">{u.status} · {fmtDay(u.date)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}
        </Card>
    )
}

function Attention({ attention, k }) {
    const tabs = [
        { value: 'blockers', label: `Blockers (${k.open_stuck})` },
        { value: 'behind', label: 'Furthest behind' },
        { value: 'quiet', label: `Quiet (${k.stale_tasks})` },
    ]
    const [tab, setTab] = useState(k.open_stuck ? 'blockers' : 'behind')
    return (
        <Card title="Needs attention" subtitle={`Open blockers, the units furthest behind plan, and started tasks with no update in ${k.stale_days}+ days`}
            action={<Segmented label="Attention list" options={tabs} value={tab} onChange={setTab} />}>
            {tab === 'blockers' && (attention.blockers.length === 0 ? <Empty>No open blockers.</Empty> : (
                <ul className="divide-y text-sm">
                    {attention.blockers.map(b => (
                        <li key={`${b.task_id}-${b.start}`} className="py-2.5">
                            <div className="flex items-baseline justify-between gap-3">
                                <Link to={`/task/${b.task_id}`} className="min-w-0 truncate font-medium hover:underline">{b.unit} · {b.task}</Link>
                                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium" style={{ color: C.critical }}><AlertOctagon className="size-3.5" aria-hidden />Stuck {b.days} d</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{b.project} · {b.reason}{b.reported_by ? ` · reported by ${b.reported_by}` : ''}</p>
                            {b.note && <p className="mt-0.5 text-xs">{b.note}</p>}
                        </li>
                    ))}
                </ul>
            ))}
            {tab === 'behind' && (attention.behind_units.length === 0 ? <Empty>No open units are behind plan.</Empty> : (
                <ul className="divide-y text-sm">
                    {attention.behind_units.map(u => (
                        <li key={u.id} className="flex items-center justify-between gap-3 py-2.5">
                            <div className="min-w-0">
                                <Link to={`/unit/${u.id}`} className="font-medium hover:underline">{u.name}</Link>
                                <p className="truncate text-xs text-muted-foreground">{u.project} · {u.progress}% done{u.top_contributors?.length ? ` · held up by ${u.top_contributors.map(c => c.task).join(', ')}` : ''}</p>
                            </div>
                            <span className="shrink-0 text-sm font-medium tabular-nums">+{u.duration_over_plan_days} d</span>
                        </li>
                    ))}
                </ul>
            ))}
            {tab === 'quiet' && (attention.stale_tasks.length === 0 ? <Empty>Every started task has a recent update.</Empty> : (
                <ul className="divide-y text-sm">
                    {attention.stale_tasks.map(t => (
                        <li key={t.task_id} className="flex items-center justify-between gap-3 py-2.5">
                            <div className="min-w-0">
                                <Link to={`/task/${t.task_id}`} className="font-medium hover:underline">{t.unit} · {t.task}</Link>
                                <p className="text-xs text-muted-foreground">{t.project}</p>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3.5" aria-hidden />{t.last_update ? `last update ${fmtDay(t.last_update)}` : 'no updates yet'}</span>
                        </li>
                    ))}
                </ul>
            ))}
        </Card>
    )
}

export default function ExecutiveReport({ data }) {
    const [selectedProject, setSelectedProject] = useState(null)
    const k = data.kpis
    const w = data.period.weeks
    const trend = useMemo(() => ({
        completed: data.series.map(s => s.completed),
        updates: data.series.map(s => s.updates),
        reporters: data.series.map(s => s.reporters),
    }), [data.series])
    const toggleProject = (id) => setSelectedProject(current => (current === id ? null : id))

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Hero k={k} />
                <StatTile label="Tasks completed" value={fmt(k.tasks_completed)} trend={trend.completed} trendLabel="Tasks completed per week"
                    detail={<Delta now={k.tasks_completed} prev={k.tasks_completed_prev} weeks={w} />} />
                <StatTile label="Units delivered" value={fmt(k.units_delivered)}
                    detail={<Delta now={k.units_delivered} prev={k.units_delivered_prev} weeks={w} />} />
                <StatTile label="Status updates" value={fmt(k.updates)} trend={trend.updates} trendLabel="Status updates per week"
                    detail={<Delta now={k.updates} prev={k.updates_prev} weeks={w} />} />
                <StatTile label="Active field reporters" value={fmt(k.reporters)} trend={trend.reporters} trendLabel="People posting updates per week"
                    detail={<Delta now={k.reporters} prev={k.reporters_prev} weeks={w} />} />
                <StatTile label="Units behind plan" value={<>{fmt(k.units_behind_plan)}<span className="text-lg font-normal text-muted-foreground"> / {fmt(k.units_measured)}</span></>}
                    detail={<span className="text-xs text-muted-foreground">{k.median_over_plan_days !== null ? `median build +${k.median_over_plan_days} days over plan` : 'no units measured yet'}</span>} />
                <StatTile label="Open blockers" value={fmt(k.open_stuck)}
                    icon={k.open_stuck > 0 ? <AlertOctagon className="size-4" style={{ color: C.critical }} aria-hidden /> : null}
                    detail={<span className="text-xs text-muted-foreground">{fmt(k.stale_tasks)} started tasks quiet {k.stale_days}+ days</span>} />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <Throughput series={data.series} weeks={w} />
                <Attention attention={data.attention} k={k} />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <Pipeline projects={data.project_scorecard} selected={selectedProject} onSelect={toggleProject} />
                <Forecast key={data.period.to + data.projects.map(p => p.id).join()} forecast={data.forecast} beyond={data.forecast_beyond} />
            </div>

            <Scorecard projects={data.project_scorecard} weeks={w} selected={selectedProject} onSelect={toggleProject} period={data.period} />

            <Team key={w} team={data.team} weeks={w} />
        </div>
    )
}
