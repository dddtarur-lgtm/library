"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Flame,
  Globe,
  Image as ImageIcon,
  Inbox,
  Languages,
  Layout,
  Layers,
  MessageCircle,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Plus,
  Radio,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Users,
  Wifi,
  X,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import { initialNotifications, type NotificationBroadcast } from "@/data/library-management-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"
import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

// Notice categories matching screenshot 4
interface CategoryOption {
  id: string
  label: string
  icon: string
  badgeText: string
  gradient: string
}

const NOTICE_CATEGORIES: CategoryOption[] = [
  {
    id: "festival",
    label: "Festival",
    icon: "🪔",
    badgeText: "FESTIVE HOLIDAY",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
  },
  {
    id: "urgent",
    label: "Urgent",
    icon: "🚨",
    badgeText: "URGENT ALERT",
    gradient: "from-red-600 via-rose-500 to-orange-500",
  },
  {
    id: "notice",
    label: "Notice",
    icon: "📢",
    badgeText: "LIBRARY NOTICE",
    gradient: "from-blue-600 via-indigo-500 to-cyan-500",
  },
  {
    id: "fee_alert",
    label: "Fee Alert",
    icon: "💳",
    badgeText: "MEMBERSHIP DUE",
    gradient: "from-emerald-600 via-teal-500 to-sky-500",
  },
  {
    id: "rules",
    label: "Rules",
    icon: "📜",
    badgeText: "CAMPUS POLICY",
    gradient: "from-purple-600 via-violet-500 to-indigo-500",
  },
]

