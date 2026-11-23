"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Bell,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Filter,
  Plus,
} from "lucide-react"

import type { DateRangeOption } from "../types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PlatformAdminHeaderProps {
  dateRange: DateRangeOption
  setDateRange: (range: DateRangeOption) => void
  customDateFrom?: string
  customDateTo?: string
  onCustomRangeChange?: (from: string, to: string) => void
  onOpenDialog: (
    dialog: "review-request" | "manual-payment" | "platform-notification"
  ) => void
  pendingCount: number
}

const currentMonthLabel = new Date().toLocaleDateString("en-IN", {
  month: "short",
  year: "numeric",
})

const dateRangeLabels: Record<DateRangeOption, string> = {
  today: "Today",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "this-month": currentMonthLabel,
  quarter: "This Quarter",
  custom: "Custom Range",
}

export function PlatformAdminHeader({
  dateRange,
  setDateRange,
  customDateFrom,
  customDateTo,
  onCustomRangeChange,
  onOpenDialog,
}: PlatformAdminHeaderProps) {
  const params = useParams()
  const lang = (params?.lang as string) || "en"

  // Custom Date Range Modal State
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], [])
  const firstOfMonthStr = useMemo(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
      .toISOString()
      .split("T")[0]
  }, [])

  const [tempFrom, setTempFrom] = useState(customDateFrom || firstOfMonthStr)
  const [tempTo, setTempTo] = useState(customDateTo || todayStr)

  // Defensive cleanup for Radix UI body pointer-events bug
  useEffect(() => {
    if (!isCustomOpen) {
      const timer = setTimeout(() => {
        if (typeof document !== "undefined") {
          document.body.style.pointerEvents = ""
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isCustomOpen])

  const handleOpenCustomDialog = () => {
    setTempFrom(customDateFrom || firstOfMonthStr)
    setTempTo(customDateTo || todayStr)
    setIsCustomOpen(true)
  }

  const handleCloseCustomDialog = () => {
    setIsCustomOpen(false)
    setTimeout(() => {
      if (typeof document !== "undefined") {
        document.body.style.pointerEvents = ""
      }
    }, 50)
  }

  const handleApplyCustom = () => {
    if (!tempFrom) return
    const finalTo = tempTo || tempFrom
    if (onCustomRangeChange) {
      onCustomRangeChange(tempFrom, finalTo)
    }
    setDateRange("custom")
    handleCloseCustomDialog()
  }

  const handleQuickPreset = (
    preset: "7d" | "14d" | "30d" | "this-month" | "last-month"
  ) => {
    const now = new Date()
    let from = new Date()
    let to = new Date()

    if (preset === "7d") {
      from.setDate(now.getDate() - 6)
    } else if (preset === "14d") {
      from.setDate(now.getDate() - 13)
    } else if (preset === "30d") {
      from.setDate(now.getDate() - 29)
    } else if (preset === "this-month") {
      from = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (preset === "last-month") {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      to = new Date(now.getFullYear(), now.getMonth(), 0)
    }

    setTempFrom(from.toISOString().split("T")[0])
    setTempTo(to.toISOString().split("T")[0])
  }

  const selectedDaysCount = useMemo(() => {
    if (!tempFrom || !tempTo) return 1
    const f = new Date(tempFrom).getTime()
    const t = new Date(tempTo).getTime()
    if (isNaN(f) || isNaN(t) || t < f) return 1
    return Math.round((t - f) / (1000 * 60 * 60 * 24)) + 1
  }, [tempFrom, tempTo])

  const formattedDisplayLabel = useMemo(() => {
    if (dateRange === "custom" && customDateFrom && customDateTo) {
      try {
        const fromD = new Date(customDateFrom)
        const toD = new Date(customDateTo)
        const fromStr = fromD.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        })
        const toStr = toD.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
        return `${fromStr} - ${toStr}`
      } catch {
        return "Custom Range"
      }
    }
    return dateRangeLabels[dateRange]
  }, [dateRange, customDateFrom, customDateTo])

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      {/* Left: Clean Title + Live Status + Period Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Control Tower
          </h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/25">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Live
          </span>
        </div>

        <div className="h-5 w-px bg-border/60 hidden sm:block" />

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-semibold rounded-lg border-border/70 bg-card/60"
              >
                <Calendar className="size-3.5 text-muted-foreground" />
                <span>{formattedDisplayLabel}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {(Object.keys(dateRangeLabels) as DateRangeOption[]).map(
                (key) => (
                  <DropdownMenuItem
                    key={key}
                    onSelect={(e) => {
                      if (key === "custom") {
                        e.preventDefault()
                        setTimeout(() => {
                          handleOpenCustomDialog()
                        }, 50)
                      } else {
                        setDateRange(key)
                      }
                    }}
                    className="flex items-center justify-between text-xs cursor-pointer py-2"
                  >
                    <span>{dateRangeLabels[key]}</span>
                    {dateRange === key && (
                      <CheckCircle2 className="size-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {dateRange === "custom" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenCustomDialog}
              className="h-8 px-2 text-xs font-medium gap-1 text-primary border-primary/40 bg-primary/5 hover:bg-primary/10"
              title="Change Custom Date Range"
            >
              <CalendarDays className="size-3.5" />
              <span className="hidden md:inline">Edit Dates</span>
            </Button>
          )}
        </div>
      </div>

      {/* Right: Clean Primary Quick Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onOpenDialog("platform-notification")}
          className="h-8.5 gap-1.5 text-xs font-semibold rounded-lg border-border/70 bg-card/60"
        >
          <Bell className="size-3.5 text-sky-500" />
          <span>Broadcast</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onOpenDialog("manual-payment")}
          className="h-8.5 gap-1.5 text-xs font-semibold rounded-lg border-border/70 bg-card/60"
        >
          <CreditCard className="size-3.5 text-emerald-500" />
          <span>Record Payment</span>
        </Button>

        <Link href={`/${lang}/platform/libraries/add`}>
          <Button
            size="sm"
            className="h-8.5 gap-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Add Library</span>
          </Button>
        </Link>
      </div>

      {/* Custom Date Range Picker Dialog */}
      <Dialog
        open={isCustomOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseCustomDialog()
          } else {
            setIsCustomOpen(true)
          }
        }}
      >
        <DialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            if (typeof document !== "undefined") {
              document.body.style.pointerEvents = ""
            }
          }}
          className="max-w-md p-5"
        >
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <CalendarDays className="size-5 text-primary" />
              Custom Date Range Filter
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select custom start and end dates to filter all dashboard KPIs,
              revenue graphs, and growth statistics.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Quick Presets */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Quick Presets
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "7d", label: "Last 7 Days" },
                  { id: "14d", label: "Last 14 Days" },
                  { id: "30d", label: "Last 30 Days" },
                  { id: "this-month", label: "This Month" },
                  { id: "last-month", label: "Last Month" },
                ].map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2.5 py-0 rounded-md border-border/80 hover:bg-primary/10 hover:border-primary/40"
                    onClick={() =>
                      handleQuickPreset(
                        preset.id as
                          | "7d"
                          | "14d"
                          | "30d"
                          | "this-month"
                          | "last-month"
                      )
                    }
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label
                  htmlFor="custom-from"
                  className="text-xs font-semibold text-foreground"
                >
                  From (Start Date)
                </Label>
                <Input
                  id="custom-from"
                  type="date"
                  value={tempFrom}
                  max={tempTo || todayStr}
                  onChange={(e) => setTempFrom(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="custom-to"
                  className="text-xs font-semibold text-foreground"
                >
                  To (End Date)
                </Label>
                <Input
                  id="custom-to"
                  type="date"
                  value={tempTo}
                  min={tempFrom}
                  max={todayStr}
                  onChange={(e) => setTempTo(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Range Summary */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/40 text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Filter className="size-3.5 text-primary" />
                Duration:
              </span>
              <Badge variant="secondary" className="font-semibold text-xs">
                {selectedDaysCount} {selectedDaysCount === 1 ? "Day" : "Days"}{" "}
                selected
              </Badge>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCloseCustomDialog}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-primary text-primary-foreground font-bold hover:bg-primary/90"
              onClick={handleApplyCustom}
              disabled={!tempFrom}
            >
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
