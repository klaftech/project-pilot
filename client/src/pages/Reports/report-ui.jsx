import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { C, fmt, weeksLabel } from '@/pages/Reports/report-format'

export function Card({ title, subtitle, action, children, className = '' }) {
    return (
        <section className={`min-w-0 rounded-xl border bg-white p-4 md:p-5 print:break-inside-avoid ${className}`}>
            {(title || action) && (
                <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                        {title && <h2 className="font-semibold">{title}</h2>}
                        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
                    </div>
                    {action}
                </div>
            )}
            {children}
        </section>
    )
}

// signed change vs the previous period; color = direction x whether up is good, always with an arrow and sign
export function Delta({ now, prev, upIsGood = true, weeks }) {
    if (prev === null || prev === undefined) return null
    const diff = now - prev
    const label = `vs ${weeksLabel(weeks)}`
    if (diff === 0) {
        return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Minus className="size-3.5" aria-hidden />no change {label}</span>
    }
    const good = (diff > 0) === upIsGood
    const pct = prev ? Math.round((Math.abs(diff) / prev) * 100) : null
    const Icon = diff > 0 ? ArrowUpRight : ArrowDownRight
    return (
        <span className="inline-flex flex-wrap items-center gap-1 text-xs">
            <span className="inline-flex items-center font-medium" style={{ color: good ? C.good : C.critical }}>
                <Icon className="size-3.5" aria-hidden />{diff > 0 ? '+' : '−'}{fmt(Math.abs(diff))}{pct !== null && ` (${pct}%)`}
            </span>
            <span className="text-muted-foreground">{label}</span>
        </span>
    )
}

// 12-ish point trend in the de-emphasis gray, latest point in the accent
export function Sparkline({ values, label }) {
    if (!values || values.length < 2) return null
    const w = 96, h = 28, pad = 4
    const max = Math.max(1, ...values)
    const x = (i) => pad + (i * (w - 2 * pad)) / (values.length - 1)
    const y = (v) => h - pad - (v / max) * (h - 2 * pad)
    const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
    const last = values.length - 1
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="shrink-0">
            <polyline points={points} fill="none" stroke={C.spark} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={x(last)} cy={y(values[last])} r="4" fill={C.series} stroke={C.surface} strokeWidth="2" />
        </svg>
    )
}

export function StatTile({ label, value, detail, trend, trendLabel, icon }) {
    return (
        <div className="flex min-w-0 flex-col justify-between gap-2 rounded-xl border bg-white p-4 print:break-inside-avoid">
            <div className="flex items-start justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">{icon}{label}</p>
                <Sparkline values={trend} label={trendLabel} />
            </div>
            <div>
                <p className="text-3xl font-semibold tracking-tight">{value}</p>
                <div className="mt-1 min-h-4">{detail}</div>
            </div>
        </div>
    )
}

export function Meter({ pct, label }) {
    const value = Math.max(0, Math.min(100, pct ?? 0))
    return (
        <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: C.track }} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label}>
            <div className="h-full rounded-full" style={{ width: `${value}%`, background: C.series }} />
        </div>
    )
}

export function ChartTooltip({ active, payload, render }) {
    if (!active || !payload?.length) return null
    return <div className="rounded-md border bg-white px-3 py-2 text-xs shadow-sm">{render(payload[0].payload)}</div>
}

// legend swatches mirror the marks (rects for bars)
export function Legend({ items }) {
    return (
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {items.map(i => (
                <span key={i.label} className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-2.5 rounded-sm" style={{ background: i.color }} />{i.label}
                </span>
            ))}
        </div>
    )
}

export function Segmented({ options, value, onChange, label }) {
    return (
        <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border bg-white p-0.5 text-sm">
            {options.map(o => (
                <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
                    className={`rounded-md px-2.5 py-1 ${value === o.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
                    {o.label}
                </button>
            ))}
        </div>
    )
}

export function TableToggle({ open, onClick }) {
    return <button type="button" onClick={onClick} className="text-sm text-muted-foreground underline-offset-4 hover:underline print:hidden">{open ? 'Hide table' : 'Show table'}</button>
}

export function Empty({ children }) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>
}
