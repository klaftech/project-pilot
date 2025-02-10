import GanttChart from './gantt-chart/GanttChart'
import Navbar from './Navbar'

function ScheduleContainer({ tasks }) {
    return (
        <>
            <Navbar />
            <div className="container mx-auto p-6">
                {/* <div className="flex gap-6"> */}
                    {tasks && tasks.length > 0 && <GanttChart tasks={tasks} />}
                {/* </div> */}
            </div>
        </>
    )
}

export default ScheduleContainer
