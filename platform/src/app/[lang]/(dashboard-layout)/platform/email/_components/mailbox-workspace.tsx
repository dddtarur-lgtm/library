"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Archive,
  ChevronLeft,
  FileCode2,
  FileText,
  Forward,
  Inbox,
  Mail,
  MailOpen,
  MoreHorizontal,
  Paperclip,
  Plus,
  Printer,
  Reply,
  ReplyAll,
  Save,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  SquarePen,
  Star,
  Tag,
  Trash2,
} from "lucide-react"

import type {
  EmailMessage,
  EmailTemplateRecord,
  MailFolder,
  MailLabel,
} from "./email-types"

import { initialAllLibrariesList } from "@/data/platform/platform-data"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea"
import { LibraryAvatar } from "@/components/platform/library-logo"
import {
  INITIAL_EMAIL_MESSAGES,
  INITIAL_EMAIL_TEMPLATES,
  INITIAL_MAIL_LABELS,
} from "./email-types"

const FOLDER_ITEMS: { id: MailFolder; label: string; icon: typeof Inbox }[] = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "starred", label: "Starred", icon: Star },
  { id: "sent", label: "Sent", icon: Send },
  { id: "drafts", label: "Drafts", icon: FileText },
  { id: "templates", label: "Templates", icon: FileCode2 },
  { id: "archived", label: "Archived", icon: Archive },
  { id: "spam", label: "Spam", icon: ShieldAlert },
  { id: "trash", label: "Trash", icon: Trash2 },
]

