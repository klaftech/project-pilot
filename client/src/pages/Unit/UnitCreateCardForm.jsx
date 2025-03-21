import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"

import { useState, useEffect, useContext } from 'react'
import FormWrapper from '@/components/form/unit/FormWrapper'
import FormFields from '@/components/form/unit/FormFields'
import ShowAlert from "@/components/ShowAlert"
import UserContext from "@/context/UserContext"

const UnitCreateCardForm = () => {
    
    const {user} = useContext(UserContext)

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

    // const submitHook = (data) => {
    //     reloadTaskObj()
    //     setShow(true)
    // }

    const submitHook = (data) => {
        setShow(true)
        console.log("submitHook: form submitted")
        console.log(data)
    }

    const pushUpdateUnit = () => {
        console.log("pushUpdateUnit: form submitted")
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Create New Unit</CardTitle>
                <CardDescription>
                    Enter Unit details below. Task list will be built using all Project's tasks.
                    {show && <ShowAlert message="Changes saved" />}
                </CardDescription>
            </CardHeader>
            
            <FormWrapper formScenario="create" unitEditObj={{project_id: user.selectedProject}} pushUpdateUnit={pushUpdateUnit} submitHook={submitHook}>
                <CardContent className="space-y-2">
                    <FormFields form={()=>true}/>
                </CardContent>
                <CardFooter>
                    <Button type="submit">Save</Button>
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
export default UnitCreateCardForm