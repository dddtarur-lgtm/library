"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Mail,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"
import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function MyLibrarySubscriptionPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  // Billing interval: 'monthly' | 'annual'
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly")

  const handleRenewNow = () => {
    toast.success("Redirecting to Razorpay Secure Checkout for ₹2,999...", {
      description: "Auto-renew mandate will extend your Pro Study Campus plan by 30 days.",
    })
  }

  const handleDownloadInvoice = (invoiceNo: string) => {
    toast.success(`Downloading Tax Invoice ${invoiceNo} (PDF)...`, {
      description: "GST input tax credit details included.",
    })
  }

  const handleDownloadAllInvoices = () => {
    toast.success("Downloading zip archive of all financial year invoices...", {
      description: "Includes FY 2026-27 statement & GST summary.",
    })
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 space-y-5 p-4 sm:p-6">
      {/* 1. Header (Matching Screenshot 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="space-y-1">
          <Badge
            variant="outline"
            className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5"
          >
            Library Plan &amp; Billing
          </Badge>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            My Library Subscription
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage your software subscription, student quotas, branch allowances, and tax invoices.
          </p>
        </div>

        {/* Action Button: Renew Now */}
        <Button
          size="sm"
          onClick={handleRenewNow}
          className="h-9 px-4 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md shadow-xs cursor-pointer shrink-0"
        >
          <Zap className="size-3.5 fill-white" />
          <span>Renew Now (₹2,999)</span>
        </Button>
      </div>

      {/* 2. Top Split: Active Plan Card + Capacity & Quota Limits Card (Matching Screenshot 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* LEFT: Active Plan Card (5 cols) */}
        <Card className="lg:col-span-5 border border-border bg-card rounded-lg shadow-xs flex flex-col justify-between p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[11px] text-emerald-500 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              Active Plan
            </span>
            <span className="text-muted-foreground font-medium text-[11px]">
              Renews on 20 Nov 2026
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Pro Study Campus
            </div>
            <div className="text-xs text-muted-foreground">
              ₹2,999 / month • Billed monthly
            </div>
          </div>

          {/* Circular 22 Days Left Gauge (Matching Screenshot 4) */}
          <div className="py-2 flex items-center justify-center">
            <div className="relative size-32 flex items-center justify-center">
              <svg className="size-32 -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/30"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={326.7}
                  strokeDashoffset={326.7 * (1 - 22 / 30)}
                  className="text-emerald-500 transition-all duration-700"
                  fill="transparent"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-foreground font-mono leading-none">
                  22
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                  Days Left
                </span>
              </div>
            </div>
          </div>

          {/* Auto-renewal Status Strip */}
          <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Auto-renewal:</span>
            <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
              <CheckCircle2 className="size-3.5" />
              <span>Enabled (Razorpay Mandate)</span>
            </span>
          </div>
        </Card>

        {/* RIGHT: Plan Usage & Capacity Limits Card (7 cols) (Matching Screenshot 4) */}
        <Card className="lg:col-span-7 border border-border bg-card rounded-lg shadow-xs flex flex-col justify-between p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-border">
            <div className="font-bold text-sm text-foreground">
              Plan Usage &amp; Capacity Limits
            </div>
            <span className="text-[11px] text-muted-foreground">
              All numbers follow central library records
            </span>
          </div>

          <div className="space-y-4 text-xs flex-1">
            {/* Progress 1: Enrolled Students */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Users className="size-3.5 text-primary" />
                  <span>Enrolled Students</span>
                </div>
                <span className="font-mono font-bold text-foreground">
                  295 / 500 (59%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: "59%" }}
                />
              </div>
              <div className="text-[11px] text-muted-foreground">
                205 student seats available on your current plan
              </div>
            </div>

            {/* Progress 2: Branches / Campuses */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Building2 className="size-3.5 text-blue-500" />
                  <span>Branches / Campuses</span>
                </div>
                <span className="font-mono font-bold text-foreground">
                  2 / 3 (Kothrud HQ, FC Road)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: "66.6%" }}
                />
              </div>
              <div className="text-[11px] text-muted-foreground">
                You can open 1 more branch under this subscription
              </div>
            </div>

            {/* Progress 3: Staff & Manager Logins */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                  <span>Staff &amp; Manager Logins</span>
                </div>
                <span className="font-mono font-bold text-foreground">
                  4 / 10 (40%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: "40%" }}
                />
              </div>
            </div>

            {/* Progress 4: Daily Emails Sent Today */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Mail className="size-3.5 text-purple-500" />
                  <span>Daily Emails Sent Today</span>
                </div>
                <span className="font-mono font-bold text-foreground">
                  42 / 500 (8.4%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all"
                  style={{ width: "8.4%" }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">
              Need more student capacity or custom white-label app?
            </span>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("compare-plans")
                el?.scrollIntoView({ behavior: "smooth" })
              }}
              className="text-primary font-bold hover:underline cursor-pointer"
            >
              Explore Multi-City Plan &rarr;
            </button>
          </div>
        </Card>
      </div>

      {/* 3. Compare Library Plans Section (Matching Screenshot 4 & 5) */}
      <div id="compare-plans" className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Compare Library Plans
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upgrade or downgrade anytime. Pro-rata adjustments are automatically calculated.
            </p>
          </div>

          {/* Billing Switcher Toggle: Monthly | Annual Save 17% */}
          <div className="flex items-center p-0.5 rounded-md bg-muted border border-border text-xs shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBillingInterval("monthly")}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-all",
                billingInterval === "monthly"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval("annual")}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-all",
                billingInterval === "annual"
                  ? "bg-card text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] font-bold text-emerald-500">Save 17%</span>
            </button>
          </div>
        </div>

        {/* 3 Tier Pricing Cards (Matching Screenshot 4 & 5) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch pt-1">
          {/* TIER 1: Starter Hub */}
          <Card className="border border-border bg-card rounded-lg shadow-xs flex flex-col justify-between p-5 space-y-5">
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Starter Hub</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-foreground font-mono">
                    {billingInterval === "monthly" ? "₹1,499" : "₹1,249"}
                  </span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-border text-xs">
                {[
                  "Up to 100 active students",
                  "1 branch location",
                  "2 staff accounts",
                  "QR code gate attendance",
                  "Basic fee collection",
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="size-4 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Starter Hub downgrade request submitted.")}
              className="w-full h-9 text-xs border-border rounded-md hover:bg-muted cursor-pointer font-semibold"
            >
              Downgrade to Starter
            </Button>
          </Card>

          {/* TIER 2: Pro Study Campus (CURRENT ACTIVE PLAN) */}
          <Card className="border-2 border-emerald-500/80 bg-card rounded-lg shadow-md flex flex-col justify-between p-5 space-y-5 relative">
            {/* Current Active Plan Badge on Top */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white shadow-xs">
                Current Active Plan
              </span>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <h3 className="text-base font-bold text-foreground">Pro Study Campus</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-foreground font-mono">
                    {billingInterval === "monthly" ? "₹2,999" : "₹2,499"}
                  </span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-border text-xs">
                {[
                  "Up to 500 active students",
                  "Up to 3 branch locations",
                  "Up to 10 team / staff accounts",
                  "Real-time seat floor map & lockers",
                  "WhatsApp & SMS alerts + Email",
                  "Razorpay direct payment gateway",
                  "Advanced audit reports & day book",
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="size-4 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleRenewNow}
              className="w-full h-9 text-xs bg-foreground text-background hover:bg-foreground/90 font-bold rounded-md cursor-pointer shadow-xs"
            >
              Renew Subscription
            </Button>
          </Card>

          {/* TIER 3: Multi-City Network */}
          <Card className="border border-border bg-card rounded-lg shadow-xs flex flex-col justify-between p-5 space-y-5">
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Multi-City Network</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-foreground font-mono">
                    {billingInterval === "monthly" ? "₹5,999" : "₹4,999"}
                  </span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-border text-xs">
                {[
                  "Unlimited active students",
                  "Unlimited branches",
                  "Unlimited staff & managers",
                  "Custom domain & branded mobile app",
                  "Dedicated account manager",
                  "Custom automated backups & webhooks",
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="size-4 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => toast.success("Upgraded to Multi-City Enterprise plan!")}
              className="w-full h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md shadow-xs cursor-pointer"
            >
              Upgrade to Enterprise
            </Button>
          </Card>
        </div>
      </div>

      {/* 4. Tax Invoices & Payment Receipts (Matching Screenshot 5) */}
      <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <Receipt className="size-4 text-primary" />
              Tax Invoices &amp; Payment Receipts
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Official GST invoices for your library business accounting and tax filing.
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAllInvoices}
            className="h-8 text-xs gap-1.5 border-border rounded-md hover:bg-muted cursor-pointer shrink-0"
          >
            <Download className="size-3.5" />
            <span>Download All Invoices</span>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-xs font-bold text-muted-foreground uppercase py-3">
                  Invoice No
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase py-3">
                  Date
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase py-3">
                  Description
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase py-3">
                  Amount
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase py-3">
                  Status
                </TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase pr-4 py-3">
                  Invoice PDF
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  invoiceNo: "INV-2026-1002",
                  date: "01 Oct 2026",
                  desc: "Pro Study Campus Plan - Monthly Renewal",
                  gstin: "GSTIN: 27AABCA1234F1Z5",
                  amount: "₹2,999",
                  status: "Paid",
                },
                {
                  invoiceNo: "INV-2026-0901",
                  date: "01 Sep 2026",
                  desc: "Pro Study Campus Plan - Monthly Renewal",
                  gstin: "GSTIN: 27AABCA1234F1Z5",
                  amount: "₹2,999",
                  status: "Paid",
                },
                {
                  invoiceNo: "INV-2026-0801",
                  date: "01 Aug 2026",
                  desc: "Pro Study Campus Plan - Monthly Renewal",
                  gstin: "GSTIN: 27AABCA1234F1Z5",
                  amount: "₹2,999",
                  status: "Paid",
                },
              ].map((inv) => (
                <TableRow
                  key={inv.invoiceNo}
                  className="border-b border-border/80 hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-mono font-bold text-xs text-foreground py-3">
                    {inv.invoiceNo}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground py-3">
                    {inv.date}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="font-semibold text-xs text-foreground">{inv.desc}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{inv.gstin}</div>
                  </TableCell>
                  <TableCell className="font-mono font-bold text-xs text-foreground py-3">
                    {inv.amount}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      variant="outline"
                      className="text-[11px] font-semibold text-emerald-500 border-emerald-500/20 bg-emerald-500/10 gap-1"
                    >
                      <Check className="size-3" />
                      <span>{inv.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right pr-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadInvoice(inv.invoiceNo)}
                      className="h-7 text-xs gap-1 border-border rounded-md hover:bg-muted cursor-pointer"
                    >
                      <Download className="size-3" />
                      <span>Download PDF</span>
                    </Button>
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
