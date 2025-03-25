
import { DataTableColumnHeader } from "./components/DataTableColumnHeader";
import { createColumnHelper } from "@tanstack/react-table";
const columnHelper = createColumnHelper();
import StatusBadge from "@/components/StatusBadge";

import { 
  MoreHorizontal,
  ArrowUpDown 
} from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useNavigate } from "react-router";

// {
//     "id": "591",
//     "name": "Level Site",
//     "start": "2025-04-01",
//     "end": "2025-04-15",
//     "days_length": 14,
//     "progress": 0
// },

const columns = [
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }),
  
  columnHelper.accessor(
    "name", {
        // header: "Tasks",
        // header: () => <div className="text-right">Tasks</div>,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Task Name" />
        ),
    }
  ),

  // columnHelper.display({
  //   id: "status",
  //   header: "Status",
  //   cell: ({ row }) => {  
  //       // return <div className="text-right font-medium">Pending</div>;
  //       return <StatusBadge task={row.original} />
  //   },
  //   enableSorting: false,
  //   enableHiding: true,
  // }),

  columnHelper.accessor(
    "progress", 
    {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Progress" />
        ),
        cell: ({ row }) => {
            const progress = parseFloat(row.getValue("progress"));        
            return <div className="text-left font-medium">{progress}%</div>;
        },
    }
  ),

  columnHelper.accessor(
    "days_length", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Length" />
        ),
        cell: ({ row }) => {
          const length = parseFloat(row.getValue("days_length"));        
          return <div className="text-left font-medium">{length} days</div>;
        },
    }
  ),

  // columnHelper.accessor("start", {
  //   header: ({ column }) => (
  //       <DataTableColumnHeader column={column} title="Start Date" />
  //   ),
  //   cell: ({ row }) => {
  //       const date = new Date(row.getValue("start"));
  //       const formatted = new Intl.DateTimeFormat("en-US", {
  //       year: 'numeric',
  //       month: '2-digit',
  //       day: '2-digit'
  //     }).format(date)
  //     return <div className="text-left font-medium">{formatted}</div>;
  //   },
  // }),

  // columnHelper.accessor("end", {
  //   header: ({ column }) => (
  //       <DataTableColumnHeader column={column} title="End Date" className="text-right" />
  //   ),
  //   cell: ({ row }) => {
  //       const date = new Date(row.getValue("end"));
  //       const formatted = new Intl.DateTimeFormat("en-US", {
  //       year: 'numeric',
  //       month: '2-digit',
  //       day: '2-digit'
  //     }).format(date)
  //     return <div className="text-left font-medium">{formatted}</div>;
  //   },
  // }),


  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const task = row.original;
      const navigate = useNavigate();
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(task.name+', '+task.start+' - '+task.end)}
            >
              Copy task details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/task/'+task.id)}>View task</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),

//   columnHelper.accessor(
//     "name", {
//         header: "Name",
//     }
//   ),
    
//   columnHelper.accessor(
//     "email", 
//     {
//       header: ({ column }) => (
//         <DataTableColumnHeader column={column} title="Email" />
//       ),
//     }
//   ),

//   columnHelper.accessor("amount", {
//     header: () => <div className="text-right">Amount</div>,
//     cell: ({ row }) => {
//       const amount = parseFloat(row.getValue("amount"));
//       const formatted = new Intl.NumberFormat("en-US", {
//         style: "currency",
//         currency: "USD",
//       }).format(amount);
    
//       return <div className="text-right font-medium">{formatted}</div>;
//     },
//   }),

//   columnHelper.display({
//     id: "actions",
//     cell: ({ row }) => {
//       const payment = row.original;

//       return (
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="ghost" className="h-8 w-8 p-0">
//               <span className="sr-only">Open menu</span>
//               <MoreHorizontal className="h-4 w-4" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end">
//             <DropdownMenuLabel>Actions</DropdownMenuLabel>
//             <DropdownMenuItem
//               onClick={() => navigator.clipboard.writeText(payment.id)}
//             >
//               Copy payment ID
//             </DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem>View customer</DropdownMenuItem>
//             <DropdownMenuItem>View payment details</DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       );
//     },
//   }),


];

export {columns}