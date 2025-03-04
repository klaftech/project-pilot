import AppWrapper from '@/components/AppWrapper'
import TasksTable from './data-table/TasksTable'
import LoadingWrapper from "@/components/LoadingWrapper"
import { useManageTasks } from '@/hooks/useManageTasks'

function ListContainer() {
    const { tasks, isLoaded, updateTask, reloadTasks } = useManageTasks();
    return (
        <AppWrapper>
            <div className="container mx-auto p-6">
                <div className="mx-auto">
                {/* <div className="mx-auto max-w-md overflow-hidden rounded-xl bg-white shadow-md md:max-w-2xl"> */}
                    {!isLoaded && <LoadingWrapper />}
                    {isLoaded && <TasksTable tasks={tasks} />}
                </div>
            </div>
        </AppWrapper>
    )
}

export default ListContainer
