"use client"

import {
  Armchair,
  CheckCircle2,
  Clock,
  TriangleAlert,
} from "lucide-react"

import type { ColumnDef } from "@tanstack/react-table"
import type { StudentType } from "../types"

import { formatDate } from "@/lib/utils"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header"
import { InvoiceTableRowActions } from "./invoice-table-row-actions"

import Link from "next/link"

export const invoicesTableColumns: ColumnDef<StudentType>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <div className="ps-4">
        <DataTableColumnHeader column={column} title="Student" />
      </div>
    ),
    cell: ({ row }) => {
      const student = row.original
      const initials = student.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()

      return (
        <div className="flex items-center gap-x-3 py-1 ps-4">
          <Link
            href={`/en/pages/students/${student.studentId}`}
            className="shrink-0 hover:opacity-85 transition-opacity"
          >
            <Avatar className="size-9 rounded-full border border-border/80">
              <AvatarImage src={student.avatar} alt={student.name} />
              <AvatarFallback className="text-xs font-semibold bg-muted">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0">
            <Link
              href={`/en/pages/students/${student.studentId}`}
              className="font-semibold text-foreground text-sm hover:underline hover:text-primary cursor-pointer truncate block"
            >
              {student.name}
            </Link>
            <div className="text-xs text-muted-foreground flex items-center gap-x-1.5 truncate">
              <span className="text-primary font-semibold">{student.studentId}</span>
              <span>•</span>
              <span className="truncate font-medium">{student.phone}</span>
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "seatNo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Seat No" />
    ),
    cell: ({ row }) => {
      const seatNo = row.getValue("seatNo") as string

      if (seatNo === "Unassigned") {
        return (
          <Badge
            variant="secondary"
            className="text-muted-foreground text-xs font-normal"
          >
            Unassigned
          </Badge>
        )
      }

      return (
        <Badge
          variant="outline"
          className="border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-500/10 font-semibold gap-1.5 py-0.5"
        >
          <Armchair className="size-3.5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
          <span>{seatNo}</span>
        </Badge>
      )
    },
  },
  {
    accessorKey: "shift",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Shift & Plan" />
    ),
    cell: ({ row }) => {
      const student = row.original

      return (
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{student.shift}</p>
          <p className="text-[11px] text-muted-foreground font-medium truncate">{student.plan}</p>
        </div>
      )
    },
  },
  {
    accessorKey: "joinDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Join Date" />
    ),
    cell: ({ row }) => {
      const joinDate = row.getValue("joinDate") as string
      return <span className="text-xs text-foreground font-semibold">{formatDate(joinDate)}</span>
    },
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => {
      const dueDate = row.getValue("dueDate") as string
      return <span className="text-xs text-foreground font-semibold">{formatDate(dueDate)}</span>
    },
  },
  {
    accessorKey: "feeStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fee Status" />
    ),
    cell: ({ row }) => {
      const feeStatus = row.getValue("feeStatus") as StudentType["feeStatus"]

      if (feeStatus === "Paid") {
        return (
          <Badge className="border border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold gap-1.5 px-2.5 py-0.5">
            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden />
            <span>Paid</span>
          </Badge>
        )
      }

      if (feeStatus === "Pending") {
        return (
          <Badge className="border border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold gap-1.5 px-2.5 py-0.5">
            <Clock className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden />
            <span>Pending</span>
          </Badge>
        )
      }

      return (
        <Badge className="border border-rose-500/25 bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold gap-1.5 px-2.5 py-0.5">
          <TriangleAlert className="size-3.5 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden />
          <span>Overdue</span>
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as StudentType["status"]

      if (status === "Live") {
        return (
          <Badge className="border border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold gap-1.5 px-2.5 py-0.5">
            <span className="size-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse" />
            <span>Live</span>
          </Badge>
        )
      }

      if (status === "Pending") {
        return (
          <Badge className="border border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold gap-1.5 px-2.5 py-0.5">
            <span className="size-2 rounded-full bg-amber-500 dark:bg-amber-400 shadow-sm shadow-amber-400/80" />
            <span>Pending</span>
          </Badge>
        )
      }

      if (status === "Expired") {
        return (
          <Badge className="border border-purple-500/25 bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold gap-1.5 px-2.5 py-0.5">
            <span className="size-2 rounded-full bg-purple-500 dark:bg-purple-400 shadow-sm shadow-purple-400/80" />
            <span>Expired</span>
          </Badge>
        )
      }

      return (
        <Badge className="border border-rose-500/25 bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold gap-1.5 px-2.5 py-0.5">
          <span className="size-2 rounded-full bg-rose-500 dark:bg-rose-400 shadow-sm shadow-rose-400/80" />
          <span>Suspended</span>
        </Badge>
      )
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <InvoiceTableRowActions row={row} />,
  },
]
