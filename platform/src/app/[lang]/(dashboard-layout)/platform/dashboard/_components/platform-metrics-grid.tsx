"use client"

import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CreditCard,
  GraduationCap,
  ShieldAlert,
} from "lucide-react"

import type { PlatformKPIs } from "@/data/platform-admin-data"

import { cn } from "@/lib/utils"

import { Card, CardContent } from "@/components/ui/card"

interface PlatformMetricsGridProps {
  kpis: PlatformKPIs
  onSelectMetric?: (metricKey: string) => void
}

function formatINR(val: number | string | undefined | null) {
  const num = Number(val || 0)
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num)
}

function formatNum(val: number | string | undefined | null): string {
  const num = Number(val || 0)
  return num.toLocaleString("en-IN")
}

export function PlatformMetricsGrid({
  kpis,
  onSelectMetric,
}: PlatformMetricsGridProps) {
  const safeKpis = ((kpis as unknown as { data?: PlatformKPIs })?.data ||
    kpis ||
    {}) as unknown as Partial<PlatformKPIs> & {
    periodLabel?: string
    totalStudents?: number
  }

  const pendingApprovals = Number(safeKpis.pendingApprovals || 0)
  const inGracePeriod = Number(safeKpis.inGracePeriod || 0)
  const lockedLibraries = Number(safeKpis.lockedLibraries || 0)
  const attentionTotal = pendingApprovals + inGracePeriod + lockedLibraries

  const totalLibraries = Number(safeKpis.totalLibraries || 0)
  const activeLibraries = Number(safeKpis.activeLibraries || 0)
  const totalLibrariesGrowth = Number(safeKpis.totalLibrariesGrowth || 0)
  const activeLibrariesRate = Number(safeKpis.activeLibrariesRate || 0)

  const revenueThisMonth = Number(safeKpis.revenueThisMonth || 0)
  const revenueGrowthPercent = Number(safeKpis.revenueGrowthPercent || 0)
  const failedPayments = Number(safeKpis.failedPayments || 0)
  const failedPaymentsAmount = Number(safeKpis.failedPaymentsAmount || 0)

  const liveStudents = Number(
    safeKpis.liveStudents || safeKpis.totalStudents || 0
  )
  const liveStudentsGrowth = Number(safeKpis.liveStudentsGrowth || 0)

  const cards = [
    {
      key: "total-libraries",
      title: "Libraries",
      value: formatNum(totalLibraries),
      pill: `${activeLibraries} Active`,
      pillClass: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/25",
      footerLeft: `+${totalLibrariesGrowth} ${safeKpis.periodLabel ? `(${safeKpis.periodLabel})` : "this period"}`,
      footerRight: `${activeLibrariesRate}% active`,
      icon: Building2,
      iconClass: "bg-primary/10 text-primary ring-primary/20",
      topAccent: "from-primary/60 via-primary/20 to-transparent",
    },
    {
      key: "failed-payments",
      title: safeKpis.periodLabel
        ? `${safeKpis.periodLabel} Revenue`
        : "Platform Revenue",
      value: formatINR(revenueThisMonth),
      pill: `+${revenueGrowthPercent}%`,
      pillClass: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/25",
      footerLeft:
        failedPayments > 0
          ? `${failedPayments} failed (${formatINR(failedPaymentsAmount)})`
          : "All mandates cleared",
      footerAlert: failedPayments > 0,
      icon: CreditCard,
      iconClass: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
      topAccent: "from-emerald-500/60 via-emerald-500/20 to-transparent",
    },
    {
      key: "live-students",
      title: "Live Students",
      value: formatNum(liveStudents),
      pill: `+${liveStudentsGrowth}`,
      pillClass: "bg-violet-500/10 text-violet-400 ring-violet-500/25",
      footerLeft: "Active app seats",
      footerRight: "1-tenant bound",
      icon: GraduationCap,
      iconClass: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
      topAccent: "from-violet-500/60 via-violet-500/20 to-transparent",
    },
    {
      key: "pending-approvals",
      title: "Attention Needed",
      value: formatNum(attentionTotal),
      pill: `${pendingApprovals} Requests`,
      pillClass: "bg-amber-500/10 text-amber-500 ring-amber-500/25",
      footerLeft: `${inGracePeriod} grace · ${lockedLibraries} locked`,
      footerAlert: lockedLibraries > 0,
      icon: ShieldAlert,
      iconClass: "bg-amber-500/10 text-amber-500 ring-amber-500/20",
      topAccent: "from-amber-500/60 via-rose-500/30 to-transparent",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card
            key={card.key}
            onClick={() => onSelectMetric?.(card.key)}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/70 bg-card/90 backdrop-blur-xs transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5"
          >
            {/* Subtle top accent line */}
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r",
                card.topAccent
              )}
            />

            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg ring-1 ring-inset transition-transform group-hover:scale-105",
                      card.iconClass
                    )}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {card.title}
                  </span>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ring-1 ring-inset",
                    card.pillClass
                  )}
                >
                  {card.pill}
                </span>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-foreground">
                  {card.value}
                </span>
                <ArrowUpRight className="size-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>

              <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-xs">
                <span
                  className={cn(
                    "font-semibold flex items-center gap-1 truncate",
                    card.footerAlert ? "text-rose-400" : "text-muted-foreground"
                  )}
                >
                  {card.footerAlert && (
                    <AlertTriangle className="size-3 shrink-0" />
                  )}
                  {card.footerLeft}
                </span>
                {card.footerRight && (
                  <span className="text-[11px] font-medium text-muted-foreground/75 shrink-0">
                    {card.footerRight}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
