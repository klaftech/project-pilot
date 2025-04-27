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

def validate_date_input(date_string, date_format):
    try:
        datetime.strptime(date_string, date_format)
        return True
    except ValueError:
        return False