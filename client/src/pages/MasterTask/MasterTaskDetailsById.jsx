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
import AppWrapper from '@/components/AppWrapper.jsx'
import LoadingWrapper from "@/components/LoadingWrapper.jsx"
//import { useManageTasks } from '@/hooks/useManageTasks'

function MasterTaskDetailsById() {
    
    //const { tasks, isLoaded, updateTask, reloadTasks } = useManageTasks()
    const updateTask = ()=>console.log("updateTask coming soon")
    const reloadTasks = ()=>console.log("reloadTasks coming soon")

    let params = useParams()
    //params.taskId
    //console.log(params)
    const taskId = params.taskId

    const [masterTaskObj, setMasterTaskObj] = useState()
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchTask()
    }, [])

    const fetchTask = () => {
        console.log("fetching individual task from backend")

        fetch('/api/mastertasks/'+taskId)
        .then(res => {
            if(res.ok){
                res.json()
                .then(data => {
                    //console.log("data received. converting dates and updating state")
                    setMasterTaskObj(handleObjChanges(data))
                })
            } else {
                //console.log("task not found")
                //throw new Error(res.status);
                setError("Unable to load the task specified.")
            }
        })
    }
    console.log("masterTaskObj: ", masterTaskObj)

    const handleObjChanges = (data) => {
        //manually convert top-level date strings to JS Date objects
        data.sched_start = stringToDate(data.sched_start)
        data.sched_end = stringToDate(data.sched_end)
        data.pin_start = stringToDate(data.pin_start)
        data.pin_end = stringToDate(data.pin_end)
        data.plan_start = stringToDate(data.plan_start)
        data.plan_end = stringToDate(data.plan_end)
        return data
    }

    const handleReloadTaskObj = () => {
        //fetchTask()
        console.log("fetchTask() request ignored, reloading on handleTaskUpdate")
    }

    const handleTaskUpdate = (data) => {
        //data is response to master task patch request
        setMasterTaskObj(handleObjChanges(data))
    }

    if(!masterTaskObj){
        return ( 
            <AppWrapper><LoadingWrapper /></AppWrapper>
        )
    }

    return (
        <AppWrapper>
            <div className="flex justify-center items-center">
                <Tabs defaultValue="details" className="w-[400px]">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                    {/* <TabsTrigger value="password">Password</TabsTrigger> */}
                </TabsList>
                {error}
                {!masterTaskObj && <p>Building task details and dependencies...</p>}
                <TabsContent value="details">
                    {!error && masterTaskObj && <DetailsCardForm taskObj={masterTaskObj} pushUpdateTask={handleTaskUpdate} reloadTaskObj={handleReloadTaskObj} />}
                </TabsContent>
                <TabsContent value="dependencies">
                    {!error && masterTaskObj && <DetailsCardDependencies taskObj={masterTaskObj} reloadTasks={reloadTasks} />}
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
        </AppWrapper>
    )
}
export default MasterTaskDetailsById