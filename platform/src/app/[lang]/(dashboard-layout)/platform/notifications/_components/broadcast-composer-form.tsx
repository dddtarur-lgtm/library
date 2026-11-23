"use client"

import {
  Bell,
  CalendarClock,
  Image as ImageIcon,
  Layers,
  Link2,
  Megaphone,
  Paperclip,
  Send,
  Trash2,
  Upload,
} from "lucide-react"

import type {
  BroadcastDraft,
  BroadcastSeverity,
  BroadcastSurface,
  DialogVariant,
} from "./broadcast-types"

import { initialAllLibrariesList } from "@/data/platform/platform-data"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { LibraryAvatar } from "@/components/platform/library-logo"

interface BroadcastComposerFormProps {
  draft: BroadcastDraft
  onChange: (updater: (prev: BroadcastDraft) => BroadcastDraft) => void
  onSubmit: () => void
  hideFooter?: boolean
}

const SURFACE_OPTIONS: {
  id: BroadcastSurface
  title: string
  hint: string
  icon: typeof Megaphone
}[] = [
  {
    id: "header_alert",
    title: "Header Alert",
    hint: "Pinned top bar",
    icon: Megaphone,
  },
  {
    id: "dialog_modal",
    title: "Dialog Modal",
    hint: "Rich popup card",
    icon: Layers,
  },
  {
    id: "in_app_push",
    title: "Push & Feed",
    hint: "Bell + mobile push",
    icon: Bell,
  },
]

const DIALOG_VARIANTS: { id: DialogVariant; label: string; desc: string }[] = [
  { id: "info_card", label: "Info Card", desc: "Severity badge + text" },
  { id: "half_banner", label: "Image + Text", desc: "Top banner graphic" },
  { id: "full_bleed", label: "Full-Bleed", desc: "Visual hero overlay" },
  {
    id: "attachment_notice",
    label: "Attachment",
    desc: "Circular / PDF focus",
  },
]

