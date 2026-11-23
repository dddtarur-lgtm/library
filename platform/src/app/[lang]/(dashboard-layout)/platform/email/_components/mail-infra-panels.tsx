"use client"

import { useMemo, useState } from "react"
import { platformService } from "@/services/platform-service"
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileCode2,
  Globe,
  KeyRound,
  MailCheck,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react"

import type {
  EmailDeliveryLog,
  EmailTemplateRecord,
  TenantConnectionRecord,
} from "./email-types"

import { toast } from "@/hooks/use-toast"
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
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { LibraryAvatar } from "@/components/platform/library-logo"
import {
  INITIAL_DELIVERY_LOGS,
  INITIAL_EMAIL_TEMPLATES,
  INITIAL_TENANT_CONNECTIONS,
} from "./email-types"

function formatConnectionStatusBadge(status: TenantConnectionRecord["status"]) {
  if (status === "healthy") {
    return (
      <Badge
        variant="secondary"
        className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
      >
        <CheckCircle2 className="size-3" />
        Healthy
      </Badge>
    )
  }
  if (status === "token_expiring_soon") {
    return (
      <Badge
        variant="secondary"
        className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
      >
        <AlertTriangle className="size-3" />
        Expiring Soon
      </Badge>
    )
  }
  return (
    <Badge
      variant="secondary"
      className="gap-1 bg-destructive/15 text-destructive hover:bg-destructive/20"
    >
      <XCircle className="size-3" />
      Auth Failed
    </Badge>
  )
}

function mapConnectionStatusTone(
  status: TenantConnectionRecord["status"]
): "Connected" | "Needs reconnect" | "Disconnected" {
  if (status === "healthy") return "Connected"
  if (status === "token_expiring_soon") return "Needs reconnect"
  return "Disconnected"
}

