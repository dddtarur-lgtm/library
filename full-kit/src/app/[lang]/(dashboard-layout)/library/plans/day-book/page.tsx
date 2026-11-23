"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useEffect, useState } from "react"
import { libraryService } from "@/services/library-service"
import {
  ArrowRightLeft,
  CheckCircle2,
  ChevronLeft,
  CircleDollarSign,
  Coins,
  Download,
  FileSpreadsheet,
  Lock,
  Plus,
  Receipt,
  UserCheck,
} from "lucide-react"

import { initialFeePlans } from "@/data/library-management-data"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function CashDayBookPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [handoverModalOpen, setHandoverModalOpen] = useState(false)
  const [closingConfirmed, setClosingConfirmed] = useState(false)

  // Denominations count
  const [d500, setD500] = useState(12)
  const [d200, setD200] = useState(8)
  const [d100, setD100] = useState(14)
  const [d50, setD50] = useState(6)

  const cashInHand = d500 * 500 + d200 * 200 + d100 * 100 + d50 * 50 // 6000 + 1600 + 1400 + 300 = 9300
  const upiCollected = 18400
  const totalCollections = cashInHand + upiCollected

  const [entries, setEntries] = useState([
    { id: "e-1", time: "06:45 AM", student: "Aarav Patel (STU-1081)", purpose: "1 Month Full Day Intensive", mode: "UPI Desk QR", amount: 1800, staff: "Rohan Desai" },
    { id: "e-2", time: "07:30 AM", student: "Priya Sharma (STU-1082)", purpose: "Locker Security Deposit", mode: "Cash in Hand", amount: 500, staff: "Rohan Desai" },
    { id: "e-3", time: "08:15 AM", student: "Jayesh Shah (STU-1089)", purpose: "Overdue Book Fine (9 days)", mode: "Cash in Hand", amount: 45, staff: "Rohan Desai" },
    { id: "e-4", time: "10:20 AM", student: "Ananya Iyer (STU-1084)", purpose: "3 Months Super Saver (Part 1)", mode: "UPI Desk QR", amount: 2400, staff: "Pooja Mehta" },
    { id: "e-5", time: "01:10 PM", student: "Rohan Verma (STU-1083)", purpose: "Plan Renewal (Evening Shift)", mode: "Cash in Hand", amount: 1200, staff: "Pooja Mehta" },
  ])

  useEffect(() => {
    async function loadDaybook() {
      try {
        const res = await libraryService.getDaybookEntries()
        const list = res.results || (Array.isArray(res) ? (res as any) : [])
        if (list && list.length > 0) {
          setEntries(
            list.map((item: any) => ({
              id: String(item.id),
              time: item.created_at
                ? new Date(item.created_at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "10:00 AM",
              student: item.description || "Student Fee",
              purpose: item.category || "Membership",
              mode: item.payment_mode || "Cash",
              amount: Number(item.amount),
              staff: item.created_by || "Desk Staff",
            }))
          )
        }
      } catch {
        // Fallback to initial
      }
    }
    loadDaybook()
  }, [])

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
          Cashier Day-Book & Shift Reconciliations (PRD §17)
        </span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Coins className="size-5 text-emerald-600" />
            Cashier Day-Book & Shift Closing Register
          </h1>
          <p className="text-xs text-muted-foreground">
            Track daily drawer cash collections, UPI QR settlements & perform shift handover reconciliations (PRD §17)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setHandoverModalOpen(true)}
            className="h-8 text-xs gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs font-semibold"
          >
            <ArrowRightLeft className="size-3.5" />
            <span>Shift Handover / Day Closing</span>
          </Button>

          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border">
            <Download className="size-3.5" />
            <span>Export Day-Book (.xlsx)</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/60 bg-card/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Physical Cash in Drawer</span>
              <CircleDollarSign className="size-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              ₹{cashInHand.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-foreground">Counted in desk till</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">UPI / QR Collections</span>
              <Receipt className="size-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              ₹{upiCollected.toLocaleString()}
            </div>
            <div className="text-[11px] text-primary font-medium">Credited to bank directly</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Day Volume</span>
              <Coins className="size-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              ₹{totalCollections.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-foreground">Today's gross revenue</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Desk Status</span>
              <Lock className="size-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {closingConfirmed ? "Closed & Reconciled" : "Shift Open"}
            </div>
            <div className="text-[11px] text-muted-foreground">Operator: Rohan Desai</div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Denomination Counter + Real-time Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Denominations Calculator */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Coins className="size-4 text-emerald-600" />
                Physical Drawer Cash Counter
              </CardTitle>
              <CardDescription className="text-xs">
                Staff denomination count for evening handover.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-foreground">₹500 Notes:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={d500}
                    onChange={(e) => setD500(Number(e.target.value))}
                    className="h-7 w-20 text-xs font-mono text-right"
                  />
                  <span className="font-mono text-muted-foreground w-16 text-right">₹{d500 * 500}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-foreground">₹200 Notes:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={d200}
                    onChange={(e) => setD200(Number(e.target.value))}
                    className="h-7 w-20 text-xs font-mono text-right"
                  />
                  <span className="font-mono text-muted-foreground w-16 text-right">₹{d200 * 200}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-foreground">₹100 Notes:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={d100}
                    onChange={(e) => setD100(Number(e.target.value))}
                    className="h-7 w-20 text-xs font-mono text-right"
                  />
                  <span className="font-mono text-muted-foreground w-16 text-right">₹{d100 * 100}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-foreground">₹50 Notes:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={d50}
                    onChange={(e) => setD50(Number(e.target.value))}
                    className="h-7 w-20 text-xs font-mono text-right"
                  />
                  <span className="font-mono text-muted-foreground w-16 text-right">₹{d50 * 50}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 flex justify-between items-center font-bold">
                <span className="text-foreground">Counted Total:</span>
                <span className="font-mono text-emerald-600 text-sm">₹{cashInHand.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Chronological Collection Journal */}
        <div className="lg:col-span-8">
          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="size-4 text-primary" />
                Today's Collection Transactions
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time chronological payments received across shifts.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold">Time</TableHead>
                    <TableHead className="text-xs font-bold">Student</TableHead>
                    <TableHead className="text-xs font-bold">Purpose</TableHead>
                    <TableHead className="text-xs font-bold">Mode</TableHead>
                    <TableHead className="text-xs font-bold text-right">Amount</TableHead>
                    <TableHead className="text-xs font-bold">Staff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e) => (
                    <TableRow key={e.id} className="text-xs">
                      <TableCell className="font-mono text-muted-foreground">{e.time}</TableCell>
                      <TableCell className="font-semibold text-foreground">{e.student}</TableCell>
                      <TableCell className="text-muted-foreground">{e.purpose}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {e.mode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-600">
                        ₹{e.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[11px]">{e.staff}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: Shift Handover */}
      <Dialog open={handoverModalOpen} onOpenChange={setHandoverModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="size-5 text-emerald-600" />
              Desk Shift Handover Sign-Off
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm physical cash handover between front-desk operators.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outgoing Operator:</span>
                <span className="font-semibold text-foreground">Rohan Desai (Morning Shift)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Incoming Operator:</span>
                <span className="font-semibold text-foreground">Pooja Mehta (Afternoon Shift)</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-border/60">
                <span className="text-foreground">Physical Cash Handed Over:</span>
                <span className="font-mono text-emerald-600 text-sm">₹{cashInHand.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Discrepancy / Handover Notes (if any)</Label>
              <Input
                placeholder="e.g. All ₹9,300 verified and transferred to desk safe box"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHandoverModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setClosingConfirmed(true)
                setHandoverModalOpen(false)
              }}
              className="text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Confirm Handover & Lock Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

