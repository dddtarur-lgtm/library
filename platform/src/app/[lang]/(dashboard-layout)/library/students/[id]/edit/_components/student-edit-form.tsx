"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Armchair,
  BookMarked,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock,
  CreditCard,
  FileText,
  GraduationCap,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  QrCode,
  RotateCcw,
  Save,
  ShieldAlert,
  Sparkles,
  User,
  UserPlus,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

import type { LocaleType } from "@/types"
import type { StudentProfile } from "@/data/students-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import { getInitials } from "@/lib/utils"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  PlanDetailsDialog,
  type PlanOption,
} from "@/components/students/plan-details-dialog"
import {
  StudentDocumentsSection,
  type StudentDocumentItem,
} from "./student-documents-section"

export function StudentEditForm({
  student,
  locale,
  mode = "edit",
}: {
  student?: StudentProfile
  locale: LocaleType
  mode?: "add" | "edit"
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isAddMode = mode === "add"

  // Auto-generate ID or fallback data for Add Mode
  const activeStudentId = student?.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`
  const activeQrId = student?.qrCardId || `QR-${Math.floor(1000 + Math.random() * 9000)}-SECURE`

  // Today's date and due date
  const today = new Date().toISOString().split("T")[0]
  const defaultDue = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  // Split name if editing
  const nameParts = (student?.name || "").trim().split(" ")
  const initialFirstName = isAddMode ? "" : (nameParts[0] || "")
  const initialLastName = isAddMode ? "" : (nameParts.slice(1).join(" ") || "")

  // Comprehensive editable state
  const [formData, setFormData] = useState({
    // Basic Profile & Photo
    firstName: initialFirstName,
    lastName: initialLastName,
    avatar: student?.avatar || "/images/avatars/male-01.svg",
    status: (student?.status || "Live") as "Live" | "Pending" | "Expired" | "Suspended",
    examTarget: student?.examTarget || "UPSC CSE 2026",
    targetYear: student?.targetYear || "2026",
    college: student?.college || "Delhi University",

    // Contact & Personal
    phone: student?.phone || "",
    email: student?.email || "",
    gender: (student?.gender || "Male") as "Male" | "Female" | "Other",
    bloodGroup: student?.bloodGroup || "B+",
    dob: student?.dob || "2002-05-15",
    address: student?.address || "",

    // Guardian
    guardianName: student?.guardianName || "",
    guardianRelation: student?.guardianRelation || "Father",
    guardianPhone: student?.guardianPhone || "",

    // Allocation & Membership
    branch: student?.branch || "Mukherjee Nagar Branch (HQ)",
    plan: student?.plan || "Quarterly Premium (3 Months)",
    planDuration: student?.planDuration || "3 Months",
    shift: student?.shift || "Morning (7:00 AM - 2:00 PM)",
    seatNo: student?.seatNo || "Seat-042",
    floor: student?.floor || "2nd Floor Discussion",
    room: student?.room || "Silent Wing A",
    lockerNo: student?.lockerNo || "None",
    joinDate: student?.joinDate || today,
    dueDate: student?.dueDate || defaultDue,
    qrCardId: activeQrId,

    // Pricing & Fees
    totalFee: student?.totalFee || 3300,
    paidAmount: student?.paidAmount || 3300,
    feeStatus: (student?.feeStatus || "Paid") as "Paid" | "Pending" | "Overdue",
    paymentMode: "UPI / QR",

    // Access
    gateAccessEnabled: isAddMode ? true : student?.status === "Live",
  })

  // Common Plan Details Dialog state
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [planDialogMode, setPlanDialogMode] = useState<"select" | "review">(
    isAddMode ? "select" : "review"
  )
  const [isSaving, setIsSaving] = useState(false)

  // Document Uploads State (Multiple documents with preview & titles)
  const [documents, setDocuments] = useState<StudentDocumentItem[]>(() => {
    if (isAddMode) return []
    return [
      {
        id: "doc-1",
        title: "Aadhaar Card",
        documentNumber: "XXXX-XXXX-4819",
        fileName: "aadhaar_card_front.jpg",
        fileSize: "1.4 MB",
        fileType: "image",
        fileUrl:
          "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80",
        uploadedAt: "12 Jan 2026",
      },
      {
        id: "doc-2",
        title: "College ID Card",
        documentNumber: "DU/2023/8812",
        fileName: "college_id_ramjas.png",
        fileSize: "820 KB",
        fileType: "image",
        fileUrl:
          "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80",
        uploadedAt: "14 Jan 2026",
      },
    ]
  })

  // Balance due
  const calculatedDue = Math.max(
    0,
    Number(formData.totalFee || 0) - Number(formData.paidAmount || 0)
  )

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle plan chosen from the common PlanDetailsDialog
  const handlePlanSelectedFromDialog = (plan: PlanOption) => {
    const calculatedDueDate = new Date(Date.now() + plan.days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]

    setFormData((prev) => ({
      ...prev,
      plan: plan.name,
      planDuration: plan.duration,
      totalFee: plan.price,
      paidAmount: plan.price,
      feeStatus: "Paid",
      dueDate: calculatedDueDate,
    }))
    toast.success(`Plan updated to ${plan.name}`, {
      description: `Fee set to ₹${plan.price.toLocaleString()} for ${plan.days} days validity.`,
    })
  }

  // Avatar Upload (Plus button without ripple)
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      handleChange("avatar", url)
      toast.success("Profile photo updated!", {
        description: "New image preview applied to student profile.",
      })
    }
  }

  // Submit handler (handles both Add and Edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName.trim()) {
      toast.error("First name is required")
      return
    }

    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      const fullName = `${formData.firstName} ${formData.lastName}`.trim()

      if (isAddMode) {
        toast.success(`Student ${fullName} registered successfully!`, {
          description: `Assigned ID: ${activeStudentId}. Desk ${formData.seatNo} allocated.`,
        })
        router.push(ensureLocalizedPathname(`/pages/students/${activeStudentId}`, locale))
      } else {
        toast.success(`Profile for ${fullName} updated successfully!`, {
          description: "Personal details and allocation have been saved.",
        })
        router.push(ensureLocalizedPathname(`/pages/students/${student?.studentId || activeStudentId}`, locale))
      }
    }, 500)
  }

  // Cancel URL
  const cancelUrl = isAddMode
    ? ensureLocalizedPathname("/dashboards/students", locale)
    : ensureLocalizedPathname(`/pages/students/${student?.studentId || activeStudentId}`, locale)

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 min-w-0 pb-28">
      {/* Top Breadcrumb / Back Navigation */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href={cancelUrl}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0",
          })}
        >
          <ChevronLeft className="size-4" />
          <span>
            {isAddMode ? "Back to Students Directory" : "Back to Student Profile"}
          </span>
        </Link>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground shrink-0">
          <span className="truncate">
            {isAddMode ? "New Student ID: " : "Student ID: "}
            <strong className="text-foreground">{activeStudentId}</strong>
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
            <span>{isAddMode ? "New Admission" : "Editing"}</span>
          </Badge>
        </div>
      </div>

      {/* =========================================================================
          PROFILE HEADER CARD (IN-PLACE EDITABLE LAYOUT)
         ========================================================================= */}
      <section className="rounded-xl border border-border bg-card p-3.5 sm:p-4 md:p-5 shadow-xs space-y-4 min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 min-w-0">
          {/* Left Side: Avatar with Plus Corner Button (NO RIPPLE) + Editable Names */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0 flex-1">
            {/* Avatar Container with Corner Plus Button (NO RIPPLE) */}
            <div className="relative shrink-0">
              <Avatar className="size-20 sm:size-22 rounded-xl border-2 border-border shadow-xs shrink-0 overflow-hidden bg-muted">
                <AvatarImage
                  src={formData.avatar}
                  alt={`${formData.firstName} ${formData.lastName}`}
                  className="object-cover"
                />
                <AvatarFallback className="text-xl font-bold bg-muted text-foreground">
                  {getInitials(`${formData.firstName} ${formData.lastName}` || "ST")}
                </AvatarFallback>
              </Avatar>

              {/* Crisp Corner Plus Button (NO RIPPLE) */}
              <button
                type="button"
                onClick={handleAvatarClick}
                className="absolute -bottom-1.5 -right-1.5 flex size-7 sm:size-7.5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer border-2 border-card"
                title="Upload profile photo"
                aria-label="Upload profile photo"
              >
                <Plus className="size-4 stroke-[2.5]" />
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Editable Names & Core Header Meta */}
            <div className="space-y-2.5 min-w-0 flex-1 w-full sm:w-auto">
              {/* First Name & Last Name Inputs side by side */}
              <div className="flex flex-wrap items-center gap-2 max-w-lg">
                <div className="flex-1 min-w-[130px] space-y-1">
                  <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder="First Name"
                    className="h-8.5 text-xs font-semibold bg-background"
                  />
                </div>
                <div className="flex-1 min-w-[130px] space-y-1">
                  <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Last Name
                  </Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder="Last Name"
                    className="h-8.5 text-xs font-semibold bg-background"
                  />
                </div>

                {/* Status Dropdown */}
                <div className="w-[125px] space-y-1 shrink-0">
                  <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val: any) => handleChange("status", val)}
                  >
                    <SelectTrigger className="h-8.5 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Live" className="font-semibold text-emerald-600">
                        Studying (Live)
                      </SelectItem>
                      <SelectItem value="Pending" className="font-semibold text-amber-600">
                        Pending
                      </SelectItem>
                      <SelectItem value="Expired" className="font-semibold text-rose-600">
                        Expired
                      </SelectItem>
                      <SelectItem value="Suspended" className="font-semibold text-destructive">
                        Suspended
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Target Exam Input */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground font-semibold shrink-0">
                  Target Exam:
                </span>
                <Input
                  value={formData.examTarget}
                  onChange={(e) => handleChange("examTarget", e.target.value)}
                  placeholder="e.g. UPSC CSE 2026, NEET UG"
                  className="h-7 text-xs font-medium max-w-xs bg-background"
                />
              </div>

              {/* Quick Contacts Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-medium pt-0.5">
                <span className="inline-flex items-center gap-1.5 text-foreground/90 shrink-0">
                  <Phone className="size-3 text-primary shrink-0" />
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="Mobile Phone"
                    className="h-7 text-xs w-32 font-medium bg-background"
                  />
                </span>
                <span className="inline-flex items-center gap-1.5 text-foreground/90 shrink-0">
                  <Mail className="size-3 text-primary shrink-0" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="Email address"
                    className="h-7 text-xs w-44 font-medium bg-background"
                  />
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Assigned Desk & Current / Membership Plan Box */}
          <div className="rounded-xl border border-border/80 bg-muted/40 p-3 sm:p-3.5 flex flex-wrap sm:flex-nowrap items-center gap-3.5 shrink-0 justify-between sm:justify-start">
            {/* Assigned Desk Box */}
            <div className="min-w-[120px] space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                <Armchair className="size-3 text-primary shrink-0" />
                ASSIGNED DESK
              </p>
              <Select
                value={formData.seatNo}
                onValueChange={(val) => handleChange("seatNo", val)}
              >
                <SelectTrigger className="h-8 text-xs font-bold bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Seat-008">Seat-008 (GF)</SelectItem>
                  <SelectItem value="Seat-015">Seat-015 (1F)</SelectItem>
                  <SelectItem value="Seat-022">Seat-022 (1F)</SelectItem>
                  <SelectItem value="Seat-042">Seat-042 (2F)</SelectItem>
                  <SelectItem value="Seat-058">Seat-058 (2F)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground font-medium truncate">
                {formData.shift.split("(")[0].trim()}
              </p>
            </div>

            {/* Vertical Divider */}
            <div className="w-px h-12 bg-border/80 shrink-0 hidden sm:block" />

            {/* Membership / Current Plan Box (Opens Common Plan Dialog) */}
            <div className="min-w-[145px] flex flex-col justify-center space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CreditCard className="size-3 text-emerald-500 shrink-0" />
                {isAddMode ? "MEMBERSHIP PLAN" : "CURRENT PLAN"}
              </p>

              {/* Interactive Plan Button Trigger matching user screenshot */}
              <button
                type="button"
                onClick={() => {
                  setPlanDialogMode(isAddMode ? "select" : "review")
                  setPlanDialogOpen(true)
                }}
                className="h-8.5 px-3 rounded-lg border border-border/90 bg-background hover:bg-muted/60 transition-all flex items-center justify-between gap-2 text-xs font-bold text-foreground cursor-pointer shadow-xs min-w-[155px] group"
                title={isAddMode ? "Click to view plan details & select" : "Click to review current plan details"}
              >
                <span className="truncate">
                  {formData.planDuration} (₹{Number(formData.totalFee).toLocaleString()})
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Branch & Gate Access strip */}
        <div className="border-t border-border/70 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="size-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">Branch Campus:</span>
            <Select
              value={formData.branch}
              onValueChange={(val) => handleChange("branch", val)}
            >
              <SelectTrigger className="h-7 text-xs w-56 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mukherjee Nagar Branch (HQ)">
                  Mukherjee Nagar Branch (HQ)
                </SelectItem>
                <SelectItem value="Rajendra Nagar Branch">
                  Rajendra Nagar Branch
                </SelectItem>
                <SelectItem value="Karol Bagh Campus">
                  Karol Bagh Campus
                </SelectItem>
                <SelectItem value="Kalu Sarai Center">
                  Kalu Sarai Center
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <QrCode className="size-3.5 text-primary" />
              <span className="font-mono text-[11px] text-muted-foreground">
                Card ID: <strong className="text-foreground">{formData.qrCardId}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Label htmlFor="gate-access" className="text-xs cursor-pointer">
                QR Turnstile Gate Access
              </Label>
              <Switch
                id="gate-access"
                checked={formData.gateAccessEnabled}
                onCheckedChange={(checked) => handleChange("gateAccessEnabled", checked)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MAIN LAYOUT: LEFT INFO COLUMN + RIGHT FORM CARDS
         ========================================================================= */}
      <div className="flex flex-col lg:flex-row gap-4 pt-1 min-w-0 w-full items-start">
        {/* ================= LEFT COLUMN: DETAILS & ALLOCATION ================= */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-3 min-w-0">
          {/* 1. Membership & Allocation Card */}
          <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
            <CardHeader className="p-3 pb-2 border-b border-border/80 bg-muted/20">
              <div className="flex items-center justify-between min-w-0 gap-2">
                <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate text-foreground">
                  <BookMarked className="size-3.5 text-primary shrink-0" />
                  <span className="truncate">Membership Details</span>
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold border-primary/30 text-primary bg-primary/5 shrink-0 px-1.5 py-0"
                >
                  {formData.planDuration}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-2.5 text-xs">
              {/* Branch */}
              <div className="space-y-1">
                <Label className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium">
                  <Building2 className="size-3 text-muted-foreground" />
                  Branch
                </Label>
                <Select
                  value={formData.branch}
                  onValueChange={(val) => handleChange("branch", val)}
                >
                  <SelectTrigger className="h-8 text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mukherjee Nagar Branch (HQ)">
                      Mukherjee Nagar (HQ)
                    </SelectItem>
                    <SelectItem value="Rajendra Nagar Branch">
                      Rajendra Nagar
                    </SelectItem>
                    <SelectItem value="Karol Bagh Campus">Karol Bagh</SelectItem>
                    <SelectItem value="Kalu Sarai Center">Kalu Sarai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Allocated Seat & Floor */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium">
                    <Armchair className="size-3 text-blue-500" />
                    Allocated Seat
                  </Label>
                  <Select
                    value={formData.seatNo}
                    onValueChange={(val) => handleChange("seatNo", val)}
                  >
                    <SelectTrigger className="h-8 text-xs font-bold text-blue-600 dark:text-blue-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Seat-008">Seat-008</SelectItem>
                      <SelectItem value="Seat-015">Seat-015</SelectItem>
                      <SelectItem value="Seat-022">Seat-022</SelectItem>
                      <SelectItem value="Seat-042">Seat-042</SelectItem>
                      <SelectItem value="Seat-058">Seat-058</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-[11px] font-medium">
                    Floor
                  </Label>
                  <Select
                    value={formData.floor}
                    onValueChange={(val) => handleChange("floor", val)}
                  >
                    <SelectTrigger className="h-8 text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ground Floor">Ground Floor</SelectItem>
                      <SelectItem value="1st Floor Quiet">1st Floor</SelectItem>
                      <SelectItem value="2nd Floor Discussion">2nd Floor</SelectItem>
                      <SelectItem value="3rd Floor Silent Wing">3rd Floor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Shift */}
              <div className="space-y-1">
                <Label className="text-muted-foreground text-[11px] font-medium">
                  Study Shift
                </Label>
                <Select
                  value={formData.shift}
                  onValueChange={(val) => handleChange("shift", val)}
                >
                  <SelectTrigger className="h-8 text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Morning (7:00 AM - 2:00 PM)">
                      Morning (7 AM - 2 PM)
                    </SelectItem>
                    <SelectItem value="Evening (2:00 PM - 9:00 PM)">
                      Evening (2 PM - 9 PM)
                    </SelectItem>
                    <SelectItem value="Full Day (7:00 AM - 10:00 PM)">
                      Full Day (7 AM - 10 PM)
                    </SelectItem>
                    <SelectItem value="Night Owl (9:00 PM - 6:00 AM)">
                      Night Owl (9 PM - 6 AM)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Locker Number */}
              <div className="space-y-1">
                <Label className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium">
                  <Lock className="size-3 text-muted-foreground" />
                  Locker Number
                </Label>
                <Input
                  value={formData.lockerNo}
                  onChange={(e) => handleChange("lockerNo", e.target.value)}
                  placeholder="e.g. L-104 or None"
                  className="h-8 text-xs font-bold"
                />
              </div>

              {/* Admission Date & Due Date */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
                <div className="space-y-1">
                  <Label className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium">
                    <Calendar className="size-2.5 text-muted-foreground" />
                    Admission Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => handleChange("joinDate", e.target.value)}
                    className="h-7 text-xs px-2"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-amber-600 dark:text-amber-400 flex items-center gap-1 text-[10px] font-semibold">
                    <ShieldAlert className="size-2.5 text-amber-500" />
                    Due Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleChange("dueDate", e.target.value)}
                    className="h-7 text-xs px-2 font-bold text-amber-600 dark:text-amber-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Personal Information Card */}
          <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
            <CardHeader className="p-3 pb-2 border-b border-border/80 bg-muted/20">
              <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate text-foreground">
                <User className="size-3.5 text-primary shrink-0" />
                <span className="truncate">Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2.5 text-xs">
              {/* Gender & Blood Group */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-[11px] font-medium">
                    Gender
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(val: any) => handleChange("gender", val)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground text-[11px] font-medium">
                    Blood Group
                  </Label>
                  <Select
                    value={formData.bloodGroup}
                    onValueChange={(val) => handleChange("bloodGroup", val)}
                  >
                    <SelectTrigger className="h-8 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1">
                <Label className="text-muted-foreground text-[11px] font-medium">
                  Date of Birth
                </Label>
                <Input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                  className="h-8 text-xs font-medium"
                />
              </div>

              {/* Mobile Phone */}
              <div className="space-y-1">
                <Label className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
                  <Phone className="size-3 text-muted-foreground" />
                  Primary Phone
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-8 text-xs font-semibold"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <Label className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
                  <Mail className="size-3 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="student@example.com"
                  className="h-8 text-xs font-semibold"
                />
              </div>

              {/* Residential Address */}
              <div className="space-y-1 pt-1 border-t border-border/60">
                <Label className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
                  <MapPin className="size-3 text-muted-foreground" />
                  Residential Address
                </Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  rows={2}
                  className="text-xs resize-none"
                  placeholder="Full street address and pincode"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================= RIGHT COLUMN: GUARDIAN + PLAN DETAILS ================= */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Card 1: Guardian & Academic Profile */}
          <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
            <CardHeader className="p-3.5 pb-2.5 border-b border-border/80 bg-muted/20">
              <div className="flex items-center justify-between min-w-0">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <GraduationCap className="size-4 text-primary shrink-0" />
                  <span>Guardian & Academic Information</span>
                </CardTitle>
                <span className="text-[11px] text-muted-foreground">
                  Background credentials
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">
                    Guardian / Parent Name
                  </Label>
                  <Input
                    value={formData.guardianName}
                    onChange={(e) => handleChange("guardianName", e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="h-8.5 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">
                    Relationship
                  </Label>
                  <Select
                    value={formData.guardianRelation}
                    onValueChange={(val) => handleChange("guardianRelation", val)}
                  >
                    <SelectTrigger className="h-8.5 text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Father">Father</SelectItem>
                      <SelectItem value="Mother">Mother</SelectItem>
                      <SelectItem value="Brother">Brother</SelectItem>
                      <SelectItem value="Sister">Sister</SelectItem>
                      <SelectItem value="Local Guardian">Local Guardian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">
                    Guardian Contact Phone
                  </Label>
                  <Input
                    value={formData.guardianPhone}
                    onChange={(e) => handleChange("guardianPhone", e.target.value)}
                    placeholder="+91 98765 00000"
                    className="h-8.5 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">
                    Target Exam / Goal
                  </Label>
                  <Input
                    value={formData.examTarget}
                    onChange={(e) => handleChange("examTarget", e.target.value)}
                    placeholder="e.g. UPSC CSE, SSC CGL"
                    className="h-8.5 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">
                    Target Exam Year
                  </Label>
                  <Select
                    value={formData.targetYear}
                    onValueChange={(val) => handleChange("targetYear", val)}
                  >
                    <SelectTrigger className="h-8.5 text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                      <SelectItem value="2028">2028</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">
                    College / Coaching Institute
                  </Label>
                  <Input
                    value={formData.college}
                    onChange={(e) => handleChange("college", e.target.value)}
                    placeholder="e.g. Ramjas College, DU"
                    className="h-8.5 text-xs font-medium"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* =========================================================================
              Card 2: Plan, Fees & Payment Configuration
              (USES COMMON PLAN DIALOG FOR SELECTING IN ADD MODE AND REVIEWING IN EDIT MODE)
             ========================================================================= */}
          <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
            <CardHeader className="p-3.5 pb-2.5 border-b border-border/80 bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <CreditCard className="size-4 text-emerald-500 shrink-0" />
                    <span>Plan, Fees & Payment Configuration</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isAddMode
                      ? "Choose membership plan details via dialog and record initial payment."
                      : "Current subscription plan specifications, fees, and membership validity."}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    className={
                      formData.feeStatus === "Paid"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-xs"
                    }
                  >
                    Fee Status: {formData.feeStatus}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-3.5 sm:p-4 space-y-3.5">
              {isAddMode ? (
                /* ===============================================================
                   ADD MODE: ONLY SHOW THE SELECT PLAN BUTTON (PER USER REQUEST)
                   =============================================================== */
                <div className="p-4 sm:p-5 rounded-xl border border-dashed border-border/90 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-start">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-center sm:justify-start gap-1">
                      <CreditCard className="size-3 text-emerald-500" />
                      MEMBERSHIP PLAN
                    </span>
                    <h4 className="text-sm font-bold text-foreground">
                      {formData.plan ? formData.plan : "Choose Membership Plan"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formData.plan
                        ? `Selected duration: ${formData.planDuration} • Fee: ₹${Number(formData.totalFee).toLocaleString()}`
                        : "Click the button below to view available study plans and configure membership."}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="h-9 px-4 text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs cursor-pointer hover:bg-primary/90 shrink-0"
                    onClick={() => {
                      setPlanDialogMode("select")
                      setPlanDialogOpen(true)
                    }}
                  >
                    <Sparkles className="size-3.5" />
                    <span>{formData.plan ? "Change Plan" : "Select Plan"}</span>
                  </Button>
                </div>
              ) : (
                /* ===============================================================
                   EDIT MODE: ACTIVE MEMBERSHIP BANNER + REVIEW BUTTON + METRIC TILES
                   =============================================================== */
                <div className="space-y-3.5">
                  {/* Highlight Banner with Button to Open Common Dialog */}
                  <div
                    onClick={() => {
                      setPlanDialogMode("review")
                      setPlanDialogOpen(true)
                    }}
                    className="p-3.5 rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/15 transition-all group"
                    title="Click to review current subscription plan details"
                  >
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                        ACTIVE MEMBERSHIP PLAN
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-foreground tracking-tight">
                          {formData.plan}
                        </h3>
                        <Badge variant="outline" className="text-xs font-bold text-primary border-primary/40 bg-card">
                          {formData.planDuration}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="h-8 text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
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
                  </div>

                  {/* Clean Metric Tiles */}
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {/* 1. Base Plan Fee */}
                      <div className="p-3 rounded-lg border border-border/80 bg-muted/30 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                          <CreditCard className="size-3 text-muted-foreground" />
                          Plan Fee
                        </span>
                        <p className="text-base font-black text-foreground">
                          ₹{Number(formData.totalFee).toLocaleString()}
                        </p>
                      </div>

                      {/* 2. Amount Paid */}
                      <div className="p-3 rounded-lg border border-border/80 bg-muted/30 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="size-3 text-emerald-500" />
                          Amount Paid
                        </span>
                        <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                          ₹{Number(formData.paidAmount).toLocaleString()}
                        </p>
                      </div>

                      {/* 3. Pending Balance */}
                      <div className="p-3 rounded-lg border border-border/80 bg-muted/30 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                          <ShieldAlert className="size-3 text-rose-500" />
                          Balance Due
                        </span>
                        <p className={`text-base font-black ${calculatedDue > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          ₹{calculatedDue.toLocaleString()}
                        </p>
                      </div>

                      {/* 4. Payment Mode */}
                      <div className="p-3 rounded-lg border border-border/80 bg-muted/30 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                          <Wallet className="size-3 text-primary" />
                          Payment Mode
                        </span>
                        <p className="text-xs font-bold text-foreground truncate">
                          {formData.paymentMode}
                        </p>
                      </div>

                      {/* 5. Admission / Start Date */}
                      <div className="p-3 rounded-lg border border-border/80 bg-muted/30 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                          <Calendar className="size-3 text-muted-foreground" />
                          Start Date
                        </span>
                        <p className="text-xs font-bold text-foreground">
                          {formData.joinDate}
                        </p>
                      </div>

                      {/* 6. Expiry Date */}
                      <div className="p-3 rounded-lg border border-border/80 bg-muted/30 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3 text-amber-500" />
                          Expiry Due Date
                        </span>
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          {formData.dueDate}
                        </p>
                      </div>

                      {/* 7. Allocated Desk */}
                      <div className="p-3 rounded-lg border border-border/80 bg-muted/30 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                          <Armchair className="size-3 text-blue-500" />
                          Allocated Desk
                        </span>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate">
                          {formData.seatNo} ({formData.floor})
                        </p>
                      </div>

                      {/* 8. Study Shift */}
                      <div className="p-3 rounded-lg border border-border/80 bg-muted/30 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3 text-muted-foreground" />
                          Study Shift
                        </span>
                        <p className="text-xs font-semibold text-foreground truncate">
                          {formData.shift.split("(")[0].trim()}
                        </p>
                      </div>
                    </div>

                    {/* Included Plan Privileges */}
                    <div className="p-3 rounded-lg border border-border/70 bg-card flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-[11px] font-bold text-muted-foreground">
                        Included In Current Plan:
                      </span>
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <Badge variant="secondary" className="gap-1 font-medium">
                          <Check className="size-3 text-emerald-500" /> High-Speed Wi-Fi
                        </Badge>
                        <Badge variant="secondary" className="gap-1 font-medium">
                          <Check className="size-3 text-emerald-500" /> Dedicated Power Socket
                        </Badge>
                        <Badge variant="secondary" className="gap-1 font-medium">
                          <Check className="size-3 text-emerald-500" /> Silent Wing Access
                        </Badge>
                        <Badge variant="secondary" className="gap-1 font-medium">
                          <Check className="size-3 text-emerald-500" /> Discussion Zone
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* =========================================================================
              Card 3: Student Documents & Identity Proofs
              (ADMIN CAN ADD MULTIPLE DOCUMENTS WITH TITLE, OPTIONAL DOC NUMBER,
               UPLOAD FILE & PREVIEW - WORKS IN BOTH ADD & EDIT MODES)
             ========================================================================= */}
          <StudentDocumentsSection
            documents={documents}
            onChange={setDocuments}
            isAddMode={isAddMode}
          />
        </div>
      </div>

      {/* =========================================================================
          FLOATING CENTERED ACTION BUTTONS (NO EXTRA TEXT, ONLY BUTTONS IN CENTER)
         ========================================================================= */}
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
              <span>{isAddMode ? "Registering..." : "Saving..."}</span>
            </>
          ) : isAddMode ? (
            <>
              <UserPlus className="size-3.5" />
              <span>Register Student</span>
            </>
          ) : (
            <>
              <Save className="size-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </Button>
      </div>

      {/* =========================================================================
          REUSABLE COMMON PLAN DETAILS DIALOG (FOR SELECTING & REVIEWING PLANS)
         ========================================================================= */}
      <PlanDetailsDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        mode={planDialogMode}
        currentPlan={formData.plan}
        onSelectPlan={handlePlanSelectedFromDialog}
        studentName={`${formData.firstName} ${formData.lastName}`.trim() || "Student"}
        studentId={activeStudentId}
        seatNo={formData.seatNo}
        shift={formData.shift}
        joinDate={formData.joinDate}
        dueDate={formData.dueDate}
        paidAmount={formData.paidAmount}
        totalFee={formData.totalFee}
        feeStatus={formData.feeStatus}
      />
    </form>
  )
}

// Named alias
export const StudentForm = StudentEditForm
