"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Globe,
  MapPin,
  MessageSquareWarning,
  Search,
  ShieldAlert,
  Sparkles,
  XCircle,
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
import { LibraryAvatar, LibraryLogo } from "@/components/platform/library-logo"

interface PublicLibraryPageItem {
  id: string
  libraryCode: string
  libraryName: string
  city: string
  subdomain: string
  status: "Pending Review" | "Published" | "Changes Requested" | "Suspended"
  submittedDate: string
  headline: string
  description: string
  facilities: string[]
  startingPrice: string
  reviewNote?: string
}

const INITIAL_LIBRARY_PAGES: PublicLibraryPageItem[] = [
  {
    id: "lp-1",
    libraryCode: "LIB-AHM-005",
    libraryName: "Kalam Study Arena",
    city: "Ahmedabad",
    subdomain: "kalamarena.lmsplatform.com",
    status: "Published",
    submittedDate: "01 Nov 2026",
    headline: "Quiet 24x7 UPSC & GPSC Study Sanctuary in Navrangpura",
    description:
      "Ergonomic cabins, 1 Gbps dual-ISP Wi-Fi, biometric entry, and dedicated discussion lounge.",
    facilities: ["24x7 Access", "High-Speed Wi-Fi", "AC Cabins", "Locker"],
    startingPrice: "₹1,499 / mo",
  },
  {
    id: "lp-2",
    libraryCode: "LIB-PUN-001",
    libraryName: "Apex Study Hub",
    city: "Pune",
    subdomain: "apexstudy.lmsplatform.com",
    status: "Pending Review",
    submittedDate: "11 Nov 2026",
    headline: "Premium Silent Study Cabins in Kothrud",
    description:
      "Newly renovated 180-seat study hall with sound-insulated desks, CCTV, and power backup.",
    facilities: ["Biometric Entry", "Power Backup", "Tea/Coffee", "AC"],
    startingPrice: "₹1,800 / mo",
  },
  {
    id: "lp-3",
    libraryCode: "LIB-JAI-004",
    libraryName: "Scholars Point",
    city: "Jaipur",
    subdomain: "scholarspoint.lmsplatform.com",
    status: "Pending Review",
    submittedDate: "10 Nov 2026",
    headline: "Focused Preparation Hub on Tonk Road",
    description:
      "Affordable full-day and half-day study shifts tailored for SSC, Banking, and RAS aspirants.",
    facilities: ["RO Water", "Newspaper Desk", "Parking", "Wi-Fi"],
    startingPrice: "₹1,100 / mo",
  },
  {
    id: "lp-4",
    libraryCode: "LIB-BLR-003",
    libraryName: "Takshashila Reading Room",
    city: "Bengaluru",
    subdomain: "takshashila.lmsplatform.com",
    status: "Pending Review",
    submittedDate: "09 Nov 2026",
    headline: "Executive Study Pods in Indiranagar",
    description:
      "Designed for remote learners, CA finalists, and GATE aspirants with ergonomic seating.",
    facilities: ["Executive Pods", "Cafeteria", "24x7 Security", "Fiber Wi-Fi"],
    startingPrice: "₹2,400 / mo",
  },
  {
    id: "lp-5",
    libraryCode: "LIB-DEL-002",
    libraryName: "Metro Library Network",
    city: "Delhi",
    subdomain: "metrolib.lmsplatform.com",
    status: "Changes Requested",
    submittedDate: "05 Nov 2026",
    headline: "Multi-Branch Civil Services Study Rooms",
    description:
      "Located in Old Rajendra Nagar & Mukherjee Nagar with flexible seat booking.",
    facilities: ["Multi-Branch", "AC", "Locker"],
    startingPrice: "₹1,950 / mo",
    reviewNote: "Please upload clear interior photos without promotional text.",
  },
]

function pageStatusBadge(status: PublicLibraryPageItem["status"]) {
  if (status === "Published") {
    return (
      <Badge
        variant="secondary"
        className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      >
        Published
      </Badge>
    )
  }
  if (status === "Pending Review") {
    return (
      <Badge
        variant="secondary"
        className="bg-amber-500/15 text-amber-700 dark:text-amber-300"
      >
        Pending Review
      </Badge>
    )
  }
  if (status === "Changes Requested") {
    return <Badge variant="outline">Changes Requested</Badge>
  }
  return (
    <Badge variant="secondary" className="bg-destructive/15 text-destructive">
      Suspended
    </Badge>
  )
}

