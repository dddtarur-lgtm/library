"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  AlertTriangle,
  ArrowDownLeft,
  CheckCircle2,
  ChevronLeft,
  CircleDollarSign,
  Clock,
  Download,
  Filter,
  Search,
  ShieldAlert,
} from "lucide-react"

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function OverdueBooksFinesPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [overdues, setOverdues] = useState([
    {
      id: "od-1",
      studentName: "Jayesh Shah",
      studentCode: "STU-1089",
      phone: "+91 98254 33221",
      bookTitle: "A Brief History of Modern India",
      barcode: "BK-HIS-002",
      dueDate: "24 Oct 2026",
      daysOverdue: 9,
      fineRatePerDay: 5,
      totalFine: 45,
      status: "Unpaid",
    },
    {
      id: "od-2",
      studentName: "Sunil Parmar",
      studentCode: "STU-1094",
      phone: "+91 97240 88776",
      bookTitle: "Concepts of Physics (Part 1)",
      barcode: "BK-PHY-001",
      dueDate: "28 Oct 2026",
      daysOverdue: 5,
      fineRatePerDay: 5,
      totalFine: 25,
      status: "Unpaid",
    },
  ])

  const [collectModalOpen, setCollectModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null)
  const [waiveModalOpen, setWaiveModalOpen] = useState(false)
  const [waiveReason, setWaiveReason] = useState("")

  const handleOpenCollect = (rec: any) => {
    setSelectedRecord(rec)
    setCollectModalOpen(true)
  }

  const handleConfirmCollect = () => {
    if (!selectedRecord) return
    setOverdues(
      overdues.map((o) =>
        o.id === selectedRecord.id ? { ...o, status: "Paid" } : o
      )
    )
    setCollectModalOpen(false)
  }

  const handleOpenWaive = (rec: any) => {
    setSelectedRecord(rec)
    setWaiveModalOpen(true)
  }

  const handleConfirmWaive = () => {
    if (!selectedRecord || !waiveReason) return
    setOverdues(
      overdues.map((o) =>
        o.id === selectedRecord.id ? { ...o, status: "Waived" } : o
      )
    )
    setWaiveModalOpen(false)
    setWaiveReason("")
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden space-y-4 p-3 sm:p-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href={ensureLocalizedPathname("/pages/books", lang)}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0",
          })}
        >
          <ChevronLeft className="size-4" />
          <span>Back to Book Catalog</span>
        </Link>
        <span className="text-xs font-mono text-muted-foreground">
          Overdue Books & Fine Collection Rules (PRD §7.4 & Phase 2)
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="size-5 text-amber-600" />
            Overdue Books & Fines Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Track unreturned library loans, collect daily late fees (₹5/day) or record authorized fine waivers with audit notes
          </p>
        </div>

        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border">
          <Download className="size-3.5" />
          <span>Export Overdue Register</span>
        </Button>
      </div>

      {/* Table */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-bold">Student</TableHead>
                  <TableHead className="text-xs font-bold">Book Title & Barcode</TableHead>
                  <TableHead className="text-xs font-bold">Due Date</TableHead>
                  <TableHead className="text-xs font-bold text-center">Overdue Days</TableHead>
                  <TableHead className="text-xs font-bold text-right">Fine Calculated</TableHead>
                  <TableHead className="text-xs font-bold">Status</TableHead>
                  <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdues.map((o) => (
                  <TableRow key={o.id} className="text-xs">
                    <TableCell>
                      <div className="font-semibold text-foreground">{o.studentName}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{o.studentCode} • {o.phone}</div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-foreground">{o.bookTitle}</div>
                      <div className="text-[10px] font-mono text-primary font-bold">{o.barcode}</div>
                    </TableCell>

                    <TableCell className="font-mono text-muted-foreground text-[11px]">
                      {o.dueDate}
                    </TableCell>

                    <TableCell className="text-center font-mono font-bold text-destructive">
                      {o.daysOverdue} Days Late
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-destructive">
                      ₹{o.totalFine}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          o.status === "Paid"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
                            : o.status === "Waived"
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]"
                              : "bg-destructive/10 text-destructive border-destructive/20 text-[10px]"
                        }
                      >
                        {o.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      {o.status === "Unpaid" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenWaive(o)}
                            className="h-7 text-xs text-muted-foreground"
                          >
                            Waive
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleOpenCollect(o)}
                            className="h-7 text-xs bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
                          >
                            Collect ₹{o.totalFine}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px] font-medium">Settled</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Collect Fine */}
      <Dialog open={collectModalOpen} onOpenChange={setCollectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleDollarSign className="size-5 text-emerald-600" />
              Collect Late Return Fine
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm receipt of ₹{selectedRecord?.totalFine} fine from {selectedRecord?.studentName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Book:</span>
                <span className="font-semibold text-foreground">{selectedRecord?.bookTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Overdue Days:</span>
                <span className="font-mono text-destructive">{selectedRecord?.daysOverdue} days (₹5/day)</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-border/60">
                <span className="text-foreground">Total Fine Surcharged:</span>
                <span className="font-mono text-emerald-600 text-sm">₹{selectedRecord?.totalFine}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setCollectModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmCollect} className="text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700">
              Confirm Collection & Return Book
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Waive Fine */}
      <Dialog open={waiveModalOpen} onOpenChange={setWaiveModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-amber-600" />
              Waive Book Late Fine
            </DialogTitle>
            <DialogDescription className="text-xs">
              Fine waivers are audited. Please record the legitimate reason (e.g. verified medical leave).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Waiver Reason (Mandatory for Audit Trail)</Label>
              <Input
                placeholder="e.g. Student provided medical certificate for hospitalization"
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setWaiveModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmWaive} disabled={!waiveReason} className="text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700">
              Approve Waiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

