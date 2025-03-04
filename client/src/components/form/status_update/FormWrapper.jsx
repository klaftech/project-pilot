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

//if formScenario=add, modelObj must contain object containing task_id
const FormWrapper = ({ formScenario, modelObj, onSubmitHook, children }) => {
    

    const [serverErrors, setServerErrors] = useState()

    const defaultFetchParams = {
        url: "/api/updates", 
        request_method: "POST"
    }
    const [fetchParams, setFetchParams] = useState(defaultFetchParams)

    //console.log("Default fetchParams: ",fetchParams)
    //console.log("onLoad formScenario: ",formScenario)

    const onFormSubmit = async (form_data) => {

        // ensure we have task_id to link status to
        if(!modelObj.task_id){
            throw Exception("Task ID missing")
        }

        const url = fetchParams.url
        const request_method = fetchParams.request_method
        
        console.log('onFormSubmit() fired')
        console.log("fetchParams: ",url, request_method)
        console.log("formData: ",form_data)

        if(request_method == "POST"){
            form_data = {
                ...form_data, 
                task_id: modelObj.task_id,
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
            console.log("onFormSubmit(): saved")
            console.log("onFormSubmit() response: ",data)
            
            // push change to state
            //pushUpdateTask(data)
            
            // run custom submit hook
            onSubmitHook(data)
            
            // reset the form
            form.reset(defaultFormValues)
            console.log("onFormSubmit(): form reset")
            

        } catch (error) {
            setServerErrors(error)
            //console.log(error)
        }
    }

    const defaultFormValues = {
        task_id: '',
        message: undefined,
        task_status: '',
    }

    const taskSchema = z.object({
        //task_id: z.coerce.number({ required_error: "Task must be specified.", }).int().positive(),
        // task_status: z.string({ required_error: "Status is required.", })
        //     .min(2, { message: "Status must be at least 2 characters.", }),
        task_status: z.coerce
             .number({ required_error: "Status must be selected.", })
             .int({ message: "Status must be selected.", })
             .positive({ message: "Status must be selected.", }),
        message: z.string().optional(),
    })

    const form = useForm({
        resolver: zodResolver(taskSchema),
        defaultValues: defaultFormValues
    })

    //load form values from task to edit on dialog open
    useEffect(()=>{
        //if(isOpen && formScenario == "update"){
        if(formScenario == "update"){
            console.log('useEffect: object set to form')
            console.log("Object: ", modelObj)

            const data = modelObj
            
            setFetchParams({
                url: "/api/updates/"+data.id, 
                request_method: "PATCH"
            })
            
            // let pin_start = undefined
            // if(data.pin_start){
            //     //pin_start = new Date(data.pin_start).setHours(0, 0, 0, 0); //set to midnight //accepting string
            //     pin_start = data.pin_start
            // }

            form.setValue('task_status', data.task_status);
            form.setValue('message', data.message);
        } else {
            console.log('useEffect. form reset to default values')
            setFetchParams(defaultFetchParams)
            form.reset(defaultFormValues)
        }
    },[modelObj])
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
            <form onSubmit={form.handleSubmit(onFormSubmit, onError)}>                
                {children}
            </form>
        </Form>
    )
}
export default FormWrapper