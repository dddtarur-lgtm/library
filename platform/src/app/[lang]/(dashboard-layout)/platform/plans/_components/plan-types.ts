export type BillingCycle = "monthly" | "annual"

export type PlanAccent = "slate" | "blue" | "primary" | "amber" | "emerald"

export interface PlanTier {
  id: string
  name: string
  tagline: string
  monthlyFee: number
  annualFee: number
  maxSeats: number
  maxBranches: number
  maxSubAdmins: number
  activeLibraries: number
  isPopular: boolean
  isActive: boolean
  accent: PlanAccent
  features: string[]
}

export type CouponDiscountType = "Percentage" | "Fixed Amount"
export type CouponStatus = "Active" | "Paused" | "Expired"

export interface CouponPromo {
  id: string
  code: string
  discountValue: number
  discountLabel: string
  type: CouponDiscountType
  applicablePlan: string
  validUntil: string
  redemptions: number
  maxRedemptions: number
  status: CouponStatus
}

export const initialPlanTiers: PlanTier[] = [
  {
    id: "plan-1",
    name: "Starter",
    tagline: "Single-branch starter setup",
    monthlyFee: 1999,
    annualFee: 19990,
    maxSeats: 100,
    maxBranches: 1,
    maxSubAdmins: 1,
    activeLibraries: 24,
    isPopular: false,
    isActive: true,
    accent: "slate",
    features: [
      "Seat Allocation & Shifts",
      "Basic Fee Ledger & Receipts",
      "Email & SMS Alerts",
      "Standard Support",
    ],
  },
  {
    id: "plan-2",
    name: "Growth",
    tagline: "Built for growing study halls",
    monthlyFee: 3499,
    annualFee: 34990,
    maxSeats: 250,
    maxBranches: 3,
    maxSubAdmins: 3,
    activeLibraries: 38,
    isPopular: false,
    isActive: true,
    accent: "blue",
    features: [
      "Everything in Starter",
      "Locker Management Module",
      "Expense & Utility Tracker",
      "Custom Library Branding",
    ],
  },
  {
    id: "plan-3",
    name: "Pro",
    tagline: "Most popular for multi-branch",
    monthlyFee: 4999,
    annualFee: 49990,
    maxSeats: 600,
    maxBranches: 10,
    maxSubAdmins: 10,
    activeLibraries: 18,
    isPopular: true,
    isActive: true,
    accent: "primary",
    features: [
      "Everything in Growth",
      "Biometric / RFID Attendance Sync",
      "Automated GST Invoicing",
      "Priority WhatsApp Support",
    ],
  },
  {
    id: "plan-4",
    name: "Enterprise",
    tagline: "Custom scale & white-label",
    monthlyFee: 9999,
    annualFee: 99990,
    maxSeats: 2500,
    maxBranches: 50,
    maxSubAdmins: 50,
    activeLibraries: 6,
    isPopular: false,
    isActive: true,
    accent: "amber",
    features: [
      "Everything in Pro",
      "Dedicated Account Manager",
      "Custom API & Webhook Sync",
      "White-label Domain Support",
    ],
  },
]

export const initialCouponPromos: CouponPromo[] = [
  {
    id: "cpn-1",
    code: "FESTIVE20",
    discountValue: 20,
    discountLabel: "20% OFF",
    type: "Percentage",
    applicablePlan: "All Tiers",
    validUntil: "2026-11-30",
    redemptions: 14,
    maxRedemptions: 50,
    status: "Active",
  },
  {
    id: "cpn-2",
    code: "DIWALI5000",
    discountValue: 5000,
    discountLabel: "₹5,000 Flat",
    type: "Fixed Amount",
    applicablePlan: "Pro",
    validUntil: "2026-11-15",
    redemptions: 28,
    maxRedemptions: 30,
    status: "Active",
  },
  {
    id: "cpn-3",
    code: "EARLYBIRD",
    discountValue: 15,
    discountLabel: "15% OFF",
    type: "Percentage",
    applicablePlan: "Growth",
    validUntil: "2026-10-31",
    redemptions: 50,
    maxRedemptions: 50,
    status: "Expired",
  },
]

export function matchLibraryToPlan(
  libPlanName: string,
  tierName: string
): boolean {
  const normalizedLib = libPlanName
    .toLowerCase()
    .replace(/\b(tier|plan|annual|monthly|quarterly|renewal)\b/g, "")
    .replace(/[()]/g, "")
    .trim()
  const normalizedTier = tierName
    .toLowerCase()
    .replace(/\b(tier|plan)\b/g, "")
    .trim()

  if (!normalizedLib || !normalizedTier) return false
  return (
    normalizedLib === normalizedTier ||
    normalizedLib.includes(normalizedTier) ||
    normalizedTier.includes(normalizedLib)
  )
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`
}
