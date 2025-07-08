import { useParams } from "react-router"
import { useNavigate } from "react-router";
import { useEffect, useState, useContext } from 'react'
import { stringToDate, formatDatePretty, formatDatePrettyMMDD } from '@/utils/date.js'
import { getTaskStatus } from '@/utils/task.js'

import UserContext from '@/context/UserContext.jsx'
import ActiveProjectContext from '@/context/ActiveProjectContext.jsx'
import AppWrapper from '@/components/AppWrapper.jsx'
import ProgressBar from './ProgressBar.jsx'
import { useUpdateUser } from '@/hooks/useUpdateUser.jsx'

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator";
import {
  ThumbsUp,
  ThumbsDown,
  Check,
  PencilRuler,
  Activity,
  BadgeAlert,
  SquareCheckBig,
  Circle,
  Clock
} from "lucide-react";

// https://npm.runkit.com/react-data-table-component
// https://react-data-table-component.netlify.app/?path=/docs/api-custom-conditional-formatting--docs
import DataTable from 'react-data-table-component';
import LoadingWrapper from "@/components/LoadingWrapper.jsx"
import { map } from "zod"

const ProjectDetailsById = () => {

    const updateUser = useUpdateUser()
    const navigate = useNavigate()

    let params = useParams()
    const projectId = params.projectId

    const {user, setUser} = useContext(UserContext);
    const [projectObj, setProjectObj] = useState()
    const [projectMasterTasklist, setProjectMasterTasklist] = useState([])
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchProject()
        fetchProjectMasterTasklist()
    }, [projectId])

    // const loadProject = () => {
    //   //user.selectedProject
    //   const filterResults = projects.filter(project => project.id == projectId)
    //   if (filterResults.length > 0){
        
    //     const project = filterResults[0]
        
    //     // set local state
    //     setProjectObj(project)

    //     // save change to user profile in context
    //     // updateUser({selectedProject: project.id})
    //     setError(null)

    //   } else {
    //     setError("No project found")
    //   }
    // }

    const fetchProject = () => {
        //console.log("fetching project from backend")

        fetch('/api/projects/'+projectId)
        .then(res => {
            if(res.ok){
                res.json()
                .then(data => {
                    //manually convert top-level date strings to JS Date objects
                    //data.start = stringToDate(data.start)
                    //data.end = stringToDate(data.end)

                    //convert week stats
                    //data.stats.week.range_start = stringToDate(data.stats.week.range_start)
                    //data.stats.week.range_end = stringToDate(data.stats.week.range_end)

                    // set local state
                    setProjectObj(data)

                    // save change to user profile in context
                    updateUser({selectedProject: data.id})
                })
            } else {
                //console.log("project not found")
                //throw new Error(res.status);
                setError("Unable to load the project specified.")
            }
        })
    }
    //console.log("ProjectObj: ",projectObj)

    const fetchProjectMasterTasklist = () => {
      //console.log("fetching project master tasklist from backend")
      fetch('/api/mastertasks?project_id='+projectId+'&todo_list=true')
      .then(res => {
          if(res.ok){
              res.json()
              .then(data => {
                //console.log(data)
                const ordered_data = data.map((element, index) => {
                  const task = {...element[index]}
                  task.order=index+1
                  return task
                })
                setProjectMasterTasklist(ordered_data)
              })
          } else {
              setError("Unable to load the project master tasklist specified.")
          }
      })
    }
    //console.log("ProjectMasterTasklist: ",projectMasterTasklist)
    
    if(error){
      return (<AppWrapper><p>{error}</p></AppWrapper>)
    }
    if(!projectObj){
      return (<AppWrapper><LoadingWrapper /></AppWrapper>)
    }

    const projectStats = [
      {group: "project", label: "Completed", color: "green", total: projectObj.stats.counts.count_completed},
      {group: "project", label: "In Progress", color: "yellow", total: "N/A"},
      {group: "project", label: "Overdue", color: "red", total: projectObj.stats.counts.count_overdue},
      {group: "week", label: "Scheduled", color: "#3a82a1", total: projectObj.stats.week.count_scheduled},
      {group: "week", label: "Scheduled & Completed", color: "#3a82a1", total: projectObj.stats.week.count_scheduled_completed},
      {group: "week", label: "Total Tasks Completed", color: "#3a82a1", total: projectObj.stats.week.count_completed}
    ]

    const projectStatsGroups = [
      {name: "project", label: "Progress"},
      {name: "week", label: "Week Stats ("+formatDatePrettyMMDD(stringToDate(projectObj.stats.week.range_start))+"-"+formatDatePrettyMMDD(stringToDate(projectObj.stats.week.range_end))+")"}
    ]

    const progressStatus = {
      "planning": {
        label: "Planning Stage", 
        icon: <PencilRuler />
      },
      "in_progress": {
        label: "In Progress", 
        icon: <Activity />
      },
      "on_schedule": {
        label: "On schedule", 
        icon: <ThumbsUp />
      },
      "delayed": {
        label: "Delayed", 
        icon: <BadgeAlert />
      },
      "completed": {
        label: "Completed", 
        icon: <SquareCheckBig />
      },
    }

    const columns = [
      {
        name: 'Task',
        selector: row => row.name,
      },
      {
        name: 'Group',
        selector: row => row.group.name,
      },
      {
        name: 'Order',
        selector: row => row.order,
      },
      {
        name: '',
        selector: row => <Button variant="light" onClick={()=>navigate('/mastertask/'+row.id)}>View</Button>,
      },
      // {
      //   name: 'Pinned Start',
      //   selector: row => formatDatePretty(stringToDate(row.pin_start)),
      // },
      // {
      //   name: 'Pinned End',
      //   selector: row => formatDatePretty(stringToDate(row.pin_end)),
      //   //className: (row) => ({ backgroundColor: row.complete_status ? 'pink' : '' })
      // },
      // {
      //   name: 'Status',
      //   selector: row => getTaskStatus(row),
      // },
    ];

    return (
        <AppWrapper>
          {/* <div className="container mx-auto p-6"> */}
          <section className="py-32">
            <div className="container px-0 md:px-8">
              
              <h1 className="mb-10 px-4 text-3xl font-semibold md:mb-14 md:text-4xl">
                {projectObj.name}
              </h1>
              
              <Separator />
              
              <div className="flex flex-col">

                <div className="grid items-center gap-4 px-4 py-5 md:grid-cols-4">
                  <p className="order-1 text-2xl font-semibold md:order-none md:col-span-2">
                    Project Status
                  </p>
                  <div className="order-2 flex items-center gap-2 md:order-none">
                    <span className="flex h-14 w-16 shrink-0 items-center justify-center rounded-md bg-muted">
                      {/* <ThumbsUp /> */}
                      {progressStatus[projectObj.stats.status]['icon'] ?? <Wrench className="size-5 shrink-0" />}
                    </span>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-semibold">{progressStatus[projectObj.stats.status]['label']}</h3>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid items-center gap-4 px-4 py-5 md:grid-cols-4">
                  <p className="order-1 text-2xl font-semibold md:order-none md:col-span-2">
                    Anticipated Schedule
                  </p>
                  <div className="order-2 flex items-center gap-2 md:order-none">
                    <span className="flex h-14 w-16 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Clock />
                    </span>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-semibold">{formatDatePretty(stringToDate(projectObj.schedule.project_start))} - {formatDatePretty(stringToDate(projectObj.schedule.project_end))}</h3>
                      <h3 className="font-semibold text-muted-foreground">{projectObj.schedule.project_days} days</h3>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid items-center gap-4 px-4 py-5">
                  <p className="text-2xl font-semibold">
                    Completion
                  </p>
                  
                  <div className="md:flex md:grid-cols-3">
                      <div className="flex flex-col gap-1">
                        <ProgressBar progress={projectObj.stats.completion.percent} />
                      </div>


                      {projectStatsGroups.map(group => {

                        return (
                          <div key={group.name} className="flex gap-2 py-4 md:py-0">
                            <div className="flex flex-col gap-1">
                              <h3 className="font-semibold">{group.label}</h3>
                              
                              {projectStats.filter(stat => stat.group == group.name).map(stat => {
                              
                              return (
                                <div key={stat.label} className="grid gap-4 px-4 py-2 grid-cols-4">
                                  <div className="gap-x-2 col-span-1">
                                    <p className="text-sm text-muted-foreground">
                                      <Circle fill={stat.color} color={stat.color} />
                                    </p>
                                  </div>

                                  <div className="gap-x-2 text-left col-span-2">
                                    <p className="text-sm text-muted-foreground">
                                      {stat.label}
                                    </p>
                                  </div>

                                  <div className="gap-x-2 text-right col-span-1">
                                  <p className="text-sm text-muted-foreground">
                                    {stat.total}
                                  </p>
                                  </div>
                                </div>
                                )
                              })}

                            </div>
                          </div>
                        )
                      })}

                  </div>
                </div>

                <Separator />
                  
                <DataTable
                  columns={columns}
                  data={projectMasterTasklist}
                />

                <Separator />

              </div>
            </div>
          </section>
        </AppWrapper>
    )
}
export default ProjectDetailsById