import { useState } from 'react'

import { DataTablePagination } from './DataTablePagination';
import { DataTableViewOptions } from './DataTableViewOptions';

import { Input } from "@/components/ui/input"
import { 
  useReactTable,
  flexRender, 
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


function DataTable({columns,data}) {
    const [sorting, setSorting] = useState()
    const [columnFilters, setColumnFilters] = useState()
    const [columnVisibility, setColumnVisibility] = useState()
    const [rowSelection, setRowSelection] = useState({})

    const table = useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(), //enables pagination
      onSortingChange: setSorting, //enables sorting
      getSortedRowModel: getSortedRowModel(), //enables sorting
      onColumnFiltersChange: setColumnFilters, //enables filters
      getFilteredRowModel: getFilteredRowModel(), //enables filters
      onColumnVisibilityChange: setColumnVisibility, //enables column visibility
      onRowSelectionChange: setRowSelection,
      state: {
        sorting, //stores sorting state
        columnFilters, //stores filter state
        columnVisibility, //stores column visibility state
        rowSelection,
      },
    });
    
    return (
        <div>

          <div className="flex items-center">
            {/* Adds Filters */}  
            <div className="flex items-center py-4">
              <Input
                placeholder="Filter emails..."
                value={(table.getColumn("email")?.getFilterValue()) ?? ""}
                onChange={(event) =>
                  table.getColumn("email")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
            </div>
            
             {/* Adds Column Visibility */}
            <DataTableViewOptions table={table} />
          </div>

          {/* Begin Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Adds Pagination & Row Selection Count */}
          <div className="py-4">
            <DataTablePagination table={table} />          
          </div>
          
      </div>
      )
}

export default DataTable
