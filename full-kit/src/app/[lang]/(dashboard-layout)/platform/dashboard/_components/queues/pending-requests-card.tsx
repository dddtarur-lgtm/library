"use client"

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileCheck2,
  ShieldAlert,
  XCircle,
} from "lucide-react"

import type { LibraryRequest } from "@/data/platform-admin-data"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
  onReject,
  onViewAll,
}: PendingRequestsCardProps) {
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <FileCheck2 className="size-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">Pending Library Requests</CardTitle>
            <p className="text-xs text-muted-foreground">Super Admin approval queue (Documents & KYC verification)</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onViewAll} className="h-7 text-xs gap-1 font-semibold">
          <span>Queue ({requests.length})</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </CardHeader>

      <CardContent className="pt-2 px-3 flex-1 flex flex-col justify-between divide-y divide-border/40">
        {requests.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-1.5" />
            <p className="font-bold text-foreground">No requests waiting</p>
            <p>All library registrations have been processed. Great work!</p>
          </div>
        ) : (
          requests.slice(0, 4).map((req) => (
            <div key={req.id} className="py-2.5 flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground hover:text-primary cursor-pointer" onClick={() => onReview(req)}>
                      {req.libraryName}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-border">
                      {req.requestNumber}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-semibold">
                      {req.chosenPlan} ({req.billingCycle})
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {req.ownerName} • {req.city}, {req.state} • {req.mobile}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReview(req)}
                    className="h-7 px-2 text-xs font-semibold gap-1 hover:border-primary"
                  >
                    <Eye className="size-3" />
                    <span>Review</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onApprove(req.id)}
                    className="h-7 px-2.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <span>Approve</span>
                  </Button>
                </div>
              </div>

              {/* Status and warnings */}
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground flex items-center gap-1">
                    {req.documentCheck.emailVerified && req.documentCheck.mobileVerified ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="size-3" /> Contact Verified
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                        <AlertTriangle className="size-3" /> OTP Pending
                      </span>
                    )}
                  </span>

                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {req.documents.length} KYC Docs Uploaded
                  </span>
                </div>

                {req.duplicateWarning && (
                  <span className="text-destructive font-bold text-[10px] flex items-center gap-0.5 bg-destructive/10 px-1.5 py-0.5 rounded">
                    <ShieldAlert className="size-3" /> Duplicate Notice
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

