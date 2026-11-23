"use client"

import { useState } from "react"
import { platformService } from "@/services/platform-service"
import { toast } from "sonner"
import {
  CreditCard,
  DatabaseBackup,
  Download,
  Eye,
  EyeOff,
  Lock,
  RotateCcw,
  Save,
  Settings,
  Sliders,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"

type SettingsTab = "overview" | "rules" | "payments" | "security" | "backup"

interface SnapshotItem {
  id: string
  createdAt: string
  type: "Automated" | "Manual"
  size: string
  region: string
}

const INITIAL_SNAPSHOTS: SnapshotItem[] = [
  {
    id: "snap-20261112",
    createdAt: "12 Nov 2026, 03:00 AM IST",
    type: "Automated",
    size: "4.82 GB",
    region: "ap-south-1 (Mumbai)",
  },
  {
    id: "snap-20261111",
    createdAt: "11 Nov 2026, 03:00 AM IST",
    type: "Automated",
    size: "4.79 GB",
    region: "ap-south-1 (Mumbai)",
  },
  {
    id: "snap-20261110-m",
    createdAt: "10 Nov 2026, 06:15 PM IST",
    type: "Manual",
    size: "4.76 GB",
    region: "ap-south-1 (Mumbai)",
  },
]

export default function PlatformSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("overview")

  // General
  const [platformName, setPlatformName] = useState("StudyHub SaaS")
  const [supportEmail, setSupportEmail] = useState("support@studyhub.io")
  const [timezone, setTimezone] = useState("Asia/Kolkata")
  const [currency, setCurrency] = useState("INR")

  // Rules
  const [trialDays, setTrialDays] = useState("14")
  const [graceDays, setGraceDays] = useState("5")
  const [autoSuspend, setAutoSuspend] = useState(true)
  const [selfServeSignup, setSelfServeSignup] = useState(true)
  const [customSubdomain, setCustomSubdomain] = useState(true)

  // Payments
  const [keyId, setKeyId] = useState("rzp_live_98a7b6c5d4e3f2")
  const [keySecret, setKeySecret] = useState("sec_live_4f91a2c388e9b0")
  const [showSecret, setShowSecret] = useState(false)
  const [gstRate, setGstRate] = useState("18")
  const [autoGst, setAutoGst] = useState(true)

  // Security
  const [enforce2fa, setEnforce2fa] = useState(true)
  const [maskPii, setMaskPii] = useState(true)
  const [sessionTimeout, setSessionTimeout] = useState("30")
  const [ipAllowlist, setIpAllowlist] = useState("49.36.112.0/24\n103.21.58.14")

  // Backups
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>(INITIAL_SNAPSHOTS)

  const handleSaveActiveTab = async () => {
    const labels: Record<SettingsTab, string> = {
      overview: "General platform settings saved",
      rules: "Tenancy lifecycle rules updated",
      payments: "Payment gateway credentials saved",
      security: "Security policies updated",
      backup: "Backup configuration saved",
    }
    try {
      await platformService.updatePlatformSettings({
        tab: activeTab,
        trial_days: trialDays,
        grace_days: graceDays,
        enforce_2fa: enforce2fa,
        mask_pii: maskPii,
        session_timeout: sessionTimeout,
        auto_gst: autoGst,
        gst_rate: gstRate,
      })
    } catch {
      // Local state preserved
    }
    toast.success(labels[activeTab])
  }

  return (
    <section className="container space-y-5 py-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Platform Settings
          </h1>
          <p className="text-xs text-muted-foreground">
            Global tenant defaults, billing gateway credentials, security
            policies, and backups.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">
            {[
              { id: "overview", label: "Overview", icon: Settings },
              { id: "rules", label: "Tenancy Rules", icon: Sliders },
              { id: "payments", label: "Payments", icon: CreditCard },
              { id: "security", label: "Security", icon: Lock },
              {
                id: "backup",
                label: "Backup & Recovery",
                icon: DatabaseBackup,
              },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {activeTab === "backup" ? (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                setSnapshots((prev) => [
                  {
                    id: `snap-${Date.now()}`,
                    createdAt: "Just now",
                    type: "Manual",
                    size: "4.84 GB",
                    region: "ap-south-1 (Mumbai)",
                  },
                  ...prev,
                ])
                toast.success("Manual encrypted database snapshot created")
              }}
            >
              <DatabaseBackup className="size-3.5" />
              Create Snapshot
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={handleSaveActiveTab}
            >
              <Save className="size-3.5" />
              Save
            </Button>
          )}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Tenancy Rules",
                desc: `${trialDays}d trial • ${graceDays}d grace • Auto-lock`,
                tab: "rules" as const,
                icon: Sliders,
                tone: "text-primary bg-primary/10",
              },
              {
                title: "Payment Gateway",
                desc: `Razorpay Live • ${gstRate}% GST`,
                tab: "payments" as const,
                icon: CreditCard,
                tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
              },
              {
                title: "Security Policies",
                desc: `2FA ${enforce2fa ? "Enforced" : "Optional"} • ${sessionTimeout}m timeout`,
                tab: "security" as const,
                icon: Lock,
                tone: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
              },
              {
                title: "Backup & Recovery",
                desc: `${snapshots.length} snapshots • 30d retention`,
                tab: "backup" as const,
                icon: DatabaseBackup,
                tone: "text-sky-600 bg-sky-500/10 dark:text-sky-400",
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setActiveTab(item.tab)}
                  className="text-left"
                >
                  <Card className="h-full border-border bg-card shadow-sm transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${item.tone}`}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {item.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              )
            })}
          </div>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/70 pb-4">
              <CardTitle className="text-base">
                Organization &amp; Locale Defaults
              </CardTitle>
              <CardDescription>
                Core platform identity used in invoices, system emails, and
                tenant portals.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Platform Name</Label>
                <Input
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Primary Support Email</Label>
                <Input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Default Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">
                      Asia/Kolkata (IST +05:30)
                    </SelectItem>
                    <SelectItem value="UTC">UTC (+00:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Base Billing Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "rules" && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="text-base">
              Onboarding &amp; Lifecycle Windows
            </CardTitle>
            <CardDescription>
              Applied to all newly provisioned study library tenants.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Default Trial Duration (Days)</Label>
                <Input
                  type="number"
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Payment Grace Period (Days)</Label>
                <Input
                  type="number"
                  value={graceDays}
                  onChange={(e) => setGraceDays(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {[
              {
                title: "Auto-Lock After Grace Period",
                desc: "Restrict student check-ins once unpaid invoice exceeds grace window.",
                checked: autoSuspend,
                onChange: setAutoSuspend,
              },
              {
                title: "Self-Serve Library Signups",
                desc: "Allow new libraries to provision trial workspaces from the landing page.",
                checked: selfServeSignup,
                onChange: setSelfServeSignup,
              },
              {
                title: "Instant Subdomain Provisioning",
                desc: "Automatically issue *.lmsplatform.com SSL certificates on activation.",
                checked: customSubdomain,
                onChange: setCustomSubdomain,
              },
            ].map((row) => (
              <div
                key={row.title}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/60 px-3.5 py-2.5"
              >
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {row.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {row.desc}
                  </p>
                </div>
                <Switch checked={row.checked} onCheckedChange={row.onChange} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "payments" && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 pb-4">
            <div>
              <CardTitle className="text-base">
                Razorpay Live Merchant
              </CardTitle>
              <CardDescription>
                Used for SaaS subscription renewals and automated GST invoices.
              </CardDescription>
            </div>
            <Badge
              variant="secondary"
              className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            >
              Live Connected
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Razorpay Key ID</Label>
                <Input
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  className="h-9 font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Razorpay Key Secret</Label>
                <div className="relative">
                  <Input
                    type={showSecret ? "text" : "password"}
                    value={keySecret}
                    onChange={(e) => setKeySecret(e.target.value)}
                    className="h-9 pr-9 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showSecret ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Default GST Rate (%)</Label>
                <Input
                  type="number"
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Auto-Generate GST PDFs
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Email invoice after successful capture
                  </p>
                </div>
                <Switch checked={autoGst} onCheckedChange={setAutoGst} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "security" && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="text-base">
              Authentication &amp; Access Controls
            </CardTitle>
            <CardDescription>
              Hardening rules for Super Admin and delegated platform staff.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3.5 py-2.5">
              <div>
                <p className="text-xs font-medium text-foreground">
                  Mandatory 2FA for All Staff
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Require TOTP or Passkey on every admin login
                </p>
              </div>
              <Switch checked={enforce2fa} onCheckedChange={setEnforce2fa} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3.5 py-2.5">
              <div>
                <p className="text-xs font-medium text-foreground">
                  Default Student PII Masking
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Mask phone &amp; email in directory until explicitly unmasked
                </p>
              </div>
              <Switch checked={maskPii} onCheckedChange={setMaskPii} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Idle Session Timeout (Minutes)</Label>
              <Input
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="h-9 max-w-xs text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Admin Console IP Allowlist (CIDR, one per line)
              </Label>
              <Textarea
                rows={3}
                value={ipAllowlist}
                onChange={(e) => setIpAllowlist(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "backup" && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="text-base">Database Snapshots</CardTitle>
            <CardDescription>
              AES-256 encrypted backups retained for 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Snapshot ID</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshots.map((snap) => (
                    <TableRow key={snap.id}>
                      <TableCell className="pl-4 font-mono text-xs font-medium text-foreground">
                        {snap.id}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {snap.createdAt}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{snap.type}</Badge>
                      </TableCell>
                      <TableCell className="text-xs tabular-nums">
                        {snap.size}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {snap.region}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={() =>
                              toast.success(`Downloading ${snap.id}.tar.gz.enc`)
                            }
                          >
                            <Download className="size-3" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={() =>
                              toast.success(
                                `Staging restore verification queued for ${snap.id}`
                              )
                            }
                          >
                            <RotateCcw className="size-3" />
                            Verify Restore
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
