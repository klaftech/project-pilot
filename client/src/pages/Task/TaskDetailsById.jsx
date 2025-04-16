import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import { useParams } from "react-router"
import { useEffect, useState } from 'react'

import { taskBuilder } from "@/utils/task.js"
import { useManageTasks } from "@/hooks/useManageTasks.jsx"
import AppWrapper from '@/components/AppWrapper.jsx'
import LoadingWrapper from "@/components/LoadingWrapper.jsx"
import DetailsCard from "./DetailsCard.jsx"
import UpdatesCardWrapper from "./UpdatesCardWrapper.jsx"

function TaskDetailsById() {
    let params = useParams()
    const taskId = params.taskId

    // // useManageTasks hook and filter by id instead of new fetch
    // const [error, setError] = useState(false)
    // let taskObj = {}
    // const { tasks, isLoaded } = useManageTasks();
    // const results = tasks.filter(task => task.id==taskId)
    // if (results.length > 0){
    //     taskObj = results[0]
    // } else {
    //     if(error != true){
    //         setError(true)
    //     }
    // }

    const [taskObj, setTaskObj] = useState({})
    const [error, setError] = useState(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        fetchTask()
    }, [])

    const fetchTask = () => {
        console.log("fetching individual task from backend")

        fetch('/api/unittasks/'+taskId)
        .then(res => {
            if(res.ok){
                res.json()
                .then(data => {
                    const task = {...taskBuilder(data)}
                    setTaskObj(task)
                    setIsLoaded(true)
                })
            } else {
                //console.log("task not found")
                //throw new Error(res.status);
                setError("Unable to load the task specified.")
            }
        })
    }
    console.log("TaskObj: ",taskObj)

    if(!isLoaded){
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
                    <TabsTrigger value="updates">Updates</TabsTrigger>
                    {/* <TabsTrigger value="password">Password</TabsTrigger> */}
                </TabsList>
                {error && <p>Could not find the task specified</p>}
                <TabsContent value="details">
                    {!error && taskObj && <DetailsCard task={taskObj} />}
                </TabsContent>
                <TabsContent value="updates">
                    {!error && taskObj && <UpdatesCardWrapper taskObj={taskObj} />}
                </TabsContent>

                </Tabs>
            </div>
        </AppWrapper>
    )
}
export default TaskDetailsById