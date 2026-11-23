"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Copy,
  FileImage,
  Search,
  Trash2,
  Upload,
} from "lucide-react"

interface WebsiteCmsHeaderProps {
  title: string
  description?: string
  rightSlot?: React.ReactNode
}

function WebsiteCmsHeader({
  title,
  description,
  rightSlot,
}: WebsiteCmsHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/60">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
    </div>
  )
}
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

export default function WebsiteMediaPage() {
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
    <section className="container space-y-5 py-5">
      <WebsiteCmsHeader
        title="Media Assets"
        description="Manage CDN-hosted hero graphics, brand logos, and onboarding screenshots."
        rightSlot={
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="size-3.5" />
            Upload Asset
          </Button>
        }
      />

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
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((asset) => (
              <div
                key={asset.id}
                className="rounded-xl border border-border bg-background/60 p-3 space-y-3"
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
    </section>
  )
}
