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
  CreditCard,
  Download,
  Eye,
  GraduationCap,
  LayoutGrid,
  Lock,
  MapPin,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  RotateCcw,
  Search,
  ShieldAlert,
  Table2,
  Trash2,
  Unlock,
} from "lucide-react"

import type {
  PlatformKPIs,
  PlatformLibraryRecord,
} from "@/data/platform/platform-data"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Textarea } from "@/components/ui/textarea"
import { LibraryAvatar, LibraryLogo } from "@/components/platform/library-logo"

function normalizePlanStatus(
  status?: string
): "Trial" | "Active" | "Grace" | "Locked" | "Expired" {
  if (!status) return "Active"
  const s = status.toUpperCase()
  if (s.includes("TRIAL")) return "Trial"
  if (s.includes("GRACE")) return "Grace"
  if (s.includes("LOCK")) return "Locked"
  if (s.includes("EXPIR")) return "Expired"
  return "Active"
}

function normalizeLibraryStatus(
  status?: string
): "Active" | "Suspended" | "Locked" | "Closed" {
  if (!status) return "Active"
  const s = status.toUpperCase()
  if (s.includes("SUSPEND")) return "Suspended"
  if (s.includes("LOCK")) return "Locked"
  if (s.includes("CLOSE")) return "Closed"
  return "Active"
}

function normalizeEmailConnection(
  status?: string
): "Connected" | "Needs reconnect" | "Not connected" {
  if (!status) return "Not connected"
  const s = status.toLowerCase()
  if (s.includes("connect") && !s.includes("not")) return "Connected"
  if (s.includes("need") || s.includes("fail") || s.includes("warn"))
    return "Needs reconnect"
  return "Not connected"
}

interface RawLibraryInput {
  id?: string | number
  name?: string
  code?: string
  city?: string
  state?: string
  address?: string
  owner_name?: string
  ownerName?: string
  owner_detail?: { name?: string; phone?: string; email?: string }
  owner_phone?: string
  ownerPhone?: string
  phone?: string
  owner_email?: string
  ownerEmail?: string
  contact_email?: string
  branches_count?: number
  branchesCount?: number
  branch_count?: number
  students_count?: number
  live_students?: number
  liveStudents?: number
  student_count?: number
  total_seats?: number
  totalSeats?: number
  plan_name?: string
  planName?: string
  plan_fee?: number | string
  planFee?: number | string
  billing_cycle?: string
  billingCycle?: string
  plan_status?: string
  planStatus?: string
  library_status?: string
  libraryStatus?: string
  plan_end_date?: string
  planEndDate?: string
  grace_days_remaining?: number
  logo?: string
  logo_url?: string
  email_connection_status?: string
  emailConnection?: string
  joined_date?: string
  joinedDate?: string
  created_at?: string
  subscription?: {
    status?: string
    fee?: number
    plan_name?: string
    billing_cycle?: string
    end_date?: string
    plan?: { name?: string; price?: number; monthly_fee?: number }
  }
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const obj = err as { message?: string; data?: { message?: string } }
    return obj.data?.message || obj.message || fallback
  }
  return fallback
}

