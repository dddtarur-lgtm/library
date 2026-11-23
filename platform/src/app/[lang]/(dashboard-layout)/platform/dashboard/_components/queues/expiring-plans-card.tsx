"use client"

import { CalendarClock, Send, ShieldPlus } from "lucide-react"

import type { ExpiringLibraryPlan } from "@/data/platform-admin-data"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LibraryAvatar } from "@/components/platform/library-logo"

interface ExpiringPlansCardProps {
  plans: ExpiringLibraryPlan[]
  onExtend: (plan: ExpiringLibraryPlan) => void
  onSendReminder: (plan: ExpiringLibraryPlan) => void
}

function formatINR(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val)
}

export function ExpiringPlansCard({
  plans,
  onExtend,
  onSendReminder,
}: ExpiringPlansCardProps) {
  return (
    <Card className="h-full flex flex-col justify-between rounded-xl border border-border/70 bg-card/90 shadow-xs overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500 ring-1 ring-inset ring-sky-500/20">
            <CalendarClock className="size-4" />
          </div>
          <CardTitle className="text-sm font-bold tracking-tight">
            Expiring in 7 Days
          </CardTitle>
        </div>
        <span className="text-xs font-bold text-muted-foreground tabular-nums">
          {plans.length} Upcoming
        </span>
      </CardHeader>

      <CardContent className="px-5 py-2 flex-1 flex flex-col divide-y divide-border/40">
        {plans.map((p) => {
          const isUrgent = p.daysLeft <= 3
          return (
            <div
              key={p.id}
              className="py-3 flex items-center justify-between gap-3 hover:bg-muted/35 -mx-2.5 px-2.5 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <LibraryAvatar
                  name={p.libraryName}
                  code={p.libraryCode}
                  src={p.logo}
                  size="sm"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground truncate">
                      {p.libraryName}
                    </span>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isUrgent
                          ? "bg-destructive/15 text-destructive"
                          : "bg-amber-500/15 text-amber-500"
                      }`}
                    >
                      {p.daysLeft}d left
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {p.planName} · {p.liveStudents} students
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-xs font-black text-foreground tabular-nums">
                  {formatINR(p.planFee)}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSendReminder(p)}
                    className="h-7 w-7 p-0 border-border/70 hover:border-sky-500/60"
                    title="Send renewal reminder"
                  >
                    <Send className="size-3.5 text-sky-500" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onExtend(p)}
                    className="h-7 w-7 p-0 border-border/70 hover:border-emerald-500/60"
                    title="Extend grace window"
                  >
                    <ShieldPlus className="size-3.5 text-emerald-500" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
