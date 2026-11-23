"use client"

import {
  AlertTriangle,
  Building2,
  Clock,
  CreditCard,
  FileCheck2,
  GraduationCap,
  Lock,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react"

import type { PlatformKPIs } from "@/data/platform-admin-data"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PlatformMetricsGridProps {
  kpis: PlatformKPIs
  onSelectMetric?: (metricKey: string) => void
}

function formatINR(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val)
}

export function PlatformMetricsGrid({ kpis, onSelectMetric }: PlatformMetricsGridProps) {
  const cards = [
    {
      key: "total-libraries",
      title: "Total Libraries",
      value: kpis.totalLibraries.toLocaleString("en-IN"),
      subtext: `+${kpis.totalLibrariesGrowth} this quarter`,
      icon: Building2,
      badgeText: "Approved",
      badgeVariant: "secondary" as const,
      borderClass: "hover:border-primary/50",
      accentBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      key: "active-libraries",
      title: "Active Libraries",
      value: kpis.activeLibraries.toLocaleString("en-IN"),
      subtext: `${kpis.activeLibrariesRate}% running normal`,
      icon: TrendingUp,
      badgeText: "Operational",
      badgeVariant: "outline" as const,
      borderClass: "hover:border-emerald-500/50",
      accentBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "pending-approvals",
      title: "Pending Approvals",
      value: kpis.pendingApprovals.toLocaleString("en-IN"),
      subtext: "Action needed in queue",
      icon: FileCheck2,
      badgeText: "6 In Queue",
      badgeVariant: "warning" as const,
      borderClass: "hover:border-amber-500/50 border-amber-500/30",
      accentBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      urgent: true,
    },
    {
      key: "grace-period",
      title: "Plans in Grace Period",
      value: kpis.inGracePeriod.toLocaleString("en-IN"),
      subtext: `${kpis.graceDaysNotice}-day notice active`,
      icon: Clock,
      badgeText: "Daily Warning",
      badgeVariant: "warning" as const,
      borderClass: "hover:border-amber-600/50",
      accentBg: "bg-amber-600/10 text-amber-700 dark:text-amber-300",
    },
    {
      key: "locked-libraries",
      title: "Locked Libraries",
      value: kpis.lockedLibraries.toLocaleString("en-IN"),
      subtext: `${kpis.lockedImpactStudents} students paused`,
      icon: Lock,
      badgeText: "Access Blocked",
      badgeVariant: "destructive" as const,
      borderClass: "hover:border-destructive/60 border-destructive/30",
      accentBg: "bg-destructive/10 text-destructive",
      urgent: true,
    },
    {
      key: "live-students",
      title: "Live Students",
      value: kpis.liveStudents.toLocaleString("en-IN"),
      subtext: `+${kpis.liveStudentsGrowth} this month`,
      icon: GraduationCap,
      badgeText: "Across Platform",
      badgeVariant: "secondary" as const,
      borderClass: "hover:border-violet-500/50",
      accentBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      key: "revenue-this-month",
      title: "Revenue This Month",
      value: formatINR(kpis.revenueThisMonth),
      subtext: `+${kpis.revenueGrowthPercent}% vs last period`,
      icon: CreditCard,
      badgeText: "Subscriptions",
      badgeVariant: "outline" as const,
      borderClass: "hover:border-emerald-600/50",
      accentBg: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300",
    },
    {
      key: "failed-payments",
      title: "Failed Payments",
      value: kpis.failedPayments.toLocaleString("en-IN"),
      subtext: `${formatINR(kpis.failedPaymentsAmount)} in Razorpay`,
      icon: AlertTriangle,
      badgeText: "Needs Attention",
      badgeVariant: "destructive" as const,
      borderClass: "hover:border-rose-500/50",
      accentBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      urgent: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card
            key={card.key}
            onClick={() => onSelectMetric?.(card.key)}
            className={cn(
              "relative cursor-pointer overflow-hidden border transition-all hover:shadow-md",
              card.borderClass
            )}
          >
            <CardContent className="p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {card.title}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black tracking-tight text-foreground">
                      {card.value}
                    </span>
                  </div>
                </div>
                <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", card.accentBg)}>
                  <Icon className="size-4" />
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px]">
                <span className="font-medium text-muted-foreground truncate">
                  {card.subtext}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground/70">
                  {kpis.lastUpdated}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

