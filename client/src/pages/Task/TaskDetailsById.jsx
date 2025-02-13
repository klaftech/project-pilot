import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import { useParams } from "react-router"
import { taskBuilder } from '@/utils/task.js'
import { stringToDate } from '@/utils/date.js'
import { useEffect, useState } from 'react'

import DetailsCardDependencies from "./DetailsCardDependencies.jsx"
import DetailsCardForm from './DetailsCardForm.jsx'
import Navbar from '@/components/Navbar.jsx'
import LoadingWrapper from "@/components/LoadingWrapper.jsx"

function TaskDetailsById({tasks, pushUpdateTask, reloadTasks}) {
    let params = useParams()
    //params.taskId
    //console.log(params)
    const taskId = params.taskId

    const [taskObj, setTaskObj] = useState()
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchTask()
    }, [])

    const fetchTask = () => {
        console.log("fetching individual task from backend")

        fetch('/api/tasks/'+taskId)
        .then(res => {
            if(res.ok){
                res.json()
                .then(data => {
                    //console.log("data received. converting dates and updating state")
                    //manually convert top-level date strings to JS Date objects
                    data.sched_start = stringToDate(data.sched_start)
                    data.sched_end = stringToDate(data.sched_end)
                    data.pin_start = stringToDate(data.pin_start)
                    data.pin_end = stringToDate(data.pin_end)
                    data.plan_start = stringToDate(data.plan_start)
                    data.plan_end = stringToDate(data.plan_end)
                    setTaskObj(data)
                    //const new_task = {...taskBuilder(data)}
                    //console.log(new_task)
                })
            } else {
                //console.log("task not found")
                //throw new Error(res.status);
                setError("Unable to load the task specified.")
            }
        })
    }
    //console.log("TaskObj: ",taskObj)

    const handleReloadTaskObj = () => {
        fetchTask()
    }

    if(!taskObj){
        return ( 
            <LoadingWrapper />
        )
    }

    return (
        <>  
            {/* <Navbar /> */}
            <div className="flex justify-center items-center">
                <Tabs defaultValue="details" className="w-[400px]">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                    {/* <TabsTrigger value="password">Password</TabsTrigger> */}
                </TabsList>
                {error}
                {!taskObj && <p>Building task details and dependencies...</p>}
                <TabsContent value="details">
                    {!error && taskObj && <DetailsCardForm taskObj={taskObj} pushUpdateTask={pushUpdateTask} reloadTaskObj={handleReloadTaskObj} />}
                </TabsContent>
                <TabsContent value="dependencies">
                    {!error && taskObj && <DetailsCardDependencies tasks={tasks} taskObj={taskObj} pushUpdateTask={pushUpdateTask} reloadTasks={reloadTasks} />}
                </TabsContent>
                
                {/*
                <TabsContent value="password">
                    <Card>
                    <CardHeader>
                        <CardTitle>Password</CardTitle>
                        <CardDescription>
                        Change your password here. After saving, you'll be logged out.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="space-y-1">
                        <Label htmlFor="current">Current password</Label>
                        <Input id="current" type="password" />
                        </div>
                        <div className="space-y-1">
                        <Label htmlFor="new">New password</Label>
                        <Input id="new" type="password" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button>Save password</Button>
                    </CardFooter>
                    </Card>
                </TabsContent>
                */}

                </Tabs>
            </div>
        </>
        
    )
}
export default TaskDetailsById