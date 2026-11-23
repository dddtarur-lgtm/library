"use client"

import { useEffect, useState } from "react"

import type {
  CouponDiscountType,
  CouponPromo,
  CouponStatus,
  PlanTier,
} from "./plan-types"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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

interface CouponEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialCoupon: CouponPromo | null
  plans: PlanTier[]
  onSave: (coupon: CouponPromo) => void
}

export function CouponEditorDialog({
  open,
  onOpenChange,
  initialCoupon,
  plans,
  onSave,
}: CouponEditorDialogProps) {
  const [code, setCode] = useState("")
  const [type, setType] = useState<CouponDiscountType>("Percentage")
  const [discountValue, setDiscountValue] = useState("20")
  const [applicablePlan, setApplicablePlan] = useState("All Tiers")
  const [maxRedemptions, setMaxRedemptions] = useState("100")
  const [validUntil, setValidUntil] = useState("2026-12-31")
  const [status, setStatus] = useState<CouponStatus>("Active")

  useEffect(() => {
    if (!open) return
    if (initialCoupon) {
      setCode(initialCoupon.code)
      setType(initialCoupon.type)
      setDiscountValue(String(initialCoupon.discountValue))
      setApplicablePlan(initialCoupon.applicablePlan)
      setMaxRedemptions(String(initialCoupon.maxRedemptions))
      setValidUntil(initialCoupon.validUntil)
      setStatus(initialCoupon.status)
    } else {
      setCode("")
      setType("Percentage")
      setDiscountValue("20")
      setApplicablePlan("All Tiers")
      setMaxRedemptions("100")
      setValidUntil("2026-12-31")
      setStatus("Active")
    }
  }, [open, initialCoupon])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "")
    if (!cleanCode) return

    const val = Math.max(1, Number(discountValue) || 1)
    const clampedPct = type === "Percentage" ? Math.min(100, val) : val
    const discountLabel =
      type === "Percentage"
        ? `${clampedPct}% OFF`
        : `₹${clampedPct.toLocaleString("en-IN")} Flat`

    onSave({
      id: initialCoupon?.id ?? `cpn-${Date.now()}`,
      code: cleanCode,
      discountValue: clampedPct,
      discountLabel,
      type,
      applicablePlan,
      validUntil: validUntil || "2026-12-31",
      redemptions: initialCoupon?.redemptions ?? 0,
      maxRedemptions: Math.max(1, Number(maxRedemptions) || 1),
      status,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">
            {initialCoupon
              ? `Edit Coupon ${initialCoupon.code}`
              : "Create Promo Coupon"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label
              htmlFor="cpn-code"
              className="text-xs font-semibold uppercase text-muted-foreground"
            >
              Coupon Code
            </Label>
            <Input
              id="cpn-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. LAUNCH25"
              className="font-mono font-semibold uppercase tracking-wider"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="cpn-type"
                className="text-xs font-semibold uppercase text-muted-foreground"
              >
                Discount Type
              </Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as CouponDiscountType)}
              >
                <SelectTrigger id="cpn-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Percentage">Percentage (%)</SelectItem>
                  <SelectItem value="Fixed Amount">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="cpn-value"
                className="text-xs font-semibold uppercase text-muted-foreground"
              >
                {type === "Percentage" ? "Percent Off (%)" : "Flat Amount (₹)"}
              </Label>
              <Input
                id="cpn-value"
                type="number"
                min={1}
                max={type === "Percentage" ? 100 : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="cpn-tier"
                className="text-xs font-semibold uppercase text-muted-foreground"
              >
                Applicable Tier
              </Label>
              <Select value={applicablePlan} onValueChange={setApplicablePlan}>
                <SelectTrigger id="cpn-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Tiers">All Tiers</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="cpn-max"
                className="text-xs font-semibold uppercase text-muted-foreground"
              >
                Max Redemptions
              </Label>
              <Input
                id="cpn-max"
                type="number"
                min={1}
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="cpn-expiry"
                className="text-xs font-semibold uppercase text-muted-foreground"
              >
                Valid Until
              </Label>
              <Input
                id="cpn-expiry"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="cpn-status"
                className="text-xs font-semibold uppercase text-muted-foreground"
              >
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as CouponStatus)}
              >
                <SelectTrigger id="cpn-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Paused">Paused</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground font-bold"
            >
              {initialCoupon ? "Save Coupon" : "Activate Coupon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
