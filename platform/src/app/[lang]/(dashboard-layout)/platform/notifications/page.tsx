"use client"

import { useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { platformService } from "@/services/platform-service"
import { toast } from "sonner"
import {
  Bell,
  Clock,
  Image as ImageIcon,
  Link2,
  Megaphone,
  Paperclip,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react"

import type {
  BroadcastDraft,
  BroadcastHistoryItem,
  NotificationTemplateItem,
} from "./_components/broadcast-types"
import type { NotificationTab } from "./_components/notifications-shell"

import { initialAllLibrariesList } from "@/data/platform/platform-data"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BroadcastComposerForm } from "./_components/broadcast-composer-form"
import { BroadcastPreview } from "./_components/broadcast-preview"
import {
  DEFAULT_BROADCAST_DRAFT,
  INITIAL_BROADCAST_HISTORY,
  getDialogVariantLabel,
  getSurfaceLabel,
} from "./_components/broadcast-types"
import {
  NotificationReportsPanel,
  NotificationTemplatesPanel,
} from "./_components/notifications-extra-panels"
import {
  NotificationsHeader,
  NotificationsKpiCard,
  NotificationsPagination,
} from "./_components/notifications-shell"

const PAGE_SIZE = 5

export default function PlatformNotificationsPage() {
  const params = useParams()
  const lang = (params.lang as string) || "en"

  const [activeTab, setActiveTab] = useState<NotificationTab>("broadcast")
  const [draft, setDraft] = useState<BroadcastDraft>(DEFAULT_BROADCAST_DRAFT)
  const [history, setHistory] = useState<BroadcastHistoryItem[]>(
    INITIAL_BROADCAST_HISTORY
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [surfaceFilter, setSurfaceFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return history.filter((item) => {
      const matchesSurface =
        surfaceFilter === "all" || item.surface === surfaceFilter
      if (!matchesSurface) return false
      if (!q) return true
      return (
        item.title.toLowerCase().includes(q) ||
        item.audience.toLowerCase().includes(q) ||
        item.variantLabel.toLowerCase().includes(q)
      )
    })
  }, [history, searchQuery, surfaceFilter])

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE))
  const paginatedHistory = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages)
    const start = (safePage - 1) * PAGE_SIZE
    return filteredHistory.slice(start, start + PAGE_SIZE)
  }, [filteredHistory, currentPage, totalPages])

  const kpis = useMemo(() => {
    const activeHeaders = history.filter(
      (h) => h.status === "Active Header"
    ).length
    const scheduled = history.filter((h) => h.status === "Scheduled").length
    return {
      total: history.length,
      activeHeaders,
      scheduled,
      avgOpen: "90.7%",
    }
  }, [history])

  const resolveAudienceLabel = () => {
    if (draft.audience === "all") return "All Libraries (142)"
    if (draft.audience === "pro") return "Pro & Enterprise (32)"
    if (draft.audience === "grace") return "Grace / Locked (7)"
    if (draft.audience === "students") return "Student Mobile App"
    const lib = initialAllLibrariesList.find(
      (l) => l.id === draft.targetLibraryId
    )
    return lib ? `${lib.name} (${lib.code})` : "Selected Library"
  }

  const handleDispatch = async () => {
    if (!draft.title.trim() || !draft.message.trim()) {
      toast.error("Please enter both Title and Message.")
      return
    }

    const variantLabel =
      draft.surface === "header_alert"
        ? "Pinned Header Alert"
        : draft.surface === "in_app_push"
          ? "In-App + Mobile Push"
          : getDialogVariantLabel(draft.dialogVariant)

    const status: BroadcastHistoryItem["status"] = draft.scheduleEnabled
      ? "Scheduled"
      : draft.surface === "header_alert"
        ? "Active Header"
        : "Delivered"

    const created: BroadcastHistoryItem = {
      id: `nt-${Date.now()}`,
      title: draft.title.trim(),
      surface: draft.surface,
      variantLabel,
      severity: draft.severity,
      audience: resolveAudienceLabel(),
      deliveredAt: draft.scheduleEnabled
        ? `Scheduled: ${draft.scheduledAt.replace("T", " ")}`
        : "Just now",
      reach: draft.audience === "single" ? "1 Tenant" : "142 Tenants",
      openRate: draft.scheduleEnabled ? "-" : "0.0%",
      hasAttachment: !!draft.attachment,
      hasLink: !!draft.ctaLabel.trim(),
      hasImage: !!draft.imageUrl.trim(),
      status,
    }

    setHistory((prev) => [created, ...prev])
    setCurrentPage(1)

    try {
      await platformService.broadcastNotification({
        title: draft.title.trim(),
        body: draft.message.trim(),
        audience: "All Students",
      })
    } catch {
      // Local state is preserved
    }

    toast.success(
      draft.scheduleEnabled ? "Broadcast Scheduled" : "Broadcast Dispatched",
      {
        description: `${variantLabel} targeting ${created.audience}.`,
      }
    )
  }

  const handleRemoveHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id))
    toast.success("Broadcast removed from log")
  }

  const handleUseTemplate = (tpl: NotificationTemplateItem) => {
    setDraft((prev) => ({
      ...prev,
      surface: tpl.surface,
      dialogVariant: tpl.dialogVariant,
      severity: tpl.severity,
      title: tpl.title,
      message: tpl.preview,
      ctaLabel: tpl.ctaLabel,
      ctaUrl: tpl.ctaUrl,
    }))
    setActiveTab("composer")
    toast.success(`Loaded "${tpl.name}" into Rich Composer`)
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
      <NotificationsHeader
        lang={lang}
        title="Broadcast & Notification Center"
        badgeText={`${history.length} Campaigns`}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <Button
            type="button"
            size="sm"
            onClick={() => setActiveTab("composer")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold gap-1.5"
          >
            <Sparkles className="size-3.5" />
            Rich Composer
          </Button>
        }
      />

      {activeTab === "composer" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7">
            <BroadcastComposerForm
              draft={draft}
              onChange={setDraft}
              onSubmit={handleDispatch}
            />
          </div>
          <div className="lg:col-span-5 lg:sticky lg:top-6">
            <BroadcastPreview draft={draft} />
          </div>
        </div>
      ) : activeTab === "templates" ? (
        <NotificationTemplatesPanel onUseTemplate={handleUseTemplate} />
      ) : activeTab === "reports" ? (
        <NotificationReportsPanel />
      ) : (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <NotificationsKpiCard
              label="Total Broadcasts"
              value={kpis.total}
              subtext="Header, dialog & push"
              accent="primary"
              icon={Bell}
            />
            <NotificationsKpiCard
              label="Active Header Alerts"
              value={kpis.activeHeaders}
              subtext="Pinned on tenant bar"
              accent="amber"
              icon={Megaphone}
            />
            <NotificationsKpiCard
              label="Avg Open Rate"
              value={kpis.avgOpen}
              subtext="Across active notices"
              accent="emerald"
              icon={TrendingUp}
            />
            <NotificationsKpiCard
              label="Scheduled Queue"
              value={kpis.scheduled}
              subtext="Pending dispatch"
              accent="blue"
              icon={Clock}
            />
          </div>

          <Tabs defaultValue="compose" className="w-full space-y-5">
            <TabsList className="grid w-full sm:w-[380px] grid-cols-2">
              <TabsTrigger value="compose">Compose & Preview</TabsTrigger>
              <TabsTrigger value="history">
                Broadcast Log ({history.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7">
                  <BroadcastComposerForm
                    draft={draft}
                    onChange={setDraft}
                    onSubmit={handleDispatch}
                  />
                </div>

                <div className="lg:col-span-5 lg:sticky lg:top-20">
                  <BroadcastPreview draft={draft} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <Card className="border-border/80 bg-card rounded-xl overflow-hidden">
                <CardHeader className="p-4 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1)
                      }}
                      placeholder="Search broadcast title or audience..."
                      className="pl-8 h-9 text-xs"
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
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="header_alert">Header Alert</SelectItem>
                      <SelectItem value="dialog_modal">Dialog Modal</SelectItem>
                      <SelectItem value="in_app_push">Push & Feed</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="pl-5 text-xs font-semibold">
                          Broadcast
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Type & Assets
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Audience
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Open Rate
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Status
                        </TableHead>
                        <TableHead className="text-right pr-5 text-xs font-semibold">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedHistory.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-10 text-center text-sm text-muted-foreground"
                          >
                            No broadcasts match your filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="pl-5">
                              <div className="font-semibold text-xs text-foreground">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {item.deliveredAt}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    {getSurfaceLabel(item.surface)}
                                  </Badge>
                                  <span className="text-[11px] text-muted-foreground">
                                    {item.variantLabel}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  {item.hasImage && (
                                    <span
                                      className="inline-flex items-center gap-0.5 text-[10px]"
                                      title="Includes image"
                                    >
                                      <ImageIcon className="size-3" /> Img
                                    </span>
                                  )}
                                  {item.hasAttachment && (
                                    <span
                                      className="inline-flex items-center gap-0.5 text-[10px]"
                                      title="Includes attachment"
                                    >
                                      <Paperclip className="size-3" /> File
                                    </span>
                                  )}
                                  {item.hasLink && (
                                    <span
                                      className="inline-flex items-center gap-0.5 text-[10px]"
                                      title="Includes CTA link"
                                    >
                                      <Link2 className="size-3" /> Link
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div>{item.audience}</div>
                              <div className="text-[11px] text-muted-foreground">
                                {item.reach}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs font-semibold tabular-nums">
                              {item.openRate}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  item.status === "Delivered"
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 text-[11px]"
                                    : item.status === "Active Header"
                                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25 text-[11px]"
                                      : "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25 text-[11px]"
                                }
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveHistory(item.id)}
                                title="Delete broadcast"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>

                <NotificationsPagination
                  currentPage={Math.min(currentPage, totalPages)}
                  totalPages={totalPages}
                  totalItems={filteredHistory.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
