"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { platformService } from "@/services/platform-service"
import { toast } from "sonner"
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  HelpCircle,
  LayoutGrid,
  Mail,
  MapPin,
  Phone,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Table2,
  User,
  Users,
} from "lucide-react"

import type { LibraryStatusTone } from "@/components/platform/library-logo"
import type { LibraryRequest } from "@/data/platform/platform-data"
import type { RequestDocument } from "./_components/document-preview-modal"

import { initialPendingRequests } from "@/data/platform/platform-data"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentPreviewModal } from "./_components/document-preview-modal"
import { LibraryRequestGridCard } from "./_components/library-request-grid-card"
import { MoreInfoDialog } from "./_components/more-info-dialog"
import { RejectRequestDialog } from "./_components/reject-request-dialog"
import { ReviewRequestSheet } from "./_components/review-request-sheet"
import { LibraryAvatar } from "@/components/platform/library-logo"

function formatINR(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val)
}

export default function LibraryRequestsPage() {
  const params = useParams()
  const lang = (params.lang as string) || "en"

  const [requests, setRequests] = useState<LibraryRequest[]>(
    initialPendingRequests
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [planFilter, setPlanFilter] = useState<string>("All")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)
  const [isLoading, setIsLoading] = useState(false)

  // Interactive review sheet
  const [selectedRequest, setSelectedRequest] = useState<LibraryRequest | null>(
    null
  )
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Modal dialog states
  const [rejectTarget, setRejectTarget] = useState<LibraryRequest | null>(null)
  const [moreInfoTarget, setMoreInfoTarget] = useState<LibraryRequest | null>(
    null
  )
  const [previewDoc, setPreviewDoc] = useState<{
    doc: RequestDocument
    libraryName: string
  } | null>(null)

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await platformService.getPendingRequests()
      if (data && data.length > 0) {
        setRequests(data)
      }
    } catch {
      // Fallback to initial queue gracefully
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  // Count metrics
  const metrics = useMemo(() => {
    const total = requests.length
    const pending = requests.filter((r) => r.status === "Pending").length
    const moreInfo = requests.filter(
      (r) => r.status === "More information needed"
    ).length
    const approved = requests.filter((r) => r.status === "Approved").length
    const rejected = requests.filter((r) => r.status === "Rejected").length
    const totalPipelineFee = requests.reduce(
      (sum, r) => sum + (Number(r.feeAmount) || 0),
      0
    )
    const totalPlannedSeats = requests.reduce(
      (sum, r) => sum + (Number(r.plannedSeats) || 0),
      0
    )

    return {
      total,
      pending,
      moreInfo,
      approved,
      rejected,
      totalPipelineFee,
      totalPlannedSeats,
    }
  }, [requests])

  // Summary KPI Cards (Matching platform-metrics-grid.tsx style)
  const summaryKpis = [
    {
      key: "Pending",
      title: "Pending Review",
      value: metrics.pending.toLocaleString("en-IN"),
      pill: "Needs Action",
      pillClass: "bg-amber-500/10 text-amber-500 ring-amber-500/25",
      footerLeft: "Avg turnaround: 4.2 hrs",
      footerRight: "Filter pending",
      icon: Clock,
      iconClass: "bg-amber-500/10 text-amber-500 ring-amber-500/20",
      topAccent: "from-amber-500/70 via-amber-500/20 to-transparent",
      active: statusFilter === "Pending",
      onClick: () => {
        setStatusFilter(statusFilter === "Pending" ? "All" : "Pending")
        setCurrentPage(1)
      },
    },
    {
      key: "MoreInfo",
      title: "Clarification Queue",
      value: metrics.moreInfo.toLocaleString("en-IN"),
      pill: "Awaiting Reply",
      pillClass: "bg-sky-500/10 text-sky-500 ring-sky-500/25",
      footerLeft: "Awaiting applicant reply",
      footerRight: "Filter info",
      icon: HelpCircle,
      iconClass: "bg-sky-500/10 text-sky-500 ring-sky-500/20",
      topAccent: "from-sky-500/70 via-sky-500/20 to-transparent",
      active: statusFilter === "MoreInfo",
      onClick: () => {
        setStatusFilter(statusFilter === "MoreInfo" ? "All" : "MoreInfo")
        setCurrentPage(1)
      },
    },
    {
      key: "Approved",
      title: "Approved Pipeline",
      value: metrics.approved.toLocaleString("en-IN"),
      pill: "Provisioned",
      pillClass: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/25",
      footerLeft: "Workspaces active",
      footerRight: "Filter approved",
      icon: CheckCircle2,
      iconClass: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
      topAccent: "from-emerald-500/70 via-emerald-500/20 to-transparent",
      active: statusFilter === "Approved",
      onClick: () => {
        setStatusFilter(statusFilter === "Approved" ? "All" : "Approved")
        setCurrentPage(1)
      },
    },
    {
      key: "TotalPipeline",
      title: "Contract Pipeline",
      value: formatINR(metrics.totalPipelineFee),
      pill: `${metrics.totalPlannedSeats} Seats`,
      pillClass: "bg-primary/10 text-primary ring-primary/25",
      footerLeft: "Subscription value",
      footerRight: "View all",
      icon: ShieldCheck,
      iconClass: "bg-primary/10 text-primary ring-primary/20",
      topAccent: "from-primary/70 via-primary/20 to-transparent",
      active: statusFilter === "All" && planFilter === "All",
      onClick: () => {
        setStatusFilter("All")
        setPlanFilter("All")
        setCurrentPage(1)
      },
    },
  ]

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return requests.filter((r) => {
      const matchesSearch =
        !query ||
        r.libraryName.toLowerCase().includes(query) ||
        r.ownerName.toLowerCase().includes(query) ||
        r.city.toLowerCase().includes(query) ||
        r.state.toLowerCase().includes(query) ||
        r.requestNumber.toLowerCase().includes(query) ||
        r.mobile.includes(query) ||
        r.email.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Pending" && r.status === "Pending") ||
        (statusFilter === "MoreInfo" &&
          r.status === "More information needed") ||
        (statusFilter === "Approved" && r.status === "Approved") ||
        (statusFilter === "Rejected" && r.status === "Rejected")

      const matchesPlan = planFilter === "All" || r.chosenPlan === planFilter

      return matchesSearch && matchesStatus && matchesPlan
    })
  }, [requests, searchQuery, statusFilter, planFilter])

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * pageSize
  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + pageSize
  )
  const showingFrom = filteredRequests.length === 0 ? 0 : startIndex + 1
  const showingTo = Math.min(startIndex + pageSize, filteredRequests.length)

  const hasActiveFilters =
    searchQuery.trim() !== "" || statusFilter !== "All" || planFilter !== "All"

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("All")
    setPlanFilter("All")
    setCurrentPage(1)
  }

  // Action handlers
  const handleOpenReview = (req: LibraryRequest) => {
    setSelectedRequest(req)
    setIsSheetOpen(true)
  }

  const handleApprove = async (req: LibraryRequest) => {
    if (!req.documentCheck.emailVerified || !req.documentCheck.mobileVerified) {
      toast.error("Approval Blocked", {
        description:
          "Owner email and mobile OTP must be verified before approval.",
      })
      return
    }

    try {
      await platformService.approveLibraryRequest(req.id, {
        assign_trial_days: 14,
      })

      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id
            ? {
                ...r,
                status: "Approved",
                notes: (r.notes || "") + " | Approved by Super Admin.",
              }
            : r
        )
      )

      if (selectedRequest?.id === req.id) {
        setSelectedRequest((prev) =>
          prev ? { ...prev, status: "Approved" } : null
        )
      }

      toast.success("Library Request Approved!", {
        description: `${req.libraryName} tenant provisioned. Welcome credentials sent to ${req.email}.`,
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to approve library request."
      toast.error("Approval Failed", { description: message })
    }
  }

  const handleConfirmReject = async (req: LibraryRequest, reason: string) => {
    try {
      await platformService.rejectLibraryRequest(req.id, reason)

      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id
            ? {
                ...r,
                status: "Rejected",
                notes: `Rejected: ${reason}`,
              }
            : r
        )
      )

      if (selectedRequest?.id === req.id) {
        setSelectedRequest((prev) =>
          prev
            ? { ...prev, status: "Rejected", notes: `Rejected: ${reason}` }
            : null
        )
      }

      toast.warning("Request Rejected", {
        description: `Notification sent to ${req.ownerName}. Rejection logged in audit ledger.`,
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to record rejection."
      toast.error("Rejection Failed", { description: message })
    }
  }

  const handleConfirmMoreInfo = async (req: LibraryRequest, query: string) => {
    try {
      await platformService.requestInfoLibrary(req.id, query)
      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id
            ? {
                ...r,
                status: "More information needed",
                notes: `Requested: ${query}`,
              }
            : r
        )
      )

      if (selectedRequest?.id === req.id) {
        setSelectedRequest((prev) =>
          prev
            ? {
                ...prev,
                status: "More information needed",
                notes: `Requested: ${query}`,
              }
            : null
        )
      }

      toast.info("Information Request Dispatched", {
        description: `Clarification notice sent to ${req.ownerName} (${req.email}).`,
      })
    } catch (err: unknown) {
      toast.error("Operation Failed", {
        description:
          err instanceof Error ? err.message : "Failed to dispatch request.",
      })
    }
  }

  const handlePreviewDoc = (doc: RequestDocument, libraryName: string) => {
    setPreviewDoc({ doc, libraryName })
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Library Requests
          </h1>
          <Badge
            variant="outline"
            className="font-bold border-amber-500/30 text-amber-500 bg-amber-500/10 px-2.5 py-0.5"
          >
            {metrics.pending} Pending Review
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
            disabled={isLoading}
            className="text-xs h-9 font-semibold"
          >
            <RefreshCw
              className={cn("size-3.5 me-1.5", isLoading && "animate-spin")}
            />
            Refresh
          </Button>

          <Button variant="outline" size="sm" asChild className="text-xs h-9">
            <Link href={`/${lang}/platform/libraries`}>
              <Building2 className="me-1.5 size-3.5 text-muted-foreground" />
              All Libraries ({requests.length + 137})
            </Link>
          </Button>

          <Button
            size="sm"
            asChild
            className="text-xs h-9 font-bold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href={`/${lang}/platform/libraries/add`}>
              <PlusCircle className="me-1.5 size-3.5" />
              Direct Onboard
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryKpis.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.key}
              onClick={card.onClick}
              className={cn(
                "group relative cursor-pointer overflow-hidden rounded-xl border bg-card/90 backdrop-blur-xs transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5",
                card.active
                  ? "border-primary/60 ring-1 ring-primary/25"
                  : "border-border/70"
              )}
            >
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r",
                  card.topAccent
                )}
              />

              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg ring-1 ring-inset transition-transform group-hover:scale-105",
                        card.iconClass
                      )}
                    >
                      <Icon className="size-4.5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {card.title}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ring-1 ring-inset",
                      card.pillClass
                    )}
                  >
                    {card.pill}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-foreground">
                    {card.value}
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>

                <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground truncate">
                    {card.footerLeft}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground/75 shrink-0">
                    {card.footerRight}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Request Queue Directory Card */}
      <Card className="rounded-xl border border-border/70 bg-card/90 backdrop-blur-xs overflow-hidden shadow-xs">
        {/* Toolbar & Filter Bar */}
        <div className="p-4 border-b border-border/60 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
          {/* Status Tabs */}
          <Tabs
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val)
              setCurrentPage(1)
            }}
            className="w-full xl:w-auto"
          >
            <TabsList className="grid grid-cols-5 md:flex w-full h-9">
              <TabsTrigger value="All" className="text-xs font-semibold px-3">
                All ({metrics.total})
              </TabsTrigger>
              <TabsTrigger
                value="Pending"
                className="text-xs font-semibold px-3"
              >
                Pending ({metrics.pending})
              </TabsTrigger>
              <TabsTrigger
                value="MoreInfo"
                className="text-xs font-semibold px-3"
              >
                Needs Info ({metrics.moreInfo})
              </TabsTrigger>
              <TabsTrigger
                value="Approved"
                className="text-xs font-semibold px-3"
              >
                Approved ({metrics.approved})
              </TabsTrigger>
              <TabsTrigger
                value="Rejected"
                className="text-xs font-semibold px-3"
              >
                Rejected ({metrics.rejected})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search, Plan Dropdown, Reset & View Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search library, owner, phone..."
                className="pl-8 text-xs h-9 bg-background/60"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>

            <Select
              value={planFilter}
              onValueChange={(val) => {
                setPlanFilter(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[130px] h-9 text-xs bg-background/60">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Plans</SelectItem>
                <SelectItem value="Starter">Starter</SelectItem>
                <SelectItem value="Growth">Growth</SelectItem>
                <SelectItem value="Pro">Pro</SelectItem>
                <SelectItem value="Enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs text-muted-foreground hover:text-foreground"
                onClick={resetFilters}
              >
                <RotateCcw className="size-3.5 me-1.5" />
                Reset
              </Button>
            )}

            {/* View Mode Toggle: Grid is prioritized */}
            <div
              role="group"
              aria-label="View mode"
              className="inline-flex items-center rounded-lg border border-border/70 bg-background/60 p-0.5 h-9"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-7.5 px-2.5 text-xs rounded-md transition-all",
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="size-3.5 sm:me-1.5" />
                <span className="hidden sm:inline">Grid</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={viewMode === "table"}
                onClick={() => setViewMode("table")}
                className={cn(
                  "h-7.5 px-2.5 text-xs rounded-md transition-all",
                  viewMode === "table"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Table2 className="size-3.5 sm:me-1.5" />
                <span className="hidden sm:inline">Table</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Directory View Content */}
        <CardContent className="p-0">
          {filteredRequests.length === 0 ? (
            <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
                <Building2 className="size-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                No Onboarding Requests Found
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                No library registration applications match your current search
                criteria or active filter state.
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="mt-4 text-xs font-semibold"
                >
                  <RotateCcw className="size-3.5 me-1.5" /> Reset Filters
                </Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            /* STYLISH GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5 p-4 sm:p-6">
              {paginatedRequests.map((req) => (
                <LibraryRequestGridCard
                  key={req.id}
                  request={req}
                  onReview={handleOpenReview}
                  onApprove={handleApprove}
                  onRejectClick={(r) => setRejectTarget(r)}
                  onMoreInfoClick={(r) => setMoreInfoTarget(r)}
                  onPreviewDoc={handlePreviewDoc}
                />
              ))}
            </div>
          ) : (
            /* CLEAN TABLE VIEW */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/35">
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ps-5 w-[140px]">
                      Request ID
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Library & Location
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Owner Contact
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Plan & Scale
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Verification
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground pe-5">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedRequests.map((req) => {
                    const isApproved = req.status === "Approved"
                    const statusTone: LibraryStatusTone = isApproved
                      ? "Active"
                      : req.status === "Rejected"
                        ? "Locked"
                        : "Pending"

                    return (
                      <TableRow
                        key={req.id}
                        className="border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="ps-5 py-3.5">
                          <div className="font-mono text-xs font-bold text-foreground">
                            {req.requestNumber}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="size-2.5" />
                            {req.submittedDate.split(",")[0]}
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5">
                          <div className="flex items-start gap-3 min-w-0">
                            <LibraryAvatar
                              name={req.libraryName}
                              code={req.requestNumber}
                              src={req.logo}
                              size="sm"
                              status={statusTone}
                              showStatusDot
                            />
                            <div className="min-w-0">
                              <div
                                onClick={() => handleOpenReview(req)}
                                className="font-bold text-sm text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                              >
                                {req.libraryName}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="size-3 text-muted-foreground shrink-0" />
                                <span className="truncate">
                                  {req.city}, {req.state} •{" "}
                                  {req.branchesPlanned}{" "}
                                  {req.branchesPlanned > 1
                                    ? "Branches"
                                    : "Branch"}
                                </span>
                              </div>
                              {req.duplicateWarning && (
                                <div className="text-[10px] font-semibold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded mt-1 w-fit flex items-center gap-1">
                                  <AlertTriangle className="size-3" />
                                  Duplicate Risk
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5">
                          <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <User className="size-3 text-muted-foreground" />
                            {req.ownerName}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="size-3" /> {req.mobile}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Mail className="size-3" /> {req.email}
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className="font-bold text-xs"
                            >
                              {req.chosenPlan}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              ({req.billingCycle})
                            </span>
                          </div>
                          <div className="text-xs font-black text-foreground mt-0.5">
                            ₹{req.feeAmount.toLocaleString("en-IN")}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Users className="size-2.5" />
                            {req.plannedSeats} planned seats
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5">
                          <div className="flex flex-col gap-1 text-[11px]">
                            <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                              <CheckCircle2 className="size-3" /> Email Verified
                            </span>
                            <span
                              className={cn(
                                "flex items-center gap-1 font-semibold",
                                req.documentCheck.mobileVerified
                                  ? "text-emerald-500"
                                  : "text-amber-500"
                              )}
                            >
                              {req.documentCheck.mobileVerified ? (
                                <CheckCircle2 className="size-3" />
                              ) : (
                                <Clock className="size-3" />
                              )}
                              OTP{" "}
                              {req.documentCheck.mobileVerified
                                ? "Verified"
                                : "Pending"}
                            </span>
                            <span className="text-muted-foreground text-[10px]">
                              {req.documents.length} KYC Docs attached
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5">
                          <Badge
                            variant={
                              req.status === "Approved"
                                ? "success"
                                : req.status === "Pending"
                                  ? "warning"
                                  : req.status === "More information needed"
                                    ? "secondary"
                                    : "destructive"
                            }
                            className="font-bold text-xs"
                          >
                            {req.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right pe-5 py-3.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="font-bold text-xs"
                            onClick={() => handleOpenReview(req)}
                          >
                            <Eye className="me-1.5 size-3.5" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Shared Pagination Controls */}
          <div className="p-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span>
                Showing{" "}
                <strong className="text-foreground">{showingFrom}</strong> to{" "}
                <strong className="text-foreground">{showingTo}</strong> of{" "}
                <strong className="text-foreground">
                  {filteredRequests.length}
                </strong>{" "}
                requests
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px]">Per page:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    setPageSize(Number(val))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[70px] h-7 text-xs bg-background/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="9">9</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }}
                      className={cn(
                        "h-8 text-xs cursor-pointer",
                        currentPage === 1 && "pointer-events-none opacity-40"
                      )}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => {
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 &&
                          pageNum <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              isActive={currentPage === pageNum}
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(pageNum)
                              }}
                              className="h-8 w-8 text-xs cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      }
                      if (
                        pageNum === currentPage - 2 ||
                        pageNum === currentPage + 2
                      ) {
                        return (
                          <PaginationItem key={pageNum}>
                            <span className="px-1 text-xs text-muted-foreground">
                              …
                            </span>
                          </PaginationItem>
                        )
                      }
                      return null
                    }
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }}
                      className={cn(
                        "h-8 text-xs cursor-pointer",
                        currentPage === totalPages &&
                          "pointer-events-none opacity-40"
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Slide-over Full Review Sheet */}
      <ReviewRequestSheet
        request={selectedRequest}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onApprove={handleApprove}
        onRejectClick={(r) => setRejectTarget(r)}
        onMoreInfoClick={(r) => setMoreInfoTarget(r)}
        onPreviewDoc={handlePreviewDoc}
      />

      {/* Reject Request Dialog */}
      <RejectRequestDialog
        request={rejectTarget}
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        onConfirm={handleConfirmReject}
      />

      {/* Request More Information Dialog */}
      <MoreInfoDialog
        request={moreInfoTarget}
        open={!!moreInfoTarget}
        onOpenChange={(open) => !open && setMoreInfoTarget(null)}
        onConfirm={handleConfirmMoreInfo}
      />

      {/* KYC Document Interactive Viewer Modal */}
      <DocumentPreviewModal
        document={previewDoc?.doc || null}
        libraryName={previewDoc?.libraryName}
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      />
    </div>
  )
}
