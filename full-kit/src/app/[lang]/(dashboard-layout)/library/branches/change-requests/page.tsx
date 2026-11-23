"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Filter,
  GitPullRequest,
  Search,
  UserCheck,
  XCircle,
} from "lucide-react"

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

export default function StudentBranchChangeRequestsPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [requests, setRequests] = useState([
    {
      id: "bcr-1",
      studentId: "stu-1081",
      studentCode: "STU-1081",
      studentName: "Aarav Patel",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      currentBranch: "Main Branch - Central",
      currentSeat: "Desk A-14",
      requestedBranch: "Branch 2 - West Campus",
      reason: "Shifted residency closer to Drive-In Road; West Campus saves 45 mins daily commute.",
      requestDate: "01 Nov 2026",
      planValidityRemaining: "12 Days Remaining",
      status: "Pending",
    },
    {
      id: "bcr-2",
      studentId: "stu-1092",
      studentCode: "STU-1092",
      studentName: "Karan Mehta",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      currentBranch: "Branch 2 - West Campus",
      currentSeat: "Desk W-08",
      requestedBranch: "Branch 3 - North Tech Hub",
      reason: "Requires 24x7 Night Owl facility for upcoming GATE mock cycle.",
      requestDate: "30 Oct 2026",
      planValidityRemaining: "45 Days Remaining",
      status: "Approved",
    },
  ])

  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [allocatedSeat, setAllocatedSeat] = useState("Desk W-24")

  const handleOpenApprove = (req: any) => {
    setSelectedRequest(req)
    setApproveModalOpen(true)
  }

  const handleConfirmApproval = () => {
    if (!selectedRequest) return
    setRequests(
      requests.map((r) =>
        r.id === selectedRequest.id ? { ...r, status: "Approved" } : r
      )
    )
    setApproveModalOpen(false)
  }

  const handleReject = (id: string) => {
    setRequests(
      requests.map((r) =>
        r.id === id ? { ...r, status: "Rejected" } : r
      )
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden space-y-4 p-3 sm:p-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href={ensureLocalizedPathname("/pages/branches", lang)}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0",
          })}
        >
          <ChevronLeft className="size-4" />
          <span>Back to Branches Overview</span>
        </Link>
        <span className="text-xs font-mono text-muted-foreground">
          Student Campus Transfer Requests (PRD §33)
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <GitPullRequest className="size-5 text-amber-600" />
            Student Campus Transfer Requests
          </h1>
          <p className="text-xs text-muted-foreground">
            Approve branch transfers: releases original seat, allocates target campus desk, preserves active days (PRD §33)
          </p>
        </div>
      </div>

      {/* Requests Table */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-bold">Student</TableHead>
                  <TableHead className="text-xs font-bold">Current Campus & Desk</TableHead>
                  <TableHead className="text-xs font-bold">Target Campus</TableHead>
                  <TableHead className="text-xs font-bold">Transfer Reason</TableHead>
                  <TableHead className="text-xs font-bold">Plan Days Kept</TableHead>
                  <TableHead className="text-xs font-bold">Status</TableHead>
                  <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id} className="text-xs">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img
                          src={r.avatar}
                          alt={r.studentName}
                          className="size-7 rounded-full object-cover border border-border"
                        />
                        <div>
                          <div className="font-semibold text-foreground">{r.studentName}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{r.studentCode}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-foreground">{r.currentBranch}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{r.currentSeat}</div>
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-primary flex items-center gap-1">
                        <ArrowRight className="size-3 text-muted-foreground" />
                        <span>{r.requestedBranch}</span>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-xs text-muted-foreground text-[11px]">
                      {r.reason}
                    </TableCell>

                    <TableCell className="font-mono font-medium text-foreground">
                      {r.planValidityRemaining}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          r.status === "Approved"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
                            : r.status === "Rejected"
                              ? "bg-destructive/10 text-destructive border-destructive/20 text-[10px]"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]"
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      {r.status === "Pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(r.id)}
                            className="h-7 text-xs"
                          >
                            Reject
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleOpenApprove(r)}
                            className="h-7 text-xs bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
                          >
                            Approve & Seat
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Resolved</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Approve Branch Change & Reassign Seat (PRD §33) */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600" />
              Approve Campus Transfer
            </DialogTitle>
            <DialogDescription className="text-xs">
              Releases {selectedRequest?.currentSeat} at {selectedRequest?.currentBranch} and assigns a new seat at {selectedRequest?.requestedBranch}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Student:</span>
                <span className="font-semibold text-foreground">{selectedRequest?.studentName} ({selectedRequest?.studentCode})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Moving To:</span>
                <span className="font-semibold text-primary">{selectedRequest?.requestedBranch}</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Allocate New Desk at Destination</Label>
              <Select value={allocatedSeat} onValueChange={setAllocatedSeat}>
                <SelectTrigger className="h-8 text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Desk W-24">Desk W-24 (General Silent Zone)</SelectItem>
                  <SelectItem value="Desk W-25">Desk W-25 (General Silent Zone)</SelectItem>
                  <SelectItem value="Cabin W-02">Cabin W-02 (Premium Study Cabin)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApproveModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmApproval}
              className="text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Confirm Transfer & Notify Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

