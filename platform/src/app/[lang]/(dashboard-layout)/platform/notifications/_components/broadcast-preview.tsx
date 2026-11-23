"use client"

import { useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Info,
  Monitor,
  Paperclip,
  Smartphone,
  X,
} from "lucide-react"

import type { BroadcastDraft, BroadcastSeverity } from "./broadcast-types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface BroadcastPreviewProps {
  draft: BroadcastDraft
}

const SEVERITY_META: Record<
  BroadcastSeverity,
  {
    label: string
    barClass: string
    badgeClass: string
    icon: typeof Info
  }
> = {
  info: {
    label: "INFO",
    barClass: "bg-sky-500/15 border-sky-500/30 text-sky-900 dark:text-sky-100",
    badgeClass:
      "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25",
    icon: Info,
  },
  success: {
    label: "UPDATE",
    barClass:
      "bg-emerald-500/15 border-emerald-500/30 text-emerald-900 dark:text-emerald-100",
    badgeClass:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    icon: CheckCircle2,
  },
  warning: {
    label: "NOTICE",
    barClass:
      "bg-amber-500/15 border-amber-500/35 text-amber-950 dark:text-amber-100",
    badgeClass:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
    icon: AlertTriangle,
  },
  critical: {
    label: "CRITICAL",
    barClass:
      "bg-destructive/15 border-destructive/35 text-destructive dark:text-red-200",
    badgeClass: "bg-destructive/15 text-destructive border-destructive/25",
    icon: AlertCircle,
  },
}

