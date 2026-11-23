"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Activity,
  Building2,
  ChartColumn,
  Download,
  IndianRupee,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import {
  initialLibraryGrowthData,
  initialPlatformRevenueData,
} from "@/data/platform/platform-data"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { ReportChartCard, ReportKpiGrid } from "./_components/reports-shell"
import { LibraryAvatar } from "@/components/platform/library-logo"

type ReportTab =
  | "overview"
  | "growth"
  | "revenue"
  | "churn"
  | "occupancy"
  | "usage"

const CHURN_TREND = [
  { month: "Jun", rate: 2.3 },
  { month: "Jul", rate: 2.1 },
  { month: "Aug", rate: 1.9 },
  { month: "Sep", rate: 1.7 },
  { month: "Oct", rate: 1.5 },
  { month: "Nov", rate: 1.4 },
]

const OCCUPANCY_SERIES = [
  { shift: "Morning", occupancy: 88 },
  { shift: "Afternoon", occupancy: 92 },
  { shift: "Evening", occupancy: 81 },
  { shift: "Night", occupancy: 64 },
]

const TELEMETRY_SERIES = [
  { day: "Mon", checkins: 19400 },
  { day: "Tue", checkins: 21200 },
  { day: "Wed", checkins: 22100 },
  { day: "Thu", checkins: 21800 },
  { day: "Fri", checkins: 22600 },
  { day: "Sat", checkins: 24100 },
  { day: "Sun", checkins: 18900 },
]

const TOP_OCCUPANCY_LIBRARIES = [
  {
    name: "Apex Study Hub",
    code: "LIB-PUN-001",
    seats: 180,
    occupied: 169,
    pct: 94,
  },
  {
    name: "Kalam Study Arena",
    code: "LIB-AHM-005",
    seats: 320,
    occupied: 288,
    pct: 90,
  },
  {
    name: "Metro Library Network",
    code: "LIB-DEL-002",
    seats: 410,
    occupied: 344,
    pct: 84,
  },
]

