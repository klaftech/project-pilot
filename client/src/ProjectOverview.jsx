import { useParams } from "react-router"
import { useEffect, useState, useContext } from 'react'
import { stringToDate } from './helpers.js'

import { Separator } from "@/components/ui/separator";
import {
  ThumbsUp,
  ThumbsDown,
  Check,
  PencilRuler,
  Activity,
  BadgeAlert,
  SquareCheckBig,
  Circle
} from "lucide-react";

import Navbar from './Navbar.jsx'
import ProjectContext from './context/ProjectContext.jsx'

import DataTable from 'react-data-table-component';

const ProjectOverview = () => {

    const projectObj = {
        "description": "Single-Family Home",
        "end": "2020-01-01 00:00:00",
        "groups": [
          {
            "id": 1,
            "name": "Site Prep",
            "project_id": 1
          },
          {
            "id": 2,
            "name": "Foundation",
            "project_id": 1
          }
        ],
        "id": 1,
        "name": "123 Main Street Building",
        "project_type": "house",
        "start": "2020-01-01 00:00:00",
        "stats": {
          "project": {
            "completion_percent": 16,
            "count_completed": 1,
            "count_overdue": 0,
            "count_tasks": 6,
            "count_upcoming": 4,
            "status": "on_schedule"
          },
          "week": {
            "count_completed": 1,
            "count_scheduled": 5,
            "count_scheduled_completed": 1
          }
        },
        "tasks": [
          {
            "complete_comment": "marked complete on app",
            "complete_date": "2025-02-08 00:00:00",
            "complete_status": true,
            "complete_user_id": 1,
            "days_length": 7,
            "group_id": 1,
            "id": 1,
            "name": "Sign Contract",
            "pin_end": "2025-02-07 00:00:00",
            "pin_honored": true,
            "pin_start": "2025-02-07 00:00:00",
            "plan_end": "2025-02-07 00:00:00",
            "plan_start": "2025-02-07 00:00:00",
            "progress": 0,
            "project_id": 1,
            "sched_end": "2025-02-14 00:00:00",
            "sched_start": "2025-02-07 00:00:00"
          },
          {
            "complete_comment": null,
            "complete_date": null,
            "complete_status": false,
            "complete_user_id": null,
            "days_length": 30,
            "group_id": 1,
            "id": 2,
            "name": "Site Work",
            "pin_end": "2025-02-07 00:00:00",
            "pin_honored": true,
            "pin_start": "2026-01-01 00:00:00",
            "plan_end": "2025-02-07 00:00:00",
            "plan_start": "2025-02-07 00:00:00",
            "progress": 0,
            "project_id": 1,
            "sched_end": "2026-01-31 00:00:00",
            "sched_start": "2026-01-01 00:00:00"
          },
          {
            "complete_comment": null,
            "complete_date": null,
            "complete_status": false,
            "complete_user_id": null,
            "days_length": 14,
            "group_id": 1,
            "id": 3,
            "name": "Level Site",
            "pin_end": "2025-02-07 00:00:00",
            "pin_honored": true,
            "pin_start": "2025-02-07 00:00:00",
            "plan_end": "2025-02-07 00:00:00",
            "plan_start": "2025-02-07 00:00:00",
            "progress": 0,
            "project_id": 1,
            "sched_end": "2025-02-21 00:00:00",
            "sched_start": "2025-02-07 00:00:00"
          },
          {
            "complete_comment": null,
            "complete_date": null,
            "complete_status": false,
            "complete_user_id": null,
            "days_length": 14,
            "group_id": 1,
            "id": 4,
            "name": "Foundation",
            "pin_end": "2025-02-07 00:00:00",
            "pin_honored": true,
            "pin_start": "2025-02-07 00:00:00",
            "plan_end": "2025-02-07 00:00:00",
            "plan_start": "2025-02-07 00:00:00",
            "progress": 0,
            "project_id": 1,
            "sched_end": "2025-02-21 00:00:00",
            "sched_start": "2025-02-07 00:00:00"
          },
          {
            "complete_comment": null,
            "complete_date": null,
            "complete_status": false,
            "complete_user_id": null,
            "days_length": 3,
            "group_id": 1,
            "id": 5,
            "name": "Survey",
            "pin_end": "2025-02-07 00:00:00",
            "pin_honored": true,
            "pin_start": "2025-02-07 00:00:00",
            "plan_end": "2025-02-07 00:00:00",
            "plan_start": "2025-02-07 00:00:00",
            "progress": 0,
            "project_id": 1,
            "sched_end": "2025-02-10 00:00:00",
            "sched_start": "2025-02-07 00:00:00"
          },
          {
            "complete_comment": null,
            "complete_date": null,
            "complete_status": false,
            "complete_user_id": null,
            "days_length": 7,
            "group_id": 1,
            "id": 6,
            "name": "Apply for Permits",
            "pin_end": "2025-02-07 00:00:00",
            "pin_honored": true,
            "pin_start": "2025-02-07 00:00:00",
            "plan_end": "2025-02-07 00:00:00",
            "plan_start": "2025-02-07 00:00:00",
            "progress": 0,
            "project_id": 1,
            "sched_end": "2025-02-14 00:00:00",
            "sched_start": "2025-02-07 00:00:00"
          }
        ]
      }

    const columns = [
        {
            name: 'Task',
            selector: row => row.name,
        },
        {
            name: 'Scheduled Start',
            selector: row => row.sched_start,
        },
        {
          name: 'Scheduled End',
          selector: row => row.sched_end,
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
    ];
    
    const data = [
          {
            id: 1,
            title: 'Beetlejuice',
            year: '1988',
        },
        {
            id: 2,
            title: 'Ghostbusters',
            year: '1984',
        },
    ]

    return (
        <>
            <Navbar />

            {/* <div className="container mx-auto p-6"> */}
            <section className="py-32">
                <div className="container px-0 md:px-8">
                    
                    <DataTable
                        columns={columns}
                        data={projectObj.tasks}
                    />

                </div>
            </section>
        </>
    )
}
export default ProjectOverview