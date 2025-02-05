import Navbar from './Navbar'
import TasksTable from './data-table/TasksTable'

function ListContainer({tasks}) {
    return (
        <>
            <Navbar />
            <div className="container mx-auto p-6">
                <div className="mx-auto">
                {/* <div className="mx-auto max-w-md overflow-hidden rounded-xl bg-white shadow-md md:max-w-2xl"> */}
                    <TasksTable tasks={tasks} />
                </div>
            </div>
        </>
    )
}

export default ListContainer
