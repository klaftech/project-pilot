import Header from './Header'
import TasksTable from './data-table/TasksTable'

function ListContainer() {
    return (
        <>
            <Header />
            <div className="container mx-auto p-6">
                <div className="mx-auto">
                {/* <div className="mx-auto max-w-md overflow-hidden rounded-xl bg-white shadow-md md:max-w-2xl"> */}
                    <TasksTable />
                </div>
            </div>
        </>
    )
}

export default ListContainer
