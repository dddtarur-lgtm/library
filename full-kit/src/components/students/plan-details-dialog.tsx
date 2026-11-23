"use client"

import { useEffect, useState } from "react"
import {
  Armchair,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export interface PlanOption {
  id: string
  name: string
  duration: string
  days: number
  price: number
  badge?: string
  savings?: string
  popular?: boolean
  description: string
  features: string[]
}

export const LIBRARY_PLANS: PlanOption[] = [
  {
    id: "1-month",
    name: "Standard Tier (1 Month)",
    duration: "1 Month",
    days: 30,
    price: 1200,
    badge: "Flexible",
    description: "Standard silent hall study plan with essential amenities.",
    features: [
      "Standard Silent Wing Access",
      "High-Speed 5G Wi-Fi",
      "Power Sockets at Every Desk",
      "RO Drinking Water",
    ],
  },
  {
    id: "3-month",
    name: "Quarterly Premium (3 Months)",
    duration: "3 Months",
    days: 90,
    price: 3300,
    badge: "Most Popular",
    savings: "Save ₹300",
    popular: true,
    description: "Comprehensive exam cycle plan with reserved dedicated seat.",
    features: [
      "Dedicated Reserved Desk",
      "High-Speed 5G Wi-Fi",
      "Discussion Room (4 hrs/wk)",
      "Locker Facility Included",
    ],
  },
  {
    id: "6-month",
    name: "Semi-Annual Scholar (6 Months)",
    duration: "6 Months",
    days: 180,
    price: 6000,
    badge: "Best Value",
    savings: "Save ₹1,200",
    description: "Long-term preparation package with priority seat booking.",
    features: [
      "Fixed Prime Dedicated Seat",
      "Free Private Locker",
      "Discussion Room Access",
      "24/7 QR Turnstile Gate Pass",
    ],
  },
  {
    id: "1-year",
    name: "Annual Dedicated (1 Year)",
    duration: "1 Year",
    days: 365,
    price: 11000,
    badge: "Ultimate",
    savings: "Save ₹3,400",
    description: "All-inclusive annual pass for dedicated competitive aspirants.",
    features: [
      "Prime Quiet Corner Desk",
      "Free Private Locker & Keys",
      "Unlimited Discussion Access",
      "Priority Staff Support & Mentor Desk",
    ],
  },
]

export interface PlanDetailsDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  currentPlan?: string
  onSelectPlan?: (plan: PlanOption) => void
  mode?: "select" | "review"
  studentName?: string
  studentId?: string
  seatNo?: string
  shift?: string
  joinDate?: string
  dueDate?: string
  paidAmount?: number
  totalFee?: number
  feeStatus?: string
}

export function PlanDetailsDialog({
  open,
  onOpenChange,
  trigger,
  currentPlan = "Quarterly Premium (3 Months)",
  onSelectPlan,
  mode = "select",
  studentName = "Student",
  studentId,
  seatNo = "Seat-042",
  shift = "Morning (7:00 AM - 2:00 PM)",
  joinDate,
  dueDate,
  paidAmount,
  totalFee,
  feeStatus = "Paid",
}: PlanDetailsDialogProps) {
  // Find initial plan object
  const findMatchingPlan = (planStr?: string) => {
    if (!planStr) return LIBRARY_PLANS[1]
    const lower = planStr.toLowerCase()
    return (
      LIBRARY_PLANS.find(
        (p) =>
          p.name.toLowerCase() === lower ||
          p.duration.toLowerCase() === lower ||
          lower.includes(p.duration.toLowerCase())
      ) || LIBRARY_PLANS[1]
    )
  }

  const initialPlan = findMatchingPlan(currentPlan)
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlan.id)
  const isSelectMode = mode === "select"

  // Synchronize active plan selection whenever dialog opens or currentPlan changes
  useEffect(() => {
    if (open) {
      const matched = findMatchingPlan(currentPlan)
      setSelectedPlanId(matched.id)
    }
  }, [open, currentPlan])

  const activePlan =
    LIBRARY_PLANS.find((p) => p.id === selectedPlanId) || initialPlan

  const handleConfirm = () => {
    if (onSelectPlan) {
      onSelectPlan(activePlan)
    }
    if (onOpenChange) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <CreditCard className="size-5 text-primary shrink-0" />
              <span>
                {isSelectMode
                  ? "Select Membership Plan"
                  : "Review Current Plan Details"}
              </span>
            </DialogTitle>
            <Badge
              variant="outline"
              className="text-[11px] font-semibold border-primary/30 text-primary bg-primary/5"
            >
              {activePlan.duration}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {isSelectMode
              ? `Choose an admission subscription tier for ${studentName}${studentId ? ` (${studentId})` : ""}.`
              : `Active subscription details and entitlements for ${studentName}${studentId ? ` (${studentId})` : ""}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Plan Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LIBRARY_PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={cn(
                    "relative rounded-xl border p-3.5 transition-all duration-150 flex flex-col justify-between space-y-2.5 cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20"
                      : "border-border/80 bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  {/* Top Row: Title, Badge, and Radio */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-foreground">
                          {plan.duration}
                        </span>
                        {!isSelectMode && plan.id === initialPlan.id && (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5 py-0 h-4.5">
                            Active Plan
                          </Badge>
                        )}
                        {plan.badge && (
                          <Badge
                            className={cn(
                              "text-[10px] font-bold px-1.5 py-0 h-4.5",
                              plan.popular
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground border border-border"
                            )}
                          >
                            {plan.badge}
                          </Badge>
                        )}
                        {plan.savings && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {plan.savings}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {plan.description}
                      </p>
                    </div>

                    {/* Radio Indicator */}
                    <div
                      className={cn(
                        "size-4.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40 bg-background"
                      )}
                    >
                      {isSelected && <Check className="size-3 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Price Row */}
                  <div className="flex items-baseline gap-1 pt-1 border-t border-border/50">
                    <span className="text-lg font-black text-foreground">
                      ₹{plan.price.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      / {plan.days} days
                    </span>
                  </div>

                  {/* Features Bullet Points */}
                  <ul className="space-y-1 text-[11px] text-muted-foreground pt-1">
                    {plan.features.slice(0, 3).map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <Check className="size-3 text-emerald-500 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2 border-t border-border/70">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs cursor-pointer"
            onClick={() => onOpenChange?.(false)}
          >
            {isSelectMode ? "Cancel" : "Close"}
          </Button>
          {isSelectMode ? (
            <Button
              type="button"
              size="sm"
              className="text-xs font-bold bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 h-8.5 px-3.5 gap-1.5 shadow-xs"
              onClick={handleConfirm}
            >
              <Check className="size-3.5" />
              <span>Select Plan • ₹{activePlan.price.toLocaleString()}</span>
            </Button>
          ) : onSelectPlan && activePlan.id !== initialPlan.id ? (
            <Button
              type="button"
              size="sm"
              className="text-xs font-bold bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 h-8.5 px-3.5 gap-1.5 shadow-xs"
              onClick={handleConfirm}
            >
              <Check className="size-3.5" />
              <span>Switch to Plan • ₹{activePlan.price.toLocaleString()}</span>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="text-xs font-semibold bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90"
              onClick={() => onOpenChange?.(false)}
            >
              <span>Done</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
