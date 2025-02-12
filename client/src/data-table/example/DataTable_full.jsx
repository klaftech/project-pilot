import { useState } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import { DataTablePagination } from './components/DataTablePagination';
import { DataTableViewOptions } from './components/DataTableViewOptions';


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

            <DataTableViewOptions table={table} />
            {/* Adds Column Visibility */}
            {/*
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter(
                    (column) => column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            */}
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
          
          <div className="py-4">
            <DataTablePagination table={table} />

            {/* Begin Pagination Buttons */}
            {/*
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
            */}

            {/* Display row selection count */}
            {/*}
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            */}
          
          </div>
          
          
      </div>
      )
}

export default DataTable
