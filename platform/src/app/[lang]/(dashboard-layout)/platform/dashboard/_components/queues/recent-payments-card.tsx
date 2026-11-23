"use client"

import { ChevronRight, CreditCard } from "lucide-react"

import type { PlatformPayment } from "@/data/platform-admin-data"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LibraryAvatar } from "@/components/platform/library-logo"

interface RecentPaymentsCardProps {
  payments: PlatformPayment[]
  onViewAll?: () => void
}

function formatINR(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val)
}

export function RecentPaymentsCard({
  payments,
  onViewAll,
}: RecentPaymentsCardProps) {
  return (
    <Card className="h-full flex flex-col justify-between rounded-xl border border-border/70 bg-card/90 shadow-xs overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20">
            <CreditCard className="size-4" />
          </div>
          <CardTitle className="text-sm font-bold tracking-tight">
            Recent Payments
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAll}
          className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
        >
          <span>Ledger</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </CardHeader>

      <CardContent className="px-5 py-2 flex-1 flex flex-col divide-y divide-border/40">
        {payments.slice(0, 4).map((pay) => {
          const isSuccess = pay.status === "Success"
          return (
            <div
              key={pay.id}
              className="py-3 flex items-center justify-between gap-3 hover:bg-muted/35 -mx-2.5 px-2.5 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <LibraryAvatar
                  name={pay.libraryName}
                  code={pay.libraryCode}
                  src={pay.logo}
                  size="sm"
                  status={isSuccess ? "Active" : "Locked"}
                  showStatusDot
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground truncate">
                      {pay.libraryName}
                    </span>
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                      {pay.method}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {pay.planName} · {pay.timestamp}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 space-y-0.5">
                <div
                  className={`text-xs font-black tabular-nums ${
                    isSuccess ? "text-foreground" : "text-rose-500"
                  }`}
                >
                  {formatINR(pay.amount)}
                </div>
                <div
                  className={`text-[10px] font-bold ${
                    isSuccess ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {pay.status}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
