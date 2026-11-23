"use client"

import { useMemo, useState } from "react"
import { platformService } from "@/services/platform-service"
import { toast } from "sonner"
import {
  BookOpen,
  CheckCircle2,
  Clock,
  LifeBuoy,
  Lock,
  MessageSquare,
  Search,
  Send,
} from "lucide-react"

import type { PlatformSupportTicket } from "@/data/platform/platform-data"

import { initialSupportTickets } from "@/data/platform/platform-data"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { KnowledgeBasePanel } from "./_components/kb-panel"
import { LibraryAvatar } from "@/components/platform/library-logo"

interface ThreadMessage {
  id: string
  author: string
  role: "Tenant" | "Support" | "Internal Note"
  time: string
  text: string
}

function priorityBadge(priority: PlatformSupportTicket["priority"]) {
  if (priority === "Urgent") {
    return (
      <Badge variant="secondary" className="bg-destructive/15 text-destructive">
        Urgent
      </Badge>
    )
  }
  if (priority === "High") {
    return (
      <Badge
        variant="secondary"
        className="bg-amber-500/15 text-amber-700 dark:text-amber-300"
      >
        High
      </Badge>
    )
  }
  return <Badge variant="outline">Normal</Badge>
}

function statusBadge(status: PlatformSupportTicket["status"]) {
  if (status === "Resolved") {
    return (
      <Badge
        variant="secondary"
        className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      >
        Resolved
      </Badge>
    )
  }
  if (status === "In Progress") {
    return (
      <Badge
        variant="secondary"
        className="bg-sky-500/15 text-sky-700 dark:text-sky-300"
      >
        In Progress
      </Badge>
    )
  }
  return <Badge className="bg-primary text-primary-foreground">Open</Badge>
}

