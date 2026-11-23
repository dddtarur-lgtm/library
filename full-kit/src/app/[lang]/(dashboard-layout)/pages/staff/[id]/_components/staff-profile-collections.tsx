"use client"

import {
  Banknote,
  FileSpreadsheet,
  Receipt,
  Wallet,
} from "lucide-react"

import type { StaffMember } from "@/data/library-management-data"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export function StaffProfileCollections({ staff }: { staff: StaffMember }) {
  // If financial view permission is NOT given, do not show any masked containers or warning boxes at all!
  if (!staff.canViewRevenue) {
    return null
  }

  // Sample collections transactions for this staff member
  const sampleTransactions = [
    {
      id: "tx-1",
      receiptNo: "REC-2026-901",
      studentCode: "SHR-0103",
      studentName: "Aditya Kulkarni",
      purpose: "Monthly Standard (30 Days)",
      amount: 1200,
      mode: "Cash",
      time: "09:30 AM",
      status: "Reconciled",
    },
    {
      id: "tx-2",
      receiptNo: "REC-2026-902",
      studentCode: "SHR-0101",
      studentName: "Rohan Sharma",
      purpose: "Quarterly Pro Plan (90 Days)",
      amount: 3200,
      mode: "UPI (QR)",
      time: "10:15 AM",
      status: "Reconciled",
    },
    {
      id: "tx-3",
      receiptNo: "REC-2026-903",
      studentCode: "SHR-0104",
      studentName: "Sneha Deshmukh",
      purpose: "Locker Allocation (Key L-14)",
      amount: 500,
      mode: "Cash",
      time: "11:40 AM",
      status: "Pending Handover",
    },
    {
      id: "tx-4",
      receiptNo: "REC-2026-904",
      studentCode: "SHR-0107",
      studentName: "Kunal Jadhav",
      purpose: "24x7 Night Owl Add-on",
      amount: 800,
      mode: "UPI (QR)",
      time: "01:10 PM",
      status: "Reconciled",
    },
  ]

  const totalCollected = staff.collectionsToday || 5700
  const cashTotal = Math.round(totalCollected * 0.4)
  const upiTotal = totalCollected - cashTotal

  return (
    <div className="space-y-4">
      {/* Real Collection KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border border-border bg-card shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Desk Receipts Today</span>
              <Receipt className="size-4 text-primary" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              ₹{totalCollected.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {sampleTransactions.length} receipts generated
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Physical Cash at Counter</span>
              <Banknote className="size-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              ₹{cashTotal.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-500 font-medium">Ready for vault handover</div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">UPI / QR Counter Payments</span>
              <Wallet className="size-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              ₹{upiTotal.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-muted-foreground">Direct library bank credit</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden">
        <CardHeader className="p-3.5 sm:p-4 border-b border-border/80 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-primary" />
              Desk Day-Book Log
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live collection receipts processed at the desk by this operator.
            </p>
          </div>
          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            Day-Book Active
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground uppercase">Receipt No</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground uppercase">Student</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground uppercase">Purpose / Plan</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground uppercase">Payment Mode</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground uppercase">Time</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground uppercase">Amount</TableHead>
                  <TableHead className="text-xs font-semibold py-2.5 text-muted-foreground uppercase text-right">Audit Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleTransactions.map((tx) => (
                  <TableRow key={tx.id} className="border-border/60 hover:bg-muted/20 text-xs">
                    <TableCell className="py-2.5 font-mono font-medium text-foreground">
                      {tx.receiptNo}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="font-semibold text-foreground">{tx.studentName}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{tx.studentCode}</div>
                    </TableCell>
                    <TableCell className="py-2.5 text-muted-foreground">
                      {tx.purpose}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="outline" className="text-[10px] bg-muted/40 border-border">
                        {tx.mode}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 font-mono text-[11px] text-muted-foreground">
                      {tx.time}
                    </TableCell>
                    <TableCell className="py-2.5 font-mono font-bold text-foreground">
                      ₹{tx.amount.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                          tx.status === "Reconciled"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}
                      >
                        {tx.status}
                      </Badge>
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
