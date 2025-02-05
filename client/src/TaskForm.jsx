import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { useForm } from 'react-hook-form'
import { Calendar } from "@/components/ui/calendar"

import TaskInnerForm from './TaskInnerForm'

import { cn } from "@/lib/utils"
//import { toast } from "@/components/hooks/use-toast"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useEffect } from 'react'

function DialogTaskForm({ isOpen, setIsOpen, formScenario, taskEditObject }) {
    
    //console.log(formScenario)
    //console.log(taskEditObject)
    const onTaskSubmit2 = (form_data) => {
        //alert("task submitted. "+form_data.name)
        console.log(form_data)
        
        // send data to be processed
        // format date object
        console.log(format(form_data.pin_start, 'yyyy-MM-dd'))
        
        // close the dialog box
        setIsOpen(!isOpen)
        
        // reset the form
        form.reset(defaultTaskFormValues)
    }


    const onTaskSubmit = async (form_data) => {
        
        const url = "api/tasks" 
        const request_method = "POST"
        // if(formScenario == "create"){
        //     const url = "api/tasks" 
        //     const request_method = "POST"
        // }
        //     // } else {
        //     const url = "api/tasks/"+taskEditObject.id 
        //     const request_method = "PATCH"
        // }


        //alert("task submitted. "+form_data.name)
        console.log(form_data)
        
        // send data to be processed
        // format date object
        //console.log(format(form_data.pin_start, 'yyyy-MM-dd'))
        
        
        
        // format date objects
        //form_data.pin_start = format(form_data.pin_start, 'yyyy-MM-dd')
        //form_data.pin_end = format(form_data.pin_end, 'yyyy-MM-dd')
        

        try {
            const response = await fetch(
                url,
                {
                    method: request_method,
                    body: JSON.stringify({
                        ...form_data, 
                        project_id: 1, 
                        group_id: 1,
                        plan_start: null,
                        plan_end: null,
                        pin_start: null,
                        pin_end: null
                    }),
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
            console.log('task saved')
            console.log(data)
            
            //setUser(data)
            
            // reset the form
            form.reset(defaultTaskFormValues)

            // close the dialog box
            setIsOpen(!isOpen)

        } catch (error) {
            //setServerErrors(error)
            console.log(error)
        }
    }

    const defaultTaskFormValues = {
        name: '',
        project_id: 1,
        group_id: 1,
        // plan_start: null,
        // plan_end: '',
        pin_start: undefined,
        pin_end: undefined,
        days_length: 0
    }
    
    const taskSchema = z.object({
        name: z.string({ required_error: "Task name is required.", })
            .min(2, { message: "Task name must be at least 2 characters.", }),
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

    const formEditValues = (data) => {
        form.setValue('name', data.name);
        form.setValue('days_length', data.days_length);
        form.setValue('pin_start', data.pin_start);
        form.setValue('pin_end', data.pin_end);
    }
    if(formScenario == "update"){
        formEditValues(taskEditObject)
    }

    return (
    <Dialog open={isOpen} onOpenChange={()=>{
        setIsOpen(!isOpen)
        form.reset(defaultTaskFormValues)
        console.log('clicked')
    }}>
      {/* <DialogTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DialogTrigger> */}

      <DialogContent className="sm:max-w-[425px]">
        {/* <Button onClick={()=>setIsOpen(!isOpen)} variant="outline">Edit Profile</Button> */}  
        <DialogHeader>
          <DialogClose
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>
            Make changes to your task here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onTaskSubmit)}>
        
                <div className="grid gap-4 py-4">

                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Task Name</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            {
                            // <FormDescription>
                            //    Task Name.
                            //</FormDescription>
                            }
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="days_length"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Task Length</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                                Days required to complete task.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />


                    <FormField
                        control={form.control}
                        name="pin_start"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Pin Start</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    // disabled={(date) =>
                                    //   date > new Date() || date < new Date("1900-01-01")
                                    // }
                                    // initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormDescription>
                                Pin the task start to a specific date.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="pin_end"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Pin End</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    // disabled={(date) =>
                                    //   date > new Date() || date < new Date("1900-01-01")
                                    // }
                                    // initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormDescription>
                                Pin the task end to a specific date.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                 


        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
        </form>
        </Form>

      </DialogContent>
    </Dialog>
  )
}
export default DialogTaskForm