"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Edit2,
  MapPin,
  Moon,
  Plus,
  Save,
  ShieldCheck,
  Sun,
  Sunrise,
  Sunset,
  Trash2,
  Watch,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

export default function ShiftsRulesSettings() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [savedSuccess, setSavedSuccess] = useState(false)

  // Shifts state
  const [shifts, setShifts] = useState([
    {
      id: "sh-1",
      name: "Morning Early Bird",
      timing: "06:00 AM - 12:00 PM",
      duration: "6 Hours",
      color: "text-amber-500",
      icon: Sunrise,
      activeStudents: 38,
      status: true,
    },
    {
      id: "sh-2",
      name: "Afternoon Intensive",
      timing: "12:00 PM - 05:00 PM",
      duration: "5 Hours",
      color: "text-orange-500",
      icon: Sun,
      activeStudents: 26,
      status: true,
    },
    {
      id: "sh-3",
      name: "Evening Shift",
      timing: "05:00 PM - 11:00 PM",
      duration: "6 Hours",
      color: "text-blue-500",
      icon: Sunset,
      activeStudents: 22,
      status: true,
    },
    {
      id: "sh-4",
      name: "Night Owls (Graveyard)",
      timing: "11:00 PM - 06:00 AM",
      duration: "7 Hours",
      color: "text-purple-500",
      icon: Moon,
      activeStudents: 14,
      status: true,
    },
    {
      id: "sh-5",
      name: "24x7 All-Day Dedicated",
      timing: "24 Hours (Full Access)",
      duration: "24 Hours",
      color: "text-emerald-500",
      icon: Clock,
      activeStudents: 64,
      status: true,
    },
  ])

  // Rules parameters
  const [lateGraceMinutes, setLateGraceMinutes] = useState("15")
  const [autoCheckoutTime, setAutoCheckoutTime] = useState("23:59")
  const [geofenceRadius, setGeofenceRadius] = useState("100")
  const [idleDaysAlert, setIdleDaysAlert] = useState("7")
  const [strictGeofence, setStrictGeofence] = useState(true)

  const handleSave = () => {
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={ensureLocalizedPathname("/pages/settings-library", lang)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Library Settings
            </Link>
            <ChevronRight className="size-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-primary">Operating Shifts &amp; Rules</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Operating Shifts &amp; Attendance Rules
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure library shift schedules, grace periods, geofence radius for QR kiosks, and auto-checkout triggers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="size-3.5 mr-1" />
              Rules Saved!
            </Badge>
          )}
          <Button size="sm" className="h-9 gap-1.5" onClick={handleSave}>
            <Save className="size-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Shifts Configuration Table */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                Configured Daily Shifts
              </CardTitle>
              <CardDescription>
                Students can only check in during their allocated shift timing unless subscribed to 24x7 plans
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
              <Plus className="size-3.5" />
              Add Shift
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs">Shift Title</TableHead>
                  <TableHead className="text-xs">Slot Hours</TableHead>
                  <TableHead className="text-xs">Duration</TableHead>
                  <TableHead className="text-xs">Enrolled Students</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => {
                  const Icon = shift.icon
                  return (
                    <TableRow key={shift.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`rounded-md p-1.5 bg-muted ${shift.color}`}>
                            <Icon className="size-4" />
                          </div>
                          <span>{shift.name}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs font-mono">
                        {shift.timing}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {shift.duration}
                      </TableCell>

                      <TableCell className="text-xs font-medium">
                        {shift.activeStudents} active
                      </TableCell>

                      <TableCell>
                        <Switch
                          checked={shift.status}
                          onCheckedChange={(checked) =>
                            setShifts((prev) =>
                              prev.map((s) => (s.id === shift.id ? { ...s, status: checked } : s))
                            )
                          }
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="size-7">
                          <Edit2 className="size-3.5 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Attendance & Automated Policies */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Watch className="size-4 text-primary" />
              Punctuality &amp; Checkout Rules
            </CardTitle>
            <CardDescription>
              Rules governing late marks and automatic session closure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="grace" className="text-xs">Late Arrival Grace Period (Minutes)</Label>
              <Input
                id="grace"
                type="number"
                value={lateGraceMinutes}
                onChange={(e) => setLateGraceMinutes(e.target.value)}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Check-ins beyond 15 minutes after shift start will trigger a "Late Mark" badge on the student ledger.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="checkout-time" className="text-xs">Auto-Checkout Execution Time</Label>
              <Input
                id="checkout-time"
                value={autoCheckoutTime}
                onChange={(e) => setAutoCheckoutTime(e.target.value)}
                className="h-9 text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Sessions without an explicit checkout swipe will be auto-closed at 23:59 with a 6-hour capped calculation.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="idle-days" className="text-xs">Idle Absenteeism Warning Threshold (Days)</Label>
              <Input
                id="idle-days"
                type="number"
                value={idleDaysAlert}
                onChange={(e) => setIdleDaysAlert(e.target.value)}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Flag seat on the dashboard if student misses attendance for 7 consecutive days.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Compass className="size-4 text-emerald-600" />
              QR Attendance Geofencing
            </CardTitle>
            <CardDescription>
              Prevent students from sharing QR photos and scanning from outside the premises
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/20">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold">Enforce GPS Geofence Check</span>
                <p className="text-[11px] text-muted-foreground">
                  Validates student browser GPS coordinates against branch latitude &amp; longitude
                </p>
              </div>
              <Switch checked={strictGeofence} onCheckedChange={setStrictGeofence} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="radius" className="text-xs">Permitted Geofence Radius (Meters)</Label>
              <Input
                id="radius"
                type="number"
                value={geofenceRadius}
                onChange={(e) => setGeofenceRadius(e.target.value)}
                className="h-9 text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Recommended: 100 meters to account for indoor GPS drift and tall building signal loss.
              </p>
            </div>

            <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-600">
                <ShieldCheck className="size-4" />
                Anti-Leak Dynamic TOTP Active
              </div>
              <p className="mt-1 text-[11px]">
                The Kiosk QR regenerates automatically every 15 seconds with salt encryption to prevent screenshot abuse.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

