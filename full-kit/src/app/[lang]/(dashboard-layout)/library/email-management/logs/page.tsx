"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Search,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function EmailDeliveryLogsPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [logs, setLogs] = useState([
    { id: "log-1", to: "aarav.patel@gmail.com", student: "Aarav Patel", template: "Fee Receipt (PDF)", sentAt: "Today, 06:45 AM", status: "Delivered", responseCode: "250 OK (Message accepted)" },
    { id: "log-2", to: "priya.sharma@yahoo.com", student: "Priya Sharma", template: "Plan Expiry Alert", sentAt: "Today, 07:00 AM", status: "Delivered", responseCode: "250 OK (Delivered to MX)" },
    { id: "log-3", to: "sunil.invalid@email.com", student: "Sunil Parmar", template: "Due Reminder", sentAt: "Yesterday, 04:12 PM", status: "Bounced", responseCode: "550 5.1.1 User unknown mailbox" },
    { id: "log-4", to: "rohan.v@outlook.com", student: "Rohan Verma", template: "Welcome Student", sentAt: "Yesterday, 02:00 PM", status: "Delivered", responseCode: "250 OK (Delivered)" },
  ])

  const [retryToast, setRetryToast] = useState(false)

  const handleRetryFailed = () => {
    setRetryToast(true)
    setTimeout(() => setRetryToast(false), 3000)
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden space-y-4 p-3 sm:p-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href={ensureLocalizedPathname("/pages/email-management", lang)}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0",
          })}
        >
          <span>← Back to Email Hub</span>
        </Link>
        <span className="text-xs font-mono text-muted-foreground">
          SMTP Server Delivery Logs & SMTP Response Codes (PRD §15.1)
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            Email Delivery Logs & Dispatch Queue
          </h1>
          <p className="text-xs text-muted-foreground">
            Audit sent transactional emails, inspect bounce error codes and retry queued or failed dispatches (PRD §15.1)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {retryToast && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs py-1">
              ✓ Queued 1 bounced email for re-transmission
            </Badge>
          )}

          <Button
            size="sm"
            onClick={handleRetryFailed}
            variant="outline"
            className="h-8 text-xs gap-1.5 border-border"
          >
            <RefreshCw className="size-3.5 text-primary" />
            <span>Retry Failed Mails</span>
          </Button>

          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border">
            <Download className="size-3.5" />
            <span>Export Logs</span>
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold">Recipient</TableHead>
                <TableHead className="text-xs font-bold">Template Type</TableHead>
                <TableHead className="text-xs font-bold">Dispatched At</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-xs font-bold text-right">SMTP Server Response</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id} className="text-xs">
                  <TableCell>
                    <div className="font-semibold text-foreground">{l.student}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{l.to}</div>
                  </TableCell>

                  <TableCell className="font-medium text-foreground">{l.template}</TableCell>

                  <TableCell className="font-mono text-muted-foreground text-[11px]">{l.sentAt}</TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        l.status === "Delivered"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
                          : "bg-destructive/10 text-destructive border-destructive/20 text-[10px]"
                      }
                    >
                      {l.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right font-mono text-[11px] text-muted-foreground">
                    {l.responseCode}
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

