"use client"

import type { Table } from "@tanstack/react-table"

import { Input } from "@/components/ui/input"
import { InvoiceTableViewOptions } from "./invoice-table-view-options"

interface InvoiceTableToolbarProps<TTable> {
  table: Table<TTable>
}

export function InvoiceTableToolbar<TTable>({
  table,
}: InvoiceTableToolbarProps<TTable>) {
  return (
    <div className="flex gap-x-1.5 items-center">
      <InvoiceTableViewOptions table={table} />
      <Input
        placeholder="Search students by name..."
        className="w-48 sm:w-64 border border-input bg-background hover:bg-accent hover:text-accent-foreground text-xs h-9"
        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("name")?.setFilterValue(event.target.value)
        }
      />
    </div>
  )
}
