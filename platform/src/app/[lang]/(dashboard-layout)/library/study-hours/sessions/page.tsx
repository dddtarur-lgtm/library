"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  Edit,
  Eye,
  Filter,
  Flame,
  History,
  Medal,
  Pause,
  Play,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Cell,
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

import { initialLiveStudySessions, type LiveStudySession } from "@/data/library-management-data"
import { studentsDatabase } from "@/data/students-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"
import { cn } from "@/lib/utils"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Last 7 Days Daily Study Hours Data (matching screenshot)
const dailyStudyHoursData = [
  { day: "23 Oct", hours: 38 },
  { day: "24 Oct", hours: 44 },
  { day: "25 Oct", hours: 40 },
  { day: "26 Oct", hours: 52 },
  { day: "27 Oct", hours: 62 },
  { day: "28 Oct", hours: 48 },
  { day: "29 Oct", hours: 54 },
]

// Subject Split Donut Data (matching screenshot)
const subjectSplitData = [
  { name: "UPSC Civil Services", value: 45, color: "#6366f1" },
  { name: "NEET PG Medical", value: 25, color: "#0ea5e9" },
  { name: "CA Final", value: 18, color: "#10b981" },
  { name: "Others / General", value: 12, color: "#f59e0b" },
]

// Leaderboard Database by Timeframe
const leaderboardDataMap = {
  monthly: [
    {
      rank: 1,
      name: "Sneha Deshmukh",
      studentCode: "SHR-0102",
      avatar: "/images/avatars/female-01.svg",
      badge: "Gold Scholar",
      badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      streak: "45 Days Active",
      hours: "184 Hours",
      medal: "gold",
    },
    {
      rank: 2,
      name: "Priya Patel",
      studentCode: "SHR-0104",
      avatar: "/images/avatars/female-02.svg",
      badge: "Silver Focus",
      badgeColor: "bg-slate-400/10 text-slate-400 border-slate-400/20",
      streak: "31 Days Active",
      hours: "162 Hours",
      medal: "silver",
    },
    {
      rank: 3,
      name: "Rohan Sharma",
      studentCode: "SHR-0101",
      avatar: "/images/avatars/male-01.svg",
      badge: "Bronze Master",
      badgeColor: "bg-amber-700/10 text-amber-700 border-amber-700/20",
      streak: "24 Days Active",
      hours: "148 Hours",
      medal: "bronze",
    },
    {
      rank: 4,
      name: "Kunal Jadhav",
      studentCode: "SHR-0105",
      avatar: "/images/avatars/male-02.svg",
      badge: "Dedicated",
      badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      streak: "18 Days Active",
      hours: "132 Hours",
      medal: "none",
    },
    {
      rank: 5,
      name: "Aditya Kulkarni",
      studentCode: "SHR-0103",
      avatar: "/images/avatars/male-03.svg",
      badge: "Consistent",
      badgeColor: "bg-primary/10 text-primary border-primary/20",
      streak: "12 Days Active",
      hours: "110 Hours",
      medal: "none",
    },
  ],
  weekly: [
    {
      rank: 1,
      name: "Priya Patel",
      studentCode: "SHR-0104",
      avatar: "/images/avatars/female-02.svg",
      badge: "Gold Scholar",
      badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      streak: "7 Days Active",
      hours: "48 Hours",
      medal: "gold",
    },
    {
      rank: 2,
      name: "Sneha Deshmukh",
      studentCode: "SHR-0102",
      avatar: "/images/avatars/female-01.svg",
      badge: "Silver Focus",
      badgeColor: "bg-slate-400/10 text-slate-400 border-slate-400/20",
      streak: "6 Days Active",
      hours: "44 Hours",
      medal: "silver",
    },
    {
      rank: 3,
      name: "Aditya Kulkarni",
      studentCode: "SHR-0103",
      avatar: "/images/avatars/male-03.svg",
      badge: "Bronze Master",
      badgeColor: "bg-amber-700/10 text-amber-700 border-amber-700/20",
      streak: "5 Days Active",
      hours: "39 Hours",
      medal: "bronze",
    },
    {
      rank: 4,
      name: "Rohan Sharma",
      studentCode: "SHR-0101",
      avatar: "/images/avatars/male-01.svg",
      badge: "Dedicated",
      badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      streak: "5 Days Active",
      hours: "36 Hours",
      medal: "none",
    },
    {
      rank: 5,
      name: "Kunal Jadhav",
      studentCode: "SHR-0105",
      avatar: "/images/avatars/male-02.svg",
      badge: "Consistent",
      badgeColor: "bg-primary/10 text-primary border-primary/20",
      streak: "4 Days Active",
      hours: "31 Hours",
      medal: "none",
    },
  ],
  daily: [
    {
      rank: 1,
      name: "Sneha Deshmukh",
      studentCode: "SHR-0102",
      avatar: "/images/avatars/female-01.svg",
      badge: "Gold Scholar",
      badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      streak: "Today Peak",
      hours: "9.2 Hours",
      medal: "gold",
    },
    {
      rank: 2,
      name: "Rohan Sharma",
      studentCode: "SHR-0101",
      avatar: "/images/avatars/male-01.svg",
      badge: "Silver Focus",
      badgeColor: "bg-slate-400/10 text-slate-400 border-slate-400/20",
      streak: "Today Active",
      hours: "8.5 Hours",
      medal: "silver",
    },
    {
      rank: 3,
      name: "Jayesh Shah",
      studentCode: "STU-1089",
      avatar: "/images/avatars/male-04.svg",
      badge: "Bronze Master",
      badgeColor: "bg-amber-700/10 text-amber-700 border-amber-700/20",
      streak: "Today Active",
      hours: "7.8 Hours",
      medal: "bronze",
    },
    {
      rank: 4,
      name: "Priya Patel",
      studentCode: "SHR-0104",
      avatar: "/images/avatars/female-02.svg",
      badge: "Dedicated",
      badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      streak: "Today Active",
      hours: "6.5 Hours",
      medal: "none",
    },
    {
      rank: 5,
      name: "Aditya Kulkarni",
      studentCode: "SHR-0103",
      avatar: "/images/avatars/male-03.svg",
      badge: "Consistent",
      badgeColor: "bg-primary/10 text-primary border-primary/20",
      streak: "Today Active",
      hours: "5.4 Hours",
      medal: "none",
    },
  ],
}

