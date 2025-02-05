import Example from './gantt-example/Example'
import Navbar from './Navbar'

function ScheduleContainer() {
    return (
        <>
            <Navbar />
            <div className="container mx-auto p-6">
                <div className="flex gap-6">
                    <Example />
                </div>
            </div>
        </>
    )
}

export default ScheduleContainer
