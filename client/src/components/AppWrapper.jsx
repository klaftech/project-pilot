import Navbar from '@/components/Navbar'
import { Analytics } from "@vercel/analytics/react"

const AppWrapper = ({ children }) => {
    return (
        <>
            <div className="print:hidden"><Navbar /></div>
            <main className="min-h-screen bg-muted/40 print:min-h-0 print:bg-white">
                <div className="max-w-screen-2xl mx-auto px-4 py-6">
                    {children}
                </div>
            </main>
            <div className="p-7 print:hidden text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
                Developed by <a href="https://klaftech.com" target="_blank" rel="noreferrer">KlafTech Data Systems</a>
            </div>
            <Analytics />
        </>
    )
}
export default AppWrapper