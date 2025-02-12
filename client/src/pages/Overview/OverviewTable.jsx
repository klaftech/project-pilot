import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from 'react'
import { taskBuilder, getTaskStatus } from '../../utils/task.js';

function OverviewTable() {
    const [projects, setProjects] = useState([])

    useEffect(() => {
        fetchProjects()
    }, [])

    const fetchProjects = () => {
        fetch('/api/projects')
        .then(res => {
            if(res.ok){
                res.json()
                .then(data => {
                    //manually convert top-level date strings to JS Date objects
                    // data.start = stringToDate(data.start)
                    // data.end = stringToDate(data.end)

                    // //convert week stats
                    // data.stats.week.range_start = stringToDate(data.stats.week.range_start)
                    // data.stats.week.range_end = stringToDate(data.stats.week.range_end)

                    // set local state
                    setProjects(data)
                })
            } else {
                //console.log("unable to load projects data")
                //throw new Error(res.status);
                setError("Unable to load projects data.")
            }
        })
    }

    if(!projects){
        return <h2>Projects Loading</h2>
    }

    // get max amount of tasks of all projects for determining amount of columns
    let max_tasks = 0
    if(projects.length > 0){
        max_tasks = projects.reduce((accumulator, currentValue) => {
            return accumulator > currentValue.tasks.length ? accumulator : currentValue.tasks.length
        }, 0)
    }

    return (
        <TableContainer component={Paper}>
            <Table className="min-w-full">
                <TableHead>
                    <TableRow>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">%</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</TableCell>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week Stats</TableCell>
                        <TableCell colSpan={max_tasks} className="px-6 py-3 bg-grey-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tasks &nbsp;
                            <Badge className="bg-green-200 text-grey-50">Completed</Badge>&nbsp;
                            <Badge className="bg-red-200 text-grey-50">Delayed</Badge>&nbsp;
                            <Badge className="bg-blue-200 text-grey-50">In Progress</Badge>&nbsp;
                            <Badge className="bg-yellow-200 text-grey-50">Scheduled</Badge>&nbsp;
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {projects.map((project) => {
                        const task_count = project.tasks.length
                        const placeholders_to_add = max_tasks-task_count
                        return (
                            <TableRow key={project.id}>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.name}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.stats.project.status}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.stats.project.completion_percent}%</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.stats.project.count_completed}/{project.stats.project.count_tasks}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.stats.week.count_scheduled_completed}/{project.stats.week.count_scheduled}</TableCell>
                                {project.tasks.map((task) => {
                                    
                                    const task_status = getTaskStatus(taskBuilder(task))
                                    let status_background = ""
                                    if(task_status == "completed"){
                                        status_background = "bg-green-200"
                                    } else if(task_status == "delayed"){
                                        status_background = "bg-red-200"
                                    } else if(task_status == "in_progress"){
                                        status_background = "bg-blue-200"
                                    } else if(task_status == "scheduled"){
                                        status_background = "bg-yellow-200"
                                    }
                                    return <TableCell key={task.id} className={"px-6 py-4 whitespace-nowrap text-sm text-grey-500 "+status_background}>{task.name}</TableCell>
                                })}
                                {placeholders_to_add > 0 ? 
                                    <TableCell colSpan={placeholders_to_add} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"></TableCell>
                                : ''
                                }
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default OverviewTable;