// Custom tooltip for Daily Study Hours Line Chart
function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card text-foreground border border-border rounded-lg p-2.5 shadow-xl text-xs space-y-1">
        <p className="font-bold text-foreground">{label}</p>
        <p className="text-primary font-semibold font-mono">
          Study Time : {payload[0].value} hours
        </p>
      </div>
    )
  }
  return null
}

// Custom high-contrast tooltip for Subject Split Donut Chart
function CustomPieTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-card text-foreground border border-border rounded-lg px-3 py-2 shadow-xl text-xs flex items-center gap-2.5 z-50">
        <span
          className="size-3 rounded-full shrink-0 ring-1 ring-white/20"
          style={{ backgroundColor: data.payload.color || data.fill }}
        />
        <span className="font-semibold text-foreground">{data.name} :</span>
        <span className="font-bold text-primary font-mono text-xs">{data.value}%</span>
      </div>
    )
  }
  return null
}

export default function StudySessionsPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  // Timeframe state for Leaderboard (Monthly by default matching Image 2)
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<"daily" | "weekly" | "monthly">("monthly")

  // Modals state
  const [correctModalOpen, setCorrectModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)

  // Correction form state
  const [correctStudentCode, setCorrectStudentCode] = useState("SHR-0103")
  const [correctDate, setCorrectDate] = useState("2026-11-04")
  const [correctAdjustedHours, setCorrectAdjustedHours] = useState("5.5")
  const [correctReason, setCorrectReason] = useState("Gate turnstile missed checkout scan; verified by CCTV desk log.")

  // Settings state
  const [dailyGoalHours, setDailyGoalHours] = useState("6.0")
  const [breakThresholdMin, setBreakThresholdMin] = useState("45")
  const [autoStopOnCheckout, setAutoStopOnCheckout] = useState(true)
  const [optInLeaderboard, setOptInLeaderboard] = useState(true)

  // Sessions ledger list
  const [sessionsLedger, setSessionsLedger] = useState([
    {
      id: "s-101",
      studentName: "Aditya Kulkarni",
      studentCode: "SHR-0103",
      seatNo: "A-12",
      subject: "UPSC Civil Services",
      start: "08:30 AM",
      end: "02:00 PM",
      focusMinutes: 300,
      breakMinutes: 30,
      status: "Focusing",
    },
    {
      id: "s-102",
      studentName: "Sneha Deshmukh",
      studentCode: "SHR-0102",
      seatNo: "B-04",
      subject: "NEET PG Medical",
      start: "09:00 AM",
      end: "01:30 PM",
      focusMinutes: 255,
      breakMinutes: 15,
      status: "Focusing",
    },
    {
      id: "s-103",
      studentName: "Rohan Sharma",
      studentCode: "SHR-0101",
      seatNo: "A-01",
      subject: "CA Final",
      start: "07:15 AM",
      end: "12:45 PM",
      focusMinutes: 315,
      breakMinutes: 15,
      status: "On Break",
    },
    {
      id: "s-104",
      studentName: "Priya Patel",
      studentCode: "SHR-0104",
      seatNo: "C-08",
      subject: "UPSC Civil Services",
      start: "10:00 AM",
      end: "02:15 PM",
      focusMinutes: 240,
      breakMinutes: 15,
      status: "Focusing",
    },
  ])

  const handleSaveCorrection = () => {
    if (!correctStudentCode || !correctAdjustedHours) {
      toast.error("Please fill in the student and adjusted study hours.")
      return
    }
    const student = studentsDatabase.find((s) => s.studentId === correctStudentCode)
    toast.success(`Study session corrected for ${student?.name || correctStudentCode}!`, {
      description: `Adjusted to ${correctAdjustedHours} Hours. Audit log updated.`,
    })
    setCorrectModalOpen(false)
  }

  const handleSaveSettings = () => {
    toast.success("Study session settings saved successfully!", {
      description: `Target: ${dailyGoalHours}h/day, Auto-stop: ${autoStopOnCheckout ? "Enabled" : "Disabled"}.`,
    })
    setSettingsModalOpen(false)
  }

  const currentLeaderboard = leaderboardDataMap[leaderboardTimeframe]

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 space-y-4 p-4 sm:p-6">
      {/* 1. Header (Matching Screenshot 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Study Sessions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Student focus time, daily habits, and library leaderboard • Kothrud Campus (HQ)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Action Button 1: Correct a session */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCorrectModalOpen(true)}
            className="h-8 text-xs gap-1.5 border-border rounded-md hover:bg-muted cursor-pointer"
          >
            <Edit className="size-3.5 text-muted-foreground" />
            <span>Correct a session</span>
          </Button>

          {/* Action Button 2: Study settings */}
          <Button
            size="sm"
            onClick={() => setSettingsModalOpen(true)}
            className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-semibold cursor-pointer shadow-xs"
          >
            <Settings className="size-3.5" />
            <span>Study settings</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Metric Strip: 5 Cards (Matching Screenshot 1) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Studying right now */}
        <Card className="border border-border bg-card rounded-lg shadow-xs">
          <CardContent className="p-3.5 sm:p-4 space-y-1">
            <div className="text-xs text-muted-foreground font-medium">Studying right now</div>
            <div className="flex items-center gap-1.5 text-xl sm:text-2xl font-bold text-emerald-500 font-mono">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>4 students</span>
            </div>
            <div className="text-[11px] text-muted-foreground">Active in study cabins</div>
          </CardContent>
        </Card>

        {/* Card 2: Average daily focus */}
        <Card className="border border-border bg-card rounded-lg shadow-xs">
          <CardContent className="p-3.5 sm:p-4 space-y-1">
            <div className="text-xs text-muted-foreground font-medium">Average daily focus</div>
            <div className="text-xl sm:text-2xl font-bold text-foreground font-mono">
              5.4 Hours
            </div>
            <div className="text-[11px] text-muted-foreground">Per active student</div>
          </CardContent>
        </Card>

        {/* Card 3: Daily goal reached */}
        <Card className="border border-border bg-card rounded-lg shadow-xs">
          <CardContent className="p-3.5 sm:p-4 space-y-1">
            <div className="text-xs text-muted-foreground font-medium">Daily goal reached</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-500 font-mono">
              78%
            </div>
            <div className="text-[11px] text-muted-foreground">Target: 6.0 hrs/day</div>
          </CardContent>
        </Card>

        {/* Card 4: Longest streak */}
        <Card className="border border-border bg-card rounded-lg shadow-xs">
          <CardContent className="p-3.5 sm:p-4 space-y-1">
            <div className="text-xs text-muted-foreground font-medium">Longest streak</div>
            <div className="flex items-center gap-1 text-xl sm:text-2xl font-bold text-amber-500 font-mono">
              <Flame className="size-5 text-amber-500 fill-amber-500 shrink-0" />
              <span>45 Days</span>
            </div>
            <div className="text-[11px] text-muted-foreground">Sneha Deshmukh</div>
          </CardContent>
        </Card>

        {/* Card 5: Hours this month */}
        <Card className="border border-border bg-card rounded-lg shadow-xs col-span-2 sm:col-span-1">
          <CardContent className="p-3.5 sm:p-4 space-y-1">
            <div className="text-xs text-muted-foreground font-medium">Hours this month</div>
            <div className="text-xl sm:text-2xl font-bold text-primary font-mono">
              1,480 hrs
            </div>
            <div className="text-[11px] text-muted-foreground">Across campus network</div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Charts Row: Daily Study Hours Line Chart + Subject Split Donut (Matching Screenshot 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Daily Study Hours (Last 7 Days) */}
        <Card className="lg:col-span-8 border border-border bg-card rounded-lg shadow-xs overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                Daily Study Hours (Last 7 Days)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Peak study hours recorded on Monday &amp; Tuesday
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono font-medium border-border">
              Average: 48h / day
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-4">
            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailyStudyHoursData}
                  margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="studyHoursGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    stroke="currentColor"
                    className="text-[11px] text-muted-foreground"
                    tickLine={false}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-[11px] text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}h`}
                    domain={[0, 80]}
                    ticks={[0, 20, 40, 60, 80]}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#studyHoursGradient)"
                    dot={{ r: 4, fill: "#6366f1", strokeWidth: 1.5, stroke: "#fff" }}
                    activeDot={{ r: 6, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right: Subject Split Donut Chart */}
        <Card className="lg:col-span-4 border border-border bg-card rounded-lg shadow-xs flex flex-col">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-sm sm:text-base font-bold text-foreground">
              Subject Split
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              What students are studying
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
            <div className="w-full h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectSplitData}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {subjectSplitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend List matching screenshot */}
            <div className="space-y-2 pt-1 border-t border-border">
              {subjectSplitData.map((sub) => (
                <div key={sub.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span className="text-muted-foreground font-medium truncate">
                      {sub.name}
                    </span>
                  </div>
                  <span className="font-bold text-foreground font-mono">{sub.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Library Study Leaderboard (Matching Screenshot 2) */}
      <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                Library Study Leaderboard
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Top focus hours among library peers • Opt-in privacy honored
            </CardDescription>
          </div>

          {/* Timeframe Pill Switcher: Daily | Weekly | Monthly */}
          <div className="flex items-center p-0.5 rounded-md bg-muted border border-border text-xs">
            <button
              type="button"
              onClick={() => setLeaderboardTimeframe("daily")}
              className={cn(
                "px-3 py-1 rounded-sm text-xs font-semibold transition-all cursor-pointer",
                leaderboardTimeframe === "daily"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setLeaderboardTimeframe("weekly")}
              className={cn(
                "px-3 py-1 rounded-sm text-xs font-semibold transition-all cursor-pointer",
                leaderboardTimeframe === "weekly"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setLeaderboardTimeframe("monthly")}
              className={cn(
                "px-3 py-1 rounded-sm text-xs font-semibold transition-all cursor-pointer",
                leaderboardTimeframe === "monthly"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="w-16 text-xs font-bold text-muted-foreground uppercase">
                  Rank
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase">
                  Student
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase">
                  Badge
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase">
                  Study Streak
                </TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase pr-4">
                  Hours Logged
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentLeaderboard.map((item) => (
                <TableRow
                  key={item.studentCode}
                  className="border-b border-border/80 hover:bg-muted/30 transition-colors"
                >
                  {/* Rank Column with Medals */}
                  <TableCell className="font-bold text-sm">
                    {item.medal === "gold" && (
                      <span className="inline-flex items-center justify-center size-6 rounded-full bg-amber-500/20 text-amber-500 font-bold text-xs">
                        🥇
                      </span>
                    )}
                    {item.medal === "silver" && (
                      <span className="inline-flex items-center justify-center size-6 rounded-full bg-slate-300/20 text-slate-400 font-bold text-xs">
                        🥈
                      </span>
                    )}
                    {item.medal === "bronze" && (
                      <span className="inline-flex items-center justify-center size-6 rounded-full bg-amber-700/20 text-amber-600 font-bold text-xs">
                        🥉
                      </span>
                    )}
                    {item.medal === "none" && (
                      <span className="text-xs text-muted-foreground font-mono">
                        #{item.rank}
                      </span>
                    )}
                  </TableCell>

                  {/* Student Column with Avatar & Name */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 rounded-full border border-border">
                        <AvatarImage src={item.avatar} alt={item.name} />
                        <AvatarFallback className="text-xs font-bold">
                          {item.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {item.studentCode}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Badge Column */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("text-[11px] font-semibold px-2 py-0.5", item.badgeColor)}
                    >
                      {item.badge}
                    </Badge>
                  </TableCell>

                  {/* Study Streak Column */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium font-mono">
                      <Flame className="size-3.5 fill-amber-500 shrink-0" />
                      <span>{item.streak}</span>
                    </div>
                  </TableCell>

                  {/* Hours Logged Column */}
                  <TableCell className="text-right pr-4 font-mono font-bold text-xs text-foreground">
                    {item.hours}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 5. Live Active Focus Sessions Ledger */}
      <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Live &amp; Recent Study Sessions
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Real-time timer telemetry, break duration, and seat checkouts
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/20 bg-emerald-500/10">
              3 Active Now
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-xs font-bold text-muted-foreground uppercase">Student</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase">Seat</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase">Exam Target</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase">Shift / Time</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase">Focus Logged</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase">Status</TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase pr-4">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessionsLedger.map((sess) => (
                <TableRow key={sess.id} className="border-b border-border/80 hover:bg-muted/30">
                  <TableCell>
                    <div className="font-semibold text-xs text-foreground">{sess.studentName}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{sess.studentCode}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px] font-mono border-border">
                      {sess.seatNo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{sess.subject}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {sess.start} - {sess.end}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-bold text-foreground">
                    {Math.floor(sess.focusMinutes / 60)}h {sess.focusMinutes % 60}m
                    <span className="text-[10px] text-muted-foreground ml-1">({sess.breakMinutes}m break)</span>
                  </TableCell>
                  <TableCell>
                    {sess.status === "Focusing" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px]">
                        • Focusing
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/10 text-[10px]">
                        ☕ On Break
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCorrectStudentCode(sess.studentCode)
                        setCorrectAdjustedHours((sess.focusMinutes / 60).toFixed(1))
                        setCorrectModalOpen(true)
                      }}
                      className="h-7 text-xs text-primary hover:text-primary/80 hover:bg-primary/10 gap-1 px-2"
                    >
                      <Edit className="size-3" />
                      <span>Correct</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ================= MODAL: CORRECT A SESSION ================= */}
      <Dialog open={correctModalOpen} onOpenChange={setCorrectModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Edit className="size-4 text-primary" />
              Correct Student Study Session
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Adjust inaccurate study hours logged due to biometric turnstile delays or unrecorded checkouts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            {/* Student Dropdown */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Select Student *</Label>
              <Select value={correctStudentCode} onValueChange={setCorrectStudentCode}>
                <SelectTrigger className="h-9 text-xs bg-background border-border rounded-md">
                  <SelectValue placeholder="Choose student..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {studentsDatabase.map((stu) => (
                    <SelectItem key={stu.studentId} value={stu.studentId} className="text-xs">
                      {stu.name} ({stu.studentId}) — Seat {stu.seatNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Session Date */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Session Date</Label>
              <Input
                type="date"
                value={correctDate}
                onChange={(e) => setCorrectDate(e.target.value)}
                className="h-9 text-xs bg-background border-border rounded-md font-mono"
              />
            </div>

            {/* Adjusted Hours */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Corrected Total Focus (Hours) *</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="24"
                value={correctAdjustedHours}
                onChange={(e) => setCorrectAdjustedHours(e.target.value)}
                placeholder="e.g. 5.5"
                className="h-9 text-xs bg-background border-border rounded-md font-mono"
              />
            </div>

            {/* Audit Reason */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Audit Reason *</Label>
              <Input
                value={correctReason}
                onChange={(e) => setCorrectReason(e.target.value)}
                placeholder="Why is this session being adjusted?"
                className="h-9 text-xs bg-background border-border rounded-md"
              />
              <p className="text-[10px] text-muted-foreground">
                This correction will be permanently logged in the Activity Audit trail.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCorrectModalOpen(false)}
              className="h-8 text-xs border-border rounded-md"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveCorrection}
              className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-semibold"
            >
              Save Correction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: STUDY SETTINGS ================= */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Settings className="size-4 text-primary" />
              Study Session &amp; Focus Rules
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure target thresholds, break monitoring, and privacy honoring.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Daily Focus Goal (Hours)</Label>
              <Input
                type="number"
                step="0.5"
                value={dailyGoalHours}
                onChange={(e) => setDailyGoalHours(e.target.value)}
                className="h-9 text-xs bg-background border-border rounded-md font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Maximum Idle Break Before Auto-Pause (Minutes)</Label>
              <Input
                type="number"
                value={breakThresholdMin}
                onChange={(e) => setBreakThresholdMin(e.target.value)}
                className="h-9 text-xs bg-background border-border rounded-md font-mono"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-foreground">Auto-Stop on Turnstile Exit</div>
                <div className="text-[11px] text-muted-foreground">
                  Automatically conclude timer when student scans RFID/QR at gate.
                </div>
              </div>
              <Switch
                checked={autoStopOnCheckout}
                onCheckedChange={setAutoStopOnCheckout}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-foreground">Honor Student Privacy Opt-Out</div>
                <div className="text-[11px] text-muted-foreground">
                  Mask student full name to initials if private leaderboard setting is toggled.
                </div>
              </div>
              <Switch
                checked={optInLeaderboard}
                onCheckedChange={setOptInLeaderboard}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSettingsModalOpen(false)}
              className="h-8 text-xs border-border rounded-md"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveSettings}
              className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-semibold"
            >
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
