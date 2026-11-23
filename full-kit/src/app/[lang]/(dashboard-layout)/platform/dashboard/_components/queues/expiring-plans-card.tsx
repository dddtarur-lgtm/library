"use client"

import { BellRing, CalendarClock, ChevronRight, Send, ShieldPlus } from "lucide-react"

import type { ExpiringLibraryPlan } from "@/data/platform-admin-data"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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

export function ExpiringPlansCard({ plans, onExtend, onSendReminder }: ExpiringPlansCardProps) {
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <CalendarClock className="size-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">Plans Expiring in 7 Days</CardTitle>
            <p className="text-xs text-muted-foreground">Renewal follow-ups before 5-day grace triggers</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">{plans.length} upcoming</span>
      </CardHeader>

      <CardContent className="pt-2 px-3 flex-1 flex flex-col justify-between divide-y divide-border/40">
        {plans.map((p) => (
          <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-foreground">{p.libraryName}</span>
                <Badge
                  variant={p.daysLeft <= 3 ? "destructive" : "outline"}
                  className={`text-[10px] py-0 px-1.5 font-bold ${
                    p.daysLeft <= 3
                      ? ""
                      : "text-amber-600 border-amber-400 bg-amber-500/10"
                  }`}
                >
                  {p.daysLeft}d left
                </Badge>
                <span className="text-xs font-black text-foreground">{formatINR(p.planFee)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {p.planName} • Exp: {p.expiryDate} • {p.liveStudents} live students
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSendReminder(p)}
                className="h-7 px-2 text-xs font-semibold gap-1"
                title="Send WhatsApp & Email payment link"
              >
                <Send className="size-3 text-sky-600" />
                <span>Remind</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onExtend(p)}
                className="h-7 px-2 text-xs font-semibold gap-1 hover:border-primary"
              >
                <ShieldPlus className="size-3 text-emerald-600" />
                <span>Extend</span>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
