"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { platformService } from "@/services/platform-service"
import { toast } from "sonner"
import {
  Building2,
  Clock,
  CreditCard,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
  SlidersHorizontal,
  Unlock,
  UserCheck,
  Users,
} from "lucide-react"

import type { PlatformLibraryRecord } from "@/data/platform/platform-data"

import { cn } from "@/lib/utils"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon"
import { LibraryLogo } from "@/components/platform/library-logo"

interface LibraryProfileHeaderProps {
  library: PlatformLibraryRecord
  logoUrl: string
  planStatus: PlatformLibraryRecord["planStatus"]
  libraryStatus: PlatformLibraryRecord["libraryStatus"]
  onPlanStatusChange: (next: PlatformLibraryRecord["planStatus"]) => void
  onLibraryStatusChange: (next: PlatformLibraryRecord["libraryStatus"]) => void
  onJumpToControls: () => void
}

export function LibraryProfileHeader({
  library,
  logoUrl,
  planStatus,
  libraryStatus,
  onPlanStatusChange,
  onLibraryStatusChange,
  onJumpToControls,
}: LibraryProfileHeaderProps) {
  const params = useParams()
  const lang = params.lang as string
  const cleanPhone = library.ownerPhone.replace(/[^0-9]/g, "")
  const occupancyPct =
    library.totalSeats > 0
      ? Math.min(
          100,
          Math.round((library.liveStudents / library.totalSeats) * 100)
        )
      : 0

  const [extendOpen, setExtendOpen] = useState(false)
  const [extendDays, setExtendDays] = useState("5")
  const [extendReason, setExtendReason] = useState("")

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(library.planFee.toString())
  const [paymentMethod, setPaymentMethod] = useState("Razorpay")

  const [suspendOpen, setSuspendOpen] = useState(false)
  const [suspendReason, setSuspendReason] = useState("Compliance Review")

  const [impersonateOpen, setImpersonateOpen] = useState(false)
  const [impersonateReason, setImpersonateReason] = useState("")
  const [isImpersonating, setIsImpersonating] = useState(false)

  const isLocked = planStatus === "Locked" || libraryStatus === "Locked"

  const handleImpersonateSubmit = async () => {
    if (!impersonateReason.trim()) {
      toast.error("Reason required for audit trail")
      return
    }
    setIsImpersonating(true)
    try {
      const res = await platformService.impersonateLibrary(
        library.id,
        impersonateReason.trim()
      )
      toast.success(
        "Impersonation token generated (15m valid). Launching session..."
      )
      setImpersonateOpen(false)
      setImpersonateReason("")
      if (typeof window !== "undefined") {
        if (res?.view_as_token) {
          sessionStorage.setItem("view_as_token", res.view_as_token)
          sessionStorage.setItem("impersonated_org_id", library.id)
        }
        window.open(
          `/${lang}/library?impersonate=true&org_id=${library.id}`,
          "_blank"
        )
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to impersonate library"
      )
    } finally {
      setIsImpersonating(false)
    }
  }

  const handleExtendGrace = async () => {
    if (!extendReason.trim()) {
      toast.error("Reason Required")
      return
    }
    await platformService.extendGrace(
      library.id,
      Number(extendDays),
      extendReason
    )
    onPlanStatusChange("Grace")
    setExtendOpen(false)
    setExtendReason("")
    toast.success(`Grace period extended by ${extendDays} days`)
  }

  const handleRecordPayment = async () => {
    if (!paymentAmount.trim()) {
      toast.error("Amount Required")
      return
    }
    await platformService.recordManualPayment({
      library: library.id,
      amount: Number(paymentAmount),
      method: "Card",
    })
    onPlanStatusChange("Active")
    onLibraryStatusChange("Active")
    setPaymentOpen(false)
    toast.success(`Recorded ₹${paymentAmount} via ${paymentMethod}`)
  }

  const handleSuspendSubmit = async () => {
    await platformService.suspendLibrary(library.id, suspendReason)
    onLibraryStatusChange("Suspended")
    setSuspendOpen(false)
    toast.error(`Library suspended`, {
      description: `Reason: ${suspendReason}`,
    })
  }

  const statusBadgeClass =
    isLocked || libraryStatus === "Suspended"
      ? "border-rose-500/25 bg-rose-500/15 text-rose-700 dark:text-rose-300"
      : planStatus === "Grace"
        ? "border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-300"
        : "border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"

  const statusDotClass =
    isLocked || libraryStatus === "Suspended"
      ? "bg-rose-500"
      : planStatus === "Grace"
        ? "bg-amber-500"
        : "bg-emerald-500 animate-pulse"

  return (
    <section className="rounded-xl border border-border bg-card p-3.5 sm:p-4 md:p-5 shadow-xs space-y-3.5 min-w-0">
      {/* Top Section: Left Identity Info + Right Metrics Snapshot */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 min-w-0">
        {/* Left Side */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 min-w-0 flex-1">
          <LibraryLogo
            name={library.name}
            code={library.code}
            src={logoUrl}
            size="xl"
            status={libraryStatus === "Suspended" ? "Suspended" : planStatus}
            showStatusDot
          />

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                {library.name}
              </h1>
              <Badge
                className={cn(
                  "border font-bold text-[11px] gap-1 px-2 py-0.5 rounded-full",
                  statusBadgeClass
                )}
              >
                <span className={cn("size-1.5 rounded-full", statusDotClass)} />
                <span>
                  {libraryStatus === "Suspended" ? "Suspended" : planStatus}
                </span>
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground font-medium">
              Owner:{" "}
              <span className="font-bold text-foreground">
                {library.ownerName}
              </span>{" "}
              <span className="text-muted-foreground/70">•</span> Joined{" "}
              {library.joinedDate}
            </p>

            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted-foreground font-medium">
              <span className="inline-flex items-center gap-1 text-foreground/90 shrink-0 tabular-nums">
                <Phone className="size-3 text-muted-foreground shrink-0" />
                <span>{library.ownerPhone}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-foreground/90 truncate min-w-0">
                <Mail className="size-3 text-muted-foreground shrink-0" />
                <span className="truncate">{library.ownerEmail}</span>
              </span>
              <span className="inline-flex items-center gap-1 shrink-0">
                <Building2 className="size-3 text-muted-foreground shrink-0" />
                <span>
                  {library.branchesCount}{" "}
                  {library.branchesCount > 1 ? "Branches" : "Branch"}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
              <MapPin className="size-3 text-muted-foreground shrink-0" />
              <span>
                {library.city}, {library.state}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Seat Occupancy & Current Plan Snapshot */}
        <div className="rounded-lg border border-border/70 bg-muted/40 p-2.5 px-3.5 flex items-center gap-4 shrink-0 justify-between sm:justify-start">
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              SEAT OCCUPANCY
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Users className="size-4 text-primary shrink-0" />
              <span className="text-lg font-bold text-primary tracking-tight tabular-nums">
                {library.liveStudents}/{library.totalSeats}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium tabular-nums">
              {occupancyPct}% Utilized
            </p>
          </div>

          <div className="w-px h-9 bg-border/70 shrink-0" />

          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              CURRENT PLAN
            </p>
            <p className="text-xs font-bold text-foreground mt-0.5 tabular-nums">
              {library.planName} • ₹{library.planFee.toLocaleString("en-IN")}
            </p>
            <p
              className={cn(
                "text-[11px] font-medium",
                isLocked
                  ? "text-rose-500"
                  : planStatus === "Grace"
                    ? "text-amber-500"
                    : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              Ends {library.planEndDate}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Action Buttons Row */}
      <div className="border-t border-border/80 pt-3 flex flex-wrap items-center gap-2 min-w-0">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-3 text-xs font-semibold border-primary/40 text-primary hover:bg-primary/10 shadow-xs shrink-0"
        >
          <Link href={`/${lang}/platform/libraries/${library.id}/edit`}>
            <Pencil className="size-3.5" />
            <span>Edit Library</span>
          </Link>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-3 text-xs font-semibold border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shadow-xs shrink-0"
          onClick={() => setImpersonateOpen(true)}
        >
          <ShieldAlert className="size-3.5" />
          <span>Impersonate (15m)</span>
        </Button>

        <Button
          type="button"
          size="sm"
          className="h-8 gap-1.5 px-3 text-xs font-bold bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 shrink-0"
          onClick={() => setPaymentOpen(true)}
        >
          <CreditCard className="size-3.5" />
          <span>Record Payment</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-xs font-medium border-border hover:bg-accent shrink-0"
          onClick={() => setExtendOpen(true)}
        >
          <Clock className="size-3.5 text-amber-500" />
          <span>Extend Grace</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-xs font-medium border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 shrink-0"
          onClick={() => window.open(`https://wa.me/${cleanPhone}`, "_blank")}
        >
          <WhatsAppIcon className="size-3.5 fill-current text-emerald-500" />
          <span>WhatsApp Owner</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-xs font-medium border-border hover:bg-accent shrink-0"
          onClick={onJumpToControls}
        >
          <SlidersHorizontal className="size-3.5 text-primary" />
          <span>Limits & Brand</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-xs font-medium border-border hover:bg-accent shrink-0"
          onClick={async () => {
            const next = isLocked ? "Active" : "Locked"
            if (isLocked) {
              await platformService.unlockLibrary(
                library.id,
                "Unlocked by admin"
              )
            } else {
              await platformService.lockLibrary(library.id, "Locked by admin")
            }
            onPlanStatusChange(next)
            onLibraryStatusChange(next)
            toast.info(`Library ${next === "Locked" ? "Locked" : "Unlocked"}`)
          }}
        >
          {isLocked ? (
            <>
              <Unlock className="size-3.5 text-emerald-500" />
              <span>Unlock Library</span>
            </>
          ) : (
            <>
              <Lock className="size-3.5 text-amber-500" />
              <span>Lock Library</span>
            </>
          )}
        </Button>

        {libraryStatus === "Suspended" ? (
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5 px-3 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-600/90 shadow-xs shrink-0 ms-auto"
            onClick={() => {
              onLibraryStatusChange("Active")
              toast.success("Library reactivated")
            }}
          >
            <UserCheck className="size-3.5" />
            <span>Reactivate Tenant</span>
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5 px-3 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs shrink-0 ms-auto"
            onClick={() => setSuspendOpen(true)}
          >
            <ShieldAlert className="size-3.5" />
            <span>Suspend</span>
          </Button>
        )}
      </div>

      {/* Extend Grace Dialog */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="size-4 text-amber-500" />
              Extend Grace Period
            </DialogTitle>
            <DialogDescription className="text-xs">
              Grant temporary operational access for {library.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Extension Duration</Label>
              <Select value={extendDays} onValueChange={setExtendDays}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Additional Days</SelectItem>
                  <SelectItem value="5">5 Additional Days</SelectItem>
                  <SelectItem value="10">10 Days Exception</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold">Reason *</Label>
              <Textarea
                placeholder="e.g. Owner requested delay until bank clearance."
                value={extendReason}
                onChange={(e) => setExtendReason(e.target.value)}
                className="text-xs h-20"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setExtendOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs bg-primary text-primary-foreground font-bold"
              onClick={handleExtendGrace}
            >
              Grant {extendDays}d Extension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Record Subscription Payment
            </DialogTitle>
            <DialogDescription className="text-xs">
              {library.name} ({library.code}) • {library.planName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Amount (INR) *</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="text-xs font-bold"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Razorpay">Razorpay (Online)</SelectItem>
                  <SelectItem value="UPI">Direct UPI</SelectItem>
                  <SelectItem value="Bank Transfer">NEFT / RTGS</SelectItem>
                  <SelectItem value="Cash">Cash Receipt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setPaymentOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs bg-primary text-primary-foreground font-bold"
              onClick={handleRecordPayment}
            >
              Record Payment • ₹{paymentAmount || "0"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Confirmation Dialog */}
      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-500">
              Suspend Tenant Operations
            </DialogTitle>
            <DialogDescription className="text-xs">
              Halts admin portal and student mobile access for {library.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Suspension Reason</Label>
              <Select value={suspendReason} onValueChange={setSuspendReason}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Compliance Review">
                    Compliance Review
                  </SelectItem>
                  <SelectItem value="Subscription Non-Payment">
                    Subscription Non-Payment
                  </SelectItem>
                  <SelectItem value="Policy Violation">
                    Policy Violation
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setSuspendOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
              onClick={handleSuspendSubmit}
            >
              Confirm Suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Impersonate Dialog */}
      <Dialog open={impersonateOpen} onOpenChange={setImpersonateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="size-5" />
              <span>Impersonate Library</span>
            </DialogTitle>
            <DialogDescription>
              Launch a 15-minute read-only Super Admin view-as session for{" "}
              <strong>{library.name}</strong> ({library.code}). Every access is
              recorded in the audit log.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label
              htmlFor="impersonate-reason"
              className="text-xs font-semibold"
            >
              Reason for Impersonation{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="impersonate-reason"
              placeholder="e.g. Investigating student seat allocation issue reported in support ticket #42"
              value={impersonateReason}
              onChange={(e) => setImpersonateReason(e.target.value)}
              className="text-xs min-h-[80px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setImpersonateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-amber-600 text-white hover:bg-amber-700 font-bold"
              disabled={isImpersonating || !impersonateReason.trim()}
              onClick={handleImpersonateSubmit}
            >
              {isImpersonating ? "Launching..." : "Launch View-As Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