export function MailboxWorkspace() {
  const [messages, setMessages] = useState<EmailMessage[]>(
    INITIAL_EMAIL_MESSAGES
  )
  const [templates, setTemplates] = useState<EmailTemplateRecord[]>(
    INITIAL_EMAIL_TEMPLATES
  )
  const [labels, setLabels] = useState<MailLabel[]>(INITIAL_MAIL_LABELS)
  const [activeFolder, setActiveFolder] = useState<MailFolder>("inbox")
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const [listTab, setListTab] = useState<"all" | "unread" | "starred">("all")
  const [templateLangTab, setTemplateLangTab] = useState<
    "all" | "en" | "hi" | "gu"
  >("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  )

  // Inline Reply/Forward state
  const [replyMode, setReplyMode] = useState<"reply" | "forward" | null>(null)
  const [replyText, setReplyText] = useState("")

  // Compose Modal state
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeTo, setComposeTo] = useState("")
  const [composeSubject, setComposeSubject] = useState("")
  const [composeBody, setComposeBody] = useState("")
  const [composeLabel, setComposeLabel] = useState("support")

  // Add Label Modal state
  const [labelDialogOpen, setLabelDialogOpen] = useState(false)
  const [newLabelName, setNewLabelName] = useState("")

  const isTemplatesMode = !activeLabel && activeFolder === "templates"

  const folderCounts = useMemo(() => {
    const inboxUnread = messages.filter(
      (m) => m.folder === "inbox" && m.unread
    ).length
    const starredCount = messages.filter((m) => m.starred).length
    const draftsCount = messages.filter((m) => m.folder === "drafts").length

    return {
      inbox: inboxUnread,
      starred: starredCount,
      drafts: draftsCount,
      templates: templates.length,
    }
  }, [messages, templates.length])

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return templates.filter((tpl) => {
      if (templateLangTab !== "all" && tpl.language !== templateLangTab) {
        return false
      }
      if (!q) return true
      return (
        tpl.name.toLowerCase().includes(q) ||
        tpl.subject.toLowerCase().includes(q) ||
        tpl.body.toLowerCase().includes(q)
      )
    })
  }, [templates, templateLangTab, searchQuery])

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  )

  const updateSelectedTemplate = (patch: Partial<EmailTemplateRecord>) => {
    if (!selectedTemplate) return
    setTemplates((prev) =>
      prev.map((item) =>
        item.id === selectedTemplate.id ? { ...item, ...patch } : item
      )
    )
  }

  const insertTemplateVariable = (variable: string) => {
    if (!selectedTemplate) return
    const needsSpace =
      selectedTemplate.body.length > 0 &&
      !selectedTemplate.body.endsWith(" ") &&
      !selectedTemplate.body.endsWith("\n")
    updateSelectedTemplate({
      body: `${selectedTemplate.body}${needsSpace ? " " : ""}${variable}`,
    })
  }

  const handleUseTemplateInCompose = (tpl: EmailTemplateRecord) => {
    setComposeSubject(tpl.subject)
    setComposeBody(tpl.body)
    setComposeOpen(true)
  }

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return messages.filter((msg) => {
      if (activeLabel) {
        if (!msg.labels.includes(activeLabel)) return false
      } else if (activeFolder === "starred") {
        if (!msg.starred) return false
      } else if (msg.folder !== activeFolder) {
        return false
      }

      if (listTab === "unread" && !msg.unread) return false
      if (listTab === "starred" && !msg.starred) return false

      if (!q) return true
      return (
        msg.senderName.toLowerCase().includes(q) ||
        msg.senderEmail.toLowerCase().includes(q) ||
        msg.subject.toLowerCase().includes(q) ||
        msg.snippet.toLowerCase().includes(q)
      )
    })
  }, [messages, activeFolder, activeLabel, listTab, searchQuery])

  const selectedEmail = useMemo(
    () => messages.find((m) => m.id === selectedId) ?? null,
    [messages, selectedId]
  )

  const handleSelectEmail = (msg: EmailMessage) => {
    setSelectedId(msg.id)
    setReplyMode(null)
    setReplyText("")
    if (msg.unread) {
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, unread: false } : m))
      )
    }
  }

  const toggleStar = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m))
    )
  }

  const toggleUnread = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, unread: !m.unread } : m))
    )
  }

  const moveEmail = (
    id: string,
    targetFolder: EmailMessage["folder"],
    label: string
  ) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, folder: targetFolder } : m))
    )
    if (selectedId === id) {
      setSelectedId(null)
    }
    toast.success(`Moved to ${label}`)
  }

  const handleSendReply = () => {
    if (!selectedEmail || !replyText.trim()) {
      toast.error("Please write a message first.")
      return
    }

    const sentCopy: EmailMessage = {
      id: `em-${Date.now()}`,
      folder: "sent",
      senderName: "LMS Platform Desk",
      senderEmail: "support@lmsplatform.com",
      subject:
        replyMode === "forward"
          ? `Fwd: ${selectedEmail.subject}`
          : `Re: ${selectedEmail.subject}`,
      snippet: replyText.trim().slice(0, 75),
      body: replyText.trim(),
      dateShort: "Just now",
      timestamp: "Today, Just now",
      unread: false,
      starred: false,
      labels: selectedEmail.labels,
    }

    setMessages((prev) => [sentCopy, ...prev])
    setReplyMode(null)
    setReplyText("")
    toast.success(
      replyMode === "forward" ? "Email forwarded" : "Reply sent to recipient"
    )
  }

  const handleSendCompose = (asDraft: boolean) => {
    if (!composeSubject.trim() || (!asDraft && !composeTo.trim())) {
      toast.error("Enter recipient and subject.")
      return
    }

    const created: EmailMessage = {
      id: `em-${Date.now()}`,
      folder: asDraft ? "drafts" : "sent",
      senderName: asDraft ? "Draft" : composeTo.trim(),
      senderEmail: composeTo.trim() || "draft@lmsplatform.com",
      subject: composeSubject.trim(),
      snippet: composeBody.trim().slice(0, 75) || "(No preview text)",
      body: composeBody.trim(),
      dateShort: "Just now",
      timestamp: "Today, Just now",
      unread: false,
      starred: false,
      labels: [composeLabel],
    }

    setMessages((prev) => [created, ...prev])
    setComposeOpen(false)
    setComposeTo("")
    setComposeSubject("")
    setComposeBody("")
    toast.success(asDraft ? "Saved to Drafts" : "Email Sent")
  }

  const handleAddLabel = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = newLabelName.trim()
    if (!clean) return
    const id = clean.toLowerCase().replace(/\s+/g, "-")
    setLabels((prev) => [
      ...prev,
      { id, name: clean, colorClass: "text-primary" },
    ])
    setNewLabelName("")
    setLabelDialogOpen(false)
    toast.success(`Added label "${clean}"`)
  }

  return (
    <div className="rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[580px] md:h-[calc(100vh-14.5rem)]">
      {/* LEFT PANE: Compose + Folders + Labels */}
      <aside className="w-full md:w-[215px] shrink-0 border-b md:border-b-0 md:border-r border-border/70 p-3 flex flex-col gap-4 bg-card">
        <Button
          type="button"
          onClick={() => setComposeOpen(true)}
          className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 font-bold gap-2 rounded-lg"
        >
          <SquarePen className="size-4" />
          Compose Mail
        </Button>

        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
          {FOLDER_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = !activeLabel && activeFolder === item.id
            const count =
              item.id === "inbox"
                ? folderCounts.inbox
                : item.id === "starred"
                  ? folderCounts.starred
                  : item.id === "drafts"
                    ? folderCounts.drafts
                    : item.id === "templates"
                      ? folderCounts.templates
                      : 0

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveLabel(null)
                  setActiveFolder(item.id)
                  setSelectedId(null)
                  setSelectedTemplateId(null)
                }}
                className={cn(
                  "flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </span>
                {count > 0 && (
                  <span className="text-[11px] font-bold tabular-nums text-foreground">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="hidden md:block pt-2 border-t border-border/60 space-y-1.5">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Labels
            </span>
            <button
              type="button"
              onClick={() => setLabelDialogOpen(true)}
              className="size-5 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              title="Add label"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {labels.map((lbl) => {
              const isSelected = activeLabel === lbl.id
              return (
                <button
                  key={lbl.id}
                  type="button"
                  onClick={() => {
                    setActiveLabel(isSelected ? null : lbl.id)
                    setSelectedId(null)
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                    isSelected
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Tag className={cn("size-3.5 shrink-0", lbl.colorClass)} />
                  <span className="truncate">{lbl.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </aside>

      {/* MIDDLE PANE: Search + Filter Tabs + Conversation / Template List */}
      <section
        className={cn(
          "w-full md:w-[320px] lg:w-[350px] shrink-0 border-b md:border-b-0 md:border-r border-border/70 flex flex-col bg-card/60",
          (isTemplatesMode ? selectedTemplate : selectedEmail)
            ? "hidden md:flex"
            : "flex"
        )}
      >
        <div className="p-3 space-y-2.5 border-b border-border/70">
          <div className="relative">
            <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isTemplatesMode ? "Search templates..." : "Search email..."
              }
              className="pl-8 h-8.5 text-xs bg-background"
            />
          </div>

          {isTemplatesMode ? (
            <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted/40 p-1">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "en", label: "EN" },
                  { id: "hi", label: "HI" },
                  { id: "gu", label: "GU" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTemplateLangTab(tab.id)}
                  className={cn(
                    "py-1 rounded-md text-xs font-semibold transition-all",
                    templateLangTab === tab.id
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/40 p-1">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "unread", label: "Unread" },
                  { id: "starred", label: "Starred" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setListTab(tab.id)}
                  className={cn(
                    "py-1 rounded-md text-xs font-semibold transition-all",
                    listTab === tab.id
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {isTemplatesMode ? (
            filteredTemplates.length === 0 ? (
              <div className="py-16 px-4 text-center text-xs text-muted-foreground">
                No templates match your search.
              </div>
            ) : (
              filteredTemplates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setSelectedTemplateId(tpl.id)
                      }
                    }}
                    className={cn(
                      "px-3 py-3 cursor-pointer transition-colors flex items-start gap-2.5 text-left",
                      isSelected
                        ? "bg-muted/75 border-l-2 border-l-primary"
                        : "hover:bg-muted/35"
                    )}
                  >
                    <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <FileCode2 className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-foreground truncate">
                          {tpl.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="h-4 px-1.5 text-[10px] uppercase shrink-0"
                        >
                          {tpl.language}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium text-foreground/85 truncate">
                        {tpl.subject}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {tpl.variables.length} merge variables
                      </p>
                    </div>
                  </div>
                )
              })
            )
          ) : filteredMessages.length === 0 ? (
            <div className="py-16 px-4 text-center text-xs text-muted-foreground">
              No emails in this view.
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isSelected = selectedId === msg.id
              return (
                <div
                  key={msg.id}
                  onClick={() => handleSelectEmail(msg)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleSelectEmail(msg)
                    }
                  }}
                  className={cn(
                    "px-3 py-3 cursor-pointer transition-colors flex items-start gap-2.5 text-left",
                    isSelected
                      ? "bg-muted/75 border-l-2 border-l-primary"
                      : "hover:bg-muted/35"
                  )}
                >
                  <LibraryAvatar
                    name={msg.senderName}
                    code={msg.libraryCode}
                    src={msg.logo}
                    size="sm"
                    shape="circle"
                  />

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-xs truncate",
                          msg.unread
                            ? "font-bold text-foreground"
                            : "font-medium text-muted-foreground"
                        )}
                      >
                        {msg.senderName} • {msg.dateShort}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {msg.unread && (
                          <span className="size-1.5 rounded-full bg-primary" />
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="size-5 rounded hover:bg-muted flex items-center justify-center text-muted-foreground"
                            >
                              <MoreHorizontal className="size-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => toggleUnread(msg.id)}
                            >
                              <MailOpen className="size-3.5 mr-2" />
                              Mark as {msg.unread ? "Read" : "Unread"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                moveEmail(msg.id, "archived", "Archived")
                              }
                            >
                              <Archive className="size-3.5 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                moveEmail(msg.id, "trash", "Trash")
                              }
                            >
                              <Trash2 className="size-3.5 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-xs truncate",
                          msg.unread
                            ? "font-bold text-foreground"
                            : "font-semibold text-foreground/90"
                        )}
                      >
                        {msg.subject}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => toggleStar(msg.id, e)}
                        className="shrink-0 text-muted-foreground hover:text-amber-500"
                        title="Toggle star"
                      >
                        <Star
                          className={cn(
                            "size-3.5",
                            msg.starred && "fill-amber-400 text-amber-400"
                          )}
                        />
                      </button>
                    </div>

                    <p className="text-[11px] text-muted-foreground truncate">
                      {msg.snippet}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* RIGHT PANE: Empty State, Template Options, or Email Reader View */}
      <main
        className={cn(
          "flex-1 flex flex-col min-w-0 bg-background/50",
          !(isTemplatesMode ? selectedTemplate : selectedEmail)
            ? "hidden md:flex"
            : "flex"
        )}
      >
        {isTemplatesMode ? (
          !selectedTemplate ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
              <div className="size-12 rounded-full border border-border bg-muted/40 flex items-center justify-center text-muted-foreground">
                <FileCode2 className="size-5" />
              </div>
              <div className="space-y-1 max-w-xs">
                <h3 className="text-sm font-bold text-foreground">
                  No Template Selected
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select a template from the list on the left to view or edit
                  its subject, body, language, and merge variables.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Top Template Action Bar */}
              <div className="px-4 py-2.5 border-b border-border/70 flex flex-wrap items-center justify-between gap-2 bg-card/40">
                <div className="flex items-center gap-2 min-w-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 md:hidden"
                    onClick={() => setSelectedTemplateId(null)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <FileCode2 className="size-4 text-primary shrink-0" />
                  <span className="text-sm font-bold text-foreground truncate">
                    {selectedTemplate.name}
                  </span>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {selectedTemplate.language}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1.5 px-2.5 text-xs"
                    onClick={() => handleUseTemplateInCompose(selectedTemplate)}
                  >
                    <SquarePen className="size-3.5" />
                    Use in Compose
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1.5 px-2.5 text-xs"
                    onClick={() =>
                      toast.success(
                        `Sent test preview of "${selectedTemplate.name}"`
                      )
                    }
                  >
                    <Send className="size-3.5" />
                    Send Test
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 gap-1.5 px-2.5 text-xs"
                    onClick={() =>
                      toast.success(
                        `Saved "${selectedTemplate.name}" (${selectedTemplate.language.toUpperCase()})`
                      )
                    }
                  >
                    <Save className="size-3.5" />
                    Save
                  </Button>
                </div>
              </div>

              {/* Template Options & Editor */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="mb-tpl-subject"
                      className="text-xs font-medium"
                    >
                      Email Subject
                    </Label>
                    <Input
                      id="mb-tpl-subject"
                      value={selectedTemplate.subject}
                      onChange={(e) =>
                        updateSelectedTemplate({ subject: e.target.value })
                      }
                      className="h-9 text-sm bg-card"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Language</Label>
                    <Select
                      value={selectedTemplate.language}
                      onValueChange={(v) =>
                        updateSelectedTemplate({
                          language: v as EmailTemplateRecord["language"],
                        })
                      }
                    >
                      <SelectTrigger className="h-9 text-xs bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English (EN)</SelectItem>
                        <SelectItem value="hi">Hindi (HI)</SelectItem>
                        <SelectItem value="gu">Gujarati (GU)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label
                      htmlFor="mb-tpl-body"
                      className="text-xs font-medium"
                    >
                      Message Body
                    </Label>
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="mr-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Sparkles className="size-3" />
                        Insert:
                      </span>
                      {selectedTemplate.variables.map((variable) => (
                        <button
                          key={variable}
                          type="button"
                          onClick={() => insertTemplateVariable(variable)}
                          className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] text-foreground transition-colors hover:bg-muted"
                        >
                          {variable}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    id="mb-tpl-body"
                    rows={10}
                    value={selectedTemplate.body}
                    onChange={(e) =>
                      updateSelectedTemplate({ body: e.target.value })
                    }
                    className="font-mono text-xs leading-relaxed bg-card"
                  />
                </div>
              </div>
            </>
          )
        ) : !selectedEmail ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
            <div className="size-12 rounded-full border border-border bg-muted/40 flex items-center justify-center text-muted-foreground">
              <Mail className="size-5" />
            </div>
            <div className="space-y-1 max-w-xs">
              <h3 className="text-sm font-bold text-foreground">
                No Email Selected
              </h3>
              <p className="text-xs text-muted-foreground">
                Select an email from the conversation list on the left to read
                its content.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Top Reader Action Bar */}
            <div className="px-4 py-2.5 border-b border-border/70 flex items-center justify-between gap-2 bg-card/40">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 md:hidden"
                  onClick={() => setSelectedId(null)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => toggleStar(selectedEmail.id)}
                  title="Star"
                >
                  <Star
                    className={cn(
                      "size-4",
                      selectedEmail.starred && "fill-amber-400 text-amber-400"
                    )}
                  />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() =>
                    moveEmail(selectedEmail.id, "archived", "Archived")
                  }
                  title="Archive"
                >
                  <Archive className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => moveEmail(selectedEmail.id, "spam", "Spam")}
                  title="Report Spam"
                >
                  <ShieldAlert className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 hover:text-destructive"
                  onClick={() => moveEmail(selectedEmail.id, "trash", "Trash")}
                  title="Delete"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setReplyMode("reply")}
                  title="Reply"
                >
                  <Reply className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setReplyMode("reply")}
                  title="Reply All"
                >
                  <ReplyAll className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setReplyMode("forward")}
                  title="Forward"
                >
                  <Forward className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => {
                    if (typeof window !== "undefined") window.print()
                  }}
                  title="Print"
                >
                  <Printer className="size-4" />
                </Button>
              </div>
            </div>

            {/* Email Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedEmail.labels.map((lid) => {
                    const lbl = labels.find((l) => l.id === lid)
                    return (
                      <Badge
                        key={lid}
                        variant="outline"
                        className="text-[10px] font-semibold capitalize"
                      >
                        {lbl?.name ?? lid}
                      </Badge>
                    )
                  })}
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {selectedEmail.subject}
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/70">
                <div className="flex items-center gap-3 min-w-0">
                  <LibraryAvatar
                    name={selectedEmail.senderName}
                    code={selectedEmail.libraryCode}
                    src={selectedEmail.logo}
                    size="md"
                    shape="circle"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {selectedEmail.senderName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedEmail.senderEmail}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  {selectedEmail.timestamp}
                </span>
              </div>

              <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {selectedEmail.body}
              </div>

              {selectedEmail.attachment && (
                <div className="inline-flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
                  <Paperclip className="size-3.5 text-primary" />
                  <span className="font-semibold">
                    {selectedEmail.attachment.name}
                  </span>
                  <span className="text-muted-foreground">
                    ({selectedEmail.attachment.size})
                  </span>
                </div>
              )}

              {/* Inline Reply / Forward Box */}
              {replyMode && (
                <div className="rounded-xl border border-border bg-card p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      {replyMode === "forward"
                        ? `Forward: ${selectedEmail.subject}`
                        : `Reply to ${selectedEmail.senderName}`}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setReplyMode(null)}
                    >
                      Discard
                    </Button>
                  </div>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    rows={3}
                    className="text-xs"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSendReply}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold gap-1.5"
                    >
                      <Send className="size-3.5" />
                      {replyMode === "forward" ? "Forward" : "Send Reply"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Compose Mail Modal */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <SquarePen className="size-4 text-primary" />
              Compose Email
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Quick Pick Library Email
              </Label>
              <Select onValueChange={(v) => setComposeTo(v)}>
                <SelectTrigger className="h-8.5 text-xs">
                  <SelectValue placeholder="Choose tenant library..." />
                </SelectTrigger>
                <SelectContent>
                  {initialAllLibrariesList.map((lib) => (
                    <SelectItem key={lib.id} value={lib.ownerEmail}>
                      {lib.name} ({lib.ownerEmail})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  To *
                </Label>
                <Input
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="recipient@library.in"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Label
                </Label>
                <Select value={composeLabel} onValueChange={setComposeLabel}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {labels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Subject *
              </Label>
              <Input
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Subject line..."
                className="h-9 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Message
              </Label>
              <Textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Write email message..."
                rows={5}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSendCompose(true)}
            >
              Save Draft
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleSendCompose(false)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold gap-1.5"
            >
              <Send className="size-3.5" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Label Modal */}
      <Dialog open={labelDialogOpen} onOpenChange={setLabelDialogOpen}>
        <DialogContent className="sm:max-w-xs bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">New Label</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddLabel} className="space-y-3">
            <Input
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="e.g. Priority"
              className="h-9 text-xs"
              required
            />
            <DialogFooter>
              <Button
                type="submit"
                size="sm"
                className="bg-primary text-primary-foreground font-bold"
              >
                Create Label
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
