"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  Armchair,
  Check,
  ChevronLeft,
  CircleDollarSign,
  Filter,
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  UserX,
} from "lucide-react"

import { initialLockersData, type LockerItem } from "@/data/seats-data"
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

export default function LockersManagementPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [lockers, setLockers] = useState<LockerItem[]>(initialLockersData)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  // Modals state
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedLocker, setSelectedLocker] = useState<LockerItem | null>(null)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)

  // Assign form
  const [assignStudentId, setAssignStudentId] = useState("")
  const [assignStudentName, setAssignStudentName] = useState("")
  const [depositAmount, setDepositAmount] = useState(500)

  const filteredLockers = lockers.filter((l) => {
    if (statusFilter !== "All" && l.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchNo = l.lockerNo.toLowerCase().includes(q)
      const matchStudent = l.assignedStudent?.name.toLowerCase().includes(q)
      const matchId = l.assignedStudent?.studentId.toLowerCase().includes(q)
      if (!matchNo && !matchStudent && !matchId) return false
    }
    return true
  })

  const totalLockers = lockers.length
  const assignedCount = lockers.filter((l) => l.status === "Assigned").length
  const availableCount = lockers.filter((l) => l.status === "Available").length
  const totalDeposits = lockers
    .filter((l) => l.depositStatus === "Paid")
    .reduce((acc, l) => acc + l.depositAmount, 0)

  const handleOpenAssign = (locker: LockerItem) => {
    setSelectedLocker(locker)
    setAssignStudentId("")
    setAssignStudentName("")
    setDepositAmount(locker.depositAmount || 500)
    setAssignModalOpen(true)
  }

  const handleConfirmAssign = () => {
    if (!selectedLocker || !assignStudentName) return
    setLockers((prev) =>
      prev.map((l) =>
        l.id === selectedLocker.id
          ? {
              ...l,
              status: "Assigned",
              keyStatus: "Issued",
              depositAmount,
              depositStatus: "Paid",
              assignedStudent: {
                id: assignStudentId || "STU-9999",
                name: assignStudentName,
                studentId: assignStudentId || "STU-9999",
                phone: "+91 98765 00000",
                assignedAt: "Today",
              },
            }
          : l
      )
    )
    setAssignModalOpen(false)
  }

  const handleOpenReturn = (locker: LockerItem) => {
    setSelectedLocker(locker)
    setReturnDialogOpen(true)
  }

  const handleConfirmReturn = () => {
    if (!selectedLocker) return
    setLockers((prev) =>
      prev.map((l) =>
        l.id === selectedLocker.id
          ? {
              ...l,
              status: "Available",
              keyStatus: "In Cabinet",
              depositStatus: "Refunded",
              assignedStudent: undefined,
            }
          : l
      )
    )
    setReturnDialogOpen(false)
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden space-y-4 p-3 sm:p-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href={ensureLocalizedPathname("/pages/seats", lang)}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0",
          })}
        >
          <ChevronLeft className="size-4" />
          <span>Back to Seat Map</span>
        </Link>
        <span className="text-xs font-mono text-muted-foreground">
          Locker & Key Deposit Management (PRD §5.4, §6)
        </span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <KeyRound className="size-5 text-primary" />
            Locker & Key Deposit Directory
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage physical lockers, student allocations, key handovers and security deposit refunds
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/60 bg-card/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Lockers</span>
              <KeyRound className="size-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{totalLockers}</div>
            <div className="text-[11px] text-muted-foreground">All floors combined</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Assigned Lockers</span>
              <UserCheck className="size-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{assignedCount}</div>
            <div className="text-[11px] text-blue-600 font-medium">Keys currently issued</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Available</span>
              <ShieldCheck className="size-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{availableCount}</div>
            <div className="text-[11px] text-emerald-600 font-medium">Ready for allotment</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 shadow-xs">
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Security Deposits</span>
              <CircleDollarSign className="size-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              ₹{totalDeposits.toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-foreground">Refundable deposit pool</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-border/60 bg-card">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search locker no (e.g. L-14) or student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-background"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="size-3.5 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Assigned">Assigned</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lockers Table */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-bold w-[100px]">Locker No</TableHead>
                  <TableHead className="text-xs font-bold">Location</TableHead>
                  <TableHead className="text-xs font-bold">Status</TableHead>
                  <TableHead className="text-xs font-bold">Assigned Student</TableHead>
                  <TableHead className="text-xs font-bold">Key Status</TableHead>
                  <TableHead className="text-xs font-bold">Deposit</TableHead>
                  <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLockers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-xs text-muted-foreground"
                    >
                      No lockers found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLockers.map((locker) => (
                    <TableRow key={locker.id} className="text-xs">
                      <TableCell className="font-bold text-foreground font-mono">
                        {locker.lockerNo}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div>{locker.floor}</div>
                        <div className="text-[10px] opacity-75">{locker.room}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            locker.status === "Assigned"
                              ? "bg-primary/10 text-primary border-primary/20 text-[10px]"
                              : locker.status === "Available"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
                                : "bg-muted text-muted-foreground text-[10px]"
                          }
                        >
                          {locker.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {locker.assignedStudent ? (
                          <div>
                            <Link
                              href={ensureLocalizedPathname(
                                `/pages/students/${locker.assignedStudent.studentId}`,
                                lang
                              )}
                              className="font-semibold text-foreground hover:underline"
                            >
                              {locker.assignedStudent.name}
                            </Link>
                            <div className="text-[10px] font-mono text-muted-foreground">
                              {locker.assignedStudent.studentId} • {locker.assignedStudent.phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">None (Free)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            locker.keyStatus === "Issued"
                              ? "text-blue-600 font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {locker.keyStatus}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono font-semibold">₹{locker.depositAmount}</div>
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1.5 py-0 h-4 mt-0.5"
                        >
                          {locker.depositStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {locker.status === "Available" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenAssign(locker)}
                            className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
                          >
                            <User className="size-3 mr-1" />
                            Assign
                          </Button>
                        ) : locker.status === "Assigned" ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleOpenReturn(locker)}
                            className="h-7 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            <KeyRound className="size-3 mr-1" />
                            Return & Refund
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Under Repair</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Assign Locker */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-5 text-primary" />
              Assign Locker {selectedLocker?.lockerNo}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign physical locker to student and record key security deposit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Student Name</Label>
              <Input
                placeholder="e.g. Aarav Patel"
                value={assignStudentName}
                onChange={(e) => setAssignStudentName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Student ID (optional)</Label>
              <Input
                placeholder="e.g. STU-1081"
                value={assignStudentId}
                onChange={(e) => setAssignStudentId(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Refundable Security Deposit (₹)</Label>
              <Input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmAssign}
              disabled={!assignStudentName}
              className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Assign Locker & Issue Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Return Key & Refund Deposit */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <KeyRound className="size-5" />
              Return Key & Refund Deposit?
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm key handover from{" "}
              <strong>{selectedLocker?.assignedStudent?.name}</strong> for Locker{" "}
              <strong>{selectedLocker?.lockerNo}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-muted/30 border border-border/60 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deposit Paid:</span>
              <span className="font-mono font-bold text-foreground">
                ₹{selectedLocker?.depositAmount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Refund Action:</span>
              <span className="text-emerald-600 font-semibold">Instant Cash Refund</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReturnDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmReturn}
              className="text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Refund ₹{selectedLocker?.depositAmount} & Free Locker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
