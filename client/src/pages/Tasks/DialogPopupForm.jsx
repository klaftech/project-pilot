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
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

function DialogPopupForm({ isOpen, setIsOpen, title, description, children }) {
    return (
        <Dialog open={isOpen} onOpenChange={()=>{
            setIsOpen(!isOpen)
            console.log('dialog click closed')
        }}>

            {/* 
            <DialogTrigger asChild>
                <Button variant="outline">Edit Profile</Button>
            </DialogTrigger> 
            */}

            <DialogContent className="sm:max-w-[425px]">
                {/* <Button onClick={()=>setIsOpen(!isOpen)} variant="outline">Edit Profile</Button> */}  
                <DialogHeader>
                    <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    )
}

export {
    DialogPopupForm,
    DialogFooter
  }