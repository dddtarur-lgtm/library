"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  AlertTriangle,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  LayoutGrid,
  LayoutList,
  Lock,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
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
import { ReportedCasesPanel } from "./_components/reported-cases-panel"
import { LibraryAvatar } from "@/components/platform/library-logo"

interface PlatformStudent {
  id: string
  name: string
  phone: string
  email: string
  libraryName: string
  libraryCode: string
  branch: string
  seatPlan: string
  joinedAt: string
  validUntil: string
  attendanceRate: number
  lastPayment: string
  status: "Active" | "Expiring Soon" | "Suspended"
}

const INITIAL_STUDENTS: PlatformStudent[] = [
  {
    id: "STU-9012",
    name: "Aarav Sharma",
    phone: "+91 98250 11223",
    email: "aarav.sharma@student.in",
    libraryName: "Apex Study Hub",
    libraryCode: "LIB-PUN-001",
    branch: "Main Branch, Kothrud",
    seatPlan: "Reserved Cabin • Full Day",
    joinedAt: "14 Jan 2026",
    validUntil: "14 Dec 2026",
    attendanceRate: 94,
    lastPayment: "₹2,400 (Paid)",
    status: "Active",
  },
  {
    id: "STU-9013",
    name: "Priya Patel",
    phone: "+91 97240 44556",
    email: "priya.patel@student.in",
    libraryName: "Kalam Study Arena",
    libraryCode: "LIB-AHM-005",
    branch: "Navrangpura Hub",
    seatPlan: "AC Desk • Morning Shift",
    joinedAt: "02 Feb 2026",
    validUntil: "18 Nov 2026",
    attendanceRate: 88,
    lastPayment: "₹1,650 (Paid)",
    status: "Expiring Soon",
  },
  {
    id: "STU-9014",
    name: "Vikas Malhotra",
    phone: "+91 98765 43210",
    email: "vikas.m@student.in",
    libraryName: "Apex Study Hub",
    libraryCode: "LIB-PUN-001",
    branch: "Main Branch, Kothrud",
    seatPlan: "Standard Desk • Evening",
    joinedAt: "20 Mar 2026",
    validUntil: "20 Nov 2026",
    attendanceRate: 62,
    lastPayment: "₹1,400 (Paid)",
    status: "Suspended",
  },
  {
    id: "STU-9015",
    name: "Sneha Deshmukh",
    phone: "+91 98901 77889",
    email: "sneha.d@student.in",
    libraryName: "Metro Library Network",
    libraryCode: "LIB-DEL-002",
    branch: "Rajendra Nagar",
    seatPlan: "Quiet Zone • 24x7",
    joinedAt: "11 Apr 2026",
    validUntil: "11 Apr 2027",
    attendanceRate: 97,
    lastPayment: "₹3,100 (Paid)",
    status: "Active",
  },
  {
    id: "STU-9016",
    name: "Rohan Verma",
    phone: "+91 96543 21098",
    email: "rohan.v@student.in",
    libraryName: "Scholars Point",
    libraryCode: "LIB-JAI-004",
    branch: "Tonk Road",
    seatPlan: "Reserved Desk • Full Day",
    joinedAt: "05 May 2026",
    validUntil: "21 Nov 2026",
    attendanceRate: 81,
    lastPayment: "₹1,900 (Paid)",
    status: "Expiring Soon",
  },
  {
    id: "STU-9017",
    name: "Ananya Iyer",
    phone: "+91 98400 33221",
    email: "ananya.iyer@student.in",
    libraryName: "Takshashila Reading Room",
    libraryCode: "LIB-BLR-003",
    branch: "Indiranagar",
    seatPlan: "Executive Pod • Full Day",
    joinedAt: "19 Jun 2026",
    validUntil: "19 Jun 2027",
    attendanceRate: 95,
    lastPayment: "₹3,500 (Paid)",
    status: "Active",
  },
  {
    id: "STU-9018",
    name: "Aditya Roy",
    phone: "+91 91234 56789",
    email: "aditya.roy@student.in",
    libraryName: "Metro Library Network",
    libraryCode: "LIB-DEL-002",
    branch: "Mukherjee Nagar",
    seatPlan: "Premium Cabin • Full Day",
    joinedAt: "08 Jul 2026",
    validUntil: "08 Jan 2027",
    attendanceRate: 51,
    lastPayment: "₹2,800 (Flagged)",
    status: "Suspended",
  },
  {
    id: "STU-9019",
    name: "Kavya Nair",
    phone: "+91 94470 55443",
    email: "kavya.nair@student.in",
    libraryName: "Takshashila Reading Room",
    libraryCode: "LIB-BLR-003",
    branch: "Jayanagar",
    seatPlan: "AC Desk • Full Day",
    joinedAt: "24 Aug 2026",
    validUntil: "24 Feb 2027",
    attendanceRate: 91,
    lastPayment: "₹2,200 (Paid)",
    status: "Active",
  },
]

