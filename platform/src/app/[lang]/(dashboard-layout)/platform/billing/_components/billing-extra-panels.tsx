"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Building2,
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  IndianRupee,
  Info,
  LayoutGrid,
  Percent,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Shield,
  Sliders,
  TableProperties,
} from "lucide-react"

import type { PlatformLibraryRecord } from "@/data/platform/platform-data"

import { initialAllLibrariesList } from "@/data/platform/platform-data"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
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
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { LibraryAvatar, LibraryLogo } from "@/components/platform/library-logo"
import {
  BillingKpiCard,
  BillingPagination,
  downloadTextFile,
  formatINR,
  toLogoStatus,
} from "./billing-shell"

const PAGE_SIZE = 5

const PLAN_FEE_MAP: Record<string, number> = {
  "Starter Tier": 19990,
  "Growth Tier": 34990,
  "Pro Tier": 49990,
  "Enterprise Tier": 99990,
}

function getPlanStatusBadgeClass(status: PlatformLibraryRecord["planStatus"]) {
  switch (status) {
    case "Active":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
    case "Trial":
      return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25"
    case "Grace":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25"
    default:
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25"
  }
}

export function BillingSubscriptionsPanel({ lang }: { lang: string }) {
  const [libraries, setLibraries] = useState<PlatformLibraryRecord[]>(
    initialAllLibrariesList
  )
  const [searchTerm, setSearchTerm] = useState("")
  const [planFilter, setPlanFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [currentPage, setCurrentPage] = useState(1)

  const [editingLib, setEditingLib] = useState<PlatformLibraryRecord | null>(
    null
  )
  const [editPlan, setEditPlan] = useState("Growth Tier")
  const [editStatus, setEditStatus] =
    useState<PlatformLibraryRecord["planStatus"]>("Active")

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return libraries.filter((lib) => {
      if (planFilter !== "All" && lib.planName !== planFilter) return false
      if (statusFilter !== "All" && lib.planStatus !== statusFilter)
        return false
      if (!q) return true
      return (
        lib.name.toLowerCase().includes(q) ||
        lib.code.toLowerCase().includes(q) ||
        lib.city.toLowerCase().includes(q)
      )
    })
  }, [libraries, searchTerm, planFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const safe = Math.min(currentPage, totalPages)
    const start = (safe - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage, totalPages])

  const kpis = useMemo(() => {
    const activeCount = libraries.filter(
      (l) => l.planStatus === "Active"
    ).length
    const graceOrLocked = libraries.filter(
      (l) => l.planStatus === "Grace" || l.planStatus === "Locked"
    ).length
    const totalArr = libraries.reduce((sum, l) => sum + l.planFee, 0)
    return {
      total: libraries.length,
      activeCount,
      graceOrLocked,
      totalArr,
    }
  }, [libraries])

  const openManage = (lib: PlatformLibraryRecord) => {
    setEditingLib(lib)
    setEditPlan(lib.planName)
    setEditStatus(lib.planStatus)
  }

  const handleSaveSubscription = () => {
    if (!editingLib) return
    const nextFee = PLAN_FEE_MAP[editPlan] ?? editingLib.planFee
    setLibraries((prev) =>
      prev.map((l) =>
        l.id === editingLib.id
          ? {
              ...l,
              planName: editPlan,
              planStatus: editStatus,
              planFee: nextFee,
            }
          : l
      )
    )
    toast.success("Subscription Updated", {
      description: `${editingLib.name} moved to ${editPlan} (${editStatus}).`,
    })
    setEditingLib(null)
  }

  const handleExportCsv = () => {
    const header = "Code,Library,City,Plan,Status,Annual Fee"
    const rows = filtered.map(
      (l) =>
        `"${l.code}","${l.name}","${l.city}","${l.planName}","${l.planStatus}",${l.planFee}`
    )
    downloadTextFile(
      "platform-subscriptions.csv",
      [header, ...rows].join("\n"),
      "text/csv"
    )
    toast.success("Exported subscriptions CSV")
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BillingKpiCard
          label="Total Subscriptions"
          value={kpis.total}
          subtext="Provisioned tenant plans"
          accent="primary"
          icon={Building2}
        />
        <BillingKpiCard
          label="Active Standing"
          value={kpis.activeCount}
          subtext="Auto-renew or paid up"
          accent="emerald"
          icon={CheckCircle2}
        />
        <BillingKpiCard
          label="Grace & Locked"
          value={kpis.graceOrLocked}
          subtext="Requires billing follow-up"
          accent="amber"
          icon={Clock}
        />
        <BillingKpiCard
          label="Contracted ARR"
          value={formatINR(kpis.totalArr)}
          subtext="Annualized subscription value"
          accent="blue"
          icon={IndianRupee}
        />
      </div>

      <Card className="border-border/80 bg-card rounded-xl overflow-hidden">
        <CardHeader className="p-4 border-b border-border/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search library, code, city..."
                className="pl-8 h-9 text-xs"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <Select
              value={planFilter}
              onValueChange={(v) => {
                setPlanFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Tiers</SelectItem>
                <SelectItem value="Starter Tier">Starter Tier</SelectItem>
                <SelectItem value="Growth Tier">Growth Tier</SelectItem>
                <SelectItem value="Pro Tier">Pro Tier</SelectItem>
                <SelectItem value="Enterprise Tier">Enterprise Tier</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Trial">Trial</SelectItem>
                <SelectItem value="Grace">Grace</SelectItem>
                <SelectItem value="Locked">Locked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-border/70 p-0.5 bg-muted/30">
              <Button
                type="button"
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setViewMode("table")}
              >
                <TableProperties className="size-3.5 mr-1" />
                Table
              </Button>
              <Button
                type="button"
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="size-3.5 mr-1" />
                Grid
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={handleExportCsv}
            >
              <Download className="size-3.5 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {viewMode === "table" ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-xs font-semibold">
                      Library
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Plan
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Annual Fee
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Expiry
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((lib) => (
                    <TableRow key={lib.id}>
                      <TableCell>
                        <LibraryLogo
                          name={lib.name}
                          code={lib.code}
                          src={lib.logoUrl || lib.logo}
                          status={toLogoStatus(lib.planStatus)}
                          subtitle={lib.city}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {lib.planName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getPlanStatusBadgeClass(lib.planStatus)}
                        >
                          {lib.planStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold tabular-nums">
                        {formatINR(lib.planFee)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {lib.planEndDate}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2.5"
                            onClick={() => openManage(lib)}
                          >
                            <Settings2 className="size-3 mr-1" />
                            Plan
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-7 text-xs px-2"
                          >
                            <Link
                              href={`/${lang}/platform/libraries/${lib.id}`}
                            >
                              <ExternalLink className="size-3" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-xs text-muted-foreground"
                      >
                        No subscriptions match your filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {paginated.map((lib) => (
                <Card
                  key={lib.id}
                  className="border-border/80 bg-background/60 p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <LibraryLogo
                      name={lib.name}
                      code={lib.code}
                      src={lib.logoUrl || lib.logo}
                      status={toLogoStatus(lib.planStatus)}
                      subtitle={lib.city}
                      size="sm"
                    />
                    <Badge
                      variant="outline"
                      className={getPlanStatusBadgeClass(lib.planStatus)}
                    >
                      {lib.planStatus}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
                    <div>
                      <p className="text-muted-foreground">Plan Tier</p>
                      <p className="font-semibold">{lib.planName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Annual Fee</p>
                      <p className="font-bold tabular-nums">
                        {formatINR(lib.planFee)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      Expires {lib.planEndDate}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => openManage(lib)}
                    >
                      Manage
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <BillingPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      <Dialog
        open={!!editingLib}
        onOpenChange={(open) => !open && setEditingLib(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-4 text-primary" />
              Manage Subscription — {editingLib?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Plan Tier</Label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter Tier">
                    Starter Tier (₹19,990/yr)
                  </SelectItem>
                  <SelectItem value="Growth Tier">
                    Growth Tier (₹34,990/yr)
                  </SelectItem>
                  <SelectItem value="Pro Tier">
                    Pro Tier (₹49,990/yr)
                  </SelectItem>
                  <SelectItem value="Enterprise Tier">
                    Enterprise Tier (₹99,990/yr)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account Status</Label>
              <Select
                value={editStatus}
                onValueChange={(v) =>
                  setEditStatus(v as PlatformLibraryRecord["planStatus"])
                }
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Trial">Trial</SelectItem>
                  <SelectItem value="Grace">Grace</SelectItem>
                  <SelectItem value="Locked">Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingLib(null)}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSaveSubscription}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface RefundRecord {
  id: string
  paymentId: string
  libraryName: string
  amount: number
  requestedAt: string
  reason: string
  status: "pending_approval" | "processed" | "rejected"
  originalMethod: string
  resolutionNote?: string
}

const INITIAL_REFUNDS: RefundRecord[] = [
  {
    id: "REF-2026-009",
    paymentId: "PAY-9042",
    libraryName: "Apex Study Hub",
    amount: 4999,
    requestedAt: "2026-11-04 14:20",
    reason: "Double charged due to gateway timeout during checkout",
    status: "pending_approval",
    originalMethod: "UPI (Google Pay)",
  },
  {
    id: "REF-2026-008",
    paymentId: "PAY-8821",
    libraryName: "Metro Library Network",
    amount: 1999,
    requestedAt: "2026-10-29 11:05",
    reason: "Plan downgrade credit adjustment within 7-day window",
    status: "processed",
    originalMethod: "Corporate Visa **** 4421",
    resolutionNote: "Processed via Razorpay instant refund",
  },
  {
    id: "REF-2026-007",
    paymentId: "PAY-8614",
    libraryName: "Scholars Point Library",
    amount: 3499,
    requestedAt: "2026-10-21 16:40",
    reason: "Duplicate annual renewal charge",
    status: "pending_approval",
    originalMethod: "NEFT / NetBanking",
  },
]

export function BillingRefundsPanel() {
  const [refunds, setRefunds] = useState<RefundRecord[]>(INITIAL_REFUNDS)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [inspectItem, setInspectItem] = useState<RefundRecord | null>(null)
  const [isNewOpen, setIsNewOpen] = useState(false)

  const [newLib, setNewLib] = useState(
    initialAllLibrariesList[0]?.name || "Apex Study Hub"
  )
  const [newPayId, setNewPayId] = useState("PAY-9100")
  const [newAmount, setNewAmount] = useState("4999")
  const [newMethod, setNewMethod] = useState("UPI")
  const [newReason, setNewReason] = useState("")

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return refunds.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false
      if (!q) return true
      return (
        r.libraryName.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.paymentId.toLowerCase().includes(q)
      )
    })
  }, [refunds, searchTerm, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const safe = Math.min(currentPage, totalPages)
    const start = (safe - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage, totalPages])

  const kpis = useMemo(() => {
    const pending = refunds.filter((r) => r.status === "pending_approval")
    const processed = refunds.filter((r) => r.status === "processed")
    return {
      total: refunds.length,
      pendingCount: pending.length,
      pendingValue: pending.reduce((s, r) => s + r.amount, 0),
      processedValue: processed.reduce((s, r) => s + r.amount, 0),
    }
  }, [refunds])

  const handleDecision = (id: string, nextStatus: "processed" | "rejected") => {
    setRefunds((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: nextStatus,
              resolutionNote:
                nextStatus === "processed"
                  ? "Approved & settled by Platform Finance"
                  : "Declined after gateway verification",
            }
          : r
      )
    )
    toast.success(
      nextStatus === "processed" ? "Refund Approved" : "Refund Rejected"
    )
    setInspectItem(null)
  }

  const handleCreateRefund = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = Number(newAmount)
    if (!newPayId.trim() || !amt || amt <= 0 || !newReason.trim()) {
      toast.error("Fill in Payment ID, valid Amount, and Reason.")
      return
    }
    const created: RefundRecord = {
      id: `REF-2026-0${refunds.length + 10}`,
      paymentId: newPayId.trim().toUpperCase(),
      libraryName: newLib,
      amount: amt,
      requestedAt: "Just now",
      reason: newReason.trim(),
      status: "pending_approval",
      originalMethod: newMethod,
    }
    setRefunds((prev) => [created, ...prev])
    setCurrentPage(1)
    setIsNewOpen(false)
    setNewReason("")
    toast.success("Refund Request Created", {
      description: `${created.id} queued for approval.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BillingKpiCard
          label="Total Refund Cases"
          value={kpis.total}
          subtext="All-time reversal requests"
          accent="primary"
          icon={RotateCcw}
        />
        <BillingKpiCard
          label="Pending Approval"
          value={kpis.pendingCount}
          subtext={formatINR(kpis.pendingValue) + " awaiting review"}
          accent="amber"
          icon={Clock}
        />
        <BillingKpiCard
          label="Settled Refunds"
          value={formatINR(kpis.processedValue)}
          subtext="Credited back to source"
          accent="emerald"
          icon={CheckCircle2}
        />
        <BillingKpiCard
          label="Refund Rate"
          value="0.8%"
          subtext="Within healthy SaaS SLA"
          accent="blue"
          icon={Percent}
        />
      </div>

      <Card className="border-border/80 bg-card rounded-xl overflow-hidden">
        <CardHeader className="p-4 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search refund ID, library, payment..."
                className="pl-8 h-9 text-xs"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
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
              <SelectTrigger className="w-full sm:w-44 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_approval">
                  Pending Approval
                </SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => setIsNewOpen(true)}
          >
            <Plus className="size-3.5" />
            New Refund Request
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-xs font-semibold">
                    Refund ID
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Library
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
                  <TableHead className="text-xs font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs font-mono font-semibold">
                      {item.id}
                      <span className="block text-[11px] font-sans text-muted-foreground">
                        {item.paymentId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <LibraryAvatar name={item.libraryName} size="sm" />
                        <div>
                          <p className="text-xs font-semibold">
                            {item.libraryName}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.requestedAt}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold tabular-nums">
                      {formatINR(item.amount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.originalMethod}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          item.status === "processed"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                            : item.status === "pending_approval"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25"
                        }
                      >
                        {item.status === "pending_approval"
                          ? "Pending"
                          : item.status === "processed"
                            ? "Processed"
                            : "Rejected"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2.5"
                        onClick={() => setInspectItem(item)}
                      >
                        <Eye className="size-3 mr-1" />
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <BillingPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      <Dialog
        open={!!inspectItem}
        onOpenChange={(open) => !open && setInspectItem(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              Refund Case {inspectItem?.id}
            </DialogTitle>
          </DialogHeader>
          {inspectItem && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/70 space-y-1">
                <p className="font-semibold text-sm">
                  {inspectItem.libraryName}
                </p>
                <p className="text-muted-foreground">
                  Payment {inspectItem.paymentId} • {inspectItem.originalMethod}
                </p>
                <p className="text-base font-bold pt-1 tabular-nums">
                  {formatINR(inspectItem.amount)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Reason</p>
                <p className="p-2.5 rounded-lg border border-border/70 bg-background">
                  {inspectItem.reason}
                </p>
              </div>
              {inspectItem.resolutionNote && (
                <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Note: {inspectItem.resolutionNote}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            {inspectItem?.status === "pending_approval" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDecision(inspectItem.id, "rejected")}
                >
                  Reject
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleDecision(inspectItem.id, "processed")}
                >
                  Approve & Credit
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInspectItem(null)}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">New Refund Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRefund} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Library</Label>
              <Select value={newLib} onValueChange={setNewLib}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {initialAllLibrariesList.map((l) => (
                    <SelectItem key={l.id} value={l.name}>
                      {l.name} ({l.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Payment ID</Label>
                <Input
                  className="h-9 text-xs"
                  value={newPayId}
                  onChange={(e) => setNewPayId(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Amount (INR)</Label>
                <Input
                  type="number"
                  className="h-9 text-xs"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Original Method</Label>
              <Input
                className="h-9 text-xs"
                value={newMethod}
                onChange={(e) => setNewMethod(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reason</Label>
              <Textarea
                rows={3}
                className="text-xs"
                placeholder="Explain why this refund is requested..."
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface CommissionConfig {
  enabled: boolean
  partnerRate: string
  cookieDays: string
  minPayout: string
  payoutSchedule: string
  tdsEnabled: boolean
}

const DEFAULT_COMMISSION_CONFIG: CommissionConfig = {
  enabled: false,
  partnerRate: "10",
  cookieDays: "60",
  minPayout: "2000",
  payoutSchedule: "monthly_10",
  tdsEnabled: true,
}

export function BillingCommissionPanel() {
  const [savedConfig, setSavedConfig] = useState<CommissionConfig>(
    DEFAULT_COMMISSION_CONFIG
  )
  const [config, setConfig] = useState<CommissionConfig>(
    DEFAULT_COMMISSION_CONFIG
  )
  const [samplePlanAmount, setSamplePlanAmount] = useState("4999")

  const preview = useMemo(() => {
    const gross = Math.max(0, Number(samplePlanAmount) || 0)
    const rate = config.enabled
      ? Math.max(0, Number(config.partnerRate) || 0)
      : 0
    const partnerGross = Math.round((gross * rate) / 100)
    const tds =
      config.enabled && config.tdsEnabled ? Math.round(partnerGross * 0.05) : 0
    const partnerNet = partnerGross - tds
    const platformRetained = gross - partnerGross

    return { gross, partnerGross, tds, partnerNet, platformRetained }
  }, [samplePlanAmount, config])

  const handleSave = () => {
    setSavedConfig(config)
    toast.success("Commission rules saved")
  }

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BillingKpiCard
          label="Program Status"
          value={config.enabled ? "Active" : "Standby"}
          subtext={
            config.enabled
              ? "Partner referrals earning"
              : "Enable to activate payouts"
          }
          accent={config.enabled ? "emerald" : "amber"}
          icon={Shield}
        />
        <BillingKpiCard
          label="Partner Share"
          value={`${config.partnerRate}%`}
          subtext="First-year subscription share"
          accent="primary"
          icon={Percent}
        />
        <BillingKpiCard
          label="Payout Threshold"
          value={formatINR(Number(config.minPayout) || 0)}
          subtext="Minimum settlement balance"
          accent="blue"
          icon={IndianRupee}
        />
        <BillingKpiCard
          label="Attribution Window"
          value={`${config.cookieDays} Days`}
          subtext="Referral cookie lifetime"
          accent="emerald"
          icon={Calendar}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/80 bg-card rounded-xl">
          <CardHeader className="p-4 border-b border-border/70 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sliders className="size-4 text-primary" />
              Referral & Reseller Commission Rules
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="comm-enabled" className="text-xs font-medium">
                Enable Program
              </Label>
              <Switch
                id="comm-enabled"
                checked={config.enabled}
                onCheckedChange={(v) =>
                  setConfig((prev) => ({ ...prev, enabled: v }))
                }
              />
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Partner Commission Rate (%)</Label>
                <Input
                  type="number"
                  className="h-9 text-xs"
                  value={config.partnerRate}
                  onChange={(e) =>
                    setConfig((p) => ({ ...p, partnerRate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Attribution Cookie Window (Days)
                </Label>
                <Input
                  type="number"
                  className="h-9 text-xs"
                  value={config.cookieDays}
                  onChange={(e) =>
                    setConfig((p) => ({ ...p, cookieDays: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Minimum Payout Balance (INR)</Label>
                <Input
                  type="number"
                  className="h-9 text-xs"
                  value={config.minPayout}
                  onChange={(e) =>
                    setConfig((p) => ({ ...p, minPayout: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Settlement Schedule</Label>
                <Select
                  value={config.payoutSchedule}
                  onValueChange={(v) =>
                    setConfig((p) => ({ ...p, payoutSchedule: v }))
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly_10">
                      Monthly (10th of month)
                    </SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="manual">Manual Approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/70">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold">
                  Auto-deduct 5% TDS (Sec 194H)
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Applies statutory TDS withholding on partner settlements
                </p>
              </div>
              <Switch
                checked={config.tdsEnabled}
                onCheckedChange={(v) =>
                  setConfig((p) => ({ ...p, tdsEnabled: v }))
                }
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Info className="size-3.5" />
                {isDirty ? "Unsaved changes" : "All rules saved"}
              </span>
              <Button type="button" size="sm" onClick={handleSave}>
                Save Commission Rules
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card rounded-xl">
          <CardHeader className="p-4 border-b border-border/70">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calculator className="size-4 text-primary" />
              Split Simulator
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Sample Subscription Amount (INR)
              </Label>
              <Input
                type="number"
                className="h-9 text-xs"
                value={samplePlanAmount}
                onChange={(e) => setSamplePlanAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2 text-xs pt-2 border-t border-border/60">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Invoice</span>
                <span className="font-semibold tabular-nums">
                  {formatINR(preview.gross)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Partner Gross ({config.enabled ? config.partnerRate : 0}%)
                </span>
                <span className="font-semibold tabular-nums">
                  {formatINR(preview.partnerGross)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TDS Withheld (5%)</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold tabular-nums">
                  -{formatINR(preview.tds)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border/60">
                <span className="font-semibold">Partner Net Payout</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatINR(preview.partnerNet)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Platform Retained</span>
                <span className="font-bold tabular-nums">
                  {formatINR(preview.platformRetained)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
