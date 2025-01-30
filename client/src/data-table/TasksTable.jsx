import DataTable from './components/DataTable'
import {columns} from './TasksTableColumns.jsx'

export function TasksTable() {
    // data
    const tasks = [
        {
          "id": "206",
          "name": "Sign Contract",
          "start": "2025-01-29",
          "end": "2025-02-05",
          "days_length": 7,
          "progress": 0
        },
        {
          "id": "617",
          "name": "Engineer Approval",
          "start": "2025-01-29",
          "end": "2025-02-05",
          "days_length": 7,
          "progress": 0
        },
        {
          "id": "710",
          "name": "Sitework",
          "start": "2025-02-06",
          "end": "2025-03-08",
          "days_length": 30,
          "progress": 0
        },
        {
          "id": "171",
          "name": "Arrange Payment",
          "start": "2025-02-06",
          "end": "2025-02-20",
          "days_length": 14,
          "progress": 0
        },
        {
          "id": "417",
          "name": "Apply for Permits",
          "start": "2025-02-06",
          "end": "2025-02-13",
          "days_length": 7,
          "progress": 0
        },
        {
          "id": "591",
          "name": "Level Site",
          "start": "2025-04-01",
          "end": "2025-04-15",
          "days_length": 14,
          "progress": 0
        },
        {
          "id": "643",
          "name": "Foundation",
          "start": "2025-04-16",
          "end": "2025-04-30",
          "days_length": 14,
          "progress": 0
        },
        {
          "id": "650",
          "name": "Survey Ground",
          "start": "2025-04-16",
          "end": "2025-04-19",
          "days_length": 3,
          "progress": 0
        }
    ]
    
    const payments = [
        {
            id: "728ed52f",
            amount: 100,
            status: "pending",
            email: "m@example.com",
        },
        {
            id: "489e1d42",
            amount: 125,
            status: "processing",
            email: "example@gmail.com",
        },
        {
            id: "489e1d42",
            amount: 125,
            status: "processing",
            email: "example@gmail.com",
        },
        {
            id: "489e1d42",
            amount: 125,
            status: "processing",
            email: "example@gmail.com",
        },
        {
            id: "489e1d42",
            amount: 125,
            status: "processing",
            email: "example@gmail.com",
        },
        {
            id: "489e1d42",
            amount: 125,
            status: "processing",
            email: "example@gmail.com",
        },
        {
            id: "489e1d42",
            amount: 125,
            status: "processing",
            email: "example@gmail.com",
        },
        {
            id: "489e1d42",
            amount: 125,
            status: "processing",
            email: "example@gmail.com",
        },
        {
            id: "489e1d42",
            amount: 125,
            status: "processing",
            email: "example2@gmail.com",
        },
        {
            id: "489e1d42",
            amount: 125,
            status: "processing",
            email: "example1@gmail.com",
        },
        {
            id: "489e1d42",
            amount: 125,
            status: "processing",
            email: "example3@gmail.com",
        },
        {
            id: "489e1d42",
            amount: 125,
            status: "processing",
            email: "example@gmail.com",
        },
        {
            id: "489e1d42",
            amount: 125,
            status: "processing",
            email: "example@gmail.com",
        },
    ];

    

    return (
        <div className="container mx-auto py-10">
            <DataTable columns={columns} data={tasks} />
        </div>
    )
}
export default TasksTable
