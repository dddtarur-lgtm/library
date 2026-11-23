"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Edit2,
  FileSpreadsheet,
  FileText,
  Mail,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  SwitchCamera,
  Trash2,
  Zap,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function ScheduledReportsPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [jobs, setJobs] = useState([
    {
      id: "job-01",
      name: "Daily Cash Day-Book & Shift Summary",
      frequency: "Daily at 10:00 PM",
      reportType: "Financial Cash Flow & Dues",
      channels: ["Email", "WhatsApp"],
      recipients: ["owner@library.com", "+91 98980 12345"],
      format: "PDF + Excel",
      status: true,
      lastDispatched: "Yesterday, 10:00 PM (Success)",
      nextRun: "Today, 10:00 PM",
    },
    {
      id: "job-02",
      name: "Weekly Attendance & Seat Occupancy Digest",
      frequency: "Weekly (Every Sunday 08:00 AM)",
      reportType: "Seat Utilization & Heatmap",
      channels: ["Email"],
      recipients: ["owner@library.com", "manager@library.com"],
      format: "PDF",
      status: true,
      lastDispatched: "27 Oct 2026, 08:00 AM (Success)",
      nextRun: "03 Nov 2026, 08:00 AM",
    },
    {
      id: "job-03",
      name: "Monthly P&L, GST & Subscriptions Audit",
      frequency: "Monthly (1st of Month at 09:00 AM)",
      reportType: "Comprehensive P&L Statement",
      channels: ["Email"],
      recipients: ["accounts@library.com", "owner@library.com"],
      format: "Excel (.xlsx)",
      status: true,
      lastDispatched: "01 Nov 2026, 09:00 AM (Success)",
      nextRun: "01 Dec 2026, 09:00 AM",
    },
    {
      id: "job-04",
      name: "Absenteeism & Churn Risk Alert Digest",
      frequency: "Bi-Weekly (Wednesday & Saturday 07:00 PM)",
      reportType: "Idle Students (>5 Days Absent)",
      channels: ["WhatsApp"],
      recipients: ["+91 98980 12345"],
      format: "Inline Summary",
      status: false,
      lastDispatched: "25 Oct 2026, 07:00 PM (Success)",
      nextRun: "Paused",
    },
  ])

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [testSentJobId, setTestSentJobId] = useState<string | null>(null)

  const toggleJobStatus = (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: !j.status } : j))
    )
  }

  const triggerTestDispatch = (jobId: string) => {
    setTestSentJobId(jobId)
    setTimeout(() => {
      setTestSentJobId(null)
    }, 2500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={ensureLocalizedPathname("/pages/reports", lang)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reports Center
            </Link>
            <ChevronRight className="size-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-primary">Automated Scheduled Reports</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Scheduled Automated Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure automated report generation and direct dispatch to owners and accountants via Email or WhatsApp.
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 gap-1.5">
              <Plus className="size-4" />
              New Scheduled Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Configure Scheduled Automated Report</DialogTitle>
              <DialogDescription>
                System will generate and deliver fresh data reports automatically on your chosen schedule.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2 text-xs">
              <div className="grid gap-1.5">
                <Label htmlFor="sched-name">Schedule Title</Label>
                <Input id="sched-name" placeholder="e.g. Daily Shift Handover &amp; Cash Summary" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Report Template</Label>
                  <Select defaultValue="financial">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">Financial Cash Day-Book</SelectItem>
                      <SelectItem value="occupancy">Seat Occupancy &amp; Churn</SelectItem>
                      <SelectItem value="attendance">Daily Attendance Log</SelectItem>
                      <SelectItem value="pnl">Monthly P&amp;L Statement</SelectItem>
                      <SelectItem value="idle">Idle Students Alert List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label>Frequency</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily at 10:00 PM</SelectItem>
                      <SelectItem value="weekly">Weekly (Sundays 8 AM)</SelectItem>
                      <SelectItem value="monthly">Monthly (1st of Month)</SelectItem>
                      <SelectItem value="custom">Custom Cron Expression</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>File Format</Label>
                  <Select defaultValue="pdf_excel">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf_excel">PDF + Excel (.xlsx)</SelectItem>
                      <SelectItem value="pdf">PDF Document Only</SelectItem>
                      <SelectItem value="excel">Excel Sheet (.xlsx) Only</SelectItem>
                      <SelectItem value="csv">Raw CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label>Delivery Channel</Label>
                  <Select defaultValue="email_wa">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email_wa">Email &amp; WhatsApp</SelectItem>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="sched-recipients">Recipients (Comma separated emails &amp; phones)</Label>
                <Input
                  id="sched-recipients"
                  defaultValue="owner@library.com, +91 98980 12345"
                  placeholder="name@domain.com, +91 98765 43210"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/20">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold">Include Passcode Protection</span>
                  <p className="text-[11px] text-muted-foreground">
                    Encrypt PDF attachments with the library GSTIN/PIN
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => setIsAddOpen(false)}>
                Activate Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Active Schedules
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
              <Zap className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 Running</div>
            <div className="mt-1 text-xs text-muted-foreground">1 paused schedule</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Last 30-Day Dispatches
            </CardTitle>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Send className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42 Dispatches</div>
            <div className="mt-1 text-xs text-emerald-600">100% delivery success rate</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Next Scheduled Trigger
            </CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
              <Clock className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Today, 10:00 PM</div>
            <div className="mt-1 text-xs text-muted-foreground">Daily Cash Day-Book</div>
          </CardContent>
        </Card>
      </div>

      {/* Schedules Table */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Scheduled Dispatch Registry</CardTitle>
          <CardDescription>
            Automatic background cron tasks that compile and deliver reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs">Schedule &amp; Template</TableHead>
                  <TableHead className="text-xs">Cadence / Frequency</TableHead>
                  <TableHead className="text-xs">Channels &amp; Format</TableHead>
                  <TableHead className="text-xs">Recipients</TableHead>
                  <TableHead className="text-xs">Last Run &amp; Next Run</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="text-xs font-semibold">{job.name}</div>
                      <div className="text-[11px] text-muted-foreground">{job.reportType}</div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-muted-foreground" />
                        <span>{job.frequency}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {job.channels.map((ch, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] py-0 h-5">
                            {ch === "Email" ? <Mail className="mr-1 size-2.5" /> : <MessageSquare className="mr-1 size-2.5 text-emerald-600" />}
                            {ch}
                          </Badge>
                        ))}
                        <span className="text-[10px] text-muted-foreground ml-1">({job.format})</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="truncate max-w-[180px]">
                        {job.recipients.join(", ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        {job.lastDispatched}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Next: {job.nextRun}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={job.status}
                        onCheckedChange={() => toggleJobStatus(job.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => triggerTestDispatch(job.id)}
                          disabled={testSentJobId === job.id}
                        >
                          {testSentJobId === job.id ? (
                            <>
                              <CheckCircle2 className="size-3 text-emerald-600" />
                              Sent!
                            </>
                          ) : (
                            <>
                              <Send className="size-3" />
                              Test Now
                            </>
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7">
                          <Edit2 className="size-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7 text-rose-500">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

