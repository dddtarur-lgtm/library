"use client"

import { useState } from "react"
import {
  Armchair,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Sparkles,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react"
import { toast } from "sonner"

import {
  initialNewRegistrations,
  type NewRegistrationStudent,
} from "@/app/[lang]/(dashboard-layout)/dashboards/students/_data/quick-registrations"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

export function QuickRegistrationsDialog() {
  const [open, setOpen] = useState(false)
  const [registrations, setRegistrations] = useState<NewRegistrationStudent[]>(
    initialNewRegistrations
  )

  const pendingCount = registrations.filter(
    (s) => s.status === "Pending Approval"
  ).length

  const handleApprove = (id: string, name: string) => {
    setRegistrations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Approved" } : item
      )
    )
    toast.success(`${name} has been approved!`, {
      description: "Student seat confirmed and admission notification sent.",
    })
  }

  const handleReject = (id: string, name: string) => {
    setRegistrations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Rejected" } : item
      )
    )
    toast.info(`${name} registration declined.`)
  }

  const handleApproveAll = () => {
    setRegistrations((prev) =>
      prev.map((item) => ({ ...item, status: "Approved" }))
    )
    toast.success("All pending registrations approved!")
  }

  const latestStudent = registrations.find(
    (s) => s.status === "Pending Approval"
  ) || registrations[0]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-x-3 rounded-xl border border-border bg-card hover:bg-accent/40 px-3.5 py-1.5 shadow-xs transition-colors cursor-pointer text-left"
        >
          {/* Avatar Stack of Latest Students */}
          <div className="flex -space-x-2.5 overflow-hidden shrink-0">
            {registrations.slice(0, 3).map((student, idx) => (
              <Avatar
                key={student.id}
                className="size-8 rounded-full border-2 border-background ring-1 ring-border/50 shrink-0"
                style={{ zIndex: 10 - idx }}
              >
                <AvatarImage src={student.avatar} alt={student.name} />
                <AvatarFallback className="text-[10px] font-bold bg-muted text-foreground">
                  {student.name[0]}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>

          {/* Animated Yellow Number Badge */}
          {pendingCount > 0 && (
            <span className="relative inline-flex items-center justify-center shrink-0">
              {/* Outer expanding ping halo */}
              <span className="absolute -inset-1 rounded-full bg-amber-400/60 animate-ping opacity-75" />
              {/* Core glowing animated badge */}
              <span className="relative flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 text-xs font-black px-2.5 py-0.5 shadow-md shadow-amber-400/40 ring-2 ring-amber-300/80 animate-pulse">
                <span className="size-1.5 rounded-full bg-amber-950 animate-ping" />
                <span>{pendingCount}</span>
              </span>
            </span>
          )}

          {/* Latest Student Profile & Registration Info */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-x-1.5 truncate">
              <span className="font-bold text-foreground text-xs truncate">
                {latestStudent?.name ?? "No new students"}
              </span>
              {pendingCount > 1 && (
                <span className="text-xs text-muted-foreground truncate">
                  +{pendingCount - 1} more registered
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight truncate mt-0.5">
              {latestStudent?.plan
                ? `${latestStudent.plan} • ${latestStudent.registeredAt}`
                : "All registrations reviewed"}
            </p>
          </div>

          {/* Action prompt */}
          <div className="ms-2 flex items-center text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform shrink-0">
            <span className="hidden sm:inline">Review List</span>
            <ChevronRight className="size-3.5" />
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl border-border bg-card shadow-2xl p-6">
        <DialogHeader className="pb-3 border-b border-border pe-8">
          <div className="flex items-start gap-x-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <UserCheck className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-base font-bold text-foreground">
                  New Student Registrations
                </DialogTitle>
                <Badge className="border-0 bg-amber-400 text-amber-950 font-extrabold text-[11px] px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-amber-950 animate-pulse" />
                  <span>{pendingCount} Pending</span>
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Review incoming admission applications, verify seat allocations, and admit students.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] -me-2 pe-3 my-2">
          <div className="space-y-3">
            {registrations.map((student) => {
              const isApproved = student.status === "Approved"
              const isRejected = student.status === "Rejected"
              const initials = student.name
                .split(" ")
                .map((n) => n[0])
                .join("")

              return (
                <div
                  key={student.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all",
                    isApproved
                      ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10"
                      : isRejected
                      ? "border-border/60 bg-muted/30 opacity-60"
                      : "border-border bg-card hover:bg-accent/30 shadow-xs"
                  )}
                >
                  {/* Left: Avatar & Info */}
                  <div className="flex items-start gap-x-3 min-w-0">
                    <Avatar className="size-10 shrink-0 border border-border">
                      <AvatarImage src={student.avatar} alt={student.name} />
                      <AvatarFallback className="text-xs font-semibold bg-muted">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <div className="flex items-center gap-x-2">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {student.name}
                        </span>
                        <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {student.id}
                        </span>
                        {isApproved && (
                          <Badge className="border-0 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] py-0 px-1.5 font-semibold">
                            Admitted
                          </Badge>
                        )}
                        {isRejected && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground">
                            Rejected
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 font-medium">
                        <span>{student.phone}</span>
                        <span>•</span>
                        <span>{student.shift}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[11px] font-medium text-foreground/80 bg-muted px-2 py-0.5 rounded-md border border-border/50">
                          {student.plan}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[11px] font-semibold gap-1 py-0.5 border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-500/10"
                        >
                          <Armchair className="size-3" />
                          <span>{student.preferredSeat}</span>
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                          <Clock className="size-3" />
                          {student.registeredAt}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full border-0",
                        student.feeStatus === "Paid"
                          ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                          : "bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200"
                      )}
                    >
                      Fee: {student.feeStatus}
                    </span>

                    {!isApproved && !isRejected ? (
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 cursor-pointer"
                          onClick={() => handleReject(student.id, student.name)}
                        >
                          <X className="size-3.5 me-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-xs cursor-pointer"
                          onClick={() => handleApprove(student.id, student.name)}
                        >
                          <Check className="size-3.5 me-1" />
                          Approve
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs font-semibold">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            <CheckCircle2 className="size-3.5" />
                            <span>Admitted</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            Declined
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Showing {registrations.length} recent applicants</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <DialogClose asChild>
              <Button variant="outline" size="sm" className="h-9 px-4 text-xs font-medium border-border hover:bg-accent cursor-pointer">
                Close
              </Button>
            </DialogClose>
            {pendingCount > 0 && (
              <Button
                size="sm"
                className="h-9 px-4 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-xs cursor-pointer"
                onClick={handleApproveAll}
              >
                <Check className="size-3.5 me-1.5" />
                Approve All ({pendingCount})
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
