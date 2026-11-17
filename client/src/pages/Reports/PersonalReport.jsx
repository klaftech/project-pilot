import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { AlertOctagon, CheckCircle2, Clock } from 'lucide-react'

import { C, AXIS_TICK, fmt, fmtDay, fmtDate } from '@/pages/Reports/report-format'
import { Card, Delta, StatTile, Meter, ChartTooltip, Segmented, TableToggle, Empty } from '@/pages/Reports/report-ui'

const ACTIVITY_METRICS = [
    { value: 'updates', label: 'Updates', noun: 'updates' },
    { value: 'completed', label: 'Completed', noun: 'tasks completed' },
]

function Activity({ series, weeks }) {
    const [metric, setMetric] = useState('updates')
    const [table, setTable] = useState(false)
    const m = ACTIVITY_METRICS.find(x => x.value === metric)
    const total = series.reduce((s, x) => s + x[metric], 0)
    return (
        <Card title="Your weekly activity" className="lg:col-span-2"
            subtitle={`${fmt(total)} ${m.noun} over ${weeks} weeks`}
            action={<div className="flex items-center gap-3"><Segmented label="Metric" options={ACTIVITY_METRICS} value={metric} onChange={setMetric} /><TableToggle open={table} onClick={() => setTable(t => !t)} /></div>}>
            <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={series} margin={{ top: 8, right: 8, bottom: 4, left: -16 }} barCategoryGap="20%">
                        <CartesianGrid vertical={false} stroke={C.grid} />
                        <XAxis dataKey="week_end" tickFormatter={fmtDay} tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={16} />
                        <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: C.hover }} content={<ChartTooltip render={(s) => <>
                            <p className="text-sm font-semibold">{fmt(s[metric])} {m.noun}</p>
                            <p className="text-muted-foreground">7 days ending {fmtDate(s.week_end)}</p>
                        </>} />} />
                        <Bar dataKey={metric} fill={C.series} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            {table && (
                <div className="mt-3 max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white text-left text-xs text-muted-foreground"><tr><th className="py-1">Week ending</th><th>Updates</th><th>Completed</th></tr></thead>
                        <tbody className="tabular-nums">{[...series].reverse().map(s => (
                            <tr key={s.week_end} className="border-t"><td className="py-1">{fmtDate(s.week_end)}</td><td>{s.updates}</td><td>{s.completed}</td></tr>
                        ))}</tbody>
                    </table>
                </div>
            )}
        </Card>
    )
}

function StatusMix({ mix, total }) {
    const icons = { Completed: CheckCircle2, Progress: Clock, Stuck: AlertOctagon }
    return (
        <Card title="What you reported" subtitle="Your updates in this period, by kind">
            {total === 0 ? <Empty>No updates in this period.</Empty> : (
                <ul className="space-y-4">
                    {mix.map(s => {
                        const Icon = icons[s.status]
                        const pct = total ? Math.round((s.count / total) * 100) : 0
                        return (
                            <li key={s.status}>
                                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                                    <span className="inline-flex items-center gap-1.5"><Icon className="size-4 text-muted-foreground" aria-hidden />{s.status === 'Progress' ? 'Progress updates' : s.status}</span>
                                    <span className="tabular-nums"><span className="font-semibold">{fmt(s.count)}</span> <span className="text-muted-foreground">({pct}%)</span></span>
                                </div>
                                <Meter pct={pct} label={`${s.status} share`} />
                            </li>
                        )
                    })}
                </ul>
            )}
        </Card>
    )
}

export default function PersonalReport({ data }) {
    const k = data.kpis
    const w = data.period.weeks
    const trend = useMemo(() => ({
        updates: data.series.map(s => s.updates),
        completed: data.series.map(s => s.completed),
    }), [data.series])

    if (!data.projects.length) {
        return <Card><Empty>You don&apos;t have access to any projects yet, so there&apos;s nothing to report.</Empty></Card>
    }

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile label="Updates you posted" value={fmt(k.updates)} trend={trend.updates} trendLabel="Your updates per week"
                    detail={<Delta now={k.updates} prev={k.updates_prev} weeks={w} />} />
                <StatTile label="Tasks you completed" value={fmt(k.completed)} trend={trend.completed} trendLabel="Tasks you completed per week"
                    detail={<Delta now={k.completed} prev={k.completed_prev} weeks={w} />} />
                <StatTile label="Days active" value={fmt(k.active_days)}
                    detail={<Delta now={k.active_days} prev={k.active_days_prev} weeks={w} />} />
                <StatTile label="Waiting for an update" value={fmt(k.awaiting)}
                    detail={<span className="text-xs text-muted-foreground">started tasks in your projects with no update since {fmtDay(data.due_since)}</span>} />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <Activity series={data.series} weeks={w} />
                <StatusMix mix={data.status_mix} total={k.updates} />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <Card title="Waiting for an update" subtitle={`No update since ${fmtDay(data.due_since)}, longest first. Open a task to post its status.`}>
                    {data.awaiting.length === 0 ? <Empty>You&apos;re all caught up.</Empty> : (
                        <ul className="divide-y text-sm">
                            {data.awaiting.map(t => (
                                <li key={t.task_id} className="flex items-center justify-between gap-3 py-2.5">
                                    <div className="min-w-0">
                                        <Link to={`/task/${t.task_id}`} className="font-medium hover:underline">{t.unit} · {t.task}</Link>
                                        <p className="text-xs text-muted-foreground">{t.project}</p>
                                    </div>
                                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3.5" aria-hidden />{t.last_update ? `last ${fmtDay(t.last_update)}` : 'no updates yet'}</span>
                                </li>
                            ))}
                            {k.awaiting > data.awaiting.length && <li className="pt-2.5 text-xs text-muted-foreground">and {fmt(k.awaiting - data.awaiting.length)} more on the Home page</li>}
                        </ul>
                    )}
                </Card>

                <Card title="Your projects" subtitle={`Progress, and your share of the team's updates over ${w} weeks (${k.share_of_team_pct}% overall)`}>
                    <ul className="space-y-4">
                        {data.projects.map(p => (
                            <li key={p.id}>
                                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                                    <span className="font-medium">{p.name}</span>
                                    <span className="tabular-nums">{p.completion_pct}%</span>
                                </div>
                                <Meter pct={p.completion_pct} label={`${p.name} completion`} />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {p.units_finished} of {p.units} units finished · you posted {fmt(p.my_updates)} of {fmt(p.team_updates)} updates
                                    {p.awaiting > 0 && ` · ${p.awaiting} waiting`}
                                </p>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>

            <Card title="Your recent updates" subtitle="Latest first">
                {data.recent.length === 0 ? <Empty>You haven&apos;t posted any updates yet.</Empty> : (
                    <ol className="relative ml-2 space-y-4 border-l pl-5">
                        {data.recent.map(u => (
                            <li key={u.id} className="relative">
                                <span className="absolute -left-[27px] top-1 size-2.5 rounded-full ring-2 ring-white" style={{ background: u.status_group === 'Stuck' ? C.critical : C.series }} />
                                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                                    <Link to={`/task/${u.task_id}`} className="font-medium hover:underline">{u.unit} · {u.task}</Link>
                                    <span className="text-xs text-muted-foreground">{fmtDate(u.date)}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {u.status_group === 'Stuck' && <AlertOctagon className="mr-1 inline size-3.5" style={{ color: C.critical }} aria-hidden />}
                                    {u.status} · {u.project}{u.note ? ` · ${u.note}` : ''}
                                </p>
                            </li>
                        ))}
                    </ol>
                )}
            </Card>
        </div>
    )
}
