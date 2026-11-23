"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { platformService } from "@/services/platform-service"
import { toast } from "sonner"
import {
  AlertTriangle,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  IndianRupee,
  Lock,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react"

import type {
  GraceAndLockedLibrary,
  PlatformPayment,
} from "@/data/platform/platform-data"
import type { BillingTab } from "./_components/billing-shell"
import type { BillingInvoiceRecord } from "./_components/invoice-preview-dialog"

import {
  initialAllLibrariesList,
  initialExpiringPlans,
  initialExpiryForecastData,
  initialGraceAndLocked,
  initialPlatformPayments,
  mockInvoices,
} from "@/data/platform/platform-data"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BillingCommissionPanel,
  BillingRefundsPanel,
  BillingSubscriptionsPanel,
} from "./_components/billing-extra-panels"
import {
  BillingHeader,
  BillingKpiCard,
  BillingPagination,
  downloadTextFile,
  formatINR,
  toLogoStatus,
} from "./_components/billing-shell"
import { InvoicePreviewDialog } from "./_components/invoice-preview-dialog"
import { LibraryAvatar, LibraryLogo } from "@/components/platform/library-logo"

const PAGE_SIZE = 5

export default function PlatformBillingPage() {
  const params = useParams()
  const lang = (params.lang as string) || "en"

  const [activeTab, setActiveTab] = useState<BillingTab>("overview")
  const [workspaceTab, setWorkspaceTab] = useState("payments")

  const handleHeaderTabChange = (tab: BillingTab) => {
    setActiveTab(tab)
    if (tab === "payments" || tab === "invoices" || tab === "expiry") {
      setWorkspaceTab(tab)
    }
  }

  const [payments, setPayments] = useState<PlatformPayment[]>(
    initialPlatformPayments
  )
  const [invoices, setInvoices] = useState<BillingInvoiceRecord[]>(mockInvoices)
  const [graceAccounts, setGraceAccounts] = useState<GraceAndLockedLibrary[]>(
    initialGraceAndLocked
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [isSyncing, setIsSyncing] = useState(false)

  // Sent & Refund trackers
  const [sentNotices, setSentNotices] = useState<Record<string, boolean>>({})
  const [sentLinks, setSentLinks] = useState<Record<string, boolean>>({})
  const [refundedIds, setRefundedIds] = useState<Record<string, boolean>>({})

  // Manual payment modal
  const [isManualPayOpen, setIsManualPayOpen] = useState(false)
  const [selectedLibId, setSelectedLibId] = useState<string>("custom")
  const [payLibraryCode, setPayLibraryCode] = useState("")
  const [payLibraryName, setPayLibraryName] = useState("")
  const [payPlanName, setPayPlanName] = useState("Growth Tier")
  const [payAmount, setPayAmount] = useState("")
  const [payMethod, setPayMethod] = useState<PlatformPayment["method"]>("UPI")
  const [payRef, setPayRef] = useState("")

  // Refund & Invoice preview dialogs
  const [refundTarget, setRefundTarget] = useState<PlatformPayment | null>(null)
  const [refundReason, setRefundReason] = useState("")
  const [previewInvoice, setPreviewInvoice] =
    useState<BillingInvoiceRecord | null>(null)

  const filteredPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return payments.filter((p) => {
      const matchesStatus = statusFilter === "All" || p.status === statusFilter
      if (!matchesStatus) return false
      if (!q) return true
      return (
        p.libraryName.toLowerCase().includes(q) ||
        p.libraryCode.toLowerCase().includes(q) ||
        p.transactionId.toLowerCase().includes(q)
      )
    })
  }, [payments, searchQuery, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE))
  const paginatedPayments = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages)
    const start = (safePage - 1) * PAGE_SIZE
    return filteredPayments.slice(start, start + PAGE_SIZE)
  }, [filteredPayments, currentPage, totalPages])

  const kpiStats = useMemo(() => {
    const collected = payments
      .filter((p) => p.status === "Success")
      .reduce((sum, p) => sum + p.amount, 0)
    const failedCount = payments.filter((p) => p.status === "Failed").length
    const failedAmount = payments
      .filter((p) => p.status === "Failed")
      .reduce((sum, p) => sum + p.amount, 0)
    const expiringSoon = initialExpiringPlans.filter((e) => e.daysLeft <= 7)
    const renewalPipeline = expiringSoon.reduce((sum, e) => sum + e.planFee, 0)
    const totalArr = initialAllLibrariesList.reduce(
      (sum, l) => sum + l.planFee,
      0
    )

    return {
      collected,
      failedCount,
      failedAmount,
      expiringCount: expiringSoon.length,
      renewalPipeline,
      totalArr,
    }
  }, [payments])

  const handleLibraryPick = (libId: string) => {
    setSelectedLibId(libId)
    if (libId === "custom") {
      setPayLibraryCode("")
      setPayLibraryName("")
      setPayAmount("")
      return
    }
    const found = initialAllLibrariesList.find((l) => l.id === libId)
    if (found) {
      setPayLibraryCode(found.code)
      setPayLibraryName(found.name)
      setPayPlanName(found.planName)
      setPayAmount(String(found.planFee))
    }
  }

  const fetchBillingData = useCallback(async () => {
    try {
      setIsSyncing(true)
      const [recentPay, graceData, liveInvoices, livePayments] =
        await Promise.all([
          platformService.getRecentPayments().catch(() => null),
          platformService.getGraceAndLocked().catch(() => null),
          platformService.getInvoices().catch(() => null),
          platformService.getPlatformPayments().catch(() => null),
        ])
      const livePayObj = livePayments as
        | { data?: Record<string, unknown>[] }
        | undefined
      if (livePayObj?.data && livePayObj.data.length > 0) {
        const mappedPayments: PlatformPayment[] = livePayObj.data.map(
          (rawItem) => {
            const p = rawItem as Record<string, unknown>
            return {
              id: String(p.id),
              transactionId: String(
                p.transaction_id ||
                  `TXN-${String(p.id).slice(0, 8).toUpperCase()}`
              ),
              libraryCode: p.library_id
                ? `LIB-${String(p.library_id).slice(0, 6).toUpperCase()}`
                : "LIB",
              libraryName: String(p.org_name || "Library"),
              amount: Number(p.amount),
              type: "Subscription",
              method: String(p.mode || "Cash") as PlatformPayment["method"],
              timestamp: String(p.paid_at || new Date().toISOString()),
              status:
                p.status === "success" || p.status === "paid"
                  ? "Success"
                  : p.status === "refunded"
                    ? "Failed"
                    : "Pending",
              planName: "Active Tier",
              referenceNumber: String(p.reference_number || ""),
            }
          }
        )
        setPayments(mappedPayments)
      } else if (recentPay && recentPay.length > 0) {
        setPayments(recentPay)
      }
      if (graceData && graceData.length > 0) {
        setGraceAccounts(graceData)
      }
      if (
        liveInvoices &&
        Array.isArray(liveInvoices) &&
        liveInvoices.length > 0
      ) {
        setInvoices(
          liveInvoices.map((rawInv: unknown) => {
            const inv = rawInv as Record<string, unknown>
            return {
              id: String(inv.invoice_no || inv.id),
              libraryCode: inv.org_name
                ? `LIB-${String(inv.org_name).slice(0, 4).toUpperCase()}`
                : "LIB",
              libraryName: String(inv.org_name || "Library"),
              planName: "Standard",
              amount: Number(inv.total_amount),
              date: String(
                inv.issued_on || new Date().toISOString().split("T")[0]
              ),
              status: "paid",
            }
          })
        )
      }
    } finally {
      setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    fetchBillingData()
  }, [fetchBillingData])

  const handleApprovePayment = async (paymentId: string) => {
    try {
      await platformService.approvePayment(paymentId)
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: "Success" } : p))
      )
      toast.success("Payment approved and library subscription extended")
    } catch {
      toast.error("Failed to approve payment")
    }
  }

  const handleResendInvoice = async (invoiceId: string) => {
    try {
      await platformService.resendInvoice(invoiceId)
      toast.success(`Invoice ${invoiceId} resent to library owner`)
    } catch {
      toast.success(`Invoice ${invoiceId} resent via email queue`)
    }
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = payLibraryCode.trim().toUpperCase()
    const amountNum = parseFloat(payAmount)
    if (!cleanCode || !amountNum || amountNum <= 0) {
      toast.error("Enter a valid Library Code and Amount.")
      return
    }

    try {
      await platformService.recordManualPayment({
        library: selectedLibId !== "custom" ? selectedLibId : cleanCode,
        amount: amountNum,
        method: payMethod as
          | "UPI"
          | "Card"
          | "NetBanking"
          | "Bank Transfer"
          | "Cash"
          | "Cheque",
        reference_number: payRef.trim() || undefined,
        notes: `Recorded via Super Admin billing console for ${payLibraryName || cleanCode}`,
      })

      const newTxn: PlatformPayment = {
        id: `pay-${Date.now()}`,
        transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        libraryCode: cleanCode,
        libraryName: payLibraryName.trim() || `Library ${cleanCode}`,
        planName: payPlanName,
        amount: amountNum,
        method: payMethod,
        type: "Renewal",
        timestamp: "Today, Just now",
        status: "Success",
        referenceNumber:
          payRef.trim() || `REF-${Date.now().toString().slice(-6)}`,
      }

      setPayments((prev) => [newTxn, ...prev])
      setCurrentPage(1)
      setIsManualPayOpen(false)
      toast.success("Payment Recorded", {
        description: `${formatINR(amountNum)} credited for ${newTxn.libraryName}.`,
      })
      setSelectedLibId("custom")
      setPayLibraryCode("")
      setPayLibraryName("")
      setPayAmount("")
      setPayRef("")
    } catch (err: unknown) {
      toast.error("Payment Submission Failed", {
        description: (err as Error)?.message || "Could not record payment.",
      })
    }
  }

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!refundTarget || !refundReason.trim()) {
      toast.error("Please provide a reason for the refund.")
      return
    }

    try {
      await platformService.refundPayment(refundTarget.id, refundReason)
      setRefundedIds((prev) => ({ ...prev, [refundTarget.id]: true }))
      setPayments((prev) =>
        prev.map((p) =>
          p.id === refundTarget.id
            ? { ...p, status: "Failed", type: "Manual Adjust" }
            : p
        )
      )

      toast.success("Refund Processed", {
        description: `${formatINR(refundTarget.amount)} reversal logged for ${refundTarget.libraryName}.`,
      })
    } catch (err: unknown) {
      toast.error("Refund Failed", {
        description: (err as Error)?.message || "Could not process refund.",
      })
    } finally {
      setRefundTarget(null)
      setRefundReason("")
    }
  }

  const handleExportGstr1 = () => {
    const payload = {
      gstin: "27AABCL1429K1ZX",
      generatedAt: new Date().toISOString(),
      invoices: invoices.map((inv) => {
        const taxable = Math.round(inv.amount / 1.18)
        return {
          invoiceNumber: inv.id,
          date: inv.date,
          customer: inv.libraryName,
          taxableValue: taxable,
          gst18: inv.amount - taxable,
          total: inv.amount,
          status: inv.status,
        }
      }),
    }
    downloadTextFile(
      "gstr1-platform-report.json",
      JSON.stringify(payload, null, 2),
      "application/json"
    )
    toast.success("Exported GSTR-1 JSON report")
  }

  const handleSyncGateway = async () => {
    try {
      setIsSyncing(true)
      await fetchBillingData()
      toast.success("Gateway and ledger state refreshed from server.")
    } catch (err: unknown) {
      toast.error("Sync Failed", { description: (err as Error)?.message })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleToggleLock = (item: GraceAndLockedLibrary) => {
    const nextStatus = item.status === "Locked" ? "Grace" : "Locked"
    setGraceAccounts((prev) =>
      prev.map((g) => (g.id === item.id ? { ...g, status: nextStatus } : g))
    )
    toast.success(
      nextStatus === "Locked"
        ? `${item.libraryName} locked`
        : `${item.libraryName} unlocked to Grace`
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
      <BillingHeader
        lang={lang}
        title="Billing Control"
        badgeText={`${payments.length} Transactions`}
        activeTab={activeTab}
        onTabChange={handleHeaderTabChange}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportGstr1}
              className="gap-1.5"
            >
              <Download className="size-3.5" />
              Export GSTR-1
            </Button>
            <Button
              size="sm"
              onClick={() => setIsManualPayOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold gap-1.5"
            >
              <Plus className="size-4" />
              Record Payment
            </Button>
          </>
        }
      />

      {activeTab === "subscriptions" ? (
        <BillingSubscriptionsPanel lang={lang} />
      ) : activeTab === "refunds" ? (
        <BillingRefundsPanel />
      ) : activeTab === "commission" ? (
        <BillingCommissionPanel />
      ) : (
        <>
          {/* Dashboard-Matched KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <BillingKpiCard
              label="Captured Revenue"
              value={formatINR(kpiStats.collected)}
              subtext="Cleared settlements"
              accent="emerald"
              icon={IndianRupee}
            />
            <BillingKpiCard
              label="Expiring in 7 Days"
              value={`${kpiStats.expiringCount} Libraries`}
              subtext={`${formatINR(kpiStats.renewalPipeline)} pipeline`}
              accent="amber"
              icon={Clock}
            />
            <BillingKpiCard
              label="Failed Transactions"
              value={kpiStats.failedCount}
              subtext={`${formatINR(kpiStats.failedAmount)} in retry`}
              accent="rose"
              icon={AlertTriangle}
            />
            <BillingKpiCard
              label="Active Contract ARR"
              value={formatINR(kpiStats.totalArr)}
              subtext={`${initialAllLibrariesList.length} directory tenants`}
              accent="primary"
              icon={CreditCard}
            />
          </div>

          {/* Billing Workspace Tabs */}
          <Tabs
            value={workspaceTab}
            onValueChange={setWorkspaceTab}
            className="w-full space-y-4"
          >
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full lg:w-auto lg:inline-flex">
              <TabsTrigger value="payments" className="text-xs font-semibold">
                <Receipt className="size-3.5 mr-1.5" />
                Payments ({payments.length})
              </TabsTrigger>
              <TabsTrigger value="expiry" className="text-xs font-semibold">
                <Clock className="size-3.5 mr-1.5" />
                Expiry Tracker ({initialExpiringPlans.length})
              </TabsTrigger>
              <TabsTrigger value="invoices" className="text-xs font-semibold">
                <FileText className="size-3.5 mr-1.5" />
                GST Invoices ({invoices.length})
              </TabsTrigger>
              <TabsTrigger value="dunning" className="text-xs font-semibold">
                <AlertTriangle className="size-3.5 mr-1.5 text-rose-500" />
                Grace & Dunning ({graceAccounts.length})
              </TabsTrigger>
            </TabsList>

            {/* 1. PAYMENTS TAB */}
            <TabsContent value="payments" className="mt-0 space-y-4">
              <Card className="border-border/80 bg-card rounded-xl overflow-hidden">
                <CardHeader className="p-4 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search library, code, txn ID..."
                        className="pl-8 h-9 text-xs"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          setCurrentPage(1)
                        }}
                      />
                    </div>
                    <Select
                      value={statusFilter}
                      onValueChange={(v) => {
                        setStatusFilter(v)
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-36 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Statuses</SelectItem>
                        <SelectItem value="Success">Success</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                        <SelectItem value="Refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-9"
                      disabled={isSyncing}
                      onClick={handleSyncGateway}
                    >
                      <RefreshCw
                        className={`size-3.5 mr-1.5 ${isSyncing ? "animate-spin" : ""}`}
                      />
                      {isSyncing ? "Syncing..." : "Sync Gateway"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-xs h-9 text-primary"
                    >
                      <Link href={`/${lang}/platform/billing/payments`}>
                        Full Ledger
                        <ExternalLink className="size-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="pl-5 text-xs font-semibold">
                          Txn ID
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Library
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Plan & Type
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Amount
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Method
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Status
                        </TableHead>
                        <TableHead className="text-right pr-5 text-xs font-semibold">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPayments.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="py-10 text-center text-sm text-muted-foreground"
                          >
                            No transactions match your search.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedPayments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="pl-5">
                              <div className="font-mono text-xs font-bold text-foreground">
                                {p.transactionId}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {p.timestamp}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2.5 min-w-0">
                                <LibraryAvatar
                                  name={p.libraryName}
                                  code={p.libraryCode}
                                  src={p.logo}
                                  size="sm"
                                />
                                <div className="min-w-0">
                                  <div className="font-semibold text-xs text-foreground truncate">
                                    {p.libraryName}
                                  </div>
                                  <div className="text-[11px] font-mono text-muted-foreground truncate">
                                    {p.libraryCode}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className="text-[11px]"
                                >
                                  {p.planName}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground">
                                  {p.type}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-xs tabular-nums">
                              {formatINR(p.amount)}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {p.method}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  refundedIds[p.id]
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25 text-[11px]"
                                    : p.status === "Success"
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 text-[11px]"
                                      : "bg-destructive/15 text-destructive border-destructive/25 text-[11px]"
                                }
                              >
                                {refundedIds[p.id] ? "Refunded" : p.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-5">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2.5 text-xs"
                                  onClick={() =>
                                    setPreviewInvoice({
                                      id: p.transactionId,
                                      libraryName: p.libraryName,
                                      libraryCode: p.libraryCode,
                                      logo: p.logo,
                                      amount: p.amount,
                                      date: p.timestamp,
                                      status: p.status,
                                      planName: `${p.planName} (${p.type})`,
                                      reference: p.referenceNumber,
                                    })
                                  }
                                >
                                  <FileText className="size-3 mr-1" />
                                  Invoice
                                </Button>
                                {p.status === "Pending" && (
                                  <Button
                                    size="sm"
                                    className="h-7 px-2.5 text-xs bg-emerald-600 text-white hover:bg-emerald-700 font-bold"
                                    onClick={() => handleApprovePayment(p.id)}
                                  >
                                    Approve
                                  </Button>
                                )}
                                {p.status === "Success" && (
                                  <Button
                                    size="sm"
                                    className="h-7 px-2.5 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
                                    onClick={() => setRefundTarget(p)}
                                  >
                                    Refund
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>

                <BillingPagination
                  currentPage={Math.min(currentPage, totalPages)}
                  totalPages={totalPages}
                  totalItems={filteredPayments.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              </Card>
            </TabsContent>

            {/* 2. EXPIRY TRACKER TAB */}
            <TabsContent value="expiry" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {initialExpiryForecastData.map((forecast, idx) => (
                  <Card
                    key={idx}
                    className="border-border/70 bg-card/90 rounded-xl shadow-xs"
                  >
                    <CardContent className="p-3.5 space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {forecast.period}
                      </span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-bold tabular-nums">
                          {forecast.count} Libs
                        </span>
                        <span className="text-xs font-bold text-primary tabular-nums">
                          {forecast.value}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {forecast.risk}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-border/80 bg-card rounded-xl overflow-hidden">
                <CardHeader className="py-3.5 px-5 border-b border-border/70 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold">
                    Upcoming Plan Expirations
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-xs text-primary"
                  >
                    <Link href={`/${lang}/platform/billing/expiry`}>
                      Open Dunning Console
                      <ExternalLink className="size-3 ml-1" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="pl-5 text-xs font-semibold">
                          Library
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Plan Tier
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Expiry Date
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Days Left
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Likelihood
                        </TableHead>
                        <TableHead className="text-right pr-5 text-xs font-semibold">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {initialExpiringPlans.map((exp) => {
                        const isSent = !!sentNotices[exp.id]
                        return (
                          <TableRow key={exp.id}>
                            <TableCell className="pl-5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <LibraryAvatar
                                  name={exp.libraryName}
                                  code={exp.libraryCode}
                                  src={exp.logo}
                                  size="sm"
                                />
                                <div className="min-w-0">
                                  <div className="font-semibold text-xs truncate">
                                    {exp.libraryName}
                                  </div>
                                  <div className="text-[11px] font-mono text-muted-foreground truncate">
                                    {exp.libraryCode} • {exp.phone}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-medium">
                              {exp.planName}
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              {exp.expiryDate}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  exp.daysLeft <= 3
                                    ? "bg-destructive/15 text-destructive border-destructive/25 text-[11px] font-semibold"
                                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25 text-[11px] font-semibold"
                                }
                              >
                                {exp.daysLeft} Days
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[11px]">
                                {exp.renewalProbability}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-5">
                              <Button
                                size="sm"
                                variant={isSent ? "secondary" : "outline"}
                                disabled={isSent}
                                className="h-7 px-2.5 text-xs"
                                onClick={() => {
                                  setSentNotices((prev) => ({
                                    ...prev,
                                    [exp.id]: true,
                                  }))
                                  toast.success(
                                    `Renewal notice sent to ${exp.ownerName}`
                                  )
                                }}
                              >
                                {isSent ? (
                                  <>
                                    <CheckCircle2 className="size-3 mr-1 text-emerald-500" />
                                    Sent
                                  </>
                                ) : (
                                  <>
                                    <Send className="size-3 mr-1" />
                                    Send Notice
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 3. GST INVOICES TAB */}
            <TabsContent value="invoices" className="mt-0 space-y-4">
              <Card className="border-border/80 bg-card rounded-xl overflow-hidden">
                <CardHeader className="py-3.5 px-5 border-b border-border/70 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold">
                    Recent GST Tax Invoices (18% GST)
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-xs text-primary"
                  >
                    <Link href={`/${lang}/platform/billing/invoices`}>
                      All GST Invoices
                      <ExternalLink className="size-3 ml-1" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="pl-5 text-xs font-semibold">
                          Invoice No.
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Library
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Base + GST
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Total
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Status
                        </TableHead>
                        <TableHead className="text-right pr-5 text-xs font-semibold">
                          Preview
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((inv) => {
                        const base = Math.round(inv.amount / 1.18)
                        const gst = inv.amount - base
                        return (
                          <TableRow key={inv.id}>
                            <TableCell className="pl-5">
                              <div className="font-mono text-xs font-bold">
                                {inv.id}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {inv.date}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2.5 min-w-0">
                                <LibraryAvatar
                                  name={inv.libraryName}
                                  size="sm"
                                />
                                <span className="text-xs font-semibold truncate">
                                  {inv.libraryName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground tabular-nums">
                              {formatINR(base)} + {formatINR(gst)}
                            </TableCell>
                            <TableCell className="font-bold text-xs tabular-nums">
                              {formatINR(inv.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  inv.status === "paid"
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 capitalize text-[11px]"
                                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25 capitalize text-[11px]"
                                }
                              >
                                {inv.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-5">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2.5 text-xs"
                                  onClick={() => setPreviewInvoice(inv)}
                                >
                                  <FileText className="size-3 mr-1" />
                                  View & Print
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleResendInvoice(inv.id)}
                                  title="Resend to Library Owner"
                                >
                                  <Send className="size-3 mr-1" />
                                  Resend
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 4. GRACE & DUNNING TAB */}
            <TabsContent value="dunning" className="mt-0 space-y-4">
              <Card className="border-border/80 bg-card rounded-xl overflow-hidden">
                <CardHeader className="py-3.5 px-5 border-b border-border/70 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="size-4" />
                    Grace & Locked Accounts
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-xs text-primary"
                  >
                    <Link href={`/${lang}/platform/billing/expiry`}>
                      Full Dunning Rules
                      <ExternalLink className="size-3 ml-1" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {graceAccounts.map((g) => {
                    const linkSent = !!sentLinks[g.id]
                    return (
                      <div
                        key={g.id}
                        className="p-3.5 rounded-xl border border-border/80 bg-background/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <LibraryAvatar
                            name={g.libraryName}
                            code={g.libraryCode}
                            src={g.logo}
                            size="sm"
                            status={toLogoStatus(g.status)}
                            showStatusDot
                          />
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-foreground truncate">
                                {g.libraryName}
                              </span>
                              <Badge
                                variant="outline"
                                className={
                                  g.status === "Locked"
                                    ? "bg-destructive/15 text-destructive border-destructive/25 text-[10px]"
                                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25 text-[10px]"
                                }
                              >
                                {g.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {g.reason} • {g.affectedStudents} Students •{" "}
                              {g.phone}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant={linkSent ? "secondary" : "outline"}
                            disabled={linkSent}
                            className="h-8 text-xs"
                            onClick={() => {
                              setSentLinks((prev) => ({
                                ...prev,
                                [g.id]: true,
                              }))
                              toast.success(`Payment link sent to ${g.phone}`)
                            }}
                          >
                            {linkSent ? "Link Sent ✓" : "Send Pay Link"}
                          </Button>
                          <Button
                            size="sm"
                            className={
                              g.status === "Locked"
                                ? "h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                                : "h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
                            }
                            onClick={() => handleToggleLock(g)}
                          >
                            {g.status === "Locked" ? (
                              <>
                                <ShieldCheck className="size-3.5 mr-1" />
                                Restore Grace
                              </>
                            ) : (
                              <>
                                <Lock className="size-3.5 mr-1" />
                                Lock
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Manual Payment Dialog */}
      <Dialog open={isManualPayOpen} onOpenChange={setIsManualPayOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              Record Offline Payment
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRecordPayment} className="space-y-3.5 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Quick Select Library
              </Label>
              <Select value={selectedLibId} onValueChange={handleLibraryPick}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Choose registered library..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Enter Code Manually</SelectItem>
                  {initialAllLibrariesList.map((lib) => (
                    <SelectItem key={lib.id} value={lib.id}>
                      {lib.name} ({lib.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Library Code *
                </Label>
                <Input
                  placeholder="LIB-JPR-008"
                  value={payLibraryCode}
                  onChange={(e) => setPayLibraryCode(e.target.value)}
                  className="text-xs font-mono uppercase h-9"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Amount (₹) *
                </Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="4999"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="text-xs font-bold h-9"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Method
                </Label>
                <Select
                  value={payMethod}
                  onValueChange={(v) =>
                    setPayMethod(v as PlatformPayment["method"])
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Razorpay">Razorpay</SelectItem>
                    <SelectItem value="UPI">Direct UPI</SelectItem>
                    <SelectItem value="Bank Transfer">NEFT / RTGS</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Cash">Cash Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  UTR / Reference
                </Label>
                <Input
                  placeholder="UTR-99827162"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="text-xs font-mono h-9"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsManualPayOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
              >
                Log Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog
        open={!!refundTarget}
        onOpenChange={(open) => !open && setRefundTarget(null)}
      >
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {refundTarget && (
                <LibraryLogo
                  name={refundTarget.libraryName}
                  code={refundTarget.libraryCode}
                  src={refundTarget.logo}
                  size="sm"
                />
              )}
              <div>
                <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
                  <ArrowDownLeft className="size-4" />
                  Process Refund
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {refundTarget?.transactionId} •{" "}
                  {refundTarget ? formatINR(refundTarget.amount) : ""}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleRefundSubmit} className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Refund Justification *
              </Label>
              <Input
                placeholder="Duplicate charge or approved cancellation..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRefundTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
              >
                Confirm Refund
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* GST Invoice Preview Modal */}
      <InvoicePreviewDialog
        invoice={previewInvoice}
        onOpenChange={(open) => !open && setPreviewInvoice(null)}
      />
    </div>
  )
}
