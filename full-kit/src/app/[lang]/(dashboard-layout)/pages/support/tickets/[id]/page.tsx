"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  LifeBuoy,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Send,
  Shield,
  Sparkles,
  User,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

import {
  initialSupportTickets,
  type SupportTicketItem,
} from "@/data/library-management-data"

export default function TicketDetailPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"
  const id = (params?.id as string) || "tick-01"

  const defaultTicket = initialSupportTickets.find((t) => t.id === id) || initialSupportTickets[0]
  const [ticket, setTicket] = useState<SupportTicketItem>(defaultTicket)
  const [replyText, setReplyText] = useState("")

  const handleSendReply = () => {
    if (!replyText.trim()) return

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderName: "Dr. Rajesh Sharma",
      senderRole: "Library Owner" as const,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      timestamp: "Just now",
      text: replyText.trim(),
    }

    setTicket((prev) => ({
      ...prev,
      updatedAt: "Just now",
      messagesCount: prev.messagesCount + 1,
      messages: [...prev.messages, newMsg],
    }))

    setReplyText("")
  }

  const toggleResolved = () => {
    setTicket((prev) => ({
      ...prev,
      status: prev.status === "Resolved" ? "In Progress" : "Resolved",
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={ensureLocalizedPathname("/pages/support", lang)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="size-3" />
              Support Center
            </Link>
            <ChevronRight className="size-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-primary">{ticket.ticketNo}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">{ticket.subject}</h1>
            <Badge variant="outline" className="font-mono text-xs">
              {ticket.ticketNo}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={ticket.status === "Resolved" ? "outline" : "default"}
            size="sm"
            className="h-9 gap-1.5"
            onClick={toggleResolved}
          >
            <CheckCircle2 className="size-4" />
            {ticket.status === "Resolved" ? "Reopen Ticket" : "Mark as Resolved"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Chat Conversation Thread */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/60 bg-card/80 flex flex-col h-[600px]">
            <CardHeader className="border-b border-border/40 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">Support Conversation Thread</CardTitle>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {ticket.messages.length} messages exchanged
                </span>
              </div>
            </CardHeader>

            {/* Messages Scroll Area */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {ticket.messages.map((msg) => {
                const isOwner = msg.senderRole === "Library Owner"
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isOwner ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <Avatar className="size-8 border border-border/60 shrink-0">
                      <AvatarImage src={msg.avatar} alt={msg.senderName} />
                      <AvatarFallback>{msg.senderName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div
                      className={`max-w-[75%] rounded-xl p-3 text-xs leading-relaxed ${
                        isOwner
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted/50 border border-border/60 rounded-tl-none text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="font-semibold text-[11px]">
                          {msg.senderName}
                        </span>
                        <span
                          className={`text-[9px] font-mono ${
                            isOwner ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      </div>

                      <p className="whitespace-pre-line text-xs">{msg.text}</p>

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 pt-1.5 border-t border-border/20">
                          {msg.attachments.map((att, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-[10px] gap-1 cursor-pointer bg-background/20"
                            >
                              <Paperclip className="size-2.5" />
                              {att}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>

            {/* Composer Footer */}
            <div className="border-t border-border/40 p-3 bg-muted/10">
              <div className="space-y-2">
                <Textarea
                  placeholder="Type your response to the platform specialist..."
                  rows={2}
                  className="text-xs resize-none"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendReply()
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
                    <Paperclip className="size-3" />
                    Attach Screenshot
                  </Button>
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSendReply}>
                    <Send className="size-3" />
                    Send Reply
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Ticket Metadata & SLA */}
        <div className="space-y-6">
          <Card className="border-border/60 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Ticket Meta Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  variant="outline"
                  className={
                    ticket.status === "In Progress"
                      ? "border-blue-500/30 text-blue-600 bg-blue-500/5 text-[10px]"
                      : ticket.status === "Resolved"
                      ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5 text-[10px]"
                      : "border-amber-500/30 text-amber-600 bg-amber-500/5 text-[10px]"
                  }
                >
                  {ticket.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium">{ticket.category}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Priority:</span>
                <Badge variant="secondary" className="text-[10px]">
                  {ticket.priority}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Created At:</span>
                <span className="font-mono text-muted-foreground">{ticket.createdAt}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Assigned Team:</span>
                <span className="font-semibold text-primary">Core Billing &amp; Infrastructure</span>
              </div>

              <div className="rounded-lg bg-emerald-500/10 p-2.5 border border-emerald-500/20 text-[11px] text-muted-foreground mt-2">
                <div className="flex items-center gap-1 font-semibold text-emerald-600">
                  <Shield className="size-3" />
                  SLA Response Guarantee
                </div>
                <p className="mt-0.5">
                  Your ticket is under active monitoring by senior platform engineers.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

