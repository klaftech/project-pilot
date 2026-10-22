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
            {/* bottom sheet on phones, centred dialog from sm up */}
            <DialogContent className="sm:max-w-[520px] max-sm:top-auto max-sm:bottom-0 max-sm:translate-y-0 max-sm:max-h-[90vh] max-sm:overflow-y-auto max-sm:rounded-t-xl max-sm:data-[state=open]:slide-in-from-bottom-1/2">
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