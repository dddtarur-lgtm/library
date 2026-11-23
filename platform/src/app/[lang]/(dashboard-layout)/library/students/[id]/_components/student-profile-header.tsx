"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Armchair,
  Building2,
  CreditCard,
  Mail,
  Pencil,
  Phone,
  QrCode,
  RotateCcw,
  TriangleAlert,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import type { LocaleType } from "@/types"
import type { StudentProfile } from "@/data/students-data"
import { ensureLocalizedPathname } from "@/lib/i18n"

import { getInitials } from "@/lib/utils"
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlanDetailsDialog } from "@/components/students/plan-details-dialog"
import { DigitalIdCardDialog } from "./digital-id-card-dialog"

export function StudentProfileHeader({
  student,
  locale,
}: {
  student: StudentProfile
  locale: LocaleType
}) {
  const cleanPhone = student.phone.replace(/[^0-9]/g, "")

  // Interactive Dialog States
  const [renewOpen, setRenewOpen] = useState(false)
  const [deskOpen, setDeskOpen] = useState(false)
  const [selectedDesk, setSelectedDesk] = useState(student.seatNo)

  const [suspendOpen, setSuspendOpen] = useState(false)
  const [suspendReason, setSuspendReason] = useState("Fee Overdue")

  const handleRenewSubmit = (planName?: string) => {
    setRenewOpen(false)
    toast.success(`Plan renewed for ${student.name}!`, {
      description: `Subscription extended to ${planName || "selected plan"}. Expiry updated.`,
    })
  }

  const handleDeskSubmit = () => {
    setDeskOpen(false)
    toast.success(`Seat updated to ${selectedDesk}!`, {
      description: "Seat allocation audit record updated successfully.",
    })
  }

  const handleSuspendSubmit = () => {
    setSuspendOpen(false)
    toast.error(`Student membership suspended`, {
      description: `Reason: ${suspendReason}. Gate access disabled.`,
    })
  }

  return (
    <section className="rounded-xl border border-border bg-card p-3.5 sm:p-4 md:p-5 shadow-xs space-y-3.5 min-w-0">
      {/* Top Section: Left Profile Info + Right Assigned Desk & Plan Box */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 min-w-0">
        {/* Left Side: Avatar, Name, Target Exam, Contacts, Campus */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 min-w-0 flex-1">
          {/* Avatar (Square with rounded corners matching screenshot) */}
          <Avatar className="size-16 sm:size-18 rounded-xl border border-border/80 shadow-xs shrink-0 overflow-hidden bg-muted">
            <AvatarImage
              src={student.avatar}
              alt={student.name}
              className="object-cover"
            />
            <AvatarFallback className="text-lg font-bold bg-muted text-foreground">
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>

          {/* Student Info Details */}
          <div className="space-y-1 min-w-0 flex-1">
            {/* Name and Live Status Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                {student.name}
              </h1>
              <Badge className="border border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] gap-1 px-2 py-0.5 rounded-full">
                <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse" />
                <span>Studying</span>
              </Badge>
            </div>

            {/* Target Exam */}
            <p className="text-xs text-muted-foreground font-medium">
              Target Exam:{" "}
              <span className="font-bold text-foreground">
                {student.examTarget}
              </span>
            </p>

            {/* Contacts line (Phone, Parent, Email) */}
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted-foreground font-medium">
              <span className="inline-flex items-center gap-1 text-foreground/90 shrink-0">
                <Phone className="size-3 text-muted-foreground shrink-0" />
                <span>{student.phone}</span>
              </span>
              <span className="inline-flex items-center gap-1 shrink-0">
                <Users className="size-3 text-muted-foreground shrink-0" />
                <span>
                  Parent: {student.guardianPhone} ({student.guardianRelation})
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-foreground/90 truncate min-w-0">
                <Mail className="size-3 text-muted-foreground shrink-0" />
                <span className="truncate">{student.email}</span>
              </span>
            </div>

            {/* Location / Campus */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
              <Building2 className="size-3 text-muted-foreground shrink-0" />
              <span>{student.branch}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Assigned Desk & Current Plan Box (Matching Screenshot) */}
        <div className="rounded-lg border border-border/70 bg-muted/40 p-2.5 px-3.5 flex items-center gap-4 shrink-0 justify-between sm:justify-start">
          {/* Assigned Desk Column */}
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              ASSIGNED DESK
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Armchair className="size-4 text-primary shrink-0" />
              <span className="text-lg font-bold text-primary tracking-tight">
                {student.seatNo}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">
              {student.shift.split("(")[0].trim()} Shift
            </p>
          </div>

          {/* Vertical Divider */}
          <div className="w-px h-9 bg-border/70 shrink-0" />

          {/* Current Plan Column */}
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              CURRENT PLAN
            </p>
            <p className="text-xs font-bold text-foreground mt-0.5">
              {student.plan}
            </p>
            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              {student.daysLeft > 0
                ? `Ends ${student.dueDate}`
                : `Expired ${student.dueDate}`}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Action Buttons Row (Matching Screenshot) */}
      <div className="border-t border-border/80 pt-3 flex flex-wrap items-center gap-2 min-w-0">
        {/* 0. Edit Profile */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-3 text-xs font-semibold border-primary/40 text-primary hover:bg-primary/10 shadow-xs cursor-pointer shrink-0"
        >
          <Link href={ensureLocalizedPathname(`/pages/students/${student.studentId}/edit`, locale)}>
            <Pencil className="size-3.5" />
            <span>Edit Profile</span>
          </Link>
        </Button>

        {/* 1. Renew Plan */}
        <Button
          type="button"
          size="sm"
          className="h-8 gap-1.5 px-3 text-xs font-medium bg-primary text-primary-foreground shadow-xs cursor-pointer hover:bg-primary/90 shrink-0"
          onClick={() => setRenewOpen(true)}
        >
          <RotateCcw className="size-3.5" />
          <span>Renew Plan</span>
        </Button>

        {/* 2. Change Desk */}
        <Dialog open={deskOpen} onOpenChange={setDeskOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-2.5 text-xs font-medium border-border hover:bg-accent cursor-pointer shrink-0"
            >
              <Armchair className="size-3.5 text-blue-500" />
              <span>Change Desk</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Reassign Desk & Seat
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Currently allocated: <span className="font-bold text-foreground">{student.seatNo}</span> ({student.floor}).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  Select New Desk
                </label>
                <Select value={selectedDesk} onValueChange={setSelectedDesk}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Seat-008">Seat-008 (Ground Floor A)</SelectItem>
                    <SelectItem value="Seat-015">Seat-015 (1st Floor Quiet)</SelectItem>
                    <SelectItem value="Seat-022">Seat-022 (1st Floor Quiet)</SelectItem>
                    <SelectItem value="Seat-042">Seat-042 (Current Allocation)</SelectItem>
                    <SelectItem value="Seat-058">Seat-058 (2nd Floor Discussion)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setDeskOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="text-xs bg-primary text-primary-foreground font-semibold"
                onClick={handleDeskSubmit}
              >
                Confirm Seat Reallocation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 3. WhatsApp Direct Action */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-xs font-medium border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer shrink-0"
          onClick={() => window.open(`https://wa.me/${cleanPhone}`, "_blank")}
        >
          <WhatsAppIcon className="size-3.5 fill-current text-emerald-500" />
          <span>WhatsApp</span>
        </Button>

        {/* 6. Digital ID & Gate QR */}
        <DigitalIdCardDialog
          student={student}
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-2.5 text-xs font-medium border-border hover:bg-accent cursor-pointer text-foreground shrink-0"
            >
              <QrCode className="size-3.5 text-foreground" />
              <span>Digital ID & Gate QR</span>
            </Button>
          }
        />

        {/* Stop / Suspend Action (Proper Red Background Aligned with Theme) */}
        <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs cursor-pointer shrink-0 sm:ms-auto transition-all"
            >
              <TriangleAlert className="size-3.5 shrink-0" />
              <span>Stop / Suspend</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
                <TriangleAlert className="size-4.5 text-destructive shrink-0" />
                <span>Suspend Student Membership</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                This will immediately lock QR gate access and release seat reservation for {student.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  Reason for Suspension
                </label>
                <Select value={suspendReason} onValueChange={setSuspendReason}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fee Overdue">Fee Overdue / Unpaid dues</SelectItem>
                    <SelectItem value="Disciplinary Issue">Disciplinary / Library Policy Violation</SelectItem>
                    <SelectItem value="Student Request">Student Personal Leave / Break</SelectItem>
                    <SelectItem value="Course Completed">Course Completed / Relocated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                className="text-xs cursor-pointer"
                onClick={() => setSuspendOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer shadow-xs gap-1.5"
                onClick={handleSuspendSubmit}
              >
                <TriangleAlert className="size-3.5" />
                <span>Confirm Suspension</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reusable Plan Details Dialog (Select mode for Renewal) */}
      <PlanDetailsDialog
        open={renewOpen}
        onOpenChange={setRenewOpen}
        mode="select"
        studentName={student.name}
        studentId={student.studentId}
        currentPlan={student.plan}
        seatNo={student.seatNo}
        shift={student.shift}
        dueDate={student.dueDate}
        totalFee={student.totalFee}
        onSelectPlan={(plan) => handleRenewSubmit(plan.name)}
      />
    </section>
  )
}
