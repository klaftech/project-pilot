import Navbar from '@/components/Navbar'
import { Analytics } from "@vercel/analytics/next"

const AppWrapper = ({ children }) => {
    return (
        <>
            <Analytics />
            <Navbar />
                {children}
            <div className="p-7 text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
                Developed by Klaftech Data Systems
            </div>
        </>
    )
}
export default AppWrapper