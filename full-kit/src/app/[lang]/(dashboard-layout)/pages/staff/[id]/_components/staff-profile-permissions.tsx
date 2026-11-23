"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  Save,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import type { StaffMember } from "@/data/library-management-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface PermissionModuleDef {
  id: string
  name: string
  actions: string[]
}

export const PERMISSION_MODULES: PermissionModuleDef[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    actions: ["View", "Analytics", "Export"],
  },
  {
    id: "students",
    name: "Student Management",
    actions: [
      "View",
      "Add",
      "Edit",
      "Delete",
      "Suspend",
      "Activate",
      "Import",
      "Export",
      "ResetPassword",
    ],
  },
  {
    id: "attendance",
    name: "Attendance",
    actions: [
      "View",
      "Manual Entry",
      "Mark Present",
      "Bulk Checkout",
      "Export Register",
    ],
  },
  {
    id: "qr_attendance",
    name: "QR Attendance",
    actions: [
      "View",
      "Generate QR",
      "Change Radius",
      "Set Expiry",
      "View Scanned List",
    ],
  },
  {
    id: "fees",
    name: "Fees & Plans",
    actions: [
      "View Fees",
      "Collect Fee",
      "Issue Receipt",
      "Day-Book Reconcile",
      "View Revenue",
      "Refund",
    ],
  },
  {
    id: "seats",
    name: "Seats & Lockers",
    actions: [
      "View Grid",
      "Allocate Seat",
      "Swap Seat",
      "Assign Locker",
      "Release Seat",
    ],
  },
  {
    id: "books",
    name: "Books & Lending",
    actions: [
      "View Catalog",
      "Issue Book",
      "Return Book",
      "Add Book",
      "Send Overdue Alert",
    ],
  },
  {
    id: "reports",
    name: "Reports & Analytics",
    actions: [
      "View Reports",
      "Financial Audit",
      "Attendance Analytics",
      "Export CSV",
    ],
  },
  {
    id: "staff",
    name: "Staff Management",
    actions: ["View Staff", "Add Staff", "Edit Permissions", "Revoke Sessions"],
  },
  {
    id: "settings",
    name: "Settings & Policies",
    actions: [
      "View Settings",
      "Edit Library Rules",
      "Geofence Anchor",
      "SMTP Gateway",
    ],
  },
]

export function StaffProfilePermissions({ staff }: { staff: StaffMember }) {
  // Compute initial selected actions based on role and existing staff permissions
  const isOwner = staff.role === "Library Admin"

  // Initial map of selected permissions: { [moduleId]: Set<actionName> }
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {}
    PERMISSION_MODULES.forEach((mod) => {
      if (isOwner) {
        // Library Admin has all accesses by default, but CAN remove/uncheck them!
        initial[mod.id] = [...mod.actions]
      } else if (staff.role === "Sub Admin") {
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
      } else {
        // Front Desk Staff
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

  // Expanded accordion state (default open for first few or search matches)
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

  // Count total possible actions vs selected actions
  const totalPossibleActions = PERMISSION_MODULES.reduce((acc, m) => acc + m.actions.length, 0)
  const totalSelectedActions = Object.values(selectedPermissions).reduce(
    (acc, arr) => acc + arr.length,
    0
  )
  const isAllSelected = totalSelectedActions === totalPossibleActions && totalPossibleActions > 0

  // Toggle "Select All Permissions" across all modules
  const handleToggleSelectAllGlobal = (checked: boolean) => {
    const updated: Record<string, string[]> = {}
    PERMISSION_MODULES.forEach((mod) => {
      updated[mod.id] = checked ? [...mod.actions] : []
    })
    setSelectedPermissions(updated)
    if (checked) {
      toast.success("Granted Full Access across all modules.")
    } else {
      toast.warning("Removed all permissions.")
    }
  }

  // Toggle "Select All" for a specific module
  const handleToggleModuleSelectAll = (modId: string, checked: boolean) => {
    const mod = PERMISSION_MODULES.find((m) => m.id === modId)
    if (!mod) return
    setSelectedPermissions((prev) => ({
      ...prev,
      [modId]: checked ? [...mod.actions] : [],
    }))
  }

  // Toggle a single action
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

  const handleSaveChanges = () => {
    toast.success(`Permissions updated for ${staff.name}!`, {
      description: `${totalSelectedActions} of ${totalPossibleActions} permissions active. Syncing privileges immediately.`,
    })
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
    <div className="space-y-3.5">
      {/* Top Header Card matching image */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-primary" />
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                Permission Assignment
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Assign granular access control.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input matching image */}
            <div className="relative w-full sm:w-56">
              <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-muted/40 border-border rounded-md"
              />
            </div>

            <Button
              size="sm"
              onClick={handleSaveChanges}
              className="h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md cursor-pointer"
            >
              <Save className="size-3.5" />
              <span>Save</span>
            </Button>
          </div>
        </div>

        {/* Global Full Access Bar matching image */}
        <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between text-xs">
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
      </div>

      {/* Collapsible Modules List matching image */}
      <div className="space-y-2.5">
        {filteredModules.map((mod) => {
          const isExpanded = searchQuery.trim() ? true : Boolean(expandedModules[mod.id])
          const selectedInMod = selectedPermissions[mod.id] || []
          const isModAllSelected =
            selectedInMod.length === mod.actions.length && mod.actions.length > 0

          return (
            <div
              key={mod.id}
              className={cn(
                "rounded-lg border transition-colors bg-card overflow-hidden",
                selectedInMod.length > 0 ? "border-border" : "border-border/60 opacity-90"
              )}
            >
              {/* Module Header Bar */}
              <div className="p-3 sm:px-4 flex items-center justify-between gap-3 bg-muted/20 hover:bg-muted/30 transition-colors">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {mod.actions.map((action) => {
                      const isChecked = selectedInMod.includes(action)
                      const isMatch =
                        searchQuery.trim() && action.toLowerCase().includes(searchQuery.toLowerCase())

                      return (
                        <label
                          key={action}
                          className={cn(
                            "flex items-center gap-2.5 p-2 rounded-md border transition-colors cursor-pointer select-none text-xs",
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
          <div className="p-8 text-center text-xs text-muted-foreground border border-border/60 rounded-lg bg-card">
            No permissions or modules match &quot;{searchQuery}&quot;.
          </div>
        )}
      </div>
    </div>
  )
}