export function BroadcastComposerForm({
  draft,
  onChange,
  onSubmit,
  hideFooter = false,
}: BroadcastComposerFormProps) {
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onChange((prev) => ({ ...prev, imageUrl: url }))
  }

  const handleAttachmentFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const sizeKb = Math.max(1, Math.round(file.size / 1024))
    const sizeLabel =
      sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`
    onChange((prev) => ({
      ...prev,
      attachment: {
        name: file.name,
        sizeLabel,
        type: file.type || "application/octet-stream",
      },
    }))
  }

  const selectedLibrary = initialAllLibrariesList.find(
    (l) => l.id === draft.targetLibraryId
  )

  return (
    <Card className="border-border/80 bg-card rounded-xl overflow-hidden">
      <CardHeader className="p-4 border-b border-border/70">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Send className="size-4 text-primary" />
          Broadcast Configuration
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-5">
        {/* 1. Broadcast Surface Type */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">
            Broadcast Type
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SURFACE_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const active = draft.surface === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    onChange((prev) => ({ ...prev, surface: opt.id }))
                  }
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                    active
                      ? "border-primary bg-primary/10 ring-1 ring-primary/25"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground">
                      {opt.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {opt.hint}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Dialog Variant (when Dialog Modal is selected) */}
        {draft.surface === "dialog_modal" && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Dialog Layout Style
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DIALOG_VARIANTS.map((v) => {
                const active = draft.dialogVariant === v.id
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() =>
                      onChange((prev) => ({ ...prev, dialogVariant: v.id }))
                    }
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <p className="text-xs font-bold text-foreground">
                      {v.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {v.desc}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 3. Audience & Severity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Target Audience
            </Label>
            <Select
              value={draft.audience}
              onValueChange={(v) =>
                onChange((prev) => ({ ...prev, audience: v }))
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Libraries (142 Libs)</SelectItem>
                <SelectItem value="pro">
                  Pro & Enterprise Tiers (32 Libs)
                </SelectItem>
                <SelectItem value="grace">
                  Grace or Locked Accounts (7 Libs)
                </SelectItem>
                <SelectItem value="students">
                  Student Mobile App Users
                </SelectItem>
                <SelectItem value="single">Specific Library</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Alert Tone / Severity
            </Label>
            <Select
              value={draft.severity}
              onValueChange={(v) =>
                onChange((prev) => ({
                  ...prev,
                  severity: v as BroadcastSeverity,
                }))
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Information (Blue)</SelectItem>
                <SelectItem value="success">
                  Feature / Update (Green)
                </SelectItem>
                <SelectItem value="warning">
                  Notice / Warning (Amber)
                </SelectItem>
                <SelectItem value="critical">Critical Alert (Red)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Specific Library Selector with LibraryAvatar */}
        {draft.audience === "single" && (
          <div className="space-y-1.5 rounded-lg border border-border/80 bg-muted/20 p-3">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Select Target Library
            </Label>
            <div className="flex items-center gap-3">
              {selectedLibrary && (
                <LibraryAvatar
                  name={selectedLibrary.name}
                  code={selectedLibrary.code}
                  src={selectedLibrary.logo}
                  size="sm"
                />
              )}
              <Select
                value={draft.targetLibraryId || initialAllLibrariesList[0]?.id}
                onValueChange={(v) =>
                  onChange((prev) => ({ ...prev, targetLibraryId: v }))
                }
              >
                <SelectTrigger className="h-9 text-xs flex-1 bg-background">
                  <SelectValue placeholder="Choose library..." />
                </SelectTrigger>
                <SelectContent>
                  {initialAllLibrariesList.map((lib) => (
                    <SelectItem key={lib.id} value={lib.id}>
                      {lib.name} ({lib.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* 4. Title & Body */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Title / Headline *
            </Label>
            <Input
              value={draft.title}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter broadcast headline..."
              className="h-9 text-xs font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Information / Message *
            </Label>
            <Textarea
              value={draft.message}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, message: e.target.value }))
              }
              placeholder="Write announcement details..."
              rows={3}
              className="text-xs"
            />
          </div>
        </div>

        {/* 5. Action Link (CTA) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-border/70 bg-muted/15 p-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
              <Link2 className="size-3" />
              Button / Link Label
            </Label>
            <Input
              value={draft.ctaLabel}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, ctaLabel: e.target.value }))
              }
              placeholder="e.g. View Circular"
              className="h-8 text-xs bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Target URL / Route
            </Label>
            <Input
              value={draft.ctaUrl}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, ctaUrl: e.target.value }))
              }
              placeholder="https://... or /platform/billing"
              className="h-8 text-xs font-mono bg-background"
            />
          </div>
        </div>

        {/* 6. Image Banner & File Attachment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Image */}
          <div className="rounded-lg border border-border/80 bg-muted/15 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                <ImageIcon className="size-3.5" />
                Banner Image
              </Label>
              {draft.imageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-[11px] text-destructive"
                  onClick={() =>
                    onChange((prev) => ({ ...prev, imageUrl: "" }))
                  }
                >
                  Remove
                </Button>
              )}
            </div>
            <Input
              value={draft.imageUrl}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, imageUrl: e.target.value }))
              }
              placeholder="Paste image URL or upload..."
              className="h-8 text-xs bg-background"
            />
            <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary cursor-pointer hover:underline">
              <Upload className="size-3" />
              Upload Image File
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFile}
              />
            </label>
          </div>

          {/* Attachment */}
          <div className="rounded-lg border border-border/80 bg-muted/15 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                <Paperclip className="size-3.5" />
                File Attachment
              </Label>
              {draft.attachment && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 text-destructive"
                  onClick={() =>
                    onChange((prev) => ({ ...prev, attachment: null }))
                  }
                >
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>

            {draft.attachment ? (
              <div className="text-xs rounded-md border border-border bg-background px-2.5 py-1.5">
                <p className="font-semibold truncate">
                  {draft.attachment.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {draft.attachment.sizeLabel}
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                No PDF or document attached
              </p>
            )}

            <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary cursor-pointer hover:underline">
              <Upload className="size-3" />
              {draft.attachment ? "Replace File" : "Attach PDF / Doc"}
              <input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleAttachmentFile}
              />
            </label>
          </div>
        </div>

        {/* 7. Channels, Dismissible & Schedule */}
        <div className="space-y-3 pt-2 border-t border-border/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={draft.channels.inApp}
                  onCheckedChange={(c) =>
                    onChange((prev) => ({
                      ...prev,
                      channels: { ...prev.channels, inApp: !!c },
                    }))
                  }
                />
                In-App
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={draft.channels.push}
                  onCheckedChange={(c) =>
                    onChange((prev) => ({
                      ...prev,
                      channels: { ...prev.channels, push: !!c },
                    }))
                  }
                />
                Mobile Push
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={draft.channels.email}
                  onCheckedChange={(c) =>
                    onChange((prev) => ({
                      ...prev,
                      channels: { ...prev.channels, email: !!c },
                    }))
                  }
                />
                Email
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="dismissible-toggle"
                checked={draft.dismissible}
                onCheckedChange={(checked) =>
                  onChange((prev) => ({ ...prev, dismissible: checked }))
                }
              />
              <Label
                htmlFor="dismissible-toggle"
                className="text-xs cursor-pointer"
              >
                Dismissible
              </Label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
            <div className="flex items-center gap-2">
              <Switch
                id="schedule-toggle"
                checked={draft.scheduleEnabled}
                onCheckedChange={(checked) =>
                  onChange((prev) => ({ ...prev, scheduleEnabled: checked }))
                }
              />
              <Label
                htmlFor="schedule-toggle"
                className="text-xs font-medium cursor-pointer flex items-center gap-1.5"
              >
                <CalendarClock className="size-3.5 text-primary" />
                Schedule for Later
              </Label>
            </div>

            {draft.scheduleEnabled && (
              <Input
                type="datetime-local"
                value={draft.scheduledAt}
                onChange={(e) =>
                  onChange((prev) => ({ ...prev, scheduledAt: e.target.value }))
                }
                className="h-8 text-xs w-full sm:w-52 bg-background"
              />
            )}
          </div>
        </div>
      </CardContent>

      {!hideFooter && (
        <CardFooter className="p-4 border-t border-border/70 flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            onClick={onSubmit}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold gap-1.5"
          >
            <Send className="size-3.5" />
            {draft.scheduleEnabled
              ? "Schedule Broadcast"
              : "Dispatch Broadcast"}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
