"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  FileCode,
  Link2,
  Paperclip,
  Plus,
  Search,
  Send,
  Trash2,
  TrendingUp,
} from "lucide-react"

import type {
  BroadcastSeverity,
  BroadcastSurface,
  DialogVariant,
  NotificationTemplateItem,
} from "./broadcast-types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
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
import {
  INITIAL_NOTIFICATION_TEMPLATES,
  getDialogVariantLabel,
  getSurfaceLabel,
} from "./broadcast-types"
import {
  NotificationsKpiCard,
  NotificationsPagination,
} from "./notifications-shell"

export function NotificationTemplatesPanel({
  onUseTemplate,
}: {
  onUseTemplate: (tpl: NotificationTemplateItem) => void
}) {
  const [templates, setTemplates] = useState<NotificationTemplateItem[]>(
    INITIAL_NOTIFICATION_TEMPLATES
  )
  const [searchTerm, setSearchTerm] = useState("")
  const [surfaceFilter, setSurfaceFilter] = useState("all")

  const [isNewOpen, setIsNewOpen] = useState(false)
  const [name, setName] = useState("")
  const [category, setCategory] = useState("System Alerts")
  const [surface, setSurface] = useState<BroadcastSurface>("dialog_modal")
  const [dialogVariant, setDialogVariant] = useState<DialogVariant>("info_card")
  const [severity, setSeverity] = useState<BroadcastSeverity>("info")
  const [title, setTitle] = useState("")
  const [preview, setPreview] = useState("")
  const [ctaLabel, setCtaLabel] = useState("")
  const [ctaUrl, setCtaUrl] = useState("")
  const [hasAttachment, setHasAttachment] = useState(false)

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return templates.filter((t) => {
      if (surfaceFilter !== "all" && t.surface !== surfaceFilter) return false
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      )
    })
  }, [templates, searchTerm, surfaceFilter])

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !title.trim() || !preview.trim()) {
      toast.error("Provide Template Name, Title, and Message Preview.")
      return
    }
    const created: NotificationTemplateItem = {
      id: `tpl-${Date.now()}`,
      name: name.trim(),
      category,
      surface,
      dialogVariant,
      severity,
      title: title.trim(),
      preview: preview.trim(),
      ctaLabel: ctaLabel.trim(),
      ctaUrl: ctaUrl.trim(),
      hasAttachment,
      lastUsed: "Never",
      usageCount: 0,
    }
    setTemplates((prev) => [created, ...prev])
    setIsNewOpen(false)
    setName("")
    setTitle("")
    setPreview("")
    setCtaLabel("")
    setCtaUrl("")
    setHasAttachment(false)
    toast.success("Template Created")
  }

  const handleDuplicate = (tpl: NotificationTemplateItem) => {
    const copy: NotificationTemplateItem = {
      ...tpl,
      id: `tpl-${Date.now()}`,
      name: `${tpl.name} (Copy)`,
      usageCount: 0,
      lastUsed: "Never",
    }
    setTemplates((prev) => [copy, ...prev])
    toast.success("Template duplicated")
  }

  const handleDelete = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    toast.success("Template deleted")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-8 h-9 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={surfaceFilter} onValueChange={setSurfaceFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Surfaces</SelectItem>
              <SelectItem value="header_alert">Header Alert</SelectItem>
              <SelectItem value="dialog_modal">Dialog Modal</SelectItem>
              <SelectItem value="in_app_push">In-App & Push</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          size="sm"
          className="h-9 text-xs gap-1.5"
          onClick={() => setIsNewOpen(true)}
        >
          <Plus className="size-3.5" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tpl) => (
          <Card
            key={tpl.id}
            className="border-border/80 bg-card rounded-xl flex flex-col justify-between"
          >
            <CardHeader className="p-4 pb-2 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {tpl.category}
                  </p>
                  <h3 className="text-sm font-bold text-foreground">
                    {tpl.name}
                  </h3>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {getSurfaceLabel(tpl.surface)}
                </Badge>
              </div>
              {tpl.surface === "dialog_modal" && (
                <p className="text-[11px] text-primary font-medium">
                  Layout: {getDialogVariantLabel(tpl.dialogVariant)}
                </p>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-foreground line-clamp-1">
                  {tpl.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {tpl.preview}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {tpl.ctaLabel && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Link2 className="size-2.5" />
                      {tpl.ctaLabel}
                    </Badge>
                  )}
                  {tpl.hasAttachment && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Paperclip className="size-2.5" />
                      PDF Circular
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/60">
                <span className="text-[11px] text-muted-foreground">
                  Used {tpl.usageCount}x • {tpl.lastUsed}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => handleDuplicate(tpl)}
                    title="Duplicate"
                  >
                    <Copy className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-rose-500 hover:text-rose-600"
                    onClick={() => handleDelete(tpl.id)}
                    title="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs px-2.5 gap-1"
                    onClick={() => onUseTemplate(tpl)}
                  >
                    <Send className="size-3" />
                    Use
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card className="col-span-full border-border/80 bg-card p-8 text-center">
            <FileCode className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">
              No templates match your search
            </p>
          </Card>
        )}
      </div>

      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              New Notification Template
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTemplate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Template Name</Label>
                <Input
                  className="h-9 text-xs"
                  placeholder="e.g. Monthly GST Reminder"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Input
                  className="h-9 text-xs"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Surface</Label>
                <Select
                  value={surface}
                  onValueChange={(v) => setSurface(v as BroadcastSurface)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header_alert">Header Alert</SelectItem>
                    <SelectItem value="dialog_modal">Dialog Modal</SelectItem>
                    <SelectItem value="in_app_push">In-App & Push</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Dialog Style</Label>
                <Select
                  value={dialogVariant}
                  onValueChange={(v) => setDialogVariant(v as DialogVariant)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info_card">Info Card</SelectItem>
                    <SelectItem value="half_banner">Half Banner</SelectItem>
                    <SelectItem value="full_bleed">Full Bleed</SelectItem>
                    <SelectItem value="attachment_notice">
                      Attachment Notice
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Severity</Label>
                <Select
                  value={severity}
                  onValueChange={(v) => setSeverity(v as BroadcastSeverity)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Headline</Label>
              <Input
                className="h-9 text-xs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Message Body</Label>
              <Textarea
                rows={3}
                className="text-xs"
                value={preview}
                onChange={(e) => setPreview(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">CTA Label (optional)</Label>
                <Input
                  className="h-9 text-xs"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">CTA URL (optional)</Label>
                <Input
                  className="h-9 text-xs"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <Label className="text-xs">Includes PDF Attachment</Label>
              <Switch
                checked={hasAttachment}
                onCheckedChange={setHasAttachment}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface CampaignReportItem {
  id: string
  title: string
  surface: BroadcastSurface
  target: string
  sentAt: string
  deliveredCount: number
  openRate: number
  actionClicks: number
  attachmentDownloads: number
  dismissedCount: number
  status: string
}

const CAMPAIGN_REPORTS: CampaignReportItem[] = [
  {
    id: "CMP-904",
    title: "Diwali Early Bird SaaS Renewal Offer",
    surface: "dialog_modal",
    target: "All 142 Libraries",
    sentAt: "2026-11-01 10:00",
    deliveredCount: 142,
    openRate: 94.3,
    actionClicks: 82,
    attachmentDownloads: 41,
    dismissedCount: 52,
    status: "Completed",
  },
  {
    id: "CMP-903",
    title: "Payment Gateway Scheduled Maintenance Window",
    surface: "header_alert",
    target: "All 142 Libraries",
    sentAt: "2026-10-28 08:30",
    deliveredCount: 142,
    openRate: 99.2,
    actionClicks: 31,
    attachmentDownloads: 0,
    dismissedCount: 118,
    status: "Active Header",
  },
  {
    id: "CMP-902",
    title: "GST Compliance Circular & HSN Update",
    surface: "dialog_modal",
    target: "Pro & Enterprise (32)",
    sentAt: "2026-10-18 14:15",
    deliveredCount: 32,
    openRate: 87.5,
    actionClicks: 24,
    attachmentDownloads: 28,
    dismissedCount: 9,
    status: "Completed",
  },
  {
    id: "CMP-901",
    title: "Student App QR Attendance v4.2 Rollout",
    surface: "in_app_push",
    target: "Student Mobile App",
    sentAt: "2026-10-12 09:00",
    deliveredCount: 18420,
    openRate: 76.4,
    actionClicks: 6210,
    attachmentDownloads: 0,
    dismissedCount: 4100,
    status: "Completed",
  },
]

const REPORTS_PAGE_SIZE = 5

export function NotificationReportsPanel() {
  const [searchTerm, setSearchTerm] = useState("")
  const [surfaceFilter, setSurfaceFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedReport, setSelectedReport] =
    useState<CampaignReportItem | null>(null)

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return CAMPAIGN_REPORTS.filter((c) => {
      if (surfaceFilter !== "all" && c.surface !== surfaceFilter) return false
      if (!q) return true
      return (
        c.title.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.target.toLowerCase().includes(q)
      )
    })
  }, [searchTerm, surfaceFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / REPORTS_PAGE_SIZE))
  const paginated = useMemo(() => {
    const safe = Math.min(currentPage, totalPages)
    const start = (safe - 1) * REPORTS_PAGE_SIZE
    return filtered.slice(start, start + REPORTS_PAGE_SIZE)
  }, [filtered, currentPage, totalPages])

  const handleExportCsv = () => {
    const header =
      "Campaign ID,Title,Surface,Target,Sent At,Delivered,Open Rate %,Action Clicks,Attachment Downloads"
    const rows = filtered.map(
      (r) =>
        `"${r.id}","${r.title}","${r.surface}","${r.target}","${r.sentAt}",${r.deliveredCount},${r.openRate},${r.actionClicks},${r.attachmentDownloads}`
    )
    const blob = new Blob([[header, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "notification-delivery-reports.csv"
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast.success("Exported delivery reports CSV")
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NotificationsKpiCard
          label="Tracked Campaigns"
          value={CAMPAIGN_REPORTS.length}
          subtext="Last 30 days telemetry"
          accent="primary"
          icon={BarChart3}
        />
        <NotificationsKpiCard
          label="Average Open Rate"
          value="89.4%"
          subtext="Across headers, dialogs & push"
          accent="emerald"
          icon={TrendingUp}
        />
        <NotificationsKpiCard
          label="Total CTA Clicks"
          value="6,347"
          subtext="Deep-link & circular actions"
          accent="blue"
          icon={CheckCircle2}
        />
        <NotificationsKpiCard
          label="Median Read Time"
          value="14m"
          subtext="From dispatch to first view"
          accent="amber"
          icon={Clock}
        />
      </div>

      <Card className="border-border/80 bg-card rounded-xl overflow-hidden">
        <CardHeader className="p-4 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search campaign ID, title..."
                className="pl-8 h-9 text-xs"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <Select
              value={surfaceFilter}
              onValueChange={(v) => {
                setSurfaceFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-44 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Surfaces</SelectItem>
                <SelectItem value="header_alert">Header Alert</SelectItem>
                <SelectItem value="dialog_modal">Dialog Modal</SelectItem>
                <SelectItem value="in_app_push">In-App & Push</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={handleExportCsv}
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-xs font-semibold">
                    Campaign
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Surface
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Delivered
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Open Rate
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Actions
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    Inspect
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((rep) => (
                  <TableRow key={rep.id}>
                    <TableCell>
                      <p className="text-xs font-semibold">{rep.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {rep.id} • {rep.target} • {rep.sentAt}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {getSurfaceLabel(rep.surface)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold tabular-nums">
                      {rep.deliveredCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="w-40">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold tabular-nums">
                            {rep.openRate}%
                          </span>
                        </div>
                        <Progress value={rep.openRate} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">
                      {rep.actionClicks.toLocaleString()} clicks
                      {rep.attachmentDownloads > 0 && (
                        <span className="block text-[11px] text-muted-foreground">
                          {rep.attachmentDownloads} downloads
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2.5"
                        onClick={() => setSelectedReport(rep)}
                      >
                        <Eye className="size-3 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <NotificationsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={REPORTS_PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedReport}
        onOpenChange={(open) => !open && setSelectedReport(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {selectedReport?.id} — Delivery Breakdown
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-3 text-xs">
              <p className="font-semibold text-sm">{selectedReport.title}</p>
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/70">
                <div>
                  <p className="text-muted-foreground">Delivered</p>
                  <p className="text-sm font-bold tabular-nums">
                    {selectedReport.deliveredCount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Open Rate</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {selectedReport.openRate}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Action Clicks</p>
                  <p className="text-sm font-bold tabular-nums">
                    {selectedReport.actionClicks.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dismissed</p>
                  <p className="text-sm font-bold tabular-nums">
                    {selectedReport.dismissedCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
