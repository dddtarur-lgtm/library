"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Building2,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  ShieldAlert,
  User,
  XCircle,
} from "lucide-react"

import type { LibraryRequest } from "@/data/platform-admin-data"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { LibraryLogo } from "@/components/platform/library-logo"

interface ReviewRequestDialogProps {
  request: LibraryRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
}

function formatINR(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val)
}

export function ReviewRequestDialog({
  request,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: ReviewRequestDialogProps) {
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  if (!request) return null

  const canApprove =
    request.documentCheck.emailVerified && request.documentCheck.mobileVerified

  const handleApprove = () => {
    onApprove(request.id)
    toast.success(
      `Library "${request.libraryName}" approved successfully! Welcome email sent to owner.`
    )
    onOpenChange(false)
  }

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("A rejection reason is required to notify the owner.")
      return
    }
    onReject(request.id, rejectReason)
    toast.info(
      `Request ${request.requestNumber} rejected. Reason dispatched to owner.`
    )
    setRejectMode(false)
    setRejectReason("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <LibraryLogo
                name={request.libraryName}
                code={request.requestNumber}
                src={request.logo}
                size="lg"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-base font-bold truncate">
                    {request.libraryName}
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className="text-xs font-mono shrink-0"
                  >
                    {request.requestNumber}
                  </Badge>
                </div>
                <DialogDescription className="text-xs mt-0.5">
                  Verify owner credentials, planned seats, and commercial KYC
                  documentation.
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="font-semibold text-xs shrink-0"
            >
              {request.status}
            </Badge>
          </div>
        </DialogHeader>

        {request.duplicateWarning && (
          <div className="p-2.5 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
            <ShieldAlert className="size-4 shrink-0" />
            <span className="font-semibold">{request.duplicateWarning}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 text-xs">
          {/* Library Details */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col gap-2">
            <span className="font-bold text-foreground flex items-center gap-1.5 text-xs">
              <Building2 className="size-3.5 text-primary" /> Library
              Specification
            </span>
            <div className="space-y-1 text-muted-foreground">
              <p>
                <strong className="text-foreground">Name:</strong>{" "}
                {request.libraryName}
              </p>
              <p>
                <strong className="text-foreground">Location:</strong>{" "}
                {request.city}, {request.state}
              </p>
              <p>
                <strong className="text-foreground">Planned Branches:</strong>{" "}
                {request.branchesPlanned} (1 Main +{" "}
                {Math.max(0, request.branchesPlanned - 1)} Sub)
              </p>
              <p>
                <strong className="text-foreground">Total Seats:</strong>{" "}
                {request.plannedSeats} Seating Capacity
              </p>
              <p>
                <strong className="text-foreground">Selected Plan:</strong>{" "}
                {request.chosenPlan} ({request.billingCycle}) -{" "}
                {formatINR(request.feeAmount)}
              </p>
            </div>
          </div>

          {/* Owner Details */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col gap-2">
            <span className="font-bold text-foreground flex items-center gap-1.5 text-xs">
              <User className="size-3.5 text-primary" /> Owner & Contact
            </span>
            <div className="space-y-1 text-muted-foreground">
              <p>
                <strong className="text-foreground">Owner:</strong>{" "}
                {request.ownerName}
              </p>
              <p className="flex items-center gap-1">
                <Phone className="size-3 text-muted-foreground" />{" "}
                {request.mobile}
                {request.documentCheck.mobileVerified ? (
                  <Badge
                    variant="outline"
                    className="text-[9px] py-0 text-emerald-600 border-emerald-400"
                  >
                    OTP Verified
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[9px] py-0">
                    Unverified
                  </Badge>
                )}
              </p>
              <p className="flex items-center gap-1">
                <Mail className="size-3 text-muted-foreground" />{" "}
                {request.email}
                {request.documentCheck.emailVerified ? (
                  <Badge
                    variant="outline"
                    className="text-[9px] py-0 text-emerald-600 border-emerald-400"
                  >
                    Email Verified
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[9px] py-0">
                    Unverified
                  </Badge>
                )}
              </p>
              <p>
                <strong className="text-foreground">Submitted:</strong>{" "}
                {request.submittedDate}
              </p>
            </div>
          </div>
        </div>

        {/* Verification Checklist */}
        <div className="p-3 rounded-lg border border-border/60 bg-muted/30">
          <span className="font-bold text-foreground text-xs block mb-2">
            Verification Checklist
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              {request.documentCheck.emailVerified ? (
                <CheckCircle2 className="size-4 text-emerald-600" />
              ) : (
                <XCircle className="size-4 text-destructive" />
              )}
              <span>Primary Email Verification</span>
            </div>
            <div className="flex items-center gap-2">
              {request.documentCheck.mobileVerified ? (
                <CheckCircle2 className="size-4 text-emerald-600" />
              ) : (
                <XCircle className="size-4 text-destructive" />
              )}
              <span>Mobile Phone OTP Check</span>
            </div>
            <div className="flex items-center gap-2">
              {request.documentCheck.aadhaarUploaded ? (
                <CheckCircle2 className="size-4 text-emerald-600" />
              ) : (
                <XCircle className="size-4 text-destructive" />
              )}
              <span>Government Identity (Aadhaar/PAN)</span>
            </div>
            <div className="flex items-center gap-2">
              {request.documentCheck.gstOrRegistrationUploaded ? (
                <CheckCircle2 className="size-4 text-emerald-600" />
              ) : (
                <XCircle className="size-4 text-destructive" />
              )}
              <span>Commercial Registration / Lease</span>
            </div>
          </div>
        </div>

        {/* Uploaded Documents */}
        <div>
          <span className="font-bold text-foreground text-xs block mb-1.5">
            Uploaded KYC & License Documents ({request.documents.length})
          </span>
          <div className="space-y-1.5">
            {request.documents.map((doc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-md border border-border/70 bg-card text-xs"
              >
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <div>
                    <span className="font-semibold text-foreground">
                      {doc.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      {doc.fileName} ({doc.fileSize})
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    toast.info(`Viewing preview of ${doc.fileName}`)
                  }
                  className="h-6 text-[11px] px-2"
                >
                  View File
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Reject reason input */}
        {rejectMode && (
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-destructive">
              Rejection Reason (Will be emailed directly to owner):
            </label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="State the exact missing documents or registration discrepancy..."
              className="text-xs h-20"
            />
          </div>
        )}

        <DialogFooter className="border-t border-border/60 pt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!rejectMode ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setRejectMode(true)}
                className="text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs"
              >
                Reject Request
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectMode(false)}
                className="text-xs font-semibold"
              >
                Cancel Rejection
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.info(`Information request dispatched to ${request.email}`)
                onOpenChange(false)
              }}
              className="text-xs font-semibold"
            >
              Ask For More Info
            </Button>
          </div>

          <div>
            {rejectMode ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReject}
                className="text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs"
              >
                Confirm Rejection
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                disabled={!canApprove}
                onClick={handleApprove}
                className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
              >
                <CheckCircle2 className="size-3.5 me-1.5" />
                Approve & Create Organization
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