export default function LibraryPagesReviewPage() {
  const [pages, setPages] = useState<PublicLibraryPageItem[]>(
    INITIAL_LIBRARY_PAGES
  )
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedPage, setSelectedPage] =
    useState<PublicLibraryPageItem | null>(null)
  const [feedbackNote, setFeedbackNote] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return pages.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false
      if (!q) return true
      return (
        p.libraryName.toLowerCase().includes(q) ||
        p.subdomain.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      )
    })
  }, [pages, search, statusFilter])

  const counts = useMemo(
    () => ({
      pending: pages.filter((p) => p.status === "Pending Review").length,
      published: pages.filter((p) => p.status === "Published").length,
      changes: pages.filter((p) => p.status === "Changes Requested").length,
      suspended: pages.filter((p) => p.status === "Suspended").length,
    }),
    [pages]
  )

  const handleModerate = (nextStatus: PublicLibraryPageItem["status"]) => {
    if (!selectedPage) return
    if (nextStatus === "Changes Requested" && !feedbackNote.trim()) {
      toast.error(
        "Please enter a short feedback note before requesting changes."
      )
      return
    }
    setPages((prev) =>
      prev.map((p) =>
        p.id === selectedPage.id
          ? {
              ...p,
              status: nextStatus,
              reviewNote: feedbackNote.trim() || p.reviewNote,
            }
          : p
      )
    )
    toast.success(`${selectedPage.libraryName} marked as ${nextStatus}`)
    setSelectedPage(null)
    setFeedbackNote("")
  }

  return (
    <section className="container space-y-5 py-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Public Page Review
            </h1>
            <Badge
              variant="secondary"
              className="bg-amber-500/15 text-[11px] text-amber-700 dark:text-amber-300"
            >
              {counts.pending} Pending
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Moderate tenant public microsites, verify branding &amp; pricing,
            and publish subdomains.
          </p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Pending Review",
            value: counts.pending,
            icon: Clock,
            tone: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
          },
          {
            label: "Published Microsites",
            value: counts.published,
            icon: Globe,
            tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
          },
          {
            label: "Changes Requested",
            value: counts.changes,
            icon: MessageSquareWarning,
            tone: "text-primary bg-primary/10",
          },
          {
            label: "Suspended Pages",
            value: counts.suspended,
            icon: ShieldAlert,
            tone: "text-destructive bg-destructive/10",
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="border-border bg-card shadow-sm">
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`flex size-10 items-center justify-center rounded-lg ${stat.tone}`}
                >
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Queue Table */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Microsite Submissions</CardTitle>
            <CardDescription>
              Preview live copy, facilities, and pricing before publishing.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search library, city, domain..."
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending Review">Pending Review</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Changes Requested">
                  Changes Requested
                </SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Library</TableHead>
                  <TableHead>Subdomain</TableHead>
                  <TableHead>Headline</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No public pages match your filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2.5">
                          <LibraryAvatar
                            name={item.libraryName}
                            code={item.libraryCode}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {item.libraryName}
                            </p>
                            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="size-3" />
                              {item.city}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-primary">
                        {item.subdomain}
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate text-xs text-foreground">
                        {item.headline}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.submittedDate}
                      </TableCell>
                      <TableCell>{pageStatusBadge(item.status)}</TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button
                          size="sm"
                          variant={
                            item.status === "Pending Review"
                              ? "default"
                              : "outline"
                          }
                          className="h-7 gap-1.5 px-2.5 text-xs"
                          onClick={() => {
                            setSelectedPage(item)
                            setFeedbackNote(item.reviewNote ?? "")
                          }}
                        >
                          <Eye className="size-3.5" />
                          Preview
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Live Microsite Preview & Moderation Dialog */}
      <Dialog
        open={Boolean(selectedPage)}
        onOpenChange={(open) => {
          if (!open) setSelectedPage(null)
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2 text-base">
              <span>Microsite Preview — {selectedPage?.libraryName}</span>
              {selectedPage && pageStatusBadge(selectedPage.status)}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1.5 font-mono text-xs">
              <ExternalLink className="size-3" />
              https://{selectedPage?.subdomain}
            </DialogDescription>
          </DialogHeader>

          {selectedPage && (
            <div className="space-y-4">
              {/* Mock Live Hero Preview */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <LibraryLogo
                    name={selectedPage.libraryName}
                    code={selectedPage.libraryCode}
                    subtitle={`${selectedPage.city} • Verified Partner`}
                    size="md"
                  />
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Sparkles className="size-3 text-primary" />
                    From {selectedPage.startingPrice}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">
                    {selectedPage.headline}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedPage.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selectedPage.facilities.map((fac) => (
                    <Badge key={fac} variant="outline" className="text-[11px]">
                      {fac}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lp-note" className="text-xs">
                  Moderation Feedback (required if requesting changes)
                </Label>
                <Textarea
                  id="lp-note"
                  rows={2}
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  placeholder="e.g., Please update seat pricing or remove watermarked images..."
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-wrap gap-2 sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant="destructive"
                className="gap-1 text-xs"
                onClick={() => handleModerate("Suspended")}
              >
                <XCircle className="size-3.5" />
                Suspend
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-xs"
                onClick={() => handleModerate("Changes Requested")}
              >
                <MessageSquareWarning className="size-3.5" />
                Request Changes
              </Button>
            </div>
            <Button
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => handleModerate("Published")}
            >
              <CheckCircle2 className="size-3.5" />
              Approve &amp; Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
