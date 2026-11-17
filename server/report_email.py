# Weekly summary emails built from reports.py. Email clients don't run scripts and many ignore <style>,
# so everything is table layout with inline styles; the "charts" are sized cells. Interactive detail lives
# on /reports, which every email links to.
from datetime import date
from html import escape

BLUE = '#2a78d6'
BLUE_LIGHT = '#cde2fb'
INK = '#0b0b0b'
INK_2 = '#52514e'
MUTED = '#8a8984'
LINE = '#e7e6e2'
GOOD = '#006300'
CRITICAL = '#d03b3b'
FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"


def _d(value):
    return date.fromisoformat(value) if isinstance(value, str) else value


def period_label(period):
    start, end = _d(period['from']), _d(period['to'])
    if start.year == end.year:
        return f"{start:%b} {start.day} – {end:%b} {end.day}, {end.year}"
    return f"{start:%b} {start.day}, {start.year} – {end:%b} {end.day}, {end.year}"


def _delta(now, prev, up_is_good=True):
    if prev == now:
        return f'<span style="color:{MUTED}">same as last week</span>'
    diff = now - prev
    good = (diff > 0) == up_is_good
    arrow = '▲' if diff > 0 else '▼'
    return f'<span style="color:{GOOD if good else CRITICAL}">{arrow} {abs(diff)}</span> <span style="color:{MUTED}">vs last week</span>'


def _tile(label, value, detail=''):
    return (f'<td width="50%" style="padding:6px" valign="top"><div style="border:1px solid {LINE};border-radius:8px;padding:14px 16px">'
            f'<div style="font-size:12px;color:{INK_2}">{escape(label)}</div>'
            f'<div style="font-size:26px;font-weight:600;color:{INK};margin-top:4px">{value}</div>'
            f'<div style="font-size:12px;margin-top:2px">{detail}</div></div></td>')


def _tiles(tiles):
    rows = ''.join('<tr>' + ''.join(_tile(*t) for t in tiles[i:i + 2]) + '</tr>' for i in range(0, len(tiles), 2))
    return f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0">{rows}</table>'


def _bars(values, labels, caption):
    if not any(values):
        return (f'<div style="font-size:13px;font-weight:600;color:{INK};margin:20px 0 4px">{escape(caption)}</div>'
                f'<div style="font-size:13px;color:{MUTED}">No activity in the last {len(values)} weeks.</div>')
    top = max(values)
    cells = ''
    for value, label in zip(values, labels):
        height = max(2, round(72 * value / top)) if value else 2
        color = BLUE if value else LINE
        cells += (f'<td align="center" valign="bottom" style="padding:0 3px">'
                  f'<div style="font-size:11px;color:{INK_2};padding-bottom:3px">{value if value else ""}</div>'
                  f'<div style="height:{height}px;width:22px;background:{color};border-radius:4px 4px 0 0;line-height:{height}px;font-size:1px">&nbsp;</div>'
                  f'<div style="font-size:10px;color:{MUTED};padding-top:4px;white-space:nowrap">{escape(label)}</div></td>')
    return (f'<div style="font-size:13px;font-weight:600;color:{INK};margin:20px 0 8px">{escape(caption)}</div>'
            f'<table role="presentation" cellpadding="0" cellspacing="0" style="border-bottom:1px solid {LINE}"><tr>{cells}</tr></table>')


def _meter(pct):
    pct = max(0, min(100, pct))
    return (f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:4px;overflow:hidden"><tr>'
            f'<td width="{pct}%" style="background:{BLUE};height:8px;font-size:1px;line-height:8px">&nbsp;</td>'
            f'<td width="{100 - pct}%" style="background:{BLUE_LIGHT};height:8px;font-size:1px;line-height:8px">&nbsp;</td></tr></table>')


def _section(title):
    return f'<div style="font-size:13px;font-weight:600;color:{INK};margin:24px 0 8px">{escape(title)}</div>'


def _week_labels(series):
    return [f"{_d(s['week_end']):%b} {_d(s['week_end']).day}" for s in series]


def _wrap(title, subtitle, body, base_url):
    return f"""<!doctype html><html><body style="margin:0;background:#f5f5f3;font-family:{FONT};color:{INK}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f3"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;border:1px solid {LINE}">
<tr><td style="padding:24px 24px 8px">
<div style="font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:{BLUE};font-weight:600">ProjectPilot</div>
<div style="font-size:22px;font-weight:600;margin-top:6px">{escape(title)}</div>
<div style="font-size:13px;color:{INK_2};margin-top:2px">{escape(subtitle)}</div>
</td></tr>
<tr><td style="padding:8px 18px 8px">{body}</td></tr>
<tr><td align="center" style="padding:16px 24px 28px">
<a href="{escape(base_url)}/reports" style="display:inline-block;background:{INK};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 22px;border-radius:8px">Open the full report</a>
</td></tr></table>
<div style="font-size:11px;color:{MUTED};margin-top:14px;max-width:600px">
You get this summary every Monday. Turn it off on your <a href="{escape(base_url)}/profile" style="color:{MUTED}">profile</a>.
</div></td></tr></table></body></html>"""


def _list(rows):
    if not rows:
        return f'<div style="font-size:13px;color:{MUTED}">Nothing here this week.</div>'
    items = ''.join(f'<tr><td style="padding:7px 6px;border-top:1px solid {LINE};font-size:13px">{r}</td></tr>' for r in rows)
    return f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0">{items}</table>'


def render_portfolio_email(week, trend, base_url):
    """week: build_portfolio_report(projects, 1); trend: the same with 8 weeks (for the bar chart)."""
    k = week['kpis']
    label = period_label(week['period'])
    body = _tiles([
        ('Tasks completed', k['tasks_completed'], _delta(k['tasks_completed'], k['tasks_completed_prev'])),
        ('Status updates', k['updates'], _delta(k['updates'], k['updates_prev'])),
        ('Units delivered', k['units_delivered'], _delta(k['units_delivered'], k['units_delivered_prev'])),
        ('Open blockers', k['open_stuck'], f'<span style="color:{MUTED}">{k["late_updates"]} late updates</span>'),
    ])
    body += _section(f"Open projects {k['completion_pct']}% complete")
    body += _meter(k['completion_pct'])
    body += (f'<div style="font-size:12px;color:{INK_2};margin-top:6px">{k["units_finished"]} of {k["units"]} units finished · '
             f'{k["units_in_progress"]} in progress · {k["units_not_started"]} not started</div>')
    body += _bars([s['completed'] for s in trend['series']], _week_labels(trend['series']), 'Tasks completed per week')

    body += _section('Projects')
    rows = ''
    for p in week['project_scorecard']:
        rows += (f'<tr><td style="padding:8px 6px;border-top:1px solid {LINE};font-size:13px">{escape(p["name"])}'
                 f'<div style="margin-top:5px;width:140px">{_meter(p["completion_pct"])}</div></td>'
                 f'<td align="right" style="padding:8px 6px;border-top:1px solid {LINE};font-size:13px">{p["completion_pct"]}%</td>'
                 f'<td align="right" style="padding:8px 6px;border-top:1px solid {LINE};font-size:13px">{p["tasks_completed"]}</td>'
                 f'<td align="right" style="padding:8px 6px;border-top:1px solid {LINE};font-size:13px">{p["open_stuck"]}</td></tr>')
    body += (f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
             f'<tr><td style="font-size:11px;color:{MUTED};padding:0 6px 4px">Project</td><td align="right" style="font-size:11px;color:{MUTED};padding:0 6px 4px">Complete</td>'
             f'<td align="right" style="font-size:11px;color:{MUTED};padding:0 6px 4px">Done this week</td><td align="right" style="font-size:11px;color:{MUTED};padding:0 6px 4px">Stuck</td></tr>'
             f'{rows}</table>')

    body += _section('Needs attention')
    body += _list([f'<a href="{escape(base_url)}/task/{b["task_id"]}" style="color:{INK}">{escape(b["unit"])} · {escape(b["task"])}</a>'
                   f' <span style="color:{CRITICAL}">stuck {b["days"]} d</span>'
                   + (f'<div style="color:{INK_2};font-size:12px">{escape(b["note"])}</div>' if b['note'] else '')
                   for b in week['attention']['blockers'][:5]])

    subject = f"Weekly report: {k['tasks_completed']} tasks completed, {k['open_stuck']} blocked ({label})"
    text = (f"ProjectPilot weekly portfolio report, {label}\n\n"
            f"Tasks completed: {k['tasks_completed']} (last week {k['tasks_completed_prev']})\n"
            f"Status updates: {k['updates']} (last week {k['updates_prev']})\n"
            f"Units delivered: {k['units_delivered']}\n"
            f"Open blockers: {k['open_stuck']}\n"
            f"Open projects: {k['completion_pct']}% complete, {k['units_finished']} of {k['units']} units finished\n\n"
            + ''.join(f"- {p['name']}: {p['completion_pct']}% complete, {p['tasks_completed']} done this week\n" for p in week['project_scorecard'])
            + f"\nFull report: {base_url}/reports\nTurn this email off on your profile: {base_url}/profile\n")
    html = _wrap('Weekly portfolio report', label, body, base_url)
    return subject, text, html


def render_personal_email(week, trend, base_url):
    k = week['kpis']
    label = period_label(week['period'])
    name = week['user']['first_name'].strip()
    body = _tiles([
        ('Updates you posted', k['updates'], _delta(k['updates'], k['updates_prev'])),
        ('Tasks you completed', k['completed'], _delta(k['completed'], k['completed_prev'])),
        ('Days active', f"{k['active_days']}/7", _delta(k['active_days'], k['active_days_prev'])),
        ('Waiting for an update', k['awaiting'], f'<span style="color:{MUTED}">in your projects</span>'),
    ])
    body += _bars([s['updates'] for s in trend['series']], _week_labels(trend['series']), 'Your updates per week')

    body += _section('Waiting for an update')
    body += _list([f'<a href="{escape(base_url)}/task/{t["task_id"]}" style="color:{INK}">{escape(t["unit"])} · {escape(t["task"])}</a>'
                   f' <span style="color:{MUTED}">{escape(t["project"])}</span>'
                   for t in week['awaiting'][:6]])

    body += _section('Your projects')
    body += _list([f'{escape(p["name"])} <span style="color:{INK_2}">· {p["completion_pct"]}% complete · {p["units_finished"]} of {p["units"]} units finished</span>'
                   f'<div style="margin-top:5px">{_meter(p["completion_pct"])}</div>'
                   for p in week['projects']])

    subject = f"Your week: {k['updates']} updates, {k['awaiting']} tasks waiting ({label})"
    text = (f"Hi {name},\n\nYour ProjectPilot week, {label}\n\n"
            f"Updates posted: {k['updates']} (last week {k['updates_prev']})\n"
            f"Tasks completed: {k['completed']}\n"
            f"Waiting for an update in your projects: {k['awaiting']}\n\n"
            + ''.join(f"- {t['unit']} · {t['task']}: {base_url}/task/{t['task_id']}\n" for t in week['awaiting'][:6])
            + f"\nFull report: {base_url}/reports\nTurn this email off on your profile: {base_url}/profile\n")
    html = _wrap(f'Your week, {name}', label, body, base_url)
    return subject, text, html
