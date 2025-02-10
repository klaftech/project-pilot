import { format } from "date-fns"
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { useForm } from 'react-hook-form'
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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


function TaskInnerForm() {
        
    const onTaskSubmit = (form_data) => {
        //alert("task submitted. "+form_data.name)
        console.log(form_data)
    }

    const taskSchema = z.object({
        name: z.string({
            required_error: "Task name is required.",
        }).min(2, {
            message: "Task name must be at least 2 characters.",
        }),
        days_length: z.coerce.number({
            required_error: "Task Length is required.",
        })
        .int()
        .positive({
            message: "Task must take at least 1 day.",
        })
        .min(1, {
            message: "Task must take at least 1 day.",
        })
        .max(365, {
            message: "Task can't take longer than a year.",
        }),
        // pin_start: z.date({
        //     //required_error: "A pin start date is required.",
        // }),
        // pin_end: z.date(),
      })

    // const form = useForm({
    //     resolver: zodResolver(taskSchema),
    //     defaultValues: {
    //         // name: null,
    //         project_id: 1,
    //         group_id: 1,
    //         // plan_start: null,
    //         // plan_end: '',
    //         // pin_start: '',
    //         // pin_end: '',
    //         // days_length: ''
    //     }
    // })
    
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            // name: 'ss',
            project_id: 1,
            group_id: 1,
            // plan_start: '',
            // plan_end: '',
            // pin_start: '',
            // pin_end: '',
            // days_length: ''
        }
    });

    return (

        

        <form onSubmit={handleSubmit(onTaskSubmit)}>
            <div className="grid gap-4 py-4">

            {errors.name && <span>{errors.name.message}</span>}
          {errors.days_length && <span>{errors.days_length.message}</span>}
          {errors.pin_start && <span>{errors.pin_start.message}</span>}
          {errors.pin_end && <span>{errors.pin_end.message}</span>}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input {...register('name')} id="name" className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="days_length" className="text-right">
              Task Length
            </Label>
            <Input {...register('days_length')} type="number" id="days_length" className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pin_start" className="text-right">
              Pin Start
            </Label>
            <Input {...register('pin_start')} id="pin_start" className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pin_end" className="text-right">
              Pin End
            </Label>
            <Input {...register('pin_end')} id="pin_end" className="col-span-3" />
          </div>

          


          <Button type="submit">Save changes</Button>
        </div>
        </form>

    )
}
export default TaskInnerForm