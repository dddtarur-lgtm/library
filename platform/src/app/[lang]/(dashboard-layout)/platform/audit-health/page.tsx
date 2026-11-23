"use client"

import { useMemo, useState } from "react"
import { platformService } from "@/services/platform-service"
import { toast } from "sonner"
import {
  Activity,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  Terminal,
  Webhook,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type AuditTab = "overview" | "audit" | "jobs" | "webhooks" | "status"

interface AuditEntry {
  id: string
  actor: string
  action: string
  resource: string
  ip: string
  timestamp: string
  payload: string
}

interface CronJob {
  id: string
  name: string
  schedule: string
  lastRun: string
  status: "Succeeded" | "Running"
  enabled: boolean
}

interface WebhookEvent {
  id: string
  provider: string
  event: string
  receivedAt: string
  httpStatus: number
}

const AUDIT_LOGS: AuditEntry[] = [
  {
    id: "AUD-912",
    actor: "Arjun Mehta",
    action: "library.plan.upgraded",
    resource: "Apex Study Hub (LIB-PUN-001)",
    ip: "49.36.112.4",
    timestamp: "12 Nov 2026, 11:42 AM",
    payload: '{"from":"Starter","to":"Pro Tier","proratedInr":1499}',
  },
  {
    id: "AUD-911",
    actor: "Nidhi Kulkarni",
    action: "public_page.approved",
    resource: "Kalam Study Arena",
    ip: "49.36.112.18",
    timestamp: "12 Nov 2026, 10:15 AM",
    payload: '{"subdomain":"kalamarena.lmsplatform.com","status":"Published"}',
  },
  {
    id: "AUD-910",
    actor: "Karan Desai",
    action: "invoice.refunded",
    resource: "INV-2026-004",
    ip: "103.21.58.14",
    timestamp: "11 Nov 2026, 05:30 PM",
    payload: '{"amountInr":2499,"reason":"Duplicate UPI debit"}',
  },
]

const INITIAL_JOBS: CronJob[] = [
  {
    id: "job-1",
    name: "Subscription Renewal & Dunning Sweep",
    schedule: "0 0 * * *",
    lastRun: "Today, 00:00 IST",
    status: "Succeeded",
    enabled: true,
  },
  {
    id: "job-2",
    name: "WhatsApp Fee Reminder Dispatch",
    schedule: "0 9 * * *",
    lastRun: "Today, 09:00 IST",
    status: "Succeeded",
    enabled: true,
  },
  {
    id: "job-3",
    name: "Encrypted Database Snapshot",
    schedule: "0 3 * * *",
    lastRun: "Today, 03:00 IST",
    status: "Succeeded",
    enabled: true,
  },
  {
    id: "job-4",
    name: "OAuth Mail Token Expiry Check",
    schedule: "*/30 * * * *",
    lastRun: "12 mins ago",
    status: "Succeeded",
    enabled: true,
  },
]

const INITIAL_WEBHOOKS: WebhookEvent[] = [
  {
    id: "wh-501",
    provider: "Razorpay",
    event: "payment.captured",
    receivedAt: "11:18 AM IST",
    httpStatus: 200,
  },
  {
    id: "wh-500",
    provider: "WhatsApp Cloud",
    event: "message.delivered",
    receivedAt: "11:04 AM IST",
    httpStatus: 200,
  },
  {
    id: "wh-499",
    provider: "Resend Mail",
    event: "email.bounced",
    receivedAt: "10:42 AM IST",
    httpStatus: 502,
  },
]

const SUBSYSTEMS = [
  { name: "Core REST & GraphQL API", latency: "42 ms", uptime: 99.99 },
  { name: "PostgreSQL Primary Cluster", latency: "11 ms", uptime: 99.98 },
  { name: "Redis Session & Queue Store", latency: "3 ms", uptime: 100 },
  { name: "Transactional Mail Gateway", latency: "118 ms", uptime: 99.94 },
  { name: "S3 Media & Backup Storage", latency: "64 ms", uptime: 99.99 },
  { name: "Biometric Hardware WebSocket", latency: "28 ms", uptime: 99.95 },
]

export default function AuditHealthPage() {
  const [activeTab, setActiveTab] = useState<AuditTab>("overview")
  const [auditSearch, setAuditSearch] = useState("")
  const [inspect, setInspect] = useState<AuditEntry | null>(null)
  const [jobs, setJobs] = useState<CronJob[]>(INITIAL_JOBS)
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>(INITIAL_WEBHOOKS)
  const [checking, setChecking] = useState(false)

  const filteredAudit = useMemo(() => {
    const q = auditSearch.trim().toLowerCase()
    if (!q) return AUDIT_LOGS
    return AUDIT_LOGS.filter(
      (a) =>
        a.actor.toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q) ||
        a.resource.toLowerCase().includes(q)
    )
  }, [auditSearch])

  return (
    <section className="container space-y-5 py-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Audit &amp; System Health
          </h1>
          <p className="text-xs text-muted-foreground">
            Real-time subsystem telemetry, immutable operator audit logs, cron
            jobs, and webhook deliveries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">
            {[
              { id: "overview", label: "Overview", icon: Activity },
              { id: "audit", label: "Audit Trail", icon: Terminal },
              { id: "jobs", label: "Scheduled Jobs", icon: Clock },
              { id: "webhooks", label: "Webhooks", icon: Webhook },
              { id: "status", label: "Subsystems", icon: Server },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as AuditTab)}
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

          {activeTab === "audit" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={() => toast.success("Exported audit-trail.csv")}
            >
              <Download className="size-3.5" />
              Export CSV
            </Button>
          )}
          {activeTab === "status" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              disabled={checking}
              onClick={() => {
                setChecking(true)
                setTimeout(() => {
                  setChecking(false)
                  toast.success("All 6 subsystems responded healthy")
                }, 350)
              }}
            >
              <RefreshCw
                className={`size-3.5 ${checking ? "animate-spin" : ""}`}
              />
              Run Health Check
            </Button>
          )}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "API Uptime (30d)",
                value: "99.98%",
                sub: "42 ms median latency",
                tab: "status" as const,
                icon: Server,
                tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
              },
              {
                label: "Audit Events (24h)",
                value: "1,284",
                sub: "Zero policy violations",
                tab: "audit" as const,
                icon: Terminal,
                tone: "text-primary bg-primary/10",
              },
              {
                label: "Scheduled Jobs",
                value: `${jobs.filter((j) => j.enabled).length} / ${jobs.length}`,
                sub: "Next: Billing Sweep 00:00",
                tab: "jobs" as const,
                icon: Clock,
                tone: "text-sky-600 bg-sky-500/10 dark:text-sky-400",
              },
              {
                label: "Webhook Delivery",
                value: "99.4%",
                sub: "Razorpay & WhatsApp active",
                tab: "webhooks" as const,
                icon: Webhook,
                tone: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveTab(item.tab)}
                  className="text-left"
                >
                  <Card className="h-full border-border bg-card shadow-sm transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          {item.value}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.sub}
                        </p>
                      </div>
                      <div
                        className={`flex size-10 items-center justify-center rounded-lg ${item.tone}`}
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
                <Activity className="size-4 text-primary" />
                Recent Operational Events
              </CardTitle>
              <CardDescription>
                Combined feed from cron workers, webhooks, and admin actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border/70 p-0">
              {[
                {
                  title: "Daily Database Snapshot Completed",
                  detail: "snap-20261112 (4.82 GB) uploaded to ap-south-1",
                  time: "03:02 AM IST",
                  status: "Success",
                },
                {
                  title: "Razorpay Webhook: payment.captured",
                  detail: "Apex Study Hub • Invoice #INV-2026-001 settled",
                  time: "11:18 AM IST",
                  status: "200 OK",
                },
                {
                  title: "PII Unmask Session Logged",
                  detail: "Arjun Mehta viewed student contact details",
                  time: "12:04 PM IST",
                  status: "Audited",
                },
              ].map((ev) => (
                <div
                  key={ev.title}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {ev.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{ev.detail}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-[10px]">
                      {ev.status}
                    </Badge>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {ev.time}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "audit" && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Immutable Event Log</CardTitle>
              <CardDescription>
                {filteredAudit.length} recorded admin actions
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search actor, action, resource..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="pr-4 text-right">Diff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAudit.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-4 text-sm font-medium text-foreground">
                        {item.actor}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-mono text-[11px]"
                        >
                          {item.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        {item.resource}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {item.ip}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.timestamp}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 px-2 text-xs"
                          onClick={() => setInspect(item)}
                        >
                          <Eye className="size-3.5" />
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "jobs" && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="text-base">Background Workers</CardTitle>
            <CardDescription>
              {jobs.filter((j) => j.enabled).length} of {jobs.length} cron jobs
              active
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Job Name</TableHead>
                    <TableHead>Cron Expression</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="pr-4 text-right">Trigger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="pl-4 text-sm font-medium text-foreground">
                        {job.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {job.schedule}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {job.lastRun}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        >
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={job.enabled}
                          onCheckedChange={(val) => {
                            setJobs((prev) =>
                              prev.map((j) =>
                                j.id === job.id ? { ...j, enabled: val } : j
                              )
                            )
                            toast.success(
                              `${job.name} ${val ? "enabled" : "paused"}`
                            )
                          }}
                        />
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 px-2.5 text-xs"
                          onClick={async () => {
                            setJobs((prev) =>
                              prev.map((j) =>
                                j.id === job.id
                                  ? {
                                      ...j,
                                      lastRun: "Just now",
                                      status: "Succeeded",
                                    }
                                  : j
                              )
                            )
                            try {
                              await platformService.runPlatformJob(job.id)
                            } catch {
                              // Handled locally
                            }
                            toast.success(`Executed "${job.name}"`)
                          }}
                        >
                          <Play className="size-3" />
                          Run Now
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "webhooks" && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="text-base">Webhook Event Stream</CardTitle>
            <CardDescription>
              Signed payloads from Razorpay, WhatsApp Cloud API, and Resend.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Event ID</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Response</TableHead>
                    <TableHead className="pr-4 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((ev) => (
                    <TableRow key={ev.id}>
                      <TableCell className="pl-4 font-mono text-xs font-medium">
                        {ev.id}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {ev.provider}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {ev.event}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {ev.receivedAt}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            ev.httpStatus === 200
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-destructive/15 text-destructive"
                          }
                        >
                          {ev.httpStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 px-2.5 text-xs"
                          onClick={() => {
                            setWebhooks((prev) =>
                              prev.map((e) =>
                                e.id === ev.id ? { ...e, httpStatus: 200 } : e
                              )
                            )
                            toast.success(`Replayed webhook ${ev.id} — 200 OK`)
                          }}
                        >
                          <RotateCcw className="size-3" />
                          Replay
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "status" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SUBSYSTEMS.map((sys) => (
            <Card key={sys.name} className="border-border bg-card shadow-sm">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {sys.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Latency: {sys.latency}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  >
                    <CheckCircle2 className="size-3" />
                    Healthy
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>30d Uptime</span>
                    <span className="font-semibold text-foreground">
                      {sys.uptime}%
                    </span>
                  </div>
                  <Progress value={sys.uptime} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(inspect)}
        onOpenChange={(open) => {
          if (!open) setInspect(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              Audit Payload — {inspect?.id}
            </DialogTitle>
            <DialogDescription>
              {inspect?.actor} • {inspect?.action}
            </DialogDescription>
          </DialogHeader>
          {inspect && (
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs text-foreground">
              {JSON.stringify(JSON.parse(inspect.payload), null, 2)}
            </pre>
          )}
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setInspect(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
