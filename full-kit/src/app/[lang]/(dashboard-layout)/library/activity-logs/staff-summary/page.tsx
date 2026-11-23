"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  Activity,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Download,
  Filter,
  Monitor,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function StaffAuditSummaryPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const staffSummaries = [
    {
      id: "staff-1",
      name: "Dr. Rajesh Sharma",
      role: "Library Admin (Owner)",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      actionsToday: 24,
      feesCollected: "₹18,500 (7 txns)",
      admissions: 4,
      attendanceEdits: 0,
      activeSession: "Chrome on macOS (23.0338° N)",
      lastActive: "10 mins ago",
      complianceScore: 100,
    },
    {
      id: "staff-2",
      name: "Rohan Desai",
      role: "Sub Admin (Main Branch)",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      actionsToday: 48,
      feesCollected: "₹34,000 (14 txns)",
      admissions: 6,
      attendanceEdits: 2,
      activeSession: "Firefox on Windows 11 (Desk Terminal 1)",
      lastActive: "Just now",
      complianceScore: 96,
    },
    {
      id: "staff-3",
      name: "Pooja Mehta",
      role: "Sub Admin (Main Branch)",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      actionsToday: 32,
      feesCollected: "₹12,000 (5 txns)",
      admissions: 2,
      attendanceEdits: 1,
      activeSession: "Mobile Safari (Branch Wi-Fi)",
      lastActive: "25 mins ago",
      complianceScore: 98,
    },
    {
      id: "staff-4",
      name: "Amit Patel",
      role: "Front Desk Staff",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      actionsToday: 62,
      feesCollected: "₹8,200 (6 txns)",
      admissions: 1,
      attendanceEdits: 5,
      activeSession: "Edge on Windows 10 (Front Desk Kiosk)",
      lastActive: "2 mins ago",
      complianceScore: 91,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={ensureLocalizedPathname("/pages/activity-logs", lang)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Activity Logs
            </Link>
            <ChevronRight className="size-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-primary">Staff Operations Summary</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Staff Audit &amp; Performance Summary
          </h1>
          <p className="text-sm text-muted-foreground">
            Aggregate action breakdown, daily fee collections per operator, manual attendance overrides, and session states.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={ensureLocalizedPathname("/pages/activity-logs", lang)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs font-medium hover:bg-muted/50"
          >
            ← Back to All Logs
          </Link>
          <Button variant="outline" size="sm" className="h-9 gap-1.5">
            <Download className="size-4" />
            Download Summary
          </Button>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {staffSummaries.map((staff) => (
          <Card key={staff.id} className="border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-10 border border-border/60">
                  <AvatarImage src={staff.avatar} alt={staff.name} />
                  <AvatarFallback>{staff.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-semibold leading-none">{staff.name}</h3>
                  <Badge variant="secondary" className="mt-1 text-[10px] font-normal">
                    {staff.role}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-t border-border/40 pt-2">
                <span className="text-muted-foreground">Actions Today:</span>
                <span className="font-bold text-primary">{staff.actionsToday} Ops</span>
              </div>

              <div className="flex items-center justify-between border-t border-border/40 pt-1">
                <span className="text-muted-foreground">Fees Handled:</span>
                <span className="font-semibold text-emerald-600">{staff.feesCollected}</span>
              </div>

              <div className="flex items-center justify-between border-t border-border/40 pt-1">
                <span className="text-muted-foreground">New Admissions:</span>
                <span className="font-medium">{staff.admissions} Students</span>
              </div>

              <div className="flex items-center justify-between border-t border-border/40 pt-1">
                <span className="text-muted-foreground">Manual Overrides:</span>
                <span className={staff.attendanceEdits > 2 ? "font-semibold text-amber-600" : "font-medium"}>
                  {staff.attendanceEdits} edits
                </span>
              </div>

              <div className="space-y-1 border-t border-border/40 pt-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Compliance Rating:</span>
                  <span className="font-bold text-emerald-600">{staff.complianceScore}%</span>
                </div>
                <Progress value={staff.complianceScore} className="h-1.5" />
              </div>

              <div className="rounded-lg bg-muted/30 p-2 text-[10px] text-muted-foreground">
                <div className="font-medium text-foreground flex items-center gap-1">
                  <Monitor className="size-3" />
                  {staff.activeSession}
                </div>
                <div className="mt-0.5">Last active: {staff.lastActive}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Staff Actions Detailed Table */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Today's Staff Reconciliations</CardTitle>
          <CardDescription>
            Audit integrity checks cross-referenced with cash day-book receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs">Staff Member</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs">Total Ops Today</TableHead>
                  <TableHead className="text-xs">Cash Handled</TableHead>
                  <TableHead className="text-xs">Day-Book Status</TableHead>
                  <TableHead className="text-xs">Override Risk Score</TableHead>
                  <TableHead className="text-right text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffSummaries.map((staff) => (
                  <TableRow key={staff.id} className="hover:bg-muted/30">
                    <TableCell className="font-semibold text-xs">
                      {staff.name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {staff.role}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium">
                      {staff.actionsToday}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-emerald-600">
                      {staff.feesCollected}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px]">
                        <CheckCircle2 className="mr-1 size-3" />
                        Reconciled &amp; Signed
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          staff.complianceScore >= 95
                            ? "bg-emerald-100 text-emerald-800 text-[10px]"
                            : "bg-amber-100 text-amber-800 text-[10px]"
                        }
                      >
                        {staff.complianceScore >= 95 ? "Low Risk" : "Elevated Risk"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        View Log Trail →
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

