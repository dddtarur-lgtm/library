"use client"

import { useEffect, useState } from "react"
import {
  Armchair,
  ExternalLink,
  LayoutGrid,
  Rows,
  Search,
  Wrench,
} from "lucide-react"

import {
  floorsList,
  initialSeatsData,
  type SeatAllocation,
  type SeatItem,
  type ShiftType,
} from "@/data/seats-data"
import type { StudentProfile } from "@/data/students-data"
import { getInitials } from "@/lib/utils"
import type { LocaleType } from "@/types"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { seatingTemplates } from "@/data/seating-templates"
import {
  convertTemplateToElements,
  createFloorLayout,
  createSampleLayout,
  getStorageKeyForFloor,
  SEATS_DATA_STORAGE_KEY,
  SEATING_STORAGE_KEY,
  type CanvasElement,
} from "../builder/seating-editor-types"
import { SeatDetailDialog } from "./seat-detail-dialog"
import { SeatsFloorBlueprint } from "./seats-floor-blueprint"

interface SeatsInteractiveMapProps {
  lang: LocaleType
}

export function SeatsInteractiveMap({ lang }: SeatsInteractiveMapProps) {
  // Read floor from URL query if present
  const [selectedFloor, setSelectedFloor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("floor")
      if (p) return p
    }
    return "Ground Floor"
  })
  const [activeShift, setActiveShift] = useState<ShiftType>("Morning")
  const [searchQuery, setSearchQuery] = useState<string>("")
  
  // Persisted seats database with fallback to initialSeatsData
  const [seats, setSeats] = useState<SeatItem[]>(() => {
    if (typeof window === "undefined") return initialSeatsData
    try {
      const saved = localStorage.getItem(SEATS_DATA_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return initialSeatsData
  })
  const [selectedSeat, setSelectedSeat] = useState<SeatItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<"blueprint" | "grid">("blueprint")

  // Persist seats whenever student allocations change
  useEffect(() => {
    try {
      localStorage.setItem(SEATS_DATA_STORAGE_KEY, JSON.stringify(seats))
      window.dispatchEvent(new Event("storage"))
    } catch {}
  }, [seats])

  // Normalize layout elements ensuring user's custom positions and component sizes from builder are faithfully preserved
  const normalizeLayout = (rawElements: CanvasElement[]): CanvasElement[] => {
    if (!Array.isArray(rawElements) || rawElements.length === 0) {
      return createSampleLayout()
    }

    // Sanitize and preserve exact user-defined coordinates, sizes, labels and statuses from builder
    return rawElements.map((el) => {
      const isSeatOrPc = el.type === "seat" || el.type === "pc"
      return {
        ...el,
        x: typeof el.x === "number" && !isNaN(el.x) ? el.x : 0,
        y: typeof el.y === "number" && !isNaN(el.y) ? el.y : 0,
        w: isSeatOrPc ? Math.max(Number(el.w) || 88, 88) : Math.max(20, Number(el.w) || 40),
        h: isSeatOrPc ? Math.max(Number(el.h) || 116, 116) : Math.max(20, Number(el.h) || 40),
        label: el.label || "",
        type: el.type || "seat",
      }
    })
  }

  // Load blueprint layout for the currently selected floor
  const [builderLayout, setBuilderLayout] = useState<{
    name: string
    elements: CanvasElement[]
    canvasWidth?: number
    canvasHeight?: number
  }>(() => {
    const defaultName = `Central Library — ${selectedFloor}`
    const sample = createFloorLayout(selectedFloor)
    if (typeof window === "undefined") {
      return {
        name: defaultName,
        elements: sample,
      }
    }
    try {
      const storageKey = getStorageKeyForFloor(selectedFloor)
      const raw = localStorage.getItem(storageKey) || localStorage.getItem(SEATING_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return {
            name: defaultName,
            elements: normalizeLayout(parsed),
          }
        }
        if (parsed.elements && Array.isArray(parsed.elements)) {
          return {
            name: parsed.name || defaultName,
            elements: normalizeLayout(parsed.elements),
            canvasWidth: parsed.canvasWidth,
            canvasHeight: parsed.canvasHeight,
          }
        }
      }
    } catch {
      // fallback
    }
    return {
      name: defaultName,
      elements: sample,
    }
  })

  // Synchronize layout when floor changes or when updated in builder across tabs/windows
  useEffect(() => {
    const reload = () => {
      try {
        const storageKey = getStorageKeyForFloor(selectedFloor)
        const raw = localStorage.getItem(storageKey) || localStorage.getItem(SEATING_STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            setBuilderLayout({
              name: `Central Library — ${selectedFloor}`,
              elements: normalizeLayout(parsed),
            })
            return
          }
          if (parsed.elements && Array.isArray(parsed.elements)) {
            setBuilderLayout({
              name: parsed.name || `Central Library — ${selectedFloor}`,
              elements: normalizeLayout(parsed.elements),
              canvasWidth: parsed.canvasWidth,
              canvasHeight: parsed.canvasHeight,
            })
            return
          }
        }
        // Fallback default floor layout
        setBuilderLayout({
          name: `Central Library — ${selectedFloor}`,
          elements: normalizeLayout(createFloorLayout(selectedFloor)),
        })
      } catch {
        // ignore
      }
    }

    reload()
    window.addEventListener("storage", reload)
    window.addEventListener("focus", reload)
    document.addEventListener("visibilitychange", reload)
    return () => {
      window.removeEventListener("storage", reload)
      window.removeEventListener("focus", reload)
      document.removeEventListener("visibilitychange", reload)
    }
  }, [selectedFloor])

  // Get seats on current floor (never remove non-matching seats during search)
  const floorSeats = seats.filter((seat) => seat.floor === selectedFloor)

  // Group by rows for grid view
  const rows = Array.from(new Set(floorSeats.map((s) => s.row))).sort()

  const handleSeatClick = (seat: SeatItem) => {
    // If synthesized seat not yet present in seats array, persist it
    setSeats((prev) => {
      if (prev.some((s) => s.id === seat.id)) return prev
      return [...prev, seat]
    })
    setSelectedSeat(seat)
    setDialogOpen(true)
  }

  const shiftKey =
    activeShift === "Morning"
      ? "morning"
      : activeShift === "Evening"
        ? "evening"
        : "fullDay"

  // Handler: Direct Student Assignment (Syncs with dialog and floor builder layout)
  const handleAssignStudent = (
    seatId: string,
    shift: ShiftType,
    student: StudentProfile
  ) => {
    const targetShiftKey =
      shift === "Morning"
        ? "morning"
        : shift === "Evening"
          ? "evening"
          : "fullDay"

    const newAllocation: SeatAllocation = {
      studentId: student.studentId,
      studentName: student.name,
      avatar: student.avatar,
      planName: student.plan,
      planEnd: student.dueDate || "2024-12-31",
      allocatedAt: new Date().toISOString().split("T")[0],
      shift,
    }

    let updatedTargetSeat: SeatItem | undefined

    setSeats((prev) =>
      prev.map((s) => {
        if (s.id !== seatId) return s
        const updatedShifts = { ...s.shifts, [targetShiftKey]: newAllocation }
        updatedTargetSeat = {
          ...s,
          status: "Occupied",
          shifts: updatedShifts,
          history: [
            {
              id: `sh-${Date.now()}`,
              studentName: student.name,
              studentId: student.studentId,
              from: new Date().toISOString().split("T")[0],
              to: "Current",
              shift,
              allocatedBy: "Library Admin",
              reason: "Direct assignment from seat map",
            },
            ...s.history,
          ],
        }
        return updatedTargetSeat
      })
    )

    if (updatedTargetSeat) {
      setSelectedSeat(updatedTargetSeat)
    }

    // Sync builder layout status so /pages/seats/builder is 100% aligned
    setBuilderLayout((prev) => {
      const targetLabel = updatedTargetSeat?.seatNo?.toLowerCase() || ""
      const newElements = prev.elements.map((el) => {
        if (
          el.id === seatId ||
          `canvas-${el.id}` === seatId ||
          (targetLabel && el.label.toLowerCase() === targetLabel)
        ) {
          return { ...el, status: "taken" as const }
        }
        return el
      })
      const newLayout = { ...prev, elements: newElements }
      try {
        const storageKey = getStorageKeyForFloor(selectedFloor)
        localStorage.setItem(storageKey, JSON.stringify(newLayout))
        if (selectedFloor === "Ground Floor") {
          localStorage.setItem(SEATING_STORAGE_KEY, JSON.stringify(newLayout))
        }
        window.dispatchEvent(new Event("storage"))
      } catch {}
      return newLayout
    })
  }

  // Handler: Vacate Seat (Syncs with dialog and floor builder layout)
  const handleVacateSeat = (seatId: string, shift: ShiftType) => {
    const targetShiftKey =
      shift === "Morning"
        ? "morning"
        : shift === "Evening"
          ? "evening"
          : "fullDay"

    let updatedTargetSeat: SeatItem | undefined

    setSeats((prev) =>
      prev.map((s) => {
        if (s.id !== seatId) return s
        const updatedShifts = { ...s.shifts }
        delete updatedShifts[targetShiftKey]
        const hasOtherShifts = Object.keys(updatedShifts).length > 0
        updatedTargetSeat = {
          ...s,
          status: hasOtherShifts ? "Occupied" : "Available",
          shifts: updatedShifts,
        }
        return updatedTargetSeat
      })
    )

    if (updatedTargetSeat) {
      setSelectedSeat(updatedTargetSeat)
    }

    // Sync builder layout status
    setBuilderLayout((prev) => {
      const targetLabel = updatedTargetSeat?.seatNo?.toLowerCase() || ""
      const isStillOccupied = updatedTargetSeat?.status === "Occupied"
      const newElements = prev.elements.map((el) => {
        if (
          el.id === seatId ||
          `canvas-${el.id}` === seatId ||
          (targetLabel && el.label.toLowerCase() === targetLabel)
        ) {
          return { ...el, status: isStillOccupied ? ("taken" as const) : ("free" as const) }
        }
        return el
      })
      const newLayout = { ...prev, elements: newElements }
      try {
        const storageKey = getStorageKeyForFloor(selectedFloor)
        localStorage.setItem(storageKey, JSON.stringify(newLayout))
        if (selectedFloor === "Ground Floor") {
          localStorage.setItem(SEATING_STORAGE_KEY, JSON.stringify(newLayout))
        }
        window.dispatchEvent(new Event("storage"))
      } catch {}
      return newLayout
    })
  }

  // Handler: Toggle Maintenance Mode
  const handleToggleMaintenance = (seatId: string, isMaintenance: boolean) => {
    setSeats((prev) =>
      prev.map((s) => {
        if (s.id !== seatId) return s
        const updated: SeatItem = {
          ...s,
          status: isMaintenance ? "Maintenance" : "Available",
          notes: isMaintenance
            ? "Power socket or hardware repair in progress"
            : undefined,
        }
        setSelectedSeat((cur) => (cur && cur.id === seatId ? updated : cur))
        return updated
      })
    )
  }

  // Check if search query is active
  const hasSearch = searchQuery.trim().length > 0
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const checkSeatMatch = (seat: SeatItem) => {
    if (!hasSearch) return false
    const matchNo = seat.seatNo.toLowerCase().includes(normalizedQuery)
    const morningStudent = seat.shifts.morning
    const eveningStudent = seat.shifts.evening
    const fullDayStudent = seat.shifts.fullDay

    const matchMorning =
      morningStudent?.studentName.toLowerCase().includes(normalizedQuery) ||
      morningStudent?.studentId.toLowerCase().includes(normalizedQuery)
    const matchEvening =
      eveningStudent?.studentName.toLowerCase().includes(normalizedQuery) ||
      eveningStudent?.studentId.toLowerCase().includes(normalizedQuery)
    const matchFullDay =
      fullDayStudent?.studentName.toLowerCase().includes(normalizedQuery) ||
      fullDayStudent?.studentId.toLowerCase().includes(normalizedQuery)

    return matchNo || matchMorning || matchEvening || matchFullDay
  }

  return (
    <div className="space-y-3.5">
      {/* Controls Bar conforming to theme styling: rounded-lg border border-border bg-card */}
      <div className="rounded-lg border border-border p-2.5 sm:p-3 bg-card shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* 1. Search Field FIRST on the left */}
          <div className="relative w-full md:w-[260px] shrink-0">
            <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search seat or student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-background rounded-md"
            />
          </div>

          {/* Right Group: Floor Tabs, Shift Dropdown, and View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle: Blueprint vs Row Cards */}
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md border border-border/60">
              <button
                type="button"
                onClick={() => setViewMode("blueprint")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  viewMode === "blueprint"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Visual Floor Layout from Builder"
              >
                <LayoutGrid className="size-3.5" />
                <span>Blueprint Map</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Traditional Row Cards Grid"
              >
                <Rows className="size-3.5" />
                <span>Row Cards</span>
              </button>
            </div>

            <div className="h-5 w-px bg-border hidden sm:block" />

            {/* 2. Floor Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Floor:
              </span>
              <Tabs
                value={selectedFloor}
                onValueChange={setSelectedFloor}
                className="h-8"
              >
                <TabsList className="h-8 p-1 bg-muted/60 rounded-md">
                  {floorsList.map((f) => (
                    <TabsTrigger
                      key={f.id}
                      value={f.name}
                      className="text-xs h-6 px-3 font-medium whitespace-nowrap rounded-sm"
                    >
                      {f.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* 3. Shift Switcher as a Dropdown List */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Shift:
              </span>
              <Select
                value={activeShift}
                onValueChange={(v) => setActiveShift(v as ShiftType)}
              >
                <SelectTrigger className="h-8 text-xs w-[170px] bg-background rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="Morning">Morning (6 AM - 2 PM)</SelectItem>
                  <SelectItem value="Evening">Evening (2 PM - 10 PM)</SelectItem>
                  <SelectItem value="Full Day">Full Day (24/7)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Floor Display: Blueprint Map (from Builder) OR Row Cards Grid */}
      {viewMode === "blueprint" ? (
        <SeatsFloorBlueprint
          lang={lang}
          activeShift={activeShift}
          searchQuery={searchQuery}
          seats={seats}
          selectedFloor={selectedFloor}
          layoutName={builderLayout.name}
          elements={builderLayout.elements}
          canvasWidth={builderLayout.canvasWidth}
          canvasHeight={builderLayout.canvasHeight}
          onSelectSeat={handleSeatClick}
        />
      ) : (
        /* Visual Floor Grid conforming to theme rounded-lg */
        <div className="rounded-lg border border-border p-4 bg-card shadow-xs space-y-5">
          {rows.map((rowName) => {
            const rowSeats = floorSeats.filter((s) => s.row === rowName)

            return (
              <div key={rowName} className="space-y-2">
                {/* Row Header */}
                <div className="flex items-center justify-between pb-1 border-b border-border/60">
                  <span className="text-xs font-bold text-foreground tracking-wide uppercase">
                    {rowName}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {rowSeats.length} seats
                  </span>
                </div>

                {/* Seat Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
                  {rowSeats.map((seat) => {
                    const allocation =
                      seat.shifts[shiftKey] || seat.shifts.fullDay
                    const isOccupied = !!allocation
                    const isMaintenance = seat.status === "Maintenance"
                    const isReserved = seat.status === "Reserved"

                    // Search highlight behavior
                    const isMatch = checkSeatMatch(seat)
                    const isDimmed = hasSearch && !isMatch

                                     // Female names detection for default SVG avatar
                    const femaleNames = ["Ritu", "Anju", "Pooja", "Neha", "Priya", "Sneha", "Kavita", "Divya", "Swati"]
                    const isFemale = allocation?.studentName
                      ? femaleNames.some((fn) => allocation.studentName.toLowerCase().includes(fn.toLowerCase()))
                      : false
                    const defaultAvatar = isFemale
                      ? "/images/avatars/female-01.svg"
                      : "/images/avatars/male-01.svg"
                    const studentAvatar =
                      allocation?.avatar &&
                      allocation.avatar.startsWith("/images/avatars/") &&
                      allocation.avatar.endsWith(".svg")
                        ? allocation.avatar
                        : defaultAvatar

                    return (
                      <HoverCard key={seat.id} openDelay={80} closeDelay={120}>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            onClick={() => handleSeatClick(seat)}
                            className={`group relative flex flex-col items-center justify-between p-2 rounded-[20px] border text-center transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring min-h-[116px] select-none overflow-hidden bg-[#202226] dark:bg-[#1e2022] text-card-foreground border-white/5 shadow-md hover:shadow-xl hover:scale-[1.02] ${
                              isMatch
                                ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.04] shadow-md z-10"
                                : isDimmed
                                  ? "opacity-25 scale-95"
                                  : ""
                            } ${
                              isOccupied
                                ? "hover:border-amber-500/70"
                                : isReserved
                                  ? "hover:border-purple-500/70"
                                  : isMaintenance
                                    ? "opacity-60 cursor-not-allowed bg-muted/40"
                                    : "hover:border-emerald-500/70"
                            }`}
                          >
                            {/* Top Status Capsule Pill */}
                            {isOccupied ? (
                              <div className="w-full h-5.5 px-2 rounded-full bg-[#eab308] text-black flex items-center shadow-xs shrink-0 select-none">
                                <span className="size-2.5 rounded-full bg-black/20 shrink-0" />
                                <span className="text-[11px] font-bold tracking-tight flex-1 text-center -ml-2.5 text-black">
                                  Occupied
                                </span>
                              </div>
                            ) : isReserved ? (
                              <div className="w-full h-5.5 px-2 rounded-full bg-purple-500 text-white flex items-center shadow-xs shrink-0 select-none">
                                <span className="size-2.5 rounded-full bg-black/25 shrink-0" />
                                <span className="text-[10.5px] font-bold tracking-tight flex-1 text-center -ml-2.5 text-white">
                                  Reserved
                                </span>
                              </div>
                            ) : isMaintenance ? (
                              <div className="w-full h-5.5 px-2 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700/60 flex items-center shadow-xs shrink-0 select-none">
                                <span className="size-2.5 rounded-full bg-neutral-600 shrink-0" />
                                <span className="text-[10.5px] font-bold tracking-tight flex-1 text-center -ml-2.5 text-neutral-300">
                                  Maint
                                </span>
                              </div>
                            ) : (
                              <div className="w-full h-5.5 px-2 rounded-full bg-[#1fc749] text-black flex items-center shadow-xs shrink-0 select-none">
                                <span className="size-2.5 rounded-full bg-black/20 shrink-0" />
                                <span className="text-[11px] font-bold tracking-tight flex-1 text-center -ml-2.5 text-black">
                                  Free
                                </span>
                              </div>
                            )}

                            {/* Card Center Content */}
                            {isOccupied && allocation ? (
                              <div className="flex-1 w-full flex flex-col items-center justify-center min-w-0 py-0.5">
                                <div className="size-9 rounded-xl bg-[#444849] flex items-center justify-center overflow-hidden shrink-0 shadow-xs my-0.5">
                                  <img
                                    src={studentAvatar}
                                    alt={allocation.studentName}
                                    className="size-full object-cover p-0.5"
                                  />
                                </div>
                                <span className="text-[11px] font-bold text-white truncate max-w-full text-center leading-tight mt-0.5 px-1">
                                  {allocation.studentName}
                                </span>
                                <span className="mt-1 px-2.5 py-0.5 rounded-full bg-[#eab308] text-black text-[9.5px] font-bold font-mono tracking-tight shadow-xs shrink-0 leading-none">
                                  {seat.seatNo}
                                </span>
                              </div>
                            ) : isReserved ? (
                              <div className="flex-1 w-full flex flex-col items-center justify-center">
                                <span className="text-xl font-black font-mono tracking-tight text-white leading-none">
                                  {seat.seatNo}
                                </span>
                                <span className="mt-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-bold">
                                  Reserved
                                </span>
                              </div>
                            ) : isMaintenance ? (
                              <div className="flex-1 w-full flex flex-col items-center justify-center gap-1">
                                <Wrench className="size-4 text-muted-foreground" />
                                <span className="text-[10px] font-bold font-mono text-muted-foreground">
                                  {seat.seatNo}
                                </span>
                              </div>
                            ) : (
                              <div className="flex-1 w-full flex items-center justify-center">
                                <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white select-none leading-none">
                                  {seat.seatNo}
                                </span>
                              </div>
                            )}
                          </button>
                        </HoverCardTrigger>

                        {/* Clean Hover Card matching theme rounded-lg */}
                        <HoverCardContent
                          align="center"
                          side="top"
                          className="w-68 p-3 space-y-2 z-50 border border-border bg-popover text-popover-foreground shadow-md rounded-lg"
                        >
                          {/* Top: Seat Header */}
                          <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                            <div>
                              <h4 className="text-sm font-bold flex items-center gap-1.5">
                                <Armchair className="size-4 text-primary" />
                                Seat {seat.seatNo}
                              </h4>
                              <p className="text-[11px] text-muted-foreground">
                                {seat.floor} • {seat.room}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                isOccupied
                                  ? "bg-primary/10 text-primary border-primary/30 text-[10px] font-semibold rounded-md"
                                  : isReserved
                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-semibold rounded-md"
                                    : isMaintenance
                                      ? "bg-muted text-muted-foreground text-[10px] rounded-md"
                                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold rounded-md"
                              }
                            >
                              {isOccupied
                                ? `Occupied (${activeShift})`
                                : isReserved
                                  ? "Reserved"
                                  : isMaintenance
                                    ? "Maintenance"
                                    : "Available"}
                            </Badge>
                          </div>

                          {/* Student Details if Occupied with Theme Avatar */}
                          {isOccupied && allocation ? (
                            <div className="space-y-1.5 p-2 rounded-lg bg-muted/40 border border-border/60">
                              <div className="flex items-center gap-2">
                                <Avatar className="size-8 rounded-lg border border-border/80 shrink-0 overflow-hidden bg-muted">
                                  <AvatarImage
                                    src={allocation.avatar}
                                    alt={allocation.studentName}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className="text-[10px] font-bold bg-muted text-foreground">
                                    {getInitials(allocation.studentName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-foreground truncate">
                                    {allocation.studentName}
                                  </div>
                                  <div className="text-[10px] font-mono text-muted-foreground">
                                    ID: {allocation.studentId}
                                  </div>
                                </div>
                              </div>
                              <div className="text-[10px] space-y-0.5 text-muted-foreground pt-1 border-t border-border/40">
                                <div className="flex justify-between">
                                  <span>Shift:</span>
                                  <span className="font-semibold text-foreground">
                                    {allocation.shift}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Valid Until:</span>
                                  <span className="font-semibold text-foreground">
                                    {allocation.planEnd}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground py-1">
                              Seat is free and ready for student allocation during {activeShift} shift.
                            </div>
                          )}

                          {/* Click prompt */}
                          <div className="text-[10px] text-center text-primary font-medium pt-1 border-t border-border/40 flex items-center justify-center gap-1">
                            <span>Click to open details & actions</span>
                            <ExternalLink className="size-3" />
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Centered Seat Detail Modal Dialog with Direct Assign & Maintenance Toggles */}
      <SeatDetailDialog
        seat={selectedSeat}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        activeShift={activeShift}
        lang={lang}
        onAssignStudent={handleAssignStudent}
        onVacateSeat={handleVacateSeat}
        onToggleMaintenance={handleToggleMaintenance}
      />
    </div>
  )
}
