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

Requires Python 3, Node, and a PostgreSQL instance.

```bash
# Frontend
npm install --prefix client
npm run build --prefix client

# Backend
pip install -r requirements.txt
flask db upgrade
python server/app.py
```

Configure your database connection and secret key in the environment before first run.

---

Built and maintained by [Elchonon Klafter](https://klaftech.com).