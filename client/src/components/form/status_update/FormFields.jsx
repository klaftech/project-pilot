import { useState, useEffect, useContext } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
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
        <div className="space-y-5">
            <FormField
                control={actualForm.control}
                name="task_status"
                render={({ field }) => {
                    // completed updates keep their status; show it read-only
                    const options = isReadyOnly
                        ? status_options.filter(status => status.code === field.value)
                        : getFilteredStatusOptions(taskObj, status_options)
                    return (
                    <FormItem className="flex flex-col">
                    <FormLabel id="status-label">New status</FormLabel>
                    <FormControl>
                        <div role="radiogroup" aria-labelledby="status-label" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {options.map((status) => (
                                <Button
                                    key={status.code}
                                    type="button"
                                    role="radio"
                                    aria-checked={status.code === field.value}
                                    variant={status.code === field.value ? "default" : "outline"}
                                    disabled={isReadyOnly}
                                    className="h-11 justify-center"
                                    onClick={() => { if (!isReadyOnly) field.onChange(status.code) }}
                                >
                                    {status.title}
                                </Button>
                            ))}
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                    )
                }}
            />
            <FormField
                control={actualForm.control}
                name="record_date"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild disabled={isReadyOnly}>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            disabled={isReadyOnly}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
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
                  <InputGroupTextarea
                    {...fieldProps}
                    id="form-rhf-demo-description"
                    placeholder="Add any relevant notes..."
                    rows={3}
                    className="min-h-20 resize-none w-full"
                    aria-invalid={fieldState.invalid}
                    maxLength="200"
                  />
                  <p className="text-xs text-right text-muted-foreground mt-1">
                    {field.value.length}/200
                  </p>
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
            <div className="pb-2"></div>
        </div>
    )
}
export default FormFields