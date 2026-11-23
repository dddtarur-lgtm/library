"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Filter,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserX,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function SecurityAlertsPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [alerts, setAlerts] = useState([
    {
      id: "sec-01",
      timestamp: "Today, 02:45 AM",
      threatLevel: "High",
      category: "After-Hours Access",
      actor: "Amit Patel (Staff ID #4)",
      role: "Front Desk Staff",
      ip: "103.24.11.89 (Home ISP)",
      description: "Staff logged into administrative portal outside branch operational hours (06:00 - 23:00).",
      status: "Pending Review",
    },
    {
      id: "sec-02",
      timestamp: "Yesterday, 04:10 PM",
      threatLevel: "Critical",
      category: "PII Mass Export",
      actor: "Rohan Desai (Sub Admin)",
      role: "Sub Admin",
      ip: "192.168.1.45 (Branch Wi-Fi)",
      description: "Full directory export of 310 active student phone numbers & addresses triggered to unencrypted CSV.",
      status: "Pending Review",
    },
    {
      id: "sec-03",
      timestamp: "29 Oct 2026, 06:12 PM",
      threatLevel: "Medium",
      category: "Fee Override & Waiver",
      actor: "Pooja Mehta (Sub Admin)",
      role: "Sub Admin",
      ip: "192.168.1.18 (Branch Wi-Fi)",
      description: "Applied manual waiver of ₹800 on Student STU-1088 registration without mandatory Owner OTP.",
      status: "Reviewed & Cleared",
    },
    {
      id: "sec-04",
      timestamp: "27 Oct 2026, 09:30 AM",
      threatLevel: "Medium",
      category: "Retroactive Attendance Edit",
      actor: "Amit Patel (Staff ID #4)",
      role: "Front Desk Staff",
      ip: "192.168.1.12 (Desk Terminal)",
      description: "Modified check-in time of STU-1077 backdated by 48 hours with reason 'Student forgot to scan QR'.",
      status: "Reviewed & Cleared",
    },
  ])

  const resolveAlert = (id: string, newStatus: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    )
  }

  const pendingCount = alerts.filter((a) => a.status === "Pending Review").length

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
            <span className="text-xs font-semibold text-rose-600">High-Risk Security Alerts</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Security &amp; Abuse Monitoring
          </h1>
          <p className="text-sm text-muted-foreground">
            Automated anomaly detection flagging unauthorized access, bulk data exports, and unverified fee waivers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={ensureLocalizedPathname("/pages/activity-logs", lang)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs font-medium hover:bg-muted/50"
          >
            ← Back to All Logs
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Pending Alerts
            </CardTitle>
            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-600">
              <ShieldAlert className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{pendingCount} Action Required</div>
            <div className="mt-1 text-xs text-muted-foreground">Requires owner verification</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Resolved This Week
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
              <ShieldCheck className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">2 Verified</div>
            <div className="mt-1 text-xs text-muted-foreground">All cleared with supervisor note</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Threat Engine Status
            </CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
              <Lock className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Active &amp; Guarding</div>
            <div className="mt-1 text-xs text-muted-foreground">Real-time heuristics enabled</div>
          </CardContent>
        </Card>
      </div>

      {/* Security Incident List */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertOctagon className="size-4 text-rose-600" />
            Security Anomaly Incidents
          </CardTitle>
          <CardDescription>
            High-risk events intercepted by rule-based heuristic filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs">Severity &amp; Time</TableHead>
                  <TableHead className="text-xs">Incident Type</TableHead>
                  <TableHead className="text-xs">Operator &amp; IP</TableHead>
                  <TableHead className="text-xs">Description &amp; Heuristic Reason</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="destructive"
                          className={
                            alert.threatLevel === "Critical"
                              ? "bg-rose-600 text-white text-[10px]"
                              : alert.threatLevel === "High"
                              ? "bg-amber-600 text-white text-[10px]"
                              : "bg-blue-600 text-white text-[10px]"
                          }
                        >
                          {alert.threatLevel}
                        </Badge>
                      </div>
                      <div className="mt-1 text-[11px] font-mono text-muted-foreground">
                        {alert.timestamp}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs font-semibold">
                      {alert.category}
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-medium">{alert.actor}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{alert.ip}</div>
                    </TableCell>

                    <TableCell className="max-w-md text-xs text-muted-foreground">
                      {alert.description}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          alert.status === "Pending Review"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        }
                      >
                        {alert.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      {alert.status === "Pending Review" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                            onClick={() => resolveAlert(alert.id, "Reviewed & Cleared")}
                          >
                            <CheckCircle2 className="size-3 mr-1" />
                            Verify
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => resolveAlert(alert.id, "Session Revoked")}
                          >
                            <UserX className="size-3" />
                            Revoke
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground font-medium">
                          Signed-off
                        </span>
                      )}
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

