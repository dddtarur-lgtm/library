"use client"

import { useState } from "react"
import { Building2, CheckCircle2, Plus, UserPlus } from "lucide-react"

import type { PlatformLibraryRecord } from "@/data/platform-admin-data"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface AddLibraryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddLibrary: (lib: PlatformLibraryRecord) => void
}

export function AddLibraryDialog({ open, onOpenChange, onAddLibrary }: AddLibraryDialogProps) {
  const [name, setName] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("Gujarat")
  const [branches, setBranches] = useState("1")
  const [plan, setPlan] = useState("Growth Tier")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !ownerName || !email) {
      toast.error("Please fill in all mandatory fields.")
      return
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900)
    const code = `LIB-${city.slice(0, 3).toUpperCase() || "IND"}-${randomSuffix}`

    const newLibrary: PlatformLibraryRecord = {
      id: `lib-${Date.now()}`,
      code,
      name,
      logo: "/images/icons/shadboard.svg",
      ownerName,
      ownerEmail: email,
      ownerPhone: mobile,
      city,
      state,
      branchesCount: Number(branches) || 1,
      planName: plan,
      planFee: plan.includes("Starter") ? 2400 : plan.includes("Pro") ? 42000 : 38400,
      planStatus: "Active",
      planEndDate: "04 Nov 2027",
      liveStudents: 0,
      totalSeats: 120,
      emailConnection: "Not connected",
      libraryStatus: "Active",
      joinedDate: "Today",
    }

    onAddLibrary(newLibrary)
    toast.success(`Library "${name}" created directly! Owner onboarding credentials sent to ${email}.`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
              <Plus className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Add Library Manually</DialogTitle>
              <DialogDescription className="text-xs">
                In-person or enterprise onboarding. Skips approval queue and provisions admin account directly.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-1 text-xs">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Library Business Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Reading & Study Center"
              className="h-9 text-xs font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Owner Full Name *</Label>
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Ramesh Bhai Patel"
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Contact Mobile *</Label>
              <Input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98250 XXXXX"
                className="h-9 text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Owner Email Address *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@library.in"
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">City & State</Label>
              <div className="grid grid-cols-2 gap-1.5">
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City (e.g. Surat)"
                  className="h-9 text-xs"
                  required
                />
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Assigned Plan</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter Tier" className="text-xs">Starter Tier</SelectItem>
                  <SelectItem value="Growth Tier" className="text-xs">Growth Tier (Recommended)</SelectItem>
                  <SelectItem value="Pro Tier" className="text-xs">Pro Tier</SelectItem>
                  <SelectItem value="Enterprise Tier" className="text-xs">Enterprise Tier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Initial Branches</Label>
              <Select value={branches} onValueChange={setBranches}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1" className="text-xs">1 Main Branch</SelectItem>
                  <SelectItem value="2" className="text-xs">2 Branches (1 Main + 1 Sub)</SelectItem>
                  <SelectItem value="3" className="text-xs">3 Branches</SelectItem>
                  <SelectItem value="4" className="text-xs">4+ Multi-branch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="border-t border-border/60 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            >
              ✓ Provision Organization & Send Invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