export default function NotificationsHubPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  // Active top navigation tab (Sent messages, Scheduled, Saved templates, Automatic alerts)
  const [activeTab, setActiveTab] = useState<"sent" | "scheduled" | "templates" | "alerts">("sent")

  // Broadcasts list (matching Image 3)
  const [broadcastList, setBroadcastList] = useState<any[]>([
    {
      id: "bc-1",
      title: "Diwali Holiday Schedule",
      subtitle: "Main hall closed 01 Nov • 24×7 cabins open",
      displayType: "Picture + Text Popup",
      targetAudience: "All Students (295)",
      sentAt: "28 Oct, 4:00 PM",
      seenRate: "88%",
      seenCount: 260,
      totalCount: 295,
      category: "festival",
    },
    {
      id: "bc-2",
      title: "UPSC Mock Test Series Announced",
      subtitle: "Sunday 10 AM in Discussion Room",
      displayType: "Text Only Card",
      targetAudience: "Studying (275)",
      sentAt: "26 Oct, 11:30 AM",
      seenRate: "79%",
      seenCount: 217,
      totalCount: 275,
      category: "notice",
    },
    {
      id: "bc-3",
      title: "Overdue Plan Renewal Notice",
      subtitle: "Settle dues before 05 Nov to keep reserved seat",
      displayType: "Picture + Text Popup",
      targetAudience: "Fee Due Students (20)",
      sentAt: "24 Oct, 09:15 AM",
      seenRate: "95%",
      seenCount: 19,
      totalCount: 20,
      category: "fee_alert",
    },
    {
      id: "bc-4",
      title: "Library Silence & Mobile Headphone Rules",
      subtitle: "Strict quiet zone in Main Reading Hall A",
      displayType: "Text Only Card",
      targetAudience: "All Students (295)",
      sentAt: "20 Oct, 03:00 PM",
      seenRate: "91%",
      seenCount: 268,
      totalCount: 295,
      category: "rules",
    },
  ])

  // Scheduled broadcasts
  const [scheduledList, setScheduledList] = useState([
    {
      id: "sch-1",
      title: "Guru Nanak Jayanti Library Timings",
      subtitle: "Open 08:00 AM to 08:00 PM on Friday",
      scheduledFor: "15 Nov 2026, 08:00 AM",
      target: "All Students (295)",
      channels: "In-App + WhatsApp",
    },
    {
      id: "sch-2",
      title: "Monthly Locker Audit & Key Re-Verification",
      subtitle: "Keep personal locks verified by 20th",
      scheduledFor: "18 Nov 2026, 10:00 AM",
      target: "Locker Allocated (42)",
      channels: "In-App + Push",
    },
  ])

  // Templates list
  const [templatesList, setTemplatesList] = useState([
    {
      id: "tpl-1",
      name: "Festival Closure Notice",
      category: "festival",
      headline: "Library Closed for Festive Holiday",
      description: "Main reading hall will remain closed. 24x7 study cabins remain accessible for active reserved pass holders.",
    },
    {
      id: "tpl-2",
      name: "Fee Due & Plan Expiry Alert",
      category: "fee_alert",
      headline: "Your Library Plan Expires in 3 Days",
      description: "Renew your desk subscription at the front counter or online UPI to prevent seat release.",
    },
    {
      id: "tpl-3",
      name: "Mock Exam & Test Series",
      category: "notice",
      headline: "Special Weekend Mock Test Simulation",
      description: "Full GS simulation exam in Discussion Cabin. Registration is free for all active plan members.",
    },
    {
      id: "tpl-4",
      name: "Silence & Code of Conduct",
      category: "rules",
      headline: "Quiet Zone & Mobile Phone Courtesy",
      description: "Please attend phone calls in the cafeteria balcony. Keep phones strictly on silent in study halls.",
    },
  ])

  // Automated trigger rules
  const [triggersList, setTriggersList] = useState([
    {
      id: "trig-1",
      name: "Plan Expiry Warning",
      event: "3 days before student due date",
      channel: "WhatsApp & In-App",
      status: true,
    },
    {
      id: "trig-2",
      name: "Daily Turnstile Checkout Reminder",
      event: "If timer is active after 11:00 PM",
      channel: "Push Alert",
      status: true,
    },
    {
      id: "trig-3",
      name: "Book Overdue Fine Notice",
      event: "On the 1st overdue day past lending deadline",
      channel: "WhatsApp",
      status: true,
    },
    {
      id: "trig-4",
      name: "Welcome Onboarding Message",
      event: "Immediately on student admission approval",
      channel: "WhatsApp + In-App",
      status: true,
    },
  ])

  // ================= COMPOSE DIALOG MODAL STATE =================
  const [composeOpen, setComposeOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<number>(1)

  // Step 1: Write Notice
  const [noticeCategory, setNoticeCategory] = useState<string>("festival")
  const [language, setLanguage] = useState<"en" | "hi" | "gu">("en")
  const [headline, setHeadline] = useState<string>("Library Closed on Diwali (01 Nov)")
  const [description, setDescription] = useState<string>(
    "Main reading hall will remain closed on 01 Nov for Laxmi Pujan. 24×7 study cabins remain accessible for reserved pass holders."
  )

  // Step 2: Popup Style
  const [popupStyle, setPopupStyle] = useState<"picture_text" | "text_only" | "fullscreen">("picture_text")
  const [ctaLabel, setCtaLabel] = useState<string>("Got It")
  const [ctaRoute, setCtaRoute] = useState<string>("/pages/plans")
  const [bannerImageUrl, setBannerImageUrl] = useState<string>(
    "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80"
  )

  // Step 3: Audience
  const [targetAudience, setTargetAudience] = useState<string>("all_295")
  const [targetBranch, setTargetBranch] = useState<string>("all")
  const [targetGender, setTargetGender] = useState<string>("all")

  // Step 4: Schedule & Channels
  const [channelInApp, setChannelInApp] = useState<boolean>(true)
  const [channelPush, setChannelPush] = useState<boolean>(true)
  const [channelWhatsApp, setChannelWhatsApp] = useState<boolean>(true)
  const [sendTiming, setSendTiming] = useState<"now" | "later">("now")
  const [scheduleDateTime, setScheduleDateTime] = useState<string>("2026-11-05T09:00")
  const [respectQuietHours, setRespectQuietHours] = useState<boolean>(true)

  // Preview device channel switcher tab: 'in-app' | 'push' | 'whatsapp'
  const [previewChannel, setPreviewChannel] = useState<"in-app" | "push" | "whatsapp">("in-app")

  const selectedCategoryObj =
    NOTICE_CATEGORIES.find((c) => c.id === noticeCategory) || NOTICE_CATEGORIES[0]

  const openComposeModalWithData = (tpl?: {
    category: string
    headline: string
    description: string
  }) => {
    if (tpl) {
      setNoticeCategory(tpl.category)
      setHeadline(tpl.headline)
      setDescription(tpl.description)
    }
    setCurrentStep(1)
    setComposeOpen(true)
  }

  const handleSendBroadcast = () => {
    if (!headline.trim()) {
      toast.error("Please enter a headline for the broadcast.")
      return
    }

    const newBroadcast = {
      id: `bc-${Date.now()}`,
      title: headline,
      subtitle: description.slice(0, 50) + "...",
      displayType: popupStyle === "text_only" ? "Text Only Card" : "Picture + Text Popup",
      targetAudience:
        targetAudience === "all_295"
          ? "All Students (295)"
          : targetAudience === "fee_due"
          ? "Fee Due Students (20)"
          : "Studying (275)",
      sentAt: "Just now",
      seenRate: "1%",
      seenCount: 2,
      totalCount: 295,
      category: noticeCategory,
    }

    setBroadcastList([newBroadcast, ...broadcastList])
    toast.success("Broadcast dispatched successfully!", {
      description: `Dispatched to 295 students via ${[
        channelInApp && "In-App",
        channelPush && "Push",
        channelWhatsApp && "WhatsApp",
      ]
        .filter(Boolean)
        .join(", ")}.`,
    })
    setComposeOpen(false)
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 space-y-4 p-4 sm:p-6">
      {/* 1. Header (Matching Screenshot 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Messages &amp; Notifications
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Announcements, screen popups, and automated student reminders • Kothrud Campus (HQ)
          </p>
        </div>

        {/* Action Button: Send a message (Opens Compose Dialog) */}
        <Button
          size="sm"
          onClick={() => openComposeModalWithData()}
          className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-semibold cursor-pointer shadow-xs"
        >
          <Send className="size-3.5" />
          <span>Send a message</span>
        </Button>
      </div>

      {/* 2. Metrics Cards: 4 Cards (Matching Screenshot 3) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: SENT (THIS MONTH) */}
        <Card className="border border-border bg-card rounded-lg shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sent (This Month)
              </span>
              <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Send className="size-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              18
            </div>
            <p className="text-[11px] text-muted-foreground">
              4 festive popups • 14 push alerts
            </p>
          </CardContent>
        </Card>

        {/* Card 2: AVERAGE SEEN RATE */}
        <Card className="border border-border bg-card rounded-lg shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Average Seen Rate
              </span>
              <div className="size-6 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCheck className="size-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-500 font-mono">
              89.4%
            </div>
            <p className="text-[11px] text-emerald-500 font-medium">
              Highest read via In-App modal
            </p>
          </CardContent>
        </Card>

        {/* Card 3: ACTIVE STUDENTS */}
        <Card className="border border-border bg-card rounded-lg shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Students
              </span>
              <div className="size-6 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Users className="size-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              295
            </div>
            <p className="text-[11px] text-muted-foreground">
              100% reachable on WhatsApp &amp; App
            </p>
          </CardContent>
        </Card>

        {/* Card 4: FAILED DELIVERIES */}
        <Card className="border border-border bg-card rounded-lg shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Failed Deliveries
              </span>
              <div className="size-6 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <ShieldCheck className="size-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              0
            </div>
            <p className="text-[11px] text-emerald-500 font-medium">
              100% gateway success
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Navigation Tabs Bar (Matching Screenshot 3) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg border border-border bg-muted/40 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("sent")}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-semibold text-xs transition-all cursor-pointer",
            activeTab === "sent"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Send className="size-3.5" />
          <span>Sent messages</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("scheduled")}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-semibold text-xs transition-all cursor-pointer",
            activeTab === "scheduled"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Clock className="size-3.5" />
          <span>Scheduled ({scheduledList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("templates")}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-semibold text-xs transition-all cursor-pointer",
            activeTab === "templates"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="size-3.5" />
          <span>Saved templates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("alerts")}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-semibold text-xs transition-all cursor-pointer",
            activeTab === "alerts"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bell className="size-3.5" />
          <span>Automatic alerts</span>
        </button>
      </div>

      {/* 4. Tab 1: Sent Messages Table (Matching Screenshot 3) */}
      {activeTab === "sent" && (
        <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase py-3.5">
                    Notice Title
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase py-3.5">
                    Display Type
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase py-3.5">
                    Target Audience
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase py-3.5">
                    Sent At
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase py-3.5">
                    Seen Rate
                  </TableHead>
                  <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase pr-4 py-3.5">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {broadcastList.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-b border-border/80 hover:bg-muted/30 transition-colors"
                  >
                    {/* Notice Title + Subtitle */}
                    <TableCell className="py-3">
                      <div className="font-bold text-xs text-foreground">{item.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {item.subtitle}
                      </div>
                    </TableCell>

                    {/* Display Type Badge */}
                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className="text-[11px] font-semibold border-primary/20 bg-primary/5 text-primary"
                      >
                        {item.displayType}
                      </Badge>
                    </TableCell>

                    {/* Target Audience */}
                    <TableCell className="py-3 text-xs text-foreground font-medium">
                      {item.targetAudience}
                    </TableCell>

                    {/* Sent At */}
                    <TableCell className="py-3 text-xs text-muted-foreground font-mono">
                      {item.sentAt}
                    </TableCell>

                    {/* Seen Rate */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold font-mono">
                        <Check className="size-3.5" />
                        <span>
                          {item.seenRate} ({item.seenCount} seen)
                        </span>
                      </div>
                    </TableCell>

                    {/* Actions Links */}
                    <TableCell className="py-3 text-right pr-4">
                      <div className="flex items-center justify-end gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            openComposeModalWithData({
                              category: item.category,
                              headline: item.title,
                              description: item.subtitle,
                            })
                          }}
                          className="font-semibold text-primary hover:underline cursor-pointer"
                        >
                          View &amp; Clone
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            toast.info(`Seen Report: ${item.seenCount} of ${item.totalCount} students acknowledged.`)
                          }}
                          className="text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          View report
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 5. Tab 2: Scheduled Messages */}
      {activeTab === "scheduled" && (
        <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-sm font-bold text-foreground">
              Scheduled Notification Queue
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              These broadcasts will be dispatched automatically at their scheduled timestamps.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-b border-border">
                  <TableHead className="text-xs font-bold text-muted-foreground">Title</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">Scheduled For</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">Target Audience</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">Channels</TableHead>
                  <TableHead className="text-right text-xs font-bold text-muted-foreground pr-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledList.map((sch) => (
                  <TableRow key={sch.id} className="border-b border-border/80 hover:bg-muted/30">
                    <TableCell>
                      <div className="font-bold text-xs text-foreground">{sch.title}</div>
                      <div className="text-[11px] text-muted-foreground">{sch.subtitle}</div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-amber-500 font-semibold">
                      {sch.scheduledFor}
                    </TableCell>
                    <TableCell className="text-xs text-foreground">{sch.target}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] border-border">
                        {sch.channels}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setScheduledList(scheduledList.filter((s) => s.id !== sch.id))
                          toast.success("Scheduled message cancelled.")
                        }}
                        className="h-7 text-xs text-destructive hover:bg-destructive/10"
                      >
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 6. Tab 3: Saved Templates */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templatesList.map((tpl) => (
            <Card key={tpl.id} className="border border-border bg-card rounded-lg shadow-xs flex flex-col justify-between">
              <CardHeader className="p-4 pb-2 border-b border-border/80">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] border-primary/20 text-primary bg-primary/5 uppercase">
                    {tpl.category.replace("_", " ")}
                  </Badge>
                  <span className="text-xs font-semibold text-muted-foreground">{tpl.name}</span>
                </div>
                <CardTitle className="text-sm font-bold text-foreground mt-1">{tpl.headline}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">{tpl.description}</p>
                <div className="pt-2 flex items-center justify-end">
                  <Button
                    size="sm"
                    onClick={() => openComposeModalWithData(tpl)}
                    className="h-7 text-xs gap-1.5 bg-primary text-primary-foreground rounded-md font-semibold cursor-pointer"
                  >
                    <Copy className="size-3" />
                    <span>Use Template</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 7. Tab 4: Automatic Alerts */}
      {activeTab === "alerts" && (
        <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-sm font-bold text-foreground">
              Automated Student Trigger Rules
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              System events that automatically dispatch instant alerts to students.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-b border-border">
                  <TableHead className="text-xs font-bold text-muted-foreground">Trigger Rule</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">Event Condition</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">Delivery Channels</TableHead>
                  <TableHead className="text-right text-xs font-bold text-muted-foreground pr-4">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {triggersList.map((trig) => (
                  <TableRow key={trig.id} className="border-b border-border/80 hover:bg-muted/30">
                    <TableCell className="font-bold text-xs text-foreground">{trig.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{trig.event}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] border-border">
                        {trig.channel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Switch
                        checked={trig.status}
                        onCheckedChange={(val) => {
                          setTriggersList(
                            triggersList.map((t) => (t.id === trig.id ? { ...t, status: val } : t))
                          )
                          toast.success(`Trigger "${trig.name}" ${val ? "enabled" : "disabled"}.`)
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 8. COMPOSE & BROADCAST NOTIFICATION DIALOG MODAL (Matching Screenshot 4) */}
      {/* ========================================================================= */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-y-auto bg-card border-border rounded-lg shadow-2xl p-0 gap-0">
          {/* Modal Header (Matching Screenshot 4) */}
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3 bg-card sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <Send className="size-4.5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                  Compose &amp; Broadcast Notification
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Instant dispatch to 295 library members across App Modal, Push &amp; WhatsApp
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setComposeOpen(false)}
              className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Stepper Bar (Matching Screenshot 4: 1 Write Notice > 2 Popup Style > 3 Audience > 4 Schedule > 5 Send & Confirm) */}
          <div className="px-4 sm:px-6 py-2.5 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
              {/* Step 1 */}
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all",
                  currentStep === 1
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="size-4 rounded-full bg-white/20 text-current flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Write Notice</span>
              </button>

              <span className="text-muted-foreground/60">&gt;</span>

              {/* Step 2 */}
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all",
                  currentStep === 2
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="size-4 rounded-full bg-white/20 text-current flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Popup Style</span>
              </button>

              <span className="text-muted-foreground/60">&gt;</span>

              {/* Step 3 */}
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all",
                  currentStep === 3
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="size-4 rounded-full bg-white/20 text-current flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>Audience</span>
              </button>

              <span className="text-muted-foreground/60">&gt;</span>

              {/* Step 4 */}
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all",
                  currentStep === 4
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="size-4 rounded-full bg-white/20 text-current flex items-center justify-center text-[10px]">
                  4
                </span>
                <span>Schedule</span>
              </button>

              <span className="text-muted-foreground/60">&gt;</span>

              {/* Step 5 */}
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all",
                  currentStep === 5
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="size-4 rounded-full bg-white/20 text-current flex items-center justify-center text-[10px]">
                  5
                </span>
                <span>Send &amp; Confirm</span>
              </button>
            </div>

            <div className="text-xs font-semibold text-muted-foreground">
              Step {currentStep} of 5
            </div>
          </div>

          {/* Modal Body: Split Screen (Left: Form, Right: Live Interactive Device Preview) */}
          <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Step Form (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* STEP 1: WRITE NOTICE (Matching Screenshot 4) */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  {/* Notice Category Cards */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Notice Category
                    </Label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {NOTICE_CATEGORIES.map((cat) => {
                        const isSelected = noticeCategory === cat.id
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setNoticeCategory(cat.id)}
                            className={cn(
                              "p-2.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1",
                              isSelected
                                ? "border-primary bg-primary/10 text-primary ring-1 ring-primary font-bold shadow-xs"
                                : "border-border bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <span className="text-lg">{cat.icon}</span>
                            <span className="text-xs">{cat.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Language Pills */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Language</Label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLanguage("en")}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
                          language === "en"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted text-muted-foreground hover:text-foreground border border-border"
                        )}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage("hi")}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
                          language === "hi"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted text-muted-foreground hover:text-foreground border border-border"
                        )}
                      >
                        Hindi (हिन्दी)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage("gu")}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
                          language === "gu"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted text-muted-foreground hover:text-foreground border border-border"
                        )}
                      >
                        Gujarati (ગુજરાતી)
                      </button>
                    </div>
                  </div>

                  {/* Headline / Title with Char Counter */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <Label className="font-bold text-foreground">Headline / Title *</Label>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {headline.length}/80
                      </span>
                    </div>
                    <Input
                      maxLength={80}
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Library Closed on Diwali (01 Nov)"
                      className="h-9 text-xs bg-background border-border rounded-md font-semibold"
                    />
                  </div>

                  {/* Message Description with Char Counter */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <Label className="font-bold text-foreground">Message Description *</Label>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {description.length}/300
                      </span>
                    </div>
                    <Textarea
                      maxLength={300}
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter detailed notice for students..."
                      className="text-xs bg-background border-border rounded-md resize-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: POPUP STYLE & CTA */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">
                      Popup Presentation Format
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div
                        onClick={() => setPopupStyle("picture_text")}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer text-center space-y-1 transition-all",
                          popupStyle === "picture_text"
                            ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary"
                            : "border-border hover:bg-muted/40 text-foreground"
                        )}
                      >
                        <div className="text-xs">Picture + Text Popup</div>
                        <div className="text-[10px] text-muted-foreground font-normal">
                          Gradient Banner + Headline
                        </div>
                      </div>

                      <div
                        onClick={() => setPopupStyle("text_only")}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer text-center space-y-1 transition-all",
                          popupStyle === "text_only"
                            ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary"
                            : "border-border hover:bg-muted/40 text-foreground"
                        )}
                      >
                        <div className="text-xs">Text Only Card</div>
                        <div className="text-[10px] text-muted-foreground font-normal">
                          Fast load, minimal card
                        </div>
                      </div>

                      <div
                        onClick={() => setPopupStyle("fullscreen")}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer text-center space-y-1 transition-all",
                          popupStyle === "fullscreen"
                            ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary"
                            : "border-border hover:bg-muted/40 text-foreground"
                        )}
                      >
                        <div className="text-xs">Full Screen Modal</div>
                        <div className="text-[10px] text-muted-foreground font-normal">
                          Critical takeover alert
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-foreground">Action Button Label</Label>
                      <Input
                        value={ctaLabel}
                        onChange={(e) => setCtaLabel(e.target.value)}
                        placeholder="e.g. Got It, Acknowledge, Renew"
                        className="h-9 text-xs bg-background border-border rounded-md"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-foreground">Action Redirect Route</Label>
                      <Input
                        value={ctaRoute}
                        onChange={(e) => setCtaRoute(e.target.value)}
                        placeholder="/pages/plans or /pages/seats"
                        className="h-9 text-xs bg-background border-border rounded-md font-mono"
                      />
                    </div>
                  </div>

                  {popupStyle !== "text_only" && (
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-foreground">Banner Image URL</Label>
                      <Input
                        value={bannerImageUrl}
                        onChange={(e) => setBannerImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="h-9 text-xs bg-background border-border rounded-md font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: AUDIENCE & BRANCHES */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Target Audience</Label>
                    <Select value={targetAudience} onValueChange={setTargetAudience}>
                      <SelectTrigger className="h-9 text-xs bg-background border-border rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="all_295" className="text-xs">
                          All Students (295 active library members)
                        </SelectItem>
                        <SelectItem value="studying" className="text-xs">
                          Currently Studying on Seats (275)
                        </SelectItem>
                        <SelectItem value="fee_due" className="text-xs">
                          Fee Due / Expiring Members (20)
                        </SelectItem>
                        <SelectItem value="upsc" className="text-xs">
                          UPSC &amp; Civil Services Aspirants (120)
                        </SelectItem>
                        <SelectItem value="girls" className="text-xs">
                          Reserved Cabin Pass Holders (65)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground">Campus Branch Filter</Label>
                    <Select value={targetBranch} onValueChange={setTargetBranch}>
                      <SelectTrigger className="h-9 text-xs bg-background border-border rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="all" className="text-xs">
                          All Branches (HQ + Satellite Campuses)
                        </SelectItem>
                        <SelectItem value="kothrud" className="text-xs">
                          Main Branch - Central Library (Kothrud HQ)
                        </SelectItem>
                        <SelectItem value="fc_road" className="text-xs">
                          Satellite Campus - FC Road Branch
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                    <div className="text-xs font-bold text-foreground">Estimated Dispatch Reach</div>
                    <div className="text-sm font-bold text-primary font-mono">
                      {targetAudience === "all_295"
                        ? "295 Students Reached"
                        : targetAudience === "fee_due"
                        ? "20 Students Reached"
                        : "275 Students Reached"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Targeting criteria automatically verified against active RFID and admission records.
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: CHANNELS & SCHEDULE */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Dispatch Channels</Label>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-card cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <Smartphone className="size-4 text-primary" />
                          <div>
                            <div className="text-xs font-bold text-foreground">In-App Modal Popup</div>
                            <div className="text-[11px] text-muted-foreground">
                              Appears immediately when student opens the library portal or app.
                            </div>
                          </div>
                        </div>
                        <Checkbox
                          checked={channelInApp}
                          onCheckedChange={(c) => setChannelInApp(Boolean(c))}
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-card cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <Bell className="size-4 text-amber-500" />
                          <div>
                            <div className="text-xs font-bold text-foreground">Mobile Push Notification</div>
                            <div className="text-[11px] text-muted-foreground">
                              Instant lock-screen alert delivered via Firebase Cloud Messaging.
                            </div>
                          </div>
                        </div>
                        <Checkbox
                          checked={channelPush}
                          onCheckedChange={(c) => setChannelPush(Boolean(c))}
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 rounded-lg border border-border bg-card cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <MessageCircle className="size-4 text-emerald-500" />
                          <div>
                            <div className="text-xs font-bold text-foreground">WhatsApp Broadcast</div>
                            <div className="text-[11px] text-muted-foreground">
                              Official Meta Business API template sent to registered student WhatsApp.
                            </div>
                          </div>
                        </div>
                        <Checkbox
                          checked={channelWhatsApp}
                          onCheckedChange={(c) => setChannelWhatsApp(Boolean(c))}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Dispatch Timing</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSendTiming("now")}
                        className={cn(
                          "p-2.5 rounded-lg border text-xs font-semibold cursor-pointer text-center",
                          sendTiming === "now"
                            ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        ⚡ Send Immediately
                      </button>
                      <button
                        type="button"
                        onClick={() => setSendTiming("later")}
                        className={cn(
                          "p-2.5 rounded-lg border text-xs font-semibold cursor-pointer text-center",
                          sendTiming === "later"
                            ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        📅 Schedule for Later
                      </button>
                    </div>

                    {sendTiming === "later" && (
                      <div className="pt-1">
                        <Input
                          type="datetime-local"
                          value={scheduleDateTime}
                          onChange={(e) => setScheduleDateTime(e.target.value)}
                          className="h-9 text-xs bg-background border-border rounded-md font-mono"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-foreground">Enforce Quiet Hours</div>
                      <div className="text-[11px] text-muted-foreground">
                        Delay push/WhatsApp alerts until 07:00 AM if created after 10:00 PM.
                      </div>
                    </div>
                    <Switch
                      checked={respectQuietHours}
                      onCheckedChange={setRespectQuietHours}
                    />
                  </div>
                </div>
              )}

              {/* STEP 5: SEND & CONFIRM */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <CheckCircle2 className="size-4" />
                      Ready to Broadcast
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Notice Title:</span>
                        <div className="font-bold text-foreground">{headline}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <div className="font-bold text-foreground">
                          {selectedCategoryObj.icon} {selectedCategoryObj.label}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Recipients:</span>
                        <div className="font-bold text-foreground font-mono">295 Students</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Channels:</span>
                        <div className="font-bold text-emerald-500">
                          {[
                            channelInApp && "In-App",
                            channelPush && "Push",
                            channelWhatsApp && "WhatsApp",
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Clicking &quot;Send Broadcast Now&quot; will immediately dispatch this announcement to students across their devices.
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Live Interactive Device Preview (5 cols) (Matching Screenshot 4) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              {/* Channel Switcher Tabs above phone (Matching Screenshot 4) */}
              <div className="flex items-center gap-1.5 p-1 rounded-md bg-muted/60 border border-border mb-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewChannel("in-app")}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all",
                    previewChannel === "in-app"
                      ? "bg-card text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>📱 In-App</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewChannel("push")}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all",
                    previewChannel === "push"
                      ? "bg-card text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>🔔 Push</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewChannel("whatsapp")}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all",
                    previewChannel === "whatsapp"
                      ? "bg-card text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>💬 WhatsApp</span>
                </button>
              </div>

              {/* Realistic Smartphone Mockup Frame (Matching Screenshot 4) */}
              <div className="w-[280px] sm:w-[310px] h-[480px] rounded-[36px] border-4 border-slate-700 bg-black shadow-2xl p-3 flex flex-col justify-between relative overflow-hidden select-none">
                {/* Dynamic Island / Bezel notch */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full z-30" />

                {/* Status Bar */}
                <div className="pt-2 px-3 flex items-center justify-between text-[10px] text-slate-300 font-mono z-20">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <Wifi className="size-2.5" />
                    <span className="text-[9px]">5G</span>
                    <span className="text-[9px]">🔋</span>
                  </div>
                </div>

                {/* Device Screen Body */}
                <div className="flex-1 flex flex-col justify-center py-2 px-1 relative z-10 overflow-hidden">
                  {/* PREVIEW VARIANT 1: IN-APP MODAL (Matching Screenshot 4) */}
                  {previewChannel === "in-app" && (
                    <div className="w-full rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col text-white transition-all">
                      {/* Gradient Header Banner matching Image 4 */}
                      <div
                        className={cn(
                          "p-3.5 pb-5 bg-gradient-to-r relative",
                          selectedCategoryObj.gradient
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black tracking-wider uppercase bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full text-white">
                            {selectedCategoryObj.badgeText}
                          </span>
                          <span className="size-5 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/80 text-[10px]">
                            ✕
                          </span>
                        </div>
                        <div className="text-xl mt-2">{selectedCategoryObj.icon}</div>
                      </div>

                      {/* Modal Content */}
                      <div className="p-3.5 space-y-2 bg-slate-900">
                        <div className="font-bold text-xs text-white leading-tight">
                          {headline || "Notice Headline"}
                        </div>
                        <p className="text-[10px] text-slate-300 leading-relaxed line-clamp-4">
                          {description || "Notice description goes here..."}
                        </p>

                        <button
                          type="button"
                          className="w-full mt-2 py-1.5 px-3 rounded-lg bg-primary text-primary-foreground font-semibold text-[11px] text-center shadow-xs"
                        >
                          {ctaLabel || "Got It"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PREVIEW VARIANT 2: LOCKSCREEN PUSH BANNER */}
                  {previewChannel === "push" && (
                    <div className="space-y-3 px-1">
                      <div className="text-center py-4 space-y-0.5">
                        <div className="text-3xl font-extralight text-white font-mono">09:41</div>
                        <div className="text-[10px] text-slate-400">Wednesday, 04 November</div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white backdrop-blur-md shadow-lg space-y-1">
                        <div className="flex items-center justify-between text-[9px] text-slate-400">
                          <div className="flex items-center gap-1">
                            <span className="size-3.5 rounded bg-primary text-[8px] text-white flex items-center justify-center font-bold">
                              L
                            </span>
                            <span className="font-semibold text-slate-300">SHELFSPACE</span>
                          </div>
                          <span>now</span>
                        </div>
                        <div className="text-[11px] font-bold text-white leading-tight">
                          {headline || "Notice Headline"}
                        </div>
                        <div className="text-[10px] text-slate-300 leading-snug line-clamp-2">
                          {description || "Notice description..."}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PREVIEW VARIANT 3: WHATSAPP CHAT BUBBLE */}
                  {previewChannel === "whatsapp" && (
                    <div className="space-y-2 px-1">
                      <div className="p-2.5 rounded-xl bg-[#005c4b] text-white text-xs shadow-md space-y-1">
                        <div className="text-[9px] font-bold text-[#25d366] uppercase tracking-wide">
                          {selectedCategoryObj.badgeText}
                        </div>
                        <div className="text-[11px] font-bold text-white">
                          {headline || "Notice Headline"}
                        </div>
                        <div className="text-[10px] text-slate-200 leading-relaxed">
                          {description || "Notice description..."}
                        </div>
                        <div className="text-right text-[8px] text-slate-300 font-mono pt-1">
                          09:41 AM ✓✓
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          className="py-1 rounded-md bg-[#202c33] text-center text-[10px] text-[#00a884] font-semibold border border-[#374248]"
                        >
                          {ctaLabel || "Got It"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Home Indicator bar */}
                <div className="w-24 h-1 bg-slate-600 rounded-full mx-auto mb-1 z-20" />
              </div>
            </div>
          </div>

          {/* Modal Footer (Matching Screenshot 4) */}
          <div className="p-4 sm:p-5 border-t border-border flex items-center justify-between gap-3 bg-card sticky bottom-0 z-20">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setComposeOpen(false)}
              className="h-8 text-xs border-border rounded-md"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                  className="h-8 text-xs border-border rounded-md"
                >
                  &larr; Back
                </Button>
              )}

              {currentStep < 5 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
                  className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-semibold cursor-pointer shadow-xs"
                >
                  <span>Next: Step {currentStep + 1} &rarr;</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSendBroadcast}
                  className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-semibold cursor-pointer shadow-xs gap-1.5"
                >
                  <Send className="size-3.5" />
                  <span>Send Broadcast Now</span>
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
