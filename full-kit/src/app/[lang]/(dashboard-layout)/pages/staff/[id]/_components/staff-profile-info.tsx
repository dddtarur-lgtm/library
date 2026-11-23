"use client"

import {
  Building2,
  Calendar,
  Clock,
  Eye,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react"

import type { StaffMember } from "@/data/library-management-data"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StaffProfileInfo({ staff }: { staff: StaffMember }) {
  return (
    <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-3 min-w-0">
      {/* 1. Role & Assignment Card */}
      <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
        <CardHeader className="p-3 pb-2 border-b border-border/80">
          <div className="flex items-center justify-between min-w-0 gap-2">
            <CardTitle className="text-xs font-bold flex items-center gap-1.5 truncate">
              <ShieldCheck className="size-3.5 text-primary shrink-0" />
              <span className="truncate">Staff Credentials</span>
            </CardTitle>
            <Badge
              variant="outline"
              className="text-[10px] font-mono font-semibold border-primary/30 text-primary bg-primary/5 shrink-0 px-1.5 py-0"
            >
              {staff.id.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-border/60 min-w-0 gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium shrink-0">
              <User className="size-3 text-muted-foreground" />
              Assigned Role
            </span>
            <span className="font-bold text-foreground truncate">{staff.role}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border/60 min-w-0 gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium shrink-0">
              <Building2 className="size-3 text-muted-foreground" />
              Primary Branch
            </span>
            <span className="font-semibold text-foreground text-end truncate">
              {staff.branchName.replace(" - Central Library", "").trim()}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border/60 min-w-0 gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium shrink-0">
              <Calendar className="size-3 text-muted-foreground" />
              Joined On
            </span>
            <span className="font-semibold text-foreground truncate">{staff.joinedAt}</span>
          </div>

          <div className="flex items-center justify-between py-1 min-w-0 gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium shrink-0">
              <Clock className="size-3 text-muted-foreground" />
              Last Active
            </span>
            <span className="font-semibold text-emerald-500 truncate">{staff.lastActiveAt}</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Contact & Desk Info */}
      <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
        <CardHeader className="p-3 pb-2 border-b border-border/80">
          <CardTitle className="text-xs font-bold flex items-center gap-1.5 truncate">
            <Phone className="size-3.5 text-primary shrink-0" />
            <span className="truncate">Contact Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2 text-xs">
          <div className="space-y-0.5 py-0.5 border-b border-border/60">
            <div className="text-[10px] text-muted-foreground">Official Email</div>
            <div className="font-mono font-medium text-foreground truncate">{staff.email}</div>
          </div>

          <div className="space-y-0.5 py-0.5 border-b border-border/60">
            <div className="text-[10px] text-muted-foreground">Mobile Phone</div>
            <div className="font-mono font-medium text-foreground">{staff.phone}</div>
          </div>

          <div className="space-y-0.5 py-0.5 border-b border-border/60">
            <div className="text-[10px] text-muted-foreground">Emergency Contact</div>
            <div className="font-mono font-medium text-foreground">+91 99000 11223 (Relative)</div>
          </div>

          <div className="space-y-0.5 py-0.5">
            <div className="text-[10px] text-muted-foreground">Station Assignment</div>
            <div className="font-medium text-foreground">Front Counter Desk #1 (Main Gate)</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
