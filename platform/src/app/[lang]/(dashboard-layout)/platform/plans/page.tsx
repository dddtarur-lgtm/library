"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { platformService } from "@/services/platform-service"
import { toast } from "sonner"
import {
  Building2,
  CheckCircle2,
  Copy,
  CopyPlus,
  ExternalLink,
  IndianRupee,
  Layers,
  MoreHorizontal,
  PauseCircle,
  Pencil,
  PlayCircle,
  PlusCircle,
  Search,
  Settings2,
  Sparkles,
  Tag,
  Trash2,
  Users,
} from "lucide-react"

import type {
  BillingCycle,
  CouponPromo,
  PlanAccent,
  PlanTier,
} from "./_components/plan-types"

import { initialAllLibrariesList } from "@/data/platform/platform-data"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CouponEditorDialog } from "./_components/coupon-editor-dialog"
import { PlanEditorDialog } from "./_components/plan-editor-dialog"
import { PlanLibrariesDialog } from "./_components/plan-libraries-dialog"
import {
  formatINR,
  initialCouponPromos,
  initialPlanTiers,
  matchLibraryToPlan,
} from "./_components/plan-types"

const PLAN_ACCENT_BAR: Record<PlanAccent, string> = {
  slate: "from-slate-500/80 via-slate-400/40 to-transparent",
  blue: "from-blue-500 via-sky-500/60 to-transparent",
  primary: "from-primary via-primary/70 to-transparent",
  amber: "from-amber-500 via-orange-400/60 to-transparent",
  emerald: "from-emerald-500 via-teal-400/60 to-transparent",
}

const PLAN_BADGE_TONE: Record<PlanAccent, string> = {
  slate:
    "bg-slate-500/12 text-slate-600 dark:text-slate-300 border-slate-500/20",
  blue: "bg-blue-500/12 text-blue-600 dark:text-blue-400 border-blue-500/20",
  primary: "bg-primary/15 text-primary border-primary/25",
  amber:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  emerald:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
}

