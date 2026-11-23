"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  History,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  User,
  Users,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  initialActivityLogs,
  type ActivityLogItem,
} from "@/data/library-management-data"

export default function ActivityLogsPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [logs, setLogs] = useState<ActivityLogItem[]>(initialActivityLogs)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedModule, setSelectedModule] = useState("all")
  const [selectedRole, setSelectedRole] = useState("all")
  const [showRiskyOnly, setShowRiskyOnly] = useState(false)
  const [activeDiffItem, setActiveDiffItem] = useState<ActivityLogItem | null>(null)

  const filteredLogs = logs.filter((item) => {
    const matchesSearch =
      item.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.targetEntity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.entityId.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesModule = selectedModule === "all" || item.module === selectedModule
    const matchesRole = selectedRole === "all" || item.actorRole === selectedRole
    const matchesRisky = !showRiskyOnly || item.isRisky

    return matchesSearch && matchesModule && matchesRole && matchesRisky
  })

  const riskyCount = logs.filter((l) => l.isRisky).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Audit &amp; Security</span>
            <ChevronRight className="size-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-primary">Activity Logs</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Activity &amp; Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Immutable timeline of staff operations, financial transactions, permission changes, and security events.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={ensureLocalizedPathname("/pages/activity-logs/security-alerts", lang)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
          >
            <ShieldAlert className="size-4" />
            Security Alerts ({riskyCount})
          </Link>

          <Link
            href={ensureLocalizedPathname("/pages/activity-logs/staff-summary", lang)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs font-medium hover:bg-muted/50"
          >
            <Users className="size-4 text-muted-foreground" />
            Staff Summary
          </Link>

          <Link
            href={ensureLocalizedPathname("/pages/activity-logs/archive", lang)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs font-medium hover:bg-muted/50"
          >
            <History className="size-4 text-muted-foreground" />
            2-Yr Archive
          </Link>

          <Button variant="outline" size="sm" className="h-9 gap-1.5">
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Total Logged Events
            </CardTitle>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Activity className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,482</div>
            <div className="mt-1 text-xs text-muted-foreground">Across all modules past 30 days</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Active Operators Today
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4 Staff</div>
            <div className="mt-1 text-xs text-emerald-600">All authenticated with MFA</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              High-Risk Operations
            </CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600">
              <ShieldAlert className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{riskyCount} Flagged</div>
            <div className="mt-1 text-xs text-muted-foreground">Overrides, discounts &amp; deletions</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Audit Compliance
            </CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
              <Shield className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">100% Immutable</div>
            <div className="mt-1 text-xs text-muted-foreground">SHA-256 ledger signed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-border/60 bg-card/80">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search staff name, action, student ID, IP address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="h-9 w-36 text-xs">
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="Fees & Plans">Fees &amp; Plans</SelectItem>
                  <SelectItem value="Students">Students</SelectItem>
                  <SelectItem value="Attendance">Attendance</SelectItem>
                  <SelectItem value="Seats">Seats</SelectItem>
                  <SelectItem value="Books">Books</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="Settings">Settings</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="h-9 w-36 text-xs">
                  <SelectValue placeholder="Staff Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Library Admin">Library Admin</SelectItem>
                  <SelectItem value="Sub Admin">Sub Admin</SelectItem>
                  <SelectItem value="Front Desk Staff">Front Desk Staff</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showRiskyOnly ? "destructive" : "outline"}
                size="sm"
                className="h-9 text-xs gap-1.5"
                onClick={() => setShowRiskyOnly(!showRiskyOnly)}
              >
                <AlertOctagon className="size-3.5" />
                {showRiskyOnly ? "Showing Flagged Only" : "High-Risk Only"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Audit Event Ledger</CardTitle>
              <CardDescription>
                Real-time capture of system interactions with IP tracking and modification diffs
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Showing {filteredLogs.length} events
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs">Timestamp</TableHead>
                  <TableHead className="text-xs">Operator (Actor)</TableHead>
                  <TableHead className="text-xs">Module</TableHead>
                  <TableHead className="text-xs">Action Performed</TableHead>
                  <TableHead className="text-xs">Target Entity</TableHead>
                  <TableHead className="text-xs">IP &amp; Device</TableHead>
                  <TableHead className="text-right text-xs">Diff / Audit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                      No activity logs match the selected filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3 text-muted-foreground" />
                          <span>{item.timestamp}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-7 border border-border/60">
                            <AvatarImage src={item.avatar} alt={item.actorName} />
                            <AvatarFallback className="text-[10px]">
                              {item.actorName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-xs font-semibold leading-none">{item.actorName}</div>
                            <Badge
                              variant="secondary"
                              className="mt-1 text-[9px] py-0 px-1 font-normal"
                            >
                              {item.actorRole}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            item.module === "Fees & Plans"
                              ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5 text-[10px]"
                              : item.module === "Security"
                              ? "border-rose-500/30 text-rose-600 bg-rose-500/5 text-[10px]"
                              : item.module === "Attendance"
                              ? "border-blue-500/30 text-blue-600 bg-blue-500/5 text-[10px]"
                              : "text-[10px]"
                          }
                        >
                          {item.module}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {item.isRisky && (
                            <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                          )}
                          <span
                            className={`text-xs font-medium ${
                              item.isRisky ? "text-amber-700 dark:text-amber-400 font-semibold" : ""
                            }`}
                          >
                            {item.action}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs">{item.targetEntity}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          ID: {item.entityId}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-mono">{item.ipAddress}</div>
                        <div className="text-[10px] text-muted-foreground">{item.device}</div>
                      </TableCell>

                      <TableCell className="text-right">
                        {item.diff ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] gap-1"
                            onClick={() => setActiveDiffItem(item)}
                          >
                            <Eye className="size-3" />
                            View Diff
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Standard
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Before & After Diff Modal */}
      {activeDiffItem && (
        <Dialog open={!!activeDiffItem} onOpenChange={() => setActiveDiffItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="size-4 text-primary" />
                Audit Modification Diff
              </DialogTitle>
              <DialogDescription>
                Detailed state changes captured for {activeDiffItem.targetEntity}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/30 p-2.5 text-[11px]">
                <div>
                  <span className="text-muted-foreground">Operator:</span>{" "}
                  <strong className="text-foreground">{activeDiffItem.actorName}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Timestamp:</span>{" "}
                  <strong className="text-foreground">{activeDiffItem.timestamp}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">IP Address:</span>{" "}
                  <span className="font-mono text-foreground">{activeDiffItem.ipAddress}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Action:</span>{" "}
                  <span className="font-semibold text-primary">{activeDiffItem.action}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
                  <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mb-1">
                    Previous State (Before)
                  </div>
                  <div className="font-mono text-xs text-rose-900 dark:text-rose-200">
                    {activeDiffItem.diff?.before}
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                    Updated State (After)
                  </div>
                  <div className="font-mono text-xs text-emerald-900 dark:text-emerald-200">
                    {activeDiffItem.diff?.after}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
