import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from 'react'

import LoadingWrapper from "@/components/LoadingWrapper"
import UpdatesCardBubbles from "./UpdatesCardBubbles"

import FormFields from '@/components/form/status_update/FormFields'
import FormWrapper from '@/components/form/status_update/FormWrapper'
import { filterFns } from "@tanstack/react-table"
import { data } from "react-router"

function UpdatesCardWrapper({ taskObj }) {
    
    console.log("UpdatesCardWrapper - taskObj: ",taskObj)
    
    const [errors, setErrors] = useState(null)
    const [updates, setUpdates] = useState([])

    const [showForm, setShowForm] = useState(false)
    const [formScenario, setFormScenario] = useState("create")
    //const [modelObj, setModelObj] = useState({task_id: taskObj.id, taskObj: {...taskObj}})
    const [modelObj, setModelObj] = useState({task_id: null, taskObj: null})

    console.log(modelObj)
    console.log(updates)

    const fetchHelper = (url, callback) => (
        fetch(url)
        .then(res => {
            if(res.ok){
                res.json()
                .then(data => {
                    callback(data)
                })
            } else {
                console.log("error fetching data")
            }
        })
    )

    useEffect(() => {
        //console.log('useEffect triggered to reload data')
        fetchHelper("/api/updates?task_id="+taskObj.id, setUpdates)
        setModelObj({task_id: taskObj.id, taskObj: taskObj})
    },[taskObj.id])

    useEffect(() => {
        if (taskObj.complete_status == false){
            //setModelObj({task_id: taskObj.id, taskObj: {...taskObj}})
            setShowForm(true)
        }
    }, [taskObj.complete_status])

    //const formScenario = "create"
    //const modelObj = {task_id: taskObj.id, taskObj: {...taskObj}}
    //setModelObj({task_id: taskObj.id, taskObj: taskObj})

    // Sorting function to sort updates by timestamp
    const sortArrayByDate = (data, sortOrder = 'asc') => {
        // Create a copy of the array to avoid direct mutation of state
        const sortedData = [...data].sort((a, b) => {
            const dateA = new Date(a.timestamp); // Replace 'dateProperty' with your actual property name
            const dateB = new Date(b.timestamp); // Replace 'dateProperty' with your actual property name

            if (sortOrder === 'asc') {
            return dateA.getTime() - dateB.getTime(); // Ascending order
            } else {
            return dateB.getTime() - dateA.getTime(); // Descending order
            }
        });
        return sortedData;
    };

    const handleSubmitHook = (data) => {
        let tempUpdates = updates.filter(update => update.id !== data.id)
        tempUpdates = [...tempUpdates, data]
        //console.log("PRESORT", tempUpdates)
        tempUpdates = sortArrayByDate(tempUpdates, 'asc')
        //console.log("SORTED BY TIMESTAMP", tempUpdates)
        setUpdates([...tempUpdates])
        //setUpdates([...updates,data])

        setShowForm(false)
    }

    const handleEditButton = (updateObj) => {
        console.log("edit clicked")
        setFormScenario("update")
        setModelObj(updateObj)
        setShowForm(true)
    }

    
    return (
        <>          
            <Card>
                {showForm &&             
                <>
                <CardHeader>
                    <CardTitle></CardTitle>
                    <CardDescription></CardDescription>
                </CardHeader>
                <FormWrapper formScenario={formScenario} modelObj={modelObj} onSubmitHook={handleSubmitHook} >
                    <CardContent>
                        <FormFields form="" formScenario={formScenario} taskObj={taskObj} />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit">{formScenario == "create" ? "Save" : "Update"}</Button>    
                    </CardFooter>
                </FormWrapper>
                </>}

                <UpdatesCardBubbles updates={updates} taskObj={taskObj} clickEditStatus={handleEditButton}/>
            </Card>
        </>
    )
}
export default UpdatesCardWrapper