export default function PlatformPlansPage() {
  const params = useParams()
  const lang = (params.lang as string) || "en"

  const [plans, setPlans] = useState<PlanTier[]>(initialPlanTiers)
  const [coupons, setCoupons] = useState<CouponPromo[]>(initialCouponPromos)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual")
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    let isMounted = true
    platformService
      .getSubscriptionPlans()
      .then((res: unknown) => {
        if (!isMounted) return
        const resObj = res as Record<string, unknown> | null | undefined
        const rawList = Array.isArray(res)
          ? res
          : Array.isArray(resObj?.data)
            ? (resObj.data as Record<string, unknown>[])
            : null
        if (Array.isArray(rawList) && rawList.length > 0) {
          const accents: PlanAccent[] = [
            "slate",
            "blue",
            "primary",
            "amber",
            "emerald",
          ]
          const mapped: PlanTier[] = (rawList as Record<string, unknown>[]).map(
            (p, idx) => ({
              id: String(p.id),
              name: String(p.name || `Plan ${idx + 1}`),
              tagline: String(
                p.tagline || p.description || "Platform subscription tier"
              ),
              monthlyFee: Number(
                p.monthlyFee ?? p.monthly_fee ?? p.price ?? 1999
              ),
              annualFee: Number(
                p.annualFee ??
                  p.annual_fee ??
                  Number(p.monthlyFee ?? p.monthly_fee ?? p.price ?? 1999) * 10
              ),
              maxSeats: Number(p.maxSeats ?? p.max_seats ?? 100),
              maxBranches: Number(p.maxBranches ?? p.max_branches ?? 1),
              maxSubAdmins: Number(p.maxSubAdmins ?? p.max_staff ?? 2),
              activeLibraries: Number(p.activeLibraries ?? 0),
              isPopular: idx === 1,
              isActive: Boolean(p.isActive ?? p.is_active ?? true),
              accent: accents[idx % accents.length],
              features: Array.isArray(p.features)
                ? (p.features as string[])
                : Object.keys(
                    (p.features as Record<string, unknown> | undefined) || {}
                  ),
            })
          )
          setPlans(mapped)
        }
      })
      .catch(() => {
        // Fallback to initialPlanTiers on error
      })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    platformService
      .getSubscriptionPlans()
      .then((res: unknown) => {
        if (!isMounted) return
        const resObj = res as Record<string, unknown> | null | undefined
        const rawList = Array.isArray(res)
          ? res
          : Array.isArray(resObj?.data)
            ? (resObj.data as Record<string, unknown>[])
            : null
        if (Array.isArray(rawList) && rawList.length > 0) {
          const accents: PlanAccent[] = [
            "slate",
            "blue",
            "primary",
            "amber",
            "emerald",
          ]
          const mapped: PlanTier[] = (
            rawList as Record<string, unknown>[]
          ).map((p, idx) => ({
            id: String(p.id),
            name: String(p.name || `Plan ${idx + 1}`),
            tagline: String(
              p.tagline || p.description || "Platform subscription tier"
            ),
            monthlyFee: Number(
              p.monthlyFee ?? p.monthly_fee ?? p.price ?? 1999
            ),
            annualFee: Number(
              p.annualFee ??
                p.annual_fee ??
                Number(p.monthlyFee ?? p.monthly_fee ?? p.price ?? 1999) * 10
            ),
            maxSeats: Number(p.maxSeats ?? p.max_seats ?? 100),
            maxBranches: Number(p.maxBranches ?? p.max_branches ?? 1),
            maxSubAdmins: Number(p.maxSubAdmins ?? p.max_staff ?? 2),
            activeLibraries: Number(p.activeLibraries ?? 0),
            isPopular: idx === 1,
            isActive: Boolean(p.isActive ?? p.is_active ?? true),
            accent: accents[idx % accents.length],
            features: Array.isArray(p.features)
              ? (p.features as string[])
              : Object.keys(
                  (p.features as Record<string, unknown> | undefined) || {}
                ),
          }))
          setPlans(mapped)
        }
      })
      .catch(() => {
        // Fallback to initialPlanTiers on error
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Plan editor dialog state
  const [planEditorOpen, setPlanEditorOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PlanTier | null>(null)

  // Selected plan libraries dialog state
  const [librariesDialogOpen, setLibrariesDialogOpen] = useState(false)
  const [selectedPlanForLibraries, setSelectedPlanForLibraries] =
    useState<PlanTier | null>(null)

  // Coupon editor & filtering state
  const [couponEditorOpen, setCouponEditorOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<CouponPromo | null>(null)
  const [couponSearch, setCouponSearch] = useState("")
  const [couponStatusFilter, setCouponStatusFilter] = useState<string>("All")

  const visiblePlans = useMemo(
    () => (showArchived ? plans : plans.filter((p) => p.isActive)),
    [plans, showArchived]
  )

  const archivedCount = useMemo(
    () => plans.filter((p) => !p.isActive).length,
    [plans]
  )

  const stats = useMemo(() => {
    const activePlans = plans.filter((p) => p.isActive)
    const totalLibraries = plans.reduce((sum, p) => sum + p.activeLibraries, 0)
    const estimatedMrr = plans.reduce(
      (sum, p) => sum + p.activeLibraries * p.monthlyFee,
      0
    )
    const activeCoupons = coupons.filter((c) => c.status === "Active").length
    const totalRedemptions = coupons.reduce((sum, c) => sum + c.redemptions, 0)

    return {
      activeTierCount: activePlans.length,
      totalTierCount: plans.length,
      totalLibraries,
      estimatedMrr,
      activeCoupons,
      totalRedemptions,
    }
  }, [plans, coupons])

  const filteredCoupons = useMemo(() => {
    const q = couponSearch.trim().toLowerCase()
    return coupons.filter((cpn) => {
      const matchesStatus =
        couponStatusFilter === "All" || cpn.status === couponStatusFilter
      if (!matchesStatus) return false
      if (!q) return true
      return (
        cpn.code.toLowerCase().includes(q) ||
        cpn.applicablePlan.toLowerCase().includes(q) ||
        cpn.discountLabel.toLowerCase().includes(q)
      )
    })
  }, [coupons, couponSearch, couponStatusFilter])

  const openCreatePlan = () => {
    setEditingPlan(null)
    setPlanEditorOpen(true)
  }

  const openEditPlan = (plan: PlanTier) => {
    setEditingPlan(plan)
    setPlanEditorOpen(true)
  }

  const openLibrariesForPlan = (plan: PlanTier) => {
    setSelectedPlanForLibraries(plan)
    setLibrariesDialogOpen(true)
  }

  const handleSavePlan = async (saved: PlanTier) => {
    setPlans((prev) => {
      const exists = prev.some((p) => p.id === saved.id)
      let next = exists
        ? prev.map((p) => (p.id === saved.id ? saved : p))
        : [...prev, saved]

      if (saved.isPopular) {
        next = next.map((p) =>
          p.id === saved.id ? p : { ...p, isPopular: false }
        )
      }
      return next
    })

    if (selectedPlanForLibraries?.id === saved.id) {
      setSelectedPlanForLibraries(saved)
    }

    try {
      const payload = {
        name: saved.name,
        tagline: saved.tagline,
        description: saved.tagline,
        monthly_fee: saved.monthlyFee,
        annual_fee: saved.annualFee,
        max_seats: saved.maxSeats,
        max_branches: saved.maxBranches,
        max_staff: saved.maxSubAdmins,
        features: saved.features,
        is_active: saved.isActive,
      }
      if (saved.id && !saved.id.startsWith("plan-")) {
        await platformService.updateSubscriptionPlan(saved.id, payload)
      } else {
        const created = (await platformService.createSubscriptionPlan(
          payload
        )) as Record<string, unknown> | null
        if (created?.id) {
          setPlans((prev) =>
            prev.map((p) =>
              p.id === saved.id ? { ...p, id: String(created.id) } : p
            )
          )
        }
      }
    } catch {
      // Local state is already updated
    }

    toast.success(
      editingPlan ? `${saved.name} Tier Updated` : `${saved.name} Tier Created`
    )
  }

  const handleDuplicatePlan = async (plan: PlanTier) => {
    const copy: PlanTier = {
      ...plan,
      id: `plan-${Date.now()}`,
      name: `${plan.name} Copy`,
      activeLibraries: 0,
      isPopular: false,
    }
    setPlans((prev) => [...prev, copy])
    try {
      const created = (await platformService.createSubscriptionPlan({
        name: copy.name,
        tagline: copy.tagline,
        monthly_fee: copy.monthlyFee,
        annual_fee: copy.annualFee,
        max_seats: copy.maxSeats,
        max_branches: copy.maxBranches,
        max_staff: copy.maxSubAdmins,
        features: copy.features,
        is_active: copy.isActive,
      })) as Record<string, unknown> | null
      if (created?.id) {
        setPlans((prev) =>
          prev.map((p) =>
            p.id === copy.id ? { ...p, id: String(created.id) } : p
          )
        )
      }
    } catch {
      // Keep local
    }
    try {
      const created = (await platformService.createSubscriptionPlan({
        name: copy.name,
        tagline: copy.tagline,
        monthly_fee: copy.monthlyFee,
        annual_fee: copy.annualFee,
        max_seats: copy.maxSeats,
        max_branches: copy.maxBranches,
        max_staff: copy.maxSubAdmins,
        features: copy.features,
        is_active: copy.isActive,
      })) as Record<string, unknown> | null
      if (created?.id) {
        setPlans((prev) =>
          prev.map((p) => (p.id === copy.id ? { ...p, id: String(created.id) } : p))
        )
      }
    } catch {
      // Keep local
    }
    toast.success(`Duplicated ${plan.name} tier`)
  }

  const handleTogglePlanActive = async (plan: PlanTier) => {
    const nextActive = !plan.isActive
    setPlans((prev) =>
      prev.map((p) => (p.id === plan.id ? { ...p, isActive: nextActive } : p))
    )
    try {
      if (plan.id && !plan.id.startsWith("plan-")) {
        await platformService.updateSubscriptionPlan(plan.id, {
          is_active: nextActive,
        })
      }
    } catch {
      // Keep local
    }
    toast.success(
      nextActive ? `${plan.name} activated` : `${plan.name} archived`
    )
  }

  const openCreateCoupon = () => {
    setEditingCoupon(null)
    setCouponEditorOpen(true)
  }

  const openEditCoupon = (coupon: CouponPromo) => {
    setEditingCoupon(coupon)
    setCouponEditorOpen(true)
  }

  const handleSaveCoupon = (saved: CouponPromo) => {
    setCoupons((prev) => {
      const exists = prev.some((c) => c.id === saved.id)
      return exists
        ? prev.map((c) => (c.id === saved.id ? saved : c))
        : [saved, ...prev]
    })
    toast.success(
      editingCoupon ? `Updated ${saved.code}` : `Coupon ${saved.code} Activated`
    )
  }

  const handleToggleCouponStatus = (coupon: CouponPromo) => {
    const nextStatus = coupon.status === "Active" ? "Paused" : "Active"
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, status: nextStatus } : c))
    )
    toast.success(`${coupon.code} marked ${nextStatus}`)
  }

  const handleDeleteCoupon = (coupon: CouponPromo) => {
    setCoupons((prev) => prev.filter((c) => c.id !== coupon.id))
    toast.success(`Deleted ${coupon.code}`)
  }

  const handleCopyCouponCode = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code)
    }
    toast.success(`Copied ${code}`)
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            Subscription Plans
          </h1>
          <Badge variant="outline" className="font-mono text-xs bg-card">
            {stats.activeTierCount} Active Tiers • {stats.totalLibraries}{" "}
            Libraries
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href={`/${lang}/platform/plans/coupons`}>
              <ExternalLink className="size-3.5" />
              Coupons Page
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openCreateCoupon}
            className="gap-1.5"
          >
            <Tag className="size-3.5" />
            New Coupon
          </Button>
          <Button
            size="sm"
            onClick={openCreatePlan}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold gap-1.5"
          >
            <PlusCircle className="size-4" />
            Add Tier
          </Button>
        </div>
      </div>

      {/* Dashboard-Matched KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border border-border/70 bg-card/90 backdrop-blur-xs rounded-xl shadow-xs">
          <div className="h-[2px] w-full bg-gradient-to-r from-indigo-500/80 via-indigo-400/30 to-transparent" />
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Active Plan Tiers
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight tabular-nums">
                  {stats.activeTierCount}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  of {stats.totalTierCount} total
                </span>
              </div>
            </div>
            <div className="size-9 rounded-lg bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Layers className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-border/70 bg-card/90 backdrop-blur-xs rounded-xl shadow-xs">
          <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500/80 via-emerald-400/30 to-transparent" />
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Enrolled Libraries
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight tabular-nums">
                  {stats.totalLibraries}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Paid Tenants
                </span>
              </div>
            </div>
            <div className="size-9 rounded-lg bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Building2 className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-border/70 bg-card/90 backdrop-blur-xs rounded-xl shadow-xs">
          <div className="h-[2px] w-full bg-gradient-to-r from-primary/80 via-primary/30 to-transparent" />
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Projected MRR
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight tabular-nums">
                  {formatINR(stats.estimatedMrr)}
                </span>
              </div>
            </div>
            <div className="size-9 rounded-lg bg-primary/12 text-primary flex items-center justify-center shrink-0">
              <IndianRupee className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-border/70 bg-card/90 backdrop-blur-xs rounded-xl shadow-xs">
          <div className="h-[2px] w-full bg-gradient-to-r from-amber-500/80 via-amber-400/30 to-transparent" />
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Active Promos
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight tabular-nums">
                  {stats.activeCoupons}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {stats.totalRedemptions} redemptions
                </span>
              </div>
            </div>
            <div className="size-9 rounded-lg bg-amber-500/12 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Tag className="size-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="plans" className="w-full space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="grid w-full sm:w-[340px] grid-cols-2">
            <TabsTrigger value="plans">Plans & Limits</TabsTrigger>
            <TabsTrigger value="coupons">
              Coupons ({coupons.length})
            </TabsTrigger>
          </TabsList>

          {archivedCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch
                id="show-archived-tiers"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <label
                htmlFor="show-archived-tiers"
                className="cursor-pointer font-medium"
              >
                Show Archived ({archivedCount})
              </label>
            </div>
          )}
        </div>

        {/* PLANS & QUOTAS TAB */}
        <TabsContent value="plans" className="space-y-6 mt-0">
          {/* Segmented Billing Cycle Switch */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              <span>Billing Preview</span>
            </div>

            <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  billingCycle === "annual"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annual
                <Badge className="h-4 px-1.5 text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0">
                  Save ~17%
                </Badge>
              </button>
            </div>
          </div>

          {/* Pricing Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {visiblePlans.map((plan) => {
              const displayPrice =
                billingCycle === "annual" ? plan.annualFee : plan.monthlyFee
              const annualMonthlyEq = Math.round(plan.annualFee / 12)
              const savingsPct =
                plan.monthlyFee > 0 && plan.annualFee < plan.monthlyFee * 12
                  ? Math.round(
                      ((plan.monthlyFee * 12 - plan.annualFee) /
                        (plan.monthlyFee * 12)) *
                        100
                    )
                  : 0
              const matchedProfiles = initialAllLibrariesList.filter((lib) =>
                matchLibraryToPlan(lib.planName, plan.name)
              ).length

              return (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden flex flex-col justify-between rounded-xl border bg-card transition-all ${
                    plan.isPopular
                      ? "border-primary/60 shadow-md ring-1 ring-primary/20"
                      : "border-border/80 hover:border-border"
                  } ${!plan.isActive ? "opacity-75" : ""}`}
                >
                  <div
                    className={`h-1 w-full bg-gradient-to-r ${
                      PLAN_ACCENT_BAR[plan.accent]
                    }`}
                  />

                  <CardHeader className="pb-3 pt-4 px-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-bold tracking-tight">
                            {plan.name}
                          </CardTitle>
                          {plan.isPopular && (
                            <Badge className="h-5 px-2 text-[10px] font-bold bg-primary text-primary-foreground border-0">
                              Popular
                            </Badge>
                          )}
                          {!plan.isActive && (
                            <Badge
                              variant="secondary"
                              className="h-5 text-[10px]"
                            >
                              Archived
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {plan.tagline}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditPlan(plan)}>
                            <Settings2 className="size-3.5 mr-2" />
                            Edit Tier Rules
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openLibrariesForPlan(plan)}
                          >
                            <Building2 className="size-3.5 mr-2" />
                            View Libraries ({plan.activeLibraries})
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicatePlan(plan)}
                          >
                            <CopyPlus className="size-3.5 mr-2" />
                            Duplicate Tier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleTogglePlanActive(plan)}
                          >
                            {plan.isActive ? (
                              <>
                                <PauseCircle className="size-3.5 mr-2" />
                                Archive Tier
                              </>
                            ) : (
                              <>
                                <PlayCircle className="size-3.5 mr-2" />
                                Activate Tier
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Price */}
                    <div className="pt-3 space-y-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold tracking-tight tabular-nums">
                          {formatINR(displayPrice)}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          / {billingCycle === "annual" ? "year" : "month"}
                        </span>
                      </div>
                      <div className="h-4 flex items-center gap-2 text-[11px] text-muted-foreground">
                        {billingCycle === "annual" ? (
                          <>
                            <span className="tabular-nums">
                              {formatINR(annualMonthlyEq)}/mo eq.
                            </span>
                            {savingsPct > 0 && (
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                Save {savingsPct}%
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="tabular-nums">
                            {formatINR(plan.annualFee)} billed annually
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="px-5 pb-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-4">
                      {/* 3-Column Quotas */}
                      <div className="grid grid-cols-3 gap-2 rounded-lg border border-border/70 bg-muted/25 p-2.5 text-center">
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                            Seats
                          </p>
                          <p className="text-sm font-bold tabular-nums">
                            {plan.maxSeats}
                          </p>
                        </div>
                        <div className="border-x border-border/60">
                          <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                            Branches
                          </p>
                          <p className="text-sm font-bold tabular-nums">
                            {plan.maxBranches}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                            Admins
                          </p>
                          <p className="text-sm font-bold tabular-nums">
                            {plan.maxSubAdmins}
                          </p>
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="space-y-2 text-xs">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-muted-foreground leading-snug">
                              {feat}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Footer Buttons: Selected Plan Libraries + Edit Tier */}
                    <div className="pt-3 border-t border-border/70 space-y-2">
                      <Button
                        type="button"
                        variant={plan.isPopular ? "default" : "secondary"}
                        size="sm"
                        onClick={() => openLibrariesForPlan(plan)}
                        className={`w-full justify-between font-semibold ${
                          plan.isPopular
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                            : ""
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="size-3.5" />
                          Selected Plan Libraries
                        </span>
                        <Badge
                          variant="outline"
                          className={`h-5 px-1.5 font-mono text-[11px] ${
                            plan.isPopular
                              ? "border-primary-foreground/30 text-primary-foreground bg-primary-foreground/10"
                              : "bg-background/70"
                          }`}
                        >
                          {matchedProfiles > 0
                            ? `${matchedProfiles}/${plan.activeLibraries}`
                            : plan.activeLibraries}
                        </Badge>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditPlan(plan)}
                        className="w-full gap-1.5 text-xs font-semibold"
                      >
                        <Settings2 className="size-3.5" />
                        Edit Tier Rules
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Tier Limits & Enrollment Comparison Matrix */}
          <Card className="border-border/80 bg-card rounded-xl overflow-hidden">
            <CardHeader className="py-3.5 px-5 border-b border-border/70 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold tracking-tight">
                Tier Quotas & Tenant Distribution
              </CardTitle>
              <Badge variant="outline" className="text-[11px] font-mono">
                {visiblePlans.length} Visible Tiers
              </Badge>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/25 hover:bg-muted/25">
                    <TableHead className="pl-5">Tier</TableHead>
                    <TableHead>Monthly</TableHead>
                    <TableHead>Annual</TableHead>
                    <TableHead>Max Seats</TableHead>
                    <TableHead>Branches</TableHead>
                    <TableHead>Sub-Admins</TableHead>
                    <TableHead>Enrolled Libraries</TableHead>
                    <TableHead className="text-right pr-5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiblePlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="pl-5 font-semibold">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs font-semibold ${PLAN_BADGE_TONE[plan.accent]}`}
                          >
                            {plan.name}
                          </Badge>
                          {!plan.isActive && (
                            <Badge variant="secondary" className="text-[10px]">
                              Archived
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums font-medium">
                        {formatINR(plan.monthlyFee)}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {formatINR(plan.annualFee)}
                      </TableCell>
                      <TableCell className="tabular-nums font-medium">
                        {plan.maxSeats}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {plan.maxBranches}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {plan.maxSubAdmins}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openLibrariesForPlan(plan)}
                          className="h-7 px-2.5 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
                        >
                          <Building2 className="size-3.5" />
                          {plan.activeLibraries} Libraries
                        </Button>
                      </TableCell>
                      <TableCell className="text-right pr-5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditPlan(plan)}
                          className="h-7 px-2.5 text-xs"
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COUPONS & PROMOS TAB */}
        <TabsContent value="coupons" className="space-y-4 mt-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-3.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={couponSearch}
                  onChange={(e) => setCouponSearch(e.target.value)}
                  placeholder="Search promo code or tier..."
                  className="pl-8 h-9 text-xs"
                />
              </div>

              <Select
                value={couponStatusFilter}
                onValueChange={setCouponStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-36 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Paused">Paused</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              onClick={openCreateCoupon}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold gap-1.5"
            >
              <PlusCircle className="size-4" />
              Create Coupon
            </Button>
          </div>

          <Card className="border-border/80 bg-card rounded-xl overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/25 hover:bg-muted/25">
                    <TableHead className="pl-5">Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Applicable Tier</TableHead>
                    <TableHead>Redemptions</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoupons.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No coupons match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCoupons.map((cpn) => {
                      const usagePct =
                        cpn.maxRedemptions > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (cpn.redemptions / cpn.maxRedemptions) * 100
                              )
                            )
                          : 0

                      return (
                        <TableRow key={cpn.id}>
                          <TableCell className="pl-5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-primary tracking-wider text-xs bg-primary/10 px-2 py-0.5 rounded-md">
                                {cpn.code}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6 text-muted-foreground hover:text-foreground"
                                onClick={() => handleCopyCouponCode(cpn.code)}
                                title="Copy promo code"
                              >
                                <Copy className="size-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm">
                                {cpn.discountLabel}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {cpn.type}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {cpn.applicablePlan}
                          </TableCell>
                          <TableCell className="min-w-[140px]">
                            <div className="space-y-1 max-w-[150px]">
                              <div className="flex items-center justify-between text-xs tabular-nums">
                                <span className="font-semibold">
                                  {cpn.redemptions}
                                </span>
                                <span className="text-muted-foreground">
                                  / {cpn.maxRedemptions}
                                </span>
                              </div>
                              <Progress value={usagePct} className="h-1.5" />
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground tabular-nums">
                            {cpn.validUntil}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                cpn.status === "Active"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : cpn.status === "Paused"
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                    : "bg-muted text-muted-foreground"
                              }
                            >
                              {cpn.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-5">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-foreground"
                                onClick={() => openEditCoupon(cpn)}
                                title="Edit coupon"
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              {cpn.status !== "Expired" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleToggleCouponStatus(cpn)}
                                  title={
                                    cpn.status === "Active"
                                      ? "Pause coupon"
                                      : "Resume coupon"
                                  }
                                >
                                  {cpn.status === "Active" ? (
                                    <PauseCircle className="size-3.5" />
                                  ) : (
                                    <PlayCircle className="size-3.5" />
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteCoupon(cpn)}
                                title="Delete coupon"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PlanEditorDialog
        open={planEditorOpen}
        onOpenChange={setPlanEditorOpen}
        initialPlan={editingPlan}
        onSave={handleSavePlan}
      />

      <PlanLibrariesDialog
        open={librariesDialogOpen}
        onOpenChange={setLibrariesDialogOpen}
        selectedPlan={selectedPlanForLibraries}
        allPlans={plans}
        onSelectPlan={setSelectedPlanForLibraries}
        libraries={initialAllLibrariesList}
        lang={lang}
      />

      <CouponEditorDialog
        open={couponEditorOpen}
        onOpenChange={setCouponEditorOpen}
        initialCoupon={editingCoupon}
        plans={plans}
        onSave={handleSaveCoupon}
      />
    </div>
  )
}
