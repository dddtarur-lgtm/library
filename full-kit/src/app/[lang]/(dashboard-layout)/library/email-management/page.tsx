"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  AlertCircle,
  AtSign,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Download,
  FileCode,
  Mail,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { initialSmtpConfig } from "@/data/library-management-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConnectedEmailOauthCard } from "@/components/email/connected-email-oauth-card"
import { WebmailClient } from "@/components/email/webmail-client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function EmailManagementHubPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [smtpConfig, setSmtpConfig] = useState(initialSmtpConfig)

  const quotaPercent = Math.round((smtpConfig.sentToday / smtpConfig.dailySendingLimit) * 100)

  const recentEmails = [
    { id: "em-1", to: "aarav.patel@gmail.com", student: "Aarav Patel", subject: "Payment Receipt #REC-2026-904 (₹1,800)", template: "Fee Receipt (PDF)", time: "06:45 AM", status: "Delivered" },
    { id: "em-2", to: "priya.sharma@yahoo.com", student: "Priya Sharma", subject: "Membership Expiry Notice - 2 Days Left", template: "Plan Expiry Alert", time: "07:00 AM", status: "Delivered" },
    { id: "em-3", to: "deepa.nair@shelfspace.in", student: "Deepa Nair", subject: "Welcome to ShelfSpace LMS - Set Your Password", template: "Staff Activation", time: "Yesterday", status: "Delivered" },
    { id: "em-4", to: "sunil.invalid@email.com", student: "Sunil Parmar", subject: "Overdue Book Return Notice", template: "Due Reminder", time: "Yesterday", status: "Bounced" },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden space-y-4 p-3 sm:p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Mail className="size-4.5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Email Management & SMTP Server
            </h1>
            <p className="text-xs text-muted-foreground">
              Monitor daily transactional quotas, configure library or platform SMTP & inspect email delivery queues (PRD §15 & §38)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={ensureLocalizedPathname("/pages/email-management/smtp-config", lang)}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "h-8 text-xs gap-1.5 border-border rounded-md",
            })}
          >
            <Server className="size-3.5 text-primary" />
            <span>SMTP Server Setup</span>
          </Link>

          <Link
            href={ensureLocalizedPathname("/pages/email-management/templates", lang)}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "h-8 text-xs gap-1.5 border-border rounded-md",
            })}
          >
            <FileCode className="size-3.5 text-purple-600" />
            <span>Email Templates</span>
          </Link>

          <Link
            href={ensureLocalizedPathname("/pages/email-management/logs", lang)}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "h-8 text-xs gap-1.5 border-border rounded-md",
            })}
          >
            <Clock className="size-3.5 text-muted-foreground" />
            <span>Delivery Logs</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs: Webmail Client vs OAuth & SMTP vs Dispatches */}
      <Tabs defaultValue="webmail" className="w-full space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-2">
          <TabsList className="bg-muted/70 p-1 rounded-xl h-9">
            <TabsTrigger
              value="webmail"
              className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs"
            >
              <Mail className="size-3.5 text-primary" />
              <span>Webmail Client & Inbox</span>
            </TabsTrigger>
            <TabsTrigger
              value="oauth"
              className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs"
            >
              <Server className="size-3.5 text-emerald-600" />
              <span>1-Click OAuth & SMTP Setup</span>
            </TabsTrigger>
            <TabsTrigger
              value="dispatches"
              className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs"
            >
              <Clock className="size-3.5 text-blue-600" />
              <span>Outbox Dispatches</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[11px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1.5 py-0.5"
            >
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>OAuth Connected: apexstudyhub.library@gmail.com</span>
            </Badge>
          </div>
        </div>

        {/* Tab 1: Webmail Client matching user's uploaded screenshot */}
        <TabsContent value="webmail" className="m-0 focus-visible:ring-0">
          <WebmailClient />
        </TabsContent>

        {/* Tab 2: 1-Click OAuth & SMTP Relay */}
        <TabsContent value="oauth" className="m-0 space-y-4 focus-visible:ring-0">
          {/* PRD §38 Rule Banner */}
          <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground flex items-center gap-3">
            <Sparkles className="size-4 text-primary shrink-0" />
            <div className="space-y-0.5">
              <span className="font-semibold text-primary">Zero-Configuration Out-of-the-Box (PRD §38):</span>
              <p className="text-muted-foreground">
                The platform covers email infrastructure costs. Every library operates on the free shared <strong>Platform SMTP</strong> with 1,000 emails/day quota, or can connect its own custom Google Workspace / Microsoft 365 OAuth anytime.
              </p>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-border/60 bg-card/80 shadow-xs">
              <CardContent className="p-3.5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Daily Email Quota</span>
                  <Mail className="size-4 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground font-mono">
                  {smtpConfig.sentToday} / {smtpConfig.dailySendingLimit}
                </div>
                <Progress value={quotaPercent} className="h-1.5 mt-2" />
                <div className="text-[10px] text-muted-foreground pt-0.5">{quotaPercent}% daily limit consumed</div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80 shadow-xs">
              <CardContent className="p-3.5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">SMTP Engine</span>
                  <Server className="size-4 text-emerald-600" />
                </div>
                <div className="text-xl font-bold text-emerald-600 truncate">{smtpConfig.providerType}</div>
                <div className="text-[11px] text-muted-foreground font-mono">Port 587 (TLS Active)</div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80 shadow-xs">
              <CardContent className="p-3.5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Delivery Rate</span>
                  <CheckCircle2 className="size-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-foreground font-mono">99.2%</div>
                <div className="text-[11px] text-emerald-600 font-medium">SPF & DKIM Verified</div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80 shadow-xs">
              <CardContent className="p-3.5 space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Bounce Rate</span>
                  <AlertCircle className="size-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-foreground font-mono">0.8%</div>
                <div className="text-[11px] text-muted-foreground">Clean deliverability health</div>
              </CardContent>
            </Card>
          </div>

          {/* 1-Click OAuth Connect Card (Step 1-6 Implementation) */}
          <ConnectedEmailOauthCard />
        </TabsContent>

        {/* Tab 3: Transactional Outbox Dispatches */}
        <TabsContent value="dispatches" className="m-0 space-y-4 focus-visible:ring-0">
          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                Recent Transactional Dispatches
              </CardTitle>
              <CardDescription className="text-xs">
                Live outbox feed of system-generated receipts, expiry notices, and student credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold">Recipient</TableHead>
                    <TableHead className="text-xs font-bold">Subject Line</TableHead>
                    <TableHead className="text-xs font-bold">Template</TableHead>
                    <TableHead className="text-xs font-bold">Dispatch Time</TableHead>
                    <TableHead className="text-xs font-bold text-right">Delivery Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEmails.map((em) => (
                    <TableRow key={em.id} className="text-xs">
                      <TableCell>
                        <div className="font-semibold text-foreground">{em.student}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{em.to}</div>
                      </TableCell>

                      <TableCell className="font-medium text-foreground">{em.subject}</TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {em.template}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-mono text-muted-foreground text-[11px]">{em.time}</TableCell>

                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            em.status === "Delivered"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
                              : "bg-destructive/10 text-destructive border-destructive/20 text-[10px]"
                          }
                        >
                          {em.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

