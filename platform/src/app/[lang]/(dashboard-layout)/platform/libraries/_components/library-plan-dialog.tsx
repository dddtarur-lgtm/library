"use client"

import { useState } from "react"
import { Building2, Check, Globe, Sparkles, Users } from "lucide-react"

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

export interface LibraryPlanOption {
  id: string
  name: string
  billingCycle: "Monthly" | "Quarterly" | "Annual"
  fee: number
  branchesLimit: number
  seatsLimit: number
  popular?: boolean
  features: string[]
}

const LIBRARY_PLANS: LibraryPlanOption[] = [
  {
    id: "starter-monthly",
    name: "Starter",
    billingCycle: "Monthly",
    fee: 2400,
    branchesLimit: 1,
    seatsLimit: 100,
    features: [
      "1 Physical Branch",
      "Up to 100 Desks",
      "QR Attendance App",
      "Basic Fee Receipts",
    ],
  },
  {
    id: "growth-quarterly",
    name: "Growth",
    billingCycle: "Quarterly",
    fee: 11400,
    branchesLimit: 2,
    seatsLimit: 250,
    features: [
      "Up to 2 Branches",
      "Up to 250 Desks",
      "Google/Microsoft OAuth Mail",
      "Automated Renewal Reminders",
    ],
  },
  {
    id: "pro-annual",
    name: "Pro",
    billingCycle: "Annual",
    fee: 42000,
    branchesLimit: 4,
    seatsLimit: 450,
    popular: true,
    features: [
      "Up to 4 Branches",
      "Up to 450 Desks",
      "Public Library Microsite",
      "Priority WhatsApp Alerts",
    ],
  },
  {
    id: "enterprise-annual",
    name: "Enterprise",
    billingCycle: "Annual",
    fee: 72000,
    branchesLimit: 10,
    seatsLimit: 1000,
    features: [
      "Up to 10 Branches",
      "1,000+ Custom Desks",
      "Custom Domain Microsite",
      "Dedicated Account Manager",
    ],
  },
]

interface LibraryPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "select" | "review"
  currentPlanName?: string
  onSelectPlan: (plan: LibraryPlanOption) => void
}

export function LibraryPlanDialog({
  open,
  onOpenChange,
  mode,
  currentPlanName,
  onSelectPlan,
}: LibraryPlanDialogProps) {
  const initialSelected =
    LIBRARY_PLANS.find((p) => p.name === currentPlanName)?.id ||
    LIBRARY_PLANS[2].id
  const [selectedId, setSelectedId] = useState(initialSelected)

  const activePlan =
    LIBRARY_PLANS.find((p) => p.id === selectedId) || LIBRARY_PLANS[2]

  const handleConfirm = () => {
    onSelectPlan(activePlan)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
            <Sparkles className="size-4 text-primary" />
            <span>
              {mode === "select"
                ? "Select Platform Subscription Plan"
                : "Review & Switch Platform Plan"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Choose branch quota, desk limit, and billing cycle for this tenant.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
          {LIBRARY_PLANS.map((plan) => {
            const isSelected = plan.id === selectedId
            const isCurrent = plan.name === currentPlanName

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedId(plan.id)}
                className={cn(
                  "text-left rounded-xl border p-3.5 transition-all cursor-pointer flex flex-col gap-2.5",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs"
                    : "border-border/80 bg-background/60 hover:border-primary/40 hover:bg-muted/30"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-foreground">
                        {plan.name}
                      </span>
                      {plan.popular && (
                        <Badge className="text-[10px] px-1.5 py-0 font-bold">
                          Recommended
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 border-emerald-500/40 text-emerald-500"
                        >
                          Current
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {plan.billingCycle} Billing
                    </span>
                  </div>

                  <span className="text-base font-black text-foreground tabular-nums">
                    ₹{plan.fee.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-semibold text-foreground/90 pt-1 border-t border-border/50">
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="size-3 text-primary" />
                    {plan.branchesLimit}{" "}
                    {plan.branchesLimit > 1 ? "Branches" : "Branch"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3 text-emerald-500" />
                    {plan.seatsLimit} Seats
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Globe className="size-3 text-violet-500" />
                    Microsite
                  </span>
                </div>

                <ul className="space-y-1 text-[11px] text-muted-foreground">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-1.5">
                      <Check className="size-3 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-border/70">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            onClick={handleConfirm}
          >
            <Check className="size-3.5" />
            <span>
              Select {activePlan.name} • ₹
              {activePlan.fee.toLocaleString("en-IN")}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
