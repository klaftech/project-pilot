import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, TriangleAlert } from "lucide-react"

const ShowAlert = ({message}) => {
    return (
        <Alert>
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
                {message}
            </AlertDescription>
        </Alert>
    )
}
export default ShowAlert

