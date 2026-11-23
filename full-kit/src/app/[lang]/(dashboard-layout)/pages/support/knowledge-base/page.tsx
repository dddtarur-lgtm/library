"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  ExternalLink,
  FileQuestion,
  HelpCircle,
  LifeBuoy,
  PlayCircle,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  Wallet,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

export default function KnowledgeBasePage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [searchQuery, setSearchQuery] = useState("")

  // Interactive onboarding checklist
  const [checklist, setChecklist] = useState([
    {
      id: "step-1",
      title: "Set Up Branch Location & QR Radius",
      desc: "Specify GPS coordinates and allowed geofence perimeter for check-in validation.",
      href: "/pages/branches/branch-details",
      completed: true,
    },
    {
      id: "step-2",
      title: "Configure Shift Hours & Grace Periods",
      desc: "Define Morning, Afternoon, Evening, and 24x7 slots with 15-minute late mark grace.",
      href: "/pages/settings-library/shifts-rules",
      completed: true,
    },
    {
      id: "step-3",
      title: "Connect Razorpay Online Gateway & UPI QR",
      desc: "Paste your API keys for instant fee receipts and automated webhook reconciliation.",
      href: "/pages/settings-library/payment-gateway",
      completed: true,
    },
    {
      id: "step-4",
      title: "Print Dynamic QR Kiosk Standee Poster",
      desc: "Generate high-resolution printable desk standee with rotating QR code for attendance.",
      href: "/pages/attendance/qr-kiosk",
      completed: true,
    },
    {
      id: "step-5",
      title: "Invite Sub-Admins & Assign Granular Permissions",
      desc: "Assign 2 sub-admins for main branch and front desk staff with masked revenue.",
      href: "/pages/staff",
      completed: false,
    },
    {
      id: "step-6",
      title: "Enroll First 10 Students & Issue Digital ID Cards",
      desc: "Add student admission, assign reserved seat, and dispatch WhatsApp welcome cards.",
      href: "/pages/plans/memberships",
      completed: false,
    },
  ])

  const completedCount = checklist.filter((c) => c.completed).length
  const progressPercent = Math.round((completedCount / checklist.length) * 100)

  const toggleChecklistStep = (id: string) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c))
    )
  }

  const articles = [
    {
      id: "art-1",
      category: "Attendance & Kiosks",
      title: "How Anti-Leak Dynamic QR & GPS Geofencing Works",
      desc: "Learn how the rotating TOTP salt prevents students from sharing screenshot photos with absent friends.",
      readTime: "3 min read",
    },
    {
      id: "art-2",
      category: "Cash & Finance",
      title: "Daily Cash Day-Book Reconciliation & Shift Handover",
      desc: "Step-by-step procedure for front desk staff to record physical currency notes before handing over duties.",
      readTime: "4 min read",
    },
    {
      id: "art-3",
      category: "Subscriptions & Grace",
      title: "Understanding the 5-Day Grace Period Policy (PRD §59)",
      desc: "How the platform allows students to study during unpaid grace periods without locking their reserved seats.",
      readTime: "2 min read",
    },
    {
      id: "art-4",
      category: "Multi-Branch Operations",
      title: "Managing Student Branch Transfers with Seat Swap",
      desc: "Approve student branch change requests and re-allocate vacant seats across locations seamlessly.",
      readTime: "5 min read",
    },
    {
      id: "art-5",
      category: "Circulation Desk",
      title: "Configuring Overdue Book Fines & Replacement Charges",
      desc: "Automatic fine calculations per day and managing student purchase requests.",
      readTime: "3 min read",
    },
  ]

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.desc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={ensureLocalizedPathname("/pages/support", lang)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Help &amp; Support
            </Link>
            <ChevronRight className="size-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-primary">Knowledge Base &amp; SOPs</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Library Operator Manual &amp; SOP Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground">
            Standard Operating Procedures, setup guides, interactive onboarding checklists, and video tutorials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={ensureLocalizedPathname("/pages/support", lang)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs font-medium hover:bg-muted/50"
          >
            ← Back to Tickets
          </Link>
        </div>
      </div>

      {/* Onboarding Checklist Widget */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                Library Setup &amp; Go-Live Checklist ({completedCount}/{checklist.length} Completed)
              </CardTitle>
              <CardDescription>
                Complete these standard operating steps to ensure seamless branch operations
              </CardDescription>
            </div>
            <span className="text-sm font-bold text-primary">{progressPercent}% Completed</span>
          </div>
          <Progress value={progressPercent} className="h-2 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {checklist.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                  item.completed
                    ? "border-emerald-500/30 bg-emerald-500/5 text-muted-foreground"
                    : "border-border/60 bg-muted/20 hover:bg-muted/30"
                }`}
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => toggleChecklistStep(item.id)}
                  className="mt-0.5"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        item.completed ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {item.title}
                    </span>
                    <Link
                      href={ensureLocalizedPathname(item.href, lang)}
                      className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                    >
                      <span>Open</span>
                      <ChevronRight className="size-3" />
                    </Link>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search operator guides, SOPs, FAQs..."
          className="pl-9 h-9 text-xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Operator Guides & Articles Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredArticles.map((art) => (
          <Card key={art.id} className="border-border/60 bg-card/80 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                <Badge variant="outline" className="text-[10px]">
                  {art.category}
                </Badge>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="size-3" />
                  {art.readTime}
                </span>
              </div>
              <CardTitle className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">
                {art.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground line-clamp-3">
                {art.desc}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary cursor-pointer hover:underline">
                <span>Read Full SOP Guide</span>
                <ChevronRight className="size-3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

