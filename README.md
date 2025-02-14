# ProjectPilot

ProjectPilot is a innovative project management platform that asynchronously handles project scheduling based on task rules and dependencies. The project dashboard features robust reporting and a high-level overview of the project progress, making it easy to quickly pinpoint bottlenecks and delays.

## Demo
[Live Demo](https://project-pilot-seven.vercel.app/)

[Presentation Slides](https://docs.google.com/presentation/d/1EcQUvc2fFBbMIu7x39l0bFjSWCR0OthasWq1PwccOoo/edit?usp=sharing)

## Overview 
This is a project management system that allows scheduling and task management of dependent tasks across multi-phase projects. 
The system predicts project and task completion timeline, by factoring in the cascading effect of delays of predecessor tasks. 

## Navigation
The app has simple views to quantify and achieve task completion
- Secure Login: Secure authorization and authentication lifecycle including user login, logout, password reset and update pages.
- Project Summary: Provides a high-level view of the project, displaying key details like progress, deadlines, team members, task status summaries. 
Includes visual elements like charts and task breakdowns for quick insights and efficient project tracking and completion prediction. 
- My Tasks: Displays tasks to be completed with status, priority, and due date. 
Tasks are displayed as cards, organized into Due Today, Upcoming, and Delayed sections.
- Task List: Displays tasks with statuses, priorities, assignees, due dates, and dependencies, enabling clear tracking and real-time updates.
- Project Schedule: Graph to visually map out tasks, timelines, dependencies, and progress, providing a clear overview of project flow and scheduling, allowing tracking of delays and bottlenecks.
- Overview: Unified chart displaying overview of all projects, broken downs by each individual task and its status. This overview allows for very high-level management across entire system.

## Interactions
- Add, edit and delete tasks to a project.
- Add, edit and delete dependency to a task that will reschedule task and its dependencies to be required following pointing tasks completion.
- At a minimum define task completion time in days.
- Assign a task to multiple users.
- Pin a task to not start or end before a specific date. 
- View gantt chart of task schedule and dependencies mapping.

## Stack
Front-end: 
- React JavaScript (Vite)
- [shadcn/ui](https://github.com/shadcn-ui/) (Based on [Radix UI](https://www.radix-ui.com/))
- [Tailwind CSS](https://tailwindcss.com/)

Backend:
- Flask (Python)
- SQLAlchemy (Database ORM)
- Alembic (Database migrations)

Database:
- PostgreSQL

## Installation 
1. Fork and clone the this repo to your local machine.
2. Install npm dependencies for front-end
```
npm install --prefix client
```
3. Create React build
```
npm run build --prefix client
```
4. Install pip dependencies for back-end
```bash
pip install 
```
5. Launch pip shell and change into /server directory
```
pip shell
cd server
```
6. Launch WSGI server
```
gunicorn app:app
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.