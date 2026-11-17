import hmac
import os
import sys
import time
from datetime import timedelta
from flask import request, make_response, session
from sqlalchemy.exc import IntegrityError

from config import app, db
from helpers import utc_now, utc_today
from mailer import send_email, mailgun_configured
from models import User, ReportDelivery
from reports import build_portfolio_report, build_personal_report, open_projects
from report_email import render_portfolio_email, render_personal_email
from rest.auth import allowed_projects, current_user_is_admin, projects_for_user, reset_base_url

ALLOWED_WEEKS = (1, 4, 8, 12, 26, 52)
PREVIEW_INTERVAL = 60   # seconds between preview emails per session
CRON_BUDGET = 50        # seconds; stop starting new emails after this so the function isn't cut off mid-send


def _weeks():
    try:
        weeks = int(request.args.get("weeks", 26))
    except ValueError:
        return None
    return weeks if weeks in ALLOWED_WEEKS else None


def _current_user():
    return User.query.filter_by(id=session.get('user_id')).first()


# executive report across projects (admin only)
@app.route('/api/reports/portfolio', methods=['GET'])
def get_portfolio_report():
    if not current_user_is_admin():
        return make_response({"error": "The portfolio report is available to administrators"}, 403)
    weeks = _weeks()
    if weeks is None:
        return make_response({"error": f"weeks must be one of {', '.join(map(str, ALLOWED_WEEKS))}"}, 422)

    accessible = allowed_projects()
    open_ids = {p.id for p in open_projects(accessible)}
    projects = accessible
    requested = request.args.get("project_ids")
    if requested:
        try:
            wanted = {int(pid) for pid in requested.split(",") if pid.strip()}
        except ValueError:
            return make_response({"error": "project_ids must be a comma-separated list of ids"}, 422)
        projects = [p for p in projects if p.id in wanted]
    # completed projects are history: they're left out unless asked for
    if request.args.get("include_completed") != "1":
        projects = [p for p in projects if p.id in open_ids]
    if not projects:
        return make_response({"error": "No open projects selected"}, 422)

    report = build_portfolio_report(projects, weeks)
    # for the page's project chips: every accessible project and whether it's still open
    report['available_projects'] = [{'id': p.id, 'name': p.name, 'open': p.id in open_ids} for p in accessible]
    return make_response(report, 200)


# the signed-in user's own activity, limited to projects they can access
@app.route('/api/reports/personal', methods=['GET'])
def get_personal_report():
    weeks = _weeks()
    if weeks is None:
        return make_response({"error": f"weeks must be one of {', '.join(map(str, ALLOWED_WEEKS))}"}, 422)
    projects = allowed_projects()
    if request.args.get("include_completed") != "1":
        projects = open_projects(projects)
    return make_response(build_personal_report(_current_user(), projects, weeks), 200)


def _render_for(user, period_end, portfolio_cache):
    """(scope, subject, text, html) for a user's weekly summary, or None when there's nothing worth sending."""
    base_url = reset_base_url()
    projects = open_projects(projects_for_user(user))
    if not projects:
        return None
    if user.is_admin:
        if 'emails' not in portfolio_cache:
            week = build_portfolio_report(projects, 1, period_end)
            trend = build_portfolio_report(projects, 8, period_end)
            portfolio_cache['emails'] = render_portfolio_email(week, trend, base_url)
        return ('portfolio', *portfolio_cache['emails'])
    week = build_personal_report(user, projects, 1, period_end)
    k = week['kpis']
    if not (k['updates'] or k['completed'] or k['awaiting']):
        return None
    trend = build_personal_report(user, projects, 8, period_end)
    return ('personal', *render_personal_email(week, trend, base_url))


# sends the signed-in user their own weekly summary now (not recorded as the weekly delivery)
@app.route('/api/reports/email-preview', methods=['POST'])
def send_report_preview():
    if not mailgun_configured() or not reset_base_url():
        return make_response({"error": "Email is not configured on this server"}, 503)
    last = session.get('report_preview_at', 0)
    if time.time() - last < PREVIEW_INTERVAL:
        return make_response({"error": "Please wait a minute before sending another preview"}, 429)

    user = _current_user()
    rendered = _render_for(user, utc_today() - timedelta(days=1), {})
    if not rendered:
        return make_response({"error": "Nothing to report for last week yet"}, 422)
    scope, subject, text, html = rendered
    try:
        send_email(user.email, f"[Preview] {subject}", text, html)
    except Exception as e:
        print(f"report preview: Mailgun send failed: {e!r}", file=sys.stderr)
        return make_response({"error": "The email could not be sent"}, 502)
    session['report_preview_at'] = time.time()
    return make_response({"message": f"Sent to {user.email}"}, 200)


def _cron_authorized():
    secret = os.getenv('CRON_SECRET')
    header = request.headers.get('Authorization', '')
    return bool(secret) and hmac.compare_digest(header.encode(), f"Bearer {secret}".encode())


# Vercel Cron (vercel.json) calls this every Monday. Covers the 7 days ending yesterday (Mon-Sun, UTC).
# Safe to call more than once: each user's row in report_deliveries is claimed before sending.
@app.route('/api/cron/weekly-report', methods=['GET'])
def weekly_report_cron():
    if not _cron_authorized():
        return make_response({"error": "Unauthorized"}, 401)
    if not mailgun_configured() or not reset_base_url():
        print("weekly report: Mailgun or APP_BASE_URL is not configured, nothing sent", file=sys.stderr)
        return make_response({"error": "Email is not configured on this server"}, 503)

    started = time.monotonic()
    period_end = utc_today() - timedelta(days=1)
    result = {"period_end": period_end.isoformat(), "sent": 0, "skipped": 0, "already_sent": 0, "failed": 0, "deferred": 0}
    portfolio_cache = {}
    for user in User.query.filter(User.weekly_report == True).order_by(User.id).all():
        if time.monotonic() - started > CRON_BUDGET:
            result["deferred"] += 1
            continue
        rendered = _render_for(user, period_end, portfolio_cache)
        if not rendered:
            result["skipped"] += 1
            continue
        scope, subject, text, html = rendered

        delivery = ReportDelivery(user_id=user.id, period_end=period_end, scope=scope)
        db.session.add(delivery)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            result["already_sent"] += 1
            continue
        try:
            send_email(user.email, subject, text, html)
        except Exception as e:
            print(f"weekly report: send to user {user.id} failed: {e!r}", file=sys.stderr)
            # release the claim so a later run retries this user
            db.session.delete(delivery)
            db.session.commit()
            result["failed"] += 1
            continue
        delivery.sent_at = utc_now()
        db.session.commit()
        result["sent"] += 1

    if result["deferred"] or result["failed"]:
        print(f"weekly report: incomplete run {result}", file=sys.stderr)
    return make_response(result, 200)
