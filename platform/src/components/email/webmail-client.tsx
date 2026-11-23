"use client"

import { useState } from "react"
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCode,
  FileText,
  Forward,
  Inbox,
  Mail,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  MoreVertical,
  Paperclip,
  PenSquare,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Reply,
  Search,
  Send,
  Sparkles,
  Star,
  Tag,
  Trash2,
  UserCheck,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  DropdownMenuSeparator,
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
import { Textarea } from "@/components/ui/textarea"

export interface EmailItem {
  id: string
  senderName: string
  senderEmail: string
  senderAvatar?: string
  senderInitials: string
  avatarColor: string
  date: string
  timestamp: string
  subject: string
  snippet: string
  bodyHtml?: string
  bodyText: string
  isStarred: boolean
  isUnread: boolean
  folder: "inbox" | "starred" | "sent" | "drafts" | "archived" | "spam" | "trash"
  category: "all" | "unread" | "social"
  label?: "Personal" | "Work" | "Students" | "Receipts"
  attachments?: { name: string; size: string; type: string }[]
}

export interface EmailTemplate {
  id: string
  title: string
  trigger: string
  category: "Billing" | "Onboarding" | "Alerts" | "Facilities"
  categoryColor: string
  subject: string
  body: string
  tags: string[]
  isStarred?: boolean
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: "tpl-1",
    title: "Fee Payment Receipt (PDF Attached)",
    trigger: "Triggered on successful UPI/Cash collection",
    category: "Billing",
    categoryColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    subject: "Payment Receipt #REC-2026-{{receipt_no}} - Apex Study Hub & Library",
    body: `Dear {{student_name}},

Thank you for choosing Apex Study Hub & Library!

We have successfully received your payment of ₹{{amount}} for {{plan_name}}.
• Student ID: {{student_code}}
• Allocated Desk: {{seat_no}} ({{shift}})
• Validity: {{start_date}} to {{expiry_date}}
• Payment Mode: UPI / Cash (Receipt #REC-2026-{{receipt_no}})

An official GST tax invoice and payment acknowledgment PDF is attached with this email.

Warm regards,
Accounts Desk
Apex Study Hub & Library`,
    tags: ["{{student_name}}", "{{amount}}", "{{plan_name}}", "{{receipt_no}}", "{{seat_no}}", "{{expiry_date}}"],
    isStarred: true,
  },
  {
    id: "tpl-2",
    title: "Membership Expiration Warning (3 Days Left)",
    trigger: "Sent 3 days before student plan expires",
    category: "Alerts",
    categoryColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    subject: "Action Required: Your Library Plan Expires in 3 Days - {{student_name}}",
    body: `Dear {{student_name}},

This is a friendly reminder that your {{plan_name}} for Desk {{seat_no}} will expire on {{expiry_date}}.

To retain your assigned desk and prevent locker release, please renew your subscription before the due date.

Renew online or at the reception desk:
• UPI Payment: apexstudyhub@upi
• Desk: Reception Counter (8 AM - 10 PM)

Feel free to reply to this email if you need a shift or locker adjustment.

Warm regards,
Apex Study Hub Team`,
    tags: ["{{student_name}}", "{{plan_name}}", "{{seat_no}}", "{{expiry_date}}"],
    isStarred: true,
  },
  {
    id: "tpl-3",
    title: "Welcome Credentials & Turnstile Access",
    trigger: "Sent when new student registration is approved",
    category: "Onboarding",
    categoryColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    subject: "Welcome to Apex Study Hub - Your Student ID & Gate Pass",
    body: `Dear {{student_name}},

Welcome to Apex Study Hub & Digital Library!

Here are your registration details:
• Student Code: {{student_code}}
• Branch: Main Campus, FC Road
• Assigned Desk: {{seat_no}} ({{shift}})
• High-Speed Wi-Fi SSID: Apex_HighSpeed_5G (Password: ApexStudy2026)

Gate QR Check-In:
You can scan your digital ID from the student portal at the turnstile gate for automatic attendance tracking.

If you have any questions, our librarian desk is always here to assist.

Happy studying!
The Apex Management Team`,
    tags: ["{{student_name}}", "{{student_code}}", "{{seat_no}}", "{{shift}}"],
    isStarred: false,
  },
  {
    id: "tpl-4",
    title: "Overdue Book Return Notice",
    trigger: "Sent when lending book exceeds due date",
    category: "Alerts",
    categoryColor: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    subject: "Overdue Notice: Please return '{{book_title}}'",
    body: `Dear {{student_name}},

According to our records, the library book '{{book_title}}' (Barcode: {{barcode}}) was due on {{due_date}}.

Kindly return or renew the book at the lending counter as other students are currently on the waiting list.

Standard late fee policy: ₹5 per day following a 2-day grace period.

Thank you for your cooperation!
Library Circulation Desk`,
    tags: ["{{student_name}}", "{{book_title}}", "{{due_date}}", "{{barcode}}"],
    isStarred: false,
  },
  {
    id: "tpl-5",
    title: "Dedicated Seat & Locker Allocation",
    trigger: "Sent on seat/locker assignment or shift transfer",
    category: "Facilities",
    categoryColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    subject: "Desk Allocation Confirmed: Desk {{seat_no}} ({{shift}})",
    body: `Dear {{student_name}},

Your desk allocation has been confirmed:
• Seat Number: {{seat_no}}
• Wing: First Floor Silent Zone
• Shift Timings: {{shift}}
• Locker Number: {{locker_no}}

Please keep your desk clean and avoid leaving personal belongings overnight unless you have opted for 24x7 reserved locker privileges.

Best wishes for your exam preparation!
Apex Study Hub Facilities`,
    tags: ["{{student_name}}", "{{seat_no}}", "{{shift}}", "{{locker_no}}"],
    isStarred: false,
  },
  {
    id: "tpl-6",
    title: "Library Maintenance & Holiday Schedule",
    trigger: "Broadcast for holiday hours or generator maintenance",
    category: "Alerts",
    categoryColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    subject: "Notice: Special Library Schedule for Upcoming Holiday",
    body: `Dear Aspirants & Members,

Please take note of the schedule adjustment for the upcoming holiday:
• Silent Study Halls: OPEN 24x7 as usual with uninterrupted backup power
• Admin & Accounts Desk: CLOSED on Sunday
• Wi-Fi & AC: Fully operational

Thank you for your dedication to your studies.

Apex Study Hub Administration`,
    tags: ["{{library_name}}", "{{holiday_date}}"],
    isStarred: false,
  },
]

