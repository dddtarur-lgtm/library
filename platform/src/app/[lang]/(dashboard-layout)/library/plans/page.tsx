"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import {
  Banknote,
  Calendar,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Copy,
  CreditCard,
  Edit2,
  Gift,
  MoreHorizontal,
  Plus,
  Receipt,
  Search,
  Sparkles,
  Star,
  Tag,
  Trash2,
  UserCheck,
  Users,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import { initialFeePlans, type FeePlanItem } from "@/data/library-management-data"
import { studentsDatabase } from "@/data/students-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"
import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

const COMMON_BENEFITS = [
  "Fixed reserved study desk",
  "High-speed 500 Mbps Wi-Fi",
  "Personal locker eligibility",
  "Library book lending (up to 2 books)",
  "Air-conditioned quiet zone access",
  "Digital Student ID Card in mobile app",
  "Free chilled drinking water & power sockets",
]

export default function PlansCatalogPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [plans, setPlans] = useState<FeePlanItem[]>(initialFeePlans)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDurationTab, setSelectedDurationTab] = useState<"all" | "30" | "90" | "180" | "365">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all")

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<FeePlanItem | null>(null)

  // Quick Assign Plan Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedPlanForAssign, setSelectedPlanForAssign] = useState<FeePlanItem | null>(null)
  const [assignStudentId, setAssignStudentId] = useState(studentsDatabase[0]?.id || "")
  const [assignPaymentMode, setAssignPaymentMode] = useState<"Cash" | "UPI">("Cash")

  // Form states
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [durationDays, setDurationDays] = useState(30)
  const [price, setPrice] = useState(1500)
  const [badgeText, setBadgeText] = useState("")
  const [benefitsList, setBenefitsList] = useState<string[]>([
    "Fixed reserved study desk",
    "High-speed 500 Mbps Wi-Fi",
    "Personal locker eligibility",
    "Library book lending (up to 2 books)",
  ])
  const [customBenefitInput, setCustomBenefitInput] = useState("")

  // Filtered plans
  const filteredPlans = plans.filter((plan) => {
    if (statusFilter === "active" && !plan.isActive) return false
    if (statusFilter === "archived" && plan.isActive) return false

    if (selectedDurationTab !== "all" && plan.durationDays.toString() !== selectedDurationTab) {
      return false
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = plan.name.toLowerCase().includes(q)
      const matchDesc = plan.description.toLowerCase().includes(q)
      const matchBen = plan.benefits.some((b) => b.toLowerCase().includes(q))
      if (!matchName && !matchDesc && !matchBen) return false
    }
    return true
  })

  // Handlers
  const openCreateDialog = () => {
    setName("")
    setDescription("Full access library study membership with dedicated desk and high-speed Wi-Fi.")
    setDurationDays(30)
    setPrice(1500)
    setBadgeText("Most Popular")
    setBenefitsList([
      "Fixed reserved study desk",
      "High-speed 500 Mbps Wi-Fi",
      "Personal locker eligibility",
      "Library book lending (up to 2 books)",
    ])
    setCustomBenefitInput("")
    setCreateModalOpen(true)
  }

  const openEditDialog = (plan: FeePlanItem) => {
    setSelectedPlanForEdit(plan)
    setName(plan.name)
    setDescription(plan.description)
    setDurationDays(plan.durationDays)
    setPrice(plan.price)
    setBadgeText(plan.badgeText || "")
    setBenefitsList([...plan.benefits])
    setCustomBenefitInput("")
    setEditModalOpen(true)
  }

  const openAssignDialog = (plan: FeePlanItem) => {
    setSelectedPlanForAssign(plan)
    setAssignPaymentMode("Cash")
    setAssignModalOpen(true)
  }

  const handleConfirmAssignment = () => {
    if (!selectedPlanForAssign) return
    const student = studentsDatabase.find((s) => s.id === assignStudentId) || studentsDatabase[0]
    
    // Update plan enrolled count
    setPlans(
      plans.map((p) =>
        p.id === selectedPlanForAssign.id
          ? { ...p, enrolledStudentsCount: p.enrolledStudentsCount + 1 }
          : p
      )
    )

    setAssignModalOpen(false)
    toast.success(`Enrolled ${student.name} in "${selectedPlanForAssign.name}"!`, {
      description: `Collected ₹${selectedPlanForAssign.price} via ${assignPaymentMode}. Receipt reconciled in Cash Day-Book.`,
    })
  }

  const toggleBenefit = (benefit: string) => {
    if (benefitsList.includes(benefit)) {
      setBenefitsList(benefitsList.filter((b) => b !== benefit))
    } else {
      setBenefitsList([...benefitsList, benefit])
    }
  }

  const addCustomBenefit = () => {
    if (customBenefitInput.trim() && !benefitsList.includes(customBenefitInput.trim())) {
      setBenefitsList([...benefitsList, customBenefitInput.trim()])
      setCustomBenefitInput("")
    }
  }

  const handleCreatePlan = () => {
    if (!name.trim() || !price || !durationDays) {
      toast.error("Please provide a plan name, price, and duration.")
      return
    }
    const newPlan: FeePlanItem = {
      id: `plan-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || "Full library study plan with complete desk amenities.",
      durationDays,
      price,
      benefits: benefitsList.length > 0 ? benefitsList : ["Reserved study seat", "500 Mbps Wi-Fi"],
      isActive: true,
      sortOrder: plans.length + 1,
      enrolledStudentsCount: 0,
      badgeText: badgeText.trim() || undefined,
    }
    setPlans([newPlan, ...plans])
    setCreateModalOpen(false)
    toast.success(`Membership Plan "${name}" created successfully!`)
  }

  const handleSaveEditPlan = () => {
    if (!selectedPlanForEdit) return
    setPlans(
      plans.map((p) =>
        p.id === selectedPlanForEdit.id
          ? {
              ...p,
              name: name.trim(),
              description: description.trim(),
              durationDays,
              price,
              benefits: benefitsList,
              badgeText: badgeText.trim() || undefined,
            }
          : p
      )
    )
    setEditModalOpen(false)
    toast.success(`Plan "${name}" updated successfully!`)
  }

  const handleTogglePlan = (id: string, planName: string) => {
    setPlans(
      plans.map((p) => {
        if (p.id === id) {
          const next = !p.isActive
          if (next) {
            toast.success(`Plan "${planName}" is now active and available for enrollment.`)
          } else {
            toast.warning(`Plan "${planName}" archived (hidden from new admissions).`)
          }
          return { ...p, isActive: next }
        }
        return p
      })
    )
  }

  const handleDuplicatePlan = (plan: FeePlanItem) => {
    const copy: FeePlanItem = {
      ...plan,
      id: `plan-${Date.now()}`,
      name: `${plan.name} (Copy)`,
      enrolledStudentsCount: 0,
    }
    setPlans([...plans, copy])
    toast.success(`Duplicated "${plan.name}"`)
  }

  const handleDeletePlan = (id: string, planName: string) => {
    setPlans(plans.filter((p) => p.id !== id))
    toast.success(`Deleted plan "${planName}"`)
  }

  const activePlansCount = plans.filter((p) => p.isActive).length
  const totalStudentsEnrolled = plans.reduce((acc, p) => acc + p.enrolledStudentsCount, 0)

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-xs">
            <CreditCard className="size-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Membership Plans &amp; Pricing
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Set student fees, durations, and study amenities. Changes update automatically across admissions.
            </p>
          </div>
        </div>

        {/* Action Buttons & Fast Links */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={ensureLocalizedPathname("/pages/plans/memberships", lang)}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "h-9 text-xs gap-1.5 border-border rounded-md hover:bg-muted/30 cursor-pointer font-medium",
            })}
          >
            <Users className="size-3.5 text-muted-foreground" />
            <span>Active Memberships</span>
          </Link>

          <Link
            href={ensureLocalizedPathname("/pages/plans/dues", lang)}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "h-9 text-xs gap-1.5 border-border rounded-md hover:bg-muted/30 cursor-pointer font-medium",
            })}
          >
            <Receipt className="size-3.5 text-amber-500" />
            <span>Fee Dues</span>
          </Link>

          <Link
            href={ensureLocalizedPathname("/pages/plans/day-book", lang)}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "h-9 text-xs gap-1.5 border-border rounded-md hover:bg-muted/30 cursor-pointer font-medium",
            })}
          >
            <CircleDollarSign className="size-3.5 text-emerald-500" />
            <span>Cash Day-Book</span>
          </Link>

          <Button
            size="sm"
            onClick={openCreateDialog}
            className="h-9 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-md shadow-xs cursor-pointer"
          >
            <Plus className="size-4" />
            <span>+ Create New Plan</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Executive Metric Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden transition-all hover:border-primary/40">
          <CardContent className="p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Available Plans</span>
              <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Tag className="size-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">{activePlansCount} Plans</div>
            <p className="text-xs text-muted-foreground">Live &amp; active for student admissions</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden transition-all hover:border-emerald-500/40">
          <CardContent className="p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Enrolled Students</span>
              <div className="size-8 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Users className="size-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">{totalStudentsEnrolled} Active</div>
            <p className="text-xs text-emerald-500 font-medium">Currently studying on these tiers</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden transition-all hover:border-blue-500/40">
          <CardContent className="p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Avg. Monthly Rate</span>
              <div className="size-8 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Banknote className="size-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">₹1,680</div>
            <p className="text-xs text-muted-foreground">Average fee per student / month</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden transition-all hover:border-purple-500/40">
          <CardContent className="p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Special Discounts</span>
              <div className="size-8 rounded-md bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Gift className="size-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">3 Active Codes</div>
            <p className="text-xs text-purple-400 font-medium hover:underline cursor-pointer">
              <Link href={ensureLocalizedPathname("/pages/plans/coupons", lang)}>View discount codes →</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Interactive Duration Filter & Search Bar */}
      <div className="p-3 sm:p-4 rounded-lg border border-border bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Sleek Duration Segmented Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Plans" },
            { id: "30", label: "1 Month (30d)" },
            { id: "90", label: "3 Months (90d) • ⭐ Popular" },
            { id: "180", label: "6 Months (180d) • Save 15%" },
            { id: "365", label: "1 Year (365d) • Best Value" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedDurationTab(tab.id as any)}
              className={cn(
                "px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer",
                selectedDurationTab === tab.id
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search plan by name or perk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-xs bg-background border-border rounded-md"
            />
          </div>

          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-md border border-border shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-2.5 py-1 text-xs rounded-lg font-medium cursor-pointer transition-all",
                statusFilter === "all" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground"
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={cn(
                "px-2.5 py-1 text-xs rounded-lg font-medium cursor-pointer transition-all",
                statusFilter === "active" ? "bg-emerald-500/10 text-emerald-500 font-bold" : "text-muted-foreground"
              )}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("archived")}
              className={cn(
                "px-2.5 py-1 text-xs rounded-lg font-medium cursor-pointer transition-all",
                statusFilter === "archived" ? "bg-amber-500/10 text-amber-500 font-bold" : "text-muted-foreground"
              )}
            >
              Archived
            </button>
          </div>
        </div>
      </div>

      {/* 4. Balanced 3-Column Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-muted-foreground bg-card rounded-lg border border-border">
            <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <Search className="size-5" />
            </div>
            <div className="font-semibold text-sm text-foreground">No membership plans match your search</div>
            <p className="text-xs text-muted-foreground mt-1">Try selecting &quot;All Plans&quot; or clearing your search term.</p>
          </div>
        ) : (
          filteredPlans.map((plan) => {
            const monthlyRate = Math.round(plan.price / (plan.durationDays / 30))
            const dailyRate = Math.round(plan.price / plan.durationDays)
            const isHighlighted = plan.badgeText === "Most Popular" || plan.badgeText === "Best Value"

            return (
              <Card
                key={plan.id}
                className={cn(
                  "border rounded-lg bg-card shadow-xs flex flex-col justify-between relative transition-all duration-300 overflow-hidden group",
                  isHighlighted && plan.isActive
                    ? "border-primary/70 ring-1 ring-primary/40 shadow-lg shadow-primary/5 bg-gradient-to-b from-primary/[0.04] to-card"
                    : "border-border hover:border-border hover:shadow-sm",
                  !plan.isActive && "opacity-60 bg-muted/20 border-dashed"
                )}
              >
                {/* Popular or Custom Badge at Top */}
                {plan.badgeText && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge
                      className={cn(
                        "text-[11px] font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5",
                        isHighlighted
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      <Sparkles className="size-3" />
                      <span>{plan.badgeText}</span>
                    </Badge>
                  </div>
                )}

                {/* Card Header */}
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs font-mono px-2.5 py-0.5 bg-muted/50 border-border text-foreground rounded-lg">
                      ⏳ {plan.durationDays} Days Plan
                    </Badge>
                  </div>

                  <CardTitle className="text-lg font-bold text-foreground leading-snug line-clamp-1">
                    {plan.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-[34px] pt-1 leading-relaxed">
                    {plan.description}
                  </p>
                </CardHeader>

                {/* Card Body: Pricing & Features */}
                <CardContent className="p-6 pt-0 space-y-5 flex-1">
                  {/* Big Friendly Price Box */}
                  <div className="p-4 rounded-md bg-muted/30 border border-border space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-foreground font-mono tracking-tight">
                        ₹{plan.price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold">
                        / {plan.durationDays} days
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono font-semibold pt-1">
                      <span className="text-emerald-500 flex items-center gap-1">
                        <Zap className="size-3.5" />
                        <span>₹{monthlyRate.toLocaleString("en-IN")}/mo equivalent</span>
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-background border-border text-muted-foreground">
                        ~₹{dailyRate}/day
                      </Badge>
                    </div>
                  </div>

                  {/* Checklist of Included Privileges */}
                  <div className="space-y-2.5">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Included Study Amenities:
                    </div>
                    <ul className="space-y-2 text-xs">
                      {plan.benefits.slice(0, 5).map((b, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-muted-foreground">
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-foreground/90 font-medium leading-tight">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Primary Call to Action Button */}
                  <Button
                    onClick={() => openAssignDialog(plan)}
                    className="w-full h-9.5 text-xs font-bold gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 transition-all rounded-md cursor-pointer"
                  >
                    <UserCheck className="size-4" />
                    <span>Assign / Enroll Student</span>
                  </Button>
                </CardContent>

                {/* Card Footer: Active Switch, Students Count & Quick Actions */}
                <CardFooter className="p-4 px-6 border-t border-border bg-muted/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={plan.isActive}
                      onCheckedChange={() => handleTogglePlan(plan.id, plan.name)}
                      className="scale-75"
                    />
                    <span className="text-xs text-muted-foreground font-medium">
                      {plan.isActive ? "Available" : "Hidden"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(plan)}
                      className="h-8 text-xs text-primary hover:bg-primary/10 px-2.5 gap-1.5 cursor-pointer font-semibold rounded-lg"
                    >
                      <Edit2 className="size-3.5" />
                      <span>Edit</span>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 hover:bg-muted/40 rounded-lg cursor-pointer">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 text-xs">
                        <DropdownMenuItem onClick={() => handleDuplicatePlan(plan)} className="cursor-pointer">
                          <Copy className="size-3.5 mr-2" />
                          <span>Duplicate Plan</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeletePlan(plan.id, plan.name)}
                          className="text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          <Trash2 className="size-3.5 mr-2" />
                          <span>Delete Plan</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>

      {/* 5. Assign Plan to Student Modal (Instant 1-Click Receptionist Tool) */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <UserCheck className="size-5 text-primary" />
              Enroll Student in Plan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Quickly allocate this membership tier to an active student and record collection.
            </DialogDescription>
          </DialogHeader>

          {selectedPlanForAssign && (
            <div className="space-y-4 py-2 text-xs">
              {/* Selected Plan Summary Banner */}
              <div className="p-3.5 rounded-md bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground text-sm">{selectedPlanForAssign.name}</div>
                  <div className="text-muted-foreground text-xs mt-0.5">
                    {selectedPlanForAssign.durationDays} Days Duration
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-extrabold text-foreground text-base">
                    ₹{selectedPlanForAssign.price.toLocaleString("en-IN")}
                  </div>
                  <Badge variant="outline" className="text-[10px] text-emerald-500 bg-emerald-500/10 border-emerald-500/20">
                    Standard Fee
                  </Badge>
                </div>
              </div>

              {/* Student Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Select Registered Student <span className="text-red-500">*</span>
                </Label>
                <Select value={assignStudentId} onValueChange={setAssignStudentId}>
                  <SelectTrigger className="h-9 text-xs bg-background border-border rounded-md">
                    <SelectValue placeholder="Select student..." />
                  </SelectTrigger>
                  <SelectContent hideScrollButtons>
                    {studentsDatabase.slice(0, 15).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.studentId}) • {s.branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Mode Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Payment Received via</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignPaymentMode("Cash")}
                    className={cn(
                      "p-2.5 rounded-md border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2",
                      assignPaymentMode === "Cash"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-xs"
                        : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Banknote className="size-4" />
                    <span>Physical Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignPaymentMode("UPI")}
                    className={cn(
                      "p-2.5 rounded-md border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2",
                      assignPaymentMode === "UPI"
                        ? "bg-blue-500/10 border-blue-500 text-blue-500 shadow-xs"
                        : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <CreditCard className="size-4" />
                    <span>UPI / QR Scan</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-md bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-center gap-2">
                <Zap className="size-4 text-primary shrink-0" />
                <span>
                  Receipt will be automatically issued and reconciled in today&apos;s Cash Day-Book.
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignModalOpen(false)}
              className="text-xs h-9 rounded-md border-border cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmAssignment}
              className="text-xs h-9 font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md cursor-pointer"
            >
              Confirm Enrollment &amp; Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Create Plan Dialog (Friendly for Non-Tech Users) */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <CreditCard className="size-5 text-primary" />
              Create Membership Plan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Choose a duration and set the price for your library members.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Plan Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Plan Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. 1 Month Full Day Study"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs bg-background border-border rounded-md"
              />
            </div>

            {/* Duration Selector with Simple Buttons */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Select Duration</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "1 Month (30d)", days: 30 },
                  { label: "3 Months (90d)", days: 90 },
                  { label: "6 Months (180d)", days: 180 },
                  { label: "1 Year (365d)", days: 365 },
                ].map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => setDurationDays(preset.days)}
                    className={cn(
                      "p-2.5 rounded-md border text-left transition-all cursor-pointer",
                      durationDays === preset.days
                        ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                        : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="text-xs">{preset.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Input & Badge */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Fee Amount (₹ INR) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="h-9 pl-7 text-xs bg-background border-border rounded-md font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Promotion Badge (Optional)</Label>
                <Input
                  placeholder="e.g. Most Popular"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  className="h-9 text-xs bg-background border-border rounded-md"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Short Description</Label>
              <Textarea
                rows={2}
                placeholder="What is special about this plan?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs bg-background border-border rounded-md"
              />
            </div>

            {/* Common Amenities Checklist */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Select Included Perks</Label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {COMMON_BENEFITS.map((benefit) => {
                  const isChecked = benefitsList.includes(benefit)
                  return (
                    <div
                      key={benefit}
                      onClick={() => toggleBenefit(benefit)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors text-xs",
                        isChecked
                          ? "bg-primary/10 border-primary/40 text-foreground font-medium"
                          : "bg-muted/20 border-border text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      <div
                        className={cn(
                          "size-4 rounded flex items-center justify-center shrink-0 border",
                          isChecked ? "bg-primary border-primary text-primary-foreground" : "border-border"
                        )}
                      >
                        {isChecked && <Check className="size-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{benefit}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Add Custom Perk */}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom perk..."
                value={customBenefitInput}
                onChange={(e) => setCustomBenefitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCustomBenefit()
                  }
                }}
                className="h-8 text-xs bg-background border-border rounded-md"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomBenefit}
                className="h-8 text-xs shrink-0 rounded-md border-border cursor-pointer"
              >
                + Add
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
              className="text-xs h-9 rounded-md border-border cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreatePlan}
              className="text-xs h-9 font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md cursor-pointer"
            >
              Save &amp; Publish Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. Edit Plan Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Edit2 className="size-5 text-primary" />
              Edit Membership Plan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update pricing, perks, and terms for &quot;{selectedPlanForEdit?.name}&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Plan Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs bg-background border-border rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Duration (Days)</Label>
                <Input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="h-9 text-xs bg-background border-border rounded-md font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Price (₹ INR)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="h-9 pl-7 text-xs bg-background border-border rounded-md font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Promotion Badge</Label>
              <Input
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="e.g. Most Popular"
                className="h-9 text-xs bg-background border-border rounded-md"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Short Description</Label>
              <Textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs bg-background border-border rounded-md"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Included Perks</Label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {COMMON_BENEFITS.map((benefit) => {
                  const isChecked = benefitsList.includes(benefit)
                  return (
                    <div
                      key={benefit}
                      onClick={() => toggleBenefit(benefit)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors text-xs",
                        isChecked
                          ? "bg-primary/10 border-primary/40 text-foreground font-medium"
                          : "bg-muted/20 border-border text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      <div
                        className={cn(
                          "size-4 rounded flex items-center justify-center shrink-0 border",
                          isChecked ? "bg-primary border-primary text-primary-foreground" : "border-border"
                        )}
                      >
                        {isChecked && <Check className="size-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{benefit}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
              className="text-xs h-9 rounded-md border-border cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEditPlan}
              className="text-xs h-9 font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md cursor-pointer"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
