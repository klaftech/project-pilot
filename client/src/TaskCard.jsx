export function TaskCard({task}) {
    return (
        <div className="bg-white p-6 shadow-lg rounded-lg flex flex-col">
            <h3 className="text-xl font-semibold">{task.name}</h3>
            <p className="text-gray-500 mt-2">{task.start} - {task.end}</p>
        </div>
    )
}
export default TaskCard