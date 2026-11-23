"use client"

import { useState } from "react"
import { toast } from "sonner"
import { AlertOctagon, Lock, ShieldAlert, Unlock } from "lucide-react"

import type { GraceAndLockedLibrary } from "@/data/platform-admin-data"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { LibraryLogo } from "@/components/platform/library-logo"

interface LockUnlockDialogProps {
  library: GraceAndLockedLibrary | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggleStatus: (
    id: string,
    action: "Lock" | "Unlock" | "Suspend",
    reason: string
  ) => void
}

export function LockUnlockDialog({
  library,
  open,
  onOpenChange,
  onToggleStatus,
}: LockUnlockDialogProps) {
  const [reason, setReason] = useState("")
  const [notifyOwner, setNotifyOwner] = useState(true)

  if (!library) return null

  const isLockedOrSuspended =
    library.status === "Locked" || library.status === "Suspended"
  const actionType = isLockedOrSuspended ? "Unlock" : "Lock"

  const handleConfirm = () => {
    if (!isLockedOrSuspended && !reason.trim()) {
      toast.error(
        "A mandatory reason is required to lock or suspend this library."
      )
      return
    }

    onToggleStatus(
      library.id,
      actionType,
      reason || "Re-activated by Super Admin"
    )

    if (actionType === "Unlock") {
      toast.success(
        `Library "${library.libraryName}" unlocked! Student app access resumed and days unfrozen.`
      )
    } else {
      toast.error(
        `Library "${library.libraryName}" locked. Student app access paused with error banner.`
      )
    }

    setReason("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <LibraryLogo
              name={library.libraryName}
              code={library.libraryCode}
              src={library.logo}
              size="md"
              status={library.status}
              showStatusDot
            />
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold">
                {isLockedOrSuspended
                  ? "Unlock Library Access"
                  : "Lock Library & Pause Services"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {library.libraryName} ({library.libraryCode})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-1 text-xs">
          {/* Impact Summary Box */}
          <div
            className={`p-3 rounded-lg border flex flex-col gap-1.5 ${
              isLockedOrSuspended
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200"
                : "bg-destructive/10 border-destructive/40 text-destructive"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              {isLockedOrSuspended ? (
                <ShieldAlert className="size-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertOctagon className="size-4 shrink-0 text-destructive" />
              )}
              <span>Impact Assessment Summary:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90 pl-1">
              <li>
                <strong>{library.affectedStudents} Registered Students:</strong>{" "}
                {isLockedOrSuspended
                  ? "Student app unblocked; validity days continue."
                  : "Mobile app blocked ('facing some issue'); plan days frozen."}
              </li>
              <li>
                <strong>{library.affectedStaff} Staff Accounts:</strong>{" "}
                {isLockedOrSuspended
                  ? "Full access restored."
                  : "Dashboard features restricted."}
              </li>
            </ul>
          </div>

          {!isLockedOrSuspended ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Mandatory Lock / Suspension Reason *
              </Label>
              <Select onValueChange={(val) => setReason(val)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select standard reason or enter below" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5-day plan grace period expired without payment">
                    5-day plan grace period expired without payment
                  </SelectItem>
                  <SelectItem value="Consecutive payment gateway auto-debit failure">
                    Consecutive payment gateway auto-debit failure
                  </SelectItem>
                  <SelectItem value="Safety or policy compliance check required">
                    Safety or policy compliance check required
                  </SelectItem>
                  <SelectItem value="Requested by library owner / seasonal pause">
                    Requested by library owner / seasonal pause
                  </SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter specific audit notes..."
                className="text-xs h-16 mt-1"
                required
              />
            </div>
          ) : (
            <div className="text-xs text-muted-foreground p-2 rounded-md bg-muted/40 border border-border/50">
              Unlocking will immediately dispatch confirmation to owner (
              {library.ownerName} - {library.phone}) and re-activate student app
              sessions.
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="notifyOwner"
              checked={notifyOwner}
              onCheckedChange={(c) => setNotifyOwner(!!c)}
            />
            <label
              htmlFor="notifyOwner"
              className="text-xs font-medium text-foreground cursor-pointer"
            >
              Dispatch notification to owner via WhatsApp & Email
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

          {isLockedOrSuspended ? (
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Unlock className="size-3.5 me-1.5" />
              Restore Access & Unfreeze Students
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleConfirm}
              className="text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs"
            >
              <Lock className="size-3.5 me-1.5" />
              Lock Library Now
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
