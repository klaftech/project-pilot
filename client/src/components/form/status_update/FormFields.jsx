import { useState, useEffect, useContext } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, parse } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupText,
    InputGroupTextarea,
} from "@/components/ui/input-group"
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
  } from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover"
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
import { status_options, getFilteredStatusOptions } from '@/utils/status_codes'

const FormFields = ({ form, formScenario, taskObj }) => {
    
    //get the form from context instead of props
    const formContext = useFormContext()
    const actualForm = form || formContext

    // set read-only for some fields (except message) if editing the completion update of a completed task
    const isReadyOnly = true ? actualForm.getValues("task_status") == 200 && taskObj.complete_status === true && formScenario == "update" : false
    //console.log("isReadyOnly:", isReadyOnly)

    if(!taskObj){
        //if taskObj is not set, exit script
        return 
    }

    if(formScenario == "create" && taskObj.status_code == 200){
        return (<>Task is already completed</>)
    }

    return (
        <>
            {/* 
            <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Project</FormLabel>
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
                                ? projects.find(
                                    (project) => project.id === field.value
                                )?.name
                                : "Select Project"}
                            <ChevronsUpDown className="opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                        <Command>
                            <CommandInput
                            placeholder="Search projects..."
                            className="h-9"
                            />
                            <CommandList>
                            <CommandEmpty>No projects found.</CommandEmpty>
                            <CommandGroup>
                                {projects.map((project) => (
                                <CommandItem
                                    value={project.name}
                                    key={project.id}
                                    onSelect={() => {
                                        field.onChange(project.id)
                                    }}
                                >
                                    {project.name}
                                    <Check
                                    className={cn(
                                        "ml-auto",
                                        project.id === field.value
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
                        Assign task to a project.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
            */}

            <FormField
                control={actualForm.control}
                name="task_status"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Current Status</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild disabled={isReadyOnly}>
                        <FormControl>
                            <Button
                            variant="outline"
                            role="combobox"
                            disabled={isReadyOnly}
                            className={cn(
                                "w-[200px] justify-between",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value
                                ? status_options.find(
                                    (status) => status.code === field.value
                                )?.title
                                : "Select Status"}
                            <ChevronsUpDown className="opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                        <Command>
                            {/* <CommandInput
                            placeholder="Search status..."
                            className="h-9"
                            /> */}
                            <CommandList>
                            <CommandEmpty>No status found.</CommandEmpty>
                            <CommandGroup>
                                {getFilteredStatusOptions(taskObj, status_options).map((status) => (
                                <CommandItem
                                    value={status.title}
                                    key={status.code}
                                    disabled={isReadyOnly}
                                    //onSelect={field.onChange}
                                    onSelect={() => {
                                        if (isReadyOnly) return
                                        //form.setValue("group_id", group.id)
                                        field.onChange(status.code)
                                    }}
                                >
                                    {status.title}
                                    <Check
                                    className={cn(
                                        "ml-auto",
                                        status.code === field.value
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
                    {/* <FormDescription>
                        Select updated status.
                    </FormDescription> */}
                    <FormMessage />
                    </FormItem>
                )}
            />

            <div className="mb-4"></div>
            
            <FormField
                control={actualForm.control}
                name="record_date"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                        {console.log(field)}
                        <PopoverTrigger asChild disabled={isReadyOnly}>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            disabled={isReadyOnly}
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
                            //onSelect={field.onChange}
                            // handle readonly state (don't allow changes if task_status is 200)
                            onSelect={isReadyOnly ? undefined : field.onChange} // ❗ don't update when task is completed
                            disabled={isReadyOnly ? () => true : undefined}     // ❗ disables all dates visually
                            // disabled={(date) =>
                            //   date > new Date() || date < new Date("1900-01-01")
                            // }
                            // initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    {/* <FormDescription>
                        Status Date.
                    </FormDescription> */}
                    <FormMessage />
                    </FormItem>
                )}
            />

            <div className="mb-4"></div>

            <Controller
              name="message"
              control={actualForm.control}
              render={({ field, fieldState }) => {
                const { ref, ...fieldProps } = field;
                return (        
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-description">
                    Notes
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      {...fieldProps}
                      id="form-rhf-demo-description"
                      placeholder="All work has been completed as expected."
                      rows={4}
                      className="min-h-24 resize-none"
                      aria-invalid={fieldState.invalid}
                      maxLength="200"
                    />
                    <InputGroupAddon align="block-end">
                      <InputGroupText className="tabular-nums">
                        {field.value.length}/200 characters
                      </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldDescription>
                    Please add any relevant notes regarding this status update.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}}
            />

            {/* <FormField
                control={actualForm.control}
                name="message"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Status Message</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormDescription>
                        Status Message
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            /> */}

            {/* add spacing at bottom of form */}
            <div className="mb-6"></div>
        </>
    )
}
export default FormFields