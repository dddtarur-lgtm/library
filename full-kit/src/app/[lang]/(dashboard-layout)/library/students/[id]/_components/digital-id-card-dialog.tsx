"use client"

import { Armchair, Download, Printer, QrCode } from "lucide-react"

import type { StudentProfile } from "@/data/students-data"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function DigitalIdCardDialog({
  student,
  trigger,
}: {
  student: StudentProfile
  trigger?: React.ReactNode
}) {
  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs font-semibold border-border hover:bg-accent cursor-pointer"
          >
            <QrCode className="size-4 text-primary" />
            <span>Digital ID Card</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md border-border bg-card p-6">
        <DialogHeader className="pb-3 border-b border-border pe-8">
          <DialogTitle className="text-base font-bold text-foreground">
            Student Digital Library Pass
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Official library access card with encrypted QR for smart entry & book borrowing.
          </DialogDescription>
        </DialogHeader>

        {/* Digital ID Card Preview */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card/90 to-primary/5 p-5 shadow-lg">
          {/* Card Top Brand */}
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Apex Study Hub
              </p>
              <h4 className="text-sm font-extrabold text-foreground tracking-tight">
                Library Member Pass
              </h4>
            </div>
            <Badge className="border-0 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] px-2 py-0.5">
              ● Active Member
            </Badge>
          </div>

          {/* Student Profile Info on Card */}
          <div className="flex items-center gap-x-4 my-4">
            <Avatar className="size-16 rounded-xl border-2 border-primary/40 shadow-sm shrink-0">
              <AvatarImage src={student.avatar} alt={student.name} />
              <AvatarFallback className="text-sm font-bold bg-muted">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-base text-foreground truncate">
                {student.name}
              </h3>
              <p className="text-xs font-semibold text-primary">{student.studentId}</p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-medium">
                {student.examTarget}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-xl border border-border/60">
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">
                Allocated Seat
              </span>
              <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                <Armchair className="size-3 text-blue-600 dark:text-blue-400" />
                {student.seatNo}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">
                Shift Timing
              </span>
              <span className="font-bold text-foreground mt-0.5 block truncate">
                {student.shift.split("(")[0].trim()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">
                Membership Valid Till
              </span>
              <span className="font-bold text-foreground mt-0.5 block">
                {student.dueDate}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">
                Emergency Contact
              </span>
              <span className="font-bold text-foreground mt-0.5 block truncate">
                {student.guardianPhone}
              </span>
            </div>
          </div>

          {/* Barcode & QR Code Section */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/80">
            <div className="text-[10px] text-muted-foreground">
              <p className="font-mono font-bold tracking-widest text-foreground">
                {student.qrCardId}
              </p>
              <p className="text-[9px] mt-0.5 text-muted-foreground">
                Scan for entry / exit QR gates
              </p>
            </div>
            <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-xs">
              <QrCode className="size-10 text-slate-900" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs border-border"
            onClick={handlePrint}
          >
            <Printer className="size-3.5" />
            <span>Print ID Card</span>
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-semibold"
            onClick={handlePrint}
          >
            <Download className="size-3.5" />
            <span>Download PDF</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
