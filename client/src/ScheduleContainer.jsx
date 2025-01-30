import Example from './gantt-example/Example'
import Header from './Header'

function ScheduleContainer() {
    return (
        <>
            <Header />
            <div className="container mx-auto p-6">
                <div className="flex gap-6">
                    <Example />
                </div>
            </div>
        </>
    )
}

export default ScheduleContainer
