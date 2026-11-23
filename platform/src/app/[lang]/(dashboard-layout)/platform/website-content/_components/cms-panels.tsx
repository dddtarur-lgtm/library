"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  CheckCircle2,
  Copy,
  Edit,
  FileImage,
  FileText,
  Globe,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
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
import { Label } from "@/components/ui/label"
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

interface MarketingPageItem {
  id: string
  title: string
  slug: string
  seoTitle: string
  metaDescription: string
  status: "Published" | "Draft"
  updatedAt: string
}

const INITIAL_PAGES: MarketingPageItem[] = [
  {
    id: "pg-1",
    title: "Home Landing",
    slug: "/",
    seoTitle: "StudyHub — Study Library & Reading Room Management OS",
    metaDescription:
      "Automate seats, attendance, WhatsApp reminders, and GST billing.",
    status: "Published",
    updatedAt: "12 Nov 2026",
  },
  {
    id: "pg-2",
    title: "Pricing & Plans",
    slug: "/pricing",
    seoTitle: "Pricing — Transparent Plans for Single & Multi-Branch Libraries",
    metaDescription:
      "Compare Starter, Pro, and Enterprise tiers with 14-day free trial.",
    status: "Published",
    updatedAt: "10 Nov 2026",
  },
  {
    id: "pg-3",
    title: "Biometric & QR Attendance",
    slug: "/features/attendance",
    seoTitle: "Smart Biometric & QR Check-In for Study Halls",
    metaDescription:
      "Prevent proxy check-ins and track real-time desk occupancy.",
    status: "Published",
    updatedAt: "06 Nov 2026",
  },
  {
    id: "pg-4",
    title: "Enterprise Multi-Branch Guide",
    slug: "/enterprise",
    seoTitle: "Scale to 10+ Study Library Branches",
    metaDescription: "Centralized reporting, RBAC, and custom domain branding.",
    status: "Draft",
    updatedAt: "02 Nov 2026",
  },
]

