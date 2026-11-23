"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Key,
  QrCode,
  Receipt,
  Save,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

export default function PaymentGatewaySettings() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [savedSuccess, setSavedSuccess] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [copiedWebhook, setCopiedWebhook] = useState(false)

  // Gateway config
  const [keyId, setKeyId] = useState("rzp_live_83k9d8s0d8fa09")
  const [keySecret, setKeySecret] = useState("9s8df098as09df8a09sdf809as")
  const webhookUrl = "https://api.studyspace.app/webhooks/razorpay/branch-central"

  // Offline payment toggles
  const [acceptCash, setAcceptCash] = useState(true)
  const [acceptUpiQr, setAcceptUpiQr] = useState(true)
  const [acceptPos, setAcceptPos] = useState(true)
  const [acceptNeft, setAcceptNeft] = useState(true)

  // Invoice settings
  const [invoicePrefix, setInvoicePrefix] = useState("INV-2026-")
  const [gstRate, setGstRate] = useState("18")
  const [sacCode, setSacCode] = useState("998319")
  const [autoEmailReceipt, setAutoEmailReceipt] = useState(true)
  const [receiptFooterNote, setReceiptFooterNote] = useState(
    "Fees once paid are strictly non-refundable. Seat transfer permitted within 3 days of payment. Keep receipt for entry verification."
  )

  const handleSave = () => {
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  const copyWebhook = () => {
    navigator.clipboard?.writeText(webhookUrl)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={ensureLocalizedPathname("/pages/settings-library", lang)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Library Settings
            </Link>
            <ChevronRight className="size-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-primary">Payment Gateway &amp; Invoices</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Payment Gateway &amp; GST Invoicing
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure automated Razorpay online payments, desk cash collection modes, and GST receipt numbering formats.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="size-3.5 mr-1" />
              Settings Saved!
            </Badge>
          )}
          <Button size="sm" className="h-9 gap-1.5" onClick={handleSave}>
            <Save className="size-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Razorpay & Online Gateway */}
        <div className="space-y-6">
          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Zap className="size-4 text-primary" />
                    Razorpay Online Gateway
                  </CardTitle>
                  <CardDescription>
                    Direct student self-renewal &amp; instant online fee payment
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px]">
                  Connected &amp; Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="key-id" className="text-xs">Razorpay Key ID</Label>
                <Input
                  id="key-id"
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="key-secret" className="text-xs">Razorpay Key Secret</Label>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    {showSecret ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                    {showSecret ? "Hide" : "Reveal"}
                  </button>
                </div>
                <Input
                  id="key-secret"
                  type={showSecret ? "text" : "password"}
                  value={keySecret}
                  onChange={(e) => setKeySecret(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5 border-t border-border/40 pt-3">
                <Label className="text-xs">Webhook Listener URL</Label>
                <div className="flex items-center">
                  <Input
                    readOnly
                    value={webhookUrl}
                    className="h-9 text-xs font-mono bg-muted/40 rounded-r-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-l-none border-l-0 px-3"
                    onClick={copyWebhook}
                  >
                    {copiedWebhook ? <CheckCircle2 className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Subscribe to <code className="text-primary font-mono">payment.captured</code> and <code className="text-primary font-mono">order.paid</code> events.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Offline Payment Methods */}
          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Wallet className="size-4 text-emerald-600" />
                Accepted Offline Payment Modes
              </CardTitle>
              <CardDescription>
                Enable collection modes available at the front desk cashier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <CircleDollarSign className="size-4 text-emerald-600" />
                  <div>
                    <div className="text-xs font-semibold">Cash Counter (with Denomination Count)</div>
                    <div className="text-[11px] text-muted-foreground">Recorded in daily cash day-book</div>
                  </div>
                </div>
                <Switch checked={acceptCash} onCheckedChange={setAcceptCash} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <QrCode className="size-4 text-blue-600" />
                  <div>
                    <div className="text-xs font-semibold">Dynamic &amp; Static UPI QR Standee</div>
                    <div className="text-[11px] text-muted-foreground">Requires staff UTR / Txn ID entry</div>
                  </div>
                </div>
                <Switch checked={acceptUpiQr} onCheckedChange={setAcceptUpiQr} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="size-4 text-purple-600" />
                  <div>
                    <div className="text-xs font-semibold">POS Card Swipe Terminal</div>
                    <div className="text-[11px] text-muted-foreground">Debit &amp; Credit cards accepted at reception</div>
                  </div>
                </div>
                <Switch checked={acceptPos} onCheckedChange={setAcceptPos} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: GST & Invoice Template Rules */}
        <div className="space-y-6">
          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Receipt className="size-4 text-primary" />
                GST Invoice Numbering &amp; Rules
              </CardTitle>
              <CardDescription>
                Tax invoicing format compliant with Indian GST rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="inv-prefix" className="text-xs">Invoice Number Prefix</Label>
                  <Input
                    id="inv-prefix"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Applicable GST Rate</Label>
                  <Select value={gstRate} onValueChange={setGstRate}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% (Exempt Education Service)</SelectItem>
                      <SelectItem value="18">18% (Commercial Coworking / Library)</SelectItem>
                      <SelectItem value="12">12% Reduced Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sac-code" className="text-xs">Service Accounting Code (SAC / HSN)</Label>
                <Input
                  id="sac-code"
                  value={sacCode}
                  onChange={(e) => setSacCode(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/20">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold">Auto-Email PDF Receipt</span>
                  <p className="text-[11px] text-muted-foreground">
                    Send thermal/A4 tax invoice immediately upon payment
                  </p>
                </div>
                <Switch
                  checked={autoEmailReceipt}
                  onCheckedChange={setAutoEmailReceipt}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="receipt-note" className="text-xs">Receipt Terms &amp; Refund Policy Footer</Label>
                <Textarea
                  id="receipt-note"
                  value={receiptFooterNote}
                  onChange={(e) => setReceiptFooterNote(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

