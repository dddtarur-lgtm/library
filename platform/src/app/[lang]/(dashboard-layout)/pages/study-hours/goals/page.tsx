"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { use } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Coffee,
  Download,
  Flame,
  Target,
  Users,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function StudyGoalsBreakCompliancePage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const studentGoals = [
    { name: "Aarav Patel", code: "STU-1081", dailyGoal: 8, achievedAvg: 7.8, completionRate: 98, avgBreakMinutes: 35, breakCompliance: "Optimal (<45m)", streak: 14 },
    { name: "Priya Sharma", code: "STU-1082", dailyGoal: 9, achievedAvg: 9.2, completionRate: 102, avgBreakMinutes: 25, breakCompliance: "Optimal (<45m)", streak: 21 },
    { name: "Rohan Verma", code: "STU-1083", dailyGoal: 7, achievedAvg: 5.5, completionRate: 78, avgBreakMinutes: 65, breakCompliance: "Excessive (>45m)", streak: 3 },
    { name: "Ananya Iyer", code: "STU-1084", dailyGoal: 6, achievedAvg: 6.2, completionRate: 103, avgBreakMinutes: 30, breakCompliance: "Optimal (<45m)", streak: 8 },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden space-y-4 p-3 sm:p-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href={ensureLocalizedPathname("/pages/study-hours", lang)}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0",
          })}
        >
          <ChevronLeft className="size-4" />
          <span>Back to Study Hours</span>
        </Link>
        <span className="text-xs font-mono text-muted-foreground">
          Study Targets & Break Compliance (PRD §24.2)
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="size-5 text-emerald-600" />
            Study Goals & Break Time Compliance
          </h1>
          <p className="text-xs text-muted-foreground">
            Track student daily reading targets, focus streak milestones and audit excessive break durations (PRD §24.2)
          </p>
        </div>

        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border">
          <Download className="size-3.5" />
          <span>Export Compliance Data</span>
        </Button>
      </div>

      {/* Table */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold">Student</TableHead>
                <TableHead className="text-xs font-bold text-center">Daily Goal</TableHead>
                <TableHead className="text-xs font-bold text-center">Achieved Avg</TableHead>
                <TableHead className="text-xs font-bold w-[200px]">Goal Progress</TableHead>
                <TableHead className="text-xs font-bold text-center">Avg Break Time</TableHead>
                <TableHead className="text-xs font-bold">Break Compliance</TableHead>
                <TableHead className="text-xs font-bold text-center">Active Streak</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentGoals.map((g, i) => (
                <TableRow key={i} className="text-xs">
                  <TableCell>
                    <div className="font-semibold text-foreground">{g.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{g.code}</div>
                  </TableCell>

                  <TableCell className="text-center font-mono font-medium">{g.dailyGoal}h / day</TableCell>
                  <TableCell className="text-center font-mono font-bold text-primary">{g.achievedAvg}h</TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-muted-foreground">{g.completionRate}%</span>
                        <span className={g.completionRate >= 100 ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                          {g.completionRate >= 100 ? "Goal Exceeded" : "On Track"}
                        </span>
                      </div>
                      <Progress value={Math.min(100, g.completionRate)} className="h-1.5" />
                    </div>
                  </TableCell>

                  <TableCell className="text-center font-mono text-muted-foreground">
                    {g.avgBreakMinutes} mins / day
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        g.breakCompliance.includes("Optimal")
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
                          : "bg-destructive/10 text-destructive border-destructive/20 text-[10px]"
                      }
                    >
                      {g.breakCompliance}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center font-mono font-bold text-rose-500">
                    <span className="flex items-center justify-center gap-1">
                      <Flame className="size-3.5 fill-rose-500" />
                      {g.streak}d
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

