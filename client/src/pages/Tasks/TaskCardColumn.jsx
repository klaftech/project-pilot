import { Separator } from "@/components/ui/separator"

export const TaskCardColumn = ({ title, isLoaded, tasklist }) => {
    return (
        <div className="bg-white p-6 shadow-lg rounded-lg flex flex-col">
            <div className="text-center">
                {title}
            </div>
            <Separator orientation="horizontal" />
            <div className="container mx-auto p-6">
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-6">
                    {!isLoaded ? "Calculating tasks..." : tasklist.length > 0 ? tasklist : "All caught up!"}
                </div>
            </div>
        </div>
    )
}
export default TaskCardColumn