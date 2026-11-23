"use client"

import { CalendarClock } from "lucide-react"

import { cn } from "@/lib/utils"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ExpiryForecastChartProps {
  data: Array<{ period: string; count: number; value: string; risk: string }>
}

export function ExpiryForecastChart({ data }: ExpiryForecastChartProps) {
  const safeData = Array.isArray(data) ? data : []
  const maxCount = Math.max(...safeData.map((d) => Number(d?.count || 0)), 1)
  const totalCount = safeData.reduce((acc, d) => acc + Number(d?.count || 0), 0)

  const barColors = [
    "bg-amber-500",
    "bg-sky-500",
    "bg-primary",
    "bg-emerald-500",
  ]

  return (
    <Card className="h-full flex flex-col justify-between rounded-xl border border-border/70 bg-card/90 shadow-xs overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-5 py-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/20">
            <CalendarClock className="size-4" />
          </div>
          <CardTitle className="text-sm font-bold tracking-tight">
            30-Day Expiry Forecast
          </CardTitle>
        </div>
        <span className="text-xs font-bold text-muted-foreground tabular-nums">
          {totalCount} Due
        </span>
      </CardHeader>

      <CardContent className="p-5 flex-1 flex flex-col justify-center gap-4">
        {safeData.map((item, idx) => {
          const widthPct = Math.round((item.count / maxCount) * 100)
          const color = barColors[idx % barColors.length]

          return (
            <div key={item.period} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">
                    {item.period}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    · {item.risk}
                  </span>
                </div>
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="font-black text-foreground">
                    {item.count}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {item.value}
                  </span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    color
                  )}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
