import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

function DialogPopupForm({ isOpen, setIsOpen, title, description, children }) {
    return (
        <Dialog open={isOpen} onOpenChange={()=>{ setIsOpen(!isOpen) }}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader className="pb-2 border-b">
                    <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
                    {description && (
                        <DialogDescription className="text-xs">
                            {description}
                        </DialogDescription>
                    )}
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