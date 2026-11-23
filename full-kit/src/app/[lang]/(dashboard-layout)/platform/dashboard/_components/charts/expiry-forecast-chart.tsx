"use client"

import { AlertCircle, CalendarClock, CheckCircle, Clock } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ExpiryForecastChartProps {
  data: Array<{ period: string; count: number; value: string; risk: string }>
}

export function ExpiryForecastChart({ data }: ExpiryForecastChartProps) {
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold">30-Day Plan Expiry Forecast</CardTitle>
          <CalendarClock className="size-4 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">Anticipated renewals & potential grace periods</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-2.5">
          {data.map((item, idx) => {
            const isImmediate = idx === 0
            return (
              <div
                key={item.period}
                className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                  isImmediate
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-200"
                    : "bg-muted/30 border-border/60 text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isImmediate ? (
                    <Clock className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  ) : (
                    <CheckCircle className="size-3.5 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">{item.period}</span>
                    <span className="block text-[10px] text-muted-foreground">{item.risk}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-foreground">{item.count} Libraries</span>
                  <span className="block text-[10px] text-muted-foreground font-semibold">{item.value}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 p-2 rounded-md bg-muted/40 border border-border/50 text-[11px] text-muted-foreground flex items-center gap-1.5">
          <AlertCircle className="size-3.5 text-primary shrink-0" />
          <span>Automated 5-day grace banners trigger immediately upon expiration.</span>
        </div>
      </CardContent>
    </Card>
  )
}

