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
import UserContext from '@/context/UserContext'
import FormWrapper from '@/components/form/master_task/FormWrapper'
import FormFields from '@/components/form/master_task/FormFields'
import ShowAlert from "@/components/ShowAlert"

const DetailsCardForm = ({ taskObj, pushUpdateTask, reloadTaskObj }) => {
    
    const [show, setShow] = useState(false)
    const { user } = useContext(UserContext)
    const isAdmin = !!user?.is_admin

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
                <CardTitle>{isAdmin ? "Edit Master Task" : "Master Task"}</CardTitle>
                <CardDescription>
                    {isAdmin ? "Make changes to your task here. Click save when you're done." : "Only administrators can change task templates."}
                    {show && <ShowAlert message="Changes saved" />}
                </CardDescription>
            </CardHeader>
            
            <FormWrapper formScenario="update" taskEditObj={taskObj} pushUpdateTask={pushUpdateTask} submitHook={submitHook}>
                <CardContent className="space-y-2">
                    {/* a disabled fieldset disables every control inside it for non-admins */}
                    <fieldset disabled={!isAdmin}>
                        <FormFields form={()=>true}/>
                    </fieldset>
                </CardContent>
                {isAdmin && (
                    <CardFooter>
                        <Button type="submit">Save changes</Button>
                    </CardFooter>
                )}
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