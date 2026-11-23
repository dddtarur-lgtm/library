"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  Building2,
  Check,
  ChevronLeft,
  Clock,
  Layers,
  MapPin,
  Plus,
  QrCode,
  Save,
  Shield,
  Wifi,
} from "lucide-react"

import { initialBranches } from "@/data/library-management-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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

export default function BranchDetailsPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [selectedBranchId, setSelectedBranchId] = useState("branch-central")
  const currentBranch = initialBranches.find((b) => b.id === selectedBranchId) || initialBranches[0]

  const [branchName, setBranchName] = useState(currentBranch.name)
  const [address, setAddress] = useState(currentBranch.address)
  const [phone, setPhone] = useState(currentBranch.phone)
  const [qrRadius, setQrRadius] = useState(currentBranch.allowedQrRadiusMeters)
  const [openTime, setOpenTime] = useState("06:00")
  const [closeTime, setCloseTime] = useState("23:00")
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleBranchChange = (id: string) => {
    setSelectedBranchId(id)
    const b = initialBranches.find((x) => x.id === id) || initialBranches[0]
    setBranchName(b.name)
    setAddress(b.address)
    setPhone(b.phone)
    setQrRadius(b.allowedQrRadiusMeters)
  }

  const handleSave = () => {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden space-y-4 p-3 sm:p-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href={ensureLocalizedPathname("/pages/branches", lang)}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0",
          })}
        >
          <ChevronLeft className="size-4" />
          <span>Back to Branches Overview</span>
        </Link>
        <span className="text-xs font-mono text-muted-foreground">
          Branch Profile, Facilities & Geofence Coordinates (PRD §19 & §36)
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            Branch Configuration & Geolocation
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage individual campus operational hours, floor layouts, Wi-Fi amenities & QR attendance radius (PRD §19)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs py-1">
              ✓ Branch Saved
            </Badge>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs font-semibold"
          >
            <Save className="size-3.5" />
            <span>Save Branch Changes</span>
          </Button>
        </div>
      </div>

      {/* Campus Selector Bar */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card">
        <Label className="text-xs font-semibold shrink-0">Select Campus to Configure:</Label>
        <Select value={selectedBranchId} onValueChange={handleBranchChange}>
          <SelectTrigger className="h-8 text-xs w-[280px] bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {initialBranches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name} {b.isMain ? "(HQ)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: General & Timing */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                Campus Identity & Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Branch Full Name</Label>
                <Input
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Full Address</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Helpdesk Phone / Mobile</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="size-4 text-amber-600" />
                Daily Operating Hours & Shifts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Opening Time</Label>
                  <Input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Closing Time</Label>
                  <Input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Geofence & Facilities */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                Geofence & Attendance QR Radius (PRD §36)
              </CardTitle>
              <CardDescription className="text-xs">
                Set precise GPS coordinates so QR scans are permitted only within this perimeter.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Latitude</Label>
                  <Input
                    value={currentBranch.coordinates.lat}
                    readOnly
                    className="h-8 text-xs font-mono bg-muted/40"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Longitude</Label>
                  <Input
                    value={currentBranch.coordinates.lng}
                    readOnly
                    className="h-8 text-xs font-mono bg-muted/40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Allowed Attendance Scan Radius (Meters)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={qrRadius}
                    onChange={(e) => setQrRadius(Number(e.target.value))}
                    className="h-8 text-xs font-mono w-28"
                  />
                  <span className="text-muted-foreground">meters from desk center</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wifi className="size-4 text-emerald-600" />
                Branch Amenities & Facilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex flex-wrap gap-1.5">
                {currentBranch.facilities.map((f, i) => (
                  <Badge key={i} variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs py-1">
                    ✓ {f}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

