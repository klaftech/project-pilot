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
import { useNavigate } from 'react-router'
import { toast } from "sonner"
import UserContext from '@/context/UserContext'
import FormWrapper from '@/components/form/master_task/FormWrapper'
import FormFields from '@/components/form/master_task/FormFields'
import ShowAlert from "@/components/ShowAlert"

const DetailsCardForm = ({ taskObj, pushUpdateTask, reloadTaskObj }) => {
    
    const [show, setShow] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const { user } = useContext(UserContext)
    const navigate = useNavigate()
    const isAdmin = !!user?.is_admin

    const handleDelete = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true)
            return
        }
        const res = await fetch('/api/mastertasks/' + taskObj.id, { method: 'DELETE' })
        if (res.ok) {
            toast("Task deleted")
            navigate('/project/' + (taskObj.project?.id ?? ''))
        } else {
            const data = await res.json().catch(() => ({}))
            toast(data.error || "This task could not be deleted.")
            setConfirmDelete(false)
        }
    }
    
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
                    <CardFooter className="flex flex-wrap justify-between gap-2">
                        <Button type="submit">Save changes</Button>
                        <Button type="button" variant={confirmDelete ? "destructive" : "outline"} onClick={handleDelete}>
                            {confirmDelete ? "Confirm delete" : "Delete task"}
                        </Button>
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