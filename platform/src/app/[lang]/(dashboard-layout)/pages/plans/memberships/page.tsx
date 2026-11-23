"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  Clock,
  CreditCard,
  Download,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react"

import { initialStudentMemberships, type StudentMembershipRecord } from "@/data/library-management-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

export default function StudentMembershipsPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [memberships, setMemberships] = useState<StudentMembershipRecord[]>(initialStudentMemberships)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  // Renewal Modal State
  const [renewModalOpen, setRenewModalOpen] = useState(false)
  const [selectedMembership, setSelectedMembership] = useState<StudentMembershipRecord | null>(null)
  const [renewMonths, setRenewMonths] = useState("1")
  const [paymentMode, setPaymentMode] = useState<"Cash" | "UPI" | "Razorpay">("UPI")

  const filtered = memberships.filter((m) => {
    if (statusFilter !== "All" && m.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = m.studentName.toLowerCase().includes(q)
      const matchCode = m.studentCode.toLowerCase().includes(q)
      const matchPlan = m.planName.toLowerCase().includes(q)
      if (!matchName && !matchCode && !matchPlan) return false
    }
    return true
  })

  const handleOpenRenew = (mem: StudentMembershipRecord) => {
    setSelectedMembership(mem)
    setRenewModalOpen(true)
  }

  const handleConfirmRenew = () => {
    if (!selectedMembership) return
    setMemberships(
      memberships.map((m) =>
        m.id === selectedMembership.id
          ? {
            ...m,
            status: "Active",
            daysLeft: m.daysLeft + Number(renewMonths) * 30,
            endDate: "15 Dec 2026",
          }
          : m
      )
    )
    setRenewModalOpen(false)
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden space-y-4 p-3 sm:p-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href={ensureLocalizedPathname("/pages/plans", lang)}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0",
          })}
        >
          <ChevronLeft className="size-4" />
          <span>Back to Plans Catalog</span>
        </Link>
        <span className="text-xs font-mono text-muted-foreground">
          Student Subscriptions & 5-Day Grace Tracker (PRD §4.1, §16 & §34)
        </span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Student Memberships & Subscriptions Ledger
          </h1>
          <p className="text-xs text-muted-foreground">
            Track active memberships, upcoming expirations (7, 3, 1 days), grace periods & instant manual renewals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border">
            <Download className="size-3.5" />
            <span>Export Active Ledger</span>
          </Button>
        </div>
      </div>

      {/* Grace Alert Banner (PRD §34) */}
      <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium">
          <ShieldAlert className="size-4 shrink-0" />
          <span>
            <strong>Grace Period Rule (PRD §34):</strong> Students are granted a <strong>5-day grace period</strong> after plan expiry. During grace, seat reservations are kept and daily notifications are dispatched.
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-border/60 bg-card">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search student code, name or plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-background"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="size-3.5 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-[150px] bg-background">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Expiring Soon">Expiring Soon (≤3 Days)</SelectItem>
              <SelectItem value="Grace Period">In Grace Period</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Memberships Table */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-bold">Student</TableHead>
                  <TableHead className="text-xs font-bold">Branch & Seat</TableHead>
                  <TableHead className="text-xs font-bold">Enrolled Plan</TableHead>
                  <TableHead className="text-xs font-bold">Validity Range</TableHead>
                  <TableHead className="text-xs font-bold">Days Left</TableHead>
                  <TableHead className="text-xs font-bold">Status</TableHead>
                  <TableHead className="text-xs font-bold">Paid Fee</TableHead>
                  <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id} className="text-xs">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img
                          src={m.avatar}
                          alt={m.studentName}
                          className="size-7 rounded-full object-cover border border-border"
                        />
                        <div>
                          <div className="font-semibold text-foreground">{m.studentName}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{m.studentCode}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-foreground">{m.seatNo}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{m.branch}</div>
                    </TableCell>

                    <TableCell className="font-medium text-foreground">
                      {m.planName}
                    </TableCell>

                    <TableCell className="font-mono text-muted-foreground text-[11px]">
                      {m.startDate} → {m.endDate}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`font-mono font-bold ${m.daysLeft <= 3 ? "text-amber-600" : m.daysLeft === 0 ? "text-destructive" : "text-foreground"
                          }`}
                      >
                        {m.daysLeft} Days
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          m.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
                            : m.status === "Expiring Soon"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]"
                              : m.status === "Grace Period"
                                ? "bg-red-500/10 text-red-600 border-red-500/20 text-[10px]"
                                : "bg-muted text-muted-foreground text-[10px]"
                        }
                      >
                        {m.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="font-mono font-bold">₹{m.amountPaid}</div>
                      <span className="text-[10px] text-muted-foreground">{m.paymentMode}</span>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleOpenRenew(m)}
                        className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
                      >
                        <RefreshCw className="size-3" />
                        <span>Renew</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Renew Student Plan */}
      <Dialog open={renewModalOpen} onOpenChange={setRenewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="size-5 text-primary" />
              Renew Plan for {selectedMembership?.studentName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Extend membership duration and record student fee collection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Plan:</span>
                <span className="font-semibold text-foreground">{selectedMembership?.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Expiry:</span>
                <span className="font-mono text-foreground">{selectedMembership?.endDate}</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Renewal Period</Label>
              <Select value={renewMonths} onValueChange={setRenewMonths}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Month (30 Days) - ₹1,800</SelectItem>
                  <SelectItem value="3">3 Months (90 Days) - ₹4,800</SelectItem>
                  <SelectItem value="6">6 Months (180 Days) - ₹9,000</SelectItem>
                  <SelectItem value="12">1 Year (365 Days) - ₹18,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Payment Method</Label>
              <Select value={paymentMode} onValueChange={(v: any) => setPaymentMode(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">UPI Desk QR / GPay</SelectItem>
                  <SelectItem value="Cash">Cash in Hand</SelectItem>
                  <SelectItem value="Razorpay">Razorpay Online Gateway</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRenewModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmRenew}
              className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirm Renewal & Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

