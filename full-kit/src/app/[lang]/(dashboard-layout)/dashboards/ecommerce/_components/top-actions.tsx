"use client"

import { Download } from "lucide-react"

import { AddStudentButton } from "@/components/dashboards/add-student-button"
import { QuickRegistrationsDialog } from "@/components/dashboards/quick-registrations-dialog"
import { Button } from "@/components/ui/button"

export function TopActions() {
  return (
    <div className="col-span-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      {/* Left side: Horizontal Quick Information card with new registration counter */}
      <QuickRegistrationsDialog />

      {/* Right side: Action Buttons */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Export CSV - Blue Download Icon */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-x-2 px-3 text-xs font-semibold text-foreground border-border/80 bg-card/60 hover:bg-accent cursor-pointer"
        >
          <Download className="size-4 text-blue-500 shrink-0" aria-hidden />
          <span>Export CSV</span>
        </Button>

        {/* Common Filled Add Student Button with theme primary color */}
        <AddStudentButton />
      </div>
    </div>
  )
}
