from datetime import datetime
from flask import request, make_response

from config import app
from analytics import build_analytics
from rest.auth import allowed_projects, current_user_is_admin


def _parse_date(value):
    return datetime.strptime(value, "%Y-%m-%d").date() if value else None


# cross-project delay and blocker analytics (admin only)
@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    if not current_user_is_admin():
        return make_response({"error": "Analytics are available to administrators"}, 403)

    projects = allowed_projects()
    requested = request.args.get("project_ids")
    if requested:
        try:
            wanted = {int(pid) for pid in requested.split(",") if pid.strip()}
        except ValueError:
            return make_response({"error": "project_ids must be a comma-separated list of ids"}, 422)
        projects = [p for p in projects if p.id in wanted]
    if not projects:
        return make_response({"error": "No accessible projects selected"}, 422)

    try:
        date_from = _parse_date(request.args.get("from"))
        date_to = _parse_date(request.args.get("to"))
    except ValueError:
        return make_response({"error": "from/to must be YYYY-MM-DD"}, 422)

    return make_response(build_analytics(projects, date_from, date_to), 200)
