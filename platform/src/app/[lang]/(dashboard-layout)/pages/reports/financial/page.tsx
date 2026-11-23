"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { use } from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  CircleDollarSign,
  Coins,
  Download,
  PieChart,
  Receipt,
  TrendingUp,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function FinancialRevenueReportsPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const staffCollections = [
    { staff: "Rohan Desai (Sub Admin)", branch: "Central Branch", cash: 32000, upi: 142000, total: 174000, refunds: 0 },
    { staff: "Pooja Mehta (Sub Admin)", branch: "Central Branch", cash: 18000, upi: 98000, total: 116000, refunds: 1200 },
    { staff: "Ankit Trivedi (Sub Admin)", branch: "West Annex", cash: 24000, upi: 86000, total: 110000, refunds: 0 },
    { staff: "Deepa Nair (Staff)", branch: "North Hub", cash: 12000, upi: 47000, total: 59000, refunds: 0 },
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
          Financial & Revenue Reconciliation (PRD §22 & §17)
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CircleDollarSign className="size-5 text-emerald-600" />
            Financial & Revenue Audit Reports
          </h1>
          <p className="text-xs text-muted-foreground">
            Monthly cash collections, payment gateway reconciliation, staff-wise collection breakdown & refunds audit (PRD §22)
          </p>
        </div>

        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border">
          <Download className="size-3.5" />
          <span>Export Financial Statement</span>
        </Button>
      </div>

      {/* Financial Split Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/60 bg-card shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-xs text-muted-foreground">Gross Fee Collections</span>
            <div className="text-2xl font-bold font-mono text-foreground">₹4,59,000</div>
            <span className="text-emerald-600 text-[11px] font-medium">+18% growth vs Sep</span>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-xs text-muted-foreground">UPI & Razorpay Online</span>
            <div className="text-2xl font-bold font-mono text-primary">₹3,73,000</div>
            <span className="text-[11px] text-muted-foreground">81.2% digital adoption</span>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-xs text-muted-foreground">Cash in Hand Collected</span>
            <div className="text-2xl font-bold font-mono text-emerald-600">₹86,000</div>
            <span className="text-[11px] text-muted-foreground">Settled in drawer safe</span>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-xs text-muted-foreground">Refunds Processed</span>
            <div className="text-2xl font-bold font-mono text-destructive">₹1,200</div>
            <span className="text-[11px] text-muted-foreground">1 student left early (logged)</span>
          </CardContent>
        </Card>
      </div>

      {/* Staff Collection Table */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Receipt className="size-4 text-primary" />
            Staff & Operator Collection Reconciliation
          </CardTitle>
          <CardDescription className="text-xs">
            Audit of fees received per team operator across morning, evening and desk shifts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold">Staff Member</TableHead>
                <TableHead className="text-xs font-bold">Campus</TableHead>
                <TableHead className="text-xs font-bold text-right">Cash Collected</TableHead>
                <TableHead className="text-xs font-bold text-right">UPI QR Collected</TableHead>
                <TableHead className="text-xs font-bold text-right">Total Settled</TableHead>
                <TableHead className="text-xs font-bold text-right">Refunds</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffCollections.map((sc, i) => (
                <TableRow key={i} className="text-xs">
                  <TableCell className="font-semibold text-foreground">{sc.staff}</TableCell>
                  <TableCell className="text-muted-foreground">{sc.branch}</TableCell>
                  <TableCell className="text-right font-mono">₹{sc.cash.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">₹{sc.upi.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-emerald-600">
                    ₹{sc.total.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-destructive">
                    {sc.refunds > 0 ? `₹${sc.refunds}` : "₹0"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

