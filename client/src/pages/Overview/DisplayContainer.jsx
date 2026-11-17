import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AlertOctagon, Maximize, Pause, TriangleAlert, WifiOff } from 'lucide-react'

import Logo from '/logo_transparent.png'
import { getReadableStatus } from '@/utils/status_codes'
import { C, fmt, fmtDate } from '@/pages/Reports/report-format'
import { CELL, CELL_ORDER, cellLabel, fmtAgo } from '@/pages/Overview/overview-format'

// Wall display for the executive office: full screen, no navigation, rotates through a portfolio slide and each
// active project, refreshes itself. Query options: ?seconds=30 (per slide), ?projects=24,26, ?all=1 (include
// finished projects as slides).
// field updates arrive a few times a day at most, so every 30 minutes is plenty; warn after two missed refreshes
const REFRESH_MS = 30 * 60 * 1000
const STALE_MS = 75 * 60 * 1000
// unit stages in the same hues as the task cells: finished = Completed green, in progress = In Progress blue
const STAGES = [
    { key: 'finished', label: 'Finished', color: CELL[200].wall },
    { key: 'in_progress', label: 'In progress', color: CELL[311].wall },
    { key: 'not_started', label: 'Not started', color: '#d6d3d1' },
]

// rem-based sizing everywhere, with the root font tied to the viewport: the same layout reads from across the
// room on a 1080p panel and on a 4K one
function useViewportType() {
    useEffect(() => {
        const root = document.documentElement
        const previous = root.style.fontSize
        root.style.fontSize = 'clamp(12px, 0.84vw, 40px)'
        return () => { root.style.fontSize = previous }
    }, [])
}

function useNow(ms) {
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => { const id = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(id) }, [ms])
    return now
}

function useIdle(ms) {
    const [idle, setIdle] = useState(false)
    useEffect(() => {
        let timer
        const wake = () => { setIdle(false); clearTimeout(timer); timer = setTimeout(() => setIdle(true), ms) }
        wake()
        window.addEventListener('mousemove', wake)
        window.addEventListener('keydown', wake)
        return () => { clearTimeout(timer); window.removeEventListener('mousemove', wake); window.removeEventListener('keydown', wake) }
    }, [ms])
    return idle
}

function rowsPerPage() {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    // top bar, project header, column labels, card padding and footer take about 30rem; each unit row is 2.05rem
    return Math.max(6, Math.floor((window.innerHeight / rem - 30) / 2.05))
}

function StageBar({ s }) {
    const total = s.units || 1
    return (
        <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded">
            {STAGES.map(st => s[st.key] > 0 && <div key={st.key} style={{ width: `${(100 * s[st.key]) / total}%`, background: st.color }} />)}
        </div>
    )
}

// one bar per unit: height = share of its tasks done, color = stage; shows the spread of progress at a glance
function UnitBars({ units }) {
    const sorted = [...units].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    const color = (u) => STAGES.find(s => s.key === u.stage)?.color ?? C.stageLight
    return (
        <div className="flex min-h-0 flex-1 items-end gap-[2px] border-b border-[#e7e6e2] pt-4" aria-label="Completion by unit">
            {sorted.map(u => (
                <div key={u.id} className="h-full min-w-0 flex-1 max-w-6 flex flex-col justify-end" title={`${u.name}: ${u.stats.completion.percent}%`}>
                    <div className="rounded-t-[3px]" style={{ height: `${Math.max(3, u.stats.completion.percent)}%`, background: color(u) }} />
                </div>
            ))}
        </div>
    )
}

function Big({ label, value, detail, critical }) {
    return (
        <div className="rounded-2xl bg-white p-6">
            <p className="flex items-center gap-2 text-xl text-[#52514e]">{critical && <AlertOctagon className="size-6" style={{ color: C.critical }} aria-hidden />}{label}</p>
            <p className="mt-1 text-6xl font-semibold tracking-tight">{value}</p>
            {detail && <p className="mt-1 text-lg text-[#52514e]">{detail}</p>}
        </div>
    )
}

