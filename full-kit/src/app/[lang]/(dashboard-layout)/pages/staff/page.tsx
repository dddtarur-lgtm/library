"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import {
  Building2,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  MoreHorizontal,
  PauseCircle,
  Pencil,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { initialStaffMembers, type StaffMember } from "@/data/library-management-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"
import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
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

export default function StaffDirectoryPage() {
  const params = useParams()
  const router = useRouter()
  const lang = (params?.lang as LocaleType) || "en"

  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaffMembers)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")
  const [branchFilter, setBranchFilter] = useState("All")

  const filtered = staffList.filter((s) => {
    if (roleFilter !== "All" && s.role !== roleFilter) return false
    if (branchFilter !== "All" && s.branchName !== branchFilter && s.branchName !== "All Branches (Owner Access)") return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = s.name.toLowerCase().includes(q)
      const matchEmail = s.email.toLowerCase().includes(q)
      const matchPhone = s.phone.includes(q)
      if (!matchName && !matchEmail && !matchPhone) return false
    }
    return true
  })

  const togglePauseStaff = (id: string, name: string) => {
    setStaffList(
      staffList.map((s) => {
        if (s.id === id) {
          const next = s.status === "Active" ? "Paused" : "Active"
          if (next === "Paused") {
            toast.warning(`Access paused for ${name}`, {
              description: "Turnstile gate access and staff sessions suspended.",
            })
          } else {
            toast.success(`Access restored for ${name}`, {
              description: "Staff credentials and privileges active.",
            })
          }
          return { ...s, status: next }
        }
        return s
      })
    )
  }

  const handleRevokeSessions = (name: string) => {
    toast.success(`Active sessions revoked for ${name}`, {
      description: "Signed out of all workstations and mobile apps.",
    })
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 space-y-4 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <UserCog className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Staff &amp; Team Management
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage team members, roles, branch assignments, and shift schedules.
            </p>
          </div>
        </div>

        {/* Action Button: Add Staff (Direct entry in Add Mode) */}
        <div className="flex items-center gap-2">
          <Link
            href={ensureLocalizedPathname("/pages/staff/add", lang)}
            className={buttonVariants({
              size: "sm",
              className: "h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-semibold shadow-xs cursor-pointer",
            })}
          >
            <Plus className="size-3.5" />
            <span>Add Staff</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="border border-border bg-card rounded-lg shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Team Members</span>
              <Users className="size-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{staffList.length} Members</div>
            <div className="text-[11px] text-muted-foreground">Across 3 branches</div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card rounded-lg shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Sub Admins Allocated</span>
              <ShieldCheck className="size-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">3 / 4 Allowed</div>
            <div className="text-[11px] text-emerald-500 font-medium">1 slot available</div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card rounded-lg shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Active on Duty Today</span>
              <UserCheck className="size-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">4 Active</div>
            <div className="text-[11px] text-muted-foreground">All desks covered</div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card rounded-lg shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Today&apos;s Desk Collections</span>
              <Clock className="size-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">₹19,200</div>
            <div className="text-[11px] text-muted-foreground">Reconciled in day-book</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search staff by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 text-xs bg-background border-border rounded-md"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Roles Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9 text-xs w-[150px] bg-background border-border rounded-md">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent hideScrollButtons>
              <SelectItem value="All">All Roles</SelectItem>
              <SelectItem value="Library Admin">Library Admin</SelectItem>
              <SelectItem value="Sub Admin">Sub Admin</SelectItem>
              <SelectItem value="Front Desk Staff">Front Desk Staff</SelectItem>
            </SelectContent>
          </Select>

          {/* Branches Filter */}
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="h-9 text-xs w-[170px] bg-background border-border rounded-md">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent hideScrollButtons>
              <SelectItem value="All">All Branches</SelectItem>
              <SelectItem value="Main Branch - Central Library">Central Library</SelectItem>
              <SelectItem value="Branch 2 - West Campus Annex">West Campus Annex</SelectItem>
              <SelectItem value="Branch 3 - North Tech Hub">North Tech Hub</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Staff Table */}
      <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs font-semibold py-3 text-muted-foreground uppercase">Team Member</TableHead>
                  <TableHead className="text-xs font-semibold py-3 text-muted-foreground uppercase">Role</TableHead>
                  <TableHead className="text-xs font-semibold py-3 text-muted-foreground uppercase">Branch Assignment</TableHead>
                  <TableHead className="text-xs font-semibold py-3 text-muted-foreground uppercase">Financial View</TableHead>
                  <TableHead className="text-xs font-semibold py-3 text-muted-foreground uppercase">Status</TableHead>
                  <TableHead className="text-xs font-semibold py-3 text-muted-foreground uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-xs text-muted-foreground">
                      No staff members match the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow
                      key={s.id}
                      onClick={() => router.push(ensureLocalizedPathname(`/pages/staff/${s.id}`, lang))}
                      className="border-border/60 hover:bg-muted/30 text-xs cursor-pointer transition-colors"
                    >
                      {/* Team Member Column */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={s.avatar}
                            alt={s.name}
                            className="size-9 rounded-full object-cover border border-border shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground text-xs hover:text-primary transition-colors">
                              {s.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono truncate">
                              {s.email} • {s.phone}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Role Column */}
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs px-2.5 py-0.5 rounded-full font-semibold gap-1.5",
                            s.role === "Library Admin"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                              : s.role === "Sub Admin"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          )}
                        >
                          {s.role === "Library Admin" ? (
                            <ShieldCheck className="size-3" />
                          ) : s.role === "Sub Admin" ? (
                            <Shield className="size-3" />
                          ) : (
                            <UserCheck className="size-3" />
                          )}
                          <span>{s.role}</span>
                        </Badge>
                      </TableCell>

                      {/* Branch Assignment Column */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5 text-foreground font-medium">
                          <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{s.branchName}</span>
                        </div>
                      </TableCell>

                      {/* Financial View Column */}
                      <TableCell className="py-3">
                        {s.canViewRevenue ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[11px] font-medium gap-1"
                          >
                            <Eye className="size-3" />
                            <span>Revenue Shown</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-muted text-muted-foreground border-border text-[11px] font-medium gap-1"
                          >
                            <EyeOff className="size-3" />
                            <span>Revenue Hidden</span>
                          </Badge>
                        )}
                      </TableCell>

                      {/* Status Column */}
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[11px] px-2 py-0.5 rounded-full font-semibold gap-1",
                            s.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : s.status === "Invited"
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full shrink-0",
                              s.status === "Active"
                                ? "bg-emerald-500"
                                : s.status === "Invited"
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            )}
                          />
                          <span>{s.status}</span>
                        </Badge>
                      </TableCell>

                      {/* Actions Column */}
                      <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7 hover:bg-muted/40 cursor-pointer">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-xs">
                            <DropdownMenuLabel>Staff Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={ensureLocalizedPathname(`/pages/staff/${s.id}`, lang)} className="cursor-pointer">
                                <UserCog className="size-3.5 mr-2 text-primary" />
                                <span>View Profile</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={ensureLocalizedPathname(`/pages/staff/${s.id}/edit`, lang)} className="cursor-pointer">
                                <Pencil className="size-3.5 mr-2 text-blue-400" />
                                <span>Edit Staff Details</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => togglePauseStaff(s.id, s.name)} className="cursor-pointer">
                              <PauseCircle className="size-3.5 mr-2 text-amber-500" />
                              <span>{s.status === "Active" ? "Pause Access" : "Resume Access"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRevokeSessions(s.name)} className="cursor-pointer">
                              <KeyRound className="size-3.5 mr-2 text-muted-foreground" />
                              <span>Revoke Sessions</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
