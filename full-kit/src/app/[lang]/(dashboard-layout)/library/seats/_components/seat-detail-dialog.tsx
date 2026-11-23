"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Armchair,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  Info,
  User,
  UserCheck,
  UserPlus,
  UserX,
  Wrench,
} from "lucide-react"
import { toast } from "sonner"

import type { SeatItem, ShiftType } from "@/data/seats-data"
import { studentsDatabase, type StudentProfile } from "@/data/students-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import { getInitials } from "@/lib/utils"
import type { LocaleType } from "@/types"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SeatDetailDialogProps {
  seat: SeatItem | null
  open: boolean
  onClose: () => void
  activeShift: ShiftType
  lang: LocaleType
  onAssignStudent?: (
    seatId: string,
    shift: ShiftType,
    student: StudentProfile
  ) => void
  onVacateSeat?: (seatId: string, shift: ShiftType) => void
  onToggleMaintenance?: (seatId: string, isMaintenance: boolean) => void
}

export function SeatDetailDialog({
  seat,
  open,
  onClose,
  activeShift,
  lang,
  onAssignStudent,
  onVacateSeat,
  onToggleMaintenance,
}: SeatDetailDialogProps) {
  const [vacateDialogOpen, setVacateDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview")

  // State for direct student assignment dropdown
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    studentsDatabase[0]?.studentId || ""
  )

  if (!seat) return null

  // Determine current allocation based on activeShift
  const shiftKey =
    activeShift === "Morning"
      ? "morning"
      : activeShift === "Evening"
        ? "evening"
        : "fullDay"

  const allocation = seat.shifts[shiftKey] || seat.shifts.fullDay
  const isOccupied = !!allocation
  const isMaintenance = seat.status === "Maintenance"

  // Current selected student profile for assignment
  const selectedStudent =
    studentsDatabase.find((s) => s.studentId === selectedStudentId) ||
    studentsDatabase[0]

  const handleDirectAssign = () => {
    if (!selectedStudent || !seat) return
    if (onAssignStudent) {
      onAssignStudent(seat.id, activeShift, selectedStudent)
    }
    toast.success(`Seat ${seat.seatNo} assigned to ${selectedStudent.name}!`, {
      description: `Allocated for the ${activeShift} shift. Status is now Live.`,
    })
  }

  const handleConfirmVacate = () => {
    if (!seat) return
    if (onVacateSeat) {
      onVacateSeat(seat.id, activeShift)
    }
    toast.info(`Seat ${seat.seatNo} vacated`, {
      description: `Seat is now Available for other students in the ${activeShift} shift.`,
    })
    setVacateDialogOpen(false)
  }

  const handleRemoveMaintenance = () => {
    if (!seat) return
    if (onToggleMaintenance) {
      onToggleMaintenance(seat.id, false)
    }
    toast.success(`Maintenance mode removed for Seat ${seat.seatNo}`, {
      description: "Seat status is now set to Available.",
    })
  }

  const handleMarkMaintenance = () => {
    if (!seat) return
    if (onToggleMaintenance) {
      onToggleMaintenance(seat.id, true)
    }
    toast.warning(`Seat ${seat.seatNo} marked under maintenance`, {
      description: "Seat cannot be allocated until maintenance is cleared.",
    })
  }

  return (
    <>
      {/* Wide Centered Seat Information Dialog matching theme rounded-lg */}
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-3xl md:max-w-4xl p-0 overflow-hidden border border-border shadow-lg rounded-lg">
          {/* Dialog Header */}
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Armchair className="size-5" />
                </div>
                <div className="text-left">
                  <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                    Seat {seat.seatNo}
                    <Badge
                      variant="outline"
                      className={
                        isMaintenance
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[11px] rounded-md font-semibold"
                          : isOccupied
                            ? "bg-primary/10 text-primary border-primary/20 text-[11px] font-semibold rounded-md"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-semibold rounded-md"
                      }
                    >
                      {isMaintenance
                        ? "Under Maintenance"
                        : isOccupied
                          ? `Occupied (${activeShift})`
                          : `Available (${activeShift})`}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {seat.floor} • {seat.room} • {seat.row}
                  </DialogDescription>
                </div>
              </div>

              {/* Tabs Switcher in Header */}
              <div className="self-start sm:self-auto">
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as "overview" | "history")}
                >
                  <TabsList className="h-8 p-1 bg-muted/60 rounded-md">
                    <TabsTrigger
                      value="overview"
                      className="text-xs h-6 px-3 rounded-sm font-medium"
                    >
                      Seat Details
                    </TabsTrigger>
                    <TabsTrigger
                      value="history"
                      className="text-xs h-6 px-3 rounded-sm gap-1.5 font-medium"
                    >
                      <History className="size-3" />
                      History ({seat.history.length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </DialogHeader>

          {/* Dialog Body - Wide 2-Column Balanced Grid */}
          <div className="p-4 sm:p-5">
            {activeTab === "overview" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Direct Assignment Dropdown / Occupied Student / Maintenance Action */}
                <div>
                  {isMaintenance ? (
                    /* CASE 1: SEAT IS UNDER MAINTENANCE */
                    <div className="rounded-lg border border-border p-4 space-y-3.5 bg-card shadow-xs h-full flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <Wrench className="size-4" />
                            Maintenance Mode Active
                          </span>
                          <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-500/40 rounded-md">
                            Repair Required
                          </Badge>
                        </div>

                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                          <p className="font-semibold">Notice:</p>
                          <p className="text-xs opacity-90">
                            {seat.notes || "Power socket or desk hardware is being repaired. Seat is blocked from general student allocation."}
                          </p>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Once repairs are complete, click below to lift maintenance mode and immediately restore this seat as Available.
                        </p>
                      </div>

                      {/* Remove Maintenance Button */}
                      <Button
                        onClick={handleRemoveMaintenance}
                        className="w-full h-8 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs"
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>Remove Maintenance Mode & Make Available</span>
                      </Button>
                    </div>
                  ) : isOccupied && allocation ? (
                    /* CASE 2: SEAT IS CURRENTLY OCCUPIED */
                    <div className="rounded-lg border border-border p-4 space-y-3 bg-card shadow-xs h-full flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <UserCheck className="size-4 text-primary" />
                            Allocated Student
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-mono rounded-md"
                          >
                            {allocation.shift} Shift
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3">
                          <Avatar className="size-14 rounded-lg border border-border shadow-xs shrink-0 overflow-hidden bg-muted">
                            <AvatarImage
                              src={allocation.avatar}
                              alt={allocation.studentName}
                              className="object-cover"
                            />
                            <AvatarFallback className="text-base font-bold bg-muted text-foreground">
                              {getInitials(allocation.studentName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-foreground truncate">
                              {allocation.studentName}
                            </h4>
                            <p className="text-xs text-muted-foreground font-mono">
                              ID:{" "}
                              <span className="text-foreground font-semibold">
                                {allocation.studentId}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              Plan: {allocation.planName}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-lg bg-muted/40 border border-border/60">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="size-3 text-muted-foreground shrink-0" />
                            <span className="truncate">
                              Since: {allocation.allocatedAt}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="size-3 text-muted-foreground shrink-0" />
                            <span className="truncate">
                              End: {allocation.planEnd}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row gap-2 mt-2">
                        <Link
                          href={ensureLocalizedPathname(
                            `/pages/students/${allocation.studentId}`,
                            lang
                          )}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <span>View Full Profile</span>
                          <ExternalLink className="size-3.5" />
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setVacateDialogOpen(true)}
                          className="h-8 text-xs font-bold rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          <UserX className="size-3.5 mr-1" />
                          Vacate Seat
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* CASE 3: SEAT IS AVAILABLE - DIRECT STUDENT ASSIGN DROPDOWN */
                    <div className="rounded-lg border border-border p-4 space-y-3.5 bg-card shadow-xs h-full flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <UserPlus className="size-4 text-emerald-600 dark:text-emerald-400" />
                            Direct Student Allocation
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 rounded-md"
                          >
                            Seat Available
                          </Badge>
                        </div>

                        {/* Dropdown with Profile Icon & Live Students List */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground block">
                            Select Student from Live Directory:
                          </label>
                          <Select
                            value={selectedStudentId}
                            onValueChange={setSelectedStudentId}
                          >
                            <SelectTrigger className="h-10 text-xs bg-background rounded-md border border-border">
                              <SelectValue placeholder="Select student..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-md max-h-[220px]">
                              {studentsDatabase.map((std) => (
                                <SelectItem
                                  key={std.studentId}
                                  value={std.studentId}
                                  className="text-xs py-1.5 cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <Avatar className="size-6 rounded-md border border-border shrink-0 overflow-hidden bg-muted">
                                      <AvatarImage
                                        src={std.avatar}
                                        alt={std.name}
                                        className="object-cover"
                                      />
                                      <AvatarFallback className="text-[9px] font-bold">
                                        {getInitials(std.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-semibold text-foreground">
                                      {std.name}
                                    </span>
                                    <span className="text-[10px] font-mono text-muted-foreground">
                                      ({std.studentId})
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Selected Student Preview Card */}
                        {selectedStudent && (
                          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/30 border border-border/60">
                            <Avatar className="size-10 rounded-lg border border-border shrink-0 overflow-hidden bg-muted">
                              <AvatarImage
                                src={selectedStudent.avatar}
                                alt={selectedStudent.name}
                                className="object-cover"
                              />
                              <AvatarFallback className="text-xs font-bold">
                                {getInitials(selectedStudent.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1 text-xs">
                              <p className="font-bold text-foreground truncate">
                                {selectedStudent.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {selectedStudent.studentId} • {selectedStudent.phone}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                Plan: {selectedStudent.plan}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons: Direct Assign & Mark Maintenance */}
                      <div className="space-y-2 pt-2 border-t border-border/40">
                        <Button
                          onClick={handleDirectAssign}
                          className="w-full h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-xs"
                        >
                          <CheckCircle2 className="size-3.5" />
                          <span>Direct Assign to Seat {seat.seatNo} ({activeShift})</span>
                        </Button>

                        <button
                          type="button"
                          onClick={handleMarkMaintenance}
                          className="w-full text-center text-[11px] text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 py-1 transition-colors"
                        >
                          Need repair? Mark Seat under Maintenance
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Location Details & Shift Status */}
                <div className="space-y-3">
                  {/* Seat Location Details */}
                  <div className="rounded-lg border border-border p-3.5 space-y-2 bg-card text-xs">
                    <div className="font-semibold text-foreground flex items-center gap-1.5 pb-1 border-b border-border/60">
                      <Info className="size-3.5 text-muted-foreground" />
                      Seat Location & Context
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      <div>
                        Floor & Wing:{" "}
                        <span className="font-semibold text-foreground">
                          {seat.floor}
                        </span>
                      </div>
                      <div>
                        Hall / Room:{" "}
                        <span className="font-semibold text-foreground">
                          {seat.room}
                        </span>
                      </div>
                      <div>
                        Row Section:{" "}
                        <span className="font-semibold text-foreground">
                          {seat.row}
                        </span>
                      </div>
                      <div>
                        Active Shift:{" "}
                        <span className="font-semibold text-foreground">
                          {activeShift}
                        </span>
                      </div>
                    </div>
                    {seat.notes && (
                      <div className="text-xs p-2 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 mt-1">
                        <strong>Notice:</strong> {seat.notes}
                      </div>
                    )}
                  </div>

                  {/* All Shifts on Seat */}
                  <div className="rounded-lg border border-border p-3.5 space-y-2 bg-card text-xs">
                    <span className="font-semibold text-foreground block">
                      Shift Allocations on Seat {seat.seatNo}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Morning (6-2):
                        </span>
                        {seat.shifts.morning ? (
                          <span className="font-semibold text-foreground truncate max-w-[90px]">
                            {seat.shifts.morning.studentName.split(" ")[0]}
                          </span>
                        ) : seat.shifts.fullDay ? (
                          <span className="font-semibold text-primary">
                            Full Day
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Free
                          </span>
                        )}
                      </div>

                      <div className="p-2 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Evening (2-10):
                        </span>
                        {seat.shifts.evening ? (
                          <span className="font-semibold text-foreground truncate max-w-[90px]">
                            {seat.shifts.evening.studentName.split(" ")[0]}
                          </span>
                        ) : seat.shifts.fullDay ? (
                          <span className="font-semibold text-primary">
                            Full Day
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Free
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Tab: Allocation History */
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {seat.history.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No past allocations recorded for Seat {seat.seatNo} yet.
                  </div>
                ) : (
                  seat.history.map((h) => (
                    <div
                      key={h.id}
                      className="rounded-lg border border-border p-3 space-y-1 text-xs bg-card"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>{h.studentName}</span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] rounded-md"
                        >
                          {h.shift}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground">
                        Student ID:{" "}
                        <span className="font-mono text-foreground font-semibold">
                          {h.studentId}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        Duration: {h.from} &rarr; {h.to}
                      </div>
                      <div className="text-muted-foreground pt-1 border-t border-border/60 mt-1">
                        Reason:{" "}
                        <span className="text-foreground">{h.reason}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Allocated by: {h.allocatedBy}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Dialog Footer */}
          <DialogFooter className="p-3 sm:p-4 border-t border-border bg-muted/10">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs px-4 rounded-md"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vacate Confirmation Modal */}
      <Dialog open={vacateDialogOpen} onOpenChange={setVacateDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <UserX className="size-5" />
              Vacate Seat {seat.seatNo}?
            </DialogTitle>
            <DialogDescription className="text-xs">
              This will unassign{" "}
              <strong>{allocation?.studentName}</strong> from Seat {seat.seatNo}{" "}
              for the {activeShift} shift. The seat will immediately become
              Available for other students.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVacateDialogOpen(false)}
              className="text-xs rounded-md"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmVacate}
              className="text-xs font-bold rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm & Vacate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
