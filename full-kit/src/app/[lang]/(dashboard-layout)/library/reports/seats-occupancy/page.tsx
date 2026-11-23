"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  AlertTriangle,
  Armchair,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileSpreadsheet,
  Layers,
  Mail,
  PieChart,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
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

export default function SeatsOccupancyReportPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [selectedBranch, setSelectedBranch] = useState("all")
  const [selectedShift, setSelectedShift] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data for floor breakdown
  const floors = [
    {
      name: "Floor 1: Main Silent AC Study Zone",
      totalSeats: 70,
      occupiedSeats: 65,
      reservedSeats: 4,
      vacantSeats: 1,
      rate: 93,
      avgDailyHours: "8.4 hrs",
      powerBackup: "100%",
    },
    {
      name: "Floor 2: Laptop & Discussion Hall",
      totalSeats: 50,
      occupiedSeats: 44,
      reservedSeats: 3,
      vacantSeats: 3,
      rate: 88,
      avgDailyHours: "6.9 hrs",
      powerBackup: "100%",
    },
    {
      name: "Floor 3: Dedicated Private Pods (Girls / Reserved)",
      totalSeats: 40,
      occupiedSeats: 33,
      reservedSeats: 5,
      vacantSeats: 2,
      rate: 83,
      avgDailyHours: "9.2 hrs",
      powerBackup: "100%",
    },
  ]

  // Mock data for Idle Seats (> 7 days no attendance)
  const idleSeats = [
    {
      seatNo: "A-14",
      floor: "Floor 1",
      studentName: "Aditya Shah",
      rollNo: "STU-1088",
      phone: "+91 98221 44012",
      plan: "Full Day Reserved",
      lastCheckin: "21 Oct 2026 (13 days ago)",
      daysIdle: 13,
      status: "Risk of Churn",
    },
    {
      seatNo: "B-09",
      floor: "Floor 2",
      studentName: "Kavita Rao",
      rollNo: "STU-1094",
      phone: "+91 97234 11209",
      plan: "Morning Shift (6-12)",
      lastCheckin: "24 Oct 2026 (10 days ago)",
      daysIdle: 10,
      status: "Risk of Churn",
    },
    {
      seatNo: "C-02",
      floor: "Floor 3",
      studentName: "Manish Solanki",
      rollNo: "STU-1102",
      phone: "+91 99042 55678",
      plan: "Night Owls (6-11)",
      lastCheckin: "26 Oct 2026 (8 days ago)",
      daysIdle: 8,
      status: "Exam Leave Reported",
    },
  ]

  const filteredIdleSeats = idleSeats.filter(
    (s) =>
      s.seatNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={ensureLocalizedPathname("/pages/reports", lang)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reports Center
            </Link>
            <ChevronRight className="size-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-primary">Seats & Occupancy</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Seats & Occupancy Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Floor-wise utilization, shift density, idle seat reclaim alerts, and student retention rate.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              <SelectItem value="central">Central Library</SelectItem>
              <SelectItem value="west">West Campus</SelectItem>
              <SelectItem value="north">North Extension</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-9 gap-1.5">
            <FileSpreadsheet className="size-4 text-emerald-600" />
            Export CSV
          </Button>
          <Button size="sm" className="h-9 gap-1.5">
            <Download className="size-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Top Occupancy KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Total Seats Capacity
            </CardTitle>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Armchair className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">160 Seats</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              Across 3 air-conditioned study floors
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Average Occupancy Rate
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
              <TrendingUp className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">88.7%</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600">
              <ArrowUpRight className="size-3.5" />
              <span>+4.2% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Idle Seats Reclaim Alert
            </CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600">
              <AlertTriangle className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">3 Seats</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              No attendance clocked for &gt; 7 days
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Renewal & Retention Rate
            </CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
              <UserCheck className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">86.4%</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              Avg membership: 4.8 months
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floor Breakdown & Shifts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Floor Wise Utilization */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Floor-Wise Utilization &amp; Capacities
                  </CardTitle>
                  <CardDescription>
                    Real-time occupied vs vacant seats by floor section
                  </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {floors.map((floor, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">{floor.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {floor.occupiedSeats} Active Students · {floor.reservedSeats} Reserved · {floor.vacantSeats} Vacant
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-lg font-bold text-primary">{floor.rate}%</span>
                        <p className="text-[10px] text-muted-foreground">Avg Study: {floor.avgDailyHours}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Progress value={floor.rate} className="h-2" />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                    <span>Total Capacity: {floor.totalSeats} Desks</span>
                    <span>Power Backup: {floor.powerBackup}</span>
                    <span className="text-primary font-medium cursor-pointer hover:underline">
                      View Visual Seat Grid →
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Shift Distribution & Churn Breakdown */}
        <div className="space-y-6">
          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Shift Slot Demand Distribution
              </CardTitle>
              <CardDescription>
                Peak load across operational hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span>Full Day (24x7 / 16h)</span>
                  <span className="font-semibold text-primary">64 Students (45%)</span>
                </div>
                <Progress value={45} className="h-1.5 bg-muted" />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span>Morning Shift (06:00 - 12:00)</span>
                  <span className="font-semibold text-emerald-600">38 Students (27%)</span>
                </div>
                <Progress value={27} className="h-1.5 bg-muted" />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span>Evening Shift (12:00 - 18:00)</span>
                  <span className="font-semibold text-blue-600">26 Students (18%)</span>
                </div>
                <Progress value={18} className="h-1.5 bg-muted" />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span>Night Owl (18:00 - 23:00)</span>
                  <span className="font-semibold text-amber-600">14 Students (10%)</span>
                </div>
                <Progress value={10} className="h-1.5 bg-muted" />
              </div>

              <div className="mt-4 rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground border border-primary/20">
                <div className="flex items-center gap-1.5 font-semibold text-primary">
                  <Sparkles className="size-3.5" />
                  Peak Optimization Insight
                </div>
                <p className="mt-1">
                  Morning slot has 12 inquiries pending. Consider converting 4 Evening low-demand seats to flexible 2-shift shares.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Student Retention vs Churn
              </CardTitle>
              <CardDescription>
                Monthly membership renewals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-muted-foreground">Renewed on Time:</span>
                <span className="font-bold text-emerald-600">124 (86.4%)</span>
              </div>
              <div className="flex items-center justify-between text-sm py-1 border-t border-border/40">
                <span className="text-muted-foreground">Upgraded to Reserved:</span>
                <span className="font-bold text-primary">18 (12.5%)</span>
              </div>
              <div className="flex items-center justify-between text-sm py-1 border-t border-border/40">
                <span className="text-muted-foreground">Grace Period (Unpaid):</span>
                <span className="font-bold text-amber-600">7 (4.8%)</span>
              </div>
              <div className="flex items-center justify-between text-sm py-1 border-t border-border/40">
                <span className="text-muted-foreground">Discontinued / Churned:</span>
                <span className="font-bold text-rose-600">12 (8.3%)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Idle Seats Reclaim Table */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-600" />
                Idle Seat Reclaim Ledger (&gt; 7 Days Inactive)
              </CardTitle>
              <CardDescription>
                Allocated seats where the student has not checked in for 7 or more days. Reclaim or send automatic reminder alerts.
              </CardDescription>
            </div>
            <div className="w-full sm:w-64">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Filter student or seat #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs">Seat &amp; Floor</TableHead>
                  <TableHead className="text-xs">Student Details</TableHead>
                  <TableHead className="text-xs">Plan Type</TableHead>
                  <TableHead className="text-xs">Last Attendance</TableHead>
                  <TableHead className="text-xs">Days Inactive</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIdleSeats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground text-xs">
                      No idle seats matching current filter. All seats have active check-ins!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIdleSeats.map((item, index) => (
                    <TableRow key={index} className="hover:bg-muted/30">
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.seatNo}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{item.floor}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-medium">{item.studentName}</div>
                        <div className="text-[11px] text-muted-foreground">{item.rollNo} · {item.phone}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.plan}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {item.lastCheckin}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="font-mono text-[11px]">
                          {item.daysIdle} days absent
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            item.status === "Risk of Churn"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                            <Mail className="size-3" />
                            Send Notice
                          </Button>
                          <Button variant="destructive" size="sm" className="h-7 text-xs">
                            Reclaim Seat
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

