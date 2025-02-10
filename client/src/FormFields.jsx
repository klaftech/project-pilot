import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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

const FormFields = ({ form }) => {
    return (
        <>
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
        </>
    )
}
export default FormFields