export default function PlatformSupportPage() {
  const [activeTab, setActiveTab] = useState<"tickets" | "kb">("tickets")

  const [tickets, setTickets] = useState<PlatformSupportTicket[]>(
    initialSupportTickets
  )
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string>(
    initialSupportTickets[0]?.id ?? ""
  )
  const [replyText, setReplyText] = useState("")
  const [internalNote, setInternalNote] = useState(false)
  const [threads, setThreads] = useState<Record<string, ThreadMessage[]>>({})

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false
      if (priorityFilter !== "all" && t.priority !== priorityFilter) {
        return false
      }
      if (!q) return true
      return (
        t.subject.toLowerCase().includes(q) ||
        t.libraryName.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q)
      )
    })
  }, [tickets, search, statusFilter, priorityFilter])

  const activeTicket = useMemo(
    () => tickets.find((t) => t.id === selectedId) ?? filtered[0] ?? null,
    [tickets, selectedId, filtered]
  )

  const openCount = tickets.filter((t) => t.status !== "Resolved").length
  const urgentCount = tickets.filter(
    (t) => t.priority === "Urgent" && t.status !== "Resolved"
  ).length
  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length

  const activeMessages: ThreadMessage[] = useMemo(() => {
    if (!activeTicket) return []
    const base: ThreadMessage = {
      id: "init",
      author: activeTicket.contactPerson,
      role: "Tenant",
      time: activeTicket.createdTime,
      text: `Ticket raised under ${activeTicket.category}: "${activeTicket.subject}". Please assist our branch team as soon as possible.`,
    }
    return [base, ...(threads[activeTicket.id] ?? [])]
  }, [activeTicket, threads])

  const updateTicketStatus = async (
    status: PlatformSupportTicket["status"]
  ) => {
    if (!activeTicket) return
    setTickets((prev) =>
      prev.map((t) => (t.id === activeTicket.id ? { ...t, status } : t))
    )
    try {
      if (activeTicket.id && !activeTicket.id.startsWith("t-")) {
        await platformService.updateSupportTicket(activeTicket.id, { status })
      }
    } catch {
      // Handled locally
    }
    toast.success(`${activeTicket.ticketNumber} marked as ${status}`)
  }

  const handleSendReply = async () => {
    if (!activeTicket || !replyText.trim()) {
      toast.error("Please enter a message.")
      return
    }
    const messageContent = replyText.trim()
    const newMsg: ThreadMessage = {
      id: `msg-${Date.now()}`,
      author: "Super Admin",
      role: internalNote ? "Internal Note" : "Support",
      time: "Just now",
      text: messageContent,
    }
    setThreads((prev) => ({
      ...prev,
      [activeTicket.id]: [...(prev[activeTicket.id] ?? []), newMsg],
    }))
    if (!internalNote && activeTicket.status === "Open") {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeTicket.id ? { ...t, status: "In Progress" } : t
        )
      )
    }
    try {
      if (activeTicket.id && !activeTicket.id.startsWith("t-")) {
        await platformService.sendTicketMessage(activeTicket.id, messageContent)
      }
    } catch {
      // Handled locally
    }
    toast.success(
      internalNote
        ? "Internal note added to ticket"
        : `Reply sent to ${activeTicket.contactPerson}`
    )
    setReplyText("")
  }

  return (
    <section className="container space-y-5 py-5">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Support Tickets Helpdesk
            </h1>
            <Badge
              variant="secondary"
              className="bg-destructive/15 text-[11px] text-destructive"
            >
              {openCount} Open
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Triage library escalations, track SLA timers, and respond directly
            to branch owners.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-1">
          <button
            type="button"
            onClick={() => setActiveTab("tickets")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTab === "tickets"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            <LifeBuoy className="size-3.5" />
            Tickets Helpdesk
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("kb")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTab === "kb"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            <BookOpen className="size-3.5" />
            Knowledge Base
          </button>
        </div>
      </div>

      {activeTab === "kb" ? (
        <KnowledgeBasePanel />
      ) : (
        <>
          {/* KPI Strip */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Active Queue",
                value: openCount,
                sub: "Open & in-progress tickets",
                icon: MessageSquare,
                tone: "text-primary bg-primary/10",
              },
              {
                label: "Urgent SLA",
                value: urgentCount,
                sub: "Requires response < 2 hrs",
                icon: Clock,
                tone: "text-destructive bg-destructive/10",
              },
              {
                label: "Resolved",
                value: resolvedCount,
                sub: "Closed with tenant confirmation",
                icon: CheckCircle2,
                tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
              },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <Card
                  key={stat.label}
                  className="border-border bg-card shadow-sm"
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold tabular-nums text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {stat.sub}
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

          {/* Split-Pane Helpdesk */}
          <div className="grid overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:grid-cols-[350px_minmax(0,1fr)]">
            {/* Left Ticket Queue */}
            <div className="border-b border-border/70 lg:border-b-0 lg:border-r">
              <div className="space-y-2 border-b border-border/70 p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search ticket, library, subject..."
                    className="h-8 pl-8 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={priorityFilter}
                    onValueChange={setPriorityFilter}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Normal">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="max-h-[520px] divide-y divide-border/60 overflow-y-auto">
                {filtered.map((ticket) => {
                  const isSelected = activeTicket?.id === ticket.id
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => setSelectedId(ticket.id)}
                      className={`w-full px-3.5 py-3 text-left transition-colors ${
                        isSelected
                          ? "border-l-2 border-l-primary bg-muted/70"
                          : "hover:bg-muted/35"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-semibold text-primary">
                          {ticket.ticketNumber}
                        </span>
                        {priorityBadge(ticket.priority)}
                      </div>
                      <p className="mt-1 truncate text-xs font-semibold text-foreground">
                        {ticket.subject}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <span className="truncate">{ticket.libraryName}</span>
                        {statusBadge(ticket.status)}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right Conversation */}
            <div className="flex flex-col justify-between p-5">
              {!activeTicket ? (
                <div className="flex flex-1 flex-col items-center justify-center py-16 text-center text-xs text-muted-foreground">
                  Select a support ticket from the queue to inspect and reply.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-4">
                    <div className="flex items-center gap-3">
                      <LibraryAvatar
                        name={activeTicket.libraryName}
                        code={activeTicket.libraryCode}
                        src={activeTicket.logo}
                        size="md"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-bold text-foreground">
                            {activeTicket.subject}
                          </h2>
                          {statusBadge(activeTicket.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {activeTicket.libraryName} •{" "}
                          {activeTicket.contactPerson} • {activeTicket.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => updateTicketStatus("In Progress")}
                      >
                        Mark In Progress
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => updateTicketStatus("Resolved")}
                      >
                        <CheckCircle2 className="size-3.5" />
                        Resolve
                      </Button>
                    </div>
                  </div>

                  {/* Thread */}
                  <div className="max-h-[290px] space-y-3 overflow-y-auto pr-1">
                    {activeMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`rounded-lg border p-3 text-xs ${
                          msg.role === "Internal Note"
                            ? "border-amber-500/30 bg-amber-500/10"
                            : msg.role === "Support"
                              ? "border-primary/30 bg-primary/5"
                              : "border-border bg-muted/30"
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="font-semibold text-foreground">
                            {msg.author}{" "}
                            <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                              ({msg.role})
                            </span>
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {msg.time}
                          </span>
                        </div>
                        <p className="leading-relaxed text-foreground/90">
                          {msg.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Reply Composer */}
                  <div className="space-y-2 border-t border-border/70 pt-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Switch
                          checked={internalNote}
                          onCheckedChange={setInternalNote}
                        />
                        <Lock className="size-3" />
                        Internal Staff Note (hidden from library)
                      </label>
                      <span className="text-[11px] text-muted-foreground">
                        Assigned: {activeTicket.assignedRole}
                      </span>
                    </div>
                    <Textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={
                        internalNote
                          ? "Write an internal escalation note..."
                          : `Reply to ${activeTicket.contactPerson}...`
                      }
                      className="text-xs"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={handleSendReply}
                      >
                        <Send className="size-3.5" />
                        {internalNote ? "Save Internal Note" : "Send Reply"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
