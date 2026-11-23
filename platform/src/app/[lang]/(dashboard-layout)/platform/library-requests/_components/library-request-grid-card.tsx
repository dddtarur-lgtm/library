"use client"

import { toast } from "sonner"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  FileCheck2,
  HelpCircle,
  MapPin,
  MoreVertical,
  Phone,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from "lucide-react"

import type { LibraryStatusTone } from "@/components/platform/library-logo"
import type { LibraryRequest } from "@/data/platform/platform-data"
import type { RequestDocument } from "./document-preview-modal"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LibraryLogo } from "@/components/platform/library-logo"

interface LibraryRequestGridCardProps {
  request: LibraryRequest
  onReview: (req: LibraryRequest) => void
  onApprove: (req: LibraryRequest) => void
  onRejectClick: (req: LibraryRequest) => void
  onMoreInfoClick: (req: LibraryRequest) => void
  onPreviewDoc: (doc: RequestDocument, libraryName: string) => void
}

export function LibraryRequestGridCard({
  request,
  onReview,
  onApprove,
  onRejectClick,
  onMoreInfoClick,
  onPreviewDoc,
}: LibraryRequestGridCardProps) {
  const isApproved = request.status === "Approved"
  const isRejected = request.status === "Rejected"
  const isPending = request.status === "Pending"
  const isMoreInfo = request.status === "More information needed"

  const statusTone: LibraryStatusTone = isApproved
    ? "Active"
    : isRejected
      ? "Locked"
      : "Pending"

  const topAccent = isApproved
    ? "from-emerald-500/70 via-emerald-500/25 to-transparent"
    : isPending
      ? "from-amber-500/70 via-amber-500/25 to-transparent"
      : isMoreInfo
        ? "from-sky-500/70 via-sky-500/25 to-transparent"
        : "from-rose-500/70 via-rose-500/25 to-transparent"

  const canApprove =
    request.documentCheck.emailVerified && request.documentCheck.mobileVerified

  const copyContact = () => {
    navigator.clipboard?.writeText(
      `${request.ownerName} | ${request.mobile} | ${request.email}`
    )
    toast.success("Contact Details Copied", {
      description: `${request.ownerName}'s contact copied to clipboard.`,
    })
  }

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card/90 backdrop-blur-xs transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5">
      {/* Top Gradient Accent */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r",
          topAccent
        )}
      />

      <CardContent className="p-4 sm:p-5 flex flex-col gap-4 flex-1">
        {/* Header: Request ID, Date & Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <span className="font-bold text-foreground">
              {request.requestNumber}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[11px]">
              <Clock className="size-3 shrink-0" />
              {request.submittedDate.split(",")[0]}
            </span>
          </div>

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
            className="font-bold text-[11px] px-2 py-0.5"
          >
            {request.status}
          </Badge>
        </div>

        {/* Identity & Location */}
        <div className="flex items-start gap-3 min-w-0">
          <LibraryLogo
            name={request.libraryName}
            code={request.requestNumber}
            src={request.logo}
            size="md"
            status={statusTone}
            showStatusDot
            interactive
          />

          <div className="min-w-0 flex-1">
            <h3
              onClick={() => onReview(request)}
              className="text-base font-black tracking-tight text-foreground truncate cursor-pointer hover:text-primary transition-colors"
              title={request.libraryName}
            >
              {request.libraryName}
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 truncate">
                <MapPin className="size-3 shrink-0 text-primary" />
                {request.city}, {request.state}
              </span>
              <span>•</span>
              <span className="text-[11px] font-semibold text-foreground/80">
                {request.branchesPlanned}{" "}
                {request.branchesPlanned > 1 ? "Branches" : "Branch"}
              </span>
            </div>
          </div>
        </div>

        {/* Duplicate Warning Alert Banner if flagged */}
        {request.duplicateWarning && (
          <div className="p-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500 text-[11px] flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="size-3.5 shrink-0 text-rose-500" />
            <span className="truncate">
              Duplicate Warning: {request.duplicateWarning}
            </span>
          </div>
        )}

        {/* Essential Info Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs bg-muted/30 p-3 rounded-xl border border-border/60">
          {/* Owner details */}
          <div className="min-w-0 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <User className="size-3" /> Owner
            </p>
            <p className="font-bold text-foreground truncate text-xs">
              {request.ownerName}
            </p>
            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
              <Phone className="size-2.5 shrink-0" /> {request.mobile}
            </p>
          </div>

          {/* Plan & Commercials */}
          <div className="min-w-0 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="size-3 text-primary" /> Plan & Value
            </p>
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-black text-primary text-xs">
                {request.chosenPlan}
              </span>
              <span className="text-[10px] text-muted-foreground">
                ({request.billingCycle})
              </span>
            </div>
            <p className="font-black text-foreground text-xs tabular-nums">
              ₹{request.feeAmount.toLocaleString("en-IN")}
            </p>
          </div>

          {/* Capacity Scale */}
          <div className="col-span-2 pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="size-3 text-muted-foreground" /> Capacity:
            </span>
            <span className="font-semibold text-foreground">
              {request.plannedSeats} planned seats •{" "}
              {request.branchesPlanned + 1} admins
            </span>
          </div>
        </div>

        {/* Verification Checks & KYC Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">
              Verification & KYC
            </span>
            <span className="text-muted-foreground font-mono text-[10px]">
              {request.documents.length} Docs
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Email Verified */}
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border",
                request.documentCheck.emailVerified
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                  : "bg-muted text-muted-foreground border-border"
              )}
            >
              <CheckCircle2 className="size-2.5" /> Email
            </span>

            {/* Mobile OTP */}
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border",
                request.documentCheck.mobileVerified
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                  : "bg-amber-500/10 text-amber-500 border-amber-500/25"
              )}
            >
              {request.documentCheck.mobileVerified ? (
                <CheckCircle2 className="size-2.5" />
              ) : (
                <Clock className="size-2.5" />
              )}
              OTP {request.documentCheck.mobileVerified ? "Done" : "Pending"}
            </span>

            {/* KYC Docs Quick Preview Trigger */}
            {request.documents.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onPreviewDoc(request.documents[0], request.libraryName)
                }
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-colors cursor-pointer"
                title={`Preview ${request.documents[0].title}`}
              >
                <FileCheck2 className="size-2.5" />
                <span>{request.documents[0].title.split(" ")[0]}</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onReview(request)}
            className="text-xs font-bold flex-1 bg-background hover:bg-muted"
          >
            <Eye className="size-3.5 me-1.5" /> Review & Decide
          </Button>

          {isPending && canApprove && (
            <Button
              type="button"
              size="sm"
              onClick={() => onApprove(request)}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-xs"
            >
              <CheckCircle2 className="size-3.5 me-1" /> Approve
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0 text-muted-foreground hover:text-foreground shrink-0"
                aria-label="More actions"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onReview(request)}>
                <Eye className="size-3.5 me-2" /> Inspect KYC Dossier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyContact}>
                <Copy className="size-3.5 me-2" /> Copy Contact Details
              </DropdownMenuItem>

              {!isApproved && !isRejected && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onMoreInfoClick(request)}>
                    <HelpCircle className="size-3.5 me-2 text-sky-500" />
                    Request Clarification
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onRejectClick(request)}
                    className="text-rose-500 focus:text-rose-500"
                  >
                    <XCircle className="size-3.5 me-2" />
                    Reject Application
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
