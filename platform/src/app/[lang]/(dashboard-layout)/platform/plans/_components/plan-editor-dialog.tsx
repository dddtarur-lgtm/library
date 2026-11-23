"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import type { PlanAccent, PlanTier } from "./plan-types"

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
import { Switch } from "@/components/ui/switch"

interface PlanEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialPlan: PlanTier | null
  onSave: (plan: PlanTier) => void
}

const ACCENT_OPTIONS: { value: PlanAccent; label: string }[] = [
  { value: "slate", label: "Slate Neutral" },
  { value: "blue", label: "Ocean Blue" },
  { value: "primary", label: "Brand Primary" },
  { value: "amber", label: "Gold Amber" },
  { value: "emerald", label: "Emerald Green" },
]

export function PlanEditorDialog({
  open,
  onOpenChange,
  initialPlan,
  onSave,
}: PlanEditorDialogProps) {
  const [name, setName] = useState("")
  const [tagline, setTagline] = useState("")
  const [monthlyFee, setMonthlyFee] = useState("2999")
  const [annualFee, setAnnualFee] = useState("29990")
  const [maxSeats, setMaxSeats] = useState("200")
  const [maxBranches, setMaxBranches] = useState("2")
  const [maxSubAdmins, setMaxSubAdmins] = useState("2")
  const [accent, setAccent] = useState<PlanAccent>("primary")
  const [isPopular, setIsPopular] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [features, setFeatures] = useState<string[]>([""])
  const [newFeature, setNewFeature] = useState("")

  useEffect(() => {
    if (!open) return
    if (initialPlan) {
      setName(initialPlan.name)
      setTagline(initialPlan.tagline)
      setMonthlyFee(String(initialPlan.monthlyFee))
      setAnnualFee(String(initialPlan.annualFee))
      setMaxSeats(String(initialPlan.maxSeats))
      setMaxBranches(String(initialPlan.maxBranches))
      setMaxSubAdmins(String(initialPlan.maxSubAdmins))
      setAccent(initialPlan.accent)
      setIsPopular(initialPlan.isPopular)
      setIsActive(initialPlan.isActive)
      setFeatures(initialPlan.features.length ? initialPlan.features : [""])
    } else {
      setName("")
      setTagline("")
      setMonthlyFee("2999")
      setAnnualFee("29990")
      setMaxSeats("200")
      setMaxBranches("3")
      setMaxSubAdmins("3")
      setAccent("primary")
      setIsPopular(false)
      setIsActive(true)
      setFeatures([
        "Seat Allocation & Shifts",
        "Fee Ledger & Receipts",
        "Automated Notifications",
      ])
    }
    setNewFeature("")
  }, [open, initialPlan])

  const handleAddFeature = () => {
    const trimmed = newFeature.trim()
    if (!trimmed) return
    setFeatures((prev) => [...prev.filter(Boolean), trimmed])
    setNewFeature("")
  }

  const handleRemoveFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index))
  }

  const handleFeatureChange = (index: number, value: string) => {
    setFeatures((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) return

    const mFee = Math.max(0, Number(monthlyFee) || 0)
    const aFee = Math.max(0, Number(annualFee) || 0)
    const cleanFeatures = features.map((f) => f.trim()).filter(Boolean)

    onSave({
      id: initialPlan?.id ?? `plan-${Date.now()}`,
      name: cleanName,
      tagline: tagline.trim() || `${cleanName} subscription tier`,
      monthlyFee: mFee,
      annualFee: aFee,
      maxSeats: Math.max(1, Number(maxSeats) || 1),
      maxBranches: Math.max(1, Number(maxBranches) || 1),
      maxSubAdmins: Math.max(1, Number(maxSubAdmins) || 1),
      activeLibraries: initialPlan?.activeLibraries ?? 0,
      isPopular,
      isActive,
      accent,
      features: cleanFeatures.length ? cleanFeatures : ["Core Library Access"],
    })
    onOpenChange(false)
  }

  const mNum = Number(monthlyFee) || 0
  const aNum = Number(annualFee) || 0
  const annualSavingsPct =
    mNum > 0 && aNum > 0 && aNum < mNum * 12
      ? Math.round(((mNum * 12 - aNum) / (mNum * 12)) * 100)
      : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">
            {initialPlan ? `Edit ${initialPlan.name} Tier` : "Create Plan Tier"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label
                htmlFor="tier-name"
                className="text-xs font-semibold uppercase text-muted-foreground"
              >
                Tier Name
              </Label>
              <Input
                id="tier-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Scale"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="tier-accent"
                className="text-xs font-semibold uppercase text-muted-foreground"
              >
                Card Accent
              </Label>
              <Select
                value={accent}
                onValueChange={(v) => setAccent(v as PlanAccent)}
              >
                <SelectTrigger id="tier-accent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="tier-tagline"
              className="text-xs font-semibold uppercase text-muted-foreground"
            >
              Tagline / Positioning
            </Label>
            <Input
              id="tier-tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Built for growing study halls"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 rounded-lg border border-border/80 bg-muted/20 p-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="tier-monthly"
                className="text-xs font-semibold uppercase text-muted-foreground"
              >
                Monthly Fee (₹)
              </Label>
              <Input
                id="tier-monthly"
                type="number"
                min={0}
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="tier-annual"
                  className="text-xs font-semibold uppercase text-muted-foreground"
                >
                  Annual Fee (₹)
                </Label>
                {annualSavingsPct > 0 && (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Saves {annualSavingsPct}%
                  </span>
                )}
              </div>
              <Input
                id="tier-annual"
                type="number"
                min={0}
                value={annualFee}
                onChange={(e) => setAnnualFee(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="tier-seats"
                className="text-xs font-semibold uppercase text-muted-foreground"
              >
                Max Seats
              </Label>
              <Input
                id="tier-seats"
                type="number"
                min={1}
                value={maxSeats}
                onChange={(e) => setMaxSeats(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="tier-branches"
                className="text-xs font-semibold uppercase text-muted-foreground"
              >
                Branches
              </Label>
              <Input
                id="tier-branches"
                type="number"
                min={1}
                value={maxBranches}
                onChange={(e) => setMaxBranches(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="tier-admins"
                className="text-xs font-semibold uppercase text-muted-foreground"
              >
                Sub-Admins
              </Label>
              <Input
                id="tier-admins"
                type="number"
                min={1}
                value={maxSubAdmins}
                onChange={(e) => setMaxSubAdmins(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Included Features
            </Label>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={feat}
                    onChange={(e) => handleFeatureChange(idx, e.target.value)}
                    placeholder={`Feature ${idx + 1}`}
                    className="h-8 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveFeature(idx)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddFeature()
                  }
                }}
                placeholder="Add new feature capability..."
                className="h-8 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 shrink-0 gap-1"
                onClick={handleAddFeature}
              >
                <Plus className="size-3.5" />
                Add
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="flex items-center justify-between rounded-lg border border-border/80 px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold">Highlight Popular</p>
                <p className="text-xs text-muted-foreground">
                  Pin recommended badge
                </p>
              </div>
              <Switch checked={isPopular} onCheckedChange={setIsPopular} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/80 px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold">Tier Active</p>
                <p className="text-xs text-muted-foreground">
                  Visible for onboarding
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
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
              {initialPlan ? "Save Tier Rules" : "Create Plan Tier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
