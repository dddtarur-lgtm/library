"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  Code,
  Copy,
  Edit,
  Eye,
  FileCode,
  Mail,
  Receipt,
  Save,
  Sparkles,
  UserCheck,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function EmailTemplatesPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [selectedTemplateKey, setSelectedTemplateKey] = useState("receipt")
  const [subject, setSubject] = useState("Payment Receipt for {{library_name}} - #{{receipt_no}}")
  const [content, setContent] = useState(
    "Dear {{student_name}},\n\nThank you for choosing {{library_name}}. We have received your payment of ₹{{amount}} for {{plan_name}}.\n\nYour seat allocation: {{seat_no}} ({{shift}}).\nValid from {{start_date}} to {{expiry_date}}.\n\nA digital copy of your official tax invoice receipt is attached.\n\nWarm regards,\nManagement Team\n{{library_name}}"
  )

  const placeholders = [
    { tag: "{{student_name}}", desc: "Student Full Name" },
    { tag: "{{student_code}}", desc: "STU-XXXXX ID" },
    { tag: "{{library_name}}", desc: "Your Library Name" },
    { tag: "{{plan_name}}", desc: "Subscribed Plan Tier" },
    { tag: "{{amount}}", desc: "Payment Amount (₹)" },
    { tag: "{{expiry_date}}", desc: "Plan End Date" },
    { tag: "{{seat_no}}", desc: "Assigned Desk Code" },
  ]

  const templatesList = [
    { key: "receipt", name: "Fee Payment Receipt (PDF Attached)", trigger: "On successful fee payment" },
    { key: "welcome", name: "Welcome Credentials & Digital ID", trigger: "On student approval" },
    { key: "expiry", name: "Membership Expiration Warning", trigger: "7 days & 1 day before expiry" },
    { key: "due", name: "Outstanding Fee Balance Reminder", trigger: "When payment is overdue" },
  ]

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
          Transactional Template Placeholders (PRD §15.1)
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileCode className="size-5 text-purple-600" />
            Transactional Email Templates Designer
          </h1>
          <p className="text-xs text-muted-foreground">
            Customize HTML email layouts and dynamic placeholder tags for automated receipts, notifications & welcome messages
          </p>
        </div>

        <Button size="sm" className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold">
          <Save className="size-3.5" />
          <span>Save Template Changes</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Template Selector & Placeholders */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold">Standard System Templates</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {templatesList.map((tmpl) => (
                <div
                  key={tmpl.key}
                  onClick={() => setSelectedTemplateKey(tmpl.key)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedTemplateKey === tmpl.key
                      ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                      : "border-border/60 hover:bg-muted/40 text-foreground"
                  }`}
                >
                  <div className="font-medium">{tmpl.name}</div>
                  <div className="text-[10px] text-muted-foreground">{tmpl.trigger}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Code className="size-4 text-primary" />
                Dynamic Placeholders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-1.5 text-xs">
              {placeholders.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px] p-1.5 rounded bg-muted/40 border border-border/60">
                  <span className="font-mono font-bold text-primary">{p.tag}</span>
                  <span className="text-muted-foreground">{p.desc}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Template Content Editor & Live Preview */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Edit className="size-4 text-primary" />
                Template Content Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Subject Line</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-8 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Body Text / HTML</Label>
                <Textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              {/* Live Preview Box */}
              <div className="pt-2 border-t border-border/60 space-y-1">
                <Label className="text-xs text-muted-foreground">Rendered Sample Preview</Label>
                <div className="p-4 rounded-xl border border-border bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 space-y-2 text-xs leading-relaxed">
                  <div className="font-bold border-b pb-1 text-primary">
                    Subject: Payment Receipt for Central Study Library - #REC-2026-904
                  </div>
                  <p>Dear Aarav Patel,</p>
                  <p>Thank you for choosing Central Study Library. We have received your payment of ₹1,800 for 1 Month Full Day Intensive.</p>
                  <p>Your seat allocation: <strong>Desk A-14 (Full Day 6 AM - 10 PM)</strong>.<br />Valid from 15 Oct 2026 to 14 Nov 2026.</p>
                  <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded font-mono text-[10px] text-muted-foreground">
                    📎 Attachment: Official_Receipt_REC-2026-904.pdf (142 KB)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

