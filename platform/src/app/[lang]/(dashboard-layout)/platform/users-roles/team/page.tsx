"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Plus, Search, ShieldCheck } from "lucide-react"

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

interface TeamRolesHeaderProps {
  title: string
  description?: string
  rightSlot?: React.ReactNode
}

function TeamRolesHeader({
  title,
  description,
  rightSlot,
}: TeamRolesHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/60">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
    </div>
  )
}

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

export default function TeamDirectoryPage() {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF)
  const [search, setSearch] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState<StaffRole>("Support Lead")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return staff
    return staff.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
    )
  }, [staff, search])

  const handleInvite = () => {
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Name and email are required.")
      return
    }
    setStaff((prev) => [
      {
        id: `st-${Date.now()}`,
        name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
        twoFactor: false,
        active: true,
        lastActive: "Invited",
      },
      ...prev,
    ])
    toast.success(`Invitation sent to ${newEmail.trim()}`)
    setNewName("")
    setNewEmail("")
    setInviteOpen(false)
  }

  return (
    <section className="container space-y-5 py-5">
      <TeamRolesHeader
        title="Staff Directory"
        description="Invite internal operators, assign RBAC roles, and manage account access."
        rightSlot={
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setInviteOpen(true)}
          >
            <Plus className="size-3.5" />
            Invite Staff
          </Button>
        }
      />

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Internal Operators</CardTitle>
            <CardDescription>
              {filtered.length} team members configured
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
                {filtered.map((member) => (
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
                        onValueChange={(v) => {
                          setStaff((prev) =>
                            prev.map((m) =>
                              m.id === member.id
                                ? { ...m, role: v as StaffRole }
                                : m
                            )
                          )
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
                      <Badge
                        variant="secondary"
                        className={
                          member.twoFactor
                            ? "gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        }
                      >
                        {member.twoFactor && <ShieldCheck className="size-3" />}
                        {member.twoFactor ? "Verified" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {member.lastActive}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Switch
                        checked={member.active}
                        onCheckedChange={(val) => {
                          setStaff((prev) =>
                            prev.map((m) =>
                              m.id === member.id ? { ...m, active: val } : m
                            )
                          )
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
