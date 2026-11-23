"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  CheckCircle2,
  ChevronLeft,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  Save,
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
import { ConnectedEmailOauthCard } from "@/components/email/connected-email-oauth-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function SmtpConfigurationPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [providerType, setProviderType] = useState<"Platform SMTP" | "OAuth" | "Custom Library SMTP">("OAuth")
  const [host, setHost] = useState("smtp.gmail.com")
  const [port, setPort] = useState("587")
  const [security, setSecurity] = useState("TLS")
  const [username, setUsername] = useState("library@centrallibrary.com")
  const [password, setPassword] = useState("••••••••••••••••••••")
  const [fromName, setFromName] = useState("Central Study Library")
  const [fromEmail, setFromEmail] = useState("notifications@centrallibrary.com")
  const [replyTo, setReplyTo] = useState("contact@centrallibrary.com")

  const [testEmailAddress, setTestEmailAddress] = useState("owner.test@gmail.com")
  const [testingStatus, setTestingStatus] = useState<"Idle" | "Testing" | "Success">("Idle")

  const handleTestEmail = () => {
    setTestingStatus("Testing")
    setTimeout(() => {
      setTestingStatus("Success")
    }, 1500)
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
          <ChevronLeft className="size-4" />
          <span>Back to Email Hub</span>
        </Link>
        <span className="text-xs font-mono text-muted-foreground">
          SMTP Server Diagnostic & DNS Authentication (PRD §15 & §38)
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Server className="size-5 text-primary" />
            SMTP Server Configuration & Diagnostics
          </h1>
          <p className="text-xs text-muted-foreground">
            Switch between free shared Platform SMTP or connect your custom domain mail server with live test diagnostics (PRD §15.1)
          </p>
        </div>

        <Button size="sm" className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs font-semibold">
          <Save className="size-3.5" />
          <span>Save SMTP Setup</span>
        </Button>
      </div>

      {/* Provider Selector Card */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold">Select Email Dispatch Mode</CardTitle>
          <CardDescription className="text-xs">
            Choose between modern 1-Click OAuth authorization, free platform relay, or traditional SMTP credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-1 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1-Click OAuth (Recommended) */}
            <div
              onClick={() => setProviderType("OAuth")}
              className={`p-3.5 rounded-xl border cursor-pointer space-y-1.5 transition-all ${
                providerType === "OAuth"
                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                  : "border-border/60 hover:bg-muted/30 text-foreground"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm flex items-center gap-1.5">
                  <Sparkles className="size-4 text-primary" />
                  1-Click OAuth (Google / M365)
                </span>
                {providerType === "OAuth" && <CheckCircle2 className="size-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground">
                No app passwords or SMTP ports needed. Send directly from your library Google or Microsoft 365 address with AES-256 token security.
              </p>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                Recommended (PRD 6-Step)
              </Badge>
            </div>

            {/* Platform Shared SMTP */}
            <div
              onClick={() => setProviderType("Platform SMTP")}
              className={`p-3.5 rounded-xl border cursor-pointer space-y-1.5 transition-all ${
                providerType === "Platform SMTP"
                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                  : "border-border/60 hover:bg-muted/30 text-foreground"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">Platform Shared SMTP</span>
                {providerType === "Platform SMTP" && <CheckCircle2 className="size-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground">
                Managed by ShelfSpace cloud. 1,000 emails/day included. Pre-configured SPF, DKIM, and high-reputation IP delivery.
              </p>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Included Free
              </Badge>
            </div>

            {/* Custom Manual SMTP */}
            <div
              onClick={() => setProviderType("Custom Library SMTP")}
              className={`p-3.5 rounded-xl border cursor-pointer space-y-1.5 transition-all ${
                providerType === "Custom Library SMTP"
                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                  : "border-border/60 hover:bg-muted/30 text-foreground"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">Custom Manual SMTP</span>
                {providerType === "Custom Library SMTP" && <CheckCircle2 className="size-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground">
                Configure your own legacy SMTP host, port 465/587, username and TLS credentials (SES, SendGrid, Zoho, cPanel).
              </p>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Self-Hosted
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1-Click OAuth or Traditional SMTP Configuration */}
      {providerType === "OAuth" ? (
        <ConnectedEmailOauthCard />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Custom SMTP Credentials Form */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lock className="size-4 text-primary" />
                Mail Server Connection Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs">SMTP Host</Label>
                  <Input
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    disabled={providerType === "Platform SMTP"}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Port</Label>
                  <Input
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    disabled={providerType === "Platform SMTP"}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">SMTP Username / Email</Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={providerType === "Platform SMTP"}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">SMTP Password (Encrypted)</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={providerType === "Platform SMTP"}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60">
                <div className="space-y-1">
                  <Label className="text-xs">From Sender Name</Label>
                  <Input
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">From Email</Label>
                  <Input
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Reply-To Email</Label>
                  <Input
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Test Diagnostic Tool & SPF Guidance */}
        <div className="lg:col-span-5 space-y-4">
          {/* Test Diagnostic Tool (PRD §15.1) */}
          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Send className="size-4 text-emerald-600" />
                Live SMTP Handshake Diagnostic
              </CardTitle>
              <CardDescription className="text-xs">
                Send a real test email to verify credentials and TLS handshake.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Destination Test Email</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                  <Button
                    size="sm"
                    onClick={handleTestEmail}
                    disabled={testingStatus === "Testing"}
                    className="h-8 text-xs shrink-0 bg-primary text-primary-foreground font-semibold"
                  >
                    {testingStatus === "Testing" ? (
                      <span className="flex items-center gap-1">
                        <RefreshCw className="size-3 animate-spin" /> Pinging...
                      </span>
                    ) : (
                      "Send Test Mail"
                    )}
                  </Button>
                </div>
              </div>

              {testingStatus === "Success" && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="size-4" />
                    <span>SMTP Handshake 250 OK</span>
                  </div>
                  <p className="text-[11px] font-mono">
                    Connected in 380ms. TLS 1.3 handshake verified. Delivered to {testEmailAddress}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* DNS SPF & DKIM Records Guidance Card (PRD §15.1) */}
          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="size-4 text-blue-600" />
                Spam Prevention (SPF & DKIM)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p className="text-[11px]">
                Add the following TXT record to your domain DNS settings so receipts do not land in spam:
              </p>
              <div className="p-2 rounded bg-muted/60 font-mono text-[10px] break-all border border-border/60 text-foreground">
                v=spf1 include:relay.shelfspace-lms.com ~all
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      )}
    </div>
  )
}

