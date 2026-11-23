"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  UserCheck,
  UserX,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Textarea } from "@/components/ui/textarea"
import { LibraryAvatar } from "@/components/platform/library-logo"

interface ReportedCase {
  id: string
  studentName: string
  reportedBy: string
  libraryCode: string
  date: string
  incidentType: string
  description: string
  status:
    | "Under Review"
    | "Escalated"
    | "Suspended (Cross-Platform)"
    | "Resolved"
  severity: "Critical" | "High" | "Medium"
  resolutionNote?: string
}

const INITIAL_CASES: ReportedCase[] = [
  {
    id: "CASE-401",
    studentName: "Vikas Malhotra",
    reportedBy: "Apex Study Hub",
    libraryCode: "LIB-PUN-001",
    date: "03 Nov 2026",
    incidentType: "Property Damage & Disturbance",
    description:
      "Repeated physical damage to electrical ports and persistent noise violations after hours.",
    status: "Under Review",
    severity: "High",
  },
  {
    id: "CASE-400",
    studentName: "Aditya Roy",
    reportedBy: "Metro Library Network",
    libraryCode: "LIB-DEL-002",
    date: "29 Oct 2026",
    incidentType: "Seat Squatting / Unpaid Occupancy",
    description:
      "Attempted to use counterfeit QR badges to access reserved premium study cabins.",
    status: "Suspended (Cross-Platform)",
    severity: "Critical",
    resolutionNote: "Cross-platform QR access revoked for 90 days.",
  },
  {
    id: "CASE-399",
    studentName: "Neha Kulkarni",
    reportedBy: "Takshashila Reading Room",
    libraryCode: "LIB-BLR-003",
    date: "22 Oct 2026",
    incidentType: "Policy Violation (Outside Food / Noise)",
    description:
      "Two formal warnings issued by branch supervisor; student acknowledged terms.",
    status: "Resolved",
    severity: "Medium",
    resolutionNote: "Written warning logged; restored to good standing.",
  },
  {
    id: "CASE-398",
    studentName: "Siddharth Joshi",
    reportedBy: "Scholars Point",
    libraryCode: "LIB-JAI-004",
    date: "18 Oct 2026",
    incidentType: "Account Sharing / Proxy Check-In",
    description:
      "Biometric mismatch flagged 4 times during morning shift check-ins.",
    status: "Escalated",
    severity: "High",
  },
]

function severityBadge(severity: ReportedCase["severity"]) {
  if (severity === "Critical") {
    return (
      <Badge variant="secondary" className="bg-destructive/15 text-destructive">
        Critical
      </Badge>
    )
  }
  if (severity === "High") {
    return (
      <Badge
        variant="secondary"
        className="bg-amber-500/15 text-amber-700 dark:text-amber-300"
      >
        High
      </Badge>
    )
  }
  return <Badge variant="outline">Medium</Badge>
}

function caseStatusBadge(status: ReportedCase["status"]) {
  if (status === "Resolved") {
    return (
      <Badge
        variant="secondary"
        className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      >
        Resolved
      </Badge>
    )
  }
  if (status === "Suspended (Cross-Platform)") {
    return (
      <Badge variant="secondary" className="bg-destructive/15 text-destructive">
        Suspended
      </Badge>
    )
  }
  if (status === "Escalated") {
    return (
      <Badge
        variant="secondary"
        className="bg-amber-500/15 text-amber-700 dark:text-amber-300"
      >
        Escalated
      </Badge>
    )
  }
  return <Badge variant="secondary">Under Review</Badge>
}

export function ReportedCasesPanel() {
  const [cases, setCases] = useState<ReportedCase[]>(INITIAL_CASES)
  const [search, setSearch] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeCase, setActiveCase] = useState<ReportedCase | null>(null)
  const [note, setNote] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cases.filter((c) => {
      if (severityFilter !== "all" && c.severity !== severityFilter) {
        return false
      }
      if (statusFilter !== "all" && c.status !== statusFilter) return false
      if (!q) return true
      return (
        c.studentName.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.reportedBy.toLowerCase().includes(q) ||
        c.incidentType.toLowerCase().includes(q)
      )
    })
  }, [cases, search, severityFilter, statusFilter])

  const openCount = cases.filter(
    (c) => c.status === "Under Review" || c.status === "Escalated"
  ).length
  const suspendedCount = cases.filter(
    (c) => c.status === "Suspended (Cross-Platform)"
  ).length
  const resolvedCount = cases.filter((c) => c.status === "Resolved").length

  const updateCaseStatus = (nextStatus: ReportedCase["status"]) => {
    if (!activeCase) return
    const updatedNote = note.trim() || activeCase.resolutionNote || ""
    setCases((prev) =>
      prev.map((c) =>
        c.id === activeCase.id
          ? { ...c, status: nextStatus, resolutionNote: updatedNote }
          : c
      )
    )
    toast.success(`${activeCase.id} marked as ${nextStatus}`)
    setActiveCase(null)
    setNote("")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Active Reviews",
            value: openCount,
            sub: "Under review or escalated",
            icon: Clock,
            tone: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
          },
          {
            label: "Cross-Platform Suspensions",
            value: suspendedCount,
            sub: "Blocked from QR/biometric entry",
            icon: UserX,
            tone: "text-destructive bg-destructive/10",
          },
          {
            label: "Resolved Cases",
            value: resolvedCount,
            sub: "Closed with documented outcome",
            icon: UserCheck,
            tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
          },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="border-border bg-card shadow-sm">
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {item.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {item.sub}
                  </p>
                </div>
                <div
                  className={`flex size-10 items-center justify-center rounded-lg ${item.tone}`}
                >
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base">Incident Queue</CardTitle>
            <CardDescription>
              Click any case to inspect incident details and apply moderation.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search case, student, library..."
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="All Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Escalated">Escalated</SelectItem>
                <SelectItem value="Suspended (Cross-Platform)">
                  Suspended
                </SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Case &amp; Student</TableHead>
                  <TableHead>Reported By</TableHead>
                  <TableHead>Incident Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No reported cases match your filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setActiveCase(item)
                        setNote(item.resolutionNote ?? "")
                      }}
                    >
                      <TableCell className="pl-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {item.studentName}
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {item.id} • {item.date}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <LibraryAvatar
                            name={item.reportedBy}
                            code={item.libraryCode}
                            size="xs"
                          />
                          <span className="text-xs font-medium text-foreground">
                            {item.reportedBy}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-xs text-foreground">
                        {item.incidentType}
                      </TableCell>
                      <TableCell>{severityBadge(item.severity)}</TableCell>
                      <TableCell>{caseStatusBadge(item.status)}</TableCell>
                      <TableCell
                        className="pr-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs"
                          onClick={() => {
                            setActiveCase(item)
                            setNote(item.resolutionNote ?? "")
                          }}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(activeCase)}
        onOpenChange={(open) => {
          if (!open) setActiveCase(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2 text-base">
              <span>
                {activeCase?.id} — {activeCase?.studentName}
              </span>
              {activeCase && severityBadge(activeCase.severity)}
            </DialogTitle>
            <DialogDescription>
              Reported by {activeCase?.reportedBy} on {activeCase?.date}
            </DialogDescription>
          </DialogHeader>
          {activeCase && (
            <div className="space-y-4 text-xs">
              <div className="space-y-1 rounded-lg border border-border bg-muted/40 p-3">
                <p className="font-semibold text-foreground">
                  {activeCase.incidentType}
                </p>
                <p className="leading-relaxed text-muted-foreground">
                  {activeCase.description}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="case-note" className="text-xs">
                  Moderation / Audit Note
                </Label>
                <Textarea
                  id="case-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add resolution notes or evidence summary..."
                  className="text-xs"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-wrap gap-2 sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-xs"
                onClick={() => updateCaseStatus("Escalated")}
              >
                <AlertTriangle className="size-3.5 text-amber-500" />
                Escalate
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="gap-1 text-xs"
                onClick={() => updateCaseStatus("Suspended (Cross-Platform)")}
              >
                <UserX className="size-3.5" />
                Suspend
              </Button>
            </div>
            <Button
              size="sm"
              className="gap-1 text-xs"
              onClick={() => updateCaseStatus("Resolved")}
            >
              <CheckCircle2 className="size-3.5" />
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
