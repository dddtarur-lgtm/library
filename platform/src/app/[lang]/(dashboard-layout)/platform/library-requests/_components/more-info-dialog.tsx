"use client"

import { useState } from "react"
import { HelpCircle } from "lucide-react"

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

interface MoreInfoDialogProps {
  request: LibraryRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (req: LibraryRequest, query: string) => Promise<void> | void
}

export function MoreInfoDialog({
  request,
  open,
  onOpenChange,
  onConfirm,
}: MoreInfoDialogProps) {
  const [query, setQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!request) return null

  const handleSubmit = async () => {
    if (!query.trim()) return
    try {
      setIsSubmitting(true)
      await onConfirm(request, query.trim())
      setQuery("")
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
          setQuery("")
        }
        onOpenChange(val)
      }}
    >
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-sky-500 flex items-center gap-2">
            <HelpCircle className="size-5 shrink-0" /> Request Clarification /
            Documents
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Dispatches an official clarification inquiry to{" "}
            <strong className="text-foreground">{request.ownerName}</strong> (
            {request.email}). The application status will shift to &ldquo;More
            information needed&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label className="text-xs font-bold text-foreground">
            Information / Documents Needed *
          </Label>
          <Textarea
            placeholder="e.g. Please upload an updated commercial lease agreement showing library carpet area and verify your mobile OTP."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-xs min-h-[100px] resize-y"
          />
          <p className="text-[11px] text-muted-foreground">
            The applicant will receive a secure portal link to upload the
            requested items.
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
            size="sm"
            onClick={handleSubmit}
            disabled={!query.trim() || isSubmitting}
            className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? "Sending..." : "Send Clarification Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
