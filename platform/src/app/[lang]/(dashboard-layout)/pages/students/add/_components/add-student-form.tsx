"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Armchair,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coins,
  HeartHandshake,
  Upload,
  User,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"

import type { LocaleType } from "@/types"

import { ensureLocalizedPathname } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AddStudentForm({ locale }: { locale: LocaleType }) {
  const router = useRouter()

  // Stepper state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [direction, setDirection] = useState<"forward" | "backward">("forward")

  // Photo
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(
    "/images/avatars/male-01.svg"
  )

  // Step 1: Personal Details
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [gender, setGender] = useState("Male")
  const [dob, setDob] = useState("2002-05-15")
  const [bloodGroup, setBloodGroup] = useState("O+")
  const [address, setAddress] = useState("")

  // Step 2: Guardian & Academic
  const [guardianName, setGuardianName] = useState("")
  const [guardianPhone, setGuardianPhone] = useState("")
  const [guardianRelation, setGuardianRelation] = useState("Father")
  const [examTarget, setExamTarget] = useState("UPSC Civil Services")
  const [college, setCollege] = useState("")

  // Step 3: Membership, Seat & Payment
  const [branch, setBranch] = useState("Central Study Hub (Main Branch)")
  const [plan, setPlan] = useState("6-month")
  const [shift, setShift] = useState("Full Day (8:00 AM - 10:00 PM)")
  const [floor, setFloor] = useState("1st Floor (Quiet Zone)")
  const [seatNo, setSeatNo] = useState("A-14")
  const [lockerNo, setLockerNo] = useState("L-18")
  const [paymentMode, setPaymentMode] = useState("UPI / QR")
  const [paymentStatus, setPaymentStatus] = useState("Paid")
  const [sendWhatsApp, setSendWhatsApp] = useState(true)

  // Plan Pricing
  const planPrices: Record<string, { duration: string; fee: number }> = {
    "1-month": { duration: "1 Month", fee: 1200 },
    "3-month": { duration: "3 Months", fee: 3300 },
    "6-month": { duration: "6 Months", fee: 6000 },
    "1-year": { duration: "1 Year", fee: 11000 },
  }

  const selectedPrice = planPrices[plan] || planPrices["6-month"]

  const steps = [
    {
      id: 1,
      title: "Personal Info",
      icon: User,
    },
    {
      id: 2,
      title: "Guardian & Academic",
      icon: HeartHandshake,
    },
    {
      id: 3,
      title: "Plan, Seat & Payment",
      icon: Coins,
    },
  ]

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoPreview(URL.createObjectURL(file))
      toast.success("Profile photo uploaded successfully")
    }
  }

  // Step Navigation Handlers
  const handleNext = () => {
    if (currentStep === 1) {
      if (!name.trim()) {
        toast.error("Please enter the student's full name")
        return
      }
      if (!phone.trim()) {
        toast.error("Please enter the mobile phone number")
        return
      }
      setDirection("forward")
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setDirection("forward")
      setCurrentStep(3)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setDirection("backward")
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)
    }
  }

  const handleStepClick = (stepId: number) => {
    // Only allow clicking to earlier steps or next step if valid
    if (stepId < currentStep) {
      setDirection("backward")
      setCurrentStep(stepId as 1 | 2 | 3)
    } else if (stepId === 2 && currentStep === 1) {
      handleNext()
    } else if (stepId === 3 && currentStep === 2) {
      handleNext()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !phone) {
      toast.error("Please enter student name and mobile number")
      setCurrentStep(1)
      return
    }

    toast.success(`Student ${name} successfully admitted!`, {
      description: `Assigned Seat ${seatNo} on ${selectedPrice.duration} Plan. Welcome SMS & WhatsApp dispatched.`,
    })

    setTimeout(() => {
      router.push(ensureLocalizedPathname("/pages/students/STU-1081", locale))
    }, 800)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            New Student Admission
          </h1>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge
            variant="outline"
            className="border-primary/30 text-primary bg-primary/5 text-xs font-semibold px-2.5 py-1 rounded-md"
          >
            Step {currentStep} of 3
          </Badge>
          <Link
            href={ensureLocalizedPathname("/dashboards/students", locale)}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
            )}
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* Modern Stepper Navigation Header */}
      <Card className="border-border bg-card shadow-xs rounded-xl overflow-hidden p-3 sm:p-4">
        <div className="relative flex items-center justify-between max-w-xl mx-auto px-4 sm:px-8">
          {/* Progress Connecting Track */}
          <div className="absolute left-12 right-12 top-5 h-0.5 bg-border/80 -z-0">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{
                width:
                  currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
              }}
            />
          </div>

          {/* Stepper Node Items */}
          {steps.map((step) => {
            const isCompleted = step.id < currentStep
            const isActive = step.id === currentStep
            const StepIcon = step.icon

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(step.id)}
                className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-hidden"
              >
                {/* Node Circle */}
                <div
                  className={cn(
                    "size-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-xs",
                    isCompleted &&
                      "bg-primary border-primary text-primary-foreground",
                    isActive &&
                      "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20 scale-110",
                    !isCompleted &&
                      !isActive &&
                      "bg-card border-border text-muted-foreground group-hover:border-primary/50"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4.5 stroke-3" />
                  ) : (
                    <StepIcon className="size-4" />
                  )}
                </div>

                {/* Node Label */}
                <span
                  className={cn(
                    "text-xs font-semibold mt-2 transition-colors text-center hidden sm:block",
                    isActive && "text-primary font-bold",
                    isCompleted && "text-foreground",
                    !isCompleted && !isActive && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Main Stepper Content Area with Slide & Fade Animation */}
      <Card className="border-border bg-card shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/80 flex flex-row items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
            {currentStep === 1 && (
              <>
                <User className="size-4.5 text-primary" />
                <span>1. Personal & Contact Information</span>
              </>
            )}
            {currentStep === 2 && (
              <>
                <HeartHandshake className="size-4.5 text-primary" />
                <span>2. Guardian & Academic Preparation</span>
              </>
            )}
            {currentStep === 3 && (
              <>
                <Coins className="size-4.5 text-emerald-500" />
                <span>3. Membership Plan, Seat & Fee Payment</span>
              </>
            )}
          </CardTitle>
          <span className="text-xs text-muted-foreground font-medium">
            Step {currentStep} of 3
          </span>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 min-w-0">
          <div
            key={currentStep}
            className={cn(
              "animate-in fade-in-50 duration-300 ease-out",
              direction === "forward"
                ? "slide-in-from-right-6"
                : "slide-in-from-left-6"
            )}
          >
            {/* STEP 1: Personal Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {/* Photo Upload Row */}
                <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 border border-border/70">
                  <Avatar className="size-16 rounded-xl border border-border/80 shadow-xs shrink-0">
                    <AvatarImage src={photoPreview} alt="Student Avatar" />
                    <AvatarFallback className="text-sm font-bold bg-muted">
                      {name ? name.slice(0, 2).toUpperCase() : "ST"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-foreground">
                      Student Profile Photo
                    </p>
                    <label
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "cursor-pointer h-8 px-3 text-xs font-medium inline-flex items-center gap-1.5 rounded-lg"
                      )}
                    >
                      <Upload className="size-3.5" />
                      <span>Upload Picture</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  </div>
                </div>

                {/* Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Full Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="e.g. Aarav Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-9.5 rounded-lg text-sm bg-background/50 border-input focus:bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Mobile Phone <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="h-9.5 rounded-lg text-sm bg-background/50 border-input focus:bg-background"
                    />
                  </div>
                </div>

                {/* Email & Gender & Blood Group */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="student@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-9.5 rounded-lg text-sm bg-background/50 border-input focus:bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Gender
                    </label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="h-9.5 rounded-lg text-sm bg-background/50 border-input">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Blood Group
                    </label>
                    <Select value={bloodGroup} onValueChange={setBloodGroup}>
                      <SelectTrigger className="h-9.5 rounded-lg text-sm bg-background/50 border-input">
                        <SelectValue placeholder="Blood Group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Residential Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Residential Address
                  </label>
                  <Input
                    placeholder="Street, Area, City, Pin Code"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-9.5 rounded-lg text-sm bg-background/50 border-input focus:bg-background"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Guardian & Academic Goals */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Guardian Name
                    </label>
                    <Input
                      placeholder="Father / Mother / Guardian"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      className="h-9.5 rounded-lg text-sm bg-background/50 border-input focus:bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Relation
                    </label>
                    <Select
                      value={guardianRelation}
                      onValueChange={setGuardianRelation}
                    >
                      <SelectTrigger className="h-9.5 rounded-lg text-sm bg-background/50 border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Father">Father</SelectItem>
                        <SelectItem value="Mother">Mother</SelectItem>
                        <SelectItem value="Guardian">Local Guardian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Guardian Phone
                    </label>
                    <Input
                      placeholder="+91 98110 54321"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      className="h-9.5 rounded-lg text-sm bg-background/50 border-input focus:bg-background"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Competitive Exam Target
                    </label>
                    <Select value={examTarget} onValueChange={setExamTarget}>
                      <SelectTrigger className="h-9.5 rounded-lg text-sm bg-background/50 border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UPSC Civil Services">
                          UPSC Civil Services (IAS/IPS)
                        </SelectItem>
                        <SelectItem value="NEET UG Medical">NEET UG Medical</SelectItem>
                        <SelectItem value="JEE Advanced / Mains">
                          JEE Advanced / Mains
                        </SelectItem>
                        <SelectItem value="CA Final / Intermediate">
                          CA Final / Intermediate
                        </SelectItem>
                        <SelectItem value="Banking & SSC Prep">
                          Banking, SSC & Railways
                        </SelectItem>
                        <SelectItem value="State PSC & Judiciary">
                          State PSC & Judiciary
                        </SelectItem>
                        <SelectItem value="Other Self-Study">
                          Other Academic / Self-Study
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      College / Institution
                    </label>
                    <Input
                      placeholder="e.g. Delhi University / Self Study"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="h-9.5 rounded-lg text-sm bg-background/50 border-input focus:bg-background"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Plan, Seat & Payment */}
            {currentStep === 3 && (
              <div className="space-y-5">
                {/* 1. Branch & Shift Timing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Library Branch
                    </label>
                    <Select value={branch} onValueChange={setBranch}>
                      <SelectTrigger className="h-9.5 rounded-lg text-sm bg-background/50 border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Central Study Hub (Main Branch)">
                          Central Study Hub (Main Branch)
                        </SelectItem>
                        <SelectItem value="North Campus Branch">
                          North Campus Branch
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Shift Timing
                    </label>
                    <Select value={shift} onValueChange={setShift}>
                      <SelectTrigger className="h-9.5 rounded-lg text-sm bg-background/50 border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full Day (8:00 AM - 10:00 PM)">
                          Full Day (8:00 AM - 10:00 PM)
                        </SelectItem>
                        <SelectItem value="Morning (8:00 AM - 2:00 PM)">
                          Morning Shift (8:00 AM - 2:00 PM)
                        </SelectItem>
                        <SelectItem value="Evening (2:00 PM - 8:00 PM)">
                          Evening Shift (2:00 PM - 8:00 PM)
                        </SelectItem>
                        <SelectItem value="24x7 Night Access">
                          24x7 All-Day & Night Pass
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 2. Floor, Seat & Locker Allocation */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Floor / Zone
                    </label>
                    <Select value={floor} onValueChange={setFloor}>
                      <SelectTrigger className="h-9.5 rounded-lg text-sm bg-background/50 border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st Floor (Quiet Zone)">
                          1st Floor (Quiet Zone)
                        </SelectItem>
                        <SelectItem value="2nd Floor (Girls Wing)">
                          2nd Floor (Girls Wing)
                        </SelectItem>
                        <SelectItem value="3rd Floor (Discussion Hall)">
                          3rd Floor (Discussion Hall)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Seat Number
                    </label>
                    <Select value={seatNo} onValueChange={setSeatNo}>
                      <SelectTrigger className="h-9.5 rounded-lg text-sm bg-background/50 border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A-14">Seat A-14 (Available)</SelectItem>
                        <SelectItem value="A-15">Seat A-15 (Available)</SelectItem>
                        <SelectItem value="B-08">Seat B-08 (Available)</SelectItem>
                        <SelectItem value="C-02">Seat C-02 (Available)</SelectItem>
                        <SelectItem value="Unassigned">Assign Later</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Assigned Locker
                    </label>
                    <Input
                      placeholder="e.g. Locker L-18"
                      value={lockerNo}
                      onChange={(e) => setLockerNo(e.target.value)}
                      className="h-9.5 rounded-lg text-sm bg-background/50 border-input focus:bg-background"
                    />
                  </div>
                </div>

                {/* 3. Plan Duration Selection Grid */}
                <div className="space-y-2 pt-1 border-t border-border/80">
                  <label className="text-xs font-semibold text-foreground block">
                    Select Membership Plan Duration
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(planPrices).map(([key, item]) => {
                      const isSelected = plan === key
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setPlan(key)}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer",
                            isSelected
                              ? "border-primary bg-primary/10 shadow-xs ring-1.5 ring-primary/40 font-bold"
                              : "border-border bg-card hover:bg-muted/40"
                          )}
                        >
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {item.duration}
                          </span>
                          <span
                            className={cn(
                              "text-base font-bold mt-1",
                              isSelected
                                ? "text-primary font-black"
                                : "text-foreground"
                            )}
                          >
                            ₹{item.fee.toLocaleString()}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 4. Fee Summary & Payment Mode in 2-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Fee Breakdown Box */}
                  <div className="rounded-xl border border-border/80 bg-muted/40 p-4 space-y-2 text-xs flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Plan Fee ({selectedPrice.duration})</span>
                        <span className="font-semibold text-foreground">
                          ₹{selectedPrice.fee.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Locker & AC Facilities</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Included
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/80 flex items-center justify-between">
                      <span className="font-bold text-foreground text-sm">
                        Total Payable
                      </span>
                      <span className="text-lg font-black text-primary">
                        ₹{selectedPrice.fee.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Payment Mode & Status Selection */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Payment Mode
                      </label>
                      <Select
                        value={paymentMode}
                        onValueChange={setPaymentMode}
                      >
                        <SelectTrigger className="h-9.5 rounded-lg text-sm bg-background/50 border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UPI / QR">UPI / QR Code</SelectItem>
                          <SelectItem value="Cash">Cash at Front Desk</SelectItem>
                          <SelectItem value="Credit Card">
                            Credit / Debit Card
                          </SelectItem>
                          <SelectItem value="Net Banking">
                            Net Banking / Transfer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Fee Status
                      </label>
                      <Select
                        value={paymentStatus}
                        onValueChange={setPaymentStatus}
                      >
                        <SelectTrigger className="h-9.5 rounded-lg text-sm bg-background/50 border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Paid">
                            Full Payment Received (Paid)
                          </SelectItem>
                          <SelectItem value="Partial">
                            Partial Payment Received
                          </SelectItem>
                          <SelectItem value="Pending">
                            Payment Pending (Due)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 5. Auto Notification Checkbox */}
                <div className="pt-2 border-t border-border/60">
                  <label
                    className="flex items-center gap-2.5 cursor-pointer select-none"
                    onClick={() => setSendWhatsApp(!sendWhatsApp)}
                  >
                    <div
                      className={cn(
                        "size-4.5 rounded border flex items-center justify-center shrink-0",
                        sendWhatsApp
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border bg-card"
                      )}
                    >
                      {sendWhatsApp && <Check className="size-3 stroke-3" />}
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      Send Welcome WhatsApp with Digital ID Card & Guidelines
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        {/* Stepper Footer Controls */}
        <CardFooter className="p-4 sm:p-5 border-t border-border/80 bg-muted/20 flex items-center justify-between">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrev}
              className="h-9 px-4 gap-1.5 text-xs font-semibold rounded-lg cursor-pointer"
            >
              <ChevronLeft className="size-4" />
              <span>Previous Step</span>
            </Button>
          ) : (
            <Link
              href={ensureLocalizedPathname("/dashboards/students", locale)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 px-4 text-xs font-semibold rounded-lg text-muted-foreground hover:text-foreground"
              )}
            >
              Cancel
            </Link>
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              className="h-9 px-5 gap-1.5 text-xs bg-primary text-primary-foreground font-semibold shadow-xs rounded-lg cursor-pointer hover:bg-primary/90"
            >
              <span>Continue</span>
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="sm"
              className="h-9 px-5 gap-2 text-xs bg-primary text-primary-foreground font-semibold shadow-xs rounded-lg cursor-pointer hover:bg-primary/90"
            >
              <CheckCircle2 className="size-4" />
              <span>Complete Admission & Activate</span>
            </Button>
          )}
        </CardFooter>
      </Card>
    </form>
  )
}
