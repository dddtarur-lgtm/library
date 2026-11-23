"use client"

import { useEffect, useState } from "react"
import {
  Ban,
  CalendarX2,
  Clock,
  UserCheck,
  Users,
} from "lucide-react"

import { customerInsightsData } from "../_data/customer-insights"
import { libraryService } from "@/services/library-service"

import { Card, CardContent } from "@/components/ui/card"

export function CustomerInsights() {
  const [insights, setInsights] = useState(customerInsightsData)

  useEffect(() => {
    async function fetchInsights() {
      try {
        const stats = await libraryService.getDashboardStats()
        if (stats) {
          setInsights({
            total: stats.total_students || customerInsightsData.total,
            live: stats.active_students || customerInsightsData.live,
            pending: stats.pending_dues_count || customerInsightsData.pending,
            expired: customerInsightsData.expired,
            suspended: customerInsightsData.suspended,
          })
        }
      } catch {
        // Fallback to initial
      }
    }
    fetchInsights()
  }, [])

  const cards = [
    {
      title: "Total",
      value: insights.total,
      icon: Users,
      cardBg: "bg-blue-50/80 dark:bg-blue-950/30",
      borderColor: "border-blue-300 dark:border-blue-500/30",
      badgeBg: "bg-blue-600 text-white shadow-sm shadow-blue-500/25",
      textColor: "text-blue-700 dark:text-blue-400",
    },
    {
      title: "Live",
      value: insights.live,
      icon: UserCheck,
      cardBg: "bg-emerald-50/80 dark:bg-emerald-950/30",
      borderColor: "border-emerald-300 dark:border-emerald-500/30",
      badgeBg: "bg-emerald-600 text-white shadow-sm shadow-emerald-500/25",
      textColor: "text-emerald-700 dark:text-emerald-400",
    },
    {
      title: "Pending",
      value: insights.pending,
      icon: Clock,
      cardBg: "bg-amber-50/80 dark:bg-amber-950/30",
      borderColor: "border-amber-300 dark:border-amber-500/30",
      badgeBg: "bg-amber-500 text-white shadow-sm shadow-amber-500/25",
      textColor: "text-amber-700 dark:text-amber-300",
    },
    {
      title: "Expired",
      value: insights.expired,
      icon: CalendarX2,
      cardBg: "bg-purple-50/80 dark:bg-purple-950/30",
      borderColor: "border-purple-300 dark:border-purple-500/30",
      badgeBg: "bg-purple-600 text-white shadow-sm shadow-purple-500/25",
      textColor: "text-purple-700 dark:text-purple-300",
    },
    {
      title: "Suspended",
      value: insights.suspended,
      icon: Ban,
      cardBg: "bg-rose-50/80 dark:bg-rose-950/30",
      borderColor: "border-rose-300 dark:border-rose-500/30",
      badgeBg: "bg-rose-600 text-white shadow-sm shadow-rose-500/25",
      textColor: "text-rose-700 dark:text-rose-400",
    },
  ]

  return (
    <Card className="md:col-span-3 flex items-center justify-center border-border bg-card shadow-xs">
      <CardContent className="w-full p-2.5 sm:p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-2.5 w-full">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className={`flex items-center gap-x-2.5 rounded-xl border p-2 sm:px-3 sm:py-2 transition-colors ${card.cardBg} ${card.borderColor}`}
              >
                <div
                  className={`flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-lg shadow-sm ${card.badgeBg}`}
                >
                  <Icon className="size-4 sm:size-4.5 shrink-0" aria-hidden />
                </div>
                <div className="min-w-0 overflow-hidden">
                  <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                    {card.title}
                  </p>
                  <p
                    className={`text-lg sm:text-xl font-extrabold tracking-tight mt-0.5 ${card.textColor}`}
                  >
                    {card.value.toLocaleString()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
