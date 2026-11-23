"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { platformService } from "@/services/platform-service"
import { toast } from "sonner"
import {
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock,
  CreditCard,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react"

import type { PlatformLibraryRecord } from "@/data/platform/platform-data"
import type { LibraryDocumentItem } from "./library-documents-section"
import type { LibraryPlanOption } from "./library-plan-dialog"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { LibraryLogo } from "@/components/platform/library-logo"
import { LibraryDocumentsSection } from "./library-documents-section"
import { LibraryPlanDialog } from "./library-plan-dialog"

interface LibraryEditFormProps {
  library?: PlatformLibraryRecord
  locale: string
  mode?: "add" | "edit"
}

export function LibraryEditForm({
  library,
  locale,
  mode = "edit",
}: LibraryEditFormProps) {
  const router = useRouter()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const isAddMode = mode === "add"

  const today = new Date().toISOString().split("T")[0]
  const defaultEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]

  const [formData, setFormData] = useState({
    name: library?.name || "",
    code: library?.code || "",
    logo: library?.logo || "",
    city: library?.city || "",
    state: library?.state || "",
    address: library?.address || "",
    ownerName: library?.ownerName || "",
    ownerPhone: library?.ownerPhone || "",
    ownerEmail: library?.ownerEmail || "",
    planStatus: (library?.planStatus ||
      "Active") as PlatformLibraryRecord["planStatus"],
    libraryStatus: (library?.libraryStatus ||
      "Active") as PlatformLibraryRecord["libraryStatus"],
    planName: library?.planName || "",
    billingCycle:
      (library?.planBillingCycle as
        | "Monthly"
        | "Quarterly"
        | "Half-Yearly"
        | "Annual") || "Annual",
    planFee: library?.planFee || 0,
    planEndDate: library?.planEndDate || defaultEnd,
    joinedDate: library?.joinedDate || today,
    branchesCount: library?.branchesCount || 1,
    totalSeats: library?.totalSeats || 0,
    liveStudents: library?.liveStudents || 0,
    emailConnection: (library?.emailConnection ||
      "Disconnected") as PlatformLibraryRecord["emailConnection"],
    gstNumber: library?.gstNumber || "",
    micrositeSlug: library?.micrositeSlug || "",
    publicListingEnabled: false,
    preVerifyKyc: false,
    sendWelcomeEmail: false,
  })

  useEffect(() => {
    if (library) {
      setFormData((prev) => ({
        ...prev,
        name: library.name || prev.name,
        code: library.code || prev.code,
        logo: library.logo || prev.logo,
        city: library.city || prev.city,
        state: library.state || prev.state,
        address: library.address || prev.address,
        ownerName: library.ownerName || prev.ownerName,
        ownerPhone: library.ownerPhone || prev.ownerPhone,
        ownerEmail: library.ownerEmail || prev.ownerEmail,
        planStatus: library.planStatus || prev.planStatus,
        libraryStatus: library.libraryStatus || prev.libraryStatus,
        planName: library.planName || prev.planName,
        planFee: library.planFee !== undefined ? library.planFee : prev.planFee,
        planEndDate: library.planEndDate || prev.planEndDate,
        branchesCount: library.branchesCount || prev.branchesCount,
        totalSeats:
          library.totalSeats !== undefined
            ? library.totalSeats
            : prev.totalSeats,
        liveStudents: library.liveStudents || prev.liveStudents,
        emailConnection: library.emailConnection || prev.emailConnection,
        gstNumber: library.gstNumber || prev.gstNumber,
        micrositeSlug: library.micrositeSlug || prev.micrositeSlug,
      }))
    }
  }, [library])

  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [planDialogMode, setPlanDialogMode] = useState<"select" | "review">(
    isAddMode ? "select" : "review"
  )
  const [isSaving, setIsSaving] = useState(false)

  const [documents, setDocuments] = useState<LibraryDocumentItem[]>(() => {
    const extLib = library as
      | (PlatformLibraryRecord & { documents?: LibraryDocumentItem[] })
      | undefined
    return extLib?.documents || []
  })

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePlanSelected = (plan: LibraryPlanOption) => {
    const days =
      plan.billingCycle === "Monthly"
        ? 30
        : plan.billingCycle === "Quarterly"
          ? 90
          : 365
    const nextExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]

    setFormData((prev) => ({
      ...prev,
      planName: plan.name,
      billingCycle: plan.billingCycle,
      planFee: plan.fee,
      branchesCount: plan.branchesLimit,
      totalSeats: plan.seatsLimit,
      planEndDate: nextExpiry,
    }))

    toast.success(`Plan updated to ${plan.name}`, {
      description: `Fee ₹${plan.fee.toLocaleString("en-IN")} (${plan.billingCycle}) • ${plan.branchesLimit} Branches, ${plan.seatsLimit} Desks.`,
    })
  }

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    updateField("logo", url)
    toast.success("Library logo updated")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !formData.name.trim() ||
      !formData.ownerName.trim() ||
      !formData.ownerPhone.trim() ||
      !formData.city.trim()
    ) {
      toast.error("Please fill all required fields (Name, City, Owner, Phone)")
      return
    }
    if (isAddMode && !formData.planName) {
      toast.error("Please select a SaaS subscription plan")
      return
    }

    setIsSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        address: formData.address.trim(),
        phone: formData.ownerPhone.trim(),
        contact_email: formData.ownerEmail.trim(),
        owner_name: formData.ownerName.trim(),
        owner_email: formData.ownerEmail.trim(),
        owner_phone: formData.ownerPhone.trim(),
        plan_status: formData.planStatus,
        library_status: formData.libraryStatus,
        plan_name: formData.planName,
        billing_cycle: formData.billingCycle,
        plan_fee: formData.planFee,
        plan_end_date: formData.planEndDate,
        total_seats: Number(formData.totalSeats || 0),
        branches_count: Number(formData.branchesCount || 1),
        gstin: formData.gstNumber.trim(),
        public_page_slug: formData.micrositeSlug.trim() || undefined,
        public_page_enabled: formData.publicListingEnabled,
        documents,
      }

      if (isAddMode) {
        const res = await platformService.createLibrary(payload)
        const createdLib =
          (res as { data?: { code?: string } } | undefined)?.data ||
          (res as { code?: string } | undefined)
        const finalCode = createdLib?.code || formData.code
        toast.success(`Library "${formData.name}" onboarded successfully!`, {
          description: `Code: ${finalCode}. Owner credentials created for ${formData.ownerEmail}.`,
        })
        router.push(`/${locale}/platform/libraries`)
      } else {
        const targetId = library?.id || formData.code
        await platformService.updateLibrary(targetId, payload)
        toast.success(`"${formData.name}" updated successfully!`, {
          description: "Tenant profile, capacity, and subscription plan saved.",
        })
        router.push(`/${locale}/platform/libraries/${targetId}`)
      }
    } catch (err: unknown) {
      console.error("Failed to save library:", err)
      const errObj = err as
        | { data?: { message?: string }; message?: string }
        | undefined
      const errorMsg =
        errObj?.data?.message ||
        errObj?.message ||
        "Failed to save library. Please verify all required fields."
      toast.error("Save Failed", {
        description:
          typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const cancelUrl = isAddMode
    ? `/${locale}/platform/libraries`
    : `/${locale}/platform/libraries/${library?.id || ""}`

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 min-w-0 pb-28">
      {/* Top Breadcrumb / Navigation */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href={cancelUrl}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className:
              "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0",
          })}
        >
          <ChevronLeft className="size-4" />
          <span>
            {isAddMode
              ? "Back to Platform Libraries"
              : "Back to Library Profile"}
          </span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground shrink-0">
          <span className="truncate">
            {isAddMode ? "Tenant Code: " : "Library Code: "}
            <strong className="text-foreground">{formData.code}</strong>
          </span>
          <Badge
            variant="outline"
            className={
              isAddMode
                ? "text-[10px] font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 gap-1 px-1.5 py-0"
                : "text-[10px] font-semibold border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 gap-1 px-1.5 py-0"
            }
          >
            <span
              className={`size-1.5 rounded-full ${
                isAddMode ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span>{isAddMode ? "New Tenant" : "Editing"}</span>
          </Badge>
        </div>
      </div>

      {/* IN-PLACE EDITABLE PROFILE HEADER CARD */}
      <section className="rounded-xl border border-border bg-card p-3.5 sm:p-4 md:p-5 shadow-xs space-y-4 min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 min-w-0">
          {/* Left Side: Library Emblem with Static Corner Plus Button + Inline Meta */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0 flex-1">
            <div className="relative shrink-0">
              <LibraryLogo
                name={formData.name || "New Library"}
                code={formData.code}
                src={formData.logo}
                size="xl"
                status={
                  formData.libraryStatus === "Suspended"
                    ? "Suspended"
                    : formData.planStatus
                }
              />

              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:scale-105 active:scale-95 transition-transform duration-150 cursor-pointer border-2 border-card"
                title="Upload library logo"
                aria-label="Upload library logo"
              >
                <Plus className="size-4 stroke-[2.5]" />
              </button>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoFileChange}
              />
            </div>

            <div className="space-y-2.5 min-w-0 flex-1 w-full sm:w-auto">
              <div className="flex flex-wrap items-center gap-2 max-w-xl">
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Library Business Name{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g. Apex Reading Lounge & Study Hub"
                    className="h-8.5 text-xs font-semibold bg-background"
                  />
                </div>

                <div className="w-[125px] space-y-1 shrink-0">
                  <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Plan Status
                  </Label>
                  <Select
                    value={formData.planStatus}
                    onValueChange={(val: PlatformLibraryRecord["planStatus"]) =>
                      updateField("planStatus", val)
                    }
                  >
                    <SelectTrigger className="h-8.5 text-xs font-bold bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="Active"
                        className="font-semibold text-emerald-600"
                      >
                        Active
                      </SelectItem>
                      <SelectItem
                        value="Grace"
                        className="font-semibold text-amber-600"
                      >
                        Grace
                      </SelectItem>
                      <SelectItem
                        value="Locked"
                        className="font-semibold text-rose-600"
                      >
                        Locked
                      </SelectItem>
                      <SelectItem
                        value="Trial"
                        className="font-semibold text-primary"
                      >
                        Trial
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground font-semibold shrink-0 flex items-center gap-1">
                  <MapPin className="size-3 text-primary" />
                  Location:
                </span>
                <Input
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="City *"
                  className="h-7 text-xs w-36 font-medium bg-background"
                />
                <Input
                  value={formData.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  placeholder="State *"
                  className="h-7 text-xs w-36 font-medium bg-background"
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-medium pt-0.5">
                <span className="inline-flex items-center gap-1.5 text-foreground/90 shrink-0">
                  <Phone className="size-3 text-primary shrink-0" />
                  <Input
                    value={formData.ownerPhone}
                    onChange={(e) => updateField("ownerPhone", e.target.value)}
                    placeholder="Owner Phone *"
                    className="h-7 text-xs w-36 font-medium bg-background"
                  />
                </span>
                <span className="inline-flex items-center gap-1.5 text-foreground/90 shrink-0">
                  <Mail className="size-3 text-primary shrink-0" />
                  <Input
                    type="email"
                    value={formData.ownerEmail}
                    onChange={(e) => updateField("ownerEmail", e.target.value)}
                    placeholder="Owner Email *"
                    className="h-7 text-xs w-48 font-medium bg-background"
                  />
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Capacity Quota & SaaS Plan Trigger */}
          <div className="rounded-xl border border-border/80 bg-muted/40 p-3 sm:p-3.5 flex flex-wrap sm:flex-nowrap items-center gap-3.5 shrink-0 justify-between sm:justify-start">
            <div className="min-w-[125px] space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                <Users className="size-3 text-primary shrink-0" />
                SEAT QUOTA
              </p>
              <Input
                type="number"
                min={10}
                value={formData.totalSeats}
                onChange={(e) =>
                  updateField("totalSeats", Number(e.target.value) || 0)
                }
                className="h-8 text-xs font-bold bg-background tabular-nums"
              />
              <p className="text-[10px] text-muted-foreground font-medium">
                {formData.branchesCount}{" "}
                {formData.branchesCount > 1 ? "Branches" : "Branch"} allowed
              </p>
            </div>

            <div className="w-px h-12 bg-border/80 shrink-0 hidden sm:block" />

            <div className="min-w-[155px] flex flex-col justify-center space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CreditCard className="size-3 text-emerald-500 shrink-0" />
                {isAddMode ? "PLATFORM PLAN" : "CURRENT PLAN"}
              </p>

              <button
                type="button"
                onClick={() => {
                  setPlanDialogMode(isAddMode ? "select" : "review")
                  setPlanDialogOpen(true)
                }}
                className="h-8.5 px-3 rounded-lg border border-border/90 bg-background hover:bg-muted/60 transition-all flex items-center justify-between gap-2 text-xs font-bold text-foreground cursor-pointer shadow-xs min-w-[165px] group"
              >
                <span className="truncate">
                  {formData.planName
                    ? `${formData.planName} (₹${formData.planFee.toLocaleString("en-IN")})`
                    : "Choose Plan"}
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Operational Status & Quick Onboarding Strip */}
        <div className="border-t border-border/70 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="size-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">
              Tenant Access State:
            </span>
            <Select
              value={formData.libraryStatus}
              onValueChange={(val: PlatformLibraryRecord["libraryStatus"]) =>
                updateField("libraryStatus", val)
              }
            >
              <SelectTrigger className="h-7 text-xs w-40 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Operational</SelectItem>
                <SelectItem value="Locked">Locked</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Label
                htmlFor="public-listing"
                className="text-xs cursor-pointer"
              >
                Public Directory Listing
              </Label>
              <Switch
                id="public-listing"
                checked={formData.publicListingEnabled}
                onCheckedChange={(checked) =>
                  updateField("publicListingEnabled", checked)
                }
              />
            </div>

            {isAddMode && (
              <div className="flex items-center gap-1.5">
                <Label htmlFor="pre-verify" className="text-xs cursor-pointer">
                  Auto-Verify KYC
                </Label>
                <Switch
                  id="pre-verify"
                  checked={formData.preVerifyKyc}
                  onCheckedChange={(checked) =>
                    updateField("preVerifyKyc", checked)
                  }
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* MAIN LAYOUT: LEFT INFO COLUMN + RIGHT FORM CARDS */}
      <div className="flex flex-col lg:flex-row gap-4 pt-1 min-w-0 w-full items-start">
        {/* LEFT COLUMN */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-3 min-w-0">
          {/* Card 1: Capacity & Brand */}
          <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
            <CardHeader className="p-3 pb-2 border-b border-border/80 bg-muted/20">
              <div className="flex items-center justify-between min-w-0 gap-2">
                <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate text-foreground">
                  <Building2 className="size-3.5 text-primary shrink-0" />
                  <span className="truncate">Tenant Setup & Brand</span>
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold border-primary/30 text-primary bg-primary/5 shrink-0 px-1.5 py-0"
                >
                  {formData.branchesCount} Br
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-[11px] font-medium">
                    Branches Quota
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.branchesCount}
                    onChange={(e) =>
                      updateField("branchesCount", Number(e.target.value) || 1)
                    }
                    className="h-8 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-[11px] font-medium">
                    Seat Limit
                  </Label>
                  <Input
                    type="number"
                    min={10}
                    value={formData.totalSeats}
                    onChange={(e) =>
                      updateField("totalSeats", Number(e.target.value) || 10)
                    }
                    className="h-8 text-xs font-bold text-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-[11px] font-medium">
                  Logo Image URL (Optional)
                </Label>
                <Input
                  value={formData.logo}
                  onChange={(e) => updateField("logo", e.target.value)}
                  placeholder="https://... (auto monogram if empty)"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-[11px] font-medium">
                  Primary Street Address
                </Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  rows={2}
                  className="text-xs resize-none"
                  placeholder="Building name, street, landmark..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Owner & Business Profile */}
          <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
            <CardHeader className="p-3 pb-2 border-b border-border/80 bg-muted/20">
              <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate text-foreground">
                <User className="size-3.5 text-primary shrink-0" />
                <span className="truncate">Owner & Contact Info</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2.5 text-xs">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-[11px] font-medium">
                  Owner Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.ownerName}
                  onChange={(e) => updateField("ownerName", e.target.value)}
                  placeholder="e.g. Vikramaditya Rao"
                  className="h-8 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-[11px] font-medium">
                  Contact Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.ownerPhone}
                  onChange={(e) => updateField("ownerPhone", e.target.value)}
                  placeholder="+91 98250 11223"
                  className="h-8 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-[11px] font-medium">
                  Registered Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => updateField("ownerEmail", e.target.value)}
                  placeholder="owner@library.com"
                  className="h-8 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-[11px] font-medium">
                  Email OAuth Sync Status
                </Label>
                <Select
                  value={formData.emailConnection}
                  onValueChange={(
                    val: PlatformLibraryRecord["emailConnection"]
                  ) => updateField("emailConnection", val)}
                >
                  <SelectTrigger className="h-8 text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Connected">Connected</SelectItem>
                    <SelectItem value="Needs reconnect">
                      Needs reconnect
                    </SelectItem>
                    <SelectItem value="Not connected">Not connected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Card 1: GST, Compliance & Microsite */}
          <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
            <CardHeader className="p-3.5 pb-2.5 border-b border-border/80 bg-muted/20">
              <div className="flex items-center justify-between min-w-0">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <ShieldCheck className="size-4 text-primary shrink-0" />
                  <span>Tax, Compliance & Microsite Details</span>
                </CardTitle>
                <span className="text-[11px] text-muted-foreground">
                  Platform provisioning
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">
                    Tenant Code
                  </Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => updateField("code", e.target.value)}
                    className="h-8.5 text-xs font-mono font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">
                    GSTIN (Optional)
                  </Label>
                  <Input
                    value={formData.gstNumber}
                    onChange={(e) => updateField("gstNumber", e.target.value)}
                    placeholder="e.g. 24AABCU9603R1ZM"
                    className="h-8.5 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Globe className="size-3 text-primary" />
                    Microsite Slug
                  </Label>
                  <Input
                    value={formData.micrositeSlug}
                    onChange={(e) =>
                      updateField("micrositeSlug", e.target.value)
                    }
                    placeholder="library-slug"
                    className="h-8.5 text-xs font-mono"
                  />
                </div>
              </div>

              {isAddMode && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-muted/25 text-xs">
                  <span className="font-semibold text-foreground">
                    Send welcome email & portal setup link upon provisioning
                  </span>
                  <Switch
                    checked={formData.sendWelcomeEmail}
                    onCheckedChange={(checked) =>
                      updateField("sendWelcomeEmail", checked)
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Platform Plan & Subscription (Follows Add Mode vs Edit Mode rule!) */}
          <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
            <CardHeader className="p-3.5 pb-2.5 border-b border-border/80 bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <CreditCard className="size-4 text-emerald-500 shrink-0" />
                    <span>Platform Subscription & Plan Details</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isAddMode
                      ? "Choose a SaaS subscription tier for this library."
                      : "Active plan quotas, fee calculation, and renewal schedule."}
                  </CardDescription>
                </div>

                {!isAddMode && (
                  <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs w-fit">
                    Status: {formData.planStatus}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-3.5 sm:p-4 space-y-3.5">
              {isAddMode ? (
                <div className="p-4 sm:p-5 rounded-xl border border-dashed border-border/90 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-start">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-center sm:justify-start gap-1">
                      <CreditCard className="size-3 text-emerald-500" />
                      PLATFORM SUBSCRIPTION
                    </span>
                    <h4 className="text-sm font-bold text-foreground">
                      {formData.planName
                        ? `${formData.planName} (${formData.billingCycle})`
                        : "Choose Subscription Plan"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formData.planName
                        ? `Fee: ₹${formData.planFee.toLocaleString("en-IN")} • ${formData.branchesCount} Branches • ${formData.totalSeats} Seats`
                        : "Select a SaaS tier to populate quotas, branch limit, and pricing."}
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    className="h-9 px-4 text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 shrink-0"
                    onClick={() => {
                      setPlanDialogMode("select")
                      setPlanDialogOpen(true)
                    }}
                  >
                    <Sparkles className="size-3.5" />
                    <span>
                      {formData.planName ? "Change Plan" : "Select Plan"}
                    </span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div
                    onClick={() => {
                      setPlanDialogMode("review")
                      setPlanDialogOpen(true)
                    }}
                    className="p-3.5 rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/15 transition-all"
                  >
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                        ACTIVE SAAS TIER
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-foreground tracking-tight">
                          {formData.planName} Plan
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-xs font-bold text-primary border-primary/40 bg-card"
                        >
                          {formData.billingCycle}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      className="h-8 text-xs font-bold gap-1.5 shadow-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPlanDialogMode("review")
                        setPlanDialogOpen(true)
                      }}
                    >
                      <FileText className="size-3.5" />
                      <span>Review Plan Details</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-lg border border-border/80 bg-muted/30 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                        <CreditCard className="size-3 text-muted-foreground" />
                        Plan Fee
                      </span>
                      <p className="text-base font-black text-foreground tabular-nums">
                        ₹{formData.planFee.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-border/80 bg-muted/30 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                        <Building2 className="size-3 text-primary" />
                        Branch Quota
                      </span>
                      <p className="text-base font-black text-foreground tabular-nums">
                        {formData.branchesCount}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-border/80 bg-muted/30 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3 text-muted-foreground" />
                        Onboarded
                      </span>
                      <p className="text-xs font-bold text-foreground">
                        {formData.joinedDate}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-border/80 bg-muted/30 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3 text-amber-500" />
                        Renewal Date
                      </span>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        {formData.planEndDate}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-border/70 bg-card flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[11px] font-bold text-muted-foreground">
                      Enabled Platform Features:
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <Badge variant="secondary" className="gap-1 font-medium">
                        <Check className="size-3 text-emerald-500" /> Public
                        Microsite
                      </Badge>
                      <Badge variant="secondary" className="gap-1 font-medium">
                        <Check className="size-3 text-emerald-500" /> OAuth
                        Email Relay
                      </Badge>
                      <Badge variant="secondary" className="gap-1 font-medium">
                        <CheckCircle2 className="size-3 text-emerald-500" />{" "}
                        Student Mobile App
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Business KYC & Verification Documents */}
          <LibraryDocumentsSection
            documents={documents}
            onChange={setDocuments}
            isAddMode={isAddMode}
          />
        </div>
      </div>

      {/* FLOATING CENTERED BOTTOM ACTION BAR (ONLY BUTTONS) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-3 p-1.5 px-3 rounded-full border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 px-5 text-xs font-semibold rounded-full cursor-pointer hover:bg-muted"
          onClick={() => router.push(cancelUrl)}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isSaving}
          className="h-9 px-6 gap-1.5 text-xs font-bold rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 cursor-pointer"
        >
          {isSaving ? (
            <>
              <RotateCcw className="size-3.5 animate-spin" />
              <span>{isAddMode ? "Onboarding..." : "Saving..."}</span>
            </>
          ) : isAddMode ? (
            <>
              <Building2 className="size-3.5" />
              <span>Onboard Library</span>
            </>
          ) : (
            <>
              <Save className="size-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </Button>
      </div>

      {/* REUSABLE PLATFORM PLAN DIALOG */}
      <LibraryPlanDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        mode={planDialogMode}
        currentPlanName={formData.planName}
        onSelectPlan={handlePlanSelected}
      />
    </form>
  )
}
