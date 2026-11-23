"use client"

import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
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

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface ReportKpi {
  label: string
  value: string
  delta: string
  positive?: boolean
}

interface ReportsHeaderProps {
  title: string
  description: string
  range: string
  onRangeChange: (val: string) => void
  csvFilename: string
  csvRows: Record<string, string | number>[]
}

export function ReportsHeader({
  title,
  description,
  range,
  onRangeChange,
  csvFilename,
  csvRows,
}: ReportsHeaderProps) {
  const params = useParams()
  const pathname = usePathname()
  const lang = (params.lang as string) || "en"

  const tabs = [
    {
      label: "Overview",
      href: `/${lang}/platform/reports`,
      icon: ChartColumn,
      exact: true,
    },
    {
      label: "Growth",
      href: `/${lang}/platform/reports/growth`,
      icon: TrendingUp,
    },
    {
      label: "Revenue",
      href: `/${lang}/platform/reports/revenue`,
      icon: IndianRupee,
    },
    {
      label: "Churn",
      href: `/${lang}/platform/reports/churn`,
      icon: TrendingDown,
    },
    {
      label: "Occupancy",
      href: `/${lang}/platform/reports/occupancy`,
      icon: Building2,
    },
    {
      label: "Telemetry",
      href: `/${lang}/platform/reports/usage`,
      icon: Activity,
    },
  ]

  const handleExport = () => {
    if (csvRows.length === 0) return
    const headers = Object.keys(csvRows[0])
    const lines = [
      headers.join(","),
      ...csvRows.map((r) => headers.map((h) => `"${r[h]}"`).join(",")),
    ]
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${csvFilename}-${range}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${csvFilename}-${range}.csv`)
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm xl:flex-row xl:items-center xl:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <nav className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                <span>{tab.label}</span>
              </Link>
            )
          })}
        </nav>

        <Select value={range} onValueChange={onRangeChange}>
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
  )
}

export function ReportKpiGrid({ items }: { items: ReportKpi[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((kpi) => (
        <Card key={kpi.label} className="border-border bg-card shadow-sm">
          <CardContent className="space-y-1 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {kpi.value}
            </p>
            <p
              className={cn(
                "text-[11px] font-medium",
                kpi.positive === false
                  ? "text-destructive"
                  : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {kpi.delta}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface ReportChartCardProps {
  title: string
  description: string
  data: Record<string, string | number>[]
  xKey: string
  yKey: string
  yLabel?: string
  type?: "area" | "bar"
}

export function ReportChartCard({
  title,
  description,
  data,
  xKey,
  yKey,
  yLabel = "Value",
  type = "area",
}: ReportChartCardProps) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border/70 pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {type === "bar" ? (
              <BarChart data={data}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey={xKey}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip />
                <Bar
                  dataKey={yKey}
                  name={yLabel}
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            ) : (
              <AreaChart data={data}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey={xKey}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey={yKey}
                  name={yLabel}
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.16)"
                  strokeWidth={2}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