export function BroadcastPreview({ draft }: BroadcastPreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop")
  const [testModalOpen, setTestModalOpen] = useState(false)

  const severity = SEVERITY_META[draft.severity]
  const SeverityIcon = severity.icon

  const renderAttachmentChip = () => {
    if (!draft.attachment) return null
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/35 px-2.5 py-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-7 rounded-md bg-primary/12 text-primary flex items-center justify-center shrink-0">
            <FileText className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate text-[11px]">
              {draft.attachment.name}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {draft.attachment.sizeLabel}
            </p>
          </div>
        </div>
        <Download className="size-3.5 text-muted-foreground shrink-0" />
      </div>
    )
  }

  const renderDialogBody = () => (
    <div className="w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden">
      {draft.dialogVariant === "half_banner" && (
        <div className="relative h-32 bg-gradient-to-r from-primary/90 via-primary to-indigo-600 flex items-center justify-center overflow-hidden">
          {draft.imageUrl ? (
            <img
              src={draft.imageUrl}
              alt="Broadcast banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <Bell className="size-9 text-primary-foreground/80" />
          )}
        </div>
      )}

      {draft.dialogVariant === "full_bleed" && (
        <div className="relative h-40 bg-gradient-to-br from-indigo-600 via-primary to-purple-700 p-4 flex flex-col justify-end text-white overflow-hidden">
          {draft.imageUrl && (
            <>
              <img
                src={draft.imageUrl}
                alt="Broadcast poster"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </>
          )}
          <div className="relative z-10 space-y-1">
            <Badge className="bg-white/20 text-white border-0 text-[10px] font-bold">
              {severity.label}
            </Badge>
            <h4 className="font-bold text-sm leading-snug">
              {draft.title || "Untitled Broadcast"}
            </h4>
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {draft.dialogVariant !== "full_bleed" && (
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <Badge
                variant="outline"
                className={`text-[10px] font-bold ${severity.badgeClass}`}
              >
                <SeverityIcon className="size-3 mr-1" />
                {severity.label}
              </Badge>
              <h4 className="font-bold text-sm text-foreground leading-snug">
                {draft.title || "Untitled Broadcast"}
              </h4>
            </div>
            {draft.dismissible && (
              <X className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
          {draft.message || "Enter broadcast message content..."}
        </p>

        {renderAttachmentChip()}

        <div className="pt-1 flex items-center justify-end gap-2">
          {draft.dismissible && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
            >
              Dismiss
            </Button>
          )}
          {draft.ctaLabel && (
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-bold gap-1"
            >
              <span>{draft.ctaLabel}</span>
              {draft.ctaUrl && <ExternalLink className="size-3" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Eye className="size-3.5 text-primary" />
          Live Preview
        </span>

        <div className="flex items-center gap-2">
          {draft.surface === "dialog_modal" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs font-semibold"
              onClick={() => setTestModalOpen(true)}
            >
              Test Modal
            </Button>
          )}
          <div className="inline-flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border border-border">
            <Button
              type="button"
              variant={device === "desktop" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={() => setDevice("desktop")}
            >
              <Monitor className="size-3 mr-1" />
              Desktop
            </Button>
            <Button
              type="button"
              variant={device === "mobile" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={() => setDevice("mobile")}
            >
              <Smartphone className="size-3 mr-1" />
              Mobile
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Canvas */}
      <div
        className={`mx-auto rounded-2xl border border-border bg-muted/35 p-4 flex flex-col justify-center min-h-[380px] transition-all ${
          device === "mobile" ? "max-w-[340px]" : "w-full"
        }`}
      >
        {draft.surface === "header_alert" && (
          <div className="w-full rounded-xl border border-border bg-background overflow-hidden shadow-lg">
            {/* Pinned Header Alert Strip */}
            <div
              className={`px-3 py-2.5 border-b flex items-start sm:items-center justify-between gap-2.5 ${severity.barClass}`}
            >
              <div className="flex items-start sm:items-center gap-2 min-w-0">
                <SeverityIcon className="size-4 shrink-0 mt-0.5 sm:mt-0" />
                <div className="min-w-0 text-xs space-y-0.5">
                  <p className="font-bold leading-tight">
                    {draft.title || "Header Alert Title"}
                  </p>
                  <p className="text-[11px] opacity-90 line-clamp-2">
                    {draft.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {draft.attachment && (
                  <Badge
                    variant="outline"
                    className="h-6 text-[10px] bg-background/80 gap-1"
                  >
                    <Paperclip className="size-2.5" />
                    PDF
                  </Badge>
                )}
                {draft.ctaLabel && (
                  <Button
                    type="button"
                    size="sm"
                    className="h-6 px-2 text-[11px] bg-primary text-primary-foreground font-bold"
                  >
                    {draft.ctaLabel}
                  </Button>
                )}
                {draft.dismissible && (
                  <X className="size-3.5 opacity-70 ml-0.5" />
                )}
              </div>
            </div>

            {/* Simulated App Shell Body */}
            <div className="p-4 space-y-3 opacity-60">
              <div className="flex items-center justify-between">
                <div className="h-3 w-28 rounded bg-muted" />
                <div className="h-6 w-6 rounded-full bg-muted" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="h-12 rounded-lg bg-muted/80" />
                <div className="h-12 rounded-lg bg-muted/80" />
                <div className="h-12 rounded-lg bg-muted/80" />
              </div>
              <div className="h-20 rounded-lg bg-muted/60" />
            </div>
          </div>
        )}

        {draft.surface === "dialog_modal" && renderDialogBody()}

        {draft.surface === "in_app_push" && (
          <div className="w-full space-y-3">
            <div className="rounded-xl border border-border bg-card p-3.5 shadow-md space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Bell className="size-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase text-primary">
                      Platform Notice
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Just now
                    </span>
                  </div>
                  <p className="text-xs font-bold text-foreground">
                    {draft.title || "Notification Title"}
                  </p>
                  <p className="text-[11px] text-muted-foreground line-clamp-3">
                    {draft.message}
                  </p>
                </div>
              </div>

              {draft.imageUrl && (
                <img
                  src={draft.imageUrl}
                  alt="Attachment thumbnail"
                  className="w-full h-24 object-cover rounded-lg border border-border"
                />
              )}

              {renderAttachmentChip()}

              {draft.ctaLabel && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] font-semibold gap-1"
                  >
                    {draft.ctaLabel}
                    <ExternalLink className="size-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Real Interactive Modal Test */}
      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent className="sm:max-w-md p-0 bg-transparent border-0 shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>{draft.title || "Broadcast Preview"}</DialogTitle>
          </DialogHeader>
          {renderDialogBody()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
