"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { use } from "react"
import {
  Calendar,
  ChevronLeft,
  Clock,
  Download,
  Flame,
  LineChart,
  TrendingUp,
  Users,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function AttendanceAnalyticsReportsPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const hourlyTraffic = [
    { hour: "06:00 AM", arrivals: 68, label: "Morning Peak (Gate Rush)" },
    { hour: "07:00 AM", arrivals: 42, label: "Morning Secondary" },
    { hour: "08:00 AM", arrivals: 25, label: "Steady Entry" },
    { hour: "10:00 AM", arrivals: 12, label: "Midday Calm" },
    { hour: "01:00 PM", arrivals: 18, label: "Lunch Transitions" },
    { hour: "02:00 PM", arrivals: 54, label: "Evening Shift Peak" },
    { hour: "04:00 PM", arrivals: 20, label: "After-College Rush" },
    { hour: "07:00 PM", arrivals: 8, label: "Night Owl Arrivals" },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden space-y-4 p-3 sm:p-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href={ensureLocalizedPathname("/pages/reports", lang)}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0",
          })}
        >
          <ChevronLeft className="size-4" />
          <span>Back to Reports Center</span>
        </Link>
        <span className="text-xs font-mono text-muted-foreground">
          Hourly Traffic & Peak Hours Curve (PRD §22)
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            Attendance & Hourly Traffic Curve
          </h1>
          <p className="text-xs text-muted-foreground">
            Analyze gate check-in congestion points, peak focus windows (6 AM - 11 PM) and shift attendance rates (PRD §22)
          </p>
        </div>

        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border">
          <Download className="size-3.5" />
          <span>Export Analytics</span>
        </Button>
      </div>

      {/* Hourly Curve Card */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            Hourly Arrival Distribution
          </CardTitle>
          <CardDescription className="text-xs">
            Student entry scans clustered by hour of the day across all campuses.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-1 space-y-3 text-xs">
          {hourlyTraffic.map((ht, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono font-bold text-foreground w-20">{ht.hour}</span>
                <span className="text-muted-foreground flex-1 px-2">{ht.label}</span>
                <span className="font-mono font-bold text-primary">{ht.arrivals} Check-ins</span>
              </div>
              <Progress value={(ht.arrivals / 70) * 100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

