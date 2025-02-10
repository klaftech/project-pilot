import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"

import { useState, useEffect } from 'react'
import FormWrapper from './FormWrapper'
import FormFields from './FormFields'
import ShowAlert from "./ShowAlert"

const DetailsCardForm = ({ taskObj, pushUpdateTask, reloadTaskObj }) => {
    
    const [show, setShow] = useState(false)
    
    useEffect(() => {
        const timeId = setTimeout(() => {
            // After 3 seconds set the show value to false
            setShow(false)
        }, 3000)

        return () => {
        clearTimeout(timeId)
        }
    }, [show]);

    const submitHook = (data) => {
        reloadTaskObj()
        setShow(true)
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Edit Task</CardTitle>
                <CardDescription>
                    Make change to your task here. Click save when your done.
                    {show && <ShowAlert message="Changes saved" />}
                </CardDescription>
            </CardHeader>
            
            <FormWrapper formScenario="update" taskEditObj={taskObj} pushUpdateTask={pushUpdateTask} submitHook={submitHook}>
                <CardContent className="space-y-2">
                    <FormFields form={()=>true}/>
                </CardContent>
                <CardFooter>
                    <Button type="submit">Save changes</Button>
                </CardFooter>
            </FormWrapper>
                    
                {/* 
                <div className="space-y-1">
                    <Label htmlFor="current">Current password</Label>
                    <Input id="current" type="password" />
                    </div>
                    <div className="space-y-1">
                    <Label htmlFor="new">New password</Label>
                    <Input id="new" type="password" />
                </div> 
                */}
        </Card>
    )
}
export default DetailsCardForm