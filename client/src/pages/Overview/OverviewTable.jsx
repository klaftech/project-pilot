import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useContext } from 'react'
import { taskBuilder, getTaskStatus, getReadableTaskStatus } from '@/utils/task.js';
import { getReadableUpdateStatus } from '@/utils/status_update.js'
import { stringToDate, getPreviousMonday } from '@/utils/date';
import LoadingWrapper from "@/components/LoadingWrapper"
import UserContext from '@/context/UserContext.jsx'

function OverviewTable() {
    const [project, setProject] = useState(null)
    const [error, setError] = useState(null)
    const {user, setUser} = useContext(UserContext);

    useEffect(() => {
        fetchProjectReport()
    }, [])

    const fetchProjectReport = () => {
        fetch('/api/projects/'+user.selectedProject+'/report')
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
                    setProject(data)
                })
            } else {
                console.log("unable to load projects data")
                //throw new Error(res.status);
                setError("Unable to load projects data.")
            }
        })
    }

    if(error){
        return (
            {error}
        )
    }

    if(!project && !error){
        return (
            <>
                Building your report...
                <LoadingWrapper />
            </>
        )
    }

    // get max amount of tasks from all units for determining amount of columns
    let max_tasks = 0
    if(project){
        max_tasks = project.master_tasks.length
    }
    // if(project.length > 0 && project.units.length > 0){
    //     max_tasks = project.units.reduce((accumulator, currentValue) => {
    //         // alternatively, can get using currentValue.stats.counts.count_tasks
    //         return accumulator > currentValue.unit_tasks.length ? accumulator : currentValue.unit_tasks.length
    //     }, 0)
    // }

    return (
        <TableContainer component={Paper}>
            <Table className="min-w-full">
                <TableHead>
                    <TableRow>
                        <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</TableCell>
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
                    {project && project.units.length <= 0 && (<TableRow><TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">No Units Found</TableCell></TableRow>)}
                    {project && project.units.length > 0 && project.units.map((unit) => {
                        const task_count = unit.unit_tasks.length
                        const placeholders_to_add = max_tasks-task_count
                        return (
                            <TableRow key={unit.id}>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{unit.name}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">{getReadableTaskStatus(unit.stats.status)}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{unit.stats.completion_percent}%</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{unit.stats.counts.count_completed}/{unit.stats.counts.count_tasks}</TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{unit.stats.week.count_scheduled_completed}/{unit.stats.week.count_scheduled}</TableCell>
                                {unit.unit_tasks.map((raw_task) => {
                                    const task = taskBuilder(raw_task)
                                    const task_status = getTaskStatus(task)
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
                                    
                                    // if most recent StatusUpdate is since previous monday, show on report
                                    let status_update_badge = ''
                                    if(raw_task.latest_update != null){
                                        if(stringToDate(raw_task.latest_update.timestamp) > getPreviousMonday()){
                                            const latest_update_status = raw_task.latest_update.status
                                            let update_status_background = ""
                                            if(latest_update_status == 200){
                                                update_status_background = "bg-green-500"
                                            } else if(latest_update_status == 400){
                                                update_status_background = "bg-red-500"
                                            } else {
                                                update_status_background = "bg-blue-500"
                                            }
                                            status_update_badge = <>&nbsp;<Badge className={"text-grey-500 "+update_status_background}>{getReadableUpdateStatus(latest_update_status)}</Badge></>
                                        }
                                    }
                                    return <TableCell key={task.id} className={"px-6 py-4 whitespace-nowrap text-sm text-grey-500 "+status_background}>{task.name}{status_update_badge}</TableCell>
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