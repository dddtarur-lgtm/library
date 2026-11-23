"use client"

import { useState } from "react"
import { Building2, CreditCard, IndianRupee } from "lucide-react"

import type { PlatformPayment } from "@/data/platform-admin-data"

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

interface ManualPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRecordPayment: (payment: Omit<PlatformPayment, "id">) => void
}

const mockLibraries = [
  { code: "LIB-DEL-014", name: "Drona Knowledge Point", currentPlan: "Pro Tier" },
  { code: "LIB-LKO-029", name: "Gyan Sarovar Reading Hall", currentPlan: "Growth Tier" },
  { code: "LIB-SUR-041", name: "Karnavati Study Hub", currentPlan: "Starter Tier" },
  { code: "LIB-JPR-008", name: "Maharaja Reading Hall", currentPlan: "Growth Tier" },
  { code: "LIB-VAR-052", name: "Kashi Vidyapeeth Library Space", currentPlan: "Pro Tier" },
]

const planPricing: Record<string, number> = {
  Starter: 2400,
  Growth: 38400,
  Pro: 42000,
  Enterprise: 72000,
}

export function ManualPaymentDialog({
  open,
  onOpenChange,
  onRecordPayment,
}: ManualPaymentDialogProps) {
  const [selectedLibCode, setSelectedLibCode] = useState(mockLibraries[0].code)
  const [plan, setPlan] = useState<string>("Growth")
  const [amount, setAmount] = useState<number>(38400)
  const [method, setMethod] = useState<PlatformPayment["method"]>("Bank Transfer")
  const [refNumber, setRefNumber] = useState("")

  const handlePlanChange = (val: string) => {
    setPlan(val)
    if (planPricing[val]) {
      setAmount(planPricing[val])
    }
  }

  const selectedLib = mockLibraries.find((l) => l.code === selectedLibCode)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLib) return

    onRecordPayment({
      transactionId: `pay_MAN-${Date.now().toString().slice(-6)}`,
      libraryCode: selectedLib.code,
      libraryName: selectedLib.name,
      planName: `${plan} Tier (Annual)`,
      amount: Number(amount) || 0,
      method,
      type: "Manual Adjust",
      timestamp: "Just now",
      status: "Success",
      referenceNumber: refNumber || `REF-OFFLINE-${Math.floor(1000 + Math.random() * 9000)}`,
    })

    toast.success(
      `Manual payment of ₹${Number(amount).toLocaleString("en-IN")} recorded for ${selectedLib.name}. Plan updated!`
    )
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="size-4" />
            </div>
            <DialogTitle className="text-base font-bold">
              Record Manual Payment
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Directly record an offline bank transfer, UPI, or cash receipt for a library plan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-1 text-xs">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Select Library</Label>
            <Select value={selectedLibCode} onValueChange={setSelectedLibCode}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select target library" />
              </SelectTrigger>
              <SelectContent>
                {mockLibraries.map((lib) => (
                  <SelectItem key={lib.code} value={lib.code} className="text-xs">
                    {lib.name} ({lib.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Platform Plan</Label>
              <Select value={plan} onValueChange={handlePlanChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter" className="text-xs">Starter Tier</SelectItem>
                  <SelectItem value="Growth" className="text-xs">Growth Tier</SelectItem>
                  <SelectItem value="Pro" className="text-xs">Pro Tier</SelectItem>
                  <SelectItem value="Enterprise" className="text-xs">Enterprise Tier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Amount (₹ INR)</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-bold">₹</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="h-9 text-xs pl-6 font-bold"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Payment Mode</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PlatformPayment["method"])}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer" className="text-xs">NEFT / RTGS Transfer</SelectItem>
                  <SelectItem value="UPI" className="text-xs">Direct UPI / QR</SelectItem>
                  <SelectItem value="Cheque" className="text-xs">Cheque Deposit</SelectItem>
                  <SelectItem value="Cash" className="text-xs">Cash Collection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Reference / UTR No.</Label>
              <Input
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                placeholder="e.g. UTR-98218731"
                className="h-9 text-xs"
              />
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
              ✓ Record Payment • ₹{Number(amount).toLocaleString("en-IN")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

