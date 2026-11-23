"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { platformService } from "@/services/platform-service"
import { toast } from "sonner"
import {
  Activity,
  Building2,
  ChevronLeft,
  CreditCard,
  KeyRound,
  Mail,
  MapPin,
  MessageSquare,
  ShieldAlert,
  SlidersHorizontal,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react"

import type { LibraryStatusTone } from "@/components/platform/library-logo"
import type { PlatformLibraryRecord } from "@/data/platform/platform-data"
import type { LibraryDocumentItem } from "../_components/library-documents-section"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { LibraryDocumentsSection } from "../_components/library-documents-section"
import { LibraryProfileHeader } from "./_components/library-profile-header"
import { LibraryProfileInfo } from "./_components/library-profile-info"
import { LibraryLogo } from "@/components/platform/library-logo"

interface RawLibraryDetail {
  id?: string | number
  name?: string
  code?: string
  city?: string
  state?: string
  address?: string
  owner?: {
    first_name?: string
    last_name?: string
  }
  owner_name?: string
  ownerName?: string
  owner_detail?: {
    name?: string
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
  }
  owner_phone?: string
  ownerPhone?: string
  phone?: string
  owner_email?: string
  ownerEmail?: string
  contact_email?: string
  branches_count?: number
  branchesCount?: number
  branch_count?: number
  branches?: unknown[]
  students_count?: number
  live_students?: number
  liveStudents?: number
  student_count?: number
  total_seats?: number
  totalSeats?: number
  plan_name?: string
  planName?: string
  plan_fee?: number | string
  planFee?: number | string
  billing_cycle?: string
  billingCycle?: string
  plan_status?: string
  planStatus?: string
  library_status?: string
  libraryStatus?: string
  plan_end_date?: string
  planEndDate?: string
  grace_days_remaining?: number
  logo?: string
  logo_url?: string
  email_connection_status?: string
  emailConnection?: string
  joined_date?: string
  joinedDate?: string
  created_at?: string
  subscription?: {
    status?: string
    fee?: number | string
    plan_name?: string
    billing_cycle?: string
    end_date?: string
    plan?: {
      name?: string
      price?: number | string
      monthly_fee?: number | string
    }
  }
  documents?: unknown[]
  notes?: Array<{ id: string; author: string; date: string; text: string }>
}

export default function LibraryDetailPage() {
  const params = useParams()
  const lang = (params.lang as string) || "en"
  const id = (params.id as string) || ""

  const [libraryData, setLibraryData] = useState<RawLibraryDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [documents, setDocuments] = useState<LibraryDocumentItem[]>([])

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        setIsLoading(true)
        const res = await platformService.getLibraryDetail(id)
        const payload =
          (res as { data?: RawLibraryDetail } | undefined)?.data ||
          (res as RawLibraryDetail | undefined)
        if (isMounted && payload) {
          setLibraryData(payload)
          const pStatus = payload.plan_status || payload.planStatus
          if (
            pStatus &&
            ["Active", "Grace", "Locked", "Expired", "Trial"].includes(pStatus)
          ) {
            setPlanStatus(pStatus as PlatformLibraryRecord["planStatus"])
          }
          const lStatus = payload.library_status || payload.libraryStatus
          if (
            lStatus &&
            ["Active", "Locked", "Suspended", "Closed"].includes(lStatus)
          ) {
            setLibraryStatus(lStatus as PlatformLibraryRecord["libraryStatus"])
          }
          if (typeof payload.logo === "string") setCustomLogoUrl(payload.logo)
          if (Array.isArray(payload.documents)) {
            const mappedDocs: LibraryDocumentItem[] = (
              payload.documents as Record<string, unknown>[]
            ).map((d) => ({
              id: String(d.id || `doc-${Date.now()}`),
              title: (d.title as string) || "Business Document",
              documentNumber:
                (d.document_number as string) ||
                (d.documentNumber as string) ||
                undefined,
              fileName:
                (d.file_name as string) ||
                (d.fileName as string) ||
                `${((d.title as string) || "document").toLowerCase().replace(/[^a-z0-9]/g, "_")}.${((d.file_type as string) || "pdf").toLowerCase()}`,
              fileSize:
                (d.file_size as string) || (d.fileSize as string) || "1.0 MB",
              fileType:
                ((d.file_type as string) || (d.fileType as string) || "pdf")
                  .toLowerCase()
                  .includes("image") ||
                ((d.file_type as string) || "").toLowerCase().includes("png") ||
                ((d.file_type as string) || "").toLowerCase().includes("jpg")
                  ? "image"
                  : "pdf",
              fileUrl: (d.file_url as string) || (d.fileUrl as string) || "#",
              uploadedAt:
                (d.uploaded_at as string) ||
                (d.uploadedAt as string) ||
                new Date().toLocaleDateString("en-IN"),
            }))
            setDocuments(mappedDocs)
          }
          if (Array.isArray(payload.notes)) {
            setNotes(payload.notes)
          }
        } else if (isMounted) {
          setNotFound(true)
        }
      } catch (err) {
        console.warn("Failed to load library details:", err)
        if (isMounted) setNotFound(true)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    if (id) load()
    return () => {
      isMounted = false
    }
  }, [id])

  const library: PlatformLibraryRecord | null = useMemo(() => {
    if (!libraryData) return null
    const rawPlanStatus =
      libraryData.plan_status ||
      libraryData.planStatus ||
      libraryData.subscription?.status ||
      "Active"
    const rawLibStatus =
      libraryData.library_status || libraryData.libraryStatus || "Active"
    const planFeeVal = Number(
      libraryData.plan_fee ??
        libraryData.planFee ??
        libraryData.subscription?.fee ??
        libraryData.subscription?.plan?.price ??
        0
    )
    const planEndDateVal =
      libraryData.plan_end_date ||
      libraryData.planEndDate ||
      (libraryData.subscription?.end_date
        ? new Date(libraryData.subscription.end_date).toLocaleDateString(
            "en-IN"
          )
        : "—")

    return {
      id: String(libraryData.id || id),
      name: libraryData.name || "Untitled Library",
      code:
        libraryData.code ||
        `LIB-${String(libraryData.id || id)
          .slice(0, 4)
          .toUpperCase()}`,
      city: libraryData.city || "—",
      state: libraryData.state || "—",
      address: libraryData.address || "",
      ownerName:
        libraryData.owner_name ||
        libraryData.ownerName ||
        libraryData.owner_detail?.name ||
        (libraryData.owner
          ? `${libraryData.owner.first_name || ""} ${libraryData.owner.last_name || ""}`.trim()
          : "—"),
      ownerPhone:
        libraryData.owner_phone ||
        libraryData.ownerPhone ||
        libraryData.phone ||
        libraryData.owner_detail?.phone ||
        "—",
      ownerEmail:
        libraryData.owner_email ||
        libraryData.ownerEmail ||
        libraryData.contact_email ||
        libraryData.owner_detail?.email ||
        "—",
      branchesCount: Number(
        libraryData.branches_count ??
          libraryData.branchesCount ??
          libraryData.branches?.length ??
          1
      ),
      liveStudents: Number(
        libraryData.students_count ??
          libraryData.live_students ??
          libraryData.liveStudents ??
          0
      ),
      totalSeats: Number(
        libraryData.total_seats ?? libraryData.totalSeats ?? 0
      ),
      planName:
        libraryData.plan_name ||
        libraryData.planName ||
        libraryData.subscription?.plan_name ||
        "—",
      planFee: isNaN(planFeeVal) ? 0 : planFeeVal,
      planBillingCycle:
        libraryData.billing_cycle ||
        libraryData.billingCycle ||
        libraryData.subscription?.billing_cycle ||
        "Annual",
      planStatus: ["Active", "Grace", "Locked", "Expired", "Trial"].includes(
        rawPlanStatus || ""
      )
        ? (rawPlanStatus as PlatformLibraryRecord["planStatus"])
        : "Active",
      libraryStatus: ["Active", "Suspended", "Locked", "Closed"].includes(
        rawLibStatus || ""
      )
        ? (rawLibStatus as PlatformLibraryRecord["libraryStatus"])
        : "Active",
      planEndDate: planEndDateVal,
      nextDueDate: planEndDateVal,
      graceDaysRemaining: Number(libraryData.grace_days_remaining || 0),
      mrr: isNaN(planFeeVal) ? 0 : planFeeVal,
      logo: libraryData.logo || "",
      logoUrl: libraryData.logo || null,
      emailConnection: (libraryData.email_connection_status === "Connected" ||
      libraryData.emailConnection === "Connected"
        ? "Connected"
        : "Not connected") as PlatformLibraryRecord["emailConnection"],
      joinedDate:
        libraryData.joined_date ||
        libraryData.joinedDate ||
        new Date().toLocaleDateString("en-IN"),
    }
  }, [libraryData, id])

  const [activeTab, setActiveTab] = useState("overview")
  const [planStatus, setPlanStatus] =
    useState<PlatformLibraryRecord["planStatus"]>("Active")
  const [libraryStatus, setLibraryStatus] =
    useState<PlatformLibraryRecord["libraryStatus"]>("Active")
  const [customLogoUrl, setCustomLogoUrl] = useState("")

  // Internal Notes State
  const [notes, setNotes] = useState<
    { id: string; author: string; date: string; text: string }[]
  >([])
  const [newNote, setNewNote] = useState("")

  // Limits Override State
  const [overrideSeats, setOverrideSeats] = useState("0")
  const [overrideBranches, setOverrideBranches] = useState("1")
  const [overrideReason, setOverrideReason] = useState("")

  useEffect(() => {
    if (library) {
      setPlanStatus(library.planStatus)
      setLibraryStatus(library.libraryStatus)
      setCustomLogoUrl(library.logo || "")
      setOverrideSeats(String(library.totalSeats || 0))
      setOverrideBranches(String(library.branchesCount || 1))
    }
  }, [library])

  const occupancyPct =
    library && library.totalSeats > 0
      ? Math.min(
          100,
          Math.round((library.liveStudents / library.totalSeats) * 100)
        )
      : 0

  const handleAddNote = () => {
    if (!newNote.trim()) return
    const noteItem = {
      id: `n-${Date.now()}`,
      author: "Super Admin",
      date: new Date().toLocaleString("en-IN"),
      text: newNote.trim(),
    }
    const updatedNotes = [noteItem, ...notes]
    setNotes(updatedNotes)
    setNewNote("")
    if (library) {
      platformService.updateLibrary(library.id, { notes: updatedNotes })
    }
    toast.success("Internal note added")
  }

  const handleSaveLimitsOverride = async () => {
    if (!overrideReason.trim()) {
      toast.error("Reason Required", {
        description: "Please explain why limits are being overridden.",
      })
      return
    }
    if (library) {
      await platformService.updateLibrary(library.id, {
        totalSeats: Number(overrideSeats),
        branchesCount: Number(overrideBranches),
      })
    }
    toast.success("Capacity Limits Overridden", {
      description: `Seats updated to ${overrideSeats}, Branches to ${overrideBranches}.`,
    })
    setOverrideReason("")
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-12 flex flex-col items-center justify-center min-h-[400px]">
        <Building2 className="size-8 text-primary animate-pulse mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">
          Loading library profile...
        </p>
      </div>
    )
  }

  if (notFound || !library) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 sm:p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="size-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
          <Building2 className="size-7" />
        </div>
        <h2 className="text-xl font-black text-foreground">
          Library Not Found
        </h2>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-md">
          No library matches identifier &ldquo;{id}&rdquo;.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${lang}/platform/libraries`}>
              <ChevronLeft className="size-4 me-1" /> All Libraries
            </Link>
          </Button>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground font-bold"
            asChild
          >
            <Link href={`/${lang}/platform/libraries/add`}>
              + Onboard Library
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden space-y-3 p-3 sm:p-4">
      {/* Top Breadcrumb / Back Navigation */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href={`/${lang}/platform/libraries`}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className:
              "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0",
          })}
        >
          <ChevronLeft className="size-4" />
          <span>Back to Platform Libraries</span>
        </Link>
        <span className="text-xs font-mono text-muted-foreground truncate">
          Library Code:{" "}
          <span className="font-bold text-foreground">{library.code}</span>
        </span>
      </div>

      {/* Profile Header */}
      <LibraryProfileHeader
        library={library}
        logoUrl={customLogoUrl}
        planStatus={planStatus}
        libraryStatus={libraryStatus}
        onPlanStatusChange={setPlanStatus}
        onLibraryStatusChange={setLibraryStatus}
        onJumpToControls={() => setActiveTab("controls")}
      />

      {/* Main Content: Left Info Column + Right Profile Tabs */}
      <div className="flex flex-col lg:flex-row gap-4 pt-1 min-w-0 w-full items-start">
        <LibraryProfileInfo
          library={library}
          logoUrl={customLogoUrl}
          planStatus={planStatus}
        />

        <div className="flex-1 min-w-0 w-full overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full min-w-0"
          >
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 w-full h-auto p-1 bg-muted/80 border border-border/80 rounded-xl mb-3 gap-1">
              <TabsTrigger
                value="overview"
                className="gap-1.5 text-xs font-semibold py-1.5 px-2.5 truncate data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg"
              >
                <TrendingUp className="size-3.5 text-primary shrink-0" />
                <span className="truncate">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="admins"
                className="gap-1.5 text-xs font-semibold py-1.5 px-2.5 truncate data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg"
              >
                <Users className="size-3.5 text-blue-500 shrink-0" />
                <span className="truncate">Admins & Branches</span>
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="gap-1.5 text-xs font-semibold py-1.5 px-2.5 truncate data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg"
              >
                <CreditCard className="size-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">Plan & Billing</span>
              </TabsTrigger>
              <TabsTrigger
                value="comms"
                className="gap-1.5 text-xs font-semibold py-1.5 px-2.5 truncate data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg"
              >
                <Mail className="size-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Email & Microsite</span>
              </TabsTrigger>
              <TabsTrigger
                value="audit"
                className="gap-1.5 text-xs font-semibold py-1.5 px-2.5 truncate data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg"
              >
                <Activity className="size-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">Audit & Notes</span>
              </TabsTrigger>
              <TabsTrigger
                value="controls"
                className="gap-1.5 text-xs font-semibold py-1.5 px-2.5 truncate data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg"
              >
                <SlidersHorizontal className="size-3.5 text-rose-500 shrink-0" />
                <span className="truncate">Controls</span>
              </TabsTrigger>
            </TabsList>

            {/* 1. OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-3 min-w-0">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 min-w-0">
                <Card className="border-border bg-card p-2 px-3 shadow-xs min-w-0 rounded-lg flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block truncate">
                      Live Students
                    </span>
                    <p className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight mt-0.5 truncate tabular-nums">
                      {library.liveStudents}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      of{" "}
                      {library.totalSeats > 0
                        ? `${library.totalSeats} desks`
                        : "unspecified capacity"}
                    </p>
                  </div>
                  <div className="size-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 ms-2">
                    <Users className="size-3" />
                  </div>
                </Card>

                <Card className="border-border bg-card p-2 px-3 shadow-xs min-w-0 rounded-lg flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block truncate">
                      Occupancy
                    </span>
                    <p className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight mt-0.5 truncate tabular-nums">
                      {occupancyPct}%
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium truncate">
                      {library.liveStudents > 0
                        ? "Active usage"
                        : "Awaiting students"}
                    </p>
                  </div>
                  <div className="size-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 ms-2">
                    <TrendingUp className="size-3" />
                  </div>
                </Card>

                <Card className="border-border bg-card p-2 px-3 shadow-xs min-w-0 rounded-lg flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block truncate">
                      Active Branches
                    </span>
                    <p className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight mt-0.5 truncate tabular-nums">
                      {library.branchesCount}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {library.city || "Location pending"}
                    </p>
                  </div>
                  <div className="size-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 ms-2">
                    <Building2 className="size-3" />
                  </div>
                </Card>

                <Card className="border-border bg-card p-2 px-3 shadow-xs min-w-0 rounded-lg flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block truncate">
                      Email Sync
                    </span>
                    <p className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight mt-0.5 truncate">
                      {library.emailConnection === "Connected"
                        ? "Connected"
                        : "Disconnected"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      Relay Status
                    </p>
                  </div>
                  <div className="size-6 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 flex items-center justify-center shrink-0 ms-2">
                    <Mail className="size-3" />
                  </div>
                </Card>
              </div>

              {/* Aggregated Student Breakdown */}
              <Card className="border-border bg-card shadow-xs">
                <CardHeader className="p-3.5 border-b border-border/80">
                  <CardTitle className="text-sm font-bold">
                    Student Membership Breakdown
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Aggregated counts isolated at tenant level.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3.5 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-muted/40 rounded-lg">
                      <span className="text-muted-foreground">Registered</span>
                      <p className="text-lg font-black text-foreground mt-0.5 tabular-nums">
                        {library.liveStudents}
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-lg">
                      <span className="text-emerald-500 font-bold">Active</span>
                      <p className="text-lg font-black text-emerald-500 mt-0.5 tabular-nums">
                        {library.liveStudents}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-lg">
                      <span className="text-amber-500 font-bold">Pending</span>
                      <p className="text-lg font-black text-amber-500 mt-0.5 tabular-nums">
                        0
                      </p>
                    </div>
                    <div className="p-3 bg-rose-500/10 rounded-lg">
                      <span className="text-rose-500 font-bold">Expired</span>
                      <p className="text-lg font-black text-rose-500 mt-0.5 tabular-nums">
                        0
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium">
                        Overall Seat Utilization
                      </span>
                      <span className="font-bold text-foreground tabular-nums">
                        {library.liveStudents} / {library.totalSeats} (
                        {occupancyPct}%)
                      </span>
                    </div>
                    <Progress value={occupancyPct} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* KYC & VERIFICATION DOCUMENTS */}
              <LibraryDocumentsSection
                documents={documents}
                onChange={(docs) => {
                  setDocuments(docs)
                  platformService.updateLibrary(library.id, {
                    documents: docs as unknown as Record<string, unknown>[],
                  })
                }}
                isAddMode={false}
              />
            </TabsContent>

            {/* 2. ADMINS & BRANCHES TAB */}
            <TabsContent value="admins" className="space-y-3 min-w-0">
              <Card className="shadow-xs border-border">
                <CardHeader className="p-3.5 border-b border-border/80 flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-bold">
                      Library Admins & Branch Staff
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Staff accounts associated with this tenant workspace.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 text-xs font-bold bg-primary text-primary-foreground"
                    onClick={() => toast.info("Invite Staff modal opened")}
                  >
                    <UserPlus className="size-3.5 me-1.5" /> Invite Staff
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead className="text-xs font-bold">
                            Staff Member
                          </TableHead>
                          <TableHead className="text-xs font-bold">
                            Role
                          </TableHead>
                          <TableHead className="text-xs font-bold">
                            Branch
                          </TableHead>
                          <TableHead className="text-xs font-bold">
                            Contact
                          </TableHead>
                          <TableHead className="text-xs font-bold">
                            Status
                          </TableHead>
                          <TableHead className="text-right text-xs font-bold">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <div className="font-bold text-xs">
                              {library.ownerName}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {library.ownerEmail}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="text-[10px]">
                              Head Admin (Owner)
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-semibold">
                            Main Branch
                          </TableCell>
                          <TableCell className="text-xs">
                            {library.ownerPhone || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="success" className="text-[10px]">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                toast.success("Password reset link dispatched")
                              }
                            >
                              <KeyRound className="size-3.5 me-1" /> Reset Pass
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xs border-border">
                <CardHeader className="p-3.5 border-b border-border/80">
                  <CardTitle className="text-sm font-bold">
                    Configured Branch Locations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3.5 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-foreground">
                        Main Branch
                      </h4>
                      <Badge variant="outline" className="text-[10px]">
                        Primary Unit
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="size-3 shrink-0" />
                      {library.address ||
                        (library.city
                          ? `${library.city}${library.state ? `, ${library.state}` : ""}`
                          : "Address not provided")}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                      <div>
                        <span className="text-muted-foreground">Seats</span>
                        <p className="font-bold text-foreground">
                          {library.totalSeats > 0
                            ? `${library.totalSeats} Desks`
                            : "Not specified"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Staff</span>
                        <p className="font-bold text-foreground">1 (Owner)</p>
                      </div>
                    </div>
                  </div>

                  {library.branchesCount > 1 &&
                    Array.from(
                      { length: library.branchesCount - 1 },
                      (_, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-foreground">
                              Branch #{idx + 2}
                            </h4>
                            <Badge variant="secondary" className="text-[10px]">
                              Sub-Branch
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="size-3 shrink-0" />{" "}
                            {library.city || "Location not configured"}
                          </p>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                            <div>
                              <span className="text-muted-foreground">
                                Allocation
                              </span>
                              <p className="font-bold text-foreground">
                                Unit #{idx + 2}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Status
                              </span>
                              <p className="font-bold text-emerald-500">
                                Configured
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 3. PLAN & BILLING TAB */}
            <TabsContent value="billing" className="space-y-3 min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card className="shadow-xs border-border">
                  <CardHeader className="p-3.5 border-b border-border/80">
                    <CardTitle className="text-sm font-bold">
                      Plan Lifecycle
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3.5 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Plan Status</span>
                      <Badge
                        variant={
                          planStatus === "Active" ? "success" : "warning"
                        }
                        className="font-bold"
                      >
                        {planStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Active Tier</span>
                      <span className="font-bold text-foreground">
                        {library.planName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Renewal Date
                      </span>
                      <span className="font-bold text-foreground">
                        {library.planEndDate || "Ongoing"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-xs border-border">
                  <CardHeader className="p-3.5 border-b border-border/80">
                    <CardTitle className="text-sm font-bold">
                      Recent Billing Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3.5 space-y-2 text-xs">
                    {library.planFee > 0 ? (
                      <div className="p-2.5 rounded-lg border border-border bg-muted/30 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-foreground tabular-nums">
                            ₹{library.planFee.toLocaleString("en-IN")} •{" "}
                            {library.planBillingCycle || "Annual"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Plan: {library.planName}
                          </p>
                        </div>
                        <Badge variant="success" className="text-[10px]">
                          Active
                        </Badge>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        No billing transactions logged yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 4. EMAIL & MICROSITE TAB */}
            <TabsContent value="comms" className="space-y-3 min-w-0">
              <Card className="shadow-xs border-border">
                <CardHeader className="p-3.5 border-b border-border/80">
                  <CardTitle className="text-sm font-bold">
                    Tenant Email Sync Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3.5 space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <Mail className="size-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">
                          Official Notification Email
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {library.ownerEmail || "Not configured"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        library.emailConnection === "Connected"
                          ? "success"
                          : "secondary"
                      }
                    >
                      {library.emailConnection}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        toast.success("Test ping sent to owner email")
                      }
                    >
                      Send Test Ping
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xs border-border">
                <CardHeader className="p-3.5 border-b border-border/80 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold">
                    Public Library Microsite
                  </CardTitle>
                  <Badge variant="outline">
                    {library.code ? "Configured" : "Draft"}
                  </Badge>
                </CardHeader>
                <CardContent className="p-3.5 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <LibraryLogo
                      name={library.name}
                      code={library.code}
                      src={customLogoUrl}
                      size="lg"
                      showLockup
                      subtitle={`Slug: ${library.code.toLowerCase()}`}
                      className="flex-1 min-w-0"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 5. AUDIT & NOTES TAB */}
            <TabsContent value="audit" className="space-y-3 min-w-0">
              <Card className="shadow-xs border-border">
                <CardHeader className="p-3.5 border-b border-border/80">
                  <CardTitle className="text-sm font-bold">
                    Staff Internal Notes (Confidential)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3.5 space-y-3 text-xs">
                  <Textarea
                    placeholder="Write an internal operational note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="text-xs h-20"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    className="font-bold bg-primary text-primary-foreground"
                  >
                    <MessageSquare className="size-3.5 me-1.5" /> Add Note
                  </Button>

                  <div className="space-y-2 pt-3 border-t">
                    {notes.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No internal notes recorded yet.
                      </p>
                    ) : (
                      notes.map((n) => (
                        <div
                          key={n.id}
                          className="p-3 rounded-lg border border-border bg-muted/30 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">
                              {n.author}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {n.date}
                            </span>
                          </div>
                          <p className="text-xs text-foreground">{n.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 6. CONTROLS TAB */}
            <TabsContent value="controls" className="space-y-3 min-w-0">
              <Card className="shadow-xs border-border">
                <CardHeader className="p-3.5 border-b border-border/80">
                  <CardTitle className="text-sm font-bold">
                    Brand Logo & Capacity Limit Overrides
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3.5 space-y-4 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 pb-3 border-b border-border/60">
                    <LibraryLogo
                      name={library.name}
                      code={library.code}
                      src={customLogoUrl}
                      size="responsive"
                      status={planStatus as LibraryStatusTone}
                      showStatusDot
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <Label className="text-xs font-bold">
                        Custom Brand Logo URL
                      </Label>
                      <Input
                        value={customLogoUrl}
                        onChange={(e) => setCustomLogoUrl(e.target.value)}
                        placeholder="https://... (leave empty for monogram emblem)"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold">
                        Max Physical Seats
                      </Label>
                      <Input
                        type="number"
                        value={overrideSeats}
                        onChange={(e) => setOverrideSeats(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold">
                        Max Allowed Branches
                      </Label>
                      <Input
                        type="number"
                        value={overrideBranches}
                        onChange={(e) => setOverrideBranches(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 max-w-xl">
                    <Label className="text-xs font-bold">
                      Override Justification *
                    </Label>
                    <Textarea
                      placeholder="e.g. Goodwill capacity waiver for campus expansion."
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="text-xs h-18"
                    />
                  </div>

                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground font-bold"
                    onClick={handleSaveLimitsOverride}
                  >
                    Save Limit Override
                  </Button>
                </CardContent>
              </Card>

              <Card
                className={cn("shadow-xs border-rose-500/30 bg-rose-500/5")}
              >
                <CardHeader className="p-3.5 border-b border-rose-500/20">
                  <CardTitle className="text-sm font-bold text-rose-500 flex items-center gap-2">
                    <ShieldAlert className="size-4" /> Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3.5 space-y-2.5 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-rose-500/20 bg-card">
                    <div>
                      <p className="font-bold text-foreground">
                        Remove Library Workspace
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Removes this tenant workspace and archives data.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shrink-0"
                      onClick={async () => {
                        await platformService.deleteLibrary(library.id)
                        toast.success("Library removed")
                        window.location.href = `/${lang}/platform/libraries`
                      }}
                    >
                      Delete Library
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
