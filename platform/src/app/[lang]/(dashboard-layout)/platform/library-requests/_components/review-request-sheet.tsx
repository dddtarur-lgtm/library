"use client"

import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FileText,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  User,
  XCircle,
} from "lucide-react"

import type { LibraryRequest } from "@/data/platform/platform-data"
import type { RequestDocument } from "./document-preview-modal"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { LibraryLogo } from "@/components/platform/library-logo"

interface ReviewRequestSheetProps {
  request: LibraryRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove: (req: LibraryRequest) => void
  onRejectClick: (req: LibraryRequest) => void
  onMoreInfoClick: (req: LibraryRequest) => void
  onPreviewDoc: (doc: RequestDocument, libraryName: string) => void
}

export function ReviewRequestSheet({
  request,
  open,
  onOpenChange,
  onApprove,
  onRejectClick,
  onMoreInfoClick,
  onPreviewDoc,
}: ReviewRequestSheetProps) {
  if (!request) return null

  const isApproved = request.status === "Approved"
  const isRejected = request.status === "Rejected"
  const isPending = request.status === "Pending"

  const statusTone = isApproved ? "Active" : isRejected ? "Locked" : "Pending"

  const canApprove =
    request.documentCheck.emailVerified && request.documentCheck.mobileVerified

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto w-full p-6">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <SheetHeader className="p-0 border-b border-border/60 pb-4 text-start">
            <div className="flex items-center justify-between gap-2">
              <Badge
                variant="outline"
                className="font-mono text-xs font-semibold px-2 py-0.5 border-border/80"
              >
                {request.requestNumber}
              </Badge>
              <Badge
                variant={
                  isApproved
                    ? "success"
                    : isPending
                      ? "warning"
                      : isRejected
                        ? "destructive"
                        : "secondary"
                }
                className="font-bold text-xs"
              >
                {request.status}
              </Badge>
            </div>

            <div className="flex items-start gap-3 mt-3">
              <LibraryLogo
                name={request.libraryName}
                code={request.requestNumber}
                src={request.logo}
                size="lg"
                status={statusTone}
                showStatusDot
              />
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-xl font-black text-foreground truncate">
                  {request.libraryName}
                </SheetTitle>
                <SheetDescription className="text-xs flex items-center gap-1.5 mt-1 text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3 shrink-0 text-primary" />
                    {request.city}, {request.state}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3 shrink-0" />
                    Submitted {request.submittedDate}
                  </span>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Duplicate Risk Warning */}
          {request.duplicateWarning && (
            <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-start gap-2.5">
              <AlertTriangle className="size-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="min-w-0">
                <p className="font-bold text-rose-500">
                  Duplicate Tenant Warning
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-rose-400">
                  {request.duplicateWarning}. Cross-reference tax ID and mobile
                  prior to workspace provisioning.
                </p>
              </div>
            </div>
          )}

          {/* Owner & Contact Verification */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="size-3.5 text-primary" /> Applicant & Contact
              Credentials
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/30 p-3.5 rounded-xl border border-border/70">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Owner Name
                </span>
                <p className="font-bold text-foreground mt-0.5">
                  {request.ownerName}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Mobile Number
                </span>
                <p className="font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                  <Phone className="size-3 text-muted-foreground" />
                  <span>{request.mobile}</span>
                  {request.documentCheck.mobileVerified ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 text-emerald-500 border-emerald-500/30 bg-emerald-500/10 font-semibold flex items-center gap-0.5"
                    >
                      <CheckCircle2 className="size-2.5" /> OTP Verified
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 text-amber-500 border-amber-500/30 bg-amber-500/10 font-semibold flex items-center gap-0.5"
                    >
                      <Clock className="size-2.5" /> OTP Pending
                    </Badge>
                  )}
                </p>
              </div>

              <div className="sm:col-span-2 pt-1 border-t border-border/40">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Official Email
                </span>
                <p className="font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                  <Mail className="size-3 text-muted-foreground" />
                  <span>{request.email}</span>
                  {request.documentCheck.emailVerified && (
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 text-emerald-500 border-emerald-500/30 bg-emerald-500/10 font-semibold flex items-center gap-0.5"
                    >
                      <CheckCircle2 className="size-2.5" /> Verified
                    </Badge>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Requested Subscription Plan & Capacity */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Building2 className="size-3.5 text-primary" /> Subscription Plan
              & Workspace Scale
            </h4>
            <div className="grid grid-cols-3 gap-2.5 text-xs bg-muted/30 p-3.5 rounded-xl border border-border/70">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Plan Tier
                </span>
                <p className="font-black text-primary text-sm mt-0.5">
                  {request.chosenPlan}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Billing Cycle
                </span>
                <p className="font-bold text-foreground mt-0.5">
                  {request.billingCycle}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Contract Amount
                </span>
                <p className="font-black text-foreground text-sm mt-0.5 tabular-nums">
                  ₹{request.feeAmount.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="pt-2 border-t border-border/40">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Planned Branches
                </span>
                <p className="font-bold text-foreground mt-0.5">
                  {request.branchesPlanned}{" "}
                  {request.branchesPlanned > 1 ? "Branches" : "Branch"}
                </p>
              </div>
              <div className="pt-2 border-t border-border/40">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Planned Seats
                </span>
                <p className="font-bold text-foreground mt-0.5">
                  {request.plannedSeats} Seats
                </p>
              </div>
              <div className="pt-2 border-t border-border/40">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Admin Seats
                </span>
                <p className="font-bold text-foreground mt-0.5">
                  {request.branchesPlanned + 1} Admins
                </p>
              </div>
            </div>
          </div>

          {/* Uploaded Documents List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileCheck2 className="size-3.5 text-primary" /> Uploaded KYC
                Proof ({request.documents.length})
              </h4>
              <span className="text-[11px] font-semibold text-muted-foreground">
                Click to inspect
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {request.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {doc.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {doc.fileName} • {doc.fileSize}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs font-semibold shrink-0"
                    onClick={() => onPreviewDoc(doc, request.libraryName)}
                  >
                    <Eye className="size-3.5 me-1.5" /> View
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Internal Notes & History */}
          {request.notes && (
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Internal Audit Log & Notes
              </h4>
              <div className="p-3 bg-muted/30 border border-border/70 rounded-xl text-xs leading-relaxed text-foreground">
                {request.notes}
              </div>
            </div>
          )}

          {/* Decision Actions Footer */}
          <SheetFooter className="p-0 pt-4 border-t border-border/60 flex flex-col sm:flex-row gap-2 mt-auto">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto text-xs font-bold border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
              onClick={() => onRejectClick(request)}
              disabled={isRejected}
            >
              <XCircle className="size-3.5 me-1.5" />
              {isRejected ? "Rejected" : "Reject Request"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto text-xs font-bold border-sky-500/30 text-sky-500 hover:bg-sky-500/10 hover:text-sky-500"
              onClick={() => onMoreInfoClick(request)}
              disabled={isApproved || isRejected}
            >
              <HelpCircle className="size-3.5 me-1.5" /> Ask More Info
            </Button>

            <Button
              type="button"
              className="w-full sm:w-auto text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white ml-auto"
              onClick={() => onApprove(request)}
              disabled={isApproved || !canApprove}
            >
              <CheckCircle2 className="size-3.5 me-1.5" />
              {isApproved
                ? "Already Approved"
                : !canApprove
                  ? "Verification Incomplete"
                  : "Approve & Provision"}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
