"use client"

import {
  Armchair,
  BookMarked,
  Building2,
  Calendar,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  User,
} from "lucide-react"

import type { StudentProfile } from "@/data/students-data"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function StudentProfileInfo({ student }: { student: StudentProfile }) {
  return (
    <div className="w-full lg:w-64 xl:w-72 shrink-0 space-y-3 min-w-0">
      {/* 1. Membership & Allocation Card */}
      <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
        <CardHeader className="p-2.5 px-3 pb-1.5 border-b border-border/80">
          <div className="flex items-center justify-between min-w-0 gap-2">
            <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate">
              <BookMarked className="size-3.5 text-primary shrink-0" />
              <span className="truncate">Membership Details</span>
            </CardTitle>
            <Badge
              variant="outline"
              className="text-[10px] font-semibold border-primary/30 text-primary bg-primary/5 shrink-0 px-1.5 py-0"
            >
              {student.planDuration}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-2.5 px-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between py-0.5 border-b border-border/60 min-w-0 gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium shrink-0">
              <Building2 className="size-3 text-muted-foreground" />
              Branch
            </span>
            <span className="font-bold text-foreground text-end truncate">
              {student.branch.split("(")[0].trim()}
            </span>
          </div>

          <div className="flex items-center justify-between py-0.5 border-b border-border/60 min-w-0 gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium shrink-0">
              <Armchair className="size-3 text-blue-500" />
              Allocated Seat
            </span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md border border-blue-500/20 truncate text-[11px]">
              {student.seatNo} ({student.floor})
            </span>
          </div>

          <div className="flex items-center justify-between py-0.5 border-b border-border/60 min-w-0 gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium shrink-0">
              <Lock className="size-3 text-muted-foreground" />
              Locker Number
            </span>
            <span className="font-bold text-foreground truncate">{student.lockerNo}</span>
          </div>

          <div className="flex items-center justify-between py-0.5 border-b border-border/60 min-w-0 gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium shrink-0">
              <Calendar className="size-3 text-muted-foreground" />
              Admission Date
            </span>
            <span className="font-semibold text-foreground truncate">{student.joinDate}</span>
          </div>

          <div className="flex items-center justify-between py-0.5 min-w-0 gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium shrink-0">
              <ShieldAlert className="size-3 text-amber-500" />
              Due Date
            </span>
            <span className="font-bold text-amber-600 dark:text-amber-400 truncate">
              {student.dueDate} ({student.daysLeft}d left)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Personal Information Card */}
      <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
        <CardHeader className="p-2.5 px-3 pb-1.5 border-b border-border/80">
          <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate">
            <User className="size-3.5 text-primary shrink-0" />
            <span className="truncate">Personal Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 px-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between py-0.5 border-b border-border/60">
            <span className="text-muted-foreground font-medium">Gender / Blood</span>
            <span className="font-bold text-foreground">
              {student.gender} • {student.bloodGroup}
            </span>
          </div>

          <div className="flex items-center justify-between py-0.5 border-b border-border/60">
            <span className="text-muted-foreground font-medium">Date of Birth</span>
            <span className="font-bold text-foreground">{student.dob}</span>
          </div>

          <div className="py-0.5 border-b border-border/60">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium mb-0.5">
              <Phone className="size-3 text-muted-foreground" />
              Phone Number
            </span>
            <span className="font-bold text-foreground block ps-4">{student.phone}</span>
          </div>

          <div className="py-0.5 border-b border-border/60">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium mb-0.5">
              <Mail className="size-3 text-muted-foreground" />
              Email Address
            </span>
            <span className="font-bold text-foreground block ps-4 truncate">
              {student.email}
            </span>
          </div>

          <div className="py-0.5">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium mb-0.5">
              <MapPin className="size-3 text-muted-foreground" />
              Address
            </span>
            <span className="font-semibold text-foreground block ps-4 leading-normal">
              {student.address}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
