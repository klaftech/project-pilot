import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ToastAction } from "@/components/ui/toast"

const ToastDemo = () => {
    const { toast } = useToast()
   
    return (
      <>
        <Button
        onClick={() => {
          toast({
            title: "Scheduled: Catch up",
            description: "Friday, February 10, 2023 at 5:57 PM",
          })
        }}
      >
        Show Toast
      </Button>

        <Button
        variant="outline"
        onClick={() => {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "There was a problem with your request.",
                action: <ToastAction altText="Try again">Try again</ToastAction>,
            })
        }}
        >
        Show Warning Toast
        </Button>
      </>
    )
  }
export default ToastDemo