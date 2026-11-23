"use client"

import { useState } from "react"
import { ShieldAlert } from "lucide-react"

import type { LibraryRequest } from "@/data/platform/platform-data"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface RejectRequestDialogProps {
  request: LibraryRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (req: LibraryRequest, reason: string) => Promise<void> | void
}

export function RejectRequestDialog({
  request,
  open,
  onOpenChange,
  onConfirm,
}: RejectRequestDialogProps) {
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!request) return null

  const handleSubmit = async () => {
    if (!reason.trim()) return
    try {
      setIsSubmitting(true)
      await onConfirm(request, reason.trim())
      setReason("")
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          setReason("")
        }
        onOpenChange(val)
      }}
    >
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-rose-500 flex items-center gap-2">
            <ShieldAlert className="size-5 shrink-0" /> Reject Library Request
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Rejecting will log the justification in the audit ledger and notify{" "}
            <strong className="text-foreground">{request.ownerName}</strong> (
            {request.libraryName}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label className="text-xs font-bold text-foreground">
            Rejection Justification *
          </Label>
          <Textarea
            placeholder="e.g. Unverifiable commercial registration, incomplete KYC documentation, or duplicate application."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="text-xs min-h-[100px] resize-y"
          />
          <p className="text-[11px] text-muted-foreground">
            This reason will be included in the automated applicant email.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleSubmit}
            disabled={!reason.trim() || isSubmitting}
            className="text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs"
          >
            {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
