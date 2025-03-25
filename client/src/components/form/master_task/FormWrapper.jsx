import { useState, useEffect, useContext } from 'react'
import { useForm } from 'react-hook-form'
import { format } from "date-fns"
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form"
import UserContext from '@/context/UserContext'

const FormWrapper = ({ formScenario, taskEditObj, pushUpdateTask, submitHook, children }) => {
    
    const {user, setUser} = useContext(UserContext);
    const [serverErrors, setServerErrors] = useState()

    const defaultFetchParams = {
        url: "/api/mastertasks", 
        request_method: "POST"
    }
    const [fetchParams, setFetchParams] = useState(defaultFetchParams)

    //console.log("Default fetchParams: ",fetchParams)
    //console.log("onLoad formScenario: ",formScenario)

    const onTaskSubmit = async (form_data) => {

        let project_id = 4
        if(user && user.selectedProject){
            project_id = user.selectedProject
        }

        
        console.log("onTaskSubmit() fired")

        const url = fetchParams.url
        const request_method = fetchParams.request_method
        
        console.log('onTaskSubmit() fired')
        console.log("fetchParams: ",url, request_method)
        console.log("formData: ",form_data)
        
        // format date objects
        if(form_data.pin_start != undefined){
            form_data.pin_start = format(form_data.pin_start, 'yyyy-MM-dd')
            console.log("formData.pin_start (formatted): ",form_data.pin_start)
        }
        
        if(form_data.pin_end != undefined){
            form_data.pin_end = format(form_data.pin_end, 'yyyy-MM-dd')
            console.log("formData.pin_end (formatted): ",form_data.pin_end)
        }

        if(request_method == "POST"){
            form_data = {
                ...form_data, 
                project_id: project_id,
            }
        }

        console.log(form_data)

        try {
            const response = await fetch(
                url,
                {
                    method: request_method,
                    body: JSON.stringify({...form_data}),
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            )
            if(!response.ok){
                //throw new Error(`Response status: ${response.status}`);
                throw new Error(response.status);
            }
            
            const data = await response.json()
            console.log("onTaskSubmit(): task saved")
            console.log("onTaskSubmit() response: ",data)
            
            pushUpdateTask(data)
            
            // run custom submit hook
            submitHook(data)
            
            // reset the form
            form.reset(defaultTaskFormValues)
            console.log("onTaskSubmit(): form reset")
            

        } catch (error) {
            setServerErrors(error)
            //console.log(error)
        }
    }

    const defaultTaskFormValues = {
        name: '',
        //project_id: '',
        group_id: '',
        days_length: '',
        pin_start: undefined,
        pin_end: undefined,
    }

    const taskSchema = z.object({
        name: z.string({ required_error: "Task name is required.", })
            .min(2, { message: "Task name must be at least 2 characters.", }),
        //project_id: z.coerce.number({ required_error: "Project must be selected.", }).int().positive(),
        group_id: z.coerce
            .number({ required_error: "Group must be selected.", })
            .int({ message: "Group must be selected.", })
            .positive({ message: "Group must be selected.", }),
        days_length: z.coerce
            .number({ required_error: "Task Length is required.", })
            .int()
            .positive({ message: "Task must take at least 1 day.", })
            .min(1, { message: "Task must take at least 1 day.", })
            .max(365, { message: "Task can't take longer than a year.",}),
        pin_start: z.date().optional(),
        pin_end: z.date().optional(),
    })

    const form = useForm({
        resolver: zodResolver(taskSchema),
        defaultValues: defaultTaskFormValues
    })

    //load form values from task to edit on dialog open
    useEffect(()=>{
        //if(isOpen && formScenario == "update"){
        if(formScenario == "update"){
            console.log('useEffect: task object set to form')
            console.log("taskEditObject: ",taskEditObj)

            const data = taskEditObj
            
            setFetchParams({
                url: "/api/mastertasks/"+data.id, 
                request_method: "PATCH"
            })
            
            let pin_start = undefined
            if(data.pin_start){
                //pin_start = new Date(data.pin_start).setHours(0, 0, 0, 0); //set to midnight //accepting string
                pin_start = data.pin_start
            }

            let pin_end = undefined
            if(data.pin_end){
                //pin_end = new Date(data.pin_end).setHours(0, 0, 0, 0); //set to midnight //accepting string
                pin_end = data.pin_end
            }

            form.setValue('name', data.name);
            form.setValue('project_id', data.project_id);
            form.setValue('group_id', data.group.id);
            form.setValue('days_length', data.days_length);
            form.setValue('pin_start', pin_start);
            form.setValue('pin_end', pin_end);
        } else {
            console.log('useEffect. form reset to default values')
            setFetchParams(defaultFetchParams)
            form.reset(defaultTaskFormValues)
        }
    },[taskEditObj])
    //console.log({...form})

    const onError = (errors, event) => {
        //console.log(event)
        //console.log(errors)
        setServerErrors(errors)
    }
    
    if(serverErrors){
        console.log("Submission Errors:")
        console.log(serverErrors)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onTaskSubmit, onError)}>                
                {children}
            </form>
        </Form>
    )
}
export default FormWrapper