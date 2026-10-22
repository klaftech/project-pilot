# ProjectPilot

Project management for multi-unit construction, built around task dependencies and automatic schedule propagation.

**In production.** Licensed to a commercial and residential development firm operating along the East Coast.

🔗 [projectpilot.me](https://projectpilot.me)

---

## The problem

Construction schedules are graphs, not lists. Framing can't start before the foundation cures; drywall waits on rough-in inspection. When one task slips, everything downstream slips with it — and on a development with dozens of units running the same task sequence in parallel, tracing that ripple by hand is where projects lose weeks.

Most project tools either ignore dependencies entirely or make you re-enter the same task list for every unit. ProjectPilot does neither.

## Core concepts

**Template and instance.** A `MasterTask` defines a step once — its duration, its dependencies, who owns it. A `Unit` is a single house, apartment, or lot. Instantiating the template against a unit produces `UnitTask` records that carry their own status and dates while staying linked to the master definition. Change the template, and every unit inherits it; change one unit's task, and the others are untouched.

**Dependency-driven scheduling.** Tasks declare predecessors through `MasterTaskDependency`. When a task's status or completion date changes, the scheduler walks the dependency graph and recalculates predicted start and finish dates for everything downstream. Recalculation is bound to SQLAlchemy insert and update events, so schedules stay consistent no matter which entry point wrote the change — REST call, bulk edit, or status update.

Tasks can also be pinned so they never start or end before a fixed date, which models real-world constraints like permit windows and material delivery that dependencies alone can't express.

**Scoped access.** Project membership is explicit through `ProjectUser` and `Group`. Users see the projects, units, and tasks their role grants them — a field supervisor's view of their own units, an administrator's view across the portfolio.

## Features

- **Overview** — every project broken down by task and status in a single chart, for portfolio-level management
- **Project summary** — progress, deadlines, team, and status breakdowns with predicted completion
- **Schedule** — Gantt view mapping tasks, timelines, dependencies, and slippage
- **My Tasks** — personal queue split into Due Today, Upcoming, and Delayed
- **Task list** — filterable view with status, priority, assignee, due date, and dependencies
- **Status updates** — timestamped progress entries with notes, feeding the prediction model
- Multi-user task assignment, full auth lifecycle including password reset

## Stack

**Frontend** — React (Vite), shadcn/ui on Radix, Tailwind CSS
**Backend** — Flask, SQLAlchemy, Alembic migrations
**Database** — PostgreSQL
**Deployment** — Vercel

## Structure

```
server/
  models.py       Domain model and scheduling logic
  rest/           Resource endpoints (projects, units, tasks, groups, auth, updates)
  seed/           Development seed data
client/
  src/pages/      Overview, Project, Unit, Task, Schedule, Admin, auth
  src/components/ Shared UI and forms
  src/context/    Application state
```

## Local development

Requires Python 3.12 (3.11 also tested), Node, and a PostgreSQL instance.

```bash
# Configuration
cp .env.example .env               # then fill in SECRET_KEY, DATABASE_URI, signup settings

# Frontend
npm install --prefix client
npm run build --prefix client

# Backend (pipenv; Python 3.12 for this project only, OS and pyenv-global Python untouched)
pyenv install 3.12                 # once, if `pipenv --python 3.12` can't find a 3.12 interpreter
pipenv --python 3.12               # creates the project virtualenv
pipenv install --dev               # installs exactly what Pipfile.lock pins
(cd server && pipenv run flask db upgrade)
pipenv run python server/app.py
```

## Upgrading Python packages

`Pipfile` is the source of truth and Vercel installs the committed `Pipfile.lock`, so every change ends
with both files committed together.

```bash
# 1. edit version ranges in Pipfile if needed, then re-resolve
pipenv lock                        # or: pipenv upgrade <package>
# 2. install exactly the lock and check it
pipenv install --dev --deploy      # --deploy fails if Pipfile and Pipfile.lock disagree
pipenv run pip-audit               # no known vulnerabilities
# 3. against a throwaway _test database: regression scenarios pass,
#    (cd server && pipenv run flask db upgrade) works on an empty DB, app pages load
git add Pipfile Pipfile.lock
```

Hold back major or breaking lines until they've been tried deliberately: `bcrypt` 5 rejects passwords over
72 bytes, SQLAlchemy 2.1 removes 2.0 deprecations, `python-dateutil` 3 is a new major.
`Flask-RESTful` is unmaintained (last release 0.3.10); plan to replace it with plain Flask views eventually.

## Maintenance scripts

Run from the repo root. Each script reads `DATABASE_URI` from the environment or `.env`.

```bash
# reset a user's password (prints the new random password)
python server/password_reset.py user@example.com

# run SQL; read-only unless --write is passed (then it asks for confirmation)
python server/run_sql.py --list                    # built-in data checks
python server/run_sql.py duplicate_unit_tasks
python server/run_sql.py -q "SELECT count(*) FROM users" --csv out.csv

# full read-only export to exports/<db>-<timestamp>/ (pg_dump archive, schema.sql, per-table CSVs, manifest.json)
# exports/ is git-ignored: it contains user data and password hashes
python server/export_db.py
pg_restore --no-owner --no-privileges -d <empty_db> exports/<dir>/<db>.dump   # restore

# regression scenarios; needs a throwaway Postgres whose name ends in _test (all tables are dropped)
TEST_DATABASE_URI=postgresql://user@127.0.0.1:5432/pp_test python -I docs/review/scenarios.py server
```


---

Built and maintained by [Elchonon Klafter](https://klaftech.com).