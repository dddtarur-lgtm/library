"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Armchair,
  Calendar,
  Clock,
  ExternalLink,
  History,
  Info,
  Shield,
  User,
  UserCheck,
  UserX,
  Wrench,
} from "lucide-react"

import type { SeatItem, ShiftType } from "@/data/seats-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SeatDetailDrawerProps {
  seat: SeatItem | null
  open: boolean
  onClose: () => void
  activeShift: ShiftType
  lang: LocaleType
}

export function SeatDetailDrawer({
  seat,
  open,
  onClose,
  activeShift,
  lang,
}: SeatDetailDrawerProps) {
  const [vacateDialogOpen, setVacateDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview")

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

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Header */}
            <SheetHeader className="p-4 border-b border-border/60 bg-muted/20">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Armchair className="size-5" />
                  </div>
                  <div>
                    <SheetTitle className="text-base font-bold flex items-center gap-2">
                      Seat {seat.seatNo}
                      <Badge
                        variant="outline"
                        className={
                          seat.status === "Maintenance"
                            ? "bg-muted text-muted-foreground border-border"
                            : isOccupied
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        }
                      >
                        {seat.status === "Maintenance"
                          ? "Maintenance"
                          : isOccupied
                            ? `Occupied (${activeShift})`
                            : `Available (${activeShift})`}
                      </Badge>
                    </SheetTitle>
                    <SheetDescription className="text-xs">
                      {seat.floor} • {seat.room} • {seat.row}
                    </SheetDescription>
                  </div>
                </div>
              </div>
            </SheetHeader>

            {/* Navigation Tabs */}
            <div className="px-4 pt-3">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "overview" | "history")}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 w-full h-8">
                  <TabsTrigger value="overview" className="text-xs">
                    Seat Info
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs gap-1">
                    <History className="size-3.5" />
                    History ({seat.history.length})
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Overview */}
                <TabsContent value="overview" className="mt-4 space-y-4">
                  {/* Seat Specifications */}
                  <div className="rounded-lg border border-border/60 p-3 space-y-2 bg-card text-xs">
                    <div className="font-semibold text-foreground flex items-center gap-1.5 pb-1 border-b border-border/40">
                      <Info className="size-3.5 text-muted-foreground" />
                      Specifications
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      <div>
                        Seat Type:{" "}
                        <span className="font-medium text-foreground">{seat.type}</span>
                      </div>
                      <div>
                        Category:{" "}
                        <span className="font-medium text-foreground">{seat.category}</span>
                      </div>
                      <div>
                        Base Rate:{" "}
                        <span className="font-medium text-foreground">
                          ₹{seat.pricePerMonth} / mo
                        </span>
                      </div>
                      <div>
                        Active Shift:{" "}
                        <span className="font-medium text-foreground">{activeShift}</span>
                      </div>
                    </div>
                    {seat.notes && (
                      <div className="text-xs p-2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 mt-1">
                        <strong>Notice:</strong> {seat.notes}
                      </div>
                    )}
                  </div>

                  {/* Allocation Status Card */}
                  {isOccupied && allocation ? (
                    <div className="rounded-lg border border-border/60 p-3.5 space-y-3 bg-card">
                      <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <UserCheck className="size-3.5 text-primary" />
                          Allocated Student
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {allocation.shift}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3">
                        <Avatar className="size-11 border border-border/60">
                          <AvatarImage src={allocation.avatar} alt={allocation.studentName} />
                          <AvatarFallback className="font-bold text-xs">
                            {allocation.studentName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-foreground truncate">
                            {allocation.studentName}
                          </h4>
                          <p className="text-xs text-muted-foreground font-mono">
                            {allocation.studentId}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {allocation.planName}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="size-3 text-muted-foreground" />
                          <span>Since: {allocation.allocatedAt}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="size-3 text-muted-foreground" />
                          <span>End: {allocation.planEnd}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col gap-2">
                        <Link
                          href={ensureLocalizedPathname(
                            `/pages/students/${allocation.studentId}`,
                            lang
                          )}
                          className="w-full inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium border border-border/60 hover:bg-muted/40 transition-colors"
                        >
                          <span>Open Full Student Profile</span>
                          <ExternalLink className="size-3.5" />
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setVacateDialogOpen(true)}
                          className="h-8 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          <UserX className="size-3.5 mr-1" />
                          Vacate / Release Seat
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border/80 p-5 text-center space-y-3 bg-muted/10">
                      <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                        <Armchair className="size-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Seat is Available
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-0.5">
                          No student is currently assigned to this seat for the {activeShift}{" "}
                          shift.
                        </p>
                      </div>
                      <Link
                        href={ensureLocalizedPathname("/pages/students/add", lang)}
                        className="inline-flex items-center justify-center h-8 px-4 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                      >
                        <User className="size-3.5 mr-1.5" />
                        Assign Student
                      </Link>
                    </div>
                  )}

                  {/* Other Shifts on this Seat */}
                  <div className="rounded-lg border border-border/60 p-3 space-y-2 bg-card">
                    <span className="text-xs font-semibold text-foreground block">
                      Shift-Wise Status (PRD §18.4)
                    </span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between p-1.5 rounded bg-muted/20">
                        <span className="font-medium">Morning (6 AM - 2 PM)</span>
                        {seat.shifts.morning ? (
                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                            {seat.shifts.morning.studentName}
                          </Badge>
                        ) : seat.shifts.fullDay ? (
                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                            Full Day Reserved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                            Free
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded bg-muted/20">
                        <span className="font-medium">Evening (2 PM - 10 PM)</span>
                        {seat.shifts.evening ? (
                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                            {seat.shifts.evening.studentName}
                          </Badge>
                        ) : seat.shifts.fullDay ? (
                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                            Full Day Reserved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                            Free
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: History */}
                <TabsContent value="history" className="mt-4 space-y-3">
                  {seat.history.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      No past allocations logged for this seat yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {seat.history.map((h) => (
                        <div
                          key={h.id}
                          className="rounded-lg border border-border/60 p-3 space-y-1 text-xs bg-card"
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span>{h.studentName}</span>
                            <Badge variant="secondary" className="text-[10px]">
                              {h.shift}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground">
                            ID: <span className="font-mono text-foreground">{h.studentId}</span>
                          </div>
                          <div className="text-muted-foreground">
                            Period: {h.from} &rarr; {h.to}
                          </div>
                          <div className="text-muted-foreground pt-1 border-t border-border/30 mt-1">
                            Reason: <span className="text-foreground">{h.reason}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Allocated by: {h.allocatedBy}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-border/60 bg-muted/10 flex items-center justify-end">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Vacate Confirmation Modal */}
      <Dialog open={vacateDialogOpen} onOpenChange={setVacateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <UserX className="size-5" />
              Vacate Seat {seat.seatNo}?
            </DialogTitle>
            <DialogDescription className="text-xs">
              This will unassign{" "}
              <strong>{allocation?.studentName}</strong> from Seat {seat.seatNo} for the{" "}
              {activeShift} shift. The seat will immediately become Available for other
              students.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVacateDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setVacateDialogOpen(false)
                onClose()
              }}
              className="text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm & Vacate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
