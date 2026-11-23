"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import { Clock, Flame, Goal, TrendingUp, UserCheck } from "lucide-react"

import type { StudentProfile } from "@/data/students-data"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"

const monthlyChartConfig = {
  hours: {
    label: "Study Hours",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const weeklyChartConfig = {
  morning: {
    label: "Morning (8 AM - 2 PM)",
    color: "hsl(var(--chart-1))",
  },
  evening: {
    label: "Evening (2 PM - 10 PM)",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function StudentProfileAnalytics({ student }: { student: StudentProfile }) {
  const { analytics } = student
  const goalPercent = Math.min(
    100,
    Math.round((analytics.monthlyHours / analytics.hoursGoal) * 100)
  )

  return (
    <div className="space-y-3 min-w-0 w-full overflow-hidden">
      {/* 4 Analytics Summary Cards (Small & compact layout) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 min-w-0">
        {/* 1. Monthly Study Hours */}
        <Card className="border-border bg-card p-1.5 px-2.5 shadow-xs min-w-0 rounded-lg flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block truncate">
              Monthly Hours
            </span>
            <p className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight mt-0.5 truncate">
              {analytics.monthlyHours} <span className="text-xs font-normal text-muted-foreground">hrs</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              Goal: {analytics.hoursGoal}h ({goalPercent}%)
            </p>
          </div>
          <div className="size-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 ms-2">
            <Clock className="size-3" />
          </div>
        </Card>

        {/* 2. Daily Average */}
        <Card className="border-border bg-card p-1.5 px-2.5 shadow-xs min-w-0 rounded-lg flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block truncate">
              Daily Average
            </span>
            <p className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight mt-0.5 truncate">
              {analytics.dailyAverageHours} <span className="text-xs font-normal text-muted-foreground">hrs/d</span>
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium truncate">
              +1.2h vs batch
            </p>
          </div>
          <div className="size-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 ms-2">
            <TrendingUp className="size-3" />
          </div>
        </Card>

        {/* 3. Study Streak */}
        <Card className="border-border bg-card p-1.5 px-2.5 shadow-xs min-w-0 rounded-lg flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block truncate">
              Active Streak
            </span>
            <p className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight mt-0.5 flex items-center gap-1 truncate">
              <span>{analytics.streakDays} Days</span>
              <span className="text-xs">🔥</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              Best: 32 days
            </p>
          </div>
          <div className="size-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 ms-2">
            <Flame className="size-3" />
          </div>
        </Card>

        {/* 4. Attendance Rate */}
        <Card className="border-border bg-card p-1.5 px-2.5 shadow-xs min-w-0 rounded-lg flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block truncate">
              Attendance Rate
            </span>
            <p className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight mt-0.5 truncate">
              {analytics.attendanceRate}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {analytics.onTimePercentage}% on-time
            </p>
          </div>
          <div className="size-6 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 ms-2">
            <UserCheck className="size-3" />
          </div>
        </Card>
      </div>

      {/* Goal Progress Bar Card */}
      <Card className="border-border bg-card shadow-xs min-w-0 rounded-lg">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Goal className="size-3.5 text-primary" />
              <span className="text-xs font-bold text-foreground">
                Monthly Study Goal: {analytics.hoursGoal} Hours
              </span>
            </div>
            <span className="text-xs font-bold text-primary">
              {analytics.monthlyHours} / {analytics.hoursGoal} hrs ({goalPercent}%)
            </span>
          </div>
          <Progress value={goalPercent} className="h-2 bg-muted rounded-full" />
        </CardContent>
      </Card>

      {/* Charts Row — Themed ChartContainer with theme hover color & tooltip */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 min-w-0">
        {/* Monthly Hours Trend Chart */}
        <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden rounded-lg">
          <CardHeader className="p-3.5 pb-1 min-w-0">
            <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-foreground truncate">
              <TrendingUp className="size-3.5 text-primary shrink-0" />
              <span className="truncate">Study Hours Growth (Last 5 Months)</span>
            </CardTitle>
            <CardDescription className="text-[11px] truncate">
              Total monthly hours logged via QR and gate check-in
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-1 min-w-0">
            <div className="h-48 w-full min-w-0">
              <ChartContainer config={monthlyChartConfig} className="h-full w-full aspect-auto">
                <BarChart data={analytics.monthlyTrend} barSize={26} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border/50"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    className="text-xs text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    className="text-xs text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    unit="h"
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar
                    dataKey="hours"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    className="transition-opacity duration-200 hover:opacity-80"
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Day-by-Day Hours */}
        <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden rounded-lg">
          <CardHeader className="p-3.5 pb-1 min-w-0">
            <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-foreground truncate">
              <Clock className="size-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">Weekly Daily Hours Breakdown</span>
            </CardTitle>
            <CardDescription className="text-[11px] truncate">
              Morning vs Evening study session distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-1 min-w-0">
            <div className="h-48 w-full min-w-0">
              <ChartContainer config={weeklyChartConfig} className="h-full w-full aspect-auto">
                <BarChart data={analytics.weeklyHours} barSize={18} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border/50"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    className="text-xs text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    className="text-xs text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    unit="h"
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar
                    dataKey="morning"
                    fill="hsl(var(--chart-1))"
                    radius={[4, 4, 0, 0]}
                    className="transition-opacity duration-200 hover:opacity-80"
                  />
                  <Bar
                    dataKey="evening"
                    fill="hsl(var(--chart-2))"
                    radius={[4, 4, 0, 0]}
                    className="transition-opacity duration-200 hover:opacity-80"
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
