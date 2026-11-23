"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Activity,
  Building2,
  Calendar,
  CreditCard,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Printer,
  QrCode,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react"
import { toast } from "sonner"

import type { LocaleType } from "@/types"
import type { StaffMember } from "@/data/library-management-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function StaffProfileHeader({
  staff,
  locale,
}: {
  staff: StaffMember
  locale: LocaleType
}) {
  const [currentStatus, setCurrentStatus] = useState(staff.status)
  const [printIdOpen, setPrintIdOpen] = useState(false)

  const handleToggleStatus = () => {
    const next = currentStatus === "Active" ? "Paused" : "Active"
    setCurrentStatus(next)
    if (next === "Paused") {
      toast.warning(`Access paused for ${staff.name}`, {
        description: "Login sessions terminated and staff privileges suspended.",
      })
    } else {
      toast.success(`Access restored for ${staff.name}`, {
        description: "Staff credentials and privileges are now active.",
      })
    }
  }

  const handleRevokeSessions = () => {
    toast.success(`All active sessions terminated for ${staff.name}`, {
      description: "Any open browser or terminal sessions have been invalidated.",
    })
  }

  return (
    <section className="rounded-xl border border-border bg-card p-3.5 sm:p-4 md:p-5 shadow-xs space-y-3.5 min-w-0">
      {/* Top Banner / Identity Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 min-w-0">
        {/* Left Side: Avatar & Details */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 min-w-0 flex-1">
          <Avatar className="size-16 sm:size-20 rounded-xl border-2 border-border shadow-xs shrink-0">
            <AvatarImage src={staff.avatar} alt={staff.name} className="object-cover" />
            <AvatarFallback className="rounded-xl text-base font-bold bg-primary/10 text-primary">
              {staff.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
                {staff.name}
              </h1>

              {/* Role Badge */}
              <Badge
                variant="outline"
                className={cn(
                  "text-xs px-2.5 py-0.5 rounded-full font-semibold gap-1.5",
                  staff.role === "Library Admin"
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                    : staff.role === "Sub Admin"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                )}
              >
                {staff.role === "Library Admin" ? (
                  <ShieldCheck className="size-3.5" />
                ) : staff.role === "Sub Admin" ? (
                  <Shield className="size-3.5" />
                ) : (
                  <UserCheck className="size-3.5" />
                )}
                <span>{staff.role}</span>
              </Badge>

              {/* Status Badge */}
              <Badge
                variant="outline"
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium gap-1",
                  currentStatus === "Active"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                    : currentStatus === "Invited"
                    ? "bg-blue-500/10 text-blue-500 border-blue-500/25"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/25"
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full shrink-0",
                    currentStatus === "Active"
                      ? "bg-emerald-500"
                      : currentStatus === "Invited"
                      ? "bg-blue-500"
                      : "bg-amber-500"
                  )}
                />
                <span>{currentStatus}</span>
              </Badge>
            </div>

            {/* Sub-line: Email, Phone, Branch */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-mono">
                <Mail className="size-3 text-muted-foreground" />
                {staff.email}
              </span>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1 font-mono">
                <Phone className="size-3 text-muted-foreground" />
                {staff.phone}
              </span>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1 text-foreground">
                <Building2 className="size-3 text-primary" />
                {staff.branchName}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href={ensureLocalizedPathname(`/pages/staff/${staff.id}/edit`, locale)}
            className={buttonVariants({
              variant: "default",
              size: "sm",
              className: "h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-xs cursor-pointer",
            })}
          >
            <Pencil className="size-3.5" />
            <span>Edit Profile</span>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            className={cn(
              "h-8 text-xs gap-1.5 border-border cursor-pointer",
              currentStatus === "Active"
                ? "hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30"
                : "hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30"
            )}
          >
            {currentStatus === "Active" ? (
              <>
                <UserX className="size-3.5 text-amber-500" />
                <span>Pause Access</span>
              </>
            ) : (
              <>
                <UserCheck className="size-3.5 text-emerald-500" />
                <span>Activate Access</span>
              </>
            )}
          </Button>

          <Dialog open={printIdOpen} onOpenChange={setPrintIdOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-border hover:bg-muted/30 cursor-pointer"
              >
                <Printer className="size-3.5 text-muted-foreground" />
                <span>Staff ID Badge</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm bg-card border-border rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  Staff Digital ID Badge
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Official library identification credentials.
                </DialogDescription>
              </DialogHeader>

              {/* ID Card Visual */}
              <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/10 via-card to-card p-4 space-y-3 text-center">
                <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  <span>ShelfSpace Library</span>
                  <span className="text-primary">{staff.role}</span>
                </div>
                <Avatar className="size-20 mx-auto rounded-full border-2 border-primary/40 shadow-sm">
                  <AvatarImage src={staff.avatar} alt={staff.name} />
                  <AvatarFallback className="text-base font-bold">
                    {staff.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-base font-bold text-foreground">{staff.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{staff.email}</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg border border-border/80 flex items-center justify-center gap-3">
                  <QrCode className="size-16 text-foreground" />
                  <div className="text-left text-xs space-y-0.5">
                    <div className="text-[10px] text-muted-foreground">Staff Code</div>
                    <div className="font-mono font-bold text-primary">{staff.id.toUpperCase()}</div>
                    <div className="text-[10px] text-muted-foreground">{staff.branchName}</div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  size="sm"
                  onClick={() => {
                    setPrintIdOpen(false)
                    toast.success("Printing staff ID badge...")
                  }}
                  className="w-full h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
                >
                  <Printer className="size-3.5" />
                  Print Card
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRevokeSessions}
            className="h-8 text-xs gap-1.5 border-border hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 cursor-pointer"
          >
            <KeyRound className="size-3.5 text-muted-foreground" />
            <span>Revoke Sessions</span>
          </Button>
        </div>
      </div>

      {/* Highlights Bar: ONLY show containers if permission is granted */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border/60">
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 space-y-0.5">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Activity className="size-3 text-primary" />
            Actions Logged Today
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-foreground">
            {staff.actionsTodayCount} Operations
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 space-y-0.5">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Calendar className="size-3 text-muted-foreground" />
            Joined Date
          </div>
          <div className="text-sm sm:text-base font-semibold text-foreground">
            {staff.joinedAt}
          </div>
        </div>

        {/* If revenue permission is granted, display the real desk collections box; otherwise don't show the box */}
        {staff.canViewRevenue && (
          <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 space-y-0.5 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <CreditCard className="size-3 text-amber-500" />
              Today&apos;s Desk Collections
            </div>
            <div className="text-sm sm:text-base font-bold font-mono text-foreground text-amber-500">
              ₹{staff.collectionsToday.toLocaleString("en-IN")}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