function PortfolioSlide({ overviews }) {
    const total = overviews.reduce((a, o) => {
        const s = o.summary
        return {
            tasks_done: a.tasks_done + s.tasks_done, tasks_total: a.tasks_total + s.tasks_total,
            finished: a.finished + s.finished, in_progress: a.in_progress + s.in_progress, not_started: a.not_started + s.not_started,
            units: a.units + s.units, completed_7d: a.completed_7d + s.completed_7d, completed_prev_7d: a.completed_prev_7d + s.completed_prev_7d,
            open_stuck: a.open_stuck + s.open_stuck, behind_plan: a.behind_plan + s.behind_plan, late_updates: a.late_updates + s.late_updates,
        }
    }, { tasks_done: 0, tasks_total: 0, finished: 0, in_progress: 0, not_started: 0, units: 0, completed_7d: 0, completed_prev_7d: 0, open_stuck: 0, behind_plan: 0, late_updates: 0 })
    // rounds down, like completion everywhere else
    const pct = total.tasks_total && total.tasks_done ? Math.floor((100 * total.tasks_done) / total.tasks_total) : 0
    return (
        <div className="flex h-full flex-col gap-6">
            <div className="grid grid-cols-4 gap-6">
                <div className="rounded-2xl bg-white p-6">
                    <p className="text-xl text-[#52514e]">Open projects complete</p>
                    <p className="mt-1 text-8xl font-semibold tracking-tight">{pct}%</p>
                    <div className="mt-4 h-3 overflow-hidden rounded-full" style={{ background: C.track }}><div className="h-full rounded-full" style={{ width: `${pct}%`, background: C.series }} /></div>
                </div>
                <Big label="Units finished" value={`${total.finished} / ${total.units}`} detail={`${total.in_progress} in progress · ${total.not_started} not started`} />
                <Big label="Tasks completed this week" value={fmt(total.completed_7d)} detail={`${fmt(total.completed_prev_7d)} the week before`} />
                <Big label="Open blockers" value={fmt(total.open_stuck)} detail={`${fmt(total.late_updates)} late updates · ${fmt(total.behind_plan)} units behind plan`} critical={total.open_stuck > 0} />
            </div>
            <div className={`grid min-h-0 flex-1 gap-6 ${overviews.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {overviews.map(o => {
                    const s = o.summary
                    return (
                        <div key={o.id} className="flex min-h-0 flex-col justify-between rounded-2xl bg-white p-6">
                            <div className="flex items-start justify-between gap-6">
                                <div className="min-w-0">
                                    <p className="truncate text-3xl font-semibold">{o.name}</p>
                                    <p className="mt-1 text-xl text-[#52514e]">
                                        {s.completion_date ? `${s.completion_is_projection ? 'Projected completion' : 'Completed'} ${fmtDate(s.completion_date)}` : 'Not started'}
                                    </p>
                                </div>
                                <p className="text-6xl font-semibold tracking-tight">{s.completion_pct}%</p>
                            </div>
                            <UnitBars units={o.units} />
                            <div className="mt-4">
                                <StageBar s={s} />
                                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-lg">
                                    {STAGES.map(st => (
                                        <span key={st.key} className="inline-flex items-center gap-2"><span className="inline-block size-3.5 rounded-sm" style={{ background: st.color }} />{s[st.key]} {st.label.toLowerCase()}</span>
                                    ))}
                                    <span className="text-[#52514e]">· {s.completed_7d} tasks done this week</span>
                                    {s.open_stuck > 0 && <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: C.critical }}><AlertOctagon className="size-5" aria-hidden />{s.open_stuck} stuck</span>}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function ProjectSlide({ overview, units, page, pages }) {
    const s = overview.summary
    const columns = overview.columns
    const template = `minmax(10rem, 13rem) 4.5rem 5rem repeat(${columns.length}, minmax(0, 1fr)) minmax(10rem, 16rem)`
    return (
        <div className="flex h-full flex-col gap-4">
            <div className="flex items-end justify-between gap-6">
                <div className="min-w-0">
                    <p className="truncate text-5xl font-semibold tracking-tight">{overview.name}{pages > 1 && <span className="text-3xl font-normal text-[#52514e]"> · {page + 1}/{pages}</span>}</p>
                    <p className="mt-2 text-xl text-[#52514e]">
                        {s.finished} of {s.units} units finished · {s.completed_7d} tasks done this week ({s.completed_prev_7d} the week before)
                        {s.completion_date && ` · ${s.completion_is_projection ? 'projected completion' : 'completed'} ${fmtDate(s.completion_date)}`}
                    </p>
                </div>
                <div className="flex items-end gap-8">
                    {s.open_stuck > 0 && <p className="inline-flex items-center gap-2 text-3xl font-semibold" style={{ color: C.critical }}><AlertOctagon className="size-8" aria-hidden />{s.open_stuck} stuck</p>}
                    <p className="text-7xl font-semibold tracking-tight">{s.completion_pct}%</p>
                </div>
            </div>

            <div className="min-h-0 flex-1 rounded-2xl bg-white p-5">
                <div className="grid items-end gap-[2px]" style={{ gridTemplateColumns: template }}>
                    <div className="pb-1 text-base text-[#52514e]">Unit</div>
                    <div className="pb-1 text-base text-[#52514e]">Done</div>
                    <div className="pb-1 text-base text-[#52514e]">Length</div>
                    {columns.map(c => (
                        <div key={c.id} className="flex h-[8.5rem] items-end justify-center overflow-hidden pb-1">
                            <span className="truncate text-sm leading-none text-[#52514e]" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '8.5rem' }}>{c.name}</span>
                        </div>
                    ))}
                    <div className="pb-1 pl-2 text-base text-[#52514e]">Now</div>
                </div>
                <div className="mt-1 grid gap-[2px]" style={{ gridTemplateColumns: template, gridAutoRows: '1.9rem' }}>
                    {units.map(u => {
                        const byColumn = new Map(u.tasks.map(t => [t.column, t]))
                        return [
                            <div key={`${u.id}-n`} className="flex items-center truncate pr-2 text-lg font-medium">{u.name}</div>,
                            <div key={`${u.id}-p`} className="flex items-center text-lg font-semibold tabular-nums">{u.stats.completion.percent}%</div>,
                            <div key={`${u.id}-m`} className="flex items-center text-lg tabular-nums text-[#52514e]">{u.stats.completion.months} mo</div>,
                            ...columns.map((c, i) => {
                                const t = byColumn.get(i)
                                const cell = t ? CELL[t.status_code] ?? CELL[300] : null
                                return (
                                    <div key={`${u.id}-${c.id}`} className={`flex items-center justify-center gap-0.5 rounded-[3px] ${t?.status_code === 300 ? 'border border-[#e7e5e4]' : ''}`} style={{ background: cell ? cell.wall : 'transparent' }}>
                                        {t?.status_code === 500 && <AlertOctagon className="size-4" style={{ color: cell.icon }} aria-label="stuck" />}
                                        {t?.update_late && <TriangleAlert className="size-4" style={{ color: cell.icon }} aria-label="update late" />}
                                    </div>
                                )
                            }),
                            <div key={`${u.id}-c`} className="flex items-center truncate pl-2 text-base text-[#52514e]">{u.current.join(', ') || (u.next ? `Next: ${u.next}` : '')}</div>,
                        ]
                    })}
                </div>
            </div>
        </div>
    )
}

function Ticker({ updates }) {
    if (!updates.length) return null
    return (
        <div className="flex min-w-0 items-center gap-6 overflow-hidden text-lg">
            <span className="shrink-0 font-semibold">Latest updates</span>
            {updates.slice(0, 4).map(u => (
                <span key={u.id} className="flex min-w-0 shrink items-center gap-2 truncate">
                    <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: u.status === 500 ? C.critical : C.series }} />
                    <span className="truncate">{u.unit} · {u.task} → {getReadableStatus(u.status)}</span>
                    <span className="shrink-0 text-[#52514e]">{fmtAgo(u.timestamp)}</span>
                </span>
            ))}
        </div>
    )
}

export default function DisplayContainer() {
    useViewportType()
    const [params] = useSearchParams()
    const seconds = Math.max(10, Number(params.get('seconds')) || 30)
    const wanted = params.get('projects')?.split(',').map(Number).filter(Boolean)
    const includeFinished = params.get('all') === '1'
    const [overviews, setOverviews] = useState(null)
    const [lastSuccess, setLastSuccess] = useState(null)
    const [failure, setFailure] = useState(null)
    const [index, setIndex] = useState(0)
    const [paused, setPaused] = useState(false)
    const [perPage, setPerPage] = useState(rowsPerPage)
    const [slideStart, setSlideStart] = useState(() => Date.now())
    const idle = useIdle(4000)
    const now = useNow(1000)
    const container = useRef(null)

    const load = useCallback(async () => {
        try {
            const res = await fetch('/api/projects/minimal')
            if (res.status === 401) throw new Error('signed-out')
            if (!res.ok) throw new Error(res.status)
            const projects = (await res.json()).filter(p => !wanted?.length || wanted.includes(p.id))
            const data = await Promise.all(projects.map(p => fetch(`/api/projects/${p.id}/overview?compact=1`).then(r => {
                if (r.status === 401) throw new Error('signed-out')
                return r.ok ? r.json() : Promise.reject(new Error(r.status))
            })))
            setOverviews(data)
            setLastSuccess(Date.now())
            setFailure(null)
        } catch (e) {
            // keep showing the last good data; the freshness line turns into a warning
            setFailure(e.message === 'signed-out' ? 'Signed out. Sign in again on this screen.' : 'Unable to refresh')
        }
    }, [params.get('projects')])   // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { load(); const id = setInterval(load, REFRESH_MS); return () => clearInterval(id) }, [load])
    useEffect(() => { const onResize = () => setPerPage(rowsPerPage()); window.addEventListener('resize', onResize); return () => window.removeEventListener('resize', onResize) }, [])

    const slides = useMemo(() => {
        if (!overviews) return []
        const shown = includeFinished ? overviews : overviews.filter(o => o.summary.is_open)
        const list = shown.length > 1 ? [{ kind: 'portfolio', key: 'portfolio', title: 'Open projects', overviews: shown }] : []
        for (const o of shown) {
            const open = o.units.filter(u => u.stage !== 'finished')
                .sort((a, b) => (a.stage === 'not_started') - (b.stage === 'not_started') || a.name.localeCompare(b.name, undefined, { numeric: true }))
            const units = open.length ? open : o.units
            const pages = Math.max(1, Math.ceil(units.length / perPage))
            for (let p = 0; p < pages; p++) {
                list.push({ kind: 'project', key: `${o.id}-${p}`, title: o.name, overview: o, units: units.slice(p * perPage, (p + 1) * perPage), page: p, pages })
            }
        }
        return list
    }, [overviews, perPage, includeFinished])

    const go = useCallback((delta) => {
        setIndex(i => (slides.length ? (i + delta + slides.length) % slides.length : 0))
        setSlideStart(Date.now())
    }, [slides.length])

    useEffect(() => {
        if (paused || slides.length < 2) return
        const id = setTimeout(() => go(1), seconds * 1000 - (Date.now() - slideStart))
        return () => clearTimeout(id)
    }, [paused, slides.length, seconds, slideStart, go])

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'ArrowRight') go(1)
            else if (e.key === 'ArrowLeft') go(-1)
            else if (e.key === ' ') { e.preventDefault(); setPaused(p => !p); setSlideStart(Date.now()) }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [go])

    const slide = slides[Math.min(index, slides.length - 1)]
    const recent = useMemo(() => {
        if (!overviews) return []
        const source = slide?.kind === 'project' ? [slide.overview] : overviews
        return source.flatMap(o => o.recent).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    }, [overviews, slide])
    const lastField = recent[0]?.timestamp
    const stale = lastSuccess && now - lastSuccess > STALE_MS
    const progress = paused || slides.length < 2 ? 0 : Math.min(1, (now - slideStart) / (seconds * 1000))

    return (
        <div ref={container} className={`fixed inset-0 flex flex-col overflow-hidden bg-[#f3f2ee] text-[#0b0b0b] ${idle ? 'cursor-none' : ''}`}>
            <div className="h-1.5 w-full bg-[#e7e6e2]"><div className="h-full" style={{ width: `${progress * 100}%`, background: C.series, transition: 'width 1s linear' }} /></div>
            <header className="flex items-center justify-between gap-6 px-8 py-4">
                <div className="flex items-center gap-4">
                    <Link to="/overview" title="Exit wall display"><img src={Logo} alt="ProjectPilot" className="h-10 w-10" /></Link>
                    <p className="text-2xl font-semibold">ProjectPilot</p>
                    {slides.length > 1 && <div className="ml-4 flex gap-1.5" aria-label={`Slide ${index + 1} of ${slides.length}`}>{slides.map((s, i) => <span key={s.key} className="h-2 w-6 rounded-full" style={{ background: i === index ? C.series : '#d6d5cf' }} />)}</div>}
                    {paused && <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-lg"><Pause className="size-5" aria-hidden />Paused</span>}
                </div>
                <div className="flex items-center gap-6 text-xl">
                    <span className={failure || stale ? 'inline-flex items-center gap-2 font-medium' : 'text-[#52514e]'} style={failure || stale ? { color: C.critical } : undefined}>
                        {(failure || stale) && <WifiOff className="size-6" aria-hidden />}
                        {failure ? `${failure} · showing data from ${lastSuccess ? new Date(lastSuccess).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'}`
                            : lastSuccess ? `Refreshed ${new Date(lastSuccess).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · last field update ${fmtAgo(lastField)}` : 'Loading…'}
                    </span>
                    <span className="text-3xl font-semibold tabular-nums">{new Date(now).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                    {!idle && !document.fullscreenElement && (
                        <button type="button" onClick={() => container.current?.requestFullscreen?.()} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-lg">
                            <Maximize className="size-5" aria-hidden />Full screen
                        </button>
                    )}
                </div>
            </header>

            <main className="min-h-0 flex-1 px-8" onClick={() => { setPaused(p => !p); setSlideStart(Date.now()) }}>
                {!overviews && <div className="flex h-full items-center justify-center text-3xl text-[#52514e]">{failure ?? 'Loading…'}</div>}
                {overviews && !slide && <div className="flex h-full items-center justify-center text-3xl text-[#52514e]">No active projects to show.</div>}
                {slide?.kind === 'portfolio' && <PortfolioSlide overviews={slide.overviews} />}
                {slide?.kind === 'project' && <ProjectSlide overview={slide.overview} units={slide.units} page={slide.page} pages={slide.pages} />}
            </main>

            <footer className="flex items-center justify-between gap-8 px-8 py-4">
                <Ticker updates={recent} />
                {slide?.kind === 'project' && (
                    <div className="flex shrink-0 items-center gap-5 text-base text-[#52514e]">
                        {CELL_ORDER.map(code => (
                            <span key={code} className="inline-flex items-center gap-2">
                                <span className={`inline-block size-4 rounded-sm ${code === 300 ? 'border border-[#d6d3d1]' : ''}`} style={{ background: CELL[code].wall }} />
                                {cellLabel(code)}
                            </span>
                        ))}
                        <span className="inline-flex items-center gap-2"><TriangleAlert className="size-5" aria-hidden />Update late</span>
                    </div>
                )}
            </footer>
        </div>
    )
}
