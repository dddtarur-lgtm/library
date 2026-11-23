"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import {
  Armchair,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Building2,
  Calendar,
  ChevronLeft,
  CircleDollarSign,
  Clock,
  Compass,
  Download,
  Filter,
  Layers,
  MapPin,
  PieChart,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

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

export default function BranchAnalyticsBenchmarksPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [timeRange, setTimeRange] = useState<"6m" | "3m" | "30d">("6m")

  // Monthly Revenue Comparison Data (May - Oct 2026)
  const revenueTrendData = [
    { month: "May", kothrud: 82000, fcRoad: 44000, total: 126000 },
    { month: "Jun", kothrud: 91000, fcRoad: 49000, total: 140000 },
    { month: "Jul", kothrud: 98000, fcRoad: 54000, total: 152000 },
    { month: "Aug", kothrud: 104000, fcRoad: 58000, total: 162000 },
    { month: "Sep", kothrud: 112000, fcRoad: 61000, total: 173000 },
    { month: "Oct", kothrud: 118000, fcRoad: 66200, total: 184200 },
  ]

  // Hourly Occupancy Curve (6 AM - 12 AM)
  const hourlyOccupancyData = [
    { hour: "06 AM", kothrud: 28, fcRoad: 18 },
    { hour: "08 AM", kothrud: 74, fcRoad: 62 },
    { hour: "10 AM", kothrud: 88, fcRoad: 80 },
    { hour: "12 PM", kothrud: 82, fcRoad: 72 },
    { hour: "02 PM", kothrud: 65, fcRoad: 58 },
    { hour: "04 PM", kothrud: 84, fcRoad: 76 },
    { hour: "06 PM", kothrud: 92, fcRoad: 85 },
    { hour: "08 PM", kothrud: 86, fcRoad: 78 },
    { hour: "10 PM", kothrud: 62, fcRoad: 48 },
    { hour: "12 AM", kothrud: 34, fcRoad: 22 },
  ]

  // Shift Distribution Data
  const shiftDistributionData = [
    { shift: "Full Day (24x7)", kothrud: 78, fcRoad: 46 },
    { shift: "Morning (6 AM - 12 PM)", kothrud: 42, fcRoad: 28 },
    { shift: "Afternoon (12 PM - 5 PM)", kothrud: 26, fcRoad: 14 },
    { shift: "Evening (5 PM - 11 PM)", kothrud: 39, fcRoad: 22 },
  ]

  // Efficiency KPI Metrics
  const efficiencyMetrics = [
    { metric: "Seat Utilization Peak", kothrud: "92%", fcRoad: "85%", winner: "Kothrud HQ (+7%)" },
    { metric: "Average Study Hours / Day", kothrud: "7.1 hrs", fcRoad: "6.4 hrs", winner: "Kothrud HQ (+0.7h)" },
    { metric: "Geofence Check-in Accuracy", kothrud: "98.8%", fcRoad: "97.4%", winner: "Kothrud HQ" },
    { metric: "Late Arrival Rate", kothrud: "5.2%", fcRoad: "7.8%", winner: "Kothrud HQ (Lower is better)" },
    { metric: "Monthly Revenue per Desk", kothrud: "₹3,277", fcRoad: "₹2,364", winner: "Kothrud HQ (+38%)" },
    { metric: "Renewal Conversion Rate", kothrud: "94.2%", fcRoad: "88.6%", winner: "Kothrud HQ (+5.6%)" },
  ]

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 text-foreground">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href={ensureLocalizedPathname("/pages/branches", lang)}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          <span>Back to Branches Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center rounded-lg border border-border bg-card p-1 text-xs">
            <button
              onClick={() => setTimeRange("6m")}
              className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                timeRange === "6m" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Last 6 Months
            </button>
            <button
              onClick={() => setTimeRange("3m")}
              className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                timeRange === "3m" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Last Quarter
            </button>
            <button
              onClick={() => setTimeRange("30d")}
              className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                timeRange === "30d" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              30 Days
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 rounded-lg border-border bg-card hover:bg-muted text-foreground text-xs font-semibold"
          >
            <Download className="size-3.5" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <TrendingUp className="size-6 text-primary" />
          Cross-Branch Performance &amp; Benchmarks
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Comparative analytics evaluating student enrollments, seat utilization curves, monthly revenues, and geofence door discipline between library branches.
        </p>
      </div>

      {/* 4 HIGHLIGHT KPI TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Combined Network Revenue</span>
            <CircleDollarSign className="size-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground font-mono">
            ₹1,84,200
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <ArrowUpRight className="size-3.5" />
            <span>+14.2% from previous month</span>
          </div>
        </Card>

        <Card className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Enrolled Students</span>
            <Users className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            295
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Kothrud (185) • FC Road (110)
          </div>
        </Card>

        <Card className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Average Network Occupancy</span>
            <Armchair className="size-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-primary">
            78.6%
          </div>
          <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            Target exceeded (&gt;75% benchmark)
          </div>
        </Card>

        <Card className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Average Study Time</span>
            <Clock className="size-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            6.8 hrs
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Daily active study per desk session
          </div>
        </Card>
      </div>

      {/* GRAPH ROW 1: Revenue Comparison & Hourly Occupancy Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Monthly Revenue Comparison (Bar Chart) */}
        <Card className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">
                Monthly Revenue Growth by Campus
              </h3>
              <p className="text-[11px] text-muted-foreground">
                May 2026 - October 2026 (INR in Thousands)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-blue-500" />
                <span className="text-foreground font-semibold text-[11px]">Kothrud HQ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <span className="text-foreground font-semibold text-[11px]">FC Road</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="month" className="stroke-muted-foreground" fontSize={11} tickLine={false} />
                <YAxis
                  className="stroke-muted-foreground"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--card-foreground))",
                    fontSize: "12px",
                  }}
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, ""]}
                />
                <Bar dataKey="kothrud" name="Kothrud HQ" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="fcRoad" name="FC Road" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Hourly Occupancy Curve (Area Chart) */}
        <Card className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">
                Hourly Seat Utilization Peak Curve (%)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Real-time seat occupancy through library operating hours
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-blue-500" />
                <span className="text-foreground font-semibold text-[11px]">Kothrud HQ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-cyan-500" />
                <span className="text-foreground font-semibold text-[11px]">FC Road</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyOccupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorKothrud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorFCRoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="hour" className="stroke-muted-foreground" fontSize={11} tickLine={false} />
                <YAxis className="stroke-muted-foreground" fontSize={11} tickLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--card-foreground))",
                    fontSize: "12px",
                  }}
                  formatter={(val: number) => [`${val}% Occupancy`, ""]}
                />
                <Area
                  type="monotone"
                  dataKey="kothrud"
                  name="Kothrud HQ"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorKothrud)"
                />
                <Area
                  type="monotone"
                  dataKey="fcRoad"
                  name="FC Road"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorFCRoad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* GRAPH ROW 2: Shift Distribution & Key Efficiency Benchmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 3: Shift Distribution */}
        <Card className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight">
              Student Shift Distribution by Campus
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Breakdown of student allocations across Full Day, Morning, Afternoon &amp; Evening slots
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={shiftDistributionData}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" className="stroke-muted-foreground" fontSize={11} tickLine={false} />
                <YAxis dataKey="shift" type="category" className="stroke-muted-foreground" fontSize={10} tickLine={false} width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--card-foreground))",
                    fontSize: "12px",
                  }}
                  formatter={(val: number) => [`${val} students`, ""]}
                />
                <Bar dataKey="kothrud" name="Kothrud HQ" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="fcRoad" name="FC Road" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Efficiency Benchmarks Comparison Matrix */}
        <Card className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight">
              Operational Efficiency Benchmarks
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Head-to-head branch KPI benchmarks and variance metrics
            </p>
          </div>

          <div className="space-y-2 pt-1">
            {efficiencyMetrics.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/30 text-xs"
              >
                <div>
                  <div className="font-semibold text-foreground">{item.metric}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Kothrud: <strong className="text-primary">{item.kothrud}</strong> • FC Road: <strong className="text-purple-500">{item.fcRoad}</strong>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] px-2.5 py-0.5"
                >
                  {item.winner}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* DETAILED CAMPUS PERFORMANCE TABLE */}
      <Card className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-foreground tracking-tight">
            Detailed Multi-Branch Summary Matrix
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full comprehensive breakdown of operational metrics across all registered campuses.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-bold text-muted-foreground uppercase">Campus Name</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase text-center">Total Desks</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase text-center">Active Enrolled</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase text-center min-w-[150px]">Occupancy Rate</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase text-center">Avg Study Hours</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase text-center">Door Check Accuracy</TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase">Monthly Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-border/60 hover:bg-muted/30">
                <TableCell className="py-3.5">
                  <div className="font-bold text-foreground text-xs">Apex Study Hub - Kothrud HQ</div>
                  <div className="text-[10px] text-primary font-medium">Main Headquarters • Manager: Ramesh Kulkarni</div>
                </TableCell>
                <TableCell className="text-center font-mono font-bold text-foreground text-xs">36</TableCell>
                <TableCell className="text-center font-mono font-bold text-foreground text-xs">185</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full w-[81%]" />
                    </div>
                    <span className="text-xs font-bold text-primary font-mono">81%</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-mono text-muted-foreground text-xs">7.1 hrs / day</TableCell>
                <TableCell className="text-center font-mono text-emerald-600 dark:text-emerald-400 text-xs font-semibold">98.8% (100m)</TableCell>
                <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">₹1,18,000</TableCell>
              </TableRow>

              <TableRow className="border-border/60 hover:bg-muted/30">
                <TableCell className="py-3.5">
                  <div className="font-bold text-foreground text-xs">Apex Study Hub - FC Road</div>
                  <div className="text-[10px] text-purple-500 font-medium">Satellite Branch • Manager: Pooja Hegde</div>
                </TableCell>
                <TableCell className="text-center font-mono font-bold text-foreground text-xs">28</TableCell>
                <TableCell className="text-center font-mono font-bold text-foreground text-xs">110</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full w-[75%]" />
                    </div>
                    <span className="text-xs font-bold text-primary font-mono">75%</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-mono text-muted-foreground text-xs">6.4 hrs / day</TableCell>
                <TableCell className="text-center font-mono text-emerald-600 dark:text-emerald-400 text-xs font-semibold">97.4% (100m)</TableCell>
                <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">₹66,200</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
