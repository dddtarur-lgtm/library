"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Edit, Plus, Search } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"

interface KbArticle {
  id: string
  title: string
  category: "Onboarding" | "Billing & GST" | "Hardware & QR" | "Email Sync"
  summary: string
  content: string
  status: "Published" | "Draft"
  views: number
}

const INITIAL_ARTICLES: KbArticle[] = [
  {
    id: "kb-1",
    title: "Connecting ZKTeco & eSSL Biometric Devices",
    category: "Hardware & QR",
    summary: "Step-by-step IP bridge setup for real-time gate attendance sync.",
    content:
      "1. Connect the biometric terminal to the branch router.\n2. Open Branch Settings > Hardware Sync and paste the device serial number.\n3. Test a sample punch to verify instant student check-in.",
    status: "Published",
    views: 1420,
  },
  {
    id: "kb-2",
    title: "Configuring GSTIN & HSN Codes on Student Invoices",
    category: "Billing & GST",
    summary: "Enable CGST/SGST split and automated PDF receipts.",
    content:
      "Navigate to Settings > Billing & Tax to enter your 15-digit GSTIN. All future student fee receipts will automatically include tax breakdowns.",
    status: "Published",
    views: 980,
  },
  {
    id: "kb-3",
    title: "Re-authorizing Google Workspace / Microsoft 365 OAuth",
    category: "Email Sync",
    summary: "Fix expiring mail tokens in under 60 seconds.",
    content:
      "Open Email & Mailbox > Connections and click Reconnect next to your library domain.",
    status: "Published",
    views: 615,
  },
  {
    id: "kb-4",
    title: "Importing Existing Student Rosters via CSV",
    category: "Onboarding",
    summary: "Bulk-upload student phone numbers, shifts, and renewal dates.",
    content:
      "Download the CSV template from Students > Import and verify date formats (YYYY-MM-DD) before uploading.",
    status: "Draft",
    views: 120,
  },
]

export function KnowledgeBasePanel() {
  const [articles, setArticles] = useState<KbArticle[]>(INITIAL_ARTICLES)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [editing, setEditing] = useState<KbArticle | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return articles.filter((a) => {
      if (category !== "all" && a.category !== category) return false
      if (!q) return true
      return (
        a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
      )
    })
  }, [articles, search, category])

  const openNew = () => {
    setEditing({
      id: `kb-${Date.now()}`,
      title: "",
      category: "Onboarding",
      summary: "",
      content: "",
      status: "Draft",
      views: 0,
    })
  }

  const handleSave = () => {
    if (!editing || !editing.title.trim()) {
      toast.error("Article title is required.")
      return
    }
    setArticles((prev) => {
      const exists = prev.some((a) => a.id === editing.id)
      return exists
        ? prev.map((a) => (a.id === editing.id ? editing : a))
        : [editing, ...prev]
    })
    toast.success(`Saved article "${editing.title}"`)
    setEditing(null)
  }

  return (
    <>
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Help Articles</CardTitle>
            <CardDescription>
              {filtered.length} guides in knowledge base
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Onboarding">Onboarding</SelectItem>
                <SelectItem value="Billing & GST">Billing &amp; GST</SelectItem>
                <SelectItem value="Hardware & QR">Hardware &amp; QR</SelectItem>
                <SelectItem value="Email Sync">Email Sync</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={openNew}>
              <Plus className="size-3.5" />
              New Article
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2">
          {filtered.map((art) => (
            <div
              key={art.id}
              className="flex flex-col justify-between space-y-3 rounded-xl border border-border bg-background/60 p-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {art.category}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={
                      art.status === "Published"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : ""
                    }
                  >
                    {art.status}
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {art.title}
                </h3>
                <p className="text-xs text-muted-foreground">{art.summary}</p>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
                <span>{art.views.toLocaleString()} views</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 px-2.5 text-xs"
                  onClick={() => setEditing(art)}
                >
                  <Edit className="size-3" />
                  Edit Guide
                </Button>
              </div>
            </div>
          ))}
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
            <DialogTitle className="text-base">
              {editing?.title ? "Edit Help Article" : "New Help Article"}
            </DialogTitle>
            <DialogDescription>
              Write concise, step-by-step instructions for tenant admins.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs">Article Title</Label>
                <Input
                  value={editing.title}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={editing.category}
                    onValueChange={(v) =>
                      setEditing({
                        ...editing,
                        category: v as KbArticle["category"],
                      })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="Billing & GST">
                        Billing &amp; GST
                      </SelectItem>
                      <SelectItem value="Hardware & QR">
                        Hardware &amp; QR
                      </SelectItem>
                      <SelectItem value="Email Sync">Email Sync</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={editing.status}
                    onValueChange={(v) =>
                      setEditing({
                        ...editing,
                        status: v as KbArticle["status"],
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
              <div className="space-y-1.5">
                <Label className="text-xs">Short Summary</Label>
                <Input
                  value={editing.summary}
                  onChange={(e) =>
                    setEditing({ ...editing, summary: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Article Body</Label>
                <Textarea
                  rows={5}
                  value={editing.content}
                  onChange={(e) =>
                    setEditing({ ...editing, content: e.target.value })
                  }
                  className="text-xs leading-relaxed"
                />
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
              Save Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
