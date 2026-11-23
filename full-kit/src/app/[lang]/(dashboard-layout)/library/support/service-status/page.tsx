"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock,
  CreditCard,
  Download,
  HardDrive,
  Info,
  Layers,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function ServiceStatusSubscriptionPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const services = [
    {
      name: "Core Multi-Tenant API & Database",
      status: "Operational",
      uptime: "99.99%",
      latency: "42 ms",
      description: "PostgreSQL cluster & multi-tenant schema isolation",
    },
    {
      name: "Dynamic QR Kiosk Attendance TOTP Engine",
      status: "Operational",
      uptime: "100%",
      latency: "18 ms",
      description: "15-second rotating attendance salt & geofencing engine",
    },
    {
      name: "WhatsApp Meta Cloud Messaging Gateway",
      status: "Operational",
      uptime: "99.95%",
      latency: "120 ms",
      description: "Transactional fee receipts, expiry alerts & broadcasts",
    },
    {
      name: "Razorpay Webhook & Payment Reconciliation",
      status: "Operational",
      uptime: "100%",
      latency: "85 ms",
      description: "Instant UPI capture and auto-renewal ledger sync",
    },
    {
      name: "Transactional SMTP Relays",
      status: "Operational",
      uptime: "99.98%",
      latency: "60 ms",
      description: "Custom SMTP & platform mail delivery servers",
    },
  ]

  const billingInvoices = [
    {
      id: "inv-sub-102",
      date: "01 Nov 2026",
      plan: "Multi-Branch Growth Tier (Monthly)",
      amount: "₹3,499 + GST",
      paymentMethod: "Auto-Debit HDFC Bank Visa •••• 4421",
      status: "Paid",
    },
    {
      id: "inv-sub-101",
      date: "01 Oct 2026",
      plan: "Multi-Branch Growth Tier (Monthly)",
      amount: "₹3,499 + GST",
      paymentMethod: "Auto-Debit HDFC Bank Visa •••• 4421",
      status: "Paid",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={ensureLocalizedPathname("/pages/support", lang)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Help &amp; Support
            </Link>
            <ChevronRight className="size-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-primary">SaaS Subscription &amp; Uptime</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            LMS Subscription &amp; Service Health
          </h1>
          <p className="text-sm text-muted-foreground">
            Multi-branch SaaS tier quota, billing receipts, 5-day grace period protections, and real-time infrastructure uptime.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="size-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            All Cloud Systems Operational
          </Badge>
        </div>
      </div>

      {/* Subscription Tier Overview Card */}
      <Card className="border-border/60 bg-gradient-to-r from-card/80 to-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground text-xs font-semibold">
                  Active Subscription
                </Badge>
                <span className="text-xs text-muted-foreground">Renews on 01 Dec 2026</span>
              </div>
              <h2 className="text-2xl font-bold">Multi-Branch Growth Tier</h2>
              <p className="text-xs text-muted-foreground max-w-xl">
                Includes up to 2 Branches, 500 active enrolled students, automated WhatsApp alerts, and priority 30-min engineering support.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="text-left sm:text-right">
                <div className="text-2xl font-extrabold text-primary">₹3,499 <span className="text-xs font-normal text-muted-foreground">/ month</span></div>
                <div className="text-[11px] text-emerald-600 font-medium">Auto-Renew Active (Card •••• 4421)</div>
              </div>
              <Button size="sm" variant="outline" className="h-9 gap-1.5">
                <CreditCard className="size-4" />
                Manage Card
              </Button>
            </div>
          </div>

          {/* Quotas Progress */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-border/40 pt-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Branches Quota:</span>
                <span className="font-semibold">2 of 2 Branches Active</span>
              </div>
              <Progress value={100} className="h-1.5" />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Students Quota:</span>
                <span className="font-semibold">310 of 500 Enrolled (62%)</span>
              </div>
              <Progress value={62} className="h-1.5" />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">WhatsApp Messages Quota:</span>
                <span className="font-semibold">4,120 of 10,000 Sent (41%)</span>
              </div>
              <Progress value={41} className="h-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PRD §59 5-Day Grace Period Guarantee Policy Banner */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg p-2 bg-amber-500/10 text-amber-600 shrink-0 mt-0.5">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Guaranteed 5-Day Non-Destructive Grace Period (PRD §59)
              </h3>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5 max-w-2xl">
                If your card payment or renewal fails, your library operations remain 100% active for 5 days. Student attendance, seat allocations, and check-ins are never interrupted during grace periods.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs shrink-0">
            Policy Protected
          </Badge>
        </CardContent>
      </Card>

      {/* Cloud Infrastructure Service Health */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="size-4 text-emerald-600" />
            Live Platform Cloud Infrastructure
          </CardTitle>
          <CardDescription>
            Real-time latency and uptime metrics monitored across global edge nodes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs">Service Component</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs">Latency</TableHead>
                  <TableHead className="text-xs">30-Day Uptime</TableHead>
                  <TableHead className="text-right text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((serv, index) => (
                  <TableRow key={index} className="hover:bg-muted/30">
                    <TableCell className="font-semibold text-xs">
                      {serv.name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {serv.description}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {serv.latency}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium text-emerald-600">
                      {serv.uptime}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px]">
                        <CheckCircle2 className="mr-1 size-3" />
                        {serv.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Billing History Table */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold">SaaS Tax Invoices &amp; Receipts</CardTitle>
          <CardDescription>
            Official GST tax invoices issued for your monthly library management system subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs">Invoice #</TableHead>
                  <TableHead className="text-xs">Billing Date</TableHead>
                  <TableHead className="text-xs">Plan Description</TableHead>
                  <TableHead className="text-xs">Amount Paid</TableHead>
                  <TableHead className="text-xs">Payment Method</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingInvoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs font-semibold">
                      {inv.id}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {inv.date}
                    </TableCell>
                    <TableCell className="text-xs">
                      {inv.plan}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-primary">
                      {inv.amount}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {inv.paymentMethod}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px]">
                        <CheckCircle2 className="mr-1 size-3" />
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                        <Download className="size-3" />
                        PDF Invoice
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

