"use client"

import { useMemo, useState } from "react"
import { platformService } from "@/services/platform-service"
import { toast } from "sonner"
import {
  AlertTriangle,
  CheckCircle2,
  Flag,
  Info,
  Radio,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Smartphone,
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

type AppTab = "hub" | "versions" | "banners" | "features"

interface FeatureFlag {
  key: string
  name: string
  description: string
  scope: "All Plans" | "Pro & Enterprise" | "Beta Tenants"
  rollout: number
  enabled: boolean
}

const INITIAL_FLAGS: FeatureFlag[] = [
  {
    key: "biometric_qr_v2",
    name: "Biometric + QR Dual Check-In",
    description: "Allow hybrid hardware + QR validation on branch tablets.",
    scope: "Pro & Enterprise",
    rollout: 100,
    enabled: true,
  },
  {
    key: "whatsapp_auto_dunning",
    name: "Automated WhatsApp Fee Reminders",
    description: "Trigger scheduled T-3 and T+1 renewal reminders.",
    scope: "All Plans",
    rollout: 100,
    enabled: true,
  },
  {
    key: "ai_seat_forecasting",
    name: "AI Occupancy Forecasting",
    description: "Predict peak shift demand across branches.",
    scope: "Beta Tenants",
    rollout: 25,
    enabled: true,
  },
  {
    key: "gst_e_invoicing",
    name: "GST E-Invoice IRN Sync",
    description: "Direct government IRP portal invoice registration.",
    scope: "Pro & Enterprise",
    rollout: 0,
    enabled: false,
  },
]

export default function AppManagementPage() {
  const [activeTab, setActiveTab] = useState<AppTab>("hub")

  // Hub switches
  const [globalMaintenance, setGlobalMaintenance] = useState(false)
  const [biometricSync, setBiometricSync] = useState(true)
  const [whatsappOtp, setWhatsappOtp] = useState(true)
  const [offlineQrCheckIn, setOfflineQrCheckIn] = useState(true)

  // Version Policy
  const [androidLatest, setAndroidLatest] = useState("2.4.1")
  const [androidMin, setAndroidMin] = useState("2.2.0")
  const [androidForce, setAndroidForce] = useState(true)
  const [androidNotes, setAndroidNotes] = useState(
    "• Faster QR check-in scanner\n• Fixed seat transfer receipt PDF download"
  )
  const [iosLatest, setIosLatest] = useState("2.4.0")
  const [iosMin, setIosMin] = useState("2.1.5")
  const [iosForce, setIosForce] = useState(false)
  const [iosNotes, setIosNotes] = useState(
    "• Dark mode polish for student pass\n• Push notification deep-link fixes"
  )

  // Banners
  const [bannerEnabled, setBannerEnabled] = useState(true)
  const [bannerSeverity, setBannerSeverity] = useState<
    "info" | "warning" | "critical"
  >("warning")
  const [bannerAudience, setBannerAudience] = useState("all")
  const [bannerTitle, setBannerTitle] = useState(
    "Scheduled Payment Gateway Maintenance"
  )
  const [bannerMessage, setBannerMessage] = useState(
    "UPI Autopay settlements may experience a 5-minute delay between 02:00 AM and 02:30 AM IST."
  )

  // Feature Flags
  const [flags, setFlags] = useState<FeatureFlag[]>(INITIAL_FLAGS)
  const [flagSearch, setFlagSearch] = useState("")

  const filteredFlags = useMemo(() => {
    const q = flagSearch.trim().toLowerCase()
    if (!q) return flags
    return flags.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.key.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
    )
  }, [flags, flagSearch])

  return (
    <section className="container space-y-5 py-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            App Controls
          </h1>
          <p className="text-xs text-muted-foreground">
            Control mobile app release policies, live maintenance banners, and
            feature rollouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">
            {[
              { id: "hub", label: "Hub", icon: Smartphone },
              { id: "versions", label: "Version Policy", icon: RefreshCw },
              { id: "banners", label: "Banners", icon: Radio },
              { id: "features", label: "Feature Flags", icon: Flag },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as AppTab)}
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

          {(activeTab === "versions" || activeTab === "banners") && (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() =>
                toast.success(
                  activeTab === "versions"
                    ? "App version policy saved and pushed to clients"
                    : "In-app banner configuration updated"
                )
              }
            >
              <Save className="size-3.5" />
              Save
            </Button>
          )}
        </div>
      </div>

      {activeTab === "hub" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Android Build",
                value: `v${androidLatest}`,
                sub: `Min v${androidMin} • ${androidForce ? "Force ON" : "Soft"}`,
                tab: "versions" as const,
                icon: Smartphone,
                tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
              },
              {
                label: "iOS Build",
                value: `v${iosLatest}`,
                sub: `Min v${iosMin} • ${iosForce ? "Force ON" : "Soft"}`,
                tab: "versions" as const,
                icon: RefreshCw,
                tone: "text-primary bg-primary/10",
              },
              {
                label: "Active Banners",
                value: bannerEnabled ? "1 Live" : "0 Live",
                sub: "Scheduled & emergency notices",
                tab: "banners" as const,
                icon: Radio,
                tone: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
              },
              {
                label: "Feature Flags",
                value: `${flags.filter((f) => f.enabled).length} Active`,
                sub: "Gradual tenant rollouts",
                tab: "features" as const,
                icon: Flag,
                tone: "text-sky-600 bg-sky-500/10 dark:text-sky-400",
              },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <button
                  key={stat.label}
                  type="button"
                  onClick={() => setActiveTab(stat.tab)}
                  className="text-left"
                >
                  <Card className="h-full border-border bg-card shadow-sm transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          {stat.value}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {stat.sub}
                        </p>
                      </div>
                      <div
                        className={`flex size-10 items-center justify-center rounded-lg ${stat.tone}`}
                      >
                        <Icon className="size-5" />
                      </div>
                    </CardContent>
                  </Card>
                </button>
              )
            })}
          </div>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/70 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="size-4 text-primary" />
                Quick Runtime Switches
              </CardTitle>
              <CardDescription>
                Instant platform-wide runtime toggles synced to all mobile &amp;
                kiosk clients.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border/70 p-0">
              {[
                {
                  title: "Global Maintenance Mode",
                  desc: "Temporarily block student check-ins and display maintenance screen.",
                  checked: globalMaintenance,
                  onChange: async (val: boolean) => {
                    setGlobalMaintenance(val)
                    try {
                      await platformService.setMaintenanceMode({
                        enabled: val,
                        message: bannerMessage,
                      })
                    } catch {
                      // Handled locally
                    }
                    toast(
                      val
                        ? "Global maintenance mode enabled"
                        : "Global maintenance mode disabled"
                    )
                  },
                  badge: globalMaintenance ? "Active" : "Normal",
                },
                {
                  title: "Biometric Hardware Sync",
                  desc: "Enable real-time ZKTeco/eSSL punch sync across all library branches.",
                  checked: biometricSync,
                  onChange: (val: boolean) => {
                    setBiometricSync(val)
                    toast.success(
                      `Biometric sync ${val ? "enabled" : "paused"}`
                    )
                  },
                  badge: "100% Rollout",
                },
                {
                  title: "WhatsApp OTP Verification",
                  desc: "Send student login OTPs via WhatsApp Business API before SMS fallback.",
                  checked: whatsappOtp,
                  onChange: (val: boolean) => {
                    setWhatsappOtp(val)
                    toast.success(
                      `WhatsApp OTP ${val ? "enabled" : "disabled"}`
                    )
                  },
                  badge: "100% Rollout",
                },
                {
                  title: "Offline QR Check-In Cache",
                  desc: "Allow tablet kiosks to validate student QR passes during brief internet drops.",
                  checked: offlineQrCheckIn,
                  onChange: (val: boolean) => {
                    setOfflineQrCheckIn(val)
                    toast.success(
                      `Offline QR cache ${val ? "enabled" : "disabled"}`
                    )
                  },
                  badge: "Beta",
                },
              ].map((row) => (
                <div
                  key={row.title}
                  className="flex items-center justify-between gap-4 px-5 py-3.5"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {row.title}
                      </p>
                      <Badge variant="outline" className="text-[10px]">
                        {row.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{row.desc}</p>
                  </div>
                  <Switch
                    checked={row.checked}
                    onCheckedChange={row.onChange}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            Remote config edge cache propagates to mobile clients within 30
            seconds.
          </div>
        </div>
      )}

      {activeTab === "versions" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Smartphone className="size-4 text-emerald-600 dark:text-emerald-400" />
                  Android (Play Store)
                </CardTitle>
                <CardDescription>
                  Package:{" "}
                  <span className="font-mono">io.studyhub.student</span>
                </CardDescription>
              </div>
              <Badge
                variant="secondary"
                className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              >
                Live v{androidLatest}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Latest Store Version</Label>
                  <Input
                    value={androidLatest}
                    onChange={(e) => setAndroidLatest(e.target.value)}
                    className="h-9 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Minimum Allowed Version</Label>
                  <Input
                    value={androidMin}
                    onChange={(e) => setAndroidMin(e.target.value)}
                    className="h-9 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2.5">
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Enforce Hard Update
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Block app usage below v{androidMin}
                  </p>
                </div>
                <Switch
                  checked={androidForce}
                  onCheckedChange={setAndroidForce}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Update Prompt Notes</Label>
                <Textarea
                  rows={3}
                  value={androidNotes}
                  onChange={(e) => setAndroidNotes(e.target.value)}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Smartphone className="size-4 text-primary" />
                  iOS (App Store)
                </CardTitle>
                <CardDescription>
                  Bundle: <span className="font-mono">io.studyhub.ios</span>
                </CardDescription>
              </div>
              <Badge variant="secondary">Live v{iosLatest}</Badge>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Latest Store Version</Label>
                  <Input
                    value={iosLatest}
                    onChange={(e) => setIosLatest(e.target.value)}
                    className="h-9 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Minimum Allowed Version</Label>
                  <Input
                    value={iosMin}
                    onChange={(e) => setIosMin(e.target.value)}
                    className="h-9 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2.5">
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Enforce Hard Update
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Block app usage below v{iosMin}
                  </p>
                </div>
                <Switch checked={iosForce} onCheckedChange={setIosForce} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Update Prompt Notes</Label>
                <Textarea
                  rows={3}
                  value={iosNotes}
                  onChange={(e) => setIosNotes(e.target.value)}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "banners" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/70 pb-4">
              <CardTitle className="text-base">Banner Configuration</CardTitle>
              <CardDescription>
                Configure severity, audience, and live message copy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2.5">
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Banner Active
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Display at top of client dashboards
                  </p>
                </div>
                <Switch
                  checked={bannerEnabled}
                  onCheckedChange={setBannerEnabled}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Severity Style</Label>
                  <Select
                    value={bannerSeverity}
                    onValueChange={(v) =>
                      setBannerSeverity(v as "info" | "warning" | "critical")
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info (Blue)</SelectItem>
                      <SelectItem value="warning">Warning (Amber)</SelectItem>
                      <SelectItem value="critical">Critical (Red)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Target Audience</Label>
                  <Select
                    value={bannerAudience}
                    onValueChange={setBannerAudience}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="owners">
                        Library Owners Only
                      </SelectItem>
                      <SelectItem value="students">Student App Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Banner Headline</Label>
                <Input
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Banner Message</Label>
                <Textarea
                  rows={3}
                  value={bannerMessage}
                  onChange={(e) => setBannerMessage(e.target.value)}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Radio className="size-4 text-primary" />
                  Live Client Preview
                </CardTitle>
                <CardDescription>
                  How the banner renders inside mobile and web portals.
                </CardDescription>
              </div>
              <Badge variant={bannerEnabled ? "default" : "outline"}>
                {bannerEnabled ? "Visible" : "Hidden"}
              </Badge>
            </CardHeader>
            <CardContent className="pt-5">
              {!bannerEnabled ? (
                <div className="rounded-xl border border-dashed border-border py-12 text-center text-xs text-muted-foreground">
                  Banner is currently disabled.
                </div>
              ) : (
                <div
                  className={`rounded-xl border p-4 ${
                    bannerSeverity === "critical"
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : bannerSeverity === "warning"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                        : "border-primary/40 bg-primary/10 text-primary"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {bannerSeverity === "info" ? (
                      <Info className="mt-0.5 size-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    )}
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{bannerTitle}</p>
                      <p className="text-xs leading-relaxed opacity-90">
                        {bannerMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "features" && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Flag className="size-4 text-primary" />
                Remote Feature Gates
              </CardTitle>
              <CardDescription>
                {flags.filter((f) => f.enabled).length} of {flags.length} flags
                active
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={flagSearch}
                onChange={(e) => setFlagSearch(e.target.value)}
                placeholder="Search flag key or name..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Feature</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Target Scope</TableHead>
                    <TableHead>Rollout</TableHead>
                    <TableHead className="pr-4 text-right">Enabled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFlags.map((flag) => (
                    <TableRow key={flag.key}>
                      <TableCell className="pl-4">
                        <p className="text-sm font-medium text-foreground">
                          {flag.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {flag.description}
                        </p>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {flag.key}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px]">
                          {flag.scope}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium tabular-nums">
                        {flag.rollout}%
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Switch
                          checked={flag.enabled}
                          onCheckedChange={(val) => {
                            setFlags((prev) =>
                              prev.map((f) =>
                                f.key === flag.key
                                  ? {
                                      ...f,
                                      enabled: val,
                                      rollout: val
                                        ? Math.max(f.rollout, 100)
                                        : 0,
                                    }
                                  : f
                              )
                            )
                            toast.success(
                              `Flag "${flag.key}" ${val ? "enabled" : "disabled"}`
                            )
                          }}
                        />
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