const SAMPLE_REPLACEMENTS: Record<string, string> = {
  "{{student_name}}": "Aarav Sharma",
  "{{student_code}}": "STU-1081",
  "{{amount}}": "1,800",
  "{{plan_name}}": "UPSC 6-Month Pass",
  "{{seat_no}}": "Desk A-12",
  "{{shift}}": "Full Day (8 AM - 10 PM)",
  "{{start_date}}": "Jun 15, 2026",
  "{{expiry_date}}": "Dec 15, 2026",
  "{{receipt_no}}": "904",
  "{{book_title}}": "Indian Polity by M. Laxmikanth (7th Ed.)",
  "{{barcode}}": "LIB-BK-8821",
  "{{due_date}}": "Nov 10, 2026",
  "{{locker_no}}": "L-18",
  "{{library_name}}": "Apex Study Hub & Library",
  "{{holiday_date}}": "Next Monday (Diwali / New Year)",
}

const INITIAL_EMAILS: EmailItem[] = [
  {
    id: "email-1",
    senderName: "NextAdmin Team",
    senderEmail: "team@nextadmin.co",
    senderInitials: "NA",
    avatarColor: "bg-rose-600 text-white",
    date: "Jul 7",
    timestamp: "Jul 7, 2026, 04:32 PM",
    subject: "Welcome to NextAdmin...",
    snippet: "Hey there, Thank you for choosing NextAdmin. Let's get you set up with your custom domain...",
    bodyText: `Hey there,

Thank you for choosing NextAdmin LMS! We are thrilled to welcome you to our community of top-tier educational spaces.

Your library workspace has been provisioned with 1-click Google Workspace and Microsoft 365 OAuth integration, automated QR turnstile check-ins, and customizable fee receipts.

Quick start checklist:
1. Connect your library sender email in Settings -> Email Management
2. Upload your library branding and amenities in Public Website
3. Allocate desks in Seats & Lockers

If you ever need any guidance, our 24x7 support team is just one ticket away.

Warm regards,
The NextAdmin Product Team`,
    isStarred: true,
    isUnread: false,
    folder: "inbox",
    category: "all",
    label: "Personal",
    attachments: [
      { name: "Getting_Started_Guide.pdf", size: "1.2 MB", type: "pdf" },
      { name: "Brand_Assets.zip", size: "3.4 MB", type: "zip" },
    ],
  },
  {
    id: "email-2",
    senderName: "Sarah Jenkins",
    senderEmail: "sarah.j@designdesk.io",
    senderAvatar: "/images/avatars/female-01.svg",
    senderInitials: "SJ",
    avatarColor: "bg-blue-600 text-white",
    date: "Jul 7",
    timestamp: "Jul 7, 2026, 02:15 PM",
    subject: "Design Feedback: Q3 A...",
    snippet: "Hi Team, I reviewed the latest designs for the student dashboard. The dark theme contrast is perfect...",
    bodyText: `Hi Team,

I reviewed the latest designs for the student dashboard and study hours tracking. The dark theme contrast, new high-contrast donut tooltips, and 3-column webmail client layout look fantastic!

A few quick observations:
• The tooltip readability on the Subject Split chart is now 100% compliant with accessibility standards.
• The template view as an inbox folder saves librarians time each morning.

Looking forward to our sync on Friday.

Best,
Sarah Jenkins
Lead UI/UX Architect`,
    isStarred: false,
    isUnread: true,
    folder: "inbox",
    category: "unread",
    label: "Work",
  },
  {
    id: "email-3",
    senderName: "RevenueBot",
    senderEmail: "alerts@revenuebot.metrics",
    senderInitials: "RB",
    avatarColor: "bg-purple-600 text-white",
    date: "Jul 6",
    timestamp: "Jul 6, 2026, 09:00 AM",
    subject: "Weekly SaaS Metrics R...",
    snippet: "Hello Team, Here is your weekly library revenue & admissions breakdown: ₹48,250 collected this month...",
    bodyText: `Hello Team,

Here is your weekly library operations summary:

📊 Key Highlights:
• Total Revenue (Month): ₹48,250 (+15.4% vs last month)
• Active Students: 980 Live, 64 Pending
• Seats Allocated: 420 / 500 Desks (84% Occupancy)
• Overdue Fee Invoices: ₹14,800 across 18 students

Automated payment reminders have been queued for dispatch via your connected library Gmail account.

Keep up the outstanding momentum!
RevenueBot Autonomous Intelligence`,
    isStarred: false,
    isUnread: false,
    folder: "inbox",
    category: "all",
    label: "Work",
  },
  {
    id: "email-4",
    senderName: "Vercel Cloud",
    senderEmail: "notifications@vercel.com",
    senderInitials: "VC",
    avatarColor: "bg-emerald-600 text-white",
    date: "Jul 4",
    timestamp: "Jul 4, 2026, 11:45 PM",
    subject: "🔥 Limited Time Offer: ...",
    snippet: "Hey Cloud Builder, Upgrade to Pro for dedicated SMTP relay and high-speed edge compute...",
    bodyText: `Hey Cloud Builder,

Your deployment of Apex Study Hub LMS on Vercel is performing in the 99th percentile for global TTFB and responsiveness.

Unlock dedicated transactional SMTP relay, DDoS enterprise shield, and 99.99% SLA uptime with our limited-time seasonal plan.

Deploy with confidence,
The Vercel Platform Team`,
    isStarred: false,
    isUnread: false,
    folder: "inbox",
    category: "all",
    label: "Personal",
  },
  {
    id: "email-5",
    senderName: "Aarav Sharma",
    senderEmail: "aarav.sharma@gmail.com",
    senderInitials: "AS",
    avatarColor: "bg-indigo-600 text-white",
    date: "Today",
    timestamp: "Today, 11:20 AM",
    subject: "Fee Payment Receipt #REC-2026-904 (₹1,800)",
    snippet: "Payment confirmed for UPSC 6-Month Pass at Desk A-12. Receipt PDF is attached.",
    bodyText: `Dear Aarav Sharma,

Thank you for renewing your UPSC 6-Month Pass at Apex Study Hub & Library.

Payment Details:
• Receipt Number: #REC-2026-904
• Amount Received: ₹1,800
• Payment Mode: PhonePe UPI
• Allocated Desk: Desk A-12 (Full Day: 8 AM - 10 PM)
• Validity: Jun 15, 2026 to Dec 15, 2026

Your RFID turnstile check-in privileges have been extended seamlessly.

Official PDF invoice is attached.

Warm regards,
Apex Study Hub Accounts Desk`,
    isStarred: true,
    isUnread: true,
    folder: "inbox",
    category: "unread",
    label: "Receipts",
    attachments: [
      { name: "Invoice_REC_2026_904.pdf", size: "380 KB", type: "pdf" },
    ],
  },
  {
    id: "email-6",
    senderName: "Priya Patel",
    senderEmail: "priya.patel@neetprep.in",
    senderInitials: "PP",
    avatarColor: "bg-amber-600 text-white",
    date: "Yesterday",
    timestamp: "Yesterday, 03:10 PM",
    subject: "Membership Expiry Notice - 3 Days Left",
    snippet: "Your NEET 1-Year Pass for Desk B-04 is expiring on Nov 28, 2026. Please renew early.",
    bodyText: `Dear Priya Patel,

This is a reminder that your NEET 1-Year Pass subscription for Desk B-04 will expire in 3 days on Nov 28, 2026.

Renew before Thursday to retain your reserved quiet desk and locker #L-18.

UPI ID for instant renewal: apexstudyhub@upi (Kindly share transaction screenshot with reception).

Warm regards,
Apex Study Hub Team`,
    isStarred: false,
    isUnread: false,
    folder: "inbox",
    category: "all",
    label: "Students",
  },
]