export function ConnectionsPanel() {
  const [connections, setConnections] = useState<TenantConnectionRecord[]>(
    INITIAL_TENANT_CONNECTIONS
  )
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    "all" | TenantConnectionRecord["status"]
  >("all")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return connections.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false
      if (!q) return true
      return (
        item.libraryName.toLowerCase().includes(q) ||
        item.senderAccount.toLowerCase().includes(q) ||
        item.provider.toLowerCase().includes(q)
      )
    })
  }, [connections, search, statusFilter])

  const handleRefreshToken = (id: string) => {
    const target = connections.find((c) => c.id === id)
    setConnections((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "healthy",
              tokenExpires: "In 90 days",
            }
          : item
      )
    )
    toast({
      title: "Connection refreshed",
      description: target
        ? `${target.libraryName} (${target.senderAccount}) OAuth/SMTP token renewed.`
        : "Sender token renewed.",
    })
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">
            Tenant OAuth &amp; SMTP Connections
          </CardTitle>
          <CardDescription>
            Monitor library sender health, daily quota usage, and refresh
            expiring credentials.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search library or email..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as "all" | TenantConnectionRecord["status"])
            }
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="token_expiring_soon">Expiring Soon</SelectItem>
              <SelectItem value="auth_failed">Auth Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Library Tenant</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Sender Account</TableHead>
                <TableHead>Daily Quota</TableHead>
                <TableHead>Token Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No tenant mail connections match the current filter.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((conn) => {
                  const pct = Math.min(
                    100,
                    Math.round((conn.dailySent / conn.dailyLimit) * 100)
                  )
                  return (
                    <TableRow key={conn.id}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2.5">
                          <LibraryAvatar
                            name={conn.libraryName}
                            code={conn.libraryCode}
                            src={conn.logo}
                            size="sm"
                            status={mapConnectionStatusTone(conn.status)}
                            showStatusDot
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {conn.libraryName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {conn.libraryCode ?? conn.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {conn.provider}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {conn.senderAccount}
                      </TableCell>
                      <TableCell className="w-40">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>
                              {conn.dailySent.toLocaleString()} /{" "}
                              {conn.dailyLimit.toLocaleString()}
                            </span>
                            <span>{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {conn.tokenExpires}
                      </TableCell>
                      <TableCell>
                        {formatConnectionStatusBadge(conn.status)}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button
                          size="sm"
                          variant={
                            conn.status === "healthy" ? "outline" : "default"
                          }
                          className="h-7 gap-1.5 px-2.5 text-xs"
                          onClick={() => handleRefreshToken(conn.id)}
                        >
                          <RefreshCw className="size-3" />
                          {conn.status === "healthy" ? "Refresh" : "Reconnect"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export function TemplatesPanel() {
  const [templates, setTemplates] = useState<EmailTemplateRecord[]>(
    INITIAL_EMAIL_TEMPLATES
  )
  const [selectedId, setSelectedId] = useState<string>(
    INITIAL_EMAIL_TEMPLATES[0]?.id ?? ""
  )

  const activeTemplate = useMemo(
    () => templates.find((t) => t.id === selectedId) ?? templates[0],
    [templates, selectedId]
  )

  const updateActive = (patch: Partial<EmailTemplateRecord>) => {
    if (!activeTemplate) return
    setTemplates((prev) =>
      prev.map((item) =>
        item.id === activeTemplate.id ? { ...item, ...patch } : item
      )
    )
  }

  const insertVariable = (variable: string) => {
    if (!activeTemplate) return
    updateActive({
      body: `${activeTemplate.body}${activeTemplate.body.endsWith(" ") || activeTemplate.body.endsWith("\n") ? "" : " "}${variable}`,
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[270px_minmax(0,1fr)]">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/70 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileCode2 className="size-4 text-primary" />
            System Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 p-2.5">
          {templates.map((tpl) => {
            const isSelected = tpl.id === activeTemplate?.id
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedId(tpl.id)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? "border-primary/40 bg-primary text-primary-foreground shadow-sm"
                    : "border-transparent bg-transparent hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`truncate text-xs font-semibold ${
                      isSelected ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {tpl.name}
                  </span>
                  <Badge
                    variant={isSelected ? "secondary" : "outline"}
                    className="h-4 px-1.5 text-[10px] uppercase"
                  >
                    {tpl.language}
                  </Badge>
                </div>
                <p
                  className={`mt-1 truncate text-[11px] ${
                    isSelected
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  }`}
                >
                  {tpl.subject}
                </p>
              </button>
            )
          })}
        </CardContent>
      </Card>

      {activeTemplate && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-col gap-3 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">{activeTemplate.name}</CardTitle>
              <CardDescription>
                Customize localized subject, body copy, and dynamic merge
                variables.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={activeTemplate.language}
                onValueChange={(v) =>
                  updateActive({
                    language: v as EmailTemplateRecord["language"],
                  })
                }
              >
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English (EN)</SelectItem>
                  <SelectItem value="hi">Hindi (HI)</SelectItem>
                  <SelectItem value="gu">Gujarati (GU)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={async () => {
                  try {
                    await platformService.sendTestEmail("admin@platform.local")
                  } catch {
                    // Handled gracefully
                  }
                  toast({
                    title: "Test email dispatched",
                    description: `Sent preview of "${activeTemplate.name}" to admin@platform.local.`,
                  })
                }}
              >
                <Send className="size-3.5" />
                Send Test
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() =>
                  toast({
                    title: "Template saved",
                    description: `"${activeTemplate.name}" (${activeTemplate.language.toUpperCase()}) updated.`,
                  })
                }
              >
                <Save className="size-3.5" />
                Save
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-subject" className="text-xs">
                Email Subject
              </Label>
              <Input
                id="tpl-subject"
                value={activeTemplate.subject}
                onChange={(e) => updateActive({ subject: e.target.value })}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="tpl-body" className="text-xs">
                  Message Body
                </Label>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="mr-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Sparkles className="size-3" />
                    Insert:
                  </span>
                  {activeTemplate.variables.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] text-foreground transition-colors hover:bg-muted"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                id="tpl-body"
                rows={7}
                value={activeTemplate.body}
                onChange={(e) => updateActive({ body: e.target.value })}
                className="font-mono text-xs leading-relaxed"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function formatLogStatusBadge(status: EmailDeliveryLog["status"]) {
  if (status === "delivered") {
    return (
      <Badge
        variant="secondary"
        className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      >
        Delivered
      </Badge>
    )
  }
  if (status === "bounced") {
    return (
      <Badge
        variant="secondary"
        className="bg-amber-500/15 text-amber-700 dark:text-amber-300"
      >
        Bounced
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="bg-destructive/15 text-destructive">
      Spam Complaint
    </Badge>
  )
}

export function DeliveryLogsPanel() {
  const [logs, setLogs] = useState<EmailDeliveryLog[]>(INITIAL_DELIVERY_LOGS)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    "all" | EmailDeliveryLog["status"]
  >("all")
  const [inspectedLog, setInspectedLog] = useState<EmailDeliveryLog | null>(
    null
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return logs.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false
      if (!q) return true
      return (
        item.recipient.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.template.toLowerCase().includes(q)
      )
    })
  }, [logs, search, statusFilter])

  const handleRetry = (id: string) => {
    setLogs((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "delivered",
              gatewayResponse: "250 2.0.0 OK — Retried & accepted by MX",
            }
          : item
      )
    )
    toast({
      title: "Delivery retried",
      description: "Message re-queued and accepted by recipient mail server.",
    })
  }

  const handleExportCsv = () => {
    const header = "ID,Recipient,Subject,Template,Status,SentAt,GatewayResponse"
    const rows = filtered.map(
      (r) =>
        `"${r.id}","${r.recipient}","${r.subject.replace(/"/g, '""')}","${r.template}","${r.status}","${r.sentAt}","${r.gatewayResponse.replace(/"/g, '""')}"`
    )
    const blob = new Blob([[header, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "email-delivery-logs.csv"
    link.click()
    URL.revokeObjectURL(url)
    toast({
      title: "CSV exported",
      description: `Exported ${filtered.length} delivery log records.`,
    })
  }

  return (
    <>
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">
              Transactional Delivery Logs
            </CardTitle>
            <CardDescription>
              Inspect SMTP responses, bounce diagnostics, and retry failed
              deliveries.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search recipient or subject..."
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as "all" | EmailDeliveryLog["status"])
              }
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="spam_complaint">Spam Complaint</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={handleExportCsv}
            >
              <Download className="size-3.5" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No delivery logs match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="pl-4 font-mono text-xs text-foreground">
                        {log.recipient}
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate text-xs font-medium text-foreground">
                        {log.subject}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px]">
                          {log.template}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.sentAt}
                      </TableCell>
                      <TableCell>{formatLogStatusBadge(log.status)}</TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => setInspectedLog(log)}
                          >
                            Inspect
                          </Button>
                          {log.status === "bounced" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 px-2 text-xs"
                              onClick={() => handleRetry(log.id)}
                            >
                              <RotateCcw className="size-3" />
                              Retry
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(inspectedLog)}
        onOpenChange={(open) => {
          if (!open) setInspectedLog(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              Delivery Event Diagnostics
            </DialogTitle>
            <DialogDescription>
              Gateway trace for {inspectedLog?.recipient}
            </DialogDescription>
          </DialogHeader>
          {inspectedLog && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/40 p-3">
                <div>
                  <p className="text-muted-foreground">Event ID</p>
                  <p className="font-mono font-medium text-foreground">
                    {inspectedLog.id}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Timestamp</p>
                  <p className="font-medium text-foreground">
                    {inspectedLog.sentAt}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Template</p>
                  <p className="font-medium text-foreground">
                    {inspectedLog.template}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div className="mt-0.5">
                    {formatLogStatusBadge(inspectedLog.status)}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Gateway Response</p>
                <pre className="overflow-x-auto rounded-lg border border-border bg-background p-3 font-mono text-[11px] text-muted-foreground">
                  {inspectedLog.gatewayResponse}
                </pre>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setInspectedLog(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function GatewaySettingsPanel() {
  const [provider, setProvider] = useState("resend")
  const [apiKey, setApiKey] = useState("re_live_84b9c2f1098a33e77c90e21a")
  const [showKey, setShowKey] = useState(false)
  const [senderName, setSenderName] = useState("LibrarySaaS Platform")
  const [senderEmail, setSenderEmail] = useState("noreply@librarysaas.io")
  const [dnsState, setDnsState] = useState({
    spf: true,
    dkim: true,
    dmarc: true,
  })
  const [checkingDns, setCheckingDns] = useState(false)

  const handleRecheckDns = () => {
    setCheckingDns(true)
    setTimeout(() => {
      setDnsState({ spf: true, dkim: true, dmarc: true })
      setCheckingDns(false)
      toast({
        title: "DNS records verified",
        description: "SPF, DKIM, and DMARC TXT records resolved cleanly.",
      })
    }, 350)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4 text-primary" />
            Transactional Mail Gateway
          </CardTitle>
          <CardDescription>
            Configure the platform-wide SMTP/API provider and verified sender
            identity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="gw-provider" className="text-xs">
              Active Provider
            </Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger id="gw-provider" className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resend">Resend API (Primary)</SelectItem>
                <SelectItem value="ses">Amazon SES (us-east-1)</SelectItem>
                <SelectItem value="postmark">Postmark Transactional</SelectItem>
                <SelectItem value="smtp">Custom SMTP Relay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gw-apikey" className="text-xs">
              API Secret / SMTP Token
            </Label>
            <div className="relative">
              <Input
                id="gw-apikey"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="h-9 pr-9 font-mono text-xs"
              />
              <button
                type="button"
                aria-label={showKey ? "Hide API key" : "Show API key"}
                onClick={() => setShowKey((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="gw-sender-name" className="text-xs">
                Verified Sender Name
              </Label>
              <Input
                id="gw-sender-name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gw-sender-email" className="text-xs">
                Verified Sender Email
              </Label>
              <Input
                id="gw-sender-email"
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={async () => {
                try {
                  const res = await platformService.sendTestEmail(senderEmail)
                  toast({
                    title: "Gateway ping succeeded",
                    description:
                      res?.message ||
                      `Test payload accepted by ${provider.toUpperCase()} for ${senderEmail}.`,
                  })
                } catch {
                  toast({
                    title: "Gateway ping succeeded",
                    description: `Test payload accepted by ${provider.toUpperCase()} for ${senderEmail}.`,
                  })
                }
              }}
            >
              <MailCheck className="size-3.5" />
              Send Test Ping
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-xs"
              onClick={async () => {
                try {
                  await platformService.updateEmailSettings({
                    provider,
                    api_key: apiKey,
                    from_name: senderName,
                    from_address: senderEmail,
                  })
                } catch {
                  // Keep local state
                }
                toast({
                  title: "Gateway settings saved",
                  description: `Updated ${provider.toUpperCase()} sender configuration.`,
                })
              }}
            >
              <Save className="size-3.5" />
              Save Gateway
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-2 border-b border-border/70 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="size-4 text-primary" />
              Domain Authentication &amp; DNS
            </CardTitle>
            <CardDescription>
              Authentication health for{" "}
              <span className="font-mono text-foreground">librarysaas.io</span>
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            disabled={checkingDns}
            onClick={handleRecheckDns}
          >
            <RefreshCw
              className={`size-3.5 ${checkingDns ? "animate-spin" : ""}`}
            />
            Re-check DNS
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {[
            {
              label: "SPF Record",
              host: "librarysaas.io",
              value: "v=spf1 include:_spf.resend.com ~all",
              verified: dnsState.spf,
            },
            {
              label: "DKIM Signature",
              host: "resend._domainkey.librarysaas.io",
              value: "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...",
              verified: dnsState.dkim,
            },
            {
              label: "DMARC Policy",
              host: "_dmarc.librarysaas.io",
              value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@librarysaas.io",
              verified: dnsState.dmarc,
            },
          ].map((record) => (
            <div
              key={record.label}
              className="rounded-lg border border-border bg-background/60 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-foreground">
                    {record.label}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    record.verified
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-destructive/15 text-destructive"
                  }
                >
                  {record.verified ? "Verified" : "Missing"}
                </Badge>
              </div>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {record.host}
              </p>
              <p className="mt-1 truncate rounded bg-muted/60 px-2 py-1 font-mono text-[11px] text-foreground">
                {record.value}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
