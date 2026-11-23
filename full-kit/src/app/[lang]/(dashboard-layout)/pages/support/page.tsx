"use client"

import { useState } from "react"
import {
  Armchair,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  HelpCircle,
  MessageCircle,
  MessageSquare,
  Paperclip,
  Phone,
  Plus,
  QrCode,
  Search,
  Send,
  Settings,
  Smartphone,
  UserCheck,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"

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

interface TicketItem {
  id: string
  ticketId: string
  topic: string
  subject: string
  lastResponse: string
  status: "In Progress" | "Resolved" | "Open"
  createdAt: string
  thread: {
    sender: string
    role: "user" | "support"
    message: string
    time: string
  }[]
}

const initialTickets: TicketItem[] = [
  {
    id: "tkt-1",
    ticketId: "TKT-1049",
    topic: "Gate & QR Attendance",
    subject: "Need help adjusting QR gate geofence radius for basement entrance",
    lastResponse: "Support Team: Hi Vikram, we have calibrated your coordinates to 150m.",
    status: "In Progress",
    createdAt: "Today, 11:20 AM",
    thread: [
      {
        sender: "Vikram Malhotra",
        role: "user",
        message: "Students trying to scan from our basement hall are getting a 'Too far from door' GPS error. Can we increase the geofence radius?",
        time: "Today, 10:45 AM",
      },
      {
        sender: "Support Team (Pooja K.)",
        role: "support",
        message: "Hi Vikram, we have calibrated your coordinates to 150m to cover the basement annex. Please ask a student to test now and confirm.",
        time: "Today, 11:20 AM",
      },
    ],
  },
  {
    id: "tkt-2",
    ticketId: "TKT-1038",
    topic: "Fees, UPI & Day Book",
    subject: "How to export monthly GST bills for our chartered accountant?",
    lastResponse: "Support Team: You can download the single ZIP from the Billing page.",
    status: "Resolved",
    createdAt: "Yesterday, 04:15 PM",
    thread: [
      {
        sender: "Vikram Malhotra",
        role: "user",
        message: "Our CA requires an itemized monthly GST invoice bundle for October cash & online receipts. Where can I bulk download this?",
        time: "Yesterday, 03:00 PM",
      },
      {
        sender: "Support Team (Rahul S.)",
        role: "support",
        message: "You can download the single ZIP from the Billing & Plans page under 'GST Compliance Archive'. We have also emailed a copy to your registered address.",
        time: "Yesterday, 04:15 PM",
      },
    ],
  },
]

const topicGuides = [
  {
    id: "getting-started",
    icon: Users,
    title: "Getting Started",
    description: "Setting up your library profile, branches, and inviting staff",
    guidesCount: 5,
    articles: [
      "Configuring library hours and branch details",
      "Inviting staff members and granting custom permissions",
      "Setting up desk count and basic admission plans",
      "Customizing student registration form fields",
      "Verifying SMS and WhatsApp sender credentials",
    ],
  },
  {
    id: "gate-attendance",
    icon: QrCode,
    title: "Gate & QR Attendance",
    description: "Printing entrance posters, allowed distance radius, and check-ins",
    guidesCount: 7,
    articles: [
      "Downloading high-res QR attendance poster for entrance gate",
      "Calibrating GPS geofence radius for basement and high-rise libraries",
      "Setting up manual check-in override for offline students",
      "Biometric finger/face device integration guide",
      "Exporting attendance shift timesheets for parent updates",
      "Daily automated absent notifications setup",
      "Handling duplicate check-in / check-out timestamps",
    ],
  },
  {
    id: "seats-floor-map",
    icon: BookOpen,
    title: "Seats & Floor Map",
    description: "Giving desks, managing shifts, girls-only wing, and locker allocation",
    guidesCount: 6,
    articles: [
      "Designing your physical floor layout with the Visual Builder",
      "Allocating seats to fixed-shift vs flexible-shift students",
      "Managing reserved girls-only study cabins and silent zones",
      "Assigning key lockers and locker security deposits",
      "Handling student desk change and swap requests",
      "Handling overcrowding alerts during peak exam months",
    ],
  },
  {
    id: "fees-day-book",
    icon: CreditCard,
    title: "Fees, UPI & Day Book",
    description: "Collecting money, sending WhatsApp receipts, and closing cash daily",
    guidesCount: 8,
    articles: [
      "Recording counter cash payments and issuing instant PDF receipts",
      "Generating dynamic UPI QR code with pre-filled student amount",
      "Setting up automated WhatsApp fee reminder schedules (3 days prior)",
      "Daily Cash Handover and Day-Book vault audit workflow",
      "Processing partial refunds or membership security deposit releases",
      "Applying referral discount coupons and custom plan waivers",
      "Overdue fee penalty calculation rules",
      "Exporting monthly GST collections summary for tax filing",
    ],
  },
  {
    id: "student-app",
    icon: Smartphone,
    title: "Student Mobile App",
    description: "How students discover your library, buy plans, and track study time",
    guidesCount: 4,
    articles: [
      "Student login via OTP and profile onboarding walkthrough",
      "How students scan attendance QR via their mobile camera",
      "In-app plan renewals and direct online UPI payments",
      "Study streak leaderboard and focus timer tracking",
    ],
  },
  {
    id: "settings-hardware",
    icon: Settings,
    title: "Settings & Hardware",
    description: "Razorpay payment keys, WhatsApp notification templates, and backups",
    guidesCount: 6,
    articles: [
      "Connecting Razorpay or Cashfree live payment gateway API keys",
      "Setting up Meta Cloud API WhatsApp business account",
      "Configuring thermal receipt printer (58mm / 80mm ESC/POS)",
      "Exporting full student and attendance database backup",
      "Configuring custom domain for your library public microsite",
      "Session timeout and staff multi-device login restrictions",
    ],
  },
]

const faqs = [
  {
    question: "How do I allocate a desk to a newly joined student?",
    answer:
      "Open the Seats page from the left menu. Free desks are highlighted in soft green. Simply click the desk, choose 'Give seat', and pick your student, or drag the student directly from the waiting list.",
  },
  {
    question: "What if a student's GPS says they are too far from the library door?",
    answer:
      "Go to Attendance > QR code page. You can adjust the 'Allowed distance from library' slider (recommended: 100 meters). You can also accept scans manually from 'Scans to check'.",
  },
  {
    question: "How do I return money or issue a partial fee refund?",
    answer:
      "Open the Fees page, locate the student's payment, click the three dots (...) menu on the right, and choose 'Return money'. Select the amount, the reason, and whether to return via UPI or Cash.",
  },
  {
    question: "Can my sub-admins see our daily fee collection?",
    answer:
      "No, by default team accounts cannot see financial charts or total collections unless you explicitly toggle 'Revenue and fee numbers' to ON in the Team permissions page.",
  },
]

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [tickets, setTickets] = useState<TicketItem[]>(initialTickets)

  // Dialog States
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false)
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false)
  const [isPhoneOpen, setIsPhoneOpen] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<typeof topicGuides[0] | null>(null)
  const [viewingTicket, setViewingTicket] = useState<TicketItem | null>(null)
  const [ticketReplyText, setTicketReplyText] = useState("")

  // New Ticket Form State
  const [newTopic, setNewTopic] = useState("Gate & QR Attendance")
  const [newSubject, setNewSubject] = useState("")
  const [newDescription, setNewDescription] = useState("")

  const handleCreateTicket = () => {
    if (!newSubject.trim() || !newDescription.trim()) {
      toast.error("Please fill in both subject and description.")
      return
    }

    const created: TicketItem = {
      id: `tkt-${Date.now()}`,
      ticketId: `TKT-${Math.floor(1050 + Math.random() * 50)}`,
      topic: newTopic,
      subject: newSubject,
      lastResponse: "Awaiting support engineer review",
      status: "In Progress",
      createdAt: "Just now",
      thread: [
        {
          sender: "Vikram Malhotra (You)",
          role: "user",
          message: newDescription,
          time: "Just now",
        },
      ],
    }

    setTickets([created, ...tickets])
    setIsNewTicketOpen(false)
    setNewSubject("")
    setNewDescription("")
    toast.success("Support ticket submitted!", {
      description: `Ticket ${created.ticketId} created. Platform engineers typically respond within 15 minutes.`,
    })
  }

  const handleSendReply = () => {
    if (!ticketReplyText.trim() || !viewingTicket) return

    const updatedThread = [
      ...viewingTicket.thread,
      {
        sender: "Vikram Malhotra (You)",
        role: "user" as const,
        message: ticketReplyText,
        time: "Just now",
      },
    ]

    const updatedTicket: TicketItem = {
      ...viewingTicket,
      lastResponse: `You: ${ticketReplyText.slice(0, 60)}...`,
      thread: updatedThread,
    }

    setTickets(tickets.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)))
    setViewingTicket(updatedTicket)
    setTicketReplyText("")
    toast.success("Reply sent to support engineers!")
  }

  // Filtered FAQs and Topics based on search query
  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredTopics = topicGuides.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.articles.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 space-y-6 p-4 sm:p-6 lg:p-8 pb-16">
      {/* Top Hero Section */}
      <Card className="relative overflow-hidden border-border bg-card p-6 sm:p-10 text-center shadow-xs">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-2xl space-y-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <HelpCircle className="size-3.5" />
            <span>LIBRARY SUPPORT &amp; GUIDES</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            How can we help your library today?
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-muted-foreground">
            Search practical guides, learn desk operations, or get in touch with our live support team.
          </p>

          {/* Search Bar */}
          <div className="relative mx-auto mt-4 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search topics: e.g. 'how to collect fees', 'QR code', 'girls wing'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 ps-10 pe-4 text-sm bg-background border-border shadow-xs focus:border-primary text-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* 3 Contact Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: WhatsApp Helpdesk */}
        <Card
          onClick={() => setIsWhatsAppOpen(true)}
          className="group relative flex items-center justify-between p-4 sm:p-5 border-border bg-card hover:bg-accent/40 transition-all duration-200 cursor-pointer shadow-xs hover:border-emerald-500/40"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
              <MessageCircle className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                WhatsApp Helpdesk
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                Average reply in 5 minutes
              </p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Card>

        {/* Card 2: Direct Phone Support */}
        <Card
          onClick={() => setIsPhoneOpen(true)}
          className="group relative flex items-center justify-between p-4 sm:p-5 border-border bg-card hover:bg-accent/40 transition-all duration-200 cursor-pointer shadow-xs hover:border-blue-500/40"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
              <Phone className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Direct Phone Support
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                Mon-Sat, 9 AM to 8 PM
              </p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Card>

        {/* Card 3: Open Support Ticket */}
        <Card
          onClick={() => setIsNewTicketOpen(true)}
          className="group relative flex items-center justify-between p-4 sm:p-5 border-border bg-card hover:bg-accent/40 transition-all duration-200 cursor-pointer shadow-xs hover:border-primary/40"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/25">
              <Plus className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                Open Support Ticket
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                For bugs or account queries
              </p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Card>
      </div>

      {/* Section: Browse by Topic */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Browse by Topic
          </h2>
          {searchQuery && (
            <span className="text-xs text-muted-foreground">
              Showing {filteredTopics.length} of {topicGuides.length} topics
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topic) => {
            const Icon = topic.icon
            return (
              <Card
                key={topic.id}
                onClick={() => setSelectedTopic(topic)}
                className="group relative flex flex-col justify-between p-5 border-border bg-card hover:bg-accent/35 transition-all duration-200 cursor-pointer shadow-xs hover:border-primary/35"
              >
                <div className="space-y-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary border border-border group-hover:border-primary/30 transition-colors">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {topic.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {topic.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>{topic.guidesCount} helpful guides</span>
                  <span className="text-primary font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                    Read guides &rarr;
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Section: Frequently Asked Questions */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          {searchQuery && (
            <span className="text-xs text-muted-foreground">
              {filteredFaqs.length} matching questions
            </span>
          )}
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => (
            <Card
              key={index}
              className="p-4 sm:p-5 border-border bg-card shadow-xs transition-colors hover:border-primary/25"
            >
              <h3 className="text-sm font-bold text-foreground">
                <span className="text-primary font-black me-1.5">Q.</span>
                {faq.question}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed ps-4.5 border-s-2 border-primary/20">
                {faq.answer}
              </p>
            </Card>
          ))}
          {filteredFaqs.length === 0 && (
            <Card className="p-8 text-center border-dashed border-border text-muted-foreground">
              <HelpCircle className="size-8 mx-auto mb-2 text-muted-foreground/60" />
              <p className="text-sm font-medium">No FAQ matched &ldquo;{searchQuery}&rdquo;</p>
              <p className="text-xs mt-1">Try searching for keywords like &lsquo;fees&rsquo;, &lsquo;QR&rsquo;, or &lsquo;seats&rsquo;.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Section: Your Support Tickets */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-5 border-b border-border">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">
              Your Support Tickets
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Track requests submitted to our engineering and support engineers.
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsNewTicketOpen(true)}
            size="sm"
            className="h-9 gap-1.5 font-bold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            <Plus className="size-4" />
            <span>Create New Ticket</span>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Ticket ID</TableHead>
                  <TableHead className="w-[200px]">Topic</TableHead>
                  <TableHead>Subject &amp; Last Response</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[130px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-muted/40 transition-colors">
                    {/* Ticket ID */}
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {ticket.ticketId}
                    </TableCell>

                    {/* Topic Badge */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-xs font-medium bg-muted/50 border-border text-foreground px-2 py-0.5"
                      >
                        {ticket.topic}
                      </Badge>
                    </TableCell>

                    {/* Subject & Last Response */}
                    <TableCell className="max-w-md">
                      <p className="text-xs font-bold text-foreground leading-snug">
                        {ticket.subject}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {ticket.lastResponse}
                      </p>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      {ticket.status === "In Progress" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                          <Clock className="size-3.5" />
                          <span>In Progress</span>
                        </span>
                      ) : ticket.status === "Resolved" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3.5" />
                          <span>Resolved</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                          <Clock className="size-3.5" />
                          <span>Open</span>
                        </span>
                      )}
                    </TableCell>

                    {/* Action Button */}
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingTicket(ticket)}
                        className="h-7 px-2.5 text-xs font-semibold border-border bg-card hover:bg-accent text-foreground shadow-2xs"
                      >
                        View Thread
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* DIALOG 1: WhatsApp Helpdesk */}
      <Dialog open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-2 border border-emerald-500/25">
              <MessageCircle className="size-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              WhatsApp Instant Helpdesk
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Connect directly with our dedicated library operations support team on WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="rounded-lg border border-border p-3.5 bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Official Helpdesk:</span>
                <span className="font-mono font-bold text-foreground">+91 98765 43210</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Average Response:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Under 5 minutes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Hours:</span>
                <span className="font-medium text-foreground">24x7 Emergency Desk</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Share student logs, receipt screenshots, or POS printer errors directly on chat for instant resolution.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsWhatsAppOpen(false)}
            >
              Close
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
              onClick={() => {
                window.open("https://wa.me/919876543210?text=Hi%2C%20I%20need%20support%20with%20my%20library%20operations.", "_blank")
                setIsWhatsAppOpen(false)
              }}
            >
              <MessageCircle className="size-4" />
              <span>Open in WhatsApp</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: Direct Phone Support */}
      <Dialog open={isPhoneOpen} onOpenChange={setIsPhoneOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 mb-2 border border-blue-500/25">
              <Phone className="size-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Direct Phone Support
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Speak directly with an onboarding specialist or technical desk manager.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="rounded-lg border border-border p-3.5 bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Toll-Free Helpline:</span>
                <span className="font-mono font-bold text-foreground">1800-123-4567</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Direct Desk Line:</span>
                <span className="font-mono font-bold text-foreground">+91 20 6789 0123</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Operating Window:</span>
                <span className="font-semibold text-foreground">Mon - Sat (9:00 AM - 8:00 PM IST)</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              For night-time emergency geofence or gateway escalations, please use the 24x7 WhatsApp Helpdesk.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPhoneOpen(false)}
            >
              Close
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5"
              onClick={() => {
                window.location.href = "tel:18001234567"
                setIsPhoneOpen(false)
              }}
            >
              <Phone className="size-4" />
              <span>Call 1800-123-4567</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: Create Support Ticket */}
      <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
        <DialogContent className="max-w-lg border-border bg-card">
          <DialogHeader>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary mb-1 border border-primary/25">
              <Plus className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Create New Support Ticket
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Submit your inquiry or issue to our engineering team. We typically respond within 15 minutes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Related Topic / Module</Label>
              <Select value={newTopic} onValueChange={setNewTopic}>
                <SelectTrigger className="h-9 text-xs border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gate & QR Attendance">Gate &amp; QR Attendance</SelectItem>
                  <SelectItem value="Fees, UPI & Day Book">Fees, UPI &amp; Day Book</SelectItem>
                  <SelectItem value="Seats & Floor Map">Seats &amp; Floor Map</SelectItem>
                  <SelectItem value="Getting Started">Getting Started &amp; Staff Roles</SelectItem>
                  <SelectItem value="Student Mobile App">Student Mobile App</SelectItem>
                  <SelectItem value="Settings & Hardware">Settings, POS &amp; Hardware</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Ticket Subject</Label>
              <Input
                placeholder="e.g. Need assistance setting up thermal receipt printer"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="h-9 text-xs border-border bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Description &amp; Steps</Label>
              <Textarea
                placeholder="Describe your issue, student details, or error message in detail..."
                rows={4}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="text-xs border-border bg-background"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewTicketOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateTicket}
              className="bg-primary text-primary-foreground font-bold"
            >
              Submit Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: Topic Guides Viewer */}
      {selectedTopic && (
        <Dialog open={!!selectedTopic} onOpenChange={() => setSelectedTopic(null)}>
          <DialogContent className="max-w-lg border-border bg-card">
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/25">
                  <selectedTopic.icon className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    {selectedTopic.title} Guides
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {selectedTopic.description}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-2 py-2 max-h-[60vh] overflow-y-auto">
              {selectedTopic.articles.map((article, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    toast.info(`Opening guide: "${article}"`, {
                      description: "Step-by-step documentation opened.",
                    })
                  }}
                >
                  <BookOpen className="size-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground leading-snug">
                      {article}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      3 min read &bull; Updated this week
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTopic(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG 5: View Ticket Thread - Modern Interactive Chat Screen */}
      {viewingTicket && (
        <Dialog open={!!viewingTicket} onOpenChange={() => setViewingTicket(null)}>
          <DialogContent className="max-w-2xl p-0 gap-0 border-border bg-card overflow-hidden rounded-2xl shadow-xl flex flex-col h-[650px] max-h-[90vh]">
            {/* 1. Chat Header Bar */}
            <div className="flex items-center justify-between p-4 px-5 border-b border-border bg-muted/30 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary border border-primary/25 font-bold text-sm">
                    {viewingTicket.thread.find((m) => m.role === "support")?.sender[0] || "S"}
                  </div>
                  {/* Live Green Online Status Indicator */}
                  <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-card shadow-xs" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground truncate">
                      {viewingTicket.thread.find((m) => m.role === "support")?.sender || "LMS Support Engineering"}
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-mono font-bold px-1.5 py-0 h-4 bg-background">
                      {viewingTicket.ticketId}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Specialist
                    </span>
                    <span>&bull;</span>
                    <span className="truncate">{viewingTicket.topic}</span>
                  </p>
                </div>
              </div>

              {/* Status & Resolve Action */}
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  className={
                    viewingTicket.status === "In Progress"
                      ? "bg-blue-500/15 text-blue-600 border-blue-500/30 text-xs px-2.5 py-0.5"
                      : viewingTicket.status === "Resolved"
                      ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs px-2.5 py-0.5"
                      : "bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs px-2.5 py-0.5"
                  }
                >
                  {viewingTicket.status}
                </Badge>
                {viewingTicket.status !== "Resolved" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updated: TicketItem = {
                        ...viewingTicket,
                        status: "Resolved",
                        thread: [
                          ...viewingTicket.thread,
                          {
                            sender: "System Notification",
                            role: "support",
                            message: "This ticket was marked as resolved by Vikram Malhotra.",
                            time: "Just now",
                          },
                        ],
                      }
                      setTickets(tickets.map((t) => (t.id === updated.id ? updated : t)))
                      setViewingTicket(updated)
                      toast.success("Ticket marked as Resolved!")
                    }}
                    className="h-8 px-2.5 text-xs font-semibold border-border hover:bg-accent text-foreground"
                  >
                    Mark Resolved
                  </Button>
                )}
              </div>
            </div>

            {/* Ticket Subject Banner */}
            <div className="px-5 py-2.5 bg-background/60 border-b border-border/80 text-xs flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-muted-foreground font-medium shrink-0">Subject:</span>
                <span className="font-semibold text-foreground truncate">{viewingTicket.subject}</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                Started {viewingTicket.createdAt}
              </span>
            </div>

            {/* 2. Chat Conversation Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/10">
              {/* Date Separator Pill */}
              <div className="flex items-center justify-center my-1">
                <span className="text-[10px] font-semibold text-muted-foreground bg-background border border-border px-3 py-0.5 rounded-full shadow-2xs">
                  Today
                </span>
              </div>

              {viewingTicket.thread.map((msg, idx) => {
                const isUser = msg.role === "user"

                return (
                  <div
                    key={idx}
                    className={`flex items-end gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {/* Support Avatar on Left */}
                    {!isUser && (
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary border border-primary/25 font-bold text-xs">
                        {msg.sender[0]}
                      </div>
                    )}

                    {/* Chat Bubble */}
                    <div
                      className={`max-w-[78%] sm:max-w-[70%] space-y-1 ${
                        isUser ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                          isUser
                            ? "bg-primary text-primary-foreground rounded-tr-xs"
                            : "bg-card border border-border text-foreground rounded-tl-xs shadow-2xs"
                        }`}
                      >
                        {/* Sender Label in Bubble */}
                        <div
                          className={`text-[10px] font-bold mb-1 flex items-center justify-between gap-3 ${
                            isUser ? "text-primary-foreground/80" : "text-primary"
                          }`}
                        >
                          <span>{msg.sender}</span>
                          <span
                            className={`font-mono ${
                              isUser ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {msg.time}
                          </span>
                        </div>

                        {/* Message Content */}
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                      </div>

                      {/* Small Bottom Delivery Status for Outgoing */}
                      {isUser && (
                        <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground pe-1">
                          <span>Delivered</span>
                          <span className="text-primary font-bold">&bull; Read ✓✓</span>
                        </div>
                      )}
                    </div>

                    {/* User Avatar on Right */}
                    {isUser && (
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-xs">
                        V
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 3. Quick Suggestion Pills */}
            <div className="px-4 py-2 border-t border-border/80 bg-background/50 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
              <span className="text-[11px] text-muted-foreground shrink-0 font-medium">Quick reply:</span>
              {[
                "Working fine now, thanks!",
                "Still getting the error",
                "Please call me on phone",
                "Coordinates verified",
              ].map((pill, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTicketReplyText(pill)}
                  className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium text-foreground hover:bg-accent hover:border-primary/30 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* 4. Chat Input & Send Bar */}
            <div className="p-3.5 px-4 border-t border-border bg-card shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => toast.info("Attach file: JPG, PNG or PDF logs supported.")}
                  className="size-9 rounded-xl border-border text-muted-foreground hover:text-foreground hover:bg-accent shrink-0"
                  title="Attach screenshot or logs"
                >
                  <Paperclip className="size-4" />
                </Button>

                <div className="relative flex-1">
                  <Input
                    placeholder="Type a message to the engineering team... (Press Enter to send)"
                    value={ticketReplyText}
                    onChange={(e) => setTicketReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendReply()
                      }
                    }}
                    className="h-10 text-xs sm:text-sm border-border bg-background focus:border-primary text-foreground rounded-xl pe-10 shadow-xs"
                  />
                </div>

                <Button
                  size="sm"
                  onClick={handleSendReply}
                  disabled={!ticketReplyText.trim()}
                  className="h-10 px-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary/90 shrink-0 gap-1.5"
                >
                  <span>Send</span>
                  <Send className="size-3.5" />
                </Button>
              </div>

              <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground px-1">
                <span>Direct 2-way sync with engineering helpdesk</span>
                <button
                  type="button"
                  onClick={() => setViewingTicket(null)}
                  className="hover:underline text-muted-foreground hover:text-foreground font-medium"
                >
                  Close Chat &times;
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