export function WebmailClient() {
  const [emails, setEmails] = useState<EmailItem[]>(INITIAL_EMAILS)
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES)
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>("tpl-1")

  // Active folder can be "inbox" | "starred" | "sent" | "drafts" | "templates" | "archived" | "spam" | "trash"
  const [activeFolder, setActiveFolder] = useState<string>("inbox")
  const [activeCategory, setActiveCategory] = useState<"all" | "unread" | "social">("all")
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  // Toggle for raw tags vs sample student data preview in template view
  const [showSampleData, setShowSampleData] = useState<boolean>(true)

  // Composer Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [composeTo, setComposeTo] = useState("")
  const [composeSubject, setComposeSubject] = useState("")
  const [composeBody, setComposeBody] = useState("")
  const [composeSendAs, setComposeSendAs] = useState("apexstudyhub.library@gmail.com (Connected OAuth)")
  const [composerSelectedTemplateId, setComposerSelectedTemplateId] = useState<string>("")

  // Quick reply & template quick-send states
  const [replyText, setReplyText] = useState("")
  const [templateSendTo, setTemplateSendTo] = useState("aarav.sharma@gmail.com")

  // Filtered emails
  const filteredEmails = emails.filter((item) => {
    if (selectedLabel && item.label !== selectedLabel) return false

    if (activeFolder === "starred") {
      if (!item.isStarred) return false
    } else if (activeFolder === "inbox") {
      if (item.folder !== "inbox") return false
    } else {
      if (item.folder !== activeFolder) return false
    }

    if (activeCategory === "unread" && !item.isUnread) return false
    if (activeCategory === "social" && item.label !== "Personal") return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchSubject = item.subject.toLowerCase().includes(q)
      const matchSender = item.senderName.toLowerCase().includes(q)
      const matchEmail = item.senderEmail.toLowerCase().includes(q)
      const matchSnippet = item.snippet.toLowerCase().includes(q)
      if (!matchSubject && !matchSender && !matchEmail && !matchSnippet) return false
    }

    return true
  })

  // Filtered templates (when activeFolder === "templates")
  const filteredTemplates = templates.filter((tpl) => {
    if (templateCategoryFilter !== "all" && tpl.category !== templateCategoryFilter) {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = tpl.title.toLowerCase().includes(q)
      const matchSubject = tpl.subject.toLowerCase().includes(q)
      const matchBody = tpl.body.toLowerCase().includes(q)
      const matchCategory = tpl.category.toLowerCase().includes(q)
      const matchTags = tpl.tags.some((t) => t.toLowerCase().includes(q))
      if (!matchTitle && !matchSubject && !matchBody && !matchCategory && !matchTags) return false
    }
    return true
  })

  const selectedEmail = emails.find((e) => e.id === selectedEmailId)
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  // Unread count for Inbox badge
  const unreadCount = emails.filter((e) => e.folder === "inbox" && e.isUnread).length

  // Handlers
  const handleToggleEmailStar = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEmails((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isStarred: !item.isStarred } : item))
    )
    toast.success("Starred status updated")
  }

  const handleToggleTemplateStar = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setTemplates((prev) =>
      prev.map((tpl) => (tpl.id === id ? { ...tpl, isStarred: !tpl.isStarred } : tpl))
    )
    toast.success("Template favorite updated")
  }

  const handleSelectEmail = (id: string) => {
    setSelectedEmailId(id)
    setEmails((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isUnread: false } : item))
    )
  }

  const handleDeleteEmail = (id: string) => {
    setEmails((prev) => prev.filter((item) => item.id !== id))
    if (selectedEmailId === id) {
      setSelectedEmailId(null)
    }
    toast.success("Email moved to Trash")
  }

  // Use Template in Composer
  const handleUseTemplateInComposer = (tpl: EmailTemplate) => {
    setComposerSelectedTemplateId(tpl.id)
    setComposeSubject(tpl.subject)
    setComposeBody(tpl.body)
    setIsComposeOpen(true)
    toast.success(`Loaded "${tpl.title}" into composer!`, {
      description: "Dynamic placeholders are ready to customize and send.",
    })
  }

  const handleComposerTemplateChange = (tplId: string) => {
    setComposerSelectedTemplateId(tplId)
    const tpl = templates.find((t) => t.id === tplId)
    if (tpl) {
      setComposeSubject(tpl.subject)
      setComposeBody(tpl.body)
      toast.success(`Inserted "${tpl.title}"`)
    }
  }

  const handleInsertTag = (tag: string) => {
    setComposeBody((prev) => `${prev} ${tag}`)
    toast.info(`Inserted placeholder ${tag}`)
  }

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Copied ${label} to clipboard!`)
  }

  const handleSendCompose = () => {
    if (!composeTo.trim()) {
      toast.error("Please enter a recipient email address.")
      return
    }
    if (!composeSubject.trim()) {
      toast.error("Please provide a subject line.")
      return
    }

    const newSentEmail: EmailItem = {
      id: `email-${Date.now()}`,
      senderName: "Apex Study Hub Library",
      senderEmail: "apexstudyhub.library@gmail.com",
      senderInitials: "AS",
      avatarColor: "bg-primary text-primary-foreground",
      date: "Just now",
      timestamp: new Date().toLocaleString(),
      subject: composeSubject,
      snippet: composeBody.slice(0, 70) + "...",
      bodyText: composeBody,
      isStarred: false,
      isUnread: false,
      folder: "sent",
      category: "all",
      label: "Students",
    }

    setEmails((prev) => [newSentEmail, ...prev])
    setIsComposeOpen(false)
    setComposeTo("")
    setComposeSubject("")
    setComposeBody("")
    setComposerSelectedTemplateId("")

    toast.success("Email dispatched successfully!", {
      description: `Sent via ${composeSendAs} to ${composeTo}`,
    })
  }

  const handleQuickDispatchTemplate = () => {
    if (!templateSendTo.trim() || !selectedTemplate) {
      toast.error("Please enter destination email.")
      return
    }

    let renderedSubject = selectedTemplate.subject
    let renderedBody = selectedTemplate.body
    Object.entries(SAMPLE_REPLACEMENTS).forEach(([tag, val]) => {
      renderedSubject = renderedSubject.split(tag).join(val)
      renderedBody = renderedBody.split(tag).join(val)
    })

    const newSentEmail: EmailItem = {
      id: `email-${Date.now()}`,
      senderName: "Apex Study Hub Accounts",
      senderEmail: "apexstudyhub.library@gmail.com",
      senderInitials: "AS",
      avatarColor: "bg-purple-600 text-white",
      date: "Just now",
      timestamp: new Date().toLocaleString(),
      subject: renderedSubject,
      snippet: renderedBody.slice(0, 70) + "...",
      bodyText: renderedBody,
      isStarred: false,
      isUnread: false,
      folder: "sent",
      category: "all",
      label: selectedTemplate.category === "Billing" ? "Receipts" : "Students",
    }

    setEmails((prev) => [newSentEmail, ...prev])
    toast.success(`Dispatched "${selectedTemplate.title}"!`, {
      description: `Sent to ${templateSendTo} with resolved student tokens.`,
    })
  }

  // Function to render text with sample replacements or raw tags
  const renderTemplateText = (text: string) => {
    if (!showSampleData) return text
    let out = text
    Object.entries(SAMPLE_REPLACEMENTS).forEach(([tag, val]) => {
      out = out.split(tag).join(val)
    })
    return out
  }

  return (
    <div className="w-full bg-card border border-border rounded-xl shadow-md overflow-hidden flex flex-col h-[740px]">
      {/* 3-Column Layout Canvas */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ================= COLUMN 1: LEFT SIDEBAR ================= */}
        <div className="w-56 sm:w-60 shrink-0 bg-card border-r border-border flex flex-col p-3 space-y-3">
          {/* Top Compose Mail Button (Matching Screenshot styling) */}
          <Button
            onClick={() => {
              setComposeSubject("")
              setComposeBody("")
              setComposerSelectedTemplateId("")
              setIsComposeOpen(true)
            }}
            className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl gap-2 shadow-xs"
          >
            <PenSquare className="size-4" />
            <span>Compose Mail</span>
          </Button>

          {/* Navigation Folders List */}
          <div className="flex-1 overflow-y-auto space-y-0.5 text-xs">
            {/* 1. Inbox */}
            <button
              onClick={() => {
                setActiveFolder("inbox")
                setSelectedLabel(null)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
                activeFolder === "inbox" && !selectedLabel
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="size-4 text-primary" />
                <span>Inbox</span>
              </div>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold text-foreground font-mono">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* 2. Starred */}
            <button
              onClick={() => {
                setActiveFolder("starred")
                setSelectedLabel(null)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
                activeFolder === "starred" && !selectedLabel
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="size-4 text-amber-500" />
                <span>Starred</span>
              </div>
            </button>

            {/* 3. Sent */}
            <button
              onClick={() => {
                setActiveFolder("sent")
                setSelectedLabel(null)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
                activeFolder === "sent" && !selectedLabel
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className="size-4 text-emerald-500" />
                <span>Sent</span>
              </div>
            </button>

            {/* 4. Drafts */}
            <button
              onClick={() => {
                setActiveFolder("drafts")
                setSelectedLabel(null)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
                activeFolder === "drafts" && !selectedLabel
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="size-4 text-blue-500" />
                <span>Drafts</span>
              </div>
            </button>

            {/* 5. TEMPLATES (SHOW LIKE INBOX - NO DIALOG BOX!) */}
            <button
              onClick={() => {
                setActiveFolder("templates")
                setSelectedLabel(null)
                setSelectedEmailId(null)
                if (!selectedTemplateId && templates.length > 0) {
                  setSelectedTemplateId(templates[0].id)
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
                activeFolder === "templates" && !selectedLabel
                  ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="size-4 text-purple-500" />
                <span>Templates</span>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] h-4.5 px-1.5 font-mono ${
                  activeFolder === "templates"
                    ? "bg-purple-500/20 text-purple-600 border-purple-500/40"
                    : "border-purple-500/30 text-purple-600"
                }`}
              >
                {templates.length}
              </Badge>
            </button>

            {/* 6. Archived */}
            <button
              onClick={() => {
                setActiveFolder("archived")
                setSelectedLabel(null)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
                activeFolder === "archived" && !selectedLabel
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Archive className="size-4 text-muted-foreground" />
                <span>Archived</span>
              </div>
            </button>

            {/* 7. Spam */}
            <button
              onClick={() => {
                setActiveFolder("spam")
                setSelectedLabel(null)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
                activeFolder === "spam" && !selectedLabel
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="size-4 text-amber-500" />
                <span>Spam</span>
              </div>
            </button>

            {/* 8. Trash */}
            <button
              onClick={() => {
                setActiveFolder("trash")
                setSelectedLabel(null)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
                activeFolder === "trash" && !selectedLabel
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="size-4 text-rose-500" />
                <span>Trash</span>
              </div>
            </button>

            {/* Labels Section */}
            <div className="pt-4 pb-1">
              <div className="flex items-center justify-between px-3 pb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                <span>Labels</span>
                <button
                  type="button"
                  onClick={() => toast.info("Create custom label modal")}
                  className="hover:text-foreground p-0.5 rounded"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>

              <button
                onClick={() => {
                  setSelectedLabel(selectedLabel === "Personal" ? null : "Personal")
                  if (activeFolder === "templates") setActiveFolder("inbox")
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedLabel === "Personal"
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="size-2.5 rounded-full bg-blue-500" />
                <span>Personal</span>
              </button>

              <button
                onClick={() => {
                  setSelectedLabel(selectedLabel === "Work" ? null : "Work")
                  if (activeFolder === "templates") setActiveFolder("inbox")
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedLabel === "Work"
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="size-2.5 rounded-full bg-amber-500" />
                <span>Work</span>
              </button>

              <button
                onClick={() => {
                  setSelectedLabel(selectedLabel === "Students" ? null : "Students")
                  if (activeFolder === "templates") setActiveFolder("inbox")
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedLabel === "Students"
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="size-2.5 rounded-full bg-purple-500" />
                <span>Students</span>
              </button>

              <button
                onClick={() => {
                  setSelectedLabel(selectedLabel === "Receipts" ? null : "Receipts")
                  if (activeFolder === "templates") setActiveFolder("inbox")
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedLabel === "Receipts"
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <span>Receipts</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= COLUMN 2: LIST COLUMN (EMAILS OR TEMPLATES) ================= */}
        <div className="w-80 sm:w-96 shrink-0 bg-card border-r border-border flex flex-col min-w-0">
          {/* Top Search & Filter Bar */}
          <div className="p-3 pb-2 border-b border-border/70">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={
                  activeFolder === "templates" ? "Search templates, tags, subjects..." : "Search email..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-muted/40 border-border rounded-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Category / Filter Tabs */}
            {activeFolder === "templates" ? (
              /* Templates Categories Filter Tabs */
              <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-0.5">
                {["all", "Billing", "Alerts", "Onboarding", "Facilities"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTemplateCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all shrink-0 capitalize ${
                      templateCategoryFilter === cat
                        ? "bg-purple-600 text-white shadow-2xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            ) : (
              /* Standard Email Category Tabs: All, Unread, Social + Templates Shortcut */
              <div className="flex items-center gap-1 mt-2.5">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${
                    activeCategory === "all"
                      ? "bg-muted text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveCategory("unread")}
                  className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${
                    activeCategory === "unread"
                      ? "bg-muted text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => setActiveCategory("social")}
                  className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${
                    activeCategory === "social"
                      ? "bg-muted text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Social
                </button>
                <button
                  onClick={() => {
                    setActiveFolder("templates")
                    setSelectedLabel(null)
                    setSelectedEmailId(null)
                    if (!selectedTemplateId && templates.length > 0) {
                      setSelectedTemplateId(templates[0].id)
                    }
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-md text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 flex items-center gap-1 transition-all"
                  title="Switch to Templates Inbox View"
                >
                  <Sparkles className="size-3" />
                  <span>Templates</span>
                </button>
              </div>
            )}
          </div>

          {/* List Content: Renders Templates like Inbox OR Emails */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {activeFolder === "templates" ? (
              /* ================= TEMPLATES LIST (RENDERED LIKE INBOX!) ================= */
              filteredTemplates.length === 0 ? (
                <div className="p-8 text-center space-y-2 text-muted-foreground">
                  <Sparkles className="size-8 mx-auto text-purple-500/60" />
                  <p className="text-xs">No templates found in this category.</p>
                </div>
              ) : (
                filteredTemplates.map((tpl) => {
                  const isSelected = tpl.id === selectedTemplateId
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`p-3 cursor-pointer transition-colors relative space-y-1.5 ${
                        isSelected
                          ? "bg-purple-500/10 border-l-3 border-l-purple-500"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      {/* Top Row: Category Icon + Title + Actions */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`size-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              tpl.category === "Billing"
                                ? "bg-emerald-500/20 text-emerald-600"
                                : tpl.category === "Alerts"
                                ? "bg-amber-500/20 text-amber-600"
                                : tpl.category === "Onboarding"
                                ? "bg-purple-500/20 text-purple-600"
                                : "bg-blue-500/20 text-blue-600"
                            }`}
                          >
                            {tpl.category === "Billing" ? (
                              <Receipt className="size-3.5" />
                            ) : tpl.category === "Alerts" ? (
                              <Clock className="size-3.5" />
                            ) : tpl.category === "Onboarding" ? (
                              <UserCheck className="size-3.5" />
                            ) : (
                              <BookOpen className="size-3.5" />
                            )}
                          </div>
                          <div className="truncate text-xs font-bold text-foreground">
                            {tpl.title}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleToggleTemplateStar(tpl.id, e)}
                            className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-amber-400"
                          >
                            <Star
                              className={`size-3.5 ${
                                tpl.isStarred
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/60 hover:text-foreground"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Subject Line Preview */}
                      <div className="text-xs truncate font-medium text-foreground/90 font-mono text-[11px]">
                        {tpl.subject}
                      </div>

                      {/* Snippet Preview */}
                      <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed">
                        {tpl.body.replace(/\n+/g, " ")}
                      </p>

                      {/* Bottom Row: Category Badge + Tag Count */}
                      <div className="pt-0.5 flex items-center justify-between gap-2">
                        <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${tpl.categoryColor}`}>
                          {tpl.category}
                        </Badge>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                          {tpl.tags.length} dynamic tags
                        </span>
                      </div>
                    </div>
                  )
                })
              )
            ) : (
              /* ================= STANDARD EMAILS LIST ================= */
              filteredEmails.length === 0 ? (
                <div className="p-8 text-center space-y-2 text-muted-foreground">
                  <Inbox className="size-8 mx-auto text-muted-foreground/60" />
                  <p className="text-xs">No emails found in this view.</p>
                </div>
              ) : (
                filteredEmails.map((email) => {
                  const isSelected = email.id === selectedEmailId
                  return (
                    <div
                      key={email.id}
                      onClick={() => handleSelectEmail(email.id)}
                      className={`p-3 cursor-pointer transition-colors relative space-y-1.5 ${
                        isSelected
                          ? "bg-muted/80 border-l-3 border-l-primary"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      {/* Top Row: Avatar + Sender Name + Date + Action Menu */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="size-7 shrink-0 text-[11px] font-bold">
                            {email.senderAvatar ? (
                              <AvatarImage src={email.senderAvatar} alt={email.senderName} />
                            ) : null}
                            <AvatarFallback className={email.avatarColor}>
                              {email.senderInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="truncate text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <span className={email.isUnread ? "font-bold text-foreground" : "font-medium"}>
                              {email.senderName}
                            </span>
                            <span className="text-muted-foreground font-normal text-[11px]">• {email.date}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60"
                              >
                                <MoreHorizontal className="size-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs">
                              <DropdownMenuItem onClick={() => handleToggleEmailStar(email.id)}>
                                {email.isStarred ? "Remove Star" : "Add Star"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEmails((prev) =>
                                    prev.map((i) =>
                                      i.id === email.id ? { ...i, isUnread: !i.isUnread } : i
                                    )
                                  )
                                }}
                              >
                                Mark as {email.isUnread ? "Read" : "Unread"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteEmail(email.id)}
                                className="text-rose-600"
                              >
                                Delete Email
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <button
                            type="button"
                            onClick={(e) => handleToggleEmailStar(email.id, e)}
                            className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-amber-400"
                          >
                            <Star
                              className={`size-3.5 ${
                                email.isStarred
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/60 hover:text-foreground"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Subject Line */}
                      <div
                        className={`text-xs truncate ${
                          email.isUnread ? "font-bold text-foreground" : "font-semibold text-foreground/90"
                        }`}
                      >
                        {email.subject}
                      </div>

                      {/* Preview Snippet */}
                      <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed">
                        {email.snippet}
                      </p>

                      {/* Labels / Badges */}
                      {email.label && (
                        <div className="pt-0.5 flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[9px] h-4 px-1.5 rounded-full font-medium ${
                              email.label === "Personal"
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                : email.label === "Work"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : email.label === "Students"
                                ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            }`}
                          >
                            {email.label}
                          </Badge>
                          {email.attachments && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Paperclip className="size-2.5" /> {email.attachments.length}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )
            )}
          </div>
        </div>

        {/* ================= COLUMN 3: DETAIL READING PANE (TEMPLATE OR EMAIL) ================= */}
        <div className="flex-1 bg-card/60 flex flex-col min-w-0">
          {activeFolder === "templates" ? (
            /* ================= TEMPLATE DETAIL VIEW (LIKE INBOX!) ================= */
            !selectedTemplate ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="size-16 rounded-full border border-border bg-muted/40 flex items-center justify-center text-purple-500 shadow-2xs">
                  <Sparkles className="size-8 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground tracking-tight">
                    No Template Selected
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                    Select a library template from the list on the left to preview its content and dynamic tags.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Top Action Toolbar for Templates */}
                <div className="p-3 border-b border-border flex items-center justify-between gap-2 shrink-0 bg-card">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUseTemplateInComposer(selectedTemplate)}
                      className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-1.5 shadow-xs"
                    >
                      <Send className="size-3.5" />
                      <span>Use in Compose</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopyText(
                          `Subject: ${selectedTemplate.subject}\n\n${selectedTemplate.body}`,
                          "Template"
                        )
                      }
                      className="h-8 text-xs gap-1.5 border-border"
                    >
                      <Copy className="size-3.5" />
                      <span>Copy Text</span>
                    </Button>
                  </div>

                  {/* Toggle between Raw Tags and Sample Student Preview */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant={showSampleData ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setShowSampleData(!showSampleData)}
                      className="h-8 text-xs gap-1.5 font-medium border-border"
                    >
                      <Eye className="size-3.5 text-primary" />
                      <span>{showSampleData ? "Sample Preview: ON" : "Raw Tokens: ON"}</span>
                    </Button>
                  </div>
                </div>

                {/* Template Content View */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {/* Title & Metadata */}
                  <div className="space-y-2 pb-3 border-b border-border/60">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                        <span>{selectedTemplate.title}</span>
                      </h2>
                      <Badge variant="outline" className={`text-xs ${selectedTemplate.categoryColor}`}>
                        {selectedTemplate.category}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Sparkles className="size-3.5 text-purple-500 shrink-0" />
                      <span>{selectedTemplate.trigger}</span>
                    </div>

                    {/* Subject Line Pill */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-semibold text-muted-foreground">Subject Line:</span>
                      <div className="p-2.5 rounded-lg bg-background border border-border text-xs font-mono font-medium text-foreground">
                        {renderTemplateText(selectedTemplate.subject)}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Placeholders Available */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      Available Dynamic Tokens (Click to Copy):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTemplate.tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleCopyText(tag, tag)}
                          className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25 text-[11px] font-mono hover:bg-purple-500/20 transition-colors flex items-center gap-1"
                        >
                          <span>{tag}</span>
                          <span className="text-[9px] text-muted-foreground">({SAMPLE_REPLACEMENTS[tag] || "custom"})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Email Body Card */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        Email Message Body:
                      </span>
                      {showSampleData && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          Resolved with sample student tokens
                        </span>
                      )}
                    </div>
                    <div className="p-4 rounded-xl bg-background border border-border text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground/95 shadow-2xs">
                      {renderTemplateText(selectedTemplate.body)}
                    </div>
                  </div>
                </div>

                {/* Bottom Quick Send to Student Form */}
                <div className="p-3 border-t border-border bg-card/80 space-y-2 shrink-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium">
                      <Send className="size-3.5 text-primary" />
                      Quick Test Dispatch via Connected OAuth
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      apexstudyhub.library@gmail.com
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Student email address..."
                      value={templateSendTo}
                      onChange={(e) => setTemplateSendTo(e.target.value)}
                      className="h-9 text-xs bg-background border-border rounded-lg font-mono"
                    />
                    <Button
                      size="sm"
                      onClick={handleQuickDispatchTemplate}
                      className="h-9 px-4 text-xs bg-primary text-primary-foreground font-semibold gap-1.5 shrink-0"
                    >
                      <Send className="size-3.5" />
                      <span>Dispatch Test</span>
                    </Button>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* ================= STANDARD EMAIL DETAIL VIEW ================= */
            !selectedEmail ? (
              /* Empty State Matching Screenshot */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="size-16 rounded-full border border-border bg-muted/40 flex items-center justify-center text-muted-foreground shadow-2xs">
                  <Mail className="size-8 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground tracking-tight">
                    No Email Selected
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                    Select an email from the conversation list on the left to read its content.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveFolder("templates")
                    setSelectedLabel(null)
                    setSelectedEmailId(null)
                    if (templates.length > 0) setSelectedTemplateId(templates[0].id)
                  }}
                  className="mt-2 text-xs gap-1.5 border-purple-500/30 text-purple-600 hover:bg-purple-500/10"
                >
                  <Sparkles className="size-3.5 text-purple-500" />
                  <span>View Library Templates</span>
                </Button>
              </div>
            ) : (
              /* Active Email Detail Viewer */
              <div className="flex-1 flex flex-col min-h-0">
                {/* Action Toolbar */}
                <div className="p-3 border-b border-border flex items-center justify-between gap-2 shrink-0 bg-card">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => handleToggleEmailStar(selectedEmail.id)}
                    >
                      <Star
                        className={`size-4 ${
                          selectedEmail.isStarred
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        toast.success("Archived")
                        setSelectedEmailId(null)
                      }}
                    >
                      <Archive className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-rose-500 hover:bg-rose-500/10"
                      onClick={() => handleDeleteEmail(selectedEmail.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => window.print()}
                    >
                      <Printer className="size-3" />
                      <span className="hidden sm:inline">Print</span>
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1 bg-primary text-primary-foreground font-semibold"
                      onClick={() => {
                        setComposeTo(selectedEmail.senderEmail)
                        setComposeSubject(`Re: ${selectedEmail.subject}`)
                        setIsComposeOpen(true)
                      }}
                    >
                      <Reply className="size-3" />
                      <span>Reply</span>
                    </Button>
                  </div>
                </div>

                {/* Email Content Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {/* Subject & Tags */}
                  <div className="space-y-1.5 pb-3 border-b border-border/60">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-foreground">
                        {selectedEmail.subject}
                      </h2>
                      {selectedEmail.label && (
                        <Badge variant="outline" className="text-xs">
                          {selectedEmail.label}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8 font-bold">
                          {selectedEmail.senderAvatar && (
                            <AvatarImage src={selectedEmail.senderAvatar} alt={selectedEmail.senderName} />
                          )}
                          <AvatarFallback className={selectedEmail.avatarColor}>
                            {selectedEmail.senderInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-foreground">
                            {selectedEmail.senderName}{" "}
                            <span className="font-mono text-muted-foreground font-normal">
                              &lt;{selectedEmail.senderEmail}&gt;
                            </span>
                          </div>
                          <div className="text-[11px]">To: Apex Study Hub Library</div>
                        </div>
                      </div>

                      <div className="text-[11px] font-mono text-muted-foreground text-right">
                        {selectedEmail.timestamp}
                      </div>
                    </div>
                  </div>

                  {/* Email Text */}
                  <div className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedEmail.bodyText}
                  </div>

                  {/* Attachments Section */}
                  {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div className="pt-4 border-t border-border/60 space-y-2">
                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Paperclip className="size-3.5 text-primary" />
                        <span>Attachments ({selectedEmail.attachments.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmail.attachments.map((att) => (
                          <div
                            key={att.name}
                            className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/40 text-xs"
                          >
                            <FileCode className="size-4 text-primary" />
                            <div>
                              <div className="font-semibold text-foreground truncate max-w-xs">{att.name}</div>
                              <div className="text-[10px] text-muted-foreground">{att.size}</div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 text-muted-foreground hover:text-foreground"
                              onClick={() => toast.success(`Downloading ${att.name}`)}
                            >
                              <Download className="size-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Quick Reply Box */}
                <div className="p-3 border-t border-border bg-card/80 space-y-2 shrink-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium">
                      <Reply className="size-3.5 text-primary" />
                      Quick Reply to {selectedEmail.senderName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Type your reply here..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          if (!replyText.trim()) return
                          toast.success("Reply dispatched!", {
                            description: `Sent reply to ${selectedEmail.senderName}`,
                          })
                          setReplyText("")
                        }
                      }}
                      className="h-9 text-xs bg-background border-border rounded-lg"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!replyText.trim()) return
                        toast.success("Reply dispatched!", {
                          description: `Sent reply to ${selectedEmail.senderName}`,
                        })
                        setReplyText("")
                      }}
                      className="h-9 px-4 text-xs bg-primary text-primary-foreground font-semibold gap-1.5 shrink-0"
                    >
                      <Send className="size-3.5" />
                      <span>Send</span>
                    </Button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* ================= MODAL: COMPOSE MAIL (INLINE TEMPLATE SELECTOR) ================= */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-2xl bg-card border-border rounded-xl shadow-2xl p-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="p-4 pb-3 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <PenSquare className="size-4.5 text-primary" />
                Compose New Email
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Send via connected library OAuth or choose an automated student template below.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="p-4 space-y-3 text-xs">
            {/* Inline Template Selection Dropdown (No dialog box needed!) */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-purple-600" />
                  Auto-Fill from Library Template:
                </span>
                <span className="text-[10px] text-muted-foreground">Optional</span>
              </Label>
              <Select
                value={composerSelectedTemplateId}
                onValueChange={(val) => handleComposerTemplateChange(val)}
              >
                <SelectTrigger className="h-8.5 text-xs bg-background border-border">
                  <SelectValue placeholder="Choose a template to auto-fill subject & body..." />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {templates.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.title} ({tpl.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Send As Indicator */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/40 border border-border">
              <span className="text-[11px] font-semibold text-muted-foreground">Send As:</span>
              <span className="text-xs font-mono font-medium text-foreground truncate">
                {composeSendAs}
              </span>
            </div>

            {/* Recipient To */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Recipient (To) *</Label>
              <Input
                placeholder="e.g. student@gmail.com, aarav.patel@gmail.com"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                className="h-8.5 text-xs bg-background border-border rounded-md font-mono"
              />
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Subject *</Label>
              <Input
                placeholder="Subject line or select a template above..."
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="h-8.5 text-xs bg-background border-border rounded-md font-medium"
              />
            </div>

            {/* Dynamic Placeholders Helper Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Message Body</Label>
                <span className="text-[10px] text-muted-foreground">Click tag to insert:</span>
              </div>
              <div className="flex flex-wrap gap-1 pb-1">
                {["{{student_name}}", "{{amount}}", "{{plan_name}}", "{{seat_no}}", "{{expiry_date}}", "{{receipt_no}}"].map(
                  (tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleInsertTag(tag)}
                      className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono hover:bg-primary/20 transition-colors"
                    >
                      {tag}
                    </button>
                  )
                )}
              </div>
              <Textarea
                rows={8}
                placeholder="Write your email content or select a template above to load fee receipts, notices, or expiry alerts..."
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                className="text-xs bg-background border-border rounded-md font-sans leading-relaxed"
              />
            </div>
          </div>

          <DialogFooter className="p-3 border-t border-border bg-muted/10 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsComposeOpen(false)}
              className="h-8 text-xs border-border"
            >
              Discard
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSendCompose}
              className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-1.5"
            >
              <Send className="size-3.5" />
              <span>Send Email</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
