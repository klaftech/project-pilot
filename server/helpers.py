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

def get_previous_monday():
    # Monday is 0, Sunday is 6
    #today = date.today()
    today = datetime.now(timezone.utc).date()
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

def validate_date_input(date_string, date_format):
    try:
        datetime.strptime(date_string, date_format)
        return True
    except ValueError:
        return False