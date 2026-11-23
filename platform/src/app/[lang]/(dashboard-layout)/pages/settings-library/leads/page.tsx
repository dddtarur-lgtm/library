"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  GraduationCap,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function LeadsCrmPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [leads, setLeads] = useState([
    {
      id: "lead-01",
      name: "Harshil Patel",
      phone: "+91 98251 77123",
      email: "harshil.p@gmail.com",
      targetExam: "UPSC CSE 2027",
      preferredShift: "Full Day Reserved",
      source: "Website Form",
      stage: "Free Trial Scheduled",
      trialDate: "Tomorrow, 10:00 AM",
      createdAt: "Today, 09:30 AM",
      notes: "Looking for quiet corner seat near charging point.",
    },
    {
      id: "lead-02",
      name: "Riddhi Trivedi",
      phone: "+91 97120 44890",
      email: "riddhi.t@outlook.com",
      targetExam: "CA Final May 2027",
      preferredShift: "Night Owl (6-11)",
      source: "WhatsApp Enquiry",
      stage: "New Inquiry",
      trialDate: "Not Scheduled",
      createdAt: "Today, 08:15 AM",
      notes: "Inquired about girls safety & late night transport.",
    },
    {
      id: "lead-03",
      name: "Saurabh Varma",
      phone: "+91 99042 11988",
      email: "saurabh.v@gmail.com",
      targetExam: "GATE 2027",
      preferredShift: "Morning Shift (6-12)",
      source: "Google Maps",
      stage: "Trial Attended",
      trialDate: "Yesterday (Attended)",
      createdAt: "01 Nov 2026",
      notes: "Loved the Wi-Fi speed. Ready to enroll in 3-Month Plan.",
    },
    {
      id: "lead-04",
      name: "Meera Shah",
      phone: "+91 94280 66341",
      email: "meera.shah@yahoo.com",
      targetExam: "NEET UG 2027",
      preferredShift: "Afternoon (12-5)",
      source: "Student Referral",
      stage: "Converted",
      trialDate: "28 Oct 2026",
      createdAt: "26 Oct 2026",
      notes: "Enrolled as STU-1089. Paid 1-month fee.",
    },
  ])

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStage, setSelectedStage] = useState("all")
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false)

  // New lead form
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newExam, setNewExam] = useState("")

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone.includes(searchQuery) ||
      l.targetExam.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStage = selectedStage === "all" || l.stage === selectedStage
    return matchesSearch && matchesStage
  })

  const updateStage = (leadId: string, stage: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage } : l))
    )
  }

  const handleAddLead = () => {
    if (!newName || !newPhone) return
    const newEntry = {
      id: `lead-${Date.now()}`,
      name: newName,
      phone: newPhone,
      email: "inquiry@lead.com",
      targetExam: newExam || "Competitive Exams",
      preferredShift: "Morning Shift",
      source: "Walk-in Desk",
      stage: "New Inquiry",
      trialDate: "Pending",
      createdAt: "Just now",
      notes: "Added via reception",
    }
    setLeads([newEntry, ...leads])
    setIsAddLeadOpen(false)
    setNewName("")
    setNewPhone("")
    setNewExam("")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={ensureLocalizedPathname("/pages/settings-library", lang)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Library Settings
            </Link>
            <ChevronRight className="size-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-primary">Leads &amp; Enquiries CRM</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Prospective Student Leads &amp; CRM Pipeline
          </h1>
          <p className="text-sm text-muted-foreground">
            Track prospective students who requested free trials or inquired online. Convert leads to active members with 1 click.
          </p>
        </div>

        <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 gap-1.5">
              <UserPlus className="size-4" />
              Add Walk-in Enquiry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Register Walk-in / Phone Lead</DialogTitle>
              <DialogDescription>
                Record inquiry details and schedule an onboarding free trial day
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <Label htmlFor="lead-name">Student Full Name</Label>
                <Input
                  id="lead-name"
                  placeholder="e.g. Rahul Verma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="lead-phone">Mobile Phone (WhatsApp)</Label>
                <Input
                  id="lead-phone"
                  placeholder="+91 98765 43210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="lead-exam">Target Examination / Goal</Label>
                <Input
                  id="lead-exam"
                  placeholder="e.g. UPSC CSE 2026, CA Final"
                  value={newExam}
                  onChange={(e) => setNewExam(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIsAddLeadOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddLead}>
                Save Lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              New Inquiries
            </CardTitle>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <UserPlus className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 Leads</div>
            <div className="mt-1 text-xs text-muted-foreground">Awaiting trial scheduling</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Trials Scheduled
            </CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
              <Calendar className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">5 Students</div>
            <div className="mt-1 text-xs text-muted-foreground">Coming in next 48 hours</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Conversion Rate
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
              <TrendingUp className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">68.4%</div>
            <div className="mt-1 text-xs text-muted-foreground">Trials converted to memberships</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Top Acquisition Source
            </CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600">
              <Sparkles className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Google Maps</div>
            <div className="mt-1 text-xs text-muted-foreground">42% of total trial requests</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="border-border/60 bg-card/80">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search lead name, phone, or target exam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger className="h-9 w-44 text-xs">
                <SelectValue placeholder="Pipeline Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pipeline Stages</SelectItem>
                <SelectItem value="New Inquiry">New Inquiry</SelectItem>
                <SelectItem value="Free Trial Scheduled">Trial Scheduled</SelectItem>
                <SelectItem value="Trial Attended">Trial Attended</SelectItem>
                <SelectItem value="Converted">Converted to Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Prospective Student Registry</CardTitle>
          <CardDescription>
            Pipeline stages with direct WhatsApp communication and one-click enrollment conversion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs">Lead Name &amp; Contact</TableHead>
                  <TableHead className="text-xs">Target Exam</TableHead>
                  <TableHead className="text-xs">Preferred Shift</TableHead>
                  <TableHead className="text-xs">Source</TableHead>
                  <TableHead className="text-xs">Trial Date</TableHead>
                  <TableHead className="text-xs">Pipeline Stage</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="text-xs font-semibold">{lead.name}</div>
                      <div className="text-[11px] text-muted-foreground">{lead.phone}</div>
                    </TableCell>

                    <TableCell className="text-xs font-medium">
                      {lead.targetExam}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {lead.preferredShift}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {lead.source}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {lead.trialDate}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          lead.stage === "Converted"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px]"
                            : lead.stage === "Free Trial Scheduled"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 text-[10px]"
                            : lead.stage === "Trial Attended"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 text-[10px]"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[10px]"
                        }
                      >
                        {lead.stage}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs text-emerald-600 gap-1"
                          asChild
                        >
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}?text=Hi%20${encodeURIComponent(lead.name)},%20greetings%20from%20Central%20Study%20Zone!`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <MessageSquare className="size-3" />
                            WhatsApp
                          </a>
                        </Button>

                        {lead.stage !== "Converted" && (
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => updateStage(lead.id, "Converted")}
                          >
                            <UserCheck className="size-3" />
                            Convert
                          </Button>
                        )}
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

