"use client"

import { useState } from "react"
import { Bell, Megaphone, Send } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

interface PlatformNotificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PlatformNotificationDialog({
  open,
  onOpenChange,
}: PlatformNotificationDialogProps) {
  const [target, setTarget] = useState("all")
  const [priority, setPriority] = useState("Normal")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [sendEmail, setSendEmail] = useState(true)
  const [stickyBanner, setStickyBanner] = useState(false)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error("Please enter both a title and message body.")
      return
    }

    toast.success(
      `Platform announcement "${title}" broadcast successfully to ${target === "all" ? "142 libraries" : "selected libraries"}.`
    )
    setTitle("")
    setMessage("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Megaphone className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Send Platform Notification
              </DialogTitle>
              <DialogDescription className="text-xs">
                Broadcast system notices, maintenance alerts, or policy updates to libraries.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSend} className="space-y-3.5 py-1 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Target Audience</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All 142 Libraries</SelectItem>
                  <SelectItem value="grace-locked" className="text-xs">Libraries in Grace / Locked (7)</SelectItem>
                  <SelectItem value="expiring-soon" className="text-xs">Plans Expiring in 7 Days (4)</SelectItem>
                  <SelectItem value="active-only" className="text-xs">Active Libraries Only (128)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Priority Urgency</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal" className="text-xs">Normal (Inbox only)</SelectItem>
                  <SelectItem value="High" className="text-xs">High (Header badge)</SelectItem>
                  <SelectItem value="Urgent" className="text-xs">Urgent (Sticky Top Banner)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Announcement Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled Maintenance Notice or GST Invoicing Update"
              className="h-8 text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Message Body *</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide clear, concise details without fluff..."
              className="text-xs h-24"
              required
            />
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="sendEmail"
                checked={sendEmail}
                onCheckedChange={(c) => setSendEmail(!!c)}
              />
              <label htmlFor="sendEmail" className="text-xs font-medium cursor-pointer">
                Send copy via platform email account (Platform-funded)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="stickyBanner"
                checked={stickyBanner}
                onCheckedChange={(c) => setStickyBanner(!!c)}
              />
              <label htmlFor="stickyBanner" className="text-xs font-medium cursor-pointer">
                Display as persistent top warning banner on library admin header
              </label>
            </div>
          </div>

          <DialogFooter className="border-t border-border/60 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            >
              <Send className="size-3.5 me-1.5" />
              Broadcast Notification
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

