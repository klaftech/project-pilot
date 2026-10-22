import { Link } from 'react-router'
import AppWrapper from '@/components/AppWrapper'
import { Button } from "@/components/ui/button"

function HTTP404({endpoint}) {
    return (
        <AppWrapper>
            <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
                <p className="text-sm font-medium text-muted-foreground">404</p>
                <h1 className="text-2xl font-semibold">Page not found</h1>
                <p className="text-muted-foreground">
                    There&apos;s nothing at <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{endpoint}</code>. The link may be out of date.
                </p>
                <Button asChild><Link to="/">Back to Home</Link></Button>
            </div>
        </AppWrapper>
    )
}
export default HTTP404
