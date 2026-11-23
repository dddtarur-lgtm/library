"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  QrCode,
  Save,
  ShieldCheck,
  Smartphone,
  User,
} from "lucide-react"

import { userData } from "@/data/user"

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
import { Switch } from "@/components/ui/switch"

interface SessionItem {
  id: string
  device: string
  location: string
  lastActive: string
  isCurrent: boolean
  isMobile?: boolean
}

const INITIAL_SESSIONS: SessionItem[] = [
  {
    id: "s-1",
    device: "Windows Chrome (Desktop HQ)",
    location: "49.36.112.4 • Ahmedabad, India",
    lastActive: "Active Now",
    isCurrent: true,
  },
  {
    id: "s-2",
    device: "iPhone 15 Pro (StudyHub Admin App)",
    location: "103.21.58.14 • Ahmedabad, India",
    lastActive: "2 hours ago",
    isCurrent: false,
    isMobile: true,
  },
]

export default function MyAccountPage() {
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "sessions"
  >("profile")
  const [name, setName] = useState(userData.name)
  const [email, setEmail] = useState(userData.email)
  const [phone, setPhone] = useState(userData.phoneNumber)

  const [twoFactorActive, setTwoFactorActive] = useState(true)
  const [codesOpen, setCodesOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [sessions, setSessions] = useState<SessionItem[]>(INITIAL_SESSIONS)

  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in your current and new password.")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.")
      return
    }
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    toast.success("Password updated successfully")
  }

  return (
    <section className="container space-y-5 py-5">
      {/* Profile Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3.5">
          <Avatar className="size-12 border border-border">
            <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
              {name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {name}
              </h1>
              <Badge variant="secondary" className="text-[11px]">
                Super Admin
              </Badge>
              <Badge
                variant="secondary"
                className="gap-1 bg-emerald-500/15 text-[11px] text-emerald-700 dark:text-emerald-300"
              >
                <ShieldCheck className="size-3" />
                2FA {twoFactorActive ? "Enabled" : "Off"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {email} • {phone}
            </p>
          </div>
        </div>

        <nav className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "security", label: "Security & 2FA", icon: Lock },
            { id: "sessions", label: "Active Sessions", icon: Laptop },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id as "profile" | "security" | "sessions")
                }
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
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
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="text-base">Personal Details</CardTitle>
            <CardDescription>
              Update your operator display name, contact email, and mobile
              number.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => toast.success("Profile details saved")}
              >
                <Save className="size-3.5" />
                Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security & 2FA Tab */}
      {activeTab === "security" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/70 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="size-4 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>
                Use a strong passphrase with at least 12 characters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Current Password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  className="text-xs"
                  onClick={handleUpdatePassword}
                >
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/70 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <QrCode className="size-4 text-primary" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Protect Super Admin sign-ins with TOTP authenticator codes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3.5 py-3">
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Authenticator App (TOTP)
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Required for billing &amp; RBAC changes
                  </p>
                </div>
                <Switch
                  checked={twoFactorActive}
                  onCheckedChange={(val) => {
                    setTwoFactorActive(val)
                    toast.success(
                      val ? "2FA enabled on account" : "2FA disabled"
                    )
                  }}
                />
              </div>

              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => setCodesOpen(true)}
              >
                View Backup Recovery Codes
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === "sessions" && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 pb-4">
            <div>
              <CardTitle className="text-base">Active Sessions</CardTitle>
              <CardDescription>
                Devices currently signed into your Super Admin account.
              </CardDescription>
            </div>
            {sessions.length > 1 && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={() => {
                  setSessions((prev) => prev.filter((s) => s.isCurrent))
                  toast.success("Signed out all other devices")
                }}
              >
                <LogOut className="size-3.5" />
                Revoke Others
              </Button>
            )}
          </CardHeader>
          <CardContent className="divide-y divide-border/70 p-0">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                    {s.isMobile ? (
                      <Smartphone className="size-4" />
                    ) : (
                      <Laptop className="size-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {s.device}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.location} • {s.lastActive}
                    </p>
                  </div>
                </div>
                {s.isCurrent ? (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  >
                    Current
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      setSessions((prev) =>
                        prev.filter((item) => item.id !== s.id)
                      )
                      toast.success(`Revoked session on ${s.device}`)
                    }}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={codesOpen} onOpenChange={setCodesOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              Backup Recovery Codes
            </DialogTitle>
            <DialogDescription>
              Store these one-time codes in a secure password manager.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs text-foreground">
            <span>SH-8492-104A</span>
            <span>SH-3920-771B</span>
            <span>SH-6184-992C</span>
            <span>SH-1047-553D</span>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCodesOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
