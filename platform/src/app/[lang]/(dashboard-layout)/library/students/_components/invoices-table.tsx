"use client"

import { useState } from "react"
import {
  Filter,
  Search,
} from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import type {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import type { InvoiceType } from "../types"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { InvoiceTableViewOptions } from "./invoice-table-view-options"
import { invoicesTableColumns } from "./invoices-table-columns"

interface InvoicesTableProps {
  data: InvoiceType[]
}

export function InvoicesTable({ data }: InvoicesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data: data,
    columns: invoicesTableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-4">
        {/* Left side: Title, and right after it the Search Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle className="text-lg font-bold shrink-0">
            Students Directory
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search students by name..."
              className="ps-8.5 h-9 text-xs border-border bg-background hover:bg-background focus:bg-background text-foreground font-medium shadow-xs"
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
            />
          </div>
        </div>

        {/* Right side: Filter dropdown + Eye button */}
        <div className="flex items-center gap-2">
          {/* Status Filter Dropdown using website select component */}
          <Select
            value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) =>
              table
                .getColumn("status")
                ?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="h-9 w-[145px] text-xs border-border bg-background hover:bg-background font-medium shadow-xs text-foreground">
              <div className="flex items-center gap-1.5 truncate">
                <Filter className="size-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="All Status" />
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">
                <div className="flex items-center gap-x-2">
                  <span className="size-2 rounded-full bg-muted-foreground/60" />
                  <span>All Students</span>
                </div>
              </SelectItem>
              <SelectItem value="Live">
                <div className="flex items-center gap-x-2">
                  <span className="size-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Live</span>
                </div>
              </SelectItem>
              <SelectItem value="Pending">
                <div className="flex items-center gap-x-2">
                  <span className="size-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                  <span className="font-semibold text-amber-700 dark:text-amber-400">Pending</span>
                </div>
              </SelectItem>
              <SelectItem value="Expired">
                <div className="flex items-center gap-x-2">
                  <span className="size-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
                  <span className="font-semibold text-purple-700 dark:text-purple-400">Expired</span>
                </div>
              </SelectItem>
              <SelectItem value="Suspended">
                <div className="flex items-center gap-x-2">
                  <span className="size-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                  <span className="font-semibold text-rose-700 dark:text-rose-400">Suspended</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Eye Button for Column Visibility */}
          <InvoiceTableViewOptions table={table} />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea
          orientation="horizontal"
          className="w-[calc(100vw-2.25rem)] md:w-auto"
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
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
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={invoicesTableColumns.length}
                    className="h-24 text-center"
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
      <CardFooter className="block py-3">
        <DataTablePagination table={table} />
      </CardFooter>
    </Card>
  )
}
