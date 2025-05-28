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

function UpdatesCardWrapper({ taskObj }) {
    const [errors, setErrors] = useState(null)
    const [updates, setUpdates] = useState([])

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
    },[taskObj.id])

    const formScenario = "create"
    const modelObj = {task_id: taskObj.id, taskObj: {...taskObj}}
    
    const handleSubmitHook = (data) => {
        setUpdates([...updates,data])
    }

    return (
        <>
            <Card>
                {taskObj.complete_status == false &&             
                <>
                <CardHeader>
                    <CardTitle></CardTitle>
                    <CardDescription></CardDescription>
                </CardHeader>
                <FormWrapper formScenario={formScenario} modelObj={modelObj} onSubmitHook={handleSubmitHook} >
                    <CardContent>
                        <FormFields form="" taskObj={taskObj} />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit">Save</Button>    
                    </CardFooter>
                </FormWrapper>
                </>}

                <UpdatesCardBubbles updates={updates} taskObj={taskObj} />
            </Card>
        </>
    )
}
export default UpdatesCardWrapper