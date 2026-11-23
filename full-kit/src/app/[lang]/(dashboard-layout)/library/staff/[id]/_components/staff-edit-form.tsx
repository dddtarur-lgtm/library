"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Save,
  Search,
  Shield,
  ShieldCheck,
  User,
  UserCog,
} from "lucide-react"
import { toast } from "sonner"

import type { LocaleType } from "@/types"
import type { StaffMember } from "@/data/library-management-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { PERMISSION_MODULES, type PermissionModuleDef } from "./staff-profile-permissions"

export function StaffEditForm({
  staff,
  locale,
  mode = "edit",
}: {
  staff?: StaffMember
  locale: LocaleType
  mode?: "add" | "edit"
}) {
  const router = useRouter()
  const isAddMode = mode === "add"
  const isOwner = staff?.role === "Library Admin"

  const [name, setName] = useState(staff?.name || "")
  const [email, setEmail] = useState(staff?.email || "")
  const [phone, setPhone] = useState(staff?.phone || "+91 ")
  const [avatar, setAvatar] = useState(
    staff?.avatar ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
  )
  const [role, setRole] = useState<StaffMember["role"]>(staff?.role || (isAddMode ? "Sub Admin" : "Library Admin"))
  const [branchName, setBranchName] = useState(
    staff?.branchName || "Main Branch - Central Library"
  )
  const [status, setStatus] = useState<StaffMember["status"]>(staff?.status || "Active")
  const [canViewRevenue, setCanViewRevenue] = useState<boolean>(
    staff?.canViewRevenue ?? (isOwner ? true : false)
  )

  // Granular action permissions map: { [moduleId]: string[] }
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {}
    PERMISSION_MODULES.forEach((mod) => {
      if (staff?.role === "Library Admin") {
        // Library Admin has full access by default, but CAN remove/uncheck their own accesses!
        initial[mod.id] = [...mod.actions]
      } else if (staff?.role === "Sub Admin") {
        if (["dashboard", "students", "attendance", "qr_attendance", "seats", "books"].includes(mod.id)) {
          initial[mod.id] = [...mod.actions]
        } else if (mod.id === "fees") {
          initial[mod.id] = staff.canViewRevenue
            ? [...mod.actions]
            : ["View Fees", "Collect Fee", "Issue Receipt"]
        } else if (mod.id === "reports") {
          initial[mod.id] = ["View Reports", "Attendance Analytics"]
        } else {
          initial[mod.id] = []
        }
      } else if (isAddMode) {
        // New staff default to front desk / sub admin
        if (["students", "attendance", "qr_attendance"].includes(mod.id)) {
          initial[mod.id] = [...mod.actions]
        } else {
          initial[mod.id] = []
        }
      } else {
        // Front Desk
        if (["attendance", "qr_attendance"].includes(mod.id)) {
          initial[mod.id] = [...mod.actions]
        } else if (mod.id === "students") {
          initial[mod.id] = ["View", "Activate", "ResetPassword"]
        } else if (mod.id === "books") {
          initial[mod.id] = ["View Catalog", "Issue Book", "Return Book"]
        } else {
          initial[mod.id] = []
        }
      }
    })
    return initial
  })

  // Search filter
  const [searchQuery, setSearchQuery] = useState("")

  // Accordion open states
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    dashboard: true,
    students: true,
    attendance: true,
    qr_attendance: false,
    fees: false,
    seats: false,
    books: false,
    reports: false,
    staff: false,
    settings: false,
  })

  const toggleExpand = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }))
  }

  // Global counts
  const totalPossibleActions = PERMISSION_MODULES.reduce((acc, m) => acc + m.actions.length, 0)
  const totalSelectedActions = Object.values(selectedPermissions).reduce(
    (acc, arr) => acc + arr.length,
    0
  )
  const isAllSelected = totalSelectedActions === totalPossibleActions && totalPossibleActions > 0

  const handleToggleSelectAllGlobal = (checked: boolean) => {
    const updated: Record<string, string[]> = {}
    PERMISSION_MODULES.forEach((mod) => {
      updated[mod.id] = checked ? [...mod.actions] : []
    })
    setSelectedPermissions(updated)
  }

  const handleToggleModuleSelectAll = (modId: string, checked: boolean) => {
    const mod = PERMISSION_MODULES.find((m) => m.id === modId)
    if (!mod) return
    setSelectedPermissions((prev) => ({
      ...prev,
      [modId]: checked ? [...mod.actions] : [],
    }))
  }

  const handleToggleAction = (modId: string, action: string, checked: boolean) => {
    setSelectedPermissions((prev) => {
      const current = prev[modId] || []
      const next = checked ? [...current, action] : current.filter((a) => a !== action)
      return {
        ...prev,
        [modId]: next,
      }
    })
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in the staff member's name and email.")
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      if (isAddMode) {
        toast.success(`Staff member "${name}" registered successfully!`, {
          description: `Assigned as ${role} at ${branchName}.`,
        })
        router.push(ensureLocalizedPathname("/pages/staff", locale))
      } else {
        toast.success(`Staff profile for "${name}" updated!`, {
          description: "Permissions and details have been synced immediately.",
        })
        router.push(ensureLocalizedPathname(`/pages/staff/${staff?.id || "staff-1"}`, locale))
      }
    }, 600)
  }

  // Filter modules based on search
  const filteredModules = PERMISSION_MODULES.filter((mod) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const matchesTitle = mod.name.toLowerCase().includes(q)
    const matchesAction = mod.actions.some((a) => a.toLowerCase().includes(q))
    return matchesTitle || matchesAction
  })

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-7xl mx-auto space-y-4">
      {/* Top Navigation & Submit Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Link
            href={
              isAddMode
                ? ensureLocalizedPathname("/pages/staff", locale)
                : ensureLocalizedPathname(`/pages/staff/${staff?.id || "staff-1"}`, locale)
            }
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0 cursor-pointer",
            })}
          >
            <ChevronLeft className="size-4" />
            <span>{isAddMode ? "Back to Staff Directory" : "Back to Staff Profile"}</span>
          </Link>
          <span className="text-muted-foreground text-xs font-mono">
            {isAddMode ? "Mode: New Staff Entry" : `Editing: ${staff?.id.toUpperCase()}`}
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Link
            href={
              isAddMode
                ? ensureLocalizedPathname("/pages/staff", locale)
                : ensureLocalizedPathname(`/pages/staff/${staff?.id || "staff-1"}`, locale)
            }
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "h-8 text-xs border-border cursor-pointer",
            })}
          >
            Cancel
          </Link>

          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
          >
            <Save className="size-3.5" />
            <span>{isAddMode ? "Create Staff Member" : "Save Changes"}</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Details Form + Right Granular Permissions (matching image) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Personal, Role, Branch & Financial View (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Basic Identity */}
          <Card className="border border-border bg-card rounded-xl shadow-xs">
            <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/80">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <UserCog className="size-4 text-primary" />
                Staff Identity &amp; Contact
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Personal details and login email.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-4 space-y-3 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  placeholder="e.g. Vikram Singhania"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs bg-background border-border rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Official Email (Login ID) <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  type="email"
                  placeholder="staff@shelfspace.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs font-mono bg-background border-border rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Mobile Phone Number
                </Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-9 text-xs font-mono bg-background border-border rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Avatar Image URL
                </Label>
                <div className="flex items-center gap-2">
                  <Avatar className="size-9 rounded-lg border border-border shrink-0">
                    <AvatarImage src={avatar} alt={name} />
                    <AvatarFallback className="text-xs font-bold">
                      {name ? name.slice(0, 2).toUpperCase() : "ST"}
                    </AvatarFallback>
                  </Avatar>
                  <Input
                    placeholder="https://..."
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="h-9 text-xs font-mono bg-background border-border rounded-md flex-1"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Account Status</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger className="h-9 text-xs bg-background border-border rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent hideScrollButtons>
                    <SelectItem value="Active">Active (Full Operational Access)</SelectItem>
                    <SelectItem value="Paused">Paused (Suspended / On Leave)</SelectItem>
                    <SelectItem value="Invited">Invited (Pending First Login)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 2. Role & Branch Assignment */}
          <Card className="border border-border bg-card rounded-xl shadow-xs">
            <CardHeader className="p-3.5 sm:p-4 pb-2 border-b border-border/80">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                Role &amp; Branch Assignment
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Assign campus duty and financial permissions.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-4 space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Assigned Staff Role
                </Label>
                <Select
                  value={role}
                  onValueChange={(v: any) => {
                    setRole(v)
                    if (v === "Library Admin") {
                      handleToggleSelectAllGlobal(true)
                      setCanViewRevenue(true)
                    }
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-background border-border rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent hideScrollButtons>
                    <SelectItem value="Library Admin">Library Admin (Owner / Superuser)</SelectItem>
                    <SelectItem value="Sub Admin">Sub Admin (Branch Operations)</SelectItem>
                    <SelectItem value="Front Desk Staff">Front Desk Staff (Attendance &amp; Entry)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Branch Assignment
                </Label>
                <Select value={branchName} onValueChange={setBranchName}>
                  <SelectTrigger className="h-9 text-xs bg-background border-border rounded-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent hideScrollButtons>
                    <SelectItem value="All Branches (Owner Access)">All Branches (Owner Access)</SelectItem>
                    <SelectItem value="Main Branch - Central Library">Main Branch - Central Library</SelectItem>
                    <SelectItem value="Branch 2 - West Campus Annex">Branch 2 - West Campus Annex</SelectItem>
                    <SelectItem value="Branch 3 - North Tech Hub">Branch 3 - North Tech Hub</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Financial View Access Switch */}
              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {canViewRevenue ? (
                      <Eye className="size-4 text-emerald-500" />
                    ) : (
                      <EyeOff className="size-4 text-amber-500" />
                    )}
                    <span className="font-semibold text-foreground">
                      Financial View Access
                    </span>
                  </div>
                  <Switch
                    checked={canViewRevenue}
                    onCheckedChange={setCanViewRevenue}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {canViewRevenue
                    ? "Staff member CAN view daily library collection totals and desk collections tab."
                    : "Staff member CANNOT view revenue numbers (containers and desk collections tab are completely hidden)."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Permission Assignment Tree matching screenshot (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          <Card className="border border-border bg-card rounded-xl shadow-xs overflow-hidden">
            <CardHeader className="p-3.5 sm:p-4 pb-3 border-b border-border/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Shield className="size-4 text-primary" />
                    Permission Assignment
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Assign granular access control.
                  </CardDescription>
                </div>

                {/* Search Bar matching image */}
                <div className="relative w-full sm:w-56">
                  <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs bg-muted/40 border-border rounded-lg"
                  />
                </div>
              </div>

              {/* Global Full Access Bar matching image */}
              <div className="p-3 mt-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <ShieldCheck className="size-4 text-primary" />
                  <span>Full Access</span>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/20 text-primary">
                    {totalSelectedActions} / {totalPossibleActions} Granted
                  </Badge>
                </div>

                <label className="flex items-center gap-2 font-medium text-xs text-foreground cursor-pointer select-none">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => handleToggleSelectAllGlobal(Boolean(checked))}
                    className="border-primary/40 data-[state=checked]:bg-primary"
                  />
                  <span className="text-primary font-semibold">Select All Permissions</span>
                </label>
              </div>
            </CardHeader>

            <CardContent className="p-3.5 sm:p-4 space-y-2.5 text-xs">
              {filteredModules.map((mod) => {
                const isExpanded = searchQuery.trim() ? true : Boolean(expandedModules[mod.id])
                const selectedInMod = selectedPermissions[mod.id] || []
                const isModAllSelected =
                  selectedInMod.length === mod.actions.length && mod.actions.length > 0

                return (
                  <div
                    key={mod.id}
                    className="rounded-xl border border-border/80 bg-muted/10 overflow-hidden transition-colors"
                  >
                    {/* Module Header Bar */}
                    <div className="p-3 sm:px-4 flex items-center justify-between gap-3 bg-muted/30 hover:bg-muted/40 transition-colors">
                      <button
                        type="button"
                        onClick={() => toggleExpand(mod.id)}
                        className="flex items-center gap-2 text-left min-w-0 flex-1 cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                          {mod.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0 font-mono",
                            selectedInMod.length === mod.actions.length
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : selectedInMod.length > 0
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {selectedInMod.length}/{mod.actions.length}
                        </Badge>
                      </button>

                      {/* Module Select All Checkbox */}
                      <label className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none shrink-0">
                        <Checkbox
                          checked={isModAllSelected}
                          onCheckedChange={(checked) =>
                            handleToggleModuleSelectAll(mod.id, Boolean(checked))
                          }
                          className="border-muted-foreground/40 data-[state=checked]:bg-primary"
                        />
                        <span className="text-xs font-medium">Select All</span>
                      </label>
                    </div>

                    {/* Module Action Checkboxes (when expanded) */}
                    {isExpanded && (
                      <div className="p-3.5 sm:p-4 pt-3 border-t border-border/60 bg-card/60">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {mod.actions.map((action) => {
                            const isChecked = selectedInMod.includes(action)
                            const isMatch =
                              searchQuery.trim() && action.toLowerCase().includes(searchQuery.toLowerCase())

                            return (
                              <label
                                key={action}
                                className={cn(
                                  "flex items-center gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer select-none text-xs",
                                  isChecked
                                    ? "bg-primary/5 border-primary/30 text-foreground"
                                    : "bg-muted/15 border-border/60 text-muted-foreground hover:text-foreground hover:border-border",
                                  isMatch && "ring-1 ring-primary"
                                )}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) =>
                                    handleToggleAction(mod.id, action, Boolean(checked))
                                  }
                                  className="border-muted-foreground/40 data-[state=checked]:bg-primary"
                                />
                                <span className={cn("font-medium truncate", isChecked && "text-foreground font-semibold")}>
                                  {action}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {filteredModules.length === 0 && (
                <div className="p-8 text-center text-xs text-muted-foreground border border-border/60 rounded-xl bg-card">
                  No permissions match &quot;{searchQuery}&quot;.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
