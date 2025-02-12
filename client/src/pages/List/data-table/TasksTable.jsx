import DataTable from './components/DataTable'
import {columns} from './TasksTableColumns.jsx'
//import { tasks_data } from '../tasks_data.js'

export function TasksTable({tasks}) {
    
    //convert object to array (get from parent component instead)
    //const tasks = Object.values(tasks_data)

    // // data shape
    // const tasks = [
    //     {
    //       "id": "206",
    //       "name": "Sign Contract",
    //       "start": "2025-01-29",
    //       "end": "2025-02-05",
    //       "days_length": 7,
    //       "progress": 0
    //     },

    return (
        <div className="container mx-auto py-10">
            <DataTable columns={columns} data={tasks} />
        </div>
    )
}
export default TasksTable
