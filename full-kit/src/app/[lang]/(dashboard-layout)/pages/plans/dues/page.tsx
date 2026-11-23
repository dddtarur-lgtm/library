"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  CircleDollarSign,
  Download,
  Filter,
  MessageSquare,
  Receipt,
  Search,
  Send,
  UserCheck,
} from "lucide-react"

import { initialFeeDues, type FeeDueRecord } from "@/data/library-management-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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

export default function FeeDuesTrackerPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [dues, setDues] = useState<FeeDueRecord[]>(initialFeeDues)
  const [searchQuery, setSearchQuery] = useState("")

  // Payment Collect Modal
  const [collectModalOpen, setCollectModalOpen] = useState(false)
  const [selectedDue, setSelectedDue] = useState<FeeDueRecord | null>(null)
  const [collectAmount, setCollectAmount] = useState(0)
  const [paymentMode, setPaymentMode] = useState("UPI")
  const [transactionRef, setTransactionRef] = useState("")

  const [reminderToast, setReminderToast] = useState<string | null>(null)

  const handleOpenCollect = (due: FeeDueRecord) => {
    setSelectedDue(due)
    setCollectAmount(due.dueAmount)
    setTransactionRef(`UPI-${Date.now().toString().slice(-6)}`)
    setCollectModalOpen(true)
  }

  const handleConfirmCollect = () => {
    if (!selectedDue || collectAmount <= 0) return
    setDues(
      dues.map((d) =>
        d.id === selectedDue.id
          ? {
              ...d,
              paidAmount: d.paidAmount + collectAmount,
              dueAmount: Math.max(0, d.dueAmount - collectAmount),
              status: d.dueAmount - collectAmount <= 0 ? "Partially Paid" : "Pending",
            }
          : d
      )
    )
    setCollectModalOpen(false)
  }

  const handleSendReminder = (studentName: string) => {
    setReminderToast(`Automated WhatsApp & SMS reminder sent to ${studentName}!`)
    setTimeout(() => setReminderToast(null), 3500)
  }

  const totalOutstandingDues = dues.reduce((acc, d) => acc + d.dueAmount, 0)
  const overdueCount = dues.filter((d) => d.status === "Overdue").length

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
          Fee Dues & Defaulter Recovery (PRD §17 & SQL fee_dues)
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Receipt className="size-5 text-amber-600" />
            Fee Dues & Defaulters Tracker
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage unpaid balances, partial payment settlements, overdue alerts & WhatsApp payment reminders
          </p>
        </div>

        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border">
          <Download className="size-3.5" />
          <span>Export Defaulter List</span>
        </Button>
      </div>

      {/* Feedback Toast */}
      {reminderToast && (
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{reminderToast}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/60 bg-card/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Dues Pending</span>
              <CircleDollarSign className="size-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              ₹{totalOutstandingDues.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-foreground">Across all enrolled students</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Overdue Accounts</span>
              <AlertTriangle className="size-4 text-destructive" />
            </div>
            <div className="text-2xl font-bold text-foreground">{overdueCount} Students</div>
            <div className="text-[11px] text-destructive font-medium">Exceeded payment deadline</div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-2.5 p-3 rounded-xl border border-border/60 bg-card">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search student code or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* Dues Table */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-bold">Student</TableHead>
                  <TableHead className="text-xs font-bold">Branch & Plan</TableHead>
                  <TableHead className="text-xs font-bold">Total Fee</TableHead>
                  <TableHead className="text-xs font-bold">Paid So Far</TableHead>
                  <TableHead className="text-xs font-bold">Balance Due</TableHead>
                  <TableHead className="text-xs font-bold">Due Date</TableHead>
                  <TableHead className="text-xs font-bold">Status</TableHead>
                  <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dues.map((d) => (
                  <TableRow key={d.id} className="text-xs">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img
                          src={d.avatar}
                          alt={d.studentName}
                          className="size-7 rounded-full object-cover border border-border"
                        />
                        <div>
                          <div className="font-semibold text-foreground">{d.studentName}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{d.studentCode} • {d.phone}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-foreground">{d.membershipPlan}</div>
                      <div className="text-[10px] text-muted-foreground">{d.branch}</div>
                    </TableCell>

                    <TableCell className="font-mono">₹{d.totalFee}</TableCell>
                    <TableCell className="font-mono text-emerald-600">₹{d.paidAmount}</TableCell>
                    <TableCell className="font-mono font-bold text-destructive">₹{d.dueAmount}</TableCell>

                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {d.dueDate}
                      {d.daysOverdue > 0 && (
                        <div className="text-[10px] text-destructive font-semibold">
                          ({d.daysOverdue} days late)
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          d.status === "Overdue"
                            ? "bg-destructive/10 text-destructive border-destructive/20 text-[10px]"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]"
                        }
                      >
                        {d.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendReminder(d.studentName)}
                          className="h-7 text-xs text-muted-foreground gap-1"
                          title="Send WhatsApp Reminder"
                        >
                          <Send className="size-3" />
                          <span>Remind</span>
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleOpenCollect(d)}
                          className="h-7 text-xs bg-emerald-600 text-white hover:bg-emerald-700 gap-1 font-semibold"
                        >
                          <CircleDollarSign className="size-3" />
                          <span>Collect Fee</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Collect Payment */}
      <Dialog open={collectModalOpen} onOpenChange={setCollectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleDollarSign className="size-5 text-emerald-600" />
              Collect Fee Payment
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record offline or online collection for {selectedDue?.studentName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Pending Due:</span>
                <span className="font-mono font-bold text-destructive">₹{selectedDue?.dueAmount}</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Amount to Settle (₹ INR)</Label>
              <Input
                type="number"
                value={collectAmount}
                onChange={(e) => setCollectAmount(Number(e.target.value))}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Payment Mode</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">UPI Desk QR / GPay</SelectItem>
                  <SelectItem value="Cash">Cash in Hand</SelectItem>
                  <SelectItem value="Card">Card Swipe (POS)</SelectItem>
                  <SelectItem value="Bank Transfer">NEFT / Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Transaction Reference / Receipt No</Label>
              <Input
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCollectModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmCollect}
              className="text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Confirm Collection & Settle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

