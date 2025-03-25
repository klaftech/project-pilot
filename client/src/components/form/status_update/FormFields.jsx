import { useState, useEffect, useContext } from 'react'
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
import { status_options } from '@/utils/status_update'

const FormFields = ({ form }) => {

    return (
        <>
            <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Status Message</FormLabel>
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
                control={form.control}
                name="task_status"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Current Status</FormLabel>
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
                            <CommandInput
                            placeholder="Search status..."
                            className="h-9"
                            />
                            <CommandList>
                            <CommandEmpty>No status found.</CommandEmpty>
                            <CommandGroup>
                                {status_options.filter((status) => status.update_visibility == true).map((status) => (
                                <CommandItem
                                    value={status.title}
                                    key={status.code}
                                    //onSelect={field.onChange}
                                    onSelect={() => {
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
                    <FormDescription>
                        Select updated status.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </>
    )
}
export default FormFields