function maskPhone(phone: string) {
  return phone.replace(/(\+\d{2}\s\d{2})\d{3}\s\d{2}(\d{3})/, "$1*** **$2")
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@")
  if (!local || !domain) return email
  return `${local.slice(0, 2)}***@${domain}`
}

function statusBadge(status: PlatformStudent["status"]) {
  if (status === "Active") {
    return (
      <Badge
        variant="secondary"
        className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      >
        Active
      </Badge>
    )
  }
  if (status === "Expiring Soon") {
    return (
      <Badge
        variant="secondary"
        className="bg-amber-500/15 text-amber-700 dark:text-amber-300"
      >
        Expiring Soon
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="bg-destructive/15 text-destructive">
      Suspended
    </Badge>
  )
}

export default function PlatformStudentsPage() {
  const [activeTab, setActiveTab] = useState<"students" | "cases">("students")
  const [students, setStudents] = useState<PlatformStudent[]>(INITIAL_STUDENTS)
  const [searchQuery, setSearchQuery] = useState("")
  const [libraryFilter, setLibraryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [showMaskedData, setShowMaskedData] = useState(false)
  const [page, setPage] = useState(1)
  const [inspectStudent, setInspectStudent] = useState<PlatformStudent | null>(
    null
  )

  const pageSize = 6

  const libraries = useMemo(
    () => Array.from(new Set(students.map((s) => s.libraryName))),
    [students]
  )

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return students.filter((s) => {
      if (libraryFilter !== "all" && s.libraryName !== libraryFilter) {
        return false
      }
      if (statusFilter !== "all" && s.status !== statusFilter) {
        return false
      }
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.libraryName.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q)
      )
    })
  }, [students, searchQuery, libraryFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredStudents.slice(start, start + pageSize)
  }, [filteredStudents, currentPage])

  const kpis = useMemo(() => {
    const active = students.filter((s) => s.status === "Active").length
    const expiring = students.filter((s) => s.status === "Expiring Soon").length
    const suspended = students.filter((s) => s.status === "Suspended").length
    return { total: students.length, active, expiring, suspended }
  }, [students])

  const handleTogglePii = () => {
    const next = !showMaskedData
    setShowMaskedData(next)
    toast(next ? "PII unmasked for audit session" : "PII masking enabled", {
      description: next
        ? "Access logged to Platform Audit Trail."
        : "Phone numbers and emails are now masked.",
    })
  }

  const handleToggleStudentStatus = (student: PlatformStudent) => {
    const nextStatus: PlatformStudent["status"] =
      student.status === "Suspended" ? "Active" : "Suspended"
    setStudents((prev) =>
      prev.map((s) => (s.id === student.id ? { ...s, status: nextStatus } : s))
    )
    setInspectStudent((prev) =>
      prev?.id === student.id ? { ...prev, status: nextStatus } : prev
    )
    toast.success(
      nextStatus === "Suspended"
        ? `${student.name} suspended across platform`
        : `${student.name} restored to Active`
    )
  }

  const handleExportCsv = () => {
    const header = "ID,Name,Library,Branch,SeatPlan,ValidUntil,Status"
    const rows = filteredStudents.map(
      (s) =>
        `"${s.id}","${s.name}","${s.libraryName}","${s.branch}","${s.seatPlan}","${s.validUntil}","${s.status}"`
    )
    const blob = new Blob([[header, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "platform-students-directory.csv"
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filteredStudents.length} student records`)
  }

  return (
    <section className="container space-y-5 py-5">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Students Directory
            </h1>
            <Badge variant="secondary" className="gap-1 text-[11px]">
              <Lock className="size-3" />
              PII {showMaskedData ? "Visible" : "Masked"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Cross-tenant student directory with privacy controls, quick
            inspection, and conduct enforcement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setActiveTab("students")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === "students"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              All Students
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cases")}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === "cases"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              <ShieldAlert className="size-3.5 text-amber-500" />
              Reported Cases
            </button>
          </div>

          {activeTab === "students" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={handleTogglePii}
              >
                {showMaskedData ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
                {showMaskedData ? "Mask PII" : "Reveal PII"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={handleExportCsv}
              >
                <Download className="size-3.5" />
                Export CSV
              </Button>
            </>
          )}
        </div>
      </div>

      {activeTab === "cases" ? (
        <ReportedCasesPanel />
      ) : (
        <>
          {/* KPI Strip */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Total Students",
                value: kpis.total,
                sub: `${libraries.length} active libraries`,
                icon: Users,
                tone: "text-primary bg-primary/10",
              },
              {
                label: "Active Enrollments",
                value: kpis.active,
                sub: "Verified seat & plan holders",
                icon: UserCheck,
                tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
              },
              {
                label: "Expiring Soon",
                value: kpis.expiring,
                sub: "Renewals due in 14 days",
                icon: Calendar,
                tone: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
              },
              {
                label: "Suspended Accounts",
                value: kpis.suspended,
                sub: "Cross-platform conduct holds",
                icon: AlertTriangle,
                tone: "text-destructive bg-destructive/10",
              },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <Card
                  key={stat.label}
                  className="border-border bg-card shadow-sm"
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold tabular-nums text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {stat.sub}
                      </p>
                    </div>
                    <div
                      className={`flex size-10 items-center justify-center rounded-lg ${stat.tone}`}
                    >
                      <Icon className="size-5" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Directory Card */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-base">
                  Cross-Library Students
                </CardTitle>
                <CardDescription>
                  Showing {paginatedStudents.length} of{" "}
                  {filteredStudents.length} matching students
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-56">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setPage(1)
                    }}
                    placeholder="Search name, ID, phone..."
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                <Select
                  value={libraryFilter}
                  onValueChange={(v) => {
                    setLibraryFilter(v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-44 text-xs">
                    <SelectValue placeholder="All Libraries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Libraries</SelectItem>
                    {libraries.map((lib) => (
                      <SelectItem key={lib} value={lib}>
                        {lib}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>

                <div className="inline-flex items-center rounded-md border border-border bg-background p-0.5">
                  <button
                    type="button"
                    aria-label="Table view"
                    onClick={() => setViewMode("table")}
                    className={`rounded p-1.5 transition-colors ${
                      viewMode === "table"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LayoutList className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Grid view"
                    onClick={() => setViewMode("grid")}
                    className={`rounded p-1.5 transition-colors ${
                      viewMode === "grid"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LayoutGrid className="size-3.5" />
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {paginatedStudents.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No students match your current filters.
                </div>
              ) : viewMode === "table" ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-4">Student</TableHead>
                        <TableHead>Library &amp; Branch</TableHead>
                        <TableHead>Seat &amp; Plan</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="pr-4 text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedStudents.map((stu) => (
                        <TableRow
                          key={stu.id}
                          className="cursor-pointer"
                          onClick={() => setInspectStudent(stu)}
                        >
                          <TableCell className="pl-4">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {stu.name}
                              </p>
                              <p className="font-mono text-[11px] text-muted-foreground">
                                {stu.id} •{" "}
                                {showMaskedData
                                  ? stu.phone
                                  : maskPhone(stu.phone)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <LibraryAvatar
                                name={stu.libraryName}
                                code={stu.libraryCode}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium text-foreground">
                                  {stu.libraryName}
                                </p>
                                <p className="truncate text-[11px] text-muted-foreground">
                                  {stu.branch}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-foreground">
                            {stu.seatPlan}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {stu.validUntil}
                          </TableCell>
                          <TableCell>{statusBadge(stu.status)}</TableCell>
                          <TableCell
                            className="pr-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs"
                              onClick={() => setInspectStudent(stu)}
                            >
                              Inspect
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedStudents.map((stu) => (
                    <div
                      key={stu.id}
                      onClick={() => setInspectStudent(stu)}
                      className="cursor-pointer rounded-xl border border-border bg-background/60 p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {stu.name}
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {stu.id}
                          </p>
                        </div>
                        {statusBadge(stu.status)}
                      </div>

                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/70 bg-card p-2">
                        <LibraryAvatar
                          name={stu.libraryName}
                          code={stu.libraryCode}
                          size="xs"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-foreground">
                            {stu.libraryName}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {stu.branch}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1.5">
                          <Phone className="size-3" />
                          {showMaskedData ? stu.phone : maskPhone(stu.phone)}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Building2 className="size-3" />
                          {stu.seatPlan}
                        </p>
                        <p className="flex items-center justify-between pt-1 text-[11px]">
                          <span>Valid until {stu.validUntil}</span>
                          <span className="font-semibold text-foreground">
                            {stu.attendanceRate}% attend.
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border/70 px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 px-2.5 text-xs"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-3.5" />
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 px-2.5 text-xs"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick-Inspect Dialog */}
          <Dialog
            open={Boolean(inspectStudent)}
            onOpenChange={(open) => {
              if (!open) setInspectStudent(null)
            }}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-2 text-base">
                  <span>{inspectStudent?.name}</span>
                  {inspectStudent && statusBadge(inspectStudent.status)}
                </DialogTitle>
                <DialogDescription>
                  Student ID {inspectStudent?.id} • Joined{" "}
                  {inspectStudent?.joinedAt}
                </DialogDescription>
              </DialogHeader>
              {inspectStudent && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
                    <LibraryAvatar
                      name={inspectStudent.libraryName}
                      code={inspectStudent.libraryCode}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {inspectStudent.libraryName}
                      </p>
                      <p className="text-muted-foreground">
                        {inspectStudent.branch} • {inspectStudent.seatPlan}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3">
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-mono font-medium text-foreground">
                        {showMaskedData
                          ? inspectStudent.phone
                          : maskPhone(inspectStudent.phone)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-mono font-medium text-foreground">
                        {showMaskedData
                          ? inspectStudent.email
                          : maskEmail(inspectStudent.email)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Attendance Rate</p>
                      <p className="font-semibold text-foreground">
                        {inspectStudent.attendanceRate}% (30d)
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Payment</p>
                      <p className="font-semibold text-foreground">
                        {inspectStudent.lastPayment}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter className="gap-2 sm:justify-between">
                {inspectStudent && (
                  <Button
                    size="sm"
                    variant={
                      inspectStudent.status === "Suspended"
                        ? "default"
                        : "destructive"
                    }
                    className="gap-1.5 text-xs"
                    onClick={() => handleToggleStudentStatus(inspectStudent)}
                  >
                    <ShieldCheck className="size-3.5" />
                    {inspectStudent.status === "Suspended"
                      ? "Restore Active"
                      : "Suspend Account"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInspectStudent(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </section>
  )
}
