import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Badge } from "@/components/ui/badge"
import { TriangleAlert } from 'lucide-react';
import { useState, useEffect, useContext } from 'react'
import { taskBuilder, getTaskStatus } from '@/utils/task.js';
import { getReadableStatus} from '@/utils/status_codes.js'
import { stringToDate, getNextMonday, getPreviousPreviousMonday, isDate, formatDatePretty, getDaysDiff, getToday } from '@/utils/date';
import LoadingWrapper from "@/components/LoadingWrapper"
import UserContext from '@/context/UserContext.jsx'
import ProjectsContext from '@/context/ProjectsContext';
import { toast } from "sonner"

function OverviewTable() {
    const [project, setProject] = useState(null)
    const [projectLoaded, setProjectLoaded] = useState(false)
    const [projectMasterTasklist, setProjectMasterTasklist] = useState([])
    const [projectMasterTasklistLoaded, setProjectMasterTasklistLoaded] = useState(false)
    const [unitStatsLoaded, setUnitStatsLoaded] = useState(false)
    const [error, setError] = useState(null)
    const {user, setUser} = useContext(UserContext);
    
    useEffect(() => {
        fetchProject()
        fetchProjectMasterTasklist()
    }, [!project])

    //only fetch unittasks upon initial projectLoaded
    useEffect(() => {
        fetchUnitDetails()
    }, [projectLoaded])
    
    const handleRequestError = (resource, action) => {
        //build error codes
        let errorCode = "ER-"
        if(action == "fetch"){
            errorCode += "FETCH"
        }else if(action == "parse"){
            errorCode += "PARSE"
        }else if(action == "http"){
            errorCode += "HTTP"
        }

        if(resource == "project"){
            errorCode += "100"
        }else if(resource == "mastertasks"){
            errorCode += "110"
        }else if(resource == "units"){
            errorCode += "120"
        }else if(resource == "stats"){
            errorCode += "130"
        }else{
            errorCode += "500"
        }

        toast(errorCode + ". Failed to load data. Please check your internet connection or filter settings.")

        if(resource == "project" || resource == "mastertasks"){
            setError("Failed to load data. Please check your internet connection or filter settings.")
        }
    }

    const handleFetch = (resource, url, callback) => {
        fetch(url)
        .then(res => {
            if(res.ok){
                res.json()
                .then(data => {
                    callback(data)
                }, error => handleRequestError(resource, "parse"))
            } else {
                handleRequestError(resource, "fetch")
                //console.log("unable to load " + resource + " data")
                //throw new Error(res.status);
            }
        }, error => handleRequestError(resource, "http"))
    }

    /*
    //count units missing stats, set unitStatsLoaded when reaches 0
    useEffect(() => {
        if(project && !unitStatsLoaded){
            //check if fully loaded
            const noStatsCount = project.units.filter(unit => !Object.hasOwn(unit, 'stats'))
            if(noStatsCount == 0){
                console.log("stats fully loaded")
                //run sort
                setUnitStatsLoaded(true)
                resortUnits()
            }
        }
    }, [project])

    // used to resort units in state, however was simpler to just sort following data fetch
    const resortUnits = () => {
        //resort
        console.log("resort fired")
        
        //deep copy the array from state
        const tempUnits = JSON.parse(JSON.stringify(project.units));
        console.log(tempUnits)

        // sort units by completion percentage
        const sortedUnits = tempUnits.sort((a,b) => {
            // 1 = a goes after b
            // -1 = b goes after a
            if(!Object.hasOwn(a, 'stats')){
                return 1
            } else if (!Object.hasOwn(b, 'stats')){
                return -1
            } else {
                return b.stats['completion']['percent'] - a.stats['completion']['percent']
            }
        })
        
        console.log(sortedUnits)
        const newProject = {
            ...project,
            units: sortedUnits
        }
        
        setProject(newProject)
    }
    */

        
    const fetchUnitDetails = () => {
        
        const pushUnitDetails = (id, value, data) => {
            //save data to corresponding id we have in state
            //console.log(id, data)

            const shallowProject = {...project}
            
            shallowProject.units.map((unit) => {
                if(unit.id == id){
                    if(value=="tasks"){
                        unit.tasks = data
                    }
                    if(value=="stats"){
                        unit.stats = data.stats
                    }
                }
            })
                 
            // sort units by completion percentage
            shallowProject.units.sort((a,b) => {
                // 1 = a goes after b
                // -1 = b goes after a
                if(!Object.hasOwn(a, 'stats')){
                    return 1
                } else if (!Object.hasOwn(b, 'stats')){
                    return -1
                } else {
                    return b.stats['completion']['percent'] - a.stats['completion']['percent']
                }
            })
            
            //tempProject.units.filter((unit) => Object.hasOwn(unit, 'stats')).sort((a,b) => b.stats['completion']['percent'] - a.stats['completion']['percent'])
            //tempProject.units.sort((a,b) => b.stats['completion']['percent'] - a.stats['completion']['percent'])
            //tempUnits.filter(unit => Object.hasOwn(unit, 'stats'))

            setProject(shallowProject)
        }

        /*
        // the problem with this version is that the function is fired too quickly for each unit for state updates to handle
        // alternatively, attempted to run sort on state following stats load completion.
        const pushUnitDetails2 = (id, value, data) => {
            //save data to corresponding id we have in state
            //console.log(id, data)

            //deep copy the array from state
            const tempUnits = JSON.parse(JSON.stringify(project.units));
            
            tempUnits.map(unit => {
                if(unit.id == id){
                    if(value=="tasks"){
                        unit.tasks = data
                    }
                    if(value=="stats"){
                        unit.stats = data.stats
                    }
                }
                return unit
            })
            console.log(tempUnits)

            // sort units by completion percentage
            const sortedUnits = tempUnits.sort((a,b) => {
                // 1 = a goes after b
                // -1 = b goes after a
                if(!Object.hasOwn(a, 'stats')){
                    return 1
                } else if (!Object.hasOwn(b, 'stats')){
                    return -1
                } else {
                    return b.stats['completion']['percent'] - a.stats['completion']['percent']
                }
            })
            
            //tempProject.units.filter((unit) => Object.hasOwn(unit, 'stats')).sort((a,b) => b.stats['completion']['percent'] - a.stats['completion']['percent'])
            //tempProject.units.sort((a,b) => b.stats['completion']['percent'] - a.stats['completion']['percent'])
            //tempUnits.filter(unit => Object.hasOwn(unit, 'stats'))
            
            const newProject = {
                ...project,
                units: tempUnits
            }
            
            //console.log(newProject)
            setProject(newProject)
        }
        */

        const getUnitTasks = (unit_id) => {
            handleFetch(
                "units", 
                '/api/unittasks?unit_id=' + unit_id, 
                (data) => {
                    pushUnitDetails(unit_id, "tasks", data)
                }
            )
        }

        const getUnitStats = (unit_id) => {
            handleFetch(
                "stats", 
                '/api/units/' + unit_id + '/stats', 
                (data) => {
                    pushUnitDetails(unit_id, "stats", data)
                }
            )
        }

        if(project){
            //const unit = project.units[10]
            //getUnitStats(unit.id)
            
            project.units.map((unit) => {
                //for each unit.id, fetch unit details from api and add to state array  
                getUnitTasks(unit.id)
                getUnitStats(unit.id)
            })
        }
    }
    
    const handleProjectResponse = (data) => {
        setProject(data)
        setProjectLoaded(true)
    }

    const fetchProject = () => {
        handleFetch(
            "project", 
            '/api/projects/' + user.selectedProject + '?include_stats=false', 
            (data) => {
                handleProjectResponse(data)
            }
        )
    }

    const fetchProjectMasterTasklist = () => {
        handleFetch(
            "mastertasks", 
            '/api/mastertasks?project_id='+user.selectedProject, 
            (data) => {
                const ordered_data = data.map((element, index) => {
                    const task = {...element[index]}
                    task.order=index+1
                    return task
                })
                //setProjectMasterTasklist(ordered_data)
                setProjectMasterTasklist(data)
                setProjectMasterTasklistLoaded(true)
            }
        )
    }

    /*
    const fetchProject_old = () => {
        fetch('/api/projects/' + user.selectedProject + '?include_stats=false')
        // .then(res => res.json(), error => console.error("fatch error"))
        // .then(data => {
        //     console.log(data)
        //     handleProjectResponse(data)
        // }, error => console.error("parse error"))
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
                    
                    // sort units by completion percentage
                    //data.units.sort((a,b) => b.stats['completion']['percent'] - a.stats['completion']['percent'])

                    // set local state
                    handleProjectResponse(data)
                }, error => handleRequestError("project","parse"))
            } else {
                handleRequestError("project","fetch")
                //console.log("unable to load projects data")
                //throw new Error(res.status);
                //setError("Unable to load projects data.")
            }
        }, error => handleRequestError("project","http"))
    }
    */

    //console.log("ProjectMasterTasklist: ",projectMasterTasklist)
    
    //console.log("Project: ", project)

    if(error){
        return (<><p>{error}</p></>)
    }
    if(!project && !error){
        return (
            <>
                Building your report...
                <LoadingWrapper />
            </>
        )
    }

    if(!projectMasterTasklistLoaded){
        return (<><p>Loading Task List...</p></>)
    }


    // get max amount of tasks from all units for determining amount of columns
    let max_tasks = 0
    if(projectMasterTasklistLoaded){
        max_tasks = projectMasterTasklist.length
    }
    /*
    if(project){
        max_tasks = project.master_tasks.length
    }
    */
    // if(project.length > 0 && project.units.length > 0){
    //     max_tasks = project.units.reduce((accumulator, currentValue) => {
    //         // alternatively, can get using currentValue.stats.counts.count_tasks
    //         return accumulator > currentValue.unit_tasks.length ? accumulator : currentValue.unit_tasks.length
    //     }, 0)
    // }

    return (
        <div className="scale-[0.8] origin-top-left w-[125%] h-[125%]">
            {/* 
                Visually scale screen to 80%, but fill entire screen.
                Use transform: scale(0.8) to shrink the content.
                Use a width of 125% to counteract the shrink (since 1 / 0.8 = 1.25).
                Use transform-origin: top left to anchor the shrink from the top-left.
            */}
            <TableContainer component={Paper} className="overflow-x-auto">
                <Table className="min-w-full">
                    <TableHead>
                        <TableRow>
                            <TableCell className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 left-0 z-30">Unit</TableCell>
                            <TableCell colSpan={3} className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</TableCell>
                            <TableCell colSpan={max_tasks} className="px-6 py-3 bg-grey-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tasks &nbsp;
                                <Badge className="bg-green-200 text-grey-50">Completed</Badge>&nbsp;
                                <Badge className="bg-blue-200 text-grey-50">In Progress</Badge>&nbsp;
                                <Badge className="bg-red-200 text-grey-50">Stuck</Badge>&nbsp;
                                <Badge className="bg-yellow-200 text-grey-50">Scheduled</Badge>&nbsp;
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {project && project.units.length <= 0 && (<TableRow><TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">No Units Found</TableCell></TableRow>)}
                        {project && project.units.length > 0 && project.units.map((unit) => {
                            //console.log(unit)
                            //const task_count = unit.unit_tasks.length
                            //const placeholders_to_add = max_tasks-task_count
                            const placeholders_to_add = max_tasks
                            return (
                                <TableRow key={unit.id}>
                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 z-10 bg-white">{unit.name}</TableCell>
                                    {/* <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">{unit.stats.status}</TableCell> */}
                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{Object.hasOwn(unit, 'stats') && unit.stats.completion.percent}%</TableCell>
                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{Object.hasOwn(unit, 'stats') && unit.stats.counts.count_completed}/{Object.hasOwn(unit, 'stats') && unit.stats.counts.count_tasks}</TableCell>
                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{Object.hasOwn(unit, 'stats') && unit.stats.completion.months} mo</TableCell>
                                    {/* <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{unit.stats.week.count_scheduled_completed}/{unit.stats.week.count_scheduled}</TableCell> */}

                                    {Object.hasOwn(unit, 'tasks') && unit.tasks.map((raw_task) => {
                                        //console.log(raw_task)
                                    /*{unit.unit_tasks.map((raw_task) => {*/
                                        /*
                                        // removed all schedule based logic 03/24/2025, instead simply show completed/in-progress/scheduled based on completion and latest_updates
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
                                                status_update_badge = <>&nbsp;<Badge className={"text-grey-500 "+update_status_background}>{getReadableStatus(latest_update_status)}</Badge></>
                                            }
                                        }
                                        */

                                        // version 2 - set background color based on current task status
                                        const task = taskBuilder(raw_task)
                                        
                                        //get background color for task cell
                                        //set task status as required for this script
                                        let status_background = ""
                                        let overview_task_status = "500"
                                        const taskStatusCode = task.status_code
                                        if(taskStatusCode === 200){
                                            //completed
                                            status_background = "bg-green-200"
                                            overview_task_status = "200"
                                        // } else if((raw_task.latest_update != null) && (raw_task.latest_update.status == 500)){
                                        //     //stuck. task is not completed and there is a status update 500
                                        //     status_background = "bg-red-200"
                                        //     overview_task_status = "500"
                                        } else if(taskStatusCode === 310){
                                            //pending. previous task is completed, but task not yet begun
                                            status_background = "bg-yellow-200"
                                            overview_task_status = "310"
                                        } else if(taskStatusCode === 311){
                                            //in progress. task is not completed, is not stuck and progress in more than 0
                                            status_background = "bg-blue-200"
                                            overview_task_status = "311"
                                        } else {
                                            //scheduled. task is not completed and there is no progress
                                            status_background = "" //"bg-yellow-200"
                                            overview_task_status = "300"
                                        }
                                        
                                        /*
                                        if(raw_task.status_code != 300){
                                            console.log(raw_task)
                                            console.log("stringToDate: " + stringToDate(raw_task.latest_update.timestamp))
                                            console.log("getPreviousPreviousMonday: " + getPreviousPreviousMonday())
                                        }
                                        */

                                        //display badge with latest status update
                                        // if most recent StatusUpdate is between previous-previous monday and next monday, show on report
                                        let status_update_badge = null
                                        if(raw_task.latest_update != null){
                                            if((stringToDate(raw_task.latest_update.timestamp) > getPreviousPreviousMonday()) && (stringToDate(raw_task.latest_update.timestamp) < getNextMonday())){
                                                const latest_update_status = raw_task.latest_update.status
                                                let update_status_background = ""
                                                if(latest_update_status == 200){
                                                    update_status_background = "bg-green-500"
                                                } else if(latest_update_status == 500){
                                                    update_status_background = "bg-red-500"
                                                } else {
                                                    update_status_background = "bg-blue-500"
                                                }
                                                status_update_badge = <>&nbsp;<Badge className={"text-grey-500 "+update_status_background}>{getReadableStatus(latest_update_status)}</Badge></>
                                            }
                                        } else {
                                            // if there is no status, check if start date is within expected update range = didnt require recent status update
                                            if(raw_task.started_status == true && stringToDate(raw_task.started_date) > getPreviousPreviousMonday()){
                                                status_update_badge = " "
                                            }
                                        }

                                        //display warning badge if missing status update
                                        //check that update was not missed. task is not completed or didn't start and there is not recent update.
                                        if(taskStatusCode !== 200 && taskStatusCode !== 300 && status_update_badge == null){
                                            
                                            status_update_badge = <>&nbsp;<Badge className={"text-grey-500 bg-red-500"}><TriangleAlert className="scale-75" /></Badge></>
                                        }

                                        //display badge displaying task days count. with progress or difference between started-completed dates
                                        let diff_badge = <>&nbsp;</>
                                        //if(task.started_status == true && isDate(task.started_date) && task.complete_status == true && isDate(task.complete_date)){
                                        if(task.started_status == true && isDate(task.started_date)){
                                            //if task is completed, display difference if took longer than predefined length
                                            let range_to
                                            if(task.complete_status == true && isDate(task.complete_date)){
                                                range_to = task.complete_date
                                            } else {
                                                range_to = getToday()
                                            }

                                            const days_diff = getDaysDiff(task.started_date, range_to)
                                            if(days_diff <= raw_task.master_task.days_length){
                                                diff_badge = <>&nbsp;<Badge className={"text-grey-500 bg-green-500"}>{days_diff} days</Badge></>
                                            } else {
                                                diff_badge = <>&nbsp;<Badge className={"text-grey-500 bg-red-500"}>{days_diff} days</Badge></>
                                            }
                                        }
                                        
                                        //display started, completed and badge
                                        let dates_report = ""
                                        dates_report = <div className="flex flex-col">
                                            <span className="text-black">{task.started_status == true && isDate(task.started_date) ? formatDatePretty(task.started_date) : <>&nbsp;</>}</span>
                                            <span className="text-black">{task.complete_status == true && isDate(task.complete_date) ? formatDatePretty(task.complete_date) : <>&nbsp;</>}</span>
                                            <span className="text-black">{diff_badge}</span>
                                        </div>

                                        return <TableCell key={task.id} className={"px-6 py-4 whitespace-nowrap text-sm text-grey-500 "+status_background}>{task.name}{status_update_badge}{dates_report}</TableCell>
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
        </div>
    );
}

export default OverviewTable;