import { useParams } from "react-router"
import { useEffect, useState, useContext } from 'react'
import { formatDatePretty, isDate } from './helpers.js'

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
import OverviewSimpleTable from './OverviewSimpleTable'

const ProjectOverview = ({ tasks }) => {
    console.log(tasks)
    const columns = [
        {
            name: 'Task',
            selector: row => row.name,
        },
        {
            name: 'Scheduled Start',
            selector: row => isDate(row.start) ? formatDatePretty(row.start) : "no",
        },
        {
          name: 'Scheduled End',
          selector: row => row.end[0],
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
        {
          name: 'Status',
          selector: row => row.complete_status ? "Completed" : "Scheduled",
        },
    ];

    const simple_table_data = [
      { id: 1, name: 'Item 1', value: 10 },
      { id: 2, name: 'Item 2', value: 20 },
      { id: 3, name: 'Item 3', value: 30 },
    ];
  
  

    return (
        <>
            <Navbar />
            <OverviewSimpleTable data={simple_table_data} />
            {/* <div className="container mx-auto p-6"> */}
            {/* <section className="py-32">
                <div className="container px-0 md:px-8"> */}
                    
                    <DataTable
                        columns={columns}
                        data={tasks}
                    />

                {/* </div>
            </section> */}
        </>
    )
}
export default ProjectOverview