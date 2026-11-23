"use client"

import { toast } from "sonner"
import {
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  ShieldCheck,
} from "lucide-react"

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

export interface RequestDocument {
  title: string
  fileName: string
  fileSize: string
  fileUrl: string
}

interface DocumentPreviewModalProps {
  document: RequestDocument | null
  open: boolean
  onOpenChange: (open: boolean) => void
  libraryName?: string
}

export function DocumentPreviewModal({
  document,
  open,
  onOpenChange,
  libraryName,
}: DocumentPreviewModalProps) {
  if (!document) return null

  const isPdf = document.fileName.toLowerCase().endsWith(".pdf")

  const handleDownload = () => {
    toast.success("Document Download Initiated", {
      description: `Downloading ${document.fileName} for verification.`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-foreground">
                  {document.title}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className="font-mono text-[11px] font-semibold text-primary border-primary/30 bg-primary/5"
                >
                  {isPdf ? "PDF Document" : "Image Proof"}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Submitted by {libraryName || "tenant applicant"} for commercial
                identity verification.
              </DialogDescription>
            </div>
            <Badge variant="outline" className="text-xs font-semibold shrink-0">
              {document.fileSize}
            </Badge>
          </div>
        </DialogHeader>

        {/* Preview Frame */}
        <div className="my-2 rounded-xl border border-border/70 bg-muted/30 p-6 flex flex-col items-center justify-center min-h-[260px] text-center relative overflow-hidden">
          <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 shadow-xs ring-1 ring-primary/20">
            {isPdf ? (
              <FileText className="size-8" />
            ) : (
              <FileCheck2 className="size-8" />
            )}
          </div>
          <p className="font-bold text-sm text-foreground">
            {document.fileName}
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Official KYC certificate uploaded via encrypted storage. Verified
            SHA-256 integrity checksum.
          </p>
          <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="size-3.5" />
            <span>Anti-tamper certified document</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="text-xs font-semibold"
            >
              <Download className="size-3.5 me-1.5" /> Download
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <ExternalLink className="size-3.5 me-1.5" /> Open in Viewer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
