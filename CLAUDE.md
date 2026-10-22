# CLAUDE.md

Guidance for AI agents working in this repo. **This repo is public.** Never commit client names, production hostnames, emails, exports or anything under `docs/`.

If `docs/HANDOFF.md` exists locally (it's git-ignored), read it first: it holds current production state, open items and decisions.

## What this is

ProjectPilot: project management for multi-unit residential construction, in production for one client.

- **`MasterTask`:** a project's task template (name, `days_length`, dependencies).
- **`Unit`:** one house or lot.
- **`UnitTask`:** created per unit from the template (`Unit.build_tasklist()`).
- **`StatusUpdate`:** field staff post progress (1/25/50/75/100%, Completed, Stuck). Each update advances its `UnitTask`.

## Stack and layout

```
server/              Flask + flask-restful + SQLAlchemy 2.0 (Python 3.12), Postgres (Neon in prod)
  app.py             routes, session auth gate (before_request)
  config.py          app/db setup, cookie flags, security headers, JSON 404 for /api/*
  models.py          all models, stats (get_stats, summarize_unit_tasks), latest_updates_by_task
  helpers.py         utc_now / utc_today / to_utc_naive, Monday helpers
  rest/*.py          resources: auth, projects (incl. /overview), units, unit_tasks, master_tasks,
                     updates, groups, users, project_users
  migrations/        Alembic (Flask-Migrate); head a9afca8ff87b (task_types)
  analytics.py       cross-project delay/blocker facts for GET /api/analytics (admin only)
  run_sql.py         SQL runner, read-only unless --write / --dry-run
  export_db.py       full read-only export (pg_dump + CSVs + manifest) to exports/
  password_reset.py  python server/password_reset.py <email>
client/              React 18 + Vite 6, shadcn/ui (Radix) + some MUI, Tailwind 3, react-router 7
  src/App.jsx        routes (most pages lazy-loaded)
  src/context/       User, ActiveProject, Projects, Units, Tasks contexts
  src/utils/         task.js (taskBuilder), date.js, schedule.js (projection), status_codes.js
  src/pages/Analytics/  /analytics dashboard (Recharts; one series per chart, slot-1 blue)
```

## Commands

```bash
pipenv --python 3.12 && pipenv install --dev        # Python deps: Pipfile/Pipfile.lock are the source of truth
npm install --prefix client && npm run build --prefix client
(cd server && pipenv run flask db upgrade)           # migrations
pipenv run python server/app.py                      # API on :5555; Vite dev server on :4000 proxies /api
```

**`.env` points at the production database.** Never run tests, seeds, migrations or write scripts against it unless the user explicitly asks. For tests:
1. Use a throwaway local Postgres whose database name ends in `_test`.
2. Set `TEST_DATABASE_URI` (the regression script refuses any other database name).
3. Pass env vars explicitly; `load_dotenv()` never overrides variables that are already set.

## Domain rules and invariants (don't break these)

- **Datetimes are naive UTC everywhere.** Use `helpers.utc_now()` / `utc_today()` / `to_utc_naive()`. Never `datetime.now()`, `date.today()`, or `.astimezone()` on naive values. Column defaults must be callables (`default=utc_now`), never `default=datetime.now(...)`, which freezes the value at import time.
- **`UnitTask.sched_start/sched_end` are the original plan and never move.** The dependency-driven rescheduling engine (`calculate_schedule`, the event hooks) is disabled. The UI derives actual and projected dates in `client/src/utils/schedule.js`. Don't describe stored `sched_*` as predictions.
- **`started_date` currently means "became ready".** `UnitTask.mark_children_started()` sets it to the **same day** the last blocking parent (`autostart_children=True`) completed, once all of them are complete. (Until 2026-10-21 it added one day, which left about 480 historical tasks "started" after they finished.) A real start is only recorded for templates with `override_start_date`. Analytics never trusts `started_date`; it measures from the prerequisites' completion.
- **`TaskType`** links each project's `MasterTask` to a cross-project kind of work. New master tasks link automatically by name (case- and whitespace-insensitive, via `TaskType.for_name`). Renaming a master task keeps its type. Group analytics by type, never by name.
- **One `UnitTask` per (unit, master task)** is enforced by `uq_unit_tasks_unit_id`.
- **Status codes** (`client/src/utils/status_codes.js`):

  | Code | Meaning |
  |---|---|
  | 1 / 25 / 50 / 75 / 100 | progress % |
  | 200 | completed |
  | 300 | scheduled |
  | 310 | pending (started, no progress yet) |
  | 311 | in progress |
  | 500 | stuck |

  Allowed transitions are in `rest/updates.py::validate_status_change`. A completion goes through `update_unit_task()`, which also clamps `started_date` so it's never after `complete_date`.
- **Latest update:** use `latest_updates_by_task(ids)` for lists (one query). Ties on timestamp resolve to the highest id, the same rule the `UnitTask.latest_update` property uses.

## Authorization

- **Project access:** `rest/auth.py` has `allowed_projects()` (it excludes soft-deleted `ProjectUser` rows) and `can_access_project(id)`. **Every endpoint that touches project data must check one of them.** Admins see all projects.
- **Structure edits are admin-only**, via `current_user_is_admin()` / `admin_required_response()`: master tasks, dependencies, groups, unit create/edit. Members can post status updates and mark tasks complete.
- **PATCH handlers allow-list fields.** Never `setattr` every key from the request.

## Conventions

- **Code style:** match the surrounding code. Python resources return `make_response(dict_or_list, status)` with `{"error": ...}` (some older auth routes use `{"errors": [...]}`).
- **Frontend:** fetch with relative `/api/...`. Build task objects with `taskBuilder`. shadcn components live in `components/ui`. No PropTypes, so ESLint reports many `react/prop-types` warnings, which is the existing baseline. `console.log` is stripped from production builds.
- **Comments:** short, explaining *why*, matching the existing density.
- **Git:**
  - commit email `184013816+klaftech@users.noreply.github.com` (already set in the repo config);
  - end commit messages with the Co-Authored-By line;
  - keep messages neutral about security fixes;
  - commit both `Pipfile` and `Pipfile.lock` after dependency changes.

## Deployment (Vercel)

- **Every push to `main` deploys to production.** Vercel installs `Pipfile.lock` (Python 3.12) and builds `client/dist`, which is not committed.
- **Migrations are not run on deploy.** Run `flask db upgrade` against production *before* pushing code that needs the new schema (e.g. new columns), after a pre-change backup (`server/export_db.py` or a Neon branch).
- **Production writes:** use `server/run_sql.py --dry-run` first, then `--write` (it asks for confirmation).

## Testing

- **Server regression scenarios:** `docs/review/scenarios.py` (local only; currently 34). Run it against a `_test` database in both `TZ=UTC` and `TZ=America/New_York`.
- **Client:** `npm run build`. ESLint should introduce no new `no-undef` / parse errors.
- **Browser checks:** Playwright against a local server with a restored export works well. Never point it at production.