export default function PlatformReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("overview")
  const [range, setRange] = useState("30d")

  const activeCsvRows: Record<string, string | number>[] = useMemo(() => {
    if (activeTab === "growth") return initialLibraryGrowthData
    if (activeTab === "churn") return CHURN_TREND
    if (activeTab === "occupancy") return OCCUPANCY_SERIES
    if (activeTab === "usage") return TELEMETRY_SERIES
    return initialPlatformRevenueData
  }, [activeTab])

  const handleExport = () => {
    if (activeCsvRows.length === 0) return
    const headers = Object.keys(activeCsvRows[0])
    const lines = [
      headers.join(","),
      ...activeCsvRows.map((r) => headers.map((h) => `"${r[h]}"`).join(",")),
    ]
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `platform-${activeTab}-${range}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported platform-${activeTab}-${range}.csv`)
  }

  return (
    <section className="container space-y-5 py-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Platform Reports
          </h1>
          <p className="text-xs text-muted-foreground">
            Executive analytics across growth, recurring revenue, churn, desk
            occupancy, and telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">
            {[
              { id: "overview", label: "Overview", icon: ChartColumn },
              { id: "growth", label: "Growth", icon: TrendingUp },
              { id: "revenue", label: "Revenue", icon: IndianRupee },
              { id: "churn", label: "Churn", icon: TrendingDown },
              { id: "occupancy", label: "Occupancy", icon: Building2 },
              { id: "usage", label: "Telemetry", icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as ReportTab)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7D</SelectItem>
              <SelectItem value="30d">Last 30D</SelectItem>
              <SelectItem value="90d">Last 90D</SelectItem>
              <SelectItem value="12m">Last 12M</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            onClick={handleExport}
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-5">
          <ReportKpiGrid
            items={[
              {
                label: "Monthly Recurring Revenue",
                value: "₹4,86,400",
                delta: "+18.4% vs prior period",
              },
              {
                label: "Active Library Tenants",
                value: "142",
                delta: "+14 new onboardings",
              },
              {
                label: "Average Seat Occupancy",
                value: "84.6%",
                delta: "+4.2% peak shift utilization",
              },
              {
                label: "Net Monthly Churn",
                value: "1.4%",
                delta: "-0.6% improvement",
              },
            ]}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <ReportChartCard
              title="Monthly Revenue Trend"
              description="Recurring subscription + add-on collections (INR)"
              data={initialPlatformRevenueData}
              xKey="month"
              yKey="revenue"
              yLabel="Revenue (₹)"
              type="area"
            />
            <ReportChartCard
              title="Tenant Onboarding Velocity"
              description="Cumulative active study libraries across India"
              data={initialLibraryGrowthData}
              xKey="month"
              yKey="total"
              yLabel="Total Libraries"
              type="bar"
            />
          </div>
        </div>
      )}

      {activeTab === "growth" && (
        <div className="space-y-5">
          <ReportKpiGrid
            items={[
              {
                label: "Total Libraries",
                value: "142",
                delta: "+14 this month",
              },
              {
                label: "Trial Conversion",
                value: "68.5%",
                delta: "+5.1% vs 30d",
              },
              {
                label: "Active Cities",
                value: "28",
                delta: "+3 new Tier-2 cities",
              },
              {
                label: "Total Managed Seats",
                value: "19,420",
                delta: "+1,640 seats",
              },
            ]}
          />
          <ReportChartCard
            title="Library Growth Trajectory"
            description="Net active libraries over time"
            data={initialLibraryGrowthData}
            xKey="month"
            yKey="total"
            yLabel="Libraries"
            type="area"
          />
        </div>
      )}

      {activeTab === "revenue" && (
        <div className="space-y-5">
          <ReportKpiGrid
            items={[
              { label: "Current MRR", value: "₹4,86,400", delta: "+18.4% MoM" },
              {
                label: "Annualized Run Rate",
                value: "₹58.3L",
                delta: "+22.1% YoY",
              },
              {
                label: "ARPU (Per Library)",
                value: "₹3,425",
                delta: "+₹210 vs Q3",
              },
              {
                label: "Invoice Collection Rate",
                value: "98.2%",
                delta: "Auto-debit enabled",
              },
            ]}
          />
          <ReportChartCard
            title="Monthly Recurring Revenue"
            description="Gross SaaS collections across Starter, Pro, and Enterprise plans"
            data={initialPlatformRevenueData}
            xKey="month"
            yKey="revenue"
            yLabel="MRR (₹)"
            type="bar"
          />
        </div>
      )}

      {activeTab === "churn" && (
        <div className="space-y-5">
          <ReportKpiGrid
            items={[
              {
                label: "Monthly Logo Churn",
                value: "1.4%",
                delta: "-0.9% since Jun",
              },
              {
                label: "Net Revenue Retention",
                value: "112%",
                delta: "Expansion exceeds churn",
              },
              {
                label: "90-Day Survival",
                value: "94.6%",
                delta: "+2.4% onboarding boost",
              },
              {
                label: "At-Risk Accounts",
                value: "4",
                delta: "Flagged for CSM outreach",
                positive: false,
              },
            ]}
          />
          <ReportChartCard
            title="Monthly Churn Rate (%)"
            description="Percentage of active paying libraries cancelling per month"
            data={CHURN_TREND}
            xKey="month"
            yKey="rate"
            yLabel="Churn (%)"
            type="area"
          />
        </div>
      )}

      {activeTab === "occupancy" && (
        <div className="space-y-5">
          <ReportKpiGrid
            items={[
              {
                label: "Network Occupancy",
                value: "84.6%",
                delta: "+4.2% vs last month",
              },
              {
                label: "Occupied Desks",
                value: "16,429",
                delta: "Out of 19,420 seats",
              },
              {
                label: "Peak Shift",
                value: "Afternoon",
                delta: "92% average fill",
              },
              {
                label: "Avg Daily Check-Ins",
                value: "21,840",
                delta: "QR + Biometric",
              },
            ]}
          />
          <ReportChartCard
            title="Occupancy by Shift (%)"
            description="Average desk utilization across daily study shifts"
            data={OCCUPANCY_SERIES}
            xKey="shift"
            yKey="occupancy"
            yLabel="Occupancy (%)"
            type="bar"
          />
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/70 pb-4">
              <CardTitle className="text-base">
                Top Utilized Libraries
              </CardTitle>
              <CardDescription>
                Libraries operating above 80% desk capacity
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Library</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead className="w-56">Utilization</TableHead>
                    <TableHead className="pr-4 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TOP_OCCUPANCY_LIBRARIES.map((lib) => (
                    <TableRow key={lib.code}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2.5">
                          <LibraryAvatar
                            name={lib.name}
                            code={lib.code}
                            size="sm"
                          />
                          <span className="text-sm font-medium">
                            {lib.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs tabular-nums">
                        {lib.occupied} / {lib.seats}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={lib.pct} className="h-1.5" />
                          <span className="text-xs font-semibold tabular-nums">
                            {lib.pct}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        >
                          Optimal
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "usage" && (
        <div className="space-y-5">
          <ReportKpiGrid
            items={[
              {
                label: "Daily Active Students",
                value: "21,840",
                delta: "+9.4% WoW",
              },
              {
                label: "Median API Latency",
                value: "42 ms",
                delta: "99.98% uptime",
              },
              {
                label: "WhatsApp Alerts Sent",
                value: "8,420",
                delta: "99.1% delivered",
              },
              {
                label: "App v2.4 Adoption",
                value: "86.3%",
                delta: "+12% this week",
              },
            ]}
          />
          <ReportChartCard
            title="Daily Check-In Events"
            description="Combined QR & biometric gate punches per day"
            data={TELEMETRY_SERIES}
            xKey="day"
            yKey="checkins"
            yLabel="Check-Ins"
            type="area"
          />
        </div>
      )}
    </section>
  )
}
