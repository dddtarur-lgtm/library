"use client"

import { CheckCircle2, CreditCard, ExternalLink, XCircle } from "lucide-react"

import type { PlatformPayment } from "@/data/platform-admin-data"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

export function RecentPaymentsCard({ payments, onViewAll }: RecentPaymentsCardProps) {
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CreditCard className="size-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">Latest Platform Payments</CardTitle>
            <p className="text-xs text-muted-foreground">Razorpay gateway & direct bank subscriptions</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground" onClick={onViewAll}>
          View Ledger
        </span>
      </CardHeader>

      <CardContent className="pt-2 px-3 flex-1 flex flex-col justify-between divide-y divide-border/40">
        {payments.map((pay) => {
          const isSuccess = pay.status === "Success"
          return (
            <div key={pay.id} className="py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {isSuccess ? (
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="size-4 text-rose-500 shrink-0" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-foreground">{pay.libraryName}</span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1 border-border">
                      {pay.method}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {pay.planName} • Ref: {pay.referenceNumber} • {pay.timestamp}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={`text-xs font-black ${isSuccess ? "text-foreground" : "text-rose-600 dark:text-rose-400"}`}>
                  {formatINR(pay.amount)}
                </span>
                <span className={`block text-[10px] font-bold ${isSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                  {pay.status}
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

