"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  ChevronLeft,
  Copy,
  Gift,
  Plus,
  Share2,
  Sparkles,
  Tag,
  Trash2,
  Users,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function CouponsAndReferralsPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [coupons, setCoupons] = useState([
    { id: "c-1", code: "DIWALI300", type: "Flat Amount", value: 300, minPurchase: 1800, validUntil: "15 Nov 2026", usedCount: 24, limit: 100, isActive: true },
    { id: "c-2", code: "EARLYBIRD10", type: "Percentage", value: 10, minPurchase: 1200, validUntil: "30 Nov 2026", usedCount: 58, limit: 200, isActive: true },
    { id: "c-3", code: "ASPIRANT500", type: "Flat Amount", value: 500, minPurchase: 4800, validUntil: "31 Dec 2026", usedCount: 14, limit: 50, isActive: true },
  ])

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newCode, setNewCode] = useState("")
  const [discountType, setDiscountType] = useState<"Flat Amount" | "Percentage">("Flat Amount")
  const [discountVal, setDiscountVal] = useState(200)
  const [minSpend, setMinSpend] = useState(1500)
  const [validUntil, setValidUntil] = useState("30 Nov 2026")

  const handleCreateCoupon = () => {
    if (!newCode || !discountVal) return
    setCoupons([
      ...coupons,
      {
        id: `c-${Date.now()}`,
        code: newCode.toUpperCase(),
        type: discountType,
        value: discountVal,
        minPurchase: minSpend,
        validUntil,
        usedCount: 0,
        limit: 100,
        isActive: true,
      },
    ])
    setCreateModalOpen(false)
    setNewCode("")
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden space-y-4 p-3 sm:p-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href={ensureLocalizedPathname("/pages/plans", lang)}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0",
          })}
        >
          <ChevronLeft className="size-4" />
          <span>Back to Plans Catalog</span>
        </Link>
        <span className="text-xs font-mono text-muted-foreground">
          Promotional Discounts & Referral Rewards (PRD §17 & SQL referral_codes)
        </span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Gift className="size-5 text-purple-600" />
            Offers, Coupons & Student Referral Rewards
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage promotional coupon vouchers, seasonal festive discounts and student referral incentives (PRD §17)
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
        >
          <Plus className="size-3.5" />
          <span>Create Coupon Code</span>
        </Button>
      </div>

      {/* Grid: Coupons Table + Referral Program Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Active Coupons */}
        <div className="lg:col-span-8 space-y-3">
          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Tag className="size-4 text-primary" />
                Active Discount Coupons
              </CardTitle>
              <CardDescription className="text-xs">
                Students can enter these codes at online Razorpay checkout or desk billing.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold">Promo Code</TableHead>
                    <TableHead className="text-xs font-bold">Discount</TableHead>
                    <TableHead className="text-xs font-bold">Min Purchase</TableHead>
                    <TableHead className="text-xs font-bold">Valid Until</TableHead>
                    <TableHead className="text-xs font-bold text-center">Redeemed</TableHead>
                    <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((c) => (
                    <TableRow key={c.id} className="text-xs">
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-primary">
                          <span>{c.code}</span>
                          <Copy className="size-3 opacity-60 hover:opacity-100 cursor-pointer" />
                        </div>
                      </TableCell>

                      <TableCell className="font-semibold text-foreground">
                        {c.type === "Flat Amount" ? `₹${c.value} OFF` : `${c.value}% OFF`}
                      </TableCell>

                      <TableCell className="font-mono text-muted-foreground">
                        ₹{c.minPurchase}
                      </TableCell>

                      <TableCell className="font-mono text-muted-foreground text-[11px]">
                        {c.validUntil}
                      </TableCell>

                      <TableCell className="text-center font-mono">
                        {c.usedCount} / {c.limit}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCoupons(coupons.filter((x) => x.id !== c.id))}
                          className="size-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right: Referral Rules & Leaderboard */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Share2 className="size-4 text-purple-600" />
                Student Referral Rules
              </CardTitle>
              <CardDescription className="text-xs">
                Incentivize existing students to bring peers (SQL referral_history).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-400 space-y-1">
                <div className="font-bold">Active Referral Reward Rule:</div>
                <p className="text-[11px]">
                  When an active student refers a new joining peer:
                </p>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 pt-0.5">
                  <li><strong>Referrer:</strong> 5 Days Extension on active plan</li>
                  <li><strong>New Student:</strong> ₹200 Discount on first month</li>
                </ul>
              </div>

              <div className="space-y-1 pt-1">
                <div className="text-[11px] font-bold text-muted-foreground uppercase">Top Advocates This Month</div>
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground">Aarav Patel (STU-1081)</span>
                    <Badge variant="outline" className="text-[10px] font-mono">4 Referrals</Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground">Priya Sharma (STU-1082)</span>
                    <Badge variant="outline" className="text-[10px] font-mono">3 Referrals</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: Create Coupon */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="size-5 text-primary" />
              Create Promo Coupon
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure code, discount tier, minimum cart spend and expiration date.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Coupon Code (Uppercase)</Label>
              <Input
                placeholder="e.g. WINTER300"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="h-8 text-xs font-mono uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Discount Type</Label>
                <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Flat Amount">Flat Amount (₹)</SelectItem>
                    <SelectItem value="Percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Discount Value</Label>
                <Input
                  type="number"
                  value={discountVal}
                  onChange={(e) => setDiscountVal(Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Minimum Purchase Threshold (₹)</Label>
              <Input
                type="number"
                value={minSpend}
                onChange={(e) => setMinSpend(Number(e.target.value))}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Valid Until Date</Label>
              <Input
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateCoupon}
              disabled={!newCode || !discountVal}
              className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Generate Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

