"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import {
  AlertCircle,
  Armchair,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookMarked,
  BookOpen,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Flame,
  Layers,
  PieChart as PieChartIcon,
  Printer,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"
import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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

// ================= CHART DATASETS =================
// 1. Collections vs Billed Revenue (Last 5 Months) matching Screenshot 3
const collectionsVsBilledData = [
  { month: "Jun", billed: 155000, collected: 148000 },
  { month: "Jul", billed: 168000, collected: 162000 },
  { month: "Aug", billed: 172000, collected: 169000 },
  { month: "Sep", billed: 180000, collected: 176000 },
  { month: "Oct", billed: 188000, collected: 184200 },
]

// 2. Hourly Gate Traffic Inflow
const hourlyTrafficData = [
  { hour: "06 AM", checkins: 14, checkouts: 2 },
  { hour: "08 AM", checkins: 48, checkouts: 5 },
  { hour: "10 AM", checkins: 32, checkouts: 12 },
  { hour: "12 PM", checkins: 18, checkouts: 26 },
  { hour: "02 PM", checkins: 35, checkouts: 19 },
  { hour: "04 PM", checkins: 42, checkouts: 15 },
  { hour: "06 PM", checkins: 28, checkouts: 44 },
  { hour: "08 PM", checkins: 10, checkouts: 52 },
  { hour: "10 PM", checkins: 4, checkouts: 38 },
]

// 3. Exam Targets Split
const examSplitData = [
  { name: "UPSC Civil Services", value: 120, color: "#6366f1" },
  { name: "NEET PG Medical", value: 75, color: "#0ea5e9" },
  { name: "CA Final & Inter", value: 55, color: "#10b981" },
  { name: "MPSC & State PSC", value: 45, color: "#f59e0b" },
]

// 4. Shift Occupancy Comparison
const shiftOccupancyData = [
  { shift: "Morning (07 AM - 01 PM)", totalDesks: 36, occupied: 32, rate: 89 },
  { shift: "Afternoon (01 PM - 06 PM)", totalDesks: 36, occupied: 28, rate: 78 },
  { shift: "Evening (06 PM - 11 PM)", totalDesks: 36, occupied: 36, rate: 100 },
  { shift: "24x7 Dedicated Pods", totalDesks: 12, occupied: 12, rate: 100 },
]

// 5. Payment Mode Split
const paymentModeData = [
  { mode: "UPI (QR Scanner)", amount: 124000, percentage: 67, color: "#6366f1" },
  { mode: "Physical Cash Counter", amount: 42000, percentage: 23, color: "#10b981" },
  { mode: "Card / Net Banking", amount: 18200, percentage: 10, color: "#0ea5e9" },
]

// Report sections list (matching Image 3)
const REPORT_SECTIONS = [
  { id: "summary", label: "Summary & Highlights", icon: Sparkles, count: "" },
  { id: "students", label: "Students", icon: Users, count: "295" },
  { id: "attendance", label: "Daily Attendance", icon: Clock, count: "" },
  { id: "study_hours", label: "Study Hours & Ranks", icon: Flame, count: "" },
  { id: "money", label: "Money & Collections", icon: CircleDollarSign, count: "" },
  { id: "seats", label: "Seats & Occupancy", icon: Armchair, count: "" },
  { id: "books", label: "Books & Circulation", icon: BookMarked, count: "" },
  { id: "staff", label: "Team & Staff Logins", icon: ShieldCheck, count: "" },
  { id: "branches", label: "Branch Comparison", icon: Building2, count: "" },
]