export default function AllLibrariesPage() {
  const params = useParams()
  const lang = params.lang as string

  const [libraries, setLibraries] = useState<PlatformLibraryRecord[]>([])
  const [kpis, setKpis] = useState<Partial<PlatformKPIs> | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [planStatusFilter, setPlanStatusFilter] = useState("All")
  const [libraryStatusFilter, setLibraryStatusFilter] = useState("All")
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

  // Lock / Unlock Dialog
  const [lockTarget, setLockTarget] = useState<PlatformLibraryRecord | null>(
    null
  )
  const [lockReason, setLockReason] = useState("")

  // Suspend Dialog
  const [suspendTarget, setSuspendTarget] =
    useState<PlatformLibraryRecord | null>(null)
  const [suspendReason, setSuspendReason] = useState("")

  // Impersonate Dialog
  const [impersonateTarget, setImpersonateTarget] =
    useState<PlatformLibraryRecord | null>(null)
  const [impersonateReason, setImpersonateReason] = useState("")
  const [isImpersonating, setIsImpersonating] = useState(false)

  // Quick Payment Dialog
  const [paymentTarget, setPaymentTarget] =
    useState<PlatformLibraryRecord | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<
    "UPI" | "Card" | "NetBanking" | "Bank Transfer" | "Cash" | "Cheque"
  >("UPI")
  const [isLoading, setIsLoading] = useState(false)

  const fetchLibraries = useCallback(async () => {
    try {
      setIsLoading(true)
      const [res, kpiRes] = await Promise.all([
        platformService.getLibraries({ limit: 100 }),
        platformService.getDashboardKPIs().catch(() => null),
      ])

      if (kpiRes) {
        setKpis(
          (kpiRes as { data?: Partial<PlatformKPIs> })?.data ||
            (kpiRes as Partial<PlatformKPIs>)
        )
      }

      const rawList = Array.isArray(res) ? res : res?.results || res?.data || []
      const list = Array.isArray(rawList) ? rawList : []

      const mapped = list.map((rawItem: unknown) => {
        const l = (rawItem || {}) as RawLibraryInput
        const rawPlanStatus =
          l.plan_status || l.planStatus || l.subscription?.status || "Active"
        const rawLibStatus = l.library_status || l.libraryStatus || "Active"
        const planFeeVal = Number(
          l.plan_fee ??
            l.planFee ??
            l.subscription?.fee ??
            l.subscription?.plan?.price ??
            l.subscription?.plan?.monthly_fee ??
            0
        )
        const planEndDateVal =
          l.plan_end_date || l.planEndDate
            ? new Date(
                (l.plan_end_date || l.planEndDate) as string
              ).toLocaleDateString("en-IN")
            : l.subscription?.end_date
              ? new Date(l.subscription.end_date).toLocaleDateString("en-IN")
              : "Ongoing"

        return {
          id: String(l.id),
          name: l.name || "Untitled Library",
          code: l.code || `LIB-${String(l.id).slice(0, 4).toUpperCase()}`,
          city: l.city || "—",
          state: l.state || "—",
          ownerName:
            l.owner_name ||
            l.ownerName ||
            l.owner_detail?.name ||
            "Library Admin",
          ownerPhone:
            l.owner_phone ||
            l.ownerPhone ||
            l.phone ||
            l.owner_detail?.phone ||
            "—",
          ownerEmail:
            l.owner_email ||
            l.ownerEmail ||
            l.contact_email ||
            l.owner_detail?.email ||
            "—",
          branchesCount: Number(
            l.branches_count ?? l.branchesCount ?? l.branch_count ?? 1
          ),
          liveStudents: Number(
            l.students_count ??
              l.live_students ??
              l.liveStudents ??
              l.student_count ??
              0
          ),
          totalSeats: Number(l.total_seats ?? l.totalSeats ?? 0),
          planName:
            l.plan_name ||
            l.planName ||
            l.subscription?.plan_name ||
            l.subscription?.plan?.name ||
            "Starter",
          planFee: isNaN(planFeeVal) ? 0 : planFeeVal,
          planBillingCycle:
            l.billing_cycle ||
            l.billingCycle ||
            l.subscription?.billing_cycle ||
            "Annual",
          planStatus: normalizePlanStatus(rawPlanStatus),
          libraryStatus: normalizeLibraryStatus(rawLibStatus),
          planEndDate: planEndDateVal,
          nextDueDate: planEndDateVal,
          graceDaysRemaining: Number(l.grace_days_remaining || 0),
          mrr: isNaN(planFeeVal) ? 0 : planFeeVal,
          logo: l.logo || l.logo_url || "",
          logoUrl: l.logo || l.logo_url || null,
          emailConnection: normalizeEmailConnection(
            l.email_connection_status || l.emailConnection
          ),
          joinedDate:
            l.joined_date || l.joinedDate
              ? new Date(
                  (l.joined_date || l.joinedDate) as string
                ).toLocaleDateString("en-IN")
              : l.created_at
                ? new Date(l.created_at).toLocaleDateString("en-IN")
                : "—",
        }
      })
      setLibraries(mapped)
    } catch (err) {
      console.error("Failed to load libraries:", err)
      setLibraries([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLibraries()
    const handleChanged = () => fetchLibraries()
    if (typeof window !== "undefined") {
      window.addEventListener("platform_libraries_changed", handleChanged)
      return () => {
        window.removeEventListener("platform_libraries_changed", handleChanged)
      }
    }
  }, [fetchLibraries])

  // Summary metrics calculated directly from API data
  const metrics = useMemo(() => {
    const total = kpis?.totalLibraries ?? libraries.length
    const activeCount =
      kpis?.activeLibraries ??
      libraries.filter(
        (l) => l.planStatus === "Active" || l.planStatus === "Trial"
      ).length
    const graceCount =
      kpis?.inGracePeriod ??
      libraries.filter((l) => l.planStatus === "Grace").length
    const lockedCount =
      kpis?.lockedLibraries ??
      libraries.filter(
        (l) => l.planStatus === "Locked" || l.libraryStatus === "Locked"
      ).length
    const totalBranches = libraries.reduce(
      (acc, l) => acc + Number(l.branchesCount || 0),
      0
    )
    const liveStudents =
      kpis?.liveStudents ??
      libraries.reduce((acc, l) => acc + Number(l.liveStudents || 0), 0)
    const totalSeats = libraries.reduce(
      (acc, l) => acc + Number(l.totalSeats || 0),
      0
    )
    const activeRate = total > 0 ? Math.round((activeCount / total) * 100) : 0
    const occupancyRate =
      totalSeats > 0 ? Math.round((liveStudents / totalSeats) * 100) : 0

    return {
      total,
      activeCount,
      graceCount,
      lockedCount,
      attentionCount: graceCount + lockedCount,
      totalBranches,
      liveStudents,
      totalSeats,
      activeRate,
      occupancyRate,
    }
  }, [libraries, kpis])

  // Dashboard-styled KPI summary cards
  const summaryCards = [
    {
      key: "all",
      title: "Total Libraries",
      value: Number(metrics.total || 0).toLocaleString("en-IN"),
      pill: `${metrics.totalBranches} Branches`,
      pillClass: "bg-primary/10 text-primary ring-primary/25",
      footerLeft: "All onboarded tenants",
      footerRight: "Click to show all",
      icon: Building2,
      iconClass: "bg-primary/10 text-primary ring-primary/20",
      topAccent: "from-primary/60 via-primary/20 to-transparent",
      active: planStatusFilter === "All" && libraryStatusFilter === "All",
      onClick: () => {
        setPlanStatusFilter("All")
        setLibraryStatusFilter("All")
        setCurrentPage(1)
      },
    },
    {
      key: "active",
      title: "Active & Healthy",
      value: Number(metrics.activeCount || 0).toLocaleString("en-IN"),
      pill: `${metrics.activeRate}% Healthy`,
      pillClass: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/25",
      footerLeft: "Operational subscriptions",
      footerRight: "Filter active",
      icon: CheckCircle2,
      iconClass: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
      topAccent: "from-emerald-500/60 via-emerald-500/20 to-transparent",
      active: planStatusFilter === "Active",
      onClick: () => {
        setPlanStatusFilter(planStatusFilter === "Active" ? "All" : "Active")
        setLibraryStatusFilter("All")
        setCurrentPage(1)
      },
    },
    {
      key: "attention",
      title: "Grace & Locked",
      value: Number(metrics.attentionCount || 0).toLocaleString("en-IN"),
      pill: `${metrics.lockedCount} Locked`,
      pillClass: "bg-amber-500/10 text-amber-500 ring-amber-500/25",
      footerLeft: `${metrics.graceCount} grace · ${metrics.lockedCount} locked`,
      footerAlert: metrics.lockedCount > 0,
      icon: ShieldAlert,
      iconClass: "bg-amber-500/10 text-amber-500 ring-amber-500/20",
      topAccent: "from-amber-500/60 via-rose-500/30 to-transparent",
      active:
        planStatusFilter === "Grace & Locked" ||
        planStatusFilter === "Grace" ||
        planStatusFilter === "Locked",
      onClick: () => {
        setPlanStatusFilter(
          planStatusFilter === "Grace & Locked" ? "All" : "Grace & Locked"
        )
        setLibraryStatusFilter("All")
        setCurrentPage(1)
      },
    },
    {
      key: "students",
      title: "Live Students",
      value: Number(metrics.liveStudents || 0).toLocaleString("en-IN"),
      pill: `${metrics.occupancyRate}% Occupied`,
      pillClass: "bg-violet-500/10 text-violet-400 ring-violet-500/25",
      footerLeft: `${Number(metrics.totalSeats || 0).toLocaleString("en-IN")} total seats`,
      footerRight: "1-tenant bound",
      icon: GraduationCap,
      iconClass: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
      topAccent: "from-violet-500/60 via-violet-500/20 to-transparent",
      active: false,
      onClick: () => {
        setPlanStatusFilter("All")
        setLibraryStatusFilter("All")
        setCurrentPage(1)
      },
    },
  ]

  // Filter logic
  const filteredLibraries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return libraries.filter((lib) => {
      const matchesSearch =
        !query ||
        lib.name.toLowerCase().includes(query) ||
        lib.code.toLowerCase().includes(query) ||
        lib.city.toLowerCase().includes(query) ||
        lib.state.toLowerCase().includes(query) ||
        lib.ownerName.toLowerCase().includes(query) ||
        lib.ownerEmail.toLowerCase().includes(query) ||
        lib.ownerPhone.toLowerCase().includes(query)

      const matchesPlanStatus =
        planStatusFilter === "All"
          ? true
          : planStatusFilter === "Grace & Locked"
            ? lib.planStatus === "Grace" ||
              lib.planStatus === "Locked" ||
              lib.libraryStatus === "Locked"
            : lib.planStatus === planStatusFilter

      const matchesLibraryStatus =
        libraryStatusFilter === "All" ||
        lib.libraryStatus === libraryStatusFilter

      return matchesSearch && matchesPlanStatus && matchesLibraryStatus
    })
  }, [libraries, searchQuery, planStatusFilter, libraryStatusFilter])

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredLibraries.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * pageSize
  const paginatedLibraries = filteredLibraries.slice(
    startIndex,
    startIndex + pageSize
  )
  const showingFrom = filteredLibraries.length === 0 ? 0 : startIndex + 1
  const showingTo = Math.min(startIndex + pageSize, filteredLibraries.length)

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    planStatusFilter !== "All" ||
    libraryStatusFilter !== "All"

  const resetFilters = () => {
    setSearchQuery("")
    setPlanStatusFilter("All")
    setLibraryStatusFilter("All")
    setCurrentPage(1)
  }

  // Action handlers
  const handleLockSubmit = async () => {
    if (!lockTarget || !lockReason.trim()) {
      toast.error("Reason Required", {
        description: "You must provide a reason for locking this library.",
      })
      return
    }

    const isCurrentlyLocked =
      lockTarget.planStatus === "Locked" ||
      lockTarget.libraryStatus === "Locked"
    const nextStatus = isCurrentlyLocked ? "Active" : "Locked"

    try {
      if (isCurrentlyLocked) {
        await platformService.unlockLibrary(lockTarget.id, lockReason)
      } else {
        await platformService.lockLibrary(lockTarget.id, lockReason)
      }

      setLibraries((prev) =>
        prev.map((l) =>
          l.id === lockTarget.id
            ? {
                ...l,
                planStatus: isCurrentlyLocked ? "Active" : "Locked",
                libraryStatus: isCurrentlyLocked ? "Active" : "Locked",
              }
            : l
        )
      )

      toast.success(isCurrentlyLocked ? "Library Unlocked" : "Library Locked", {
        description: `${lockTarget.name} status updated to ${nextStatus}.`,
      })
    } catch (err: unknown) {
      toast.error("Operation Failed", {
        description: getErrorMessage(
          err,
          "Failed to update library lock status."
        ),
      })
    } finally {
      setLockTarget(null)
      setLockReason("")
    }
  }

  const handleSuspendSubmit = async () => {
    if (!suspendTarget) return
    const isCurrentlySuspended = suspendTarget.libraryStatus === "Suspended"
    const nextStatus = isCurrentlySuspended ? "Active" : "Suspended"

    try {
      if (isCurrentlySuspended) {
        await platformService.unlockLibrary(suspendTarget.id, "Unsuspended")
      } else {
        await platformService.suspendLibrary(
          suspendTarget.id,
          suspendReason || "Compliance Review"
        )
      }

      setLibraries((prev) =>
        prev.map((l) =>
          l.id === suspendTarget.id ? { ...l, libraryStatus: nextStatus } : l
        )
      )

      toast.success(
        isCurrentlySuspended ? "Library Unsuspended" : "Library Suspended",
        {
          description: `${suspendTarget.name} status updated to ${nextStatus}.`,
        }
      )
    } catch (err: unknown) {
      toast.error("Operation Failed", {
        description: getErrorMessage(
          err,
          "Failed to update library suspension status."
        ),
      })
    } finally {
      setSuspendTarget(null)
      setSuspendReason("")
    }
  }

  const handleImpersonateSubmit = async () => {
    if (!impersonateTarget || !impersonateReason.trim()) {
      toast.error("Reason Required", {
        description:
          "You must provide a reason for the impersonation audit trail.",
      })
      return
    }
    setIsImpersonating(true)
    try {
      const res = await platformService.impersonateLibrary(
        impersonateTarget.id,
        impersonateReason.trim()
      )
      toast.success("Impersonation Session Ready", {
        description:
          "15-minute read-only token generated. Opening Library Panel...",
      })
      if (typeof window !== "undefined") {
        if (res?.view_as_token) {
          sessionStorage.setItem("view_as_token", res.view_as_token)
          sessionStorage.setItem("impersonated_org_id", impersonateTarget.id)
        }
        window.open(
          `/${lang}/library?impersonate=true&org_id=${impersonateTarget.id}`,
          "_blank"
        )
      }
      setImpersonateTarget(null)
      setImpersonateReason("")
    } catch (err: unknown) {
      toast.error("Impersonation Failed", {
        description: getErrorMessage(err, "Failed to impersonate library."),
      })
    } finally {
      setIsImpersonating(false)
    }
  }

  const handleDeleteSubmit = async (lib: PlatformLibraryRecord) => {
    try {
      await platformService.deleteLibrary(lib.id)
      setLibraries((prev) => prev.filter((l) => l.id !== lib.id))
      toast.success("Library Deleted", {
        description: `${lib.name} has been removed from platform directory.`,
      })
    } catch (err: unknown) {
      toast.error("Delete Failed", {
        description: getErrorMessage(err, "Failed to delete library."),
      })
    }
  }

  const handlePaymentSubmit = async () => {
    if (!paymentTarget || !paymentAmount) {
      toast.error("Amount Required")
      return
    }

    try {
      await platformService.recordManualPayment({
        library: paymentTarget.id,
        amount: Number(paymentAmount),
        method: paymentMethod,
      })

      setLibraries((prev) =>
        prev.map((l) =>
          l.id === paymentTarget.id
            ? {
                ...l,
                planStatus: "Active",
                libraryStatus: "Active",
                planFee: Number(paymentAmount),
              }
            : l
        )
      )

      toast.success("Payment Recorded", {
        description: `₹${paymentAmount} logged for ${paymentTarget.name}.`,
      })
    } catch (err: unknown) {
      toast.error("Payment Record Failed", {
        description: getErrorMessage(err, "Failed to log manual payment."),
      })
    } finally {
      setPaymentTarget(null)
      setPaymentAmount("")
    }
  }

  const getLibraryMeta = (lib: PlatformLibraryRecord) => {
    const isLocked =
      lib.planStatus === "Locked" || lib.libraryStatus === "Locked"
    const isInGrace = lib.planStatus === "Grace"
    const occupancyPct =
      lib.totalSeats > 0
        ? Math.min(100, Math.round((lib.liveStudents / lib.totalSeats) * 100))
        : 0
    const statusTone: "Locked" | "Grace" | "Active" = isLocked
      ? "Locked"
      : isInGrace
        ? "Grace"
        : "Active"

    return { isLocked, isInGrace, occupancyPct, statusTone }
  }

  const renderActionsMenu = (lib: PlatformLibraryRecord, isLocked: boolean) => {
    const isSuspended = lib.libraryStatus === "Suspended"

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 cursor-pointer"
            aria-label={`Actions for ${lib.name}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs">
            Manage Library
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/${lang}/platform/libraries/${lib.id}`}>
              <Eye className="size-3.5 me-2" /> View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/${lang}/platform/libraries/${lib.id}/edit`}>
              <Pencil className="size-3.5 me-2" /> Edit Library
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setPaymentTarget(lib)
              setPaymentAmount(String(lib.planFee || 2499))
            }}
          >
            <CreditCard className="size-3.5 me-2 text-primary" />
            Record Payment
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setImpersonateTarget(lib)}>
            <ShieldAlert className="size-3.5 me-2 text-amber-500" />
            Impersonate (15m)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setLockTarget(lib)}>
            {isLocked ? (
              <>
                <Unlock className="size-3.5 me-2 text-emerald-500" />
                Unlock Library
              </>
            ) : (
              <>
                <Lock className="size-3.5 me-2 text-amber-500" />
                Lock Library
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSuspendTarget(lib)}
            className={cn(
              isSuspended
                ? "text-emerald-500 focus:text-emerald-500"
                : "text-amber-500 focus:text-amber-500"
            )}
          >
            <ShieldAlert className="size-3.5 me-2" />
            {isSuspended ? "Unsuspend Library" : "Suspend Library"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleDeleteSubmit(lib)}
            className="text-rose-500 focus:text-rose-500 cursor-pointer"
          >
            <Trash2 className="size-3.5 me-2" />
            Delete Library
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Platform Libraries
          </h1>
          <Badge
            variant="outline"
            className="font-bold border-primary/30 text-primary bg-primary/10"
          >
            {libraries.length} Tenants
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${lang}/platform/library-requests`}>
              <Clock className="me-2 size-4 text-amber-500" />
              Requests Queue
            </Link>
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
            asChild
          >
            <Link href={`/${lang}/platform/libraries/add`}>
              <PlusCircle className="me-2 size-4" />
              Add Library
            </Link>
          </Button>
        </div>
      </div>

      {/* Dashboard-Matched Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
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
                  <span
                    className={cn(
                      "font-semibold flex items-center gap-1 truncate",
                      card.footerAlert
                        ? "text-rose-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {card.footerAlert && (
                      <AlertTriangle className="size-3 shrink-0" />
                    )}
                    {card.footerLeft}
                  </span>
                  {card.footerRight && (
                    <span className="text-[11px] font-medium text-muted-foreground/75 shrink-0">
                      {card.footerRight}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Directory Table Card (Search Toolbar + Clean Table + Pagination) */}
      <Card className="rounded-xl border border-border/70 bg-card/90 backdrop-blur-xs overflow-hidden shadow-xs">
        {/* Toolbar */}
        <div className="p-4 border-b border-border/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search library, code, city, owner..."
              className="pl-9 text-xs h-9 bg-background/60"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={planStatusFilter}
              onValueChange={(val) => {
                setPlanStatusFilter(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs bg-background/60">
                <SelectValue placeholder="Plan Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Plan States</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Grace">Grace Period</SelectItem>
                <SelectItem value="Locked">Locked</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Trial">Trial</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={libraryStatusFilter}
              onValueChange={(val) => {
                setLibraryStatusFilter(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs bg-background/60">
                <SelectValue placeholder="Library Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Op States</SelectItem>
                <SelectItem value="Active">Operational</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Locked">Locked</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
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

            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={() =>
                toast.success("Exporting library directory CSV...")
              }
            >
              <Download className="size-3.5 me-1.5" />
              Export
            </Button>

            <div
              role="group"
              aria-label="View mode"
              className="inline-flex items-center rounded-lg border border-border/70 bg-background/60 p-0.5 h-9"
            >
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
            </div>
          </div>
        </div>

        {/* Directory Views (Table / Grid) */}
        <CardContent className="p-0">
          {viewMode === "table" ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/35">
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ps-5">
                      Library
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Owner
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Location
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Plan & Renewal
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Occupancy
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
                  {paginatedLibraries.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        {isLoading ? (
                          <div className="flex flex-col items-center justify-center gap-2 py-8">
                            <RotateCcw className="size-6 text-primary animate-spin" />
                            <p className="text-xs font-semibold text-muted-foreground">
                              Loading libraries...
                            </p>
                          </div>
                        ) : libraries.length === 0 ? (
                          <div className="flex flex-col items-center justify-center gap-2 py-6">
                            <Building2 className="size-8 text-muted-foreground/60" />
                            <p className="font-bold text-foreground">
                              No Libraries Onboarded Yet
                            </p>
                            <p className="text-xs text-muted-foreground max-w-sm">
                              Get started by adding your first tenant library to
                              manage branches, subscriptions, and students.
                            </p>
                            <Button
                              size="sm"
                              className="mt-2 text-xs font-bold bg-primary text-primary-foreground"
                              asChild
                            >
                              <Link href={`/${lang}/platform/libraries/add`}>
                                + Onboard First Library
                              </Link>
                            </Button>
                          </div>
                        ) : (
                          "No libraries match the selected filters."
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedLibraries.map((lib) => {
                      const { isLocked, occupancyPct, statusTone } =
                        getLibraryMeta(lib)

                      return (
                        <TableRow
                          key={lib.id}
                          className="border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="ps-5 py-3.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <LibraryAvatar
                                name={lib.name}
                                code={lib.code}
                                src={lib.logo}
                                size="md"
                                status={statusTone}
                                showStatusDot
                                interactive
                              />
                              <div className="min-w-0">
                                <Link
                                  href={`/${lang}/platform/libraries/${lib.id}`}
                                  className="font-bold text-sm text-foreground hover:text-primary transition-colors block truncate"
                                >
                                  {lib.name}
                                </Link>
                                <span className="text-[11px] font-mono text-muted-foreground">
                                  {lib.code}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-3.5">
                            <div className="text-xs font-semibold text-foreground">
                              {lib.ownerName}
                            </div>
                            <div className="text-[11px] text-muted-foreground tabular-nums">
                              {lib.ownerPhone}
                            </div>
                          </TableCell>

                          <TableCell className="py-3.5">
                            <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                              <MapPin className="size-3 text-muted-foreground shrink-0" />
                              <span>
                                {lib.city}, {lib.state}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted-foreground ps-4">
                              {lib.branchesCount}{" "}
                              {lib.branchesCount > 1 ? "Branches" : "Branch"}
                            </div>
                          </TableCell>

                          <TableCell className="py-3.5">
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="font-bold text-[11px]"
                              >
                                {lib.planName}
                              </Badge>
                              <span className="text-xs font-bold tabular-nums text-foreground">
                                ₹
                                {Number(lib.planFee || 0).toLocaleString(
                                  "en-IN"
                                )}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              Exp: {lib.planEndDate || "Ongoing"}
                            </div>
                          </TableCell>

                          <TableCell className="py-3.5">
                            <div className="flex items-center justify-between gap-2 w-28 text-xs font-semibold tabular-nums text-foreground">
                              <span>
                                {lib.liveStudents} / {lib.totalSeats}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {occupancyPct}%
                              </span>
                            </div>
                            <div className="w-28 bg-muted h-1.5 rounded-full overflow-hidden mt-1.5">
                              <div
                                className="bg-primary h-full rounded-full transition-all"
                                style={{ width: `${occupancyPct}%` }}
                              />
                            </div>
                          </TableCell>

                          <TableCell className="py-3.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge
                                variant={
                                  lib.planStatus === "Active"
                                    ? "success"
                                    : lib.planStatus === "Grace"
                                      ? "warning"
                                      : "destructive"
                                }
                                className="font-bold text-[10px]"
                              >
                                {lib.planStatus}
                              </Badge>
                              {lib.libraryStatus !== "Active" && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-rose-500/30 text-rose-500"
                                >
                                  {lib.libraryStatus}
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-right pe-5 py-3.5">
                            {renderActionsMenu(lib, isLocked)}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          ) : paginatedLibraries.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-sm text-muted-foreground text-center p-6">
              {isLoading ? (
                <>
                  <RotateCcw className="size-8 text-primary animate-spin mb-2" />
                  <p className="font-bold text-foreground text-sm">
                    Loading libraries...
                  </p>
                </>
              ) : libraries.length === 0 ? (
                <>
                  <Building2 className="size-10 text-muted-foreground/60 mb-2" />
                  <p className="font-bold text-foreground text-base">
                    No Libraries Onboarded Yet
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1">
                    Get started by adding your first tenant library to manage
                    branches, subscriptions, and students.
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 text-xs font-bold bg-primary text-primary-foreground"
                    asChild
                  >
                    <Link href={`/${lang}/platform/libraries/add`}>
                      + Onboard First Library
                    </Link>
                  </Button>
                </>
              ) : (
                "No libraries match the selected filters."
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4 sm:p-5">
              {paginatedLibraries.map((lib) => {
                const { isLocked, isInGrace, occupancyPct, statusTone } =
                  getLibraryMeta(lib)
                const accentBar = isLocked
                  ? "from-rose-500/70 via-rose-500/25 to-transparent"
                  : isInGrace
                    ? "from-amber-500/70 via-amber-500/25 to-transparent"
                    : "from-emerald-500/60 via-primary/25 to-transparent"

                return (
                  <Card
                    key={lib.id}
                    className="group relative overflow-hidden rounded-xl border border-border/70 bg-background/50 hover:border-primary/40 hover:bg-card hover:shadow-md transition-all duration-200 flex flex-col"
                  >
                    <div
                      className={cn(
                        "absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r",
                        accentBar
                      )}
                    />

                    <CardContent className="p-4 sm:p-5 flex flex-col gap-4 flex-1">
                      {/* Top Identity & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <LibraryLogo
                            name={lib.name}
                            code={lib.code}
                            src={lib.logo}
                            size="md"
                            status={statusTone}
                            showStatusDot
                            interactive
                          />
                          <div className="min-w-0">
                            <Link
                              href={`/${lang}/platform/libraries/${lib.id}`}
                              className="font-bold text-sm text-foreground hover:text-primary transition-colors block truncate"
                            >
                              {lib.name}
                            </Link>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[11px] font-mono text-muted-foreground">
                                {lib.code}
                              </span>
                              <Badge
                                variant={
                                  lib.planStatus === "Active"
                                    ? "success"
                                    : lib.planStatus === "Grace"
                                      ? "warning"
                                      : "destructive"
                                }
                                className="font-bold text-[10px] px-1.5 py-0"
                              >
                                {lib.planStatus}
                              </Badge>
                              {lib.libraryStatus !== "Active" && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 border-rose-500/30 text-rose-500"
                                >
                                  {lib.libraryStatus}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {renderActionsMenu(lib, isLocked)}
                      </div>

                      {/* Essential Tenant Info */}
                      <div className="grid grid-cols-2 gap-3 text-xs border-y border-border/50 py-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Owner
                          </p>
                          <p className="font-semibold text-foreground truncate mt-0.5">
                            {lib.ownerName}
                          </p>
                          <p className="text-[11px] text-muted-foreground tabular-nums truncate">
                            {lib.ownerPhone}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Location
                          </p>
                          <p className="font-semibold text-foreground truncate mt-0.5 flex items-center gap-1">
                            <MapPin className="size-3 text-muted-foreground shrink-0" />
                            <span className="truncate">
                              {lib.city}, {lib.state}
                            </span>
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {lib.branchesCount}{" "}
                            {lib.branchesCount > 1 ? "Branches" : "Branch"}
                          </p>
                        </div>
                      </div>

                      {/* Plan & Seat Occupancy */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Badge
                              variant="outline"
                              className="font-bold text-[11px]"
                            >
                              {lib.planName}
                            </Badge>
                            <span className="font-bold tabular-nums text-foreground">
                              ₹
                              {Number(lib.planFee || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            Exp: {lib.planEndDate || "Ongoing"}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-[11px] font-semibold text-muted-foreground">
                              Seat Occupancy
                            </span>
                            <span className="font-bold tabular-nums text-foreground">
                              {lib.liveStudents} / {lib.totalSeats}{" "}
                              <span className="text-[11px] font-medium text-muted-foreground">
                                ({occupancyPct}%)
                              </span>
                            </span>
                          </div>
                          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full transition-all"
                              style={{ width: `${occupancyPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer CTA */}
                      <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          Joined {lib.joinedDate}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs font-semibold hover:border-primary/50 hover:text-primary"
                          asChild
                        >
                          <Link href={`/${lang}/platform/libraries/${lib.id}`}>
                            <Eye className="size-3.5 me-1.5" />
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>

        {/* Pagination Bar */}
        <div className="px-5 py-3.5 border-t border-border/60 bg-muted/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground tabular-nums">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {showingFrom}–{showingTo}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {filteredLibraries.length}
            </span>{" "}
            libraries
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Per page</span>
              <Select
                value={`${pageSize}`}
                onValueChange={(val) => {
                  setPageSize(Number(val))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-[68px] text-xs bg-background/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="top" align="center">
                  {[5, 6, 12, 24, 50].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Pagination className="w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (safePage > 1) setCurrentPage(safePage - 1)
                    }}
                    aria-disabled={safePage <= 1}
                    className={cn(
                      "h-8 text-xs",
                      safePage <= 1 && "pointer-events-none opacity-45"
                    )}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === safePage}
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(page)
                        }}
                        className="h-8 w-8 text-xs"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (safePage < totalPages) setCurrentPage(safePage + 1)
                    }}
                    aria-disabled={safePage >= totalPages}
                    className={cn(
                      "h-8 text-xs",
                      safePage >= totalPages && "pointer-events-none opacity-45"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </Card>

      {/* Lock / Unlock Confirmation Dialog */}
      <Dialog
        open={!!lockTarget}
        onOpenChange={(open) => !open && setLockTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {lockTarget && (
                <LibraryLogo
                  name={lockTarget.name}
                  code={lockTarget.code}
                  src={lockTarget.logo}
                  size="md"
                  status={
                    lockTarget.planStatus === "Locked" ? "Locked" : "Active"
                  }
                  showStatusDot
                />
              )}
              <div>
                <DialogTitle className="text-lg font-black">
                  {lockTarget?.planStatus === "Locked"
                    ? "Unlock Library"
                    : "Lock Library Operations"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {lockTarget?.name} ({lockTarget?.code}) •{" "}
                  {lockTarget?.liveStudents} students
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg">
              <p className="font-bold">Operational Impact:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                <li>Student app displays service pause banner</li>
                <li>Active student membership days pause automatically</li>
                <li>Staff portal restricts new student onboarding</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">
                Justification / Reason *
              </Label>
              <Textarea
                placeholder="e.g. Subscription overdue 5 days or compliance freeze."
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                className="text-xs h-20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLockTarget(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className={
                lockTarget?.planStatus === "Locked"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs font-bold"
              }
              onClick={handleLockSubmit}
            >
              {lockTarget?.planStatus === "Locked"
                ? "Confirm Unlock"
                : "Confirm Lock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog
        open={!!suspendTarget}
        onOpenChange={(open) => !open && setSuspendTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {suspendTarget && (
                <LibraryLogo
                  name={suspendTarget.name}
                  code={suspendTarget.code}
                  src={suspendTarget.logo}
                  size="md"
                  status="Suspended"
                  showStatusDot
                />
              )}
              <div>
                <DialogTitle className="text-lg font-black text-rose-500">
                  Suspend Library
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Full administrative freeze for {suspendTarget?.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg">
              Suspension logs out all staff and blocks student app logins.
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">
                Reason for Suspension *
              </Label>
              <Textarea
                placeholder="e.g. Terms of service violation or legal order."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="text-xs h-20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSuspendTarget(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs font-bold"
              onClick={handleSuspendSubmit}
            >
              Suspend Library
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Payment Dialog */}
      <Dialog
        open={!!paymentTarget}
        onOpenChange={(open) => !open && setPaymentTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {paymentTarget && (
                <LibraryLogo
                  name={paymentTarget.name}
                  code={paymentTarget.code}
                  src={paymentTarget.logo}
                  size="md"
                />
              )}
              <div>
                <DialogTitle className="text-lg font-black">
                  Record Subscription Payment
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {paymentTarget?.name} ({paymentTarget?.code}) •{" "}
                  {paymentTarget?.planName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold">
                Payment Amount (INR) *
              </Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Payment Method *</Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) =>
                  setPaymentMethod(
                    val as
                      | "UPI"
                      | "Card"
                      | "NetBanking"
                      | "Bank Transfer"
                      | "Cash"
                      | "Cheque"
                  )
                }
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">Direct UPI</SelectItem>
                  <SelectItem value="Card">Credit / Debit Card</SelectItem>
                  <SelectItem value="NetBanking">
                    NetBanking / Gateway
                  </SelectItem>
                  <SelectItem value="Bank Transfer">
                    NEFT / RTGS Bank Transfer
                  </SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Cash">Cash Receipt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPaymentTarget(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
              onClick={handlePaymentSubmit}
            >
              Record Payment • ₹{paymentAmount || "0"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Impersonate Dialog */}
      <Dialog
        open={Boolean(impersonateTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setImpersonateTarget(null)
            setImpersonateReason("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="size-5" />
              <span>Impersonate Library</span>
            </DialogTitle>
            <DialogDescription>
              Launch a 15-minute read-only Super Admin view-as session for{" "}
              <strong>{impersonateTarget?.name}</strong> (
              {impersonateTarget?.code}). Every action is recorded in the
              platform audit trail.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label
              htmlFor="page-impersonate-reason"
              className="text-xs font-semibold"
            >
              Reason for Impersonation{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="page-impersonate-reason"
              placeholder="e.g. Investigating attendance scanner issue reported in ticket #89"
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
              onClick={() => {
                setImpersonateTarget(null)
                setImpersonateReason("")
              }}
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
    </div>
  )
}
