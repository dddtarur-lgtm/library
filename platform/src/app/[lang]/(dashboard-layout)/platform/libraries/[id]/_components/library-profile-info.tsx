"use client"

import {
  Building2,
  Calendar,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  User,
  Users,
} from "lucide-react"

import type { PlatformLibraryRecord } from "@/data/platform/platform-data"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LibraryLogo } from "@/components/platform/library-logo"

interface LibraryProfileInfoProps {
  library: PlatformLibraryRecord
  logoUrl: string
  planStatus: PlatformLibraryRecord["planStatus"]
}

export function LibraryProfileInfo({
  library,
  logoUrl,
  planStatus,
}: LibraryProfileInfoProps) {
  return (
    <div className="w-full lg:w-64 xl:w-72 shrink-0 space-y-3 min-w-0">
      {/* 1. Plan & Tenant Allocation Card */}
      <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
        <CardHeader className="p-2.5 px-3 pb-1.5 border-b border-border/80">
          <div className="flex items-center justify-between min-w-0 gap-2">
            <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate">
              <CreditCard className="size-3.5 text-primary shrink-0" />
              <span className="truncate">Tenant Subscription</span>
            </CardTitle>
            <Badge
              variant="outline"
              className="text-[10px] font-semibold border-primary/30 text-primary bg-primary/5 shrink-0 px-1.5 py-0"
            >
              {library.planName}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-2.5 px-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between py-0.5 border-b border-border/60 min-w-0 gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium shrink-0">
              <Building2 className="size-3 text-muted-foreground" />
              Branches
            </span>
            <span className="font-bold text-foreground text-end truncate">
              {library.branchesCount}{" "}
              {library.branchesCount > 1 ? "Units" : "Unit"}
            </span>
          </div>

          <div className="flex items-center justify-between py-0.5 border-b border-border/60 min-w-0 gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium shrink-0">
              <Users className="size-3 text-blue-500" />
              Allocated Capacity
            </span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md border border-blue-500/20 truncate text-[11px] tabular-nums">
              {library.totalSeats} Desks
            </span>
          </div>

          <div className="flex items-center justify-between py-0.5 border-b border-border/60 min-w-0 gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium shrink-0">
              <CreditCard className="size-3 text-muted-foreground" />
              Annual Fee
            </span>
            <span className="font-bold text-foreground tabular-nums truncate">
              ₹{library.planFee.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center justify-between py-0.5 border-b border-border/60 min-w-0 gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium shrink-0">
              <Calendar className="size-3 text-muted-foreground" />
              Onboarded
            </span>
            <span className="font-semibold text-foreground truncate">
              {library.joinedDate}
            </span>
          </div>

          <div className="flex items-center justify-between py-0.5 min-w-0 gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium shrink-0">
              <ShieldAlert
                className={cn(
                  "size-3",
                  planStatus === "Locked"
                    ? "text-rose-500"
                    : planStatus === "Grace"
                      ? "text-amber-500"
                      : "text-emerald-500"
                )}
              />
              Renewal Date
            </span>
            <span
              className={cn(
                "font-bold truncate",
                planStatus === "Locked"
                  ? "text-rose-500"
                  : planStatus === "Grace"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {library.planEndDate}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Business & Owner Information Card */}
      <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
        <CardHeader className="p-2.5 px-3 pb-1.5 border-b border-border/80">
          <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate">
            <User className="size-3.5 text-primary shrink-0" />
            <span className="truncate">Owner & Business Info</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 px-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between py-0.5 border-b border-border/60 min-w-0 gap-2">
            <span className="text-muted-foreground font-medium shrink-0">
              Owner Name
            </span>
            <span className="font-bold text-foreground truncate">
              {library.ownerName}
            </span>
          </div>

          <div className="flex items-center justify-between py-0.5 border-b border-border/60 min-w-0 gap-2">
            <span className="text-muted-foreground font-medium shrink-0">
              Email Sync
            </span>
            <span
              className={cn(
                "font-bold inline-flex items-center gap-1 truncate",
                library.emailConnection === "Connected"
                  ? "text-emerald-500"
                  : library.emailConnection === "Needs reconnect"
                    ? "text-amber-500"
                    : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  library.emailConnection === "Connected"
                    ? "bg-emerald-500"
                    : library.emailConnection === "Needs reconnect"
                      ? "bg-amber-500"
                      : "bg-muted-foreground"
                )}
              />
              {library.emailConnection}
            </span>
          </div>

          <div className="py-0.5 border-b border-border/60">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium mb-0.5">
              <Phone className="size-3 text-muted-foreground" />
              Phone Number
            </span>
            <span className="font-bold text-foreground block ps-4 tabular-nums">
              {library.ownerPhone}
            </span>
          </div>

          <div className="py-0.5 border-b border-border/60">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium mb-0.5">
              <Mail className="size-3 text-muted-foreground" />
              Email Address
            </span>
            <span className="font-bold text-foreground block ps-4 truncate">
              {library.ownerEmail}
            </span>
          </div>

          <div className="py-0.5 border-b border-border/60">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium mb-0.5">
              <MapPin className="size-3 text-muted-foreground" />
              Location
            </span>
            <span className="font-semibold text-foreground block ps-4 leading-normal">
              {library.city}, {library.state}
            </span>
          </div>

          <div className="pt-1 flex items-center gap-2.5">
            <LibraryLogo
              name={library.name}
              code={library.code}
              src={logoUrl}
              size="sm"
              status={planStatus}
              showStatusDot
            />
            <div className="min-w-0">
              <p className="font-bold text-foreground truncate text-[11px]">
                Tenant Emblem
              </p>
              <p className="text-[10px] font-mono text-muted-foreground truncate">
                {library.code}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
