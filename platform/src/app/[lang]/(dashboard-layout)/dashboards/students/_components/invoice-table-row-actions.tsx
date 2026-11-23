"use client"

import {
  Armchair,
  EllipsisVertical,
  Pencil,
  RotateCcw,
  ShieldAlert,
  Trash2,
  UserCheck,
} from "lucide-react"

import type { Row } from "@tanstack/react-table"
import type { StudentType } from "../types"

import { WhatsAppIcon } from "@/components/icons/whatsapp-icon"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import Link from "next/link"

interface InvoiceTableRowActionsProps<TData> {
  row: Row<TData>
}

export function InvoiceTableRowActions<TData>({
  row,
}: InvoiceTableRowActionsProps<TData>) {
  const student = row.original as StudentType

  return (
    <div className="flex items-center justify-end gap-x-1 me-2">
      {/* Quick Edit Action Button */}
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
        title={`Edit ${student.name}`}
      >
        <Link href={`/en/pages/students/${student.studentId}/edit`}>
          <Pencil className="size-4" aria-hidden />
          <span className="sr-only">Edit</span>
        </Link>
      </Button>

      {/* WhatsApp Action Button with real WhatsApp icon */}
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/15 cursor-pointer"
        title={`WhatsApp message to ${student.name} (${student.phone})`}
        onClick={() => {
          const cleanPhone = student.phone.replace(/[^0-9]/g, "")
          window.open(`https://wa.me/${cleanPhone}`, "_blank")
        }}
      >
        <WhatsAppIcon className="size-4 shrink-0 fill-current text-emerald-500" />
        <span className="sr-only">WhatsApp</span>
      </Button>

      {/* More Options Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="More actions"
          >
            <EllipsisVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem asChild>
            <Link
              href={`/en/pages/students/${student.studentId}`}
              className="gap-2 cursor-pointer w-full flex items-center"
            >
              <UserCheck className="size-4 text-blue-500" />
              <span>View Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={`/en/pages/students/${student.studentId}/edit`}
              className="gap-2 cursor-pointer w-full flex items-center"
            >
              <Pencil className="size-4 text-amber-500" />
              <span>Edit Details</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 cursor-pointer">
            <Armchair className="size-4 text-teal-500" />
            <span>Assign / Change Seat</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2"
            onClick={() => {
              const cleanPhone = student.phone.replace(/[^0-9]/g, "")
              window.open(`https://wa.me/${cleanPhone}`, "_blank")
            }}
          >
            <WhatsAppIcon className="size-4 text-emerald-400 fill-current" />
            <span>Send WhatsApp</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <RotateCcw className="size-4 text-purple-400" />
            <span>Renew Membership</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-amber-500 focus:text-amber-500">
            <ShieldAlert className="size-4" />
            <span>Suspend Student</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
            <Trash2 className="size-4" />
            <span>Delete Student</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
