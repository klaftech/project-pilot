import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import DetailsCardAncestors from './DetailsCardAncestors'

function DetailsCardDependencies({ taskObj, tasks, pushUpdateTask, reloadTasks }) {
    /* 
    this is a form that allows adding parents/dependents to a task
    i'm envisioning it as bubble that can be X'd to remove
    */
    
    const task = taskObj
    const [errors, setErrors] = useState(null)
    const [triggerUseEffect, setTriggerUseEffect] = useState(false)
    const [ancestors, setAncestors] = useState([])
    const [availableTasks, setAvailableTasks] = useState([])

    // console.log("TaskObj: ",taskObj)
    // console.log("All tasks: ",tasks)
    // console.log("Ancestors: ",ancestors)
    // console.log("Available: ",availableTasks)
    // console.log("TriggerUseEffect: ",triggerUseEffect)

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
        fetchHelper("/api/tasks/"+task.id+"/ancestors",setAncestors)
        fetchHelper("/api/tasks/"+task.id+"/available",setAvailableTasks)
    },[triggerUseEffect])

    const defaultDependencyFormValues = {
        dependent_task_id: ''
    }
        
    const taskSchema = z.object({
        dependent_task_id: z.coerce
            .number({ required_error: "Must be valid number.", })
            .int()
            .positive({ message: "Must be valid number and positive.", }),
        // dependent_task_id: z.string({
        //     required_error: "Please select a task.",
        // }),
    })

    const form = useForm({
        resolver: zodResolver(taskSchema),
        defaultValues: defaultDependencyFormValues
    })

    const onDependencySubmit = async (form_data) => {
        //console.log(form_data)

        const url = "/api/dependencies"
        try {
            const response = await fetch(
                url,
                {
                    method: "POST",
                    body: JSON.stringify({
                        task_id: task.id,
                        dependent_task_id: form_data['dependent_task_id']
                    }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            )
            if(!response.ok){
                //throw new Error(`Response status: ${response.status}`);
                //throw new Error(response.status);
                throw 500
            }
            
            const data = await response.json()
            //console.log("onDependencySubmit(): dependency created")
            //console.log("onDependencySubmit() response: ",data)
            
            //response is the TaskDependency record 
            // since we can't do anything with it: 
            // 1. reload dependencies&available lists 
            // 2. trigger reload of tasklist
            setTriggerUseEffect(!triggerUseEffect) //trigger useEffect to reload data
            reloadTasks() //reload app tasklist

        } catch (error) {
            console.log(error)
            setErrors("Could not save, please recheck selection or try again.")
        }
    }
    
    return (
        <>
            <Card>
                <DetailsCardAncestors ancestors={ancestors} />
                {availableTasks.length <= 0 && 
                    <CardHeader>
                    <CardTitle>No tasks available to link</CardTitle>
                    <CardDescription>All available tasks are either already linked or all tasks are descendents of this task.</CardDescription>
                </CardHeader>
                }
                {availableTasks.length > 0 && 
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onDependencySubmit)} className="space-y-6">

                        <CardHeader>
                            <CardTitle>Add a Parent Task to <u><i>{task.name}</i></u></CardTitle>
                            <CardDescription>Current task will be rescheduled to after last of it's parent tasks are to be completed.</CardDescription>
                            {errors ? <p className="text-red-400 font-medium">{errors}</p> : ""}
                        </CardHeader>
                        
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="dependent_task_id"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                    <FormLabel>Parent Task</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-[200px] justify-between",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            >
                                            {field.value
                                                ? availableTasks.find(
                                                    (task) => task.id === field.value
                                                )?.name
                                                : "Select Task"}
                                            <ChevronsUpDown className="opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[200px] p-0">
                                        <Command>
                                            <CommandInput
                                            placeholder="Search tasks..."
                                            className="h-9"
                                            />
                                            <CommandList>
                                            <CommandEmpty>No task found.</CommandEmpty>
                                            <CommandGroup>
                                                {availableTasks.map((task) => (
                                                <CommandItem
                                                    value={task.id}
                                                    key={task.id}
                                                    onSelect={() => {
                                                    form.setValue("dependent_task_id", task.id)
                                                    }}
                                                >
                                                    {task.name}
                                                    <Check
                                                    className={cn(
                                                        "ml-auto",
                                                        task.id === field.value
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                    )}
                                                    />
                                                </CommandItem>
                                                ))}
                                            </CommandGroup>
                                            </CommandList>
                                        </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        This task will need to be completed before {task.name}, and all tasks dependent on it will be rescheduled accordingly.
                                    </FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                
                        <CardFooter>
                            <Button type="submit">Add Parent Task</Button>
                        </CardFooter>
                    </form>
                </Form>}
            </Card>
        </>
    )
}
export default DetailsCardDependencies