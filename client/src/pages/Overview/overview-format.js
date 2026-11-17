import { getReadableStatus } from '@/utils/status_codes'

// Task status comes from the stored status_code (models.UnitTask.set_status_code), exactly as every other task view
// reads it, in the Overview's original colors and labels: Completed green, Pending yellow, In Progress blue,
// Stuck red, Scheduled uncolored. `bg` is the grid's light fill (Tailwind *-200, as before); `wall` is a stronger
// step of the same hue so the wall display reads from across the room.
export const CELL = {
    200: { bg: '#bbf7d0', wall: '#22c55e', icon: '#ffffff' },
    310: { bg: '#fef08a', wall: '#facc15', icon: '#0b0b0b' },
    311: { bg: '#bfdbfe', wall: '#3b82f6', icon: '#ffffff' },
    500: { bg: '#fecaca', wall: '#ef4444', icon: '#ffffff' },
    300: { bg: '#ffffff', wall: '#f5f5f4', icon: '#0b0b0b' },
}
// legend order, as on the original Overview header
export const CELL_ORDER = [200, 311, 500, 310, 300]
export const cellLabel = (code) => getReadableStatus(code)
export const cellStyle = (task) => CELL[task.status_code] ?? CELL[300]

// pills, in the original badge colors (Tailwind green-500 / red-500 / blue-500 / amber-400)
export const PILL = { good: '#22c55e', bad: '#ef4444', info: '#3b82f6', check: '#fbbf24', unknown: '#a8a29e' }
export const updatePillColor = (status) => (status === 200 ? PILL.good : status === 500 ? PILL.bad : PILL.info)

export const daysSince = (timestamp) => {
    if (!timestamp) return null
    const then = Date.parse(timestamp.replace(' ', 'T') + 'Z')
    return Math.floor((Date.now() - then) / 86400000)
}

export const fmtTimestamp = (timestamp) => {
    if (!timestamp) return '—'
    return new Date(timestamp.replace(' ', 'T') + 'Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const fmtAgo = (timestamp) => {
    const days = daysSince(timestamp)
    if (days === null) return 'never'
    if (days <= 0) return 'today'
    if (days === 1) return 'yesterday'
    if (days < 60) return `${days} days ago`
    return fmtTimestamp(timestamp)
}

export const overLabel = (days) => (days === null || days === undefined ? '—' : days > 0 ? `+${days} d` : days < 0 ? `${days} d` : 'on plan')
