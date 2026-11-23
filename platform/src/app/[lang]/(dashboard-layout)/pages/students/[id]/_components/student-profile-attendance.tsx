"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import {
  Armchair,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  DoorClosed,
  History,
  QrCode,
  Timer,
  UserCheck,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import type { StudentProfile } from "@/data/students-data"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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

export function StudentProfileAttendance({
  student,
}: {
  student: StudentProfile
}) {
  // Navigation month state (Default to October 2024 where Aarav has data)
  const [viewYear, setViewYear] = useState(2024)
  const [viewMonth, setViewMonth] = useState(9) // 0-indexed (9 = October)
  const [activeTab, setActiveTab] = useState<"calendar" | "table">("calendar")
  const [selectedDateStr, setSelectedDateStr] = useState<string>("2024-10-29")
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "absent" | "holiday">("all")

  // Regularization Dialog state
  const [regularizeOpen, setRegularizeOpen] = useState(false)
  const [regReason, setRegReason] = useState("Scanner Delay")

  // Helper map for O(1) attendance lookups
  const attendanceMap = useMemo(() => {
    const map = new Map<string, (typeof student.attendanceHistory)[0]>()
    student.attendanceHistory.forEach((log) => {
      map.set(log.date, log)
    })
    return map
  }, [student.attendanceHistory])

  // Get active selected record
  const selectedRecord = attendanceMap.get(selectedDateStr)

  // Compute Calendar Grid Days
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7 // Mon = 0, Sun = 6

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((prev) => prev - 1)
    } else {
      setViewMonth((prev) => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((prev) => prev + 1)
    } else {
      setViewMonth((prev) => prev + 1)
    }
  }

  const monthLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1)
    return format(d, "MMMM yyyy")
  }, [viewYear, viewMonth])

  // Monthly counts
  const presentCount = student.attendanceHistory.filter(
    (l) => l.status === "Present" || l.status === "Half Day"
  ).length
  const lateCount = student.attendanceHistory.filter((l) => l.status === "Late Entry").length
  const absentCount = student.attendanceHistory.filter((l) => l.status === "Absent").length
  const holidayCount = student.attendanceHistory.filter((l) => l.status === "Holiday").length

  const handleRegularizeSubmit = () => {
    setRegularizeOpen(false)
    toast.success(`Attendance updated for ${selectedDateStr}`)
  }

  return (
    <div className="space-y-3 min-w-0 w-full overflow-hidden">
      {/* 1. Core Summary Metrics (Small, compact layout) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 min-w-0">
        <Card className="border-border bg-card p-1.5 px-2.5 shadow-xs rounded-lg min-w-0 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block truncate">
              Attendance Rate
            </span>
            <p className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight mt-0.5 truncate">
              {student.analytics.attendanceRate}%
            </p>
          </div>
          <div className="size-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 ms-2">
            <UserCheck className="size-3" />
          </div>
        </Card>

        <Card className="border-border bg-card p-1.5 px-2.5 shadow-xs rounded-lg min-w-0 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block truncate">
              Present Days
            </span>
            <p className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight mt-0.5 truncate">
              {presentCount} Days
            </p>
          </div>
          <div className="size-6 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 ms-2">
            <CalendarCheck2 className="size-3" />
          </div>
        </Card>

        <Card className="border-border bg-card p-1.5 px-2.5 shadow-xs rounded-lg min-w-0 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block truncate">
              Daily Average
            </span>
            <p className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight mt-0.5 truncate">
              {student.analytics.dailyAverageHours} hrs/d
            </p>
          </div>
          <div className="size-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 ms-2">
            <Clock className="size-3" />
          </div>
        </Card>

        <Card className="border-border bg-card p-1.5 px-2.5 shadow-xs rounded-lg min-w-0 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block truncate">
              Monthly Hours
            </span>
            <p className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight mt-0.5 truncate">
              {student.analytics.monthlyHours} hrs
            </p>
          </div>
          <div className="size-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 ms-2">
            <Timer className="size-3" />
          </div>
        </Card>
      </div>

      {/* 2. Month Navigation & View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 px-3 bg-card border border-border/80 rounded-lg shadow-xs">
        {/* Month Selector */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 border-border hover:bg-accent rounded-md"
            onClick={handlePrevMonth}
            aria-label="Previous Month"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <span className="text-xs sm:text-sm font-bold text-foreground px-2 min-w-[120px] text-center">
            {monthLabel}
          </span>

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 border-border hover:bg-accent rounded-md"
            onClick={handleNextMonth}
            aria-label="Next Month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md border border-border/60">
          <button
            type="button"
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "calendar"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("calendar")}
          >
            <CalendarDays className="size-3.5 text-primary" />
            <span>Calendar</span>
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "table"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("table")}
          >
            <History className="size-3.5 text-emerald-500" />
            <span>Logs</span>
          </button>
        </div>
      </div>

      {/* 3. Main Content Area */}
      {activeTab === "calendar" ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
          {/* Calendar Grid Card */}
          <Card className="xl:col-span-8 border-border bg-card shadow-xs rounded-lg min-w-0 overflow-hidden">
            <CardHeader className="p-3 pb-2 border-b border-border/80 flex flex-row items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-foreground">
                <CalendarDays className="size-3.5 text-primary" />
                <span>Attendance Calendar</span>
              </CardTitle>

              {/* Status Filter */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                    statusFilter === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                    statusFilter === "present"
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground hover:text-emerald-500"
                  }`}
                  onClick={() => setStatusFilter("present")}
                >
                  Present ({presentCount})
                </button>
                <button
                  type="button"
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                    statusFilter === "absent"
                      ? "bg-rose-500 text-white"
                      : "bg-muted text-muted-foreground hover:text-rose-500"
                  }`}
                  onClick={() => setStatusFilter("absent")}
                >
                  Absent ({absentCount})
                </button>
                <button
                  type="button"
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                    statusFilter === "holiday"
                      ? "bg-indigo-500 text-white"
                      : "bg-muted text-muted-foreground hover:text-indigo-500"
                  }`}
                  onClick={() => setStatusFilter("holiday")}
                >
                  Holiday ({holidayCount})
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-3">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <span
                    key={d}
                    className="text-[11px] font-bold text-muted-foreground py-0.5"
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Day cells grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-13 sm:h-14 rounded-lg bg-muted/10 opacity-30" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1
                  const dayStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
                  const log = attendanceMap.get(dayStr)
                  const isSelected = selectedDateStr === dayStr

                  // Compute status
                  const status = log?.status
                  const isPresent = status === "Present" || status === "Half Day"
                  const isLate = status === "Late Entry"
                  const isAbsent = status === "Absent"
                  const isHoliday = status === "Holiday"

                  const matchesFilter =
                    statusFilter === "all" ||
                    (statusFilter === "present" && (isPresent || isLate)) ||
                    (statusFilter === "absent" && isAbsent) ||
                    (statusFilter === "holiday" && isHoliday)

                  // Formatted study hours (e.g. "13h" or "13.5h")
                  const formattedHours = log?.totalHours
                    ? log.totalHours.split(" ")[0] + "h"
                    : null

                  // Color theme styles by status
                  let cellBg = "border-border/40 bg-muted/20 hover:bg-muted/40 text-muted-foreground"
                  let dotColor = "bg-muted-foreground/30"
                  let badgeEl = <span className="text-[10px] text-muted-foreground/40 leading-none">-</span>

                  if (isPresent) {
                    cellBg = "border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/25 dark:border-emerald-500/25 hover:border-emerald-500/60"
                    dotColor = "bg-emerald-500"
                    // Show study hours, NO "Present" text badge
                    badgeEl = (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded leading-none truncate max-w-full">
                        {formattedHours}
                      </span>
                    )
                  } else if (isLate) {
                    cellBg = "border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/25 dark:border-amber-500/25 hover:border-amber-500/60"
                    dotColor = "bg-amber-500"
                    badgeEl = (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded leading-none truncate max-w-full">
                        {formattedHours}
                      </span>
                    )
                  } else if (isAbsent) {
                    cellBg = "border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/25 dark:border-rose-500/25 hover:border-rose-500/60"
                    dotColor = "bg-rose-500"
                    badgeEl = (
                      <span className="text-[9px] font-bold text-rose-700 dark:text-rose-300 bg-rose-500/20 px-1 py-0.5 rounded leading-none truncate">
                        Absent
                      </span>
                    )
                  } else if (isHoliday) {
                    cellBg = "border-indigo-500/25 bg-indigo-500/10 dark:bg-indigo-950/20 dark:border-indigo-500/25 hover:border-indigo-500/50"
                    dotColor = "bg-indigo-500"
                    badgeEl = (
                      <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/20 px-1 py-0.5 rounded leading-none truncate">
                        Holiday
                      </span>
                    )
                  }

                  return (
                    <button
                      key={dayStr}
                      type="button"
                      onClick={() => setSelectedDateStr(dayStr)}
                      className={`h-13 sm:h-14 p-1 sm:p-1.5 rounded-lg border text-start transition-all flex flex-col justify-between cursor-pointer ${cellBg} ${
                        isSelected
                          ? "ring-2 ring-primary ring-offset-1 ring-offset-background font-bold shadow-xs scale-[1.02]"
                          : ""
                      } ${!matchesFilter ? "opacity-30 grayscale-[50%]" : "opacity-100"}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs ${
                            isSelected
                              ? "text-primary font-black"
                              : log
                              ? "text-foreground font-bold"
                              : "text-muted-foreground font-medium"
                          }`}
                        >
                          {dayNum}
                        </span>

                        {log && <span className={`size-1.5 rounded-full ${dotColor}`} />}
                      </div>

                      <div className="w-full flex items-center justify-end">
                        {badgeEl}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Simple Legend */}
              <div className="mt-2.5 pt-2 border-t border-border/70 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span>Present ({presentCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-rose-500" />
                  <span>Absent ({absentCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-indigo-500" />
                  <span>Holiday ({holidayCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500" />
                  <span>Late Entry ({lateCount})</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Summary Card (Small, compact layout) */}
          <Card className="xl:col-span-4 border-border bg-card shadow-xs rounded-lg min-w-0">
            <CardHeader className="p-2.5 px-3 pb-1.5 border-b border-border/80 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-foreground">
                {format(new Date(selectedDateStr + "T00:00:00"), "EEEE, dd MMM yyyy")}
              </CardTitle>

              {selectedRecord ? (
                <Badge
                  className={
                    selectedRecord.status === "Present"
                      ? "border border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] px-2 py-0.5 rounded-md"
                      : selectedRecord.status === "Late Entry" || selectedRecord.status === "Half Day"
                      ? "border border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold text-[11px] px-2 py-0.5 rounded-md"
                      : selectedRecord.status === "Absent"
                      ? "border border-rose-500/25 bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold text-[11px] px-2 py-0.5 rounded-md"
                      : "border border-indigo-500/25 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] px-2 py-0.5 rounded-md"
                  }
                >
                  {selectedRecord.status === "Present" && <CheckCircle2 className="size-3 me-1 inline-block" />}
                  {selectedRecord.status === "Absent" && <XCircle className="size-3 me-1 inline-block" />}
                  {selectedRecord.status === "Holiday" && <Coffee className="size-3 me-1 inline-block" />}
                  {(selectedRecord.status === "Late Entry" || selectedRecord.status === "Half Day") && (
                    <Clock className="size-3 me-1 inline-block" />
                  )}
                  {selectedRecord.status}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-border text-muted-foreground text-[11px] px-2 py-0.5 rounded-md"
                >
                  No Log
                </Badge>
              )}
            </CardHeader>

            <CardContent className="p-2.5 px-3 space-y-2">
              {selectedRecord?.status === "Present" ||
              selectedRecord?.status === "Late Entry" ||
              selectedRecord?.status === "Half Day" ? (
                <>
                  {/* Key Day Details */}
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div className="p-1.5 px-2 rounded-md bg-muted/40 border border-border/70">
                      <span className="text-[9px] text-muted-foreground font-semibold uppercase block">
                        Check-In
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-foreground mt-0.5">
                        {selectedRecord.checkIn}
                      </p>
                    </div>

                    <div className="p-1.5 px-2 rounded-md bg-muted/40 border border-border/70">
                      <span className="text-[9px] text-muted-foreground font-semibold uppercase block">
                        Check-Out
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-foreground mt-0.5">
                        {selectedRecord.checkOut}
                      </p>
                    </div>

                    <div className="p-1.5 px-2 rounded-md bg-muted/40 border border-border/70">
                      <span className="text-[9px] text-muted-foreground font-semibold uppercase block">
                        Study Duration
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-primary mt-0.5">
                        {selectedRecord.totalHours}
                      </p>
                    </div>

                    <div className="p-1.5 px-2 rounded-md bg-muted/40 border border-border/70">
                      <span className="text-[9px] text-muted-foreground font-semibold uppercase block">
                        Method
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-foreground mt-0.5 truncate">
                        {selectedRecord.method}
                      </p>
                    </div>
                  </div>

                  {/* Seat & Shift Info */}
                  <div className="space-y-1 text-xs pt-0.5">
                    <div className="flex items-center justify-between py-0.5 px-2 rounded-md bg-muted/30 border border-border/50 text-[11px]">
                      <span className="text-muted-foreground flex items-center gap-1 font-medium">
                        <Armchair className="size-3 text-primary" />
                        Desk
                      </span>
                      <span className="font-bold text-foreground">
                        {student.seatNo} ({student.floor})
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-0.5 px-2 rounded-md bg-muted/30 border border-border/50 text-[11px]">
                      <span className="text-muted-foreground flex items-center gap-1 font-medium">
                        <Clock className="size-3 text-muted-foreground" />
                        Shift
                      </span>
                      <span className="font-semibold text-foreground">
                        {student.shift.split("(")[0].trim()}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-0.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-xs font-medium rounded-md"
                      onClick={() => setRegularizeOpen(true)}
                    >
                      Regularize Attendance
                    </Button>
                  </div>
                </>
              ) : selectedRecord?.status === "Absent" ? (
                <>
                  <div className="p-2 rounded-md bg-rose-500/10 border border-rose-500/20 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300 block">
                      Absence Notice
                    </span>
                    <p className="text-xs text-foreground font-semibold">
                      {selectedRecord.notes || "No check-in was logged on this date."}
                    </p>
                  </div>

                  <div className="space-y-1 text-xs pt-0.5">
                    <div className="flex items-center justify-between py-0.5 px-2 rounded-md bg-muted/30 border border-border/50 text-[11px]">
                      <span className="text-muted-foreground font-medium">Assigned Seat</span>
                      <span className="font-bold text-foreground">{student.seatNo}</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 px-2 rounded-md bg-muted/30 border border-border/50 text-[11px]">
                      <span className="text-muted-foreground font-medium">Scheduled Shift</span>
                      <span className="font-semibold text-foreground">
                        {student.shift.split("(")[0].trim()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-0.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-xs font-medium rounded-md border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10"
                      onClick={() => setRegularizeOpen(true)}
                    >
                      Submit Leave / Regularization
                    </Button>
                  </div>
                </>
              ) : selectedRecord?.status === "Holiday" ? (
                <>
                  <div className="p-2 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 block">
                      Library Holiday
                    </span>
                    <p className="text-xs text-foreground font-semibold">
                      {selectedRecord.notes || "Scheduled Library Holiday."}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Reading halls remain open for 24/7 key-card access holders.
                    </p>
                  </div>

                  <div className="space-y-1 text-xs pt-0.5">
                    <div className="flex items-center justify-between py-0.5 px-2 rounded-md bg-muted/30 border border-border/50 text-[11px]">
                      <span className="text-muted-foreground font-medium">Assigned Seat</span>
                      <span className="font-bold text-foreground">{student.seatNo}</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 px-2 rounded-md bg-muted/30 border border-border/50 text-[11px]">
                      <span className="text-muted-foreground font-medium">Holiday Access</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Available</span>
                    </div>
                  </div>

                  <div className="pt-0.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-xs font-medium rounded-md border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10"
                      onClick={() => setRegularizeOpen(true)}
                    >
                      Mark Special Study Session
                    </Button>
                  </div>
                </>
              ) : (
                /* Clean Empty State */
                <div className="py-4 px-2 text-center space-y-2">
                  <div className="size-8 rounded-full bg-muted/60 border border-border flex items-center justify-center mx-auto text-muted-foreground">
                    <DoorClosed className="size-3.5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    No Attendance Logged
                  </p>
                  <Button
                    size="sm"
                    className="text-xs font-semibold h-7 px-3 rounded-md bg-primary text-primary-foreground shadow-xs"
                    onClick={() => setRegularizeOpen(true)}
                  >
                    Mark Attendance
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* 4. Complete Table View */
        <Card className="border-border bg-card shadow-xs rounded-lg min-w-0 overflow-hidden">
          <CardHeader className="p-3 pb-2 border-b border-border/80 flex flex-row items-center justify-between">
            <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-foreground">
              <History className="size-3.5 text-emerald-500" />
              <span>Attendance Records</span>
            </CardTitle>
            <span className="text-xs font-medium text-muted-foreground">
              {student.attendanceHistory.length} total entries
            </span>
          </CardHeader>

          <CardContent className="p-0 max-w-full min-w-0">
            <div className="max-h-[440px] overflow-y-auto overflow-x-auto no-scrollbar relative">
              <Table className="min-w-[560px] w-full">
                <TableHeader className="sticky top-0 bg-card z-10 border-b border-border/80">
                  <TableRow className="border-border/80 hover:bg-transparent bg-card">
                  <TableHead className="text-xs font-bold text-muted-foreground ps-4">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">
                    Check-In
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">
                    Check-Out
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">
                    Duration
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">
                    Method
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground pe-4 text-end">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.attendanceHistory.map((log) => {
                  const isPresent = log.status === "Present"
                  const isSelected = selectedDateStr === log.date

                  return (
                    <TableRow
                      key={log.id}
                      className={`border-border/60 cursor-pointer transition-colors ${
                        isSelected ? "bg-primary/10 font-semibold" : "hover:bg-muted/40"
                      }`}
                      onClick={() => {
                        setSelectedDateStr(log.date)
                        setActiveTab("calendar")
                      }}
                    >
                      <TableCell className="font-semibold text-xs text-foreground ps-4">
                        {format(new Date(log.date + "T00:00:00"), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {log.checkIn}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {log.checkOut}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-primary">
                        {log.totalHours}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded text-[11px] font-medium text-foreground">
                          <QrCode className="size-3 text-primary" />
                          {log.method}
                        </span>
                      </TableCell>
                      <TableCell className="pe-4 text-end">
                        <Badge
                          className={
                            log.status === "Present"
                              ? "border border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] rounded-md"
                              : log.status === "Late Entry" || log.status === "Half Day"
                              ? "border border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold text-[11px] rounded-md"
                              : log.status === "Absent"
                              ? "border border-rose-500/25 bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold text-[11px] rounded-md"
                              : "border border-indigo-500/25 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] rounded-md"
                          }
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Clean Regularization Dialog */}
      <Dialog open={regularizeOpen} onOpenChange={setRegularizeOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Attendance Regularization
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Reason</label>
              <Select value={regReason} onValueChange={setRegReason}>
                <SelectTrigger className="h-9 text-xs rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scanner Delay">Scanner Delay / Network Issue</SelectItem>
                  <SelectItem value="Biometric Failure">Biometric Mismatch</SelectItem>
                  <SelectItem value="Manual Approval">Librarian In-Person Approval</SelectItem>
                  <SelectItem value="Mock Test">Mock Test / Exam Extension</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">In Time</label>
                <Input defaultValue="08:00 AM" className="h-9 text-xs rounded-md" />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Out Time</label>
                <Input defaultValue="09:30 PM" className="h-9 text-xs rounded-md" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-md"
              onClick={() => setRegularizeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs rounded-md bg-primary text-primary-foreground font-semibold"
              onClick={handleRegularizeSubmit}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
