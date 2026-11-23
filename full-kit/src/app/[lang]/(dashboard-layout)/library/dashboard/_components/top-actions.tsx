"use client"

import {
  Armchair,
  Bell,
  QrCode,
  RefreshCw,
} from "lucide-react"

import { AddStudentButton } from "@/components/dashboards/add-student-button"
import { Button } from "@/components/ui/button"

export function TopActions() {
  return (
    <div className="col-span-full flex flex-col gap-y-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Library Management
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Real-time admissions, seat allocations &amp; attendance monitoring
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:ms-auto">
        {/* Send Notice - Purple Bell Icon */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-x-2 px-3 text-xs font-semibold text-foreground border-border bg-card hover:bg-accent text-foreground font-bold shadow-xs"
        >
          <Bell className="size-4 text-purple-500 shrink-0" aria-hidden />
          <span>Send Notice</span>
        </Button>

        {/* Give a Seat - Blue Armchair Icon */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-x-2 px-3 text-xs font-semibold text-foreground border-border bg-card hover:bg-accent text-foreground font-bold shadow-xs"
        >
          <Armchair className="size-4 text-blue-500 shrink-0" aria-hidden />
          <span>Give a Seat</span>
        </Button>

        {/* Attendance - Cyan/Teal QrCode Icon */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-x-2 px-3 text-xs font-semibold text-foreground border-border bg-card hover:bg-accent text-foreground font-bold shadow-xs"
        >
          <QrCode className="size-4 text-teal-400 shrink-0" aria-hidden />
          <span>Attendance</span>
        </Button>

        {/* Refresh - Amber/Orange RefreshCw Icon */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-x-2 px-3 text-xs font-semibold text-foreground border-border bg-card hover:bg-accent text-foreground font-bold shadow-xs"
        >
          <RefreshCw className="size-4 text-amber-500 shrink-0" aria-hidden />
          <span>Refresh</span>
        </Button>

        {/* Common Filled Add Student Button with theme primary color */}
        <AddStudentButton />
      </div>
    </div>
  )
}