export function MarketingPagesPanel() {
  const [pages, setPages] = useState<MarketingPageItem[]>(INITIAL_PAGES)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editing, setEditing] = useState<MarketingPageItem | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return pages.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false
      if (!q) return true
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.seoTitle.toLowerCase().includes(q)
      )
    })
  }, [pages, search, statusFilter])

  const openNewModal = () => {
    setEditing({
      id: `pg-${Date.now()}`,
      title: "",
      slug: "/new-page",
      seoTitle: "",
      metaDescription: "",
      status: "Draft",
      updatedAt: "12 Nov 2026",
    })
  }

  const handleSave = () => {
    if (!editing || !editing.title.trim()) {
      toast.error("Page title is required.")
      return
    }
    setPages((prev) => {
      const exists = prev.some((p) => p.id === editing.id)
      const next = { ...editing, updatedAt: "12 Nov 2026" }
      return exists
        ? prev.map((p) => (p.id === editing.id ? next : p))
        : [next, ...prev]
    })
    toast.success(`Saved "${editing.title}"`)
    setEditing(null)
  }

  return (
    <>
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Public Routes</CardTitle>
            <CardDescription>
              {filtered.length} marketing pages configured
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or slug..."
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={openNewModal}
            >
              <Plus className="size-3.5" />
              New Page
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Page Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>SEO Title</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-4 font-medium text-foreground">
                      <span className="inline-flex items-center gap-2 text-sm">
                        <FileText className="size-4 text-primary" />
                        {item.title}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.slug}
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate text-xs text-foreground">
                      {item.seoTitle}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.updatedAt}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          item.status === "Published"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : ""
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 px-2.5 text-xs"
                        onClick={() => setEditing(item)}
                      >
                        <Edit className="size-3" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Globe className="size-4 text-primary" />
              {editing?.title ? `Edit: ${editing.title}` : "Create New Page"}
            </DialogTitle>
            <DialogDescription>
              Configure URL slug, SEO metadata, and visibility.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Page Title</Label>
                  <Input
                    value={editing.title}
                    onChange={(e) =>
                      setEditing({ ...editing, title: e.target.value })
                    }
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">URL Slug</Label>
                  <Input
                    value={editing.slug}
                    onChange={(e) =>
                      setEditing({ ...editing, slug: e.target.value })
                    }
                    className="h-9 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">SEO Meta Title</Label>
                <Input
                  value={editing.seoTitle}
                  onChange={(e) =>
                    setEditing({ ...editing, seoTitle: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Meta Description</Label>
                <Textarea
                  rows={2}
                  value={editing.metaDescription}
                  onChange={(e) =>
                    setEditing({ ...editing, metaDescription: e.target.value })
                  }
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Publication Status</Label>
                <Select
                  value={editing.status}
                  onValueChange={(v) =>
                    setEditing({
                      ...editing,
                      status: v as MarketingPageItem["status"],
                    })
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface MediaAsset {
  id: string
  name: string
  category: "Hero" | "Logos" | "Guides"
  dimensions: string
  size: string
  url: string
}

const INITIAL_ASSETS: MediaAsset[] = [
  {
    id: "med-1",
    name: "hero-dashboard-preview.webp",
    category: "Hero",
    dimensions: "1920 × 1080",
    size: "420 KB",
    url: "https://cdn.studyhub.io/assets/hero-dashboard-preview.webp",
  },
  {
    id: "med-2",
    name: "studyhub-wordmark-dark.svg",
    category: "Logos",
    dimensions: "480 × 120",
    size: "18 KB",
    url: "https://cdn.studyhub.io/assets/studyhub-wordmark-dark.svg",
  },
  {
    id: "med-3",
    name: "biometric-qr-kiosk-guide.png",
    category: "Guides",
    dimensions: "1280 × 720",
    size: "290 KB",
    url: "https://cdn.studyhub.io/assets/biometric-qr-kiosk-guide.png",
  },
  {
    id: "med-4",
    name: "mobile-app-seat-map.webp",
    category: "Hero",
    dimensions: "1200 × 900",
    size: "310 KB",
    url: "https://cdn.studyhub.io/assets/mobile-app-seat-map.webp",
  },
]

export function MediaAssetsPanel() {
  const [assets, setAssets] = useState<MediaAsset[]>(INITIAL_ASSETS)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newCategory, setNewCategory] = useState<MediaAsset["category"]>("Hero")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return assets.filter((a) => {
      if (category !== "all" && a.category !== category) return false
      if (!q) return true
      return a.name.toLowerCase().includes(q)
    })
  }, [assets, search, category])

  const handleCopy = (url: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url)
    }
    toast.success("CDN URL copied to clipboard")
  }

  const handleUpload = () => {
    const clean = newName.trim() || `media-asset-${Date.now()}.webp`
    setAssets((prev) => [
      {
        id: `med-${Date.now()}`,
        name: clean,
        category: newCategory,
        dimensions: "1440 × 900",
        size: "245 KB",
        url: `https://cdn.studyhub.io/assets/${clean}`,
      },
      ...prev,
    ])
    setNewName("")
    setUploadOpen(false)
    toast.success(`Uploaded "${clean}" to CDN`)
  }

  return (
    <>
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Asset Library</CardTitle>
            <CardDescription>
              {filtered.length} files available on edge CDN
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search filename..."
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Hero">Hero</SelectItem>
                <SelectItem value="Logos">Logos</SelectItem>
                <SelectItem value="Guides">Guides</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="size-3.5" />
              Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((asset) => (
              <div
                key={asset.id}
                className="space-y-3 rounded-xl border border-border bg-background/60 p-3"
              >
                <div className="flex h-28 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-muted-foreground">
                  <FileImage className="size-8" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {asset.name}
                    </p>
                    <Badge variant="outline" className="text-[10px]">
                      {asset.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {asset.dimensions} • {asset.size}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-1.5 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 flex-1 gap-1 text-xs"
                    onClick={() => handleCopy(asset.url)}
                  >
                    <Copy className="size-3" />
                    Copy URL
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      setAssets((prev) =>
                        prev.filter((item) => item.id !== asset.id)
                      )
                      toast.success(`Removed "${asset.name}"`)
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Upload Media Asset</DialogTitle>
            <DialogDescription>
              Register a new static image or SVG on the CDN.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">File Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. pricing-comparison-chart.webp"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select
                value={newCategory}
                onValueChange={(v) =>
                  setNewCategory(v as MediaAsset["category"])
                }
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hero">Hero</SelectItem>
                  <SelectItem value="Logos">Logos</SelectItem>
                  <SelectItem value="Guides">Guides</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setUploadOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpload}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface LeadInquiry {
  id: string
  name: string
  libraryName: string
  city: string
  email: string
  phone: string
  seats: string
  message: string
  receivedAt: string
  status: "New" | "Contacted" | "Converted"
}

const INITIAL_LEADS: LeadInquiry[] = [
  {
    id: "ld-1",
    name: "Harshvardhan Kulkarni",
    libraryName: "Vidya Sagar Study Centre",
    city: "Nagpur",
    email: "harsh@vidyasagarstudy.in",
    phone: "+91 98230 88771",
    seats: "240 seats (2 branches)",
    message:
      "We are migrating from Excel and want a live walkthrough of biometric QR sync and WhatsApp fee reminders.",
    receivedAt: "Today, 10:15 AM",
    status: "New",
  },
  {
    id: "ld-2",
    name: "Meera Nair",
    libraryName: "Focus Point Reading Room",
    city: "Kochi",
    email: "meera@focuspoint.co.in",
    phone: "+91 94460 11229",
    seats: "110 seats",
    message:
      "Interested in the Pro plan with GST invoicing and custom subdomain page.",
    receivedAt: "Yesterday, 04:40 PM",
    status: "Contacted",
  },
  {
    id: "ld-3",
    name: "Gaurav Bansal",
    libraryName: "Sankalp IAS Library",
    city: "Lucknow",
    email: "gaurav@sankalpias.in",
    phone: "+91 99180 65432",
    seats: "350 seats (3 branches)",
    message:
      "Looking for enterprise multi-branch analytics and custom Razorpay settlement.",
    receivedAt: "10 Nov 2026",
    status: "Converted",
  },
]

function leadStatusBadge(status: LeadInquiry["status"]) {
  if (status === "Converted") {
    return (
      <Badge
        variant="secondary"
        className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      >
        Converted
      </Badge>
    )
  }
  if (status === "Contacted") {
    return (
      <Badge
        variant="secondary"
        className="bg-amber-500/15 text-amber-700 dark:text-amber-300"
      >
        Contacted
      </Badge>
    )
  }
  return <Badge className="bg-primary text-primary-foreground">New</Badge>
}

export function LeadInquiriesPanel() {
  const [leads, setLeads] = useState<LeadInquiry[]>(INITIAL_LEADS)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string>(INITIAL_LEADS[0].id)
  const [replyText, setReplyText] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false
      if (!q) return true
      return (
        l.name.toLowerCase().includes(q) ||
        l.libraryName.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q)
      )
    })
  }, [leads, search, statusFilter])

  const activeLead = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? filtered[0] ?? null,
    [leads, selectedId, filtered]
  )

  const updateLeadStatus = (status: LeadInquiry["status"]) => {
    if (!activeLead) return
    setLeads((prev) =>
      prev.map((l) => (l.id === activeLead.id ? { ...l, status } : l))
    )
    toast.success(`Lead marked as ${status}`)
  }

  const handleSendReply = () => {
    if (!activeLead || !replyText.trim()) {
      toast.error("Please write a reply message.")
      return
    }
    setLeads((prev) =>
      prev.map((l) =>
        l.id === activeLead.id && l.status === "New"
          ? { ...l, status: "Contacted" }
          : l
      )
    )
    toast.success(`Reply sent to ${activeLead.email}`)
    setReplyText("")
  }

  return (
    <div className="grid overflow-hidden rounded-xl border border-border bg-card shadow-sm md:grid-cols-[340px_minmax(0,1fr)]">
      <div className="border-b border-border/70 md:border-b-0 md:border-r">
        <div className="space-y-2 border-b border-border/70 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, library, city..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All Leads" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Contacted">Contacted</SelectItem>
              <SelectItem value="Converted">Converted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="divide-y divide-border/60">
          {filtered.map((lead) => {
            const isSelected = activeLead?.id === lead.id
            return (
              <button
                key={lead.id}
                type="button"
                onClick={() => setSelectedId(lead.id)}
                className={`w-full px-3.5 py-3 text-left transition-colors ${
                  isSelected
                    ? "border-l-2 border-l-primary bg-muted/70"
                    : "hover:bg-muted/35"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-foreground">
                    {lead.libraryName}
                  </span>
                  {leadStatusBadge(lead.status)}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {lead.name} • {lead.city}
                </p>
                <p className="mt-1 truncate text-xs text-foreground/80">
                  {lead.message}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col justify-between p-5">
        {!activeLead ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center text-xs text-muted-foreground">
            <MessageSquare className="mb-2 size-6" />
            Select a lead inquiry to view details.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">
                    {activeLead.libraryName}
                  </h2>
                  {leadStatusBadge(activeLead.status)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeLead.name} • {activeLead.city} • {activeLead.seats}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => updateLeadStatus("Contacted")}
                >
                  Mark Contacted
                </Button>
                <Button
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => updateLeadStatus("Converted")}
                >
                  <CheckCircle2 className="size-3.5" />
                  Converted
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5 text-primary" />
                {activeLead.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-3.5 text-primary" />
                {activeLead.phone}
              </span>
              <span>Received: {activeLead.receivedAt}</span>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3.5 text-sm leading-relaxed text-foreground">
              {activeLead.message}
            </div>

            <div className="space-y-2 pt-2">
              <Textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${activeLead.name} (${activeLead.email})...`}
                className="text-xs"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={handleSendReply}
                >
                  <Send className="size-3.5" />
                  Send Demo Reply
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
