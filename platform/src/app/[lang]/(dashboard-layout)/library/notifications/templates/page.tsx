"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  Bell,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Edit,
  Mail,
  MessageSquare,
  Power,
  Save,
  Send,
  Smartphone,
  Sparkles,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function NotificationTemplatesTriggersPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [triggers, setTriggers] = useState([
    { id: "trig-1", name: "Membership Expiry (7 Days Prior)", event: "Plan expiration approaching", channel: "Push + In-App", timing: "09:00 AM (7d before)", enabled: true },
    { id: "trig-2", name: "Membership Expiry (1 Day Urgent)", event: "Plan expires tomorrow", channel: "Push + SMS + Email", timing: "10:00 AM (1d before)", enabled: true },
    { id: "trig-3", name: "Grace Period Entry Alert", event: "Plan expired today", channel: "Modal Dialog", timing: "Instant upon app open", enabled: true },
    { id: "trig-4", name: "Overdue Book Lending Fine", event: "Book due date elapsed", channel: "WhatsApp + Push", timing: "Daily 11:00 AM", enabled: true },
    { id: "trig-5", name: "Daily Absentee Alert to Parent", event: "Student absent 2 consecutive days", channel: "SMS / WhatsApp", timing: "Evening 07:00 PM", enabled: false },
    { id: "trig-6", name: "Welcome Credential & ID Card", event: "Student join request approved", channel: "Email (SMTP) + Push", timing: "Instant on approval", enabled: true },
  ])

  const toggleTrigger = (id: string) => {
    setTriggers(
      triggers.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden space-y-4 p-3 sm:p-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href={ensureLocalizedPathname("/pages/notifications", lang)}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0",
          })}
        >
          <ChevronLeft className="size-4" />
          <span>Back to Notifications Hub</span>
        </Link>
        <span className="text-xs font-mono text-muted-foreground">
          Automated System Triggers & Templates (PRD §21.1)
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            Automated Notification Triggers & Events
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure system auto-dispatches for plan expirations, overdue books, fee balances & welcome credentials (PRD §21.1)
          </p>
        </div>
      </div>

      {/* Triggers Table */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold">Automation Trigger Name</TableHead>
                <TableHead className="text-xs font-bold">Trigger Event</TableHead>
                <TableHead className="text-xs font-bold">Channels</TableHead>
                <TableHead className="text-xs font-bold">Dispatch Timing</TableHead>
                <TableHead className="text-xs font-bold text-center">Active</TableHead>
                <TableHead className="text-xs font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {triggers.map((t) => (
                <TableRow key={t.id} className="text-xs">
                  <TableCell>
                    <div className="font-semibold text-foreground">{t.name}</div>
                  </TableCell>

                  <TableCell className="text-muted-foreground text-[11px]">
                    {t.event}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {t.channel}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-mono text-muted-foreground text-[11px]">
                    {t.timing}
                  </TableCell>

                  <TableCell className="text-center">
                    <Switch
                      checked={t.enabled}
                      onCheckedChange={() => toggleTrigger(t.id)}
                      className="scale-75"
                    />
                  </TableCell>

                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
                      <Edit className="size-3" />
                      <span>Edit Template</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

