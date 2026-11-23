"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Building2,
  CalendarClock,
  ExternalLink,
  MapPin,
  Phone,
  Search,
  Users,
} from "lucide-react"

import type { LibraryStatusTone } from "@/components/platform/library-logo"
import type { PlatformLibraryRecord } from "@/data/platform/platform-data"
import type { PlanTier } from "./plan-types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LibraryAvatar } from "@/components/platform/library-logo"
import { formatINR, matchLibraryToPlan } from "./plan-types"

interface PlanLibrariesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedPlan: PlanTier | null
  allPlans: PlanTier[]
  onSelectPlan: (plan: PlanTier) => void
  libraries: PlatformLibraryRecord[]
  lang: string
}

function getPlanStatusBadgeClass(
  status: PlatformLibraryRecord["planStatus"]
): string {
  switch (status) {
    case "Active":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
    case "Trial":
      return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20"
    case "Grace":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
    case "Locked":
    case "Expired":
      return "bg-destructive/15 text-destructive border-destructive/20"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function toLogoStatus(
  status: PlatformLibraryRecord["libraryStatus"]
): LibraryStatusTone {
  return status === "Closed" ? "Disconnected" : status
}

export function PlanLibrariesDialog({
  open,
  onOpenChange,
  selectedPlan,
  allPlans,
  onSelectPlan,
  libraries,
  lang,
}: PlanLibrariesDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")

  const matchedLibraries = useMemo(() => {
    if (!selectedPlan) return []
    return libraries.filter((lib) =>
      matchLibraryToPlan(lib.planName, selectedPlan.name)
    )
  }, [libraries, selectedPlan])

  const filteredLibraries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return matchedLibraries.filter((lib) => {
      const matchesStatus =
        statusFilter === "All" || lib.planStatus === statusFilter
      if (!matchesStatus) return false
      if (!q) return true
      return (
        lib.name.toLowerCase().includes(q) ||
        lib.code.toLowerCase().includes(q) ||
        lib.city.toLowerCase().includes(q) ||
        lib.ownerName.toLowerCase().includes(q)
      )
    })
  }, [matchedLibraries, searchQuery, statusFilter])

  const totalSeatsUsed = useMemo(
    () => matchedLibraries.reduce((sum, lib) => sum + lib.liveStudents, 0),
    [matchedLibraries]
  )

  const totalSeatsCapacity = useMemo(
    () => matchedLibraries.reduce((sum, lib) => sum + lib.totalSeats, 0),
    [matchedLibraries]
  )

  if (!selectedPlan) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col bg-card border-border p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/80 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pr-6">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-lg font-bold tracking-tight">
                  {selectedPlan.name} Plan Libraries
                </DialogTitle>
                <Badge variant="secondary" className="font-mono text-xs">
                  {selectedPlan.activeLibraries} enrolled •{" "}
                  {matchedLibraries.length} directory profiles
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Rate:{" "}
                  <strong className="text-foreground">
                    {formatINR(selectedPlan.monthlyFee)}/mo
                  </strong>
                </span>
                <span>
                  Limit:{" "}
                  <strong className="text-foreground">
                    {selectedPlan.maxSeats} seats
                  </strong>
                </span>
                <span>
                  Branches:{" "}
                  <strong className="text-foreground">
                    up to {selectedPlan.maxBranches}
                  </strong>
                </span>
                {matchedLibraries.length > 0 && (
                  <span>
                    Active Occupancy:{" "}
                    <strong className="text-foreground">
                      {totalSeatsUsed}/{totalSeatsCapacity} students
                    </strong>
                  </span>
                )}
              </div>
            </div>

            <Select
              value={selectedPlan.id}
              onValueChange={(planId) => {
                const next = allPlans.find((p) => p.id === planId)
                if (next) onSelectPlan(next)
              }}
            >
              <SelectTrigger className="w-full sm:w-44 h-8 text-xs font-medium bg-background">
                <SelectValue placeholder="Switch plan" />
              </SelectTrigger>
              <SelectContent>
                {allPlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} ({plan.activeLibraries})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-3">
            <div className="relative flex-1">
              <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by library name, code, city, or owner..."
                className="pl-8 h-8.5 text-xs bg-background"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 h-8.5 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Trial">Trial</SelectItem>
                <SelectItem value="Grace">Grace</SelectItem>
                <SelectItem value="Locked">Locked</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filteredLibraries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/15 py-10 px-4 text-center space-y-2.5">
              <div className="size-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Building2 className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {matchedLibraries.length === 0
                    ? `No sample profiles loaded for ${selectedPlan.name}`
                    : "No matching libraries found"}
                </p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {matchedLibraries.length === 0
                    ? `${selectedPlan.activeLibraries} libraries are subscribed to ${selectedPlan.name}. Open the full Libraries directory to browse every tenant.`
                    : "Try clearing your search or status filter."}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="mt-1">
                <Link href={`/${lang}/platform/libraries`}>
                  Open Full Libraries Directory
                  <ExternalLink className="size-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          ) : (
            filteredLibraries.map((lib) => {
              const occupancyPct =
                lib.totalSeats > 0
                  ? Math.min(
                      100,
                      Math.round((lib.liveStudents / lib.totalSeats) * 100)
                    )
                  : 0

              return (
                <div
                  key={lib.id}
                  className="rounded-xl border border-border/80 bg-background/70 hover:bg-muted/20 transition-colors p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <LibraryAvatar
                      src={lib.logo}
                      name={lib.name}
                      code={lib.code}
                      size="md"
                      status={toLogoStatus(lib.libraryStatus)}
                      showStatusDot
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/${lang}/platform/libraries/${lib.id}`}
                          className="text-sm font-bold text-foreground hover:text-primary transition-colors truncate"
                        >
                          {lib.name}
                        </Link>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] h-5 px-1.5"
                        >
                          {lib.code}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-5 px-1.5 font-semibold ${getPlanStatusBadgeClass(
                            lib.planStatus
                          )}`}
                        >
                          {lib.planStatus}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3 text-muted-foreground/80" />
                          {lib.city}, {lib.state}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3 text-muted-foreground/80" />
                          {lib.ownerName}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3 text-muted-foreground/80" />
                          {lib.ownerPhone}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="size-3 text-muted-foreground/80" />
                          {lib.branchesCount}{" "}
                          {lib.branchesCount === 1 ? "branch" : "branches"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 md:min-w-[190px]">
                    <div className="w-36 sm:w-44 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          Seat Occupancy
                        </span>
                        <span className="font-semibold tabular-nums">
                          {lib.liveStudents}/{lib.totalSeats} ({occupancyPct}%)
                        </span>
                      </div>
                      <Progress value={occupancyPct} className="h-1.5" />
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                        <CalendarClock className="size-3" />
                        Ends {lib.planEndDate}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs font-semibold"
                        asChild
                      >
                        <Link href={`/${lang}/platform/libraries/${lib.id}`}>
                          Profile
                          <ExternalLink className="size-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-border/80 bg-muted/15 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Showing {filteredLibraries.length} of {matchedLibraries.length}{" "}
            preview profiles ({selectedPlan.activeLibraries} total active on{" "}
            {selectedPlan.name})
          </span>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-7 text-xs font-semibold text-primary"
          >
            <Link href={`/${lang}/platform/libraries`}>
              All Libraries
              <ExternalLink className="size-3 ml-1" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
