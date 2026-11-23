"use client"

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileCheck2,
  ShieldAlert,
} from "lucide-react"

import type { LibraryRequest } from "@/data/platform-admin-data"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LibraryAvatar } from "@/components/platform/library-logo"

interface PendingRequestsCardProps {
  requests: LibraryRequest[]
  onReview: (request: LibraryRequest) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onViewAll?: () => void
}

export function PendingRequestsCard({
  requests,
  onReview,
  onApprove,
  onViewAll,
}: PendingRequestsCardProps) {
  return (
    <Card className="h-full flex flex-col justify-between rounded-xl border border-border/70 bg-card/90 shadow-xs overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/20">
            <FileCheck2 className="size-4" />
          </div>
          <CardTitle className="text-sm font-bold tracking-tight">
            Library Approvals
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAll}
          className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
        >
          <span>Queue ({requests.length})</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </CardHeader>

      <CardContent className="px-5 py-2 flex-1 flex flex-col divide-y divide-border/40">
        {requests.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            <CheckCircle2 className="size-7 text-emerald-500 mx-auto mb-1.5" />
            <p className="font-bold text-foreground">All caught up</p>
          </div>
        ) : (
          requests.slice(0, 4).map((req) => {
            const isVerified =
              req.documentCheck.emailVerified &&
              req.documentCheck.mobileVerified
            return (
              <div
                key={req.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-muted/35 -mx-2.5 px-2.5 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LibraryAvatar
                    name={req.libraryName}
                    code={req.requestNumber}
                    src={req.logo}
                    size="sm"
                    status={isVerified ? "Active" : "Pending"}
                    showStatusDot
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-bold text-xs text-foreground hover:text-primary cursor-pointer truncate"
                        onClick={() => onReview(req)}
                      >
                        {req.libraryName}
                      </span>
                      <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground">
                        {req.chosenPlan}
                      </span>
                      {req.duplicateWarning && (
                        <span
                          title="Possible duplicate registration"
                          className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-destructive/15 text-destructive"
                        >
                          <ShieldAlert className="size-2.5" />
                          Dup
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                      <span className="truncate">
                        {req.ownerName} · {req.city}
                      </span>
                      <span className="text-border">•</span>
                      {isVerified ? (
                        <span className="text-emerald-500 font-semibold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="size-3" /> Verified
                        </span>
                      ) : (
                        <span className="text-amber-500 font-semibold flex items-center gap-1 shrink-0">
                          <AlertTriangle className="size-3" /> OTP Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReview(req)}
                    className="h-7 px-2 text-xs font-semibold border-border/70 hover:border-primary"
                    title="Review KYC documents"
                  >
                    <Eye className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onApprove(req.id)}
                    className="h-7 px-2.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Approve
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
