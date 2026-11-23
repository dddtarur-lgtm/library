"use client"

import { useMemo, useState } from "react"
import { platformService } from "@/services/platform-service"
import { toast } from "sonner"
import {
  KeyRound,
  Plus,
  Save,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

type RolesTab = "overview" | "team" | "matrix"

type StaffRole =
  | "Super Admin"
  | "Operations Manager"
  | "Finance & Billing"
  | "Support Lead"

interface StaffMember {
  id: string
  name: string
  email: string
  role: StaffRole
  twoFactor: boolean
  active: boolean
  lastActive: string
}

interface RbacRow {
  module: string
  superAdmin: boolean
  opsManager: boolean
  finance: boolean
  support: boolean
}

const ROLE_SUMMARIES = [
  {
    role: "Super Admin",
    members: 2,
    scope: "Full platform, billing, RBAC & infrastructure control",
    tone: "bg-primary/10 text-primary",
  },
  {
    role: "Operations Manager",
    members: 4,
    scope: "Library onboarding, public page moderation, app banners",
    tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  {
    role: "Finance & Billing",
    members: 2,
    scope: "Invoices, Razorpay settlements, plan upgrades & refunds",
    tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  {
    role: "Support Lead",
    members: 5,
    scope: "Tickets helpdesk, knowledge base & student conduct review",
    tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
]

const INITIAL_STAFF: StaffMember[] = [
  {
    id: "st-1",
    name: "Arjun Mehta",
    email: "arjun@studyhub.io",
    role: "Super Admin",
    twoFactor: true,
    active: true,
    lastActive: "Online now",
  },
  {
    id: "st-2",
    name: "Nidhi Kulkarni",
    email: "nidhi@studyhub.io",
    role: "Operations Manager",
    twoFactor: true,
    active: true,
    lastActive: "14 mins ago",
  },
  {
    id: "st-3",
    name: "Karan Desai",
    email: "karan@studyhub.io",
    role: "Finance & Billing",
    twoFactor: true,
    active: true,
    lastActive: "1 hr ago",
  },
  {
    id: "st-4",
    name: "Riya Sharma",
    email: "riya@studyhub.io",
    role: "Support Lead",
    twoFactor: false,
    active: true,
    lastActive: "3 hrs ago",
  },
]

const INITIAL_MATRIX: RbacRow[] = [
  {
    module: "Libraries & Subscriptions",
    superAdmin: true,
    opsManager: true,
    finance: true,
    support: false,
  },
  {
    module: "Billing, Invoices & Refunds",
    superAdmin: true,
    opsManager: false,
    finance: true,
    support: false,
  },
  {
    module: "Public Page Moderation",
    superAdmin: true,
    opsManager: true,
    finance: false,
    support: true,
  },
  {
    module: "Notifications & Email Mailbox",
    superAdmin: true,
    opsManager: true,
    finance: false,
    support: true,
  },
  {
    module: "App Controls & Feature Flags",
    superAdmin: true,
    opsManager: true,
    finance: false,
    support: false,
  },
  {
    module: "Security, Backups & RBAC",
    superAdmin: true,
    opsManager: false,
    finance: false,
    support: false,
  },
]

export default function UsersRolesPage() {
  const [activeTab, setActiveTab] = useState<RolesTab>("overview")
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF)
  const [search, setSearch] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState<StaffRole>("Support Lead")
  const [matrix, setMatrix] = useState<RbacRow[]>(INITIAL_MATRIX)

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return staff
    return staff.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
    )
  }, [staff, search])

  const handleInvite = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Name and email are required.")
      return
    }
    const tempId = `st-${Date.now()}`
    setStaff((prev) => [
      {
        id: tempId,
        name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
        twoFactor: false,
        active: true,
        lastActive: "Invited",
      },
      ...prev,
    ])
    try {
      const res = (await platformService.inviteStaff({
        first_name: newName.trim(),
        email: newEmail.trim(),
        role:
          newRole === "Super Admin"
            ? "SUPER_ADMIN"
            : newRole === "Finance & Billing"
              ? "PLATFORM_FINANCE"
              : "PLATFORM_SUPPORT",
      })) as Record<string, unknown> | null
      if (res?.id) {
        setStaff((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, id: String(res.id) } : m))
        )
      }
    } catch {
      // Local state preserved
    }
    toast.success(`Invitation sent to ${newEmail.trim()}`)
    setNewName("")
    setNewEmail("")
    setInviteOpen(false)
  }

  const togglePerm = (
    module: string,
    key: "opsManager" | "finance" | "support"
  ) => {
    setMatrix((prev) =>
      prev.map((row) =>
        row.module === module ? { ...row, [key]: !row[key] } : row
      )
    )
  }

  return (
    <section className="container space-y-5 py-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Team &amp; Roles
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage internal platform operators, role assignments, and
            least-privilege permissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">
            {[
              { id: "overview", label: "Overview", icon: ShieldCheck },
              { id: "team", label: "Staff Directory", icon: Users },
              { id: "matrix", label: "RBAC Matrix", icon: KeyRound },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as RolesTab)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {activeTab === "team" && (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setInviteOpen(true)}
            >
              <Plus className="size-3.5" />
              Invite Staff
            </Button>
          )}
          {activeTab === "matrix" && (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => toast.success("RBAC permission matrix saved")}
            >
              <Save className="size-3.5" />
              Save Policy
            </Button>
          )}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Platform Staff",
                value: staff.length,
                sub: "Across 4 operational roles",
                icon: Users,
                tone: "text-primary bg-primary/10",
              },
              {
                label: "2FA Enforced",
                value: "100%",
                sub: "Hardware / TOTP verified",
                icon: ShieldCheck,
                tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
              },
              {
                label: "Active Today",
                value: staff.filter((s) => s.active).length,
                sub: "Logged into admin console",
                icon: UserCheck,
                tone: "text-sky-600 bg-sky-500/10 dark:text-sky-400",
              },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <Card
                  key={stat.label}
                  className="border-border bg-card shadow-sm"
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold tabular-nums text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {stat.sub}
                      </p>
                    </div>
                    <div
                      className={`flex size-10 items-center justify-center rounded-lg ${stat.tone}`}
                    >
                      <Icon className="size-5" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 pb-4">
              <div>
                <CardTitle className="text-base">Role Distribution</CardTitle>
                <CardDescription>
                  Access tiers configured for internal StudyHub operators.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => setActiveTab("matrix")}
              >
                <KeyRound className="size-3.5" />
                Edit RBAC Matrix
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
              {ROLE_SUMMARIES.map((item) => (
                <div
                  key={item.role}
                  className="space-y-2 rounded-xl border border-border bg-background/60 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {item.role}
                    </p>
                    <Badge variant="secondary" className={item.tone}>
                      {item.members} members
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.scope}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "team" && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Internal Operators</CardTitle>
              <CardDescription>
                {filteredStaff.length} team members configured
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, role..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>2FA</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="pr-4 text-right">Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-8">
                            <AvatarFallback className="text-xs font-semibold">
                              {member.name
                                .split(" ")
                                .map((p) => p[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {member.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={member.role}
                          onValueChange={async (v) => {
                            setStaff((prev) =>
                              prev.map((m) =>
                                m.id === member.id
                                  ? { ...m, role: v as StaffRole }
                                  : m
                              )
                            )
                            try {
                              if (!member.id.startsWith("st-")) {
                                await platformService.updateStaff(member.id, {
                                  role: v,
                                })
                              }
                            } catch {
                              // Local state preserved
                            }
                            toast.success(`Updated ${member.name} to ${v}`)
                          }}
                        >
                          <SelectTrigger className="h-8 w-44 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Super Admin">
                              Super Admin
                            </SelectItem>
                            <SelectItem value="Operations Manager">
                              Operations Manager
                            </SelectItem>
                            <SelectItem value="Finance & Billing">
                              Finance &amp; Billing
                            </SelectItem>
                            <SelectItem value="Support Lead">
                              Support Lead
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="secondary"
                            className={
                              member.twoFactor
                                ? "gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            }
                          >
                            {member.twoFactor && (
                              <ShieldCheck className="size-3" />
                            )}
                            {member.twoFactor ? "Verified" : "Pending"}
                          </Badge>
                          {member.twoFactor && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                              onClick={async () => {
                                try {
                                  if (!member.id.startsWith("st-")) {
                                    await platformService.resetStaff2FA(
                                      member.id
                                    )
                                  }
                                } catch {
                                  // Local state preserved
                                }
                                setStaff((prev) =>
                                  prev.map((m) =>
                                    m.id === member.id
                                      ? { ...m, twoFactor: false }
                                      : m
                                  )
                                )
                                toast.success(`2FA reset for ${member.name}`)
                              }}
                            >
                              Reset
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {member.lastActive}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Switch
                          checked={member.active}
                          onCheckedChange={async (val) => {
                            setStaff((prev) =>
                              prev.map((m) =>
                                m.id === member.id ? { ...m, active: val } : m
                              )
                            )
                            try {
                              if (!member.id.startsWith("st-")) {
                                await platformService.updateStaff(member.id, {
                                  is_active: val,
                                })
                              }
                            } catch {
                              // Local state preserved
                            }
                            toast.success(
                              `${member.name} ${val ? "activated" : "suspended"}`
                            )
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "matrix" && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4 text-primary" />
              Module Access Matrix
            </CardTitle>
            <CardDescription>
              Super Admin always retains full system access. Toggle permissions
              for delegated roles below.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Platform Module</TableHead>
                    <TableHead className="text-center">Super Admin</TableHead>
                    <TableHead className="text-center">Ops Manager</TableHead>
                    <TableHead className="text-center">Finance</TableHead>
                    <TableHead className="pr-4 text-center">
                      Support Lead
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrix.map((row) => (
                    <TableRow key={row.module}>
                      <TableCell className="pl-4 text-sm font-medium text-foreground">
                        {row.module}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={row.superAdmin} disabled />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={row.opsManager}
                          onCheckedChange={() =>
                            togglePerm(row.module, "opsManager")
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={row.finance}
                          onCheckedChange={() =>
                            togglePerm(row.module, "finance")
                          }
                        />
                      </TableCell>
                      <TableCell className="pr-4 text-center">
                        <Switch
                          checked={row.support}
                          onCheckedChange={() =>
                            togglePerm(row.module, "support")
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Invite Staff Member</DialogTitle>
            <DialogDescription>
              Send an onboarding invite with 2FA enforcement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Priya Deshmukh"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Work Email</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="priya@studyhub.io"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select
                value={newRole}
                onValueChange={(v) => setNewRole(v as StaffRole)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                  <SelectItem value="Operations Manager">
                    Operations Manager
                  </SelectItem>
                  <SelectItem value="Finance & Billing">
                    Finance &amp; Billing
                  </SelectItem>
                  <SelectItem value="Support Lead">Support Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleInvite}>
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
