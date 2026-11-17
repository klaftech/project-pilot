// chart tokens (reference palette, light mode). One series -> slot-1 blue. Ordered stages -> steps of the
// blue ramp (validated as an ordinal ramp: 250 / 450 / 650). Status colors are only used with an icon + label.
export const C = {
    series: '#2a78d6',
    stageLight: '#86b6ef',   // not started / projected
    stageMid: '#2a78d6',     // in progress / delivered
    stageDark: '#104281',    // finished
    track: '#cde2fb',        // meter track: a lighter step of the same ramp
    grid: '#e7e6e2',
    hover: '#f3f2ee',
    selected: '#e6eefa',     // band behind a selected row/column (a wash of the series hue, not data ink)
    surface: '#ffffff',
    ink: '#0b0b0b',
    ink2: '#52514e',
    muted: '#8a8984',
    spark: '#b9b8b2',
    good: '#006300',
    critical: '#d03b3b',
}

export const AXIS_TICK = { fill: C.ink2, fontSize: 12 }

const nf = new Intl.NumberFormat('en-US')
export const fmt = (n) => (n === null || n === undefined ? '—' : nf.format(n))

export const isoToDate = (iso) => new Date(`${iso}T00:00:00Z`)
export const fmtDay = (iso) => iso ? isoToDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '—'
export const fmtDate = (iso) => iso ? isoToDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '—'
export const fmtMonth = (ym) => isoToDate(`${ym}-01`).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })
// the start carries its own year when the period spans a new year
export const fmtPeriod = (p) => `${p.from.slice(0, 4) === p.to.slice(0, 4) ? fmtDay(p.from) : fmtDate(p.from)} – ${fmtDate(p.to)}`
export const weeksLabel = (w) => (w === 1 ? 'previous week' : `previous ${w} weeks`)

export function downloadCsv(filename, columns, rows) {
    const cell = (v) => {
        const s = v === null || v === undefined ? '' : String(v)
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csv = [columns.map(c => cell(c.label)), ...rows.map(r => columns.map(c => cell(c.value(r))))].map(r => r.join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}
