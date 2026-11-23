"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type DateTimePickerProps = {
  value?: Date
  onValueChange?: (date?: Date) => void
  formatStr?: string
  popoverContentClassName?: string
  buttonClassName?: string
  placeholder?: string
  modal?: boolean
  disabled?: boolean
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"]

export function DateTimePicker({
  value,
  onValueChange,
  formatStr = "EEE, dd MMM yyyy • hh:mm a",
  popoverContentClassName,
  buttonClassName,
  placeholder = "Pick date and time",
  modal = true,
  disabled = false,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState<Date | undefined>(value)
  const [viewDate, setViewDate] = useState<Date>(value || new Date())
  const [viewMode, setViewMode] = useState<"calendar" | "month_year">("calendar")

  // Refs for auto-scrolling hour and minute lists into view
  const hourListRef = useRef<HTMLDivElement>(null)
  const minuteListRef = useRef<HTMLDivElement>(null)

  // Sync with incoming value prop
  useEffect(() => {
    setCurrentDate(value)
    if (value) {
      setViewDate(value)
    }
  }, [value])

  // Extract current time parts
  const activeDate = currentDate || new Date()
  const rawHours = activeDate.getHours()
  const currentPeriod: "AM" | "PM" = rawHours >= 12 ? "PM" : "AM"
  const currentHour12 = rawHours % 12 || 12
  const currentMinutes = activeDate.getMinutes()

  // Scroll active hour and minute into view when popover opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (hourListRef.current) {
          const activeHourEl = hourListRef.current.querySelector('[data-active="true"]') as HTMLElement | null
          if (activeHourEl) {
            hourListRef.current.scrollTop = activeHourEl.offsetTop - hourListRef.current.offsetTop - 8
          }
        }
        if (minuteListRef.current) {
          const activeMinEl = minuteListRef.current.querySelector('[data-active="true"]') as HTMLElement | null
          if (activeMinEl) {
            minuteListRef.current.scrollTop = activeMinEl.offsetTop - minuteListRef.current.offsetTop - 8
          }
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Helper to update date and fire onValueChange
  const updateDateTime = (newDate: Date) => {
    setCurrentDate(newDate)
    setViewDate(newDate)
    onValueChange?.(newDate)
  }

  // Handle Date Selection (day click)
  const handleSelectDay = (year: number, month: number, day: number) => {
    const base = currentDate ? new Date(currentDate) : new Date()
    const updated = new Date(year, month, day, base.getHours(), base.getMinutes(), 0, 0)
    updateDateTime(updated)
  }

  // Handle Hour Selection
  const handleSelectHour = (hour12: number) => {
    const base = currentDate ? new Date(currentDate) : new Date(viewDate)
    const h24 = (hour12 % 12) + (currentPeriod === "PM" ? 12 : 0)
    base.setHours(h24)
    updateDateTime(base)
  }

  // Handle Minute Selection
  const handleSelectMinute = (minute: number) => {
    const base = currentDate ? new Date(currentDate) : new Date(viewDate)
    base.setMinutes(minute)
    updateDateTime(base)
  }

  // Handle AM/PM Toggle
  const handleSelectPeriod = (period: "AM" | "PM") => {
    if (period === currentPeriod && currentDate) return
    const base = currentDate ? new Date(currentDate) : new Date(viewDate)
    const currentH12 = base.getHours() % 12 || 12
    const newH24 = (currentH12 % 12) + (period === "PM" ? 12 : 0)
    base.setHours(newH24)
    updateDateTime(base)
  }

  // Calendar month navigation
  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
  }

  // Build Calendar Matrix for current viewDate
  const viewYear = viewDate.getFullYear()
  const viewMonth = viewDate.getMonth()

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  const calendarDays: Array<{
    day: number
    month: number
    year: number
    isCurrentMonth: boolean
    isSelected: boolean
    isToday: boolean
  }> = []

  const today = new Date()

  // Previous month overflow days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const m = viewMonth === 0 ? 11 : viewMonth - 1
    const y = viewMonth === 0 ? viewYear - 1 : viewYear
    const isSelected =
      !!currentDate &&
      currentDate.getDate() === d &&
      currentDate.getMonth() === m &&
      currentDate.getFullYear() === y
    const isToday =
      today.getDate() === d && today.getMonth() === m && today.getFullYear() === y

    calendarDays.push({
      day: d,
      month: m,
      year: y,
      isCurrentMonth: false,
      isSelected,
      isToday,
    })
  }

  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const isSelected =
      !!currentDate &&
      currentDate.getDate() === d &&
      currentDate.getMonth() === viewMonth &&
      currentDate.getFullYear() === viewYear
    const isToday =
      today.getDate() === d &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear

    calendarDays.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
      isSelected,
      isToday,
    })
  }

  // Next month overflow days (fill up to 35 or 42 cells)
  const totalSlots = calendarDays.length > 35 ? 42 : 35
  const remaining = totalSlots - calendarDays.length
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1
    const y = viewMonth === 11 ? viewYear + 1 : viewYear
    const isSelected =
      !!currentDate &&
      currentDate.getDate() === d &&
      currentDate.getMonth() === m &&
      currentDate.getFullYear() === y
    const isToday =
      today.getDate() === d && today.getMonth() === m && today.getFullYear() === y

    calendarDays.push({
      day: d,
      month: m,
      year: y,
      isCurrentMonth: false,
      isSelected,
      isToday,
    })
  }

  // Hours list 01-12
  const hours12List = Array.from({ length: 12 }, (_, i) => i + 1)
  // Minutes list 00-59
  const minutesList = Array.from({ length: 60 }, (_, i) => i)

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-md border border-border bg-card px-3.5 text-xs font-medium text-foreground hover:bg-muted/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
            buttonClassName
          )}
        >
          {currentDate ? (
            <span className="font-semibold text-foreground tracking-tight">
              {format(currentDate, formatStr)}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <CalendarIcon className="size-4 text-muted-foreground shrink-0 ms-auto" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
        className={cn(
          "w-auto p-0 z-[200] rounded-md border border-border bg-card text-foreground shadow-2xl overflow-hidden pointer-events-auto",
          popoverContentClassName
        )}
      >
        <div
          className="flex divide-x divide-border"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ============================================================ */}
          {/* LEFT COLUMN: Calendar & Month/Year Switcher (Matches Image 4) */}
          {/* ============================================================ */}
          <div className="w-[270px] p-4 flex flex-col justify-between select-none">
            {viewMode === "calendar" ? (
              <div>
                {/* Header: [Month Year ▾] with [↑] [↓] Navigation Arrows */}
                <div className="flex items-center justify-between pb-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setViewMode("month_year")
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-muted/50"
                  >
                    <span>
                      {MONTH_NAMES[viewMonth]} {viewYear}
                    </span>
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        prevMonth()
                      }}
                      className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        nextMonth()
                      }}
                      className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="Next Month"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Weekday Abbreviations */}
                <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted-foreground pb-2">
                  {WEEKDAYS.map((w, idx) => (
                    <span key={idx} className="py-0.5">
                      {w}
                    </span>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {calendarDays.map((item, idx) => {
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectDay(item.year, item.month, item.day)
                        }}
                        className={cn(
                          "size-8 mx-auto flex items-center justify-center rounded-lg text-xs font-medium transition-all cursor-pointer",
                          !item.isCurrentMonth && "text-muted-foreground/35 hover:text-muted-foreground",
                          item.isCurrentMonth && !item.isSelected && "text-foreground hover:bg-muted/70",
                          item.isToday && !item.isSelected && "border border-primary/50 font-bold",
                          item.isSelected && "bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary/90"
                        )}
                      >
                        {item.day}
                      </button>
                    )
                  })}
                </div>

                {/* Footer: Clear & Today */}
                <div className="flex items-center justify-between pt-3 mt-2 text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentDate(undefined)
                      onValueChange?.(undefined)
                    }}
                    className="text-primary hover:underline text-[12px] font-medium transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      const now = new Date()
                      updateDateTime(now)
                    }}
                    className="text-primary hover:underline text-[12px] font-semibold transition-colors cursor-pointer"
                  >
                    Today
                  </button>
                </div>
              </div>
            ) : (
              /* Month & Year Selection Mode */
              <div className="space-y-4">
                {/* Year Controller */}
                <div className="flex items-center justify-between pb-1 border-b border-border/50">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setViewDate(new Date(viewYear - 1, viewMonth, 1))
                    }}
                    className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="text-sm font-bold text-foreground tracking-wide">
                    {viewYear}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setViewDate(new Date(viewYear + 1, viewMonth, 1))
                    }}
                    className="size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                {/* 12 Months Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {MONTH_SHORT.map((m, mIdx) => {
                    const isSelected = viewMonth === mIdx
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setViewDate(new Date(viewYear, mIdx, 1))
                          setViewMode("calendar")
                        }}
                        className={cn(
                          "py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground font-bold shadow-xs"
                            : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        )}
                      >
                        {m}
                      </button>
                    )
                  })}
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setViewMode("calendar")
                    }}
                    className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                  >
                    ← Back to Calendar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: 3-Column Time Selector (Matches Image 4)       */}
          {/* Hours (01-12) | Minutes (00-59) | Period (AM/PM)             */}
          {/* ============================================================ */}
          <div className="p-3 bg-muted/10 flex gap-2 h-[290px] select-none">
            {/* 1. Hour Column (01-12) */}
            <div
              ref={hourListRef}
              className="w-12 h-full overflow-y-auto space-y-1 pr-0.5 [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.25)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {hours12List.map((h) => {
                const isActive = currentHour12 === h
                const displayStr = String(h).padStart(2, "0")
                return (
                  <button
                    key={h}
                    type="button"
                    data-active={isActive}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectHour(h)
                    }}
                    className={cn(
                      "w-full py-1.5 rounded-md text-xs font-medium text-center transition-colors cursor-pointer block",
                      isActive
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-foreground hover:bg-muted/70"
                    )}
                  >
                    {displayStr}
                  </button>
                )
              })}
            </div>

            {/* 2. Minute Column (00-59) */}
            <div
              ref={minuteListRef}
              className="w-12 h-full overflow-y-auto space-y-1 pr-0.5 [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.25)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {minutesList.map((m) => {
                const isActive = currentMinutes === m
                const displayStr = String(m).padStart(2, "0")
                return (
                  <button
                    key={m}
                    type="button"
                    data-active={isActive}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectMinute(m)
                    }}
                    className={cn(
                      "w-full py-1.5 rounded-md text-xs font-medium text-center transition-colors cursor-pointer block",
                      isActive
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-foreground hover:bg-muted/70"
                    )}
                  >
                    {displayStr}
                  </button>
                )
              })}
            </div>

            {/* 3. AM / PM Period Column */}
            <div className="w-12 h-full space-y-1">
              {(["AM", "PM"] as const).map((p) => {
                const isActive = currentPeriod === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectPeriod(p)
                    }}
                    className={cn(
                      "w-full py-1.5 rounded-md text-xs font-semibold text-center transition-colors cursor-pointer block",
                      isActive
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-foreground hover:bg-muted/70"
                    )}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
