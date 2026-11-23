"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Armchair,
  Bell,
  QrCode,
  RefreshCw,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"
import { AddStudentButton } from "@/components/dashboards/add-student-button"
import { Button } from "@/components/ui/button"

export function TopActions() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

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
          asChild
          variant="outline"
          size="sm"
          className="h-9 gap-x-2 px-3 text-xs font-semibold text-foreground border-border bg-card hover:bg-accent text-foreground font-bold shadow-xs cursor-pointer"
        >
          <Link href={ensureLocalizedPathname("/pages/notifications", lang)}>
            <Bell className="size-4 text-purple-500 shrink-0" aria-hidden />
            <span>Send Notice</span>
          </Link>
        </Button>

        {/* Give a Seat - Blue Armchair Icon */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-9 gap-x-2 px-3 text-xs font-semibold text-foreground border-border bg-card hover:bg-accent text-foreground font-bold shadow-xs cursor-pointer"
        >
          <Link href={ensureLocalizedPathname("/pages/seats", lang)}>
            <Armchair className="size-4 text-blue-500 shrink-0" aria-hidden />
            <span>Give a Seat</span>
          </Link>
        </Button>

        {/* Attendance - Cyan/Teal QrCode Icon */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-9 gap-x-2 px-3 text-xs font-semibold text-foreground border-border bg-card hover:bg-accent text-foreground font-bold shadow-xs cursor-pointer"
        >
          <Link href={ensureLocalizedPathname("/pages/attendance", lang)}>
            <QrCode className="size-4 text-teal-400 shrink-0" aria-hidden />
            <span>Attendance</span>
          </Link>
        </Button>

        {/* Refresh - Amber/Orange RefreshCw Icon */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="h-9 gap-x-2 px-3 text-xs font-semibold text-foreground border-border bg-card hover:bg-accent text-foreground font-bold shadow-xs cursor-pointer"
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