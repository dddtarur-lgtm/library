"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Clock,
  Filter,
  GitPullRequest,
  Search,
  User,
  X,
} from "lucide-react"

import {
  initialSeatChangeRequests,
  type SeatChangeRequest,
} from "@/data/seats-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Textarea } from "@/components/ui/textarea"

export default function SeatChangeRequestsPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [requests, setRequests] = useState<SeatChangeRequest[]>(
    initialSeatChangeRequests
  )
  const [statusFilter, setStatusFilter] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  // Modals state
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] =
    useState<SeatChangeRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== "All" && r.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = r.studentName.toLowerCase().includes(q)
      const matchId = r.studentId.toLowerCase().includes(q)
      const matchSeat =
        r.currentSeat.toLowerCase().includes(q) ||
        r.requestedSeat.toLowerCase().includes(q)
      if (!matchName && !matchId && !matchSeat) return false
    }
    return true
  })

  const pendingCount = requests.filter((r) => r.status === "Pending").length

  const handleApprove = (reqId: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: "Approved",
              reviewedBy: "Library Admin",
              reviewedAt: "Just now",
            }
          : r
      )
    )
  }

  const handleOpenReject = (req: SeatChangeRequest) => {
    setSelectedRequest(req)
    setRejectionReason("")
    setRejectModalOpen(true)
  }

  const handleConfirmReject = () => {
    if (!selectedRequest) return
    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedRequest.id
          ? {
              ...r,
              status: "Rejected",
              reviewedBy: "Library Admin",
              reviewedAt: "Just now",
              rejectionReason:
                rejectionReason || "Requested seat is currently unavailable.",
            }
          : r
      )
    )
    setRejectModalOpen(false)
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
          Seat Change Requests (PRD §18.5)
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <GitPullRequest className="size-5 text-primary" />
            Student Seat Change Requests
          </h1>
          <p className="text-xs text-muted-foreground">
            Review student requests to switch seats, shifts, or wings with 1-click swap
          </p>
        </div>

        {pendingCount > 0 && (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs px-2.5 py-1 self-start md:self-auto"
          >
            <Clock className="size-3 mr-1.5" />
            {pendingCount} Pending Requests Awaiting Action
          </Badge>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-border/60 bg-card">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search student or seat..."
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
              <SelectItem value="Pending">Pending ({pendingCount})</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 p-12 text-center text-xs text-muted-foreground">
            No seat change requests match your criteria.
          </div>
        ) : (
          filteredRequests.map((req) => (
            <Card
              key={req.id}
              className="border-border/60 bg-card shadow-xs transition-all hover:border-border"
            >
              <CardContent className="p-4 space-y-3">
                {/* Header row: Student Info & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 border border-border/60">
                      <AvatarImage src={req.avatar} alt={req.studentName} />
                      <AvatarFallback className="font-bold text-xs">
                        {req.studentName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={ensureLocalizedPathname(
                            `/pages/students/${req.studentId}`,
                            lang
                          )}
                          className="font-bold text-sm text-foreground hover:underline"
                        >
                          {req.studentName}
                        </Link>
                        <span className="font-mono text-xs text-muted-foreground">
                          {req.studentId}
                        </span>
                        {req.priority === "High" && (
                          <Badge
                            variant="destructive"
                            className="text-[9px] px-1.5 py-0 h-4 font-bold"
                          >
                            HIGH PRIORITY
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Requested on {req.requestDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        req.status === "Pending"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs"
                          : req.status === "Approved"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs"
                            : "bg-destructive/10 text-destructive border-destructive/30 text-xs"
                      }
                    >
                      {req.status}
                    </Badge>
                  </div>
                </div>

                {/* Seat Swap Visual Representation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-muted/20 border border-border/40 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block mb-1">
                      Current Allocation
                    </span>
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-muted font-mono font-bold">
                        {req.currentSeat}
                      </span>
                      <span>({req.currentShift})</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block mb-1">
                      Requested Seat & Shift
                    </span>
                    <div className="font-semibold text-primary flex items-center gap-1.5">
                      <ArrowRight className="size-3.5 text-primary" />
                      <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 font-mono font-bold">
                        {req.requestedSeat}
                      </span>
                      <span>• {req.requestedFloor}</span>
                    </div>
                  </div>
                </div>

                {/* Reason Note */}
                <div className="text-xs text-muted-foreground bg-card p-2 rounded border border-border/40">
                  <strong className="text-foreground">Student Reason:</strong> "{req.reason}"
                </div>

                {/* Action Buttons for Pending */}
                {req.status === "Pending" ? (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenReject(req)}
                      className="h-8 text-xs font-semibold text-destructive hover:bg-destructive/10 border-destructive/30"
                    >
                      <X className="size-3.5 mr-1" />
                      Reject Request
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(req.id)}
                      className="h-8 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                    >
                      <Check className="size-3.5 mr-1" />
                      Approve & Swap Seat
                    </Button>
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground pt-1 flex items-center justify-between">
                    <span>
                      Reviewed by: <strong className="text-foreground">{req.reviewedBy}</strong> ({req.reviewedAt})
                    </span>
                    {req.rejectionReason && (
                      <span className="text-destructive">
                        Reason: {req.rejectionReason}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <X className="size-5" />
              Reject Seat Change Request?
            </DialogTitle>
            <DialogDescription className="text-xs">
              Rejecting request from <strong>{selectedRequest?.studentName}</strong> to
              switch to {selectedRequest?.requestedSeat}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs">Reason for Rejection</Label>
            <Textarea
              placeholder="e.g. Requested seat is booked for full-day plan holder, or girls wing restriction applies."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="text-xs min-h-[80px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmReject}
              className="text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