export default function ReportsHubPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  // Active section in left sidebar (Summary by default matching Image 3)
  const [activeSection, setActiveSection] = useState<string>("summary")

  // Filter controls (matching Image 3)
  const [selectedBranch, setSelectedBranch] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState("current")
  const [compareWithLastMonth, setCompareWithLastMonth] = useState(true)

  const handleExport = (format: "pdf" | "excel") => {
    toast.success(`Exporting ${format.toUpperCase()} report...`, {
      description: "Compiling charts, executive highlights, and audit ledgers.",
    })
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 space-y-4 p-4 sm:p-6">
      {/* 1. Global Controls Top Bar (Matching Screenshot 3) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card shadow-xs">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground flex items-center gap-1">
              <span>Filters:</span>
            </span>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="h-8 text-xs bg-background border-border rounded-md font-semibold w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-xs font-semibold">
                  All Branches (295 Students)
                </SelectItem>
                <SelectItem value="kothrud" className="text-xs">
                  Main Branch - Kothrud HQ (180 Students)
                </SelectItem>
                <SelectItem value="fc_road" className="text-xs">
                  Satellite - FC Road Campus (115 Students)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="h-8 text-xs bg-background border-border rounded-md font-semibold w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="current" className="text-xs">
                Current Month (October 2026)
              </SelectItem>
              <SelectItem value="sep" className="text-xs">
                Previous Month (September 2026)
              </SelectItem>
              <SelectItem value="q3" className="text-xs">
                Quarter 3 (Jul - Sep 2026)
              </SelectItem>
              <SelectItem value="ytd" className="text-xs">
                Year to Date (2026)
              </SelectItem>
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none">
            <Checkbox
              checked={compareWithLastMonth}
              onCheckedChange={(c) => setCompareWithLastMonth(Boolean(c))}
            />
            <span>Compare with last month</span>
          </label>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <Clock className="size-3.5 text-muted-foreground" />
            <span>Last sync: Today, 02:45 PM</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
              className="h-8 text-xs gap-1 border-border rounded-md cursor-pointer"
            >
              <Download className="size-3" />
              <span>Export PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("excel")}
              className="h-8 text-xs gap-1 border-border rounded-md cursor-pointer"
            >
              <FileSpreadsheet className="size-3" />
              <span>Excel</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout (Matching Screenshot 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Report Sections Sidebar (3.5 cols on desktop) */}
        <div className="lg:col-span-3 space-y-2">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2">
            Report Sections
          </div>

          <div className="space-y-1">
            {REPORT_SECTIONS.map((sec) => {
              const Icon = sec.icon
              const isActive = activeSection === sec.id

              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span className="truncate">{sec.label}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {sec.count && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ({sec.count})
                      </span>
                    )}
                    {isActive && <ChevronRight className="size-3.5 text-primary" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Visual Analytics Presentation (8.5 cols) */}
        <div className="lg:col-span-9 space-y-4">
          {/* ================= SECTION 1: SUMMARY & HIGHLIGHTS (Screenshot 3) ================= */}
          {activeSection === "summary" && (
            <>
              {/* Automatic Library Insights Card (Matching Screenshot 3) */}
              <Card className="border border-primary/20 bg-primary/5 rounded-lg shadow-xs">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-primary">
                    <Sparkles className="size-4" />
                    <span>Automatic Library Insights:</span>
                  </div>
                  <ul className="text-xs text-foreground/90 space-y-1.5 list-disc list-inside leading-relaxed pl-1">
                    <li>
                      Evening shift desks are <strong>100% full 5 days a week</strong>; consider opening 6 additional flex desks.
                    </li>
                    <li>
                      <strong>14 student plans are expiring</strong> within the next 7 days (₹21,000 potential renewals).
                    </li>
                    <li>
                      Saturday study hours peaked at <strong>8.4 hours average</strong> per student.
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* 4 KPI Summary Cards Strip (Matching Screenshot 3) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Studying Students */}
                <Card className="border border-border bg-card rounded-lg shadow-xs">
                  <CardContent className="p-4 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Studying Students</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                      275
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold font-mono">
                      <ArrowUpRight className="size-3" />
                      <span>+12 from last month</span>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Month Collections */}
                <Card className="border border-border bg-card rounded-lg shadow-xs">
                  <CardContent className="p-4 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Month Collections</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                      ₹1,84,200
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold font-mono">
                      <ArrowUpRight className="size-3" />
                      <span>+5.8% billed</span>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Seat Occupancy */}
                <Card className="border border-border bg-card rounded-lg shadow-xs">
                  <CardContent className="p-4 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Seat Occupancy</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                      81%
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      29 of 36 desks taken (Kothrud)
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Daily Gate Attendance */}
                <Card className="border border-border bg-card rounded-lg shadow-xs">
                  <CardContent className="p-4 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Daily Gate Attendance</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                      4 inside
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      5 came today • 2 late
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Collections vs Billed Revenue Bar Chart (Matching Screenshot 3) */}
              <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden">
                <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                      Collections vs Billed Revenue (Last 5 Months)
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Net collection efficiency is 98.4% for October
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold text-emerald-500 border-emerald-500/20 bg-emerald-500/10">
                    +16% year-on-year
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 pt-4">
                  <div className="w-full h-64 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={collectionsVsBilledData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="month"
                          stroke="currentColor"
                          className="text-[11px] text-muted-foreground"
                          tickLine={false}
                        />
                        <YAxis
                          stroke="currentColor"
                          className="text-[11px] text-muted-foreground"
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `₹${val / 1000}k`}
                          domain={[100000, 200000]}
                          ticks={[100000, 150000, 200000]}
                        />
                        <Tooltip
                          formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString("en-IN")}`, name === "billed" ? "Billed Amount" : "Cash Collected"]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "6px",
                            fontSize: "12px",
                            color: "hsl(var(--popover-foreground))",
                          }}
                          itemStyle={{
                            color: "hsl(var(--popover-foreground))",
                            fontWeight: 600,
                          }}
                        />
                        <Legend
                          formatter={(value) => (value === "billed" ? "Billed Dues" : "Actual Collections")}
                          wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                        />
                        <Bar dataKey="billed" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={36} />
                        <Bar dataKey="collected" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ================= SECTION 2: STUDENTS (295) ================= */}
          {activeSection === "students" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="border border-border bg-card rounded-lg p-4 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">Active Enrolled</div>
                  <div className="text-2xl font-bold text-foreground font-mono">275 Students</div>
                  <div className="text-[11px] text-emerald-500 font-semibold">93.2% Retention rate</div>
                </Card>
                <Card className="border border-border bg-card rounded-lg p-4 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">New Admissions (Oct)</div>
                  <div className="text-2xl font-bold text-primary font-mono">+38 Joined</div>
                  <div className="text-[11px] text-muted-foreground">Main branch + FC Road</div>
                </Card>
                <Card className="border border-border bg-card rounded-lg p-4 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">Expiring Next 7 Days</div>
                  <div className="text-2xl font-bold text-amber-500 font-mono">14 Due</div>
                  <div className="text-[11px] text-amber-500 font-semibold">₹21,000 to renew</div>
                </Card>
              </div>

              {/* Student Exam Preparation Split */}
              <Card className="border border-border bg-card rounded-lg shadow-xs">
                <CardHeader className="p-4 pb-2 border-b border-border">
                  <CardTitle className="text-sm font-bold text-foreground">
                    Exam Target Distribution
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Competitive exams targeted by current active student members
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="w-full h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={examSplitData} layout="vertical" margin={{ left: 20, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="currentColor" className="text-[11px] text-muted-foreground" />
                        <YAxis dataKey="name" type="category" width={140} stroke="currentColor" className="text-[11px] text-muted-foreground" tickLine={false} />
                        <Tooltip
                          formatter={(val: any) => [`${val} Students`, "Enrolled"]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "6px",
                            fontSize: "12px",
                            color: "hsl(var(--popover-foreground))",
                          }}
                        />
                        <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ================= SECTION 3: DAILY ATTENDANCE ================= */}
          {activeSection === "attendance" && (
            <div className="space-y-4">
              <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden">
                <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Hourly Turnstile Check-in &amp; Check-out Flow
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Peak arrival rush is 07:30 - 09:30 AM; peak evening departure is 07:00 - 09:00 PM
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs border-primary/20 text-primary bg-primary/5">
                    94.2% Attendance Rate
                  </Badge>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={hourlyTrafficData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="hour" stroke="currentColor" className="text-[11px] text-muted-foreground" />
                        <YAxis stroke="currentColor" className="text-[11px] text-muted-foreground" tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "6px",
                            fontSize: "12px",
                            color: "hsl(var(--popover-foreground))",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                        <Area type="monotone" dataKey="checkins" name="Student Check-ins" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                        <Area type="monotone" dataKey="checkouts" name="Student Check-outs" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ================= SECTION 4: STUDY HOURS & RANKS ================= */}
          {activeSection === "study_hours" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="border border-border bg-card rounded-lg p-3.5 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">Avg Daily Focus</div>
                  <div className="text-2xl font-bold text-foreground font-mono">5.4 Hours</div>
                  <div className="text-[11px] text-muted-foreground">+0.6h from Sep</div>
                </Card>
                <Card className="border border-border bg-card rounded-lg p-3.5 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">Longest Streak</div>
                  <div className="text-2xl font-bold text-amber-500 font-mono">🔥 45 Days</div>
                  <div className="text-[11px] text-muted-foreground">Sneha Deshmukh</div>
                </Card>
                <Card className="border border-border bg-card rounded-lg p-3.5 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">Total Focus Hours</div>
                  <div className="text-2xl font-bold text-primary font-mono">1,480 hrs</div>
                  <div className="text-[11px] text-emerald-500">Peak month this year</div>
                </Card>
                <Card className="border border-border bg-card rounded-lg p-3.5 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">Goal Completion</div>
                  <div className="text-2xl font-bold text-blue-500 font-mono">78% Reached</div>
                  <div className="text-[11px] text-muted-foreground">Target: 6.0 hrs/day</div>
                </Card>
              </div>

              <Card className="border border-border bg-card rounded-lg p-4 space-y-2">
                <div className="text-sm font-bold text-foreground">Top Study Performers (October 2026)</div>
                <div className="space-y-2 pt-2">
                  {[
                    { rank: 1, name: "Sneha Deshmukh", hours: "184 Hours", target: "UPSC Civil Services", streak: "45 Days", medal: "🥇" },
                    { rank: 2, name: "Priya Patel", hours: "162 Hours", target: "NEET PG Medical", streak: "31 Days", medal: "🥈" },
                    { rank: 3, name: "Rohan Sharma", hours: "148 Hours", target: "CA Final", streak: "24 Days", medal: "🥉" },
                  ].map((s) => (
                    <div key={s.name} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-base">{s.medal}</span>
                        <div>
                          <div className="font-bold text-foreground">{s.name}</div>
                          <div className="text-[11px] text-muted-foreground">{s.target} • {s.streak} active</div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-primary text-sm">{s.hours}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ================= SECTION 5: MONEY & COLLECTIONS ================= */}
          {activeSection === "money" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="border border-border bg-card rounded-lg p-4 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">Gross Collections (Oct)</div>
                  <div className="text-2xl font-bold text-emerald-500 font-mono">₹1,84,200</div>
                  <div className="text-[11px] text-emerald-500 font-semibold">100% reconciled</div>
                </Card>
                <Card className="border border-border bg-card rounded-lg p-4 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">Pending Unpaid Dues</div>
                  <div className="text-2xl font-bold text-amber-500 font-mono">₹12,400</div>
                  <div className="text-[11px] text-muted-foreground">8 students outstanding</div>
                </Card>
                <Card className="border border-border bg-card rounded-lg p-4 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">Late Fines Collected</div>
                  <div className="text-2xl font-bold text-blue-500 font-mono">₹1,325</div>
                  <div className="text-[11px] text-muted-foreground">Book circulation penalties</div>
                </Card>
              </div>

              {/* Payment Mode Breakdown */}
              <Card className="border border-border bg-card rounded-lg p-4 space-y-3">
                <div className="text-sm font-bold text-foreground">Collection Modes Breakdown</div>
                <div className="space-y-2.5">
                  {paymentModeData.map((pm) => (
                    <div key={pm.mode} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">{pm.mode}</span>
                        <span className="font-mono font-bold text-foreground">
                          ₹{pm.amount.toLocaleString("en-IN")} ({pm.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pm.percentage}%`, backgroundColor: pm.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ================= SECTION 6: SEATS & OCCUPANCY ================= */}
          {activeSection === "seats" && (
            <div className="space-y-4">
              <Card className="border border-border bg-card rounded-lg p-4 space-y-3">
                <div className="text-sm font-bold text-foreground">Shift-wise Desk Utilization (PRD §18)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {shiftOccupancyData.map((shift) => (
                    <div key={shift.shift} className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-foreground">
                        <span>{shift.shift}</span>
                        <span className="font-mono text-primary">{shift.rate}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            shift.rate === 100 ? "bg-amber-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${shift.rate}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{shift.occupied} of {shift.totalDesks} Desks Booked</span>
                        <span>{shift.totalDesks - shift.occupied} Free</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ================= SECTION 7: BOOKS & CIRCULATION ================= */}
          {activeSection === "books" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="border border-border bg-card rounded-lg p-4 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">Currently Borrowed</div>
                  <div className="text-2xl font-bold text-primary font-mono">12 Books Out</div>
                  <div className="text-[11px] text-muted-foreground">4 overdue beyond 7 days</div>
                </Card>
                <Card className="border border-border bg-card rounded-lg p-4 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">Catalog Utilization</div>
                  <div className="text-2xl font-bold text-emerald-500 font-mono">68% Active</div>
                  <div className="text-[11px] text-muted-foreground">Across 6 organized subjects</div>
                </Card>
                <Card className="border border-border bg-card rounded-lg p-4 space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">Total Fine Assessed</div>
                  <div className="text-2xl font-bold text-amber-500 font-mono">₹1,695</div>
                  <div className="text-[11px] text-emerald-500">₹1,325 recovered</div>
                </Card>
              </div>
            </div>
          )}

          {/* ================= SECTION 8: TEAM & STAFF LOGINS ================= */}
          {activeSection === "staff" && (
            <div className="space-y-4">
              <Card className="border border-border bg-card rounded-lg p-4 space-y-3">
                <div className="text-sm font-bold text-foreground">Staff Desk Duty &amp; Turnstile Logs</div>
                <div className="space-y-2 text-xs">
                  {[
                    { name: "Vikram Singhania", role: "Library Admin (Owner)", branch: "All Branches", shift: "All-Day", collections: "₹19,200", status: "Active" },
                    { name: "Rohan Desai", role: "Sub Admin", branch: "Main Branch - Kothrud", shift: "Morning (07 AM - 02 PM)", collections: "₹48,000", status: "Active" },
                    { name: "Pooja Mehta", role: "Sub Admin", branch: "Main Branch - Kothrud", shift: "Afternoon (02 PM - 10 PM)", collections: "₹36,500", status: "Active" },
                  ].map((st) => (
                    <div key={st.name} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                      <div>
                        <div className="font-bold text-foreground">{st.name}</div>
                        <div className="text-[11px] text-muted-foreground">{st.role} • {st.branch} ({st.shift})</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-foreground">{st.collections}</div>
                        <div className="text-[10px] text-emerald-500 font-semibold">{st.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ================= SECTION 9: BRANCH COMPARISON ================= */}
          {activeSection === "branches" && (
            <div className="space-y-4">
              <Card className="border border-border bg-card rounded-lg p-4 space-y-3">
                <div className="text-sm font-bold text-foreground">Kothrud HQ vs FC Road Satellite Campus</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
                    <div className="font-bold text-primary text-sm">Main Campus (Kothrud HQ)</div>
                    <div className="space-y-1 text-xs text-foreground">
                      <div>Students: <strong className="font-mono">180 Active</strong></div>
                      <div>Desk Occupancy: <strong className="font-mono">89%</strong></div>
                      <div>Monthly Revenue: <strong className="font-mono">₹1,18,000</strong></div>
                      <div>Status: <span className="text-emerald-500 font-semibold">Profitable</span></div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-2">
                    <div className="font-bold text-foreground text-sm">Satellite Campus (FC Road)</div>
                    <div className="space-y-1 text-xs text-foreground">
                      <div>Students: <strong className="font-mono">115 Active</strong></div>
                      <div>Desk Occupancy: <strong className="font-mono">74%</strong></div>
                      <div>Monthly Revenue: <strong className="font-mono">₹66,200</strong></div>
                      <div>Status: <span className="text-emerald-500 font-semibold">Scaling Fast</span></div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
