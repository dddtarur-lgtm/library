"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { libraryService } from "@/services/library-service"
import {
  AlertCircle,
  Armchair,
  ArrowRight,
  ArrowRightLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Edit,
  ExternalLink,
  GitPullRequest,
  Lock,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Radio,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Users,
  Wifi,
  X,
  Zap,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Progress } from "@/components/ui/progress"
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

export default function BranchesOverviewPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  // Branches State
  const [branches, setBranches] = useState([
    {
      id: "branch-kothrud",
      name: "Apex Study Hub - Kothrud HQ",
      isMain: true,
      isOpen: true,
      address: "Plot 42, Mayur Colony, Near Kothrud Bus Stand, Pune 411038",
      phone: "+91 98220 12345",
      manager: "Ramesh Kulkarni",
      studentsCount: 185,
      desksCount: 36,
      occupancyRate: 81,
      todayInside: 5,
      collectedAmount: "₹1,18,000",
      allowedDoorDistance: "100 meters",
      openHours: "06:00 AM - 11:00 PM",
      wifiSsid: "Apex_Kothrud_5G",
      coordinates: "18.5074° N, 73.8077° E",
    },
    {
      id: "branch-fcroad",
      name: "Apex Study Hub - FC Road",
      isMain: false,
      isOpen: true,
      address: "3rd Floor, Deccan Mall, Ferguson College Road, Pune 411004",
      phone: "+91 98220 54321",
      manager: "Pooja Hegde",
      studentsCount: 110,
      desksCount: 28,
      occupancyRate: 75,
      todayInside: 3,
      collectedAmount: "₹66,200",
      allowedDoorDistance: "100 meters",
      openHours: "07:00 AM - 10:00 PM",
      wifiSsid: "Apex_FCRoad_HighSpeed",
      coordinates: "18.5204° N, 73.8402° E",
    },
  ])

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState(branches[0])
  const [settingsTab, setSettingsTab] = useState<"general" | "door" | "seats" | "wifi">("general")

  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await libraryService.getBranches()
        if (res && res.length > 0) {
          setBranches(
            res.map((b) => ({
              id: String(b.id),
              name: b.name,
              isMain: b.is_main,
              isOpen: true,
              address: b.address || "Main Branch Road",
              phone: "+91 98220 12345",
              manager: "Branch Manager",
              studentsCount: 150,
              desksCount: 40,
              occupancyRate: 75,
              todayInside: 8,
              collectedAmount: "₹95,000",
              allowedDoorDistance: "100 meters",
              openHours: "06:00 AM - 11:00 PM",
              wifiSsid: "Library_5G",
              macRestriction: true,
              totalSeats: 40,
              acZone: "Active",
              silentZone: "Active",
              coordinates: "18.5204° N, 73.8567° E",
            }))
          )
        }
      } catch {
        // Fallback to initial
      }
    }
    loadBranches()
  }, [])

  // Add Branch Form
  const [newBranchName, setNewBranchName] = useState("")
  const [newBranchAddress, setNewBranchAddress] = useState("")
  const [newBranchManager, setNewBranchManager] = useState("")
  const [newBranchPhone, setNewBranchPhone] = useState("")
  const [newBranchDesks, setNewBranchDesks] = useState(30)

  const handleAddBranch = () => {
    if (!newBranchName || !newBranchAddress) return
    const newB = {
      id: `branch-${Date.now()}`,
      name: newBranchName,
      isMain: false,
      isOpen: true,
      address: newBranchAddress,
      phone: newBranchPhone || "+91 98000 00000",
      manager: newBranchManager || "Assigned Desk Manager",
      studentsCount: 0,
      desksCount: newBranchDesks,
      occupancyRate: 0,
      todayInside: 0,
      collectedAmount: "₹0",
      allowedDoorDistance: "100 meters",
      openHours: "06:00 AM - 11:00 PM",
      wifiSsid: "Apex_Campus_Secure",
      coordinates: "18.5200° N, 73.8500° E",
    }
    setBranches([...branches, newB])
    setAddModalOpen(false)
    setNewBranchName("")
    setNewBranchAddress("")
  }

  const openSettings = (branch: typeof branches[0]) => {
    setSelectedBranch(branch)
    setSettingsModalOpen(true)
  }

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 text-foreground">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Building2 className="size-6 text-primary" />
            Branch Management &amp; Multi-Campus
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time branch telemetry, capacity quotas, door geofence rules &amp; manager oversight
          </p>
        </div>

        {/* Quick Nav Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={ensureLocalizedPathname("/pages/branches/change-requests", lang)}
            className="flex items-center gap-1.5 h-9 rounded-lg border border-border bg-card px-3.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <GitPullRequest className="size-3.5 text-amber-500" />
            <span>Transfer Requests</span>
          </Link>

          <Link
            href={ensureLocalizedPathname("/pages/branches/analytics", lang)}
            className="flex items-center gap-1.5 h-9 rounded-lg border border-border bg-card px-3.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <TrendingUp className="size-3.5 text-primary" />
            <span>Branch Benchmarks</span>
          </Link>

          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-4 rounded-lg shadow-xs cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Add Campus</span>
          </Button>
        </div>
      </div>

      {/* TOP QUOTA BAR */}
      <Card className="rounded-xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-sm flex items-center justify-center shrink-0">
            {branches.length}/3
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">
              Branch Quota: {branches.length} of 3 Active Locations Used
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Your Pro Study Campus plan permits up to 3 branch locations. You can open 1 more campus.
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setUpgradeModalOpen(true)}
          className="h-9 px-4 rounded-lg border-border bg-card hover:bg-muted text-foreground text-xs font-semibold cursor-pointer transition-colors"
        >
          Upgrade Capacity
        </Button>
      </Card>

      {/* 2 BRANCH CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {branches.map((b) => (
          <Card
            key={b.id}
            className={`rounded-xl p-5 shadow-xs transition-all ${
              b.isMain
                ? "border-2 border-primary/50 bg-card relative"
                : "border border-border bg-card hover:border-border/80"
            }`}
          >
            {/* Top row: Title and Open Status Badge */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">
                  {b.name}
                </h3>
                {b.isMain && (
                  <Badge variant="outline" className="mt-1 bg-primary/10 border-primary/30 text-primary text-[10px] font-bold px-2 py-0.5">
                    Main Branch
                  </Badge>
                )}
              </div>

              <Badge
                variant="outline"
                className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs px-3 py-1 font-semibold flex items-center gap-1.5 shrink-0"
              >
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Open Today
              </Badge>
            </div>

            {/* Address line */}
            <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="size-3.5 text-muted-foreground shrink-0" />
              <span className="line-clamp-1">{b.address}</span>
            </div>

            {/* Phone & Manager row */}
            <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" />
                <span>{b.phone}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Shield className="size-3.5 text-purple-500" />
                <span>Manager: <strong className="text-foreground font-semibold">{b.manager}</strong></span>
              </div>
            </div>

            {/* 4 Stat Tiles Box */}
            <div className="mt-4 rounded-lg bg-muted/40 border border-border p-3.5 grid grid-cols-4 gap-2 text-center">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  STUDENTS
                </span>
                <span className="text-xl font-bold text-foreground mt-1 block">
                  {b.studentsCount}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  DESKS
                </span>
                <span className="text-xl font-bold text-foreground mt-1 block">
                  {b.desksCount}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  OCCUPANCY
                </span>
                <span className="text-xl font-bold text-primary mt-1 block">
                  {b.occupancyRate}%
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  TODAY
                </span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {b.todayInside} in
                </span>
              </div>
            </div>

            {/* Bottom Footer Row */}
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {b.collectedAmount} collected
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openSettings(b)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border-border bg-card hover:bg-muted text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Settings className="size-3.5 text-muted-foreground" />
                  <span>Settings</span>
                </Button>

                <Link
                  href={ensureLocalizedPathname(`/pages/branches/branch-details`, lang)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors"
                >
                  <Pencil className="size-3 text-muted-foreground" />
                  <span>Branch Details</span>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* CAMPUS COMPARISON & PERFORMANCE TABLE */}
      <Card className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-foreground tracking-tight">
            Campus Comparison &amp; Performance
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compare active student capacity, collections, and door attendance between branches.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Campus Name
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Manager
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Active Students
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider min-w-[180px]">
                  Seat Utilization
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Allowed Door Distance
                </TableHead>
                <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  October Collections
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((b) => (
                <TableRow key={b.id} className="border-border/60 hover:bg-muted/30">
                  <TableCell className="font-bold text-foreground text-xs py-3.5">
                    {b.name}
                  </TableCell>

                  <TableCell className="text-muted-foreground text-xs py-3.5">
                    {b.manager}
                  </TableCell>

                  <TableCell className="text-foreground text-xs py-3.5 font-medium">
                    {b.studentsCount} students
                  </TableCell>

                  {/* Seat Utilization Bar */}
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-28 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${b.occupancyRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground font-mono">
                        {b.occupancyRate}%
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground text-xs py-3.5 font-mono">
                    {b.allowedDoorDistance}
                  </TableCell>

                  <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs py-3.5">
                    {b.collectedAmount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ============================================================ */}
      {/* MODAL 1: Branch Settings with Advanced Options               */}
      {/* ============================================================ */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-xl bg-card border border-border text-foreground shadow-2xl">
          <div className="p-6 pb-3 border-b border-border">
            <DialogHeader className="text-start space-y-1">
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-primary" />
                <DialogTitle className="text-base font-bold text-foreground">
                  Branch Settings — {selectedBranch?.name}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure door geofence perimeter, operating schedules, manager assignments &amp; access rules
              </DialogDescription>
            </DialogHeader>

            {/* Settings Tab Pills */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSettingsTab("general")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  settingsTab === "general"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                General &amp; Hours
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab("door")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  settingsTab === "door"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Door Geofence (100m)
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab("seats")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  settingsTab === "seats"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Desk Quota
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab("wifi")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  settingsTab === "wifi"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Network &amp; Wi-Fi
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {settingsTab === "general" && (
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Operating Schedule (Open - Close)
                  </Label>
                  <Input
                    defaultValue={selectedBranch?.openHours}
                    className="h-10 rounded-lg bg-muted/30 border-border text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Assigned Branch Manager
                    </Label>
                    <Input
                      defaultValue={selectedBranch?.manager}
                      className="h-10 rounded-lg bg-muted/30 border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Branch Contact Line
                    </Label>
                    <Input
                      defaultValue={selectedBranch?.phone}
                      className="h-10 rounded-lg bg-muted/30 border-border text-foreground font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20">
                  <div>
                    <div className="font-bold text-foreground">Automate Sunday Closures</div>
                    <div className="text-[11px] text-muted-foreground">Mark all shifts closed on Sundays to avoid penalties</div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            )}

            {settingsTab === "door" && (
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Allowed Geofence Radius (Meters)
                  </Label>
                  <Input
                    defaultValue="100"
                    type="number"
                    className="h-10 rounded-lg bg-muted/30 border-border text-foreground font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Students outside this radius will be marked as "Needs Review" in Attendance.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    GPS Coordinates Anchor
                  </Label>
                  <Input
                    defaultValue={selectedBranch?.coordinates}
                    className="h-10 rounded-lg bg-muted/30 border-border text-foreground font-mono"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20">
                  <div>
                    <div className="font-bold text-foreground">Dynamic Salt Anti-Screenshot</div>
                    <div className="text-[11px] text-muted-foreground">Rotates dynamic QR code token every 15 seconds</div>
                  </div>
                  <Badge className="bg-emerald-600 text-white text-[10px]">Active</Badge>
                </div>
              </div>
            )}

            {settingsTab === "seats" && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Total Desk Capacity
                    </Label>
                    <Input
                      defaultValue={selectedBranch?.desksCount}
                      type="number"
                      className="h-10 rounded-lg bg-muted/30 border-border text-foreground font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Reserved 24x7 Desks
                    </Label>
                    <Input
                      defaultValue="8"
                      type="number"
                      className="h-10 rounded-lg bg-muted/30 border-border text-foreground font-mono"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-muted/30 border border-border p-3.5 text-xs text-muted-foreground">
                  Increasing desk capacity beyond {selectedBranch?.desksCount} requires verifying adequate floor power sockets and ventilation air cooling.
                </div>
              </div>
            )}

            {settingsTab === "wifi" && (
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Branch Wi-Fi SSID
                  </Label>
                  <Input
                    defaultValue={selectedBranch?.wifiSsid}
                    className="h-10 rounded-lg bg-muted/30 border-border text-foreground font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Bandwidth Policy per Student
                  </Label>
                  <Select defaultValue="unrestricted">
                    <SelectTrigger className="h-10 rounded-lg bg-muted/30 border-border text-foreground text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border text-popover-foreground rounded-xl">
                      <SelectItem value="unrestricted">High Speed Unlimited (300 Mbps)</SelectItem>
                      <SelectItem value="study-only">Study Safe (Blocks Torrent &amp; Gaming)</SelectItem>
                      <SelectItem value="throttled">Balanced (10 Mbps per seat)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 pt-0 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSettingsModalOpen(false)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setSettingsModalOpen(false)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold text-xs px-5 h-9 shadow-xs"
            >
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL 2: Add New Branch Campus                               */}
      {/* ============================================================ */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-xl bg-card border border-border text-foreground shadow-2xl">
          <DialogHeader className="text-start space-y-1">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Building2 className="size-5 text-primary" />
              Provision New Library Campus
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Set up branch details, allocated manager, and initial desk count (Quota: 2/3 used)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Campus / Branch Name *
              </Label>
              <Input
                placeholder="e.g. Apex Study Hub - Viman Nagar"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="h-10 rounded-lg bg-muted/30 border-border text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Physical Street Address *
              </Label>
              <Input
                placeholder="Shop 12, Phoenix Marketcity Road, Pune 411014"
                value={newBranchAddress}
                onChange={(e) => setNewBranchAddress(e.target.value)}
                className="h-10 rounded-lg bg-muted/30 border-border text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Manager Full Name
                </Label>
                <Input
                  placeholder="e.g. Nitin Shah"
                  value={newBranchManager}
                  onChange={(e) => setNewBranchManager(e.target.value)}
                  className="h-10 rounded-lg bg-muted/30 border-border text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Initial Desks
                </Label>
                <Input
                  type="number"
                  value={newBranchDesks}
                  onChange={(e) => setNewBranchDesks(Number(e.target.value))}
                  className="h-10 rounded-lg bg-muted/30 border-border text-foreground font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAddModalOpen(false)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddBranch}
              disabled={!newBranchName || !newBranchAddress}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold px-5 h-9 shadow-xs"
            >
              Provision Campus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL 3: Upgrade Quota Modal                                 */}
      {/* ============================================================ */}
      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-xl bg-card border border-border text-foreground shadow-2xl">
          <DialogHeader className="text-start space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-amber-500" />
              <DialogTitle className="text-base font-bold text-foreground">
                Upgrade Campus Network Quota
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Expand from 3 branches to unlimited multi-city enterprise campuses
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3 text-xs">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center justify-between font-bold text-foreground">
                <span>Enterprise Multi-Campus Plan</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">₹4,999 / mo</span>
              </div>
              <ul className="space-y-1.5 text-muted-foreground">
                <li className="flex items-center gap-2">✓ Up to 10 Branch Campuses in same organization</li>
                <li className="flex items-center gap-2">✓ Centralized Student Transfer Requests across branches</li>
                <li className="flex items-center gap-2">✓ Dedicated Sub-Admin Roles &amp; Biometric Integrations</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setUpgradeModalOpen(false)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setUpgradeModalOpen(false)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold px-5 h-9 shadow-xs"
            >
              Upgrade Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
