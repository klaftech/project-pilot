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


function DialogTaskForm({ isOpen, setIsOpen, formScenario="create", task=null }) {
    
    const onTaskSubmit = (form_data) => {
        alert("task submitted. "+form_data.name)
        console.log(form_data)
        setIsOpen(!isOpen)
    }

    const form = useForm()
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            name: '',
            project_id: 1,
            group_id: 1,
            plan_start: '',
            plan_end: '',
            pin_start: '',
            pin_end: '',
            days_length: ''
        }
    });

    const onClose = ()=>{
        alert("closed")
    }
    console.log(...formState)
    return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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

        <form onSubmit={handleSubmit(onTaskSubmit)}>
        <div className="grid gap-4 py-4">
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input {...register('name')} id="name" className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pin_start" className="text-right">
              Pin Start
            </Label>
            <Input {...register('pin_start')} id="pin_start" className="col-span-3">
                <Popover>
                <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                    //   className={cn(
                    //     "w-[240px] pl-3 text-left font-normal",
                    //     !field.value && "text-muted-foreground"
                    //   )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            
            
            
            
            </Input>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pin_end" className="text-right">
              Pin End
            </Label>
            <Input {...register('pin_end')} id="pin_end" className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="days_length" className="text-right">
              Task Length
            </Label>
            <Input {...register('days_length')} id="days_length" className="col-span-3" />
          </div>

        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
        </form>

      </DialogContent>
    </Dialog>
  )
}
export default DialogTaskForm