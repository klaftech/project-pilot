#from datetime import datetime, timedelta, time, date
from datetime import datetime, timezone, timedelta

def get_next_monday():
    # Monday is 0, Sunday is 6
    #today = date.today()
    today = datetime.now(timezone.utc).date()
    day_of_week = today.weekday()
    days_until_monday = (7 - day_of_week) % 7
    next_monday = today + timedelta(days=days_until_monday)
    return next_monday

def get_previous_monday(today=None):
    # Monday is 0, Sunday is 6
    #today = date.today()
    today = today or datetime.now(timezone.utc).date()
    day_of_week = today.weekday()
    days_to_subtract = day_of_week if day_of_week != 0 else 7
    previous_monday = today - timedelta(days=days_to_subtract)
    return previous_monday

# All DateTime columns are `timestamp without time zone` holding UTC wall-clock values.
# These helpers keep Python-side values the same way: naive datetimes that mean UTC.
def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

def utc_today():
    return datetime.now(timezone.utc).date()

def to_utc_naive(value):
    # aware -> converted to UTC; naive -> assumed to already be UTC (not server local time)
    if value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value

# Two status-update rules, for two audiences (documented in CLAUDE.md):
#
# update_due -- the Home rule, what field staff are asked for. A started, unfinished task is due for an update when
#   it has none since this week's Monday (get_previous_monday; the same condition as the Home page's pending list in
#   rest/unit_tasks.py). Used by Home, the personal report and the personal weekly email.
#
# update_late -- the executive rule. An update only counts as missed once a full week has passed since it was due:
#   a Pending / In Progress / Stuck task with no update since the start of the late window. The window starts at the
#   Sunday before last -- the cutoff the Overview grid has always used (its client helpers are named
#   getPreviousPreviousMonday() but count from getDay(), where 0 is Sunday). A task that became ready inside the
#   window and has no update yet isn't late. Like the original, the cutoff keeps the current time of day (it's "the
#   Sunday before last, at this time"), so late flips at that moment rather than at midnight. Used by the Overview
#   grid, the wall display, the portfolio report and the admin weekly email. Both rules work in UTC (the original
#   Overview used the browser's local time).
def update_due(started_status, complete_status, latest_update_at, today=None):
    if not started_status or complete_status:
        return False
    monday = datetime.combine(get_previous_monday(today), datetime.min.time())
    return latest_update_at is None or latest_update_at < monday

def late_cutoff(now=None):
    now = now or utc_now()
    js_day = (now.weekday() + 1) % 7   # JavaScript getDay(): Sunday = 0
    return now - timedelta(days=(js_day or 7) + 7)

def late_window_start(now=None):
    return late_cutoff(now).date()

def update_late(status_code, started_status, started_date, latest_update_at, now=None):
    if status_code in (200, 300):   # completed / scheduled
        return False
    cutoff = late_cutoff(now)
    if latest_update_at is not None:
        return not latest_update_at > cutoff
    return not (started_status and started_date is not None and started_date > cutoff)

def completion_percent(done, total):
    # rounds down, like Project/Unit stats everywhere else in the app
    return int(done / total * 100) if total and done else 0

def validate_date_input(date_string, date_format):
    try:
        datetime.strptime(date_string, date_format)
        return True
    except ValueError:
        return False