import { useContext, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Mail, Printer } from 'lucide-react'
import { toast } from 'sonner'

import AppWrapper from '@/components/AppWrapper'
import LoadingWrapper from '@/components/LoadingWrapper'
import ShowAlert from '@/components/ShowAlert'
import UserContext from '@/context/UserContext'
import ProjectsContext from '@/context/ProjectsContext'
import { fmtPeriod } from '@/pages/Reports/report-format'
import { Segmented } from '@/pages/Reports/report-ui'
import ExecutiveReport from '@/pages/Reports/ExecutiveReport'
import PersonalReport from '@/pages/Reports/PersonalReport'

const PERIODS = [
    { value: 4, label: '4 weeks' },
    { value: 12, label: '12 weeks' },
    { value: 26, label: '26 weeks' },
    { value: 52, label: '52 weeks' },
]

function ReportsContainer() {
    const { user } = useContext(UserContext)
    const { projects } = useContext(ProjectsContext)
    const [params, setParams] = useSearchParams()
    const isAdmin = !!user?.is_admin
    const view = isAdmin && params.get('view') !== 'personal' ? 'portfolio' : 'personal'
    const [weeks, setWeeks] = useState(26)
    const [selected, setSelected] = useState(null)   // null = every project in scope
    const [includeCompleted, setIncludeCompleted] = useState(false)
    const [available, setAvailable] = useState(null)  // from the portfolio response: accessible projects + open flag
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [sending, setSending] = useState(false)

    useEffect(() => {
        if (!user) return
        const query = new URLSearchParams({ weeks: String(weeks) })
        if (view === 'portfolio' && selected?.length) query.set('project_ids', selected.join(','))
        if (includeCompleted) query.set('include_completed', '1')
        let cancelled = false
        setLoading(true); setError(null)
        fetch(`/api/reports/${view}?${query}`)
            .then(res => res.ok ? res.json() : res.json().then(d => Promise.reject(d.error || res.status)))
            .then(d => { if (!cancelled) { setData(d); if (d.available_projects) setAvailable(d.available_projects) } })
            .catch(err => { if (!cancelled) setError(typeof err === 'string' ? err : 'Unable to load the report.') })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [user, view, weeks, selected, includeCompleted])

    const setView = (next) => {
        setData(null)
        setParams(next === 'personal' ? { view: 'personal' } : {}, { replace: true })
    }

    // completed projects are history: offered only when asked for
    const chipProjects = (available ?? projects.map(p => ({ ...p, open: true }))).filter(p => includeCompleted || p.open)
    const toggleProject = (id) => {
        const all = chipProjects.map(p => p.id)
        const current = selected ?? all
        const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id]
        setSelected(next.length === all.length ? null : next.length ? next : current)
    }

    const sendPreview = async () => {
        setSending(true)
        try {
            const res = await fetch('/api/reports/email-preview', { method: 'POST' })
            const body = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(body.error || 'The email could not be sent')
            toast.success(`Weekly email preview: ${body.message}`)
        } catch (e) {
            toast.error(e.message)
        } finally {
            setSending(false)
        }
    }

    const shown = data && data.scope === view ? data : null
    const activeIds = selected ?? chipProjects.map(p => p.id)
    const firstName = user?.first_name?.trim()
    const title = view === 'portfolio' ? 'Portfolio report' : `${firstName ? `${firstName}'s` : 'My'} activity report`

    return (
        <AppWrapper>
            <div className="min-w-0 space-y-5">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#2a78d6' }}>Reports</p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {shown ? `${includeCompleted ? 'All projects' : 'Open projects'} · ${fmtPeriod(shown.period)} · compared with the same projects' previous ${shown.period.weeks} weeks` : 'Loading…'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 print:hidden">
                        {isAdmin && (
                            <button type="button" onClick={sendPreview} disabled={sending}
                                className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-white px-3 text-sm hover:bg-muted/60 disabled:opacity-50">
                                <Mail className="size-4" aria-hidden />{sending ? 'Sending…' : 'Email me last week'}
                            </button>
                        )}
                        <button type="button" onClick={() => window.print()}
                            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-3 text-sm font-medium text-background hover:opacity-90">
                            <Printer className="size-4" aria-hidden />Print / PDF
                        </button>
                    </div>
                </header>

                {/* filters: one row above everything they scope */}
                <div className="flex flex-wrap items-center gap-2 print:hidden">
                    {isAdmin && (
                        <Segmented label="Report" value={view} onChange={setView}
                            options={[{ value: 'portfolio', label: 'Portfolio' }, { value: 'personal', label: 'My activity' }]} />
                    )}
                    <Segmented label="Period" value={weeks} onChange={setWeeks} options={PERIODS} />
                    {view === 'portfolio' && chipProjects.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                            {chipProjects.map(p => {
                                const on = activeIds.includes(p.id)
                                return (
                                    <button key={p.id} type="button" aria-pressed={on} onClick={() => toggleProject(p.id)}
                                        className={`rounded-full border px-3 py-1 text-sm ${on ? 'border-foreground bg-foreground text-background' : 'bg-white text-muted-foreground'}`}>
                                        {p.name}{!p.open && ' (completed)'}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" className="size-4 accent-foreground" checked={includeCompleted}
                            onChange={e => { setSelected(null); setIncludeCompleted(e.target.checked) }} />
                        Include completed projects
                    </label>
                </div>

                {error && <ShowAlert message={error} />}
                {!shown && !error && <LoadingWrapper />}
                {shown && (
                    // refetch keeps the previous render, dimmed, instead of flashing a loader
                    <div className={`transition-opacity ${loading ? 'pointer-events-none opacity-60' : ''}`} aria-busy={loading}>
                        {view === 'portfolio' ? <ExecutiveReport data={shown} /> : <PersonalReport data={shown} />}
                    </div>
                )}
            </div>
        </AppWrapper>
    )
}

export default ReportsContainer
