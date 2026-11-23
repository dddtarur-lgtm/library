"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import {
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Eye,
  Globe,
  HelpCircle,
  Laptop,
  Layers,
  MapPin,
  MessageCircle,
  MessageSquare,
  Moon,
  Phone,
  Plus,
  Save,
  Search,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Upload,
  Wifi,
} from "lucide-react"
import { toast } from "sonner"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"
import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export default function PublicPageSettings() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  // Live website form state (Matching Screenshot 2)
  const [libraryName, setLibraryName] = useState("Apex Study Hub & Digital Library")
  const [tagline, setTagline] = useState(
    "Pune's Premier 24×7 Self-Study & Resource Centre for Serious Aspirants"
  )
  const [aboutText, setAboutText] = useState(
    "Ergonomic chairs, dedicated power sockets, high-speed optic fiber Wi-Fi, and a curated catalog of reference books, we provide an environment that fosters unmatched concentration."
  )
  const [subdomain, setSubdomain] = useState("apexstudyhub.in")
  const [phoneContact, setPhoneContact] = useState("+91 98790 12345")
  const [address, setAddress] = useState("Near MIT College, Paud Road, Kothrud Campus (HQ), Pune - 411038")

  // Amenities toggles
  const [amenities, setAmenities] = useState([
    { id: "wifi", label: "High-speed 5G Wi-Fi", icon: "⚡", active: true },
    { id: "ac", label: "Silent AC Hall", icon: "❄️", active: true },
    { id: "power", label: "Dedicated Desk Power", icon: "🔌", active: true },
    { id: "water", label: "RO Drinking Water", icon: "💧", active: true },
    { id: "cctv", label: "24×7 CCTV Surveillance", icon: "🛡️", active: true },
    { id: "cafe", label: "Cafeteria & Balcony", icon: "☕", active: true },
    { id: "discussion", label: "Group Discussion Room", icon: "👥", active: false },
    { id: "lockers", label: "Personal Storage Lockers", icon: "🔐", active: true },
  ])

  // Social proof & options
  const [showAchievers, setShowAchievers] = useState(true)
  const [showGoogleReviews, setShowGoogleReviews] = useState(true)
  const [allowOnlineBooking, setAllowOnlineBooking] = useState(true)

  // Live preview device switcher: 'desktop' | 'phone'
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "phone">("desktop")

  const handlePublish = () => {
    toast.success("Website changes published live to apexstudyhub.in!", {
      description: "Updated search index and mobile student app profile.",
    })
  }

  const toggleAmenity = (id: string) => {
    setAmenities(
      amenities.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 space-y-4 p-4 sm:p-6">
      {/* 1. Header (Matching Screenshot 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Public Website &amp; Marketing
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Edit your library&apos;s public website page and student mobile app profile
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Action Button 1: Open live page */}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 text-xs gap-1.5 border-border rounded-md hover:bg-muted cursor-pointer"
          >
            <a href="https://apexstudyhub.in" target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5 text-muted-foreground" />
              <span>Open live page</span>
            </a>
          </Button>

          {/* Action Button 2: Publish changes */}
          <Button
            size="sm"
            onClick={handlePublish}
            className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-semibold cursor-pointer shadow-xs"
          >
            <Globe className="size-3.5" />
            <span>Publish changes</span>
          </Button>
        </div>
      </div>

      {/* 2. Website Profile Completeness Banner Strip (Matching Screenshot 2) */}
      <Card className="border border-border bg-card rounded-lg shadow-xs overflow-hidden">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Circular Completeness Indicator */}
            <div className="relative size-12 shrink-0 flex items-center justify-center">
              <svg className="size-12 -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  className="text-muted/40"
                  fill="transparent"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeDasharray={125.6}
                  strokeDashoffset={125.6 * (1 - 0.88)}
                  className="text-emerald-500"
                  fill="transparent"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-bold text-foreground font-mono">
                88%
              </span>
            </div>

            <div>
              <div className="text-xs sm:text-sm font-bold text-foreground">
                Website Profile Completeness
              </div>
              <div className="text-xs text-muted-foreground">
                Logo, banner, facilities, plans, and achievers wall are configured and live.
              </div>
            </div>
          </div>

          <Badge
            variant="outline"
            className="h-8 px-3 text-xs font-semibold border-emerald-500/30 bg-emerald-500/10 text-emerald-500 gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Check className="size-3.5" />
            <span>SEO Optimized &amp; Approved by Super Admin</span>
          </Badge>
        </CardContent>
      </Card>

      {/* 3. Main Split Grid: Left Form Editor + Right Live Device Preview (Matching Screenshot 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Website Settings Form (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border border-border bg-card rounded-lg shadow-xs">
            <CardHeader className="p-4 pb-2 border-b border-border">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Website Basic Information
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              {/* Library Public Name */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Library Public Name</Label>
                <Input
                  value={libraryName}
                  onChange={(e) => setLibraryName(e.target.value)}
                  className="h-9 text-xs bg-background border-border rounded-md font-semibold"
                />
              </div>

              {/* Tagline */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Tagline</Label>
                <Input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="h-9 text-xs bg-background border-border rounded-md"
                />
              </div>

              {/* About the Library */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">About the Library</Label>
                <Textarea
                  rows={4}
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  className="text-xs bg-background border-border rounded-md leading-relaxed resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Amenities & Facilities Toggles */}
          <Card className="border border-border bg-card rounded-lg shadow-xs">
            <CardHeader className="p-4 pb-2 border-b border-border">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Our Amenities &amp; Facilities Badges
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs">
              <p className="text-[11px] text-muted-foreground mb-2">
                Toggle the badges displayed on your landing page and prospective student brochure.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {amenities.map((amenity) => (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggleAmenity(amenity.id)}
                    className={cn(
                      "p-2.5 rounded-md border text-left flex items-center justify-between gap-2 transition-all cursor-pointer text-xs",
                      amenity.active
                        ? "border-primary/30 bg-primary/5 text-foreground font-semibold"
                        : "border-border bg-muted/20 text-muted-foreground opacity-60"
                    )}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span>{amenity.icon}</span>
                      <span className="truncate">{amenity.label}</span>
                    </span>
                    <span
                      className={cn(
                        "size-2 rounded-full shrink-0",
                        amenity.active ? "bg-emerald-500" : "bg-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Domain & Contact Info */}
          <Card className="border border-border bg-card rounded-lg shadow-xs">
            <CardHeader className="p-4 pb-2 border-b border-border">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Domain, Admissions &amp; Social Proof
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">Custom Web Subdomain</Label>
                  <Input
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    className="h-9 text-xs bg-background border-border rounded-md font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-foreground">Front-Desk Helpline</Label>
                  <Input
                    value={phoneContact}
                    onChange={(e) => setPhoneContact(e.target.value)}
                    className="h-9 text-xs bg-background border-border rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Campus Address</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-9 text-xs bg-background border-border rounded-md"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground">Display Achievers &amp; Rankers Wall</div>
                    <div className="text-[11px] text-muted-foreground">
                      Show student exam selections (UPSC, NEET, CA, MPSC) on landing page.
                    </div>
                  </div>
                  <Switch checked={showAchievers} onCheckedChange={setShowAchievers} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground">Direct Online Plan Booking CTA</div>
                    <div className="text-[11px] text-muted-foreground">
                      Allow prospective students to pay online and reserve an instant seat.
                    </div>
                  </div>
                  <Switch checked={allowOnlineBooking} onCheckedChange={setAllowOnlineBooking} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Live Interactive Device Preview (6 cols) (Matching Screenshot 2) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Live Preview
            </span>

            {/* Desktop / Phone Toggle Switcher (Matching Screenshot 2) */}
            <div className="flex items-center p-0.5 rounded-md bg-muted border border-border text-xs">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all",
                  previewDevice === "desktop"
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Laptop className="size-3.5" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("phone")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all",
                  previewDevice === "phone"
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Smartphone className="size-3.5" />
                <span>Phone</span>
              </button>
            </div>
          </div>

          {/* Browser / Device Frame (Matching Screenshot 2) */}
          <div
            className={cn(
              "border border-border bg-slate-950 rounded-xl overflow-hidden shadow-2xl transition-all mx-auto",
              previewDevice === "phone" ? "max-w-[320px] rounded-[32px] p-2 border-4 border-slate-700" : "w-full"
            )}
          >
            {/* Browser Top Navigation Bar */}
            <div className="bg-slate-900 border-b border-slate-800 p-2.5 flex items-center justify-between gap-3">
              {/* Traffic Lights */}
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-red-500/80 inline-block" />
                <span className="size-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="size-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>

              {/* URL Address Bar */}
              <div className="flex-1 max-w-xs mx-auto bg-slate-950 border border-slate-800 rounded-md py-1 px-3 text-[11px] font-mono text-slate-400 text-center truncate">
                {subdomain}
              </div>

              <div className="size-4 text-slate-600" />
            </div>

            {/* Browser Content Canvas */}
            <div className="p-4 sm:p-5 space-y-4 bg-slate-950 text-white max-h-[560px] overflow-y-auto">
              {/* Hero Banner (Matching Screenshot 2: blue card with title, tagline, CTA) */}
              <div className="p-6 sm:p-8 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-primary text-center space-y-3 shadow-lg">
                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-snug">
                  {libraryName}
                </h2>
                <p className="text-xs sm:text-sm text-blue-100 max-w-md mx-auto leading-relaxed">
                  {tagline}
                </p>

                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-slate-950 font-bold text-xs shadow-md hover:bg-slate-100 transition-colors cursor-pointer">
                    <span>Join Library &amp; Buy Plan</span>
                    <span>&rarr;</span>
                  </span>
                </div>
              </div>

              {/* Our Amenities Section (Matching Screenshot 2) */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Our Amenities
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {amenities
                    .filter((a) => a.active)
                    .map((a) => (
                      <div
                        key={a.id}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-2"
                      >
                        <span className="text-sm">{a.icon}</span>
                        <span className="font-semibold text-[11px] truncate">{a.label}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* About Section */}
              <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  About Our Study Space
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {aboutText}
                </p>
              </div>

              {/* Contact Footer Strip */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3 text-primary shrink-0" />
                  <span className="truncate">{address}</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold shrink-0">
                  <Phone className="size-3" />
                  <span>{phoneContact}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
