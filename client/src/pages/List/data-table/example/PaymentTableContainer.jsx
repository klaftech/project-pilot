import DataTable from '../components/DataTable'
import {columns} from './payment_columns.jsx'

export function TableContainer() {
    // data
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
            <DataTable columns={columns} data={payments} />
        </div>
    )
}
export default TableContainer
