"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  Award,
  Building,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Database,
  Globe,
  HardDrive,
  HelpCircle,
  Image,
  Key,
  Layers,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Save,
  Settings,
  Share2,
  Shield,
  Sparkles,
  Star,
  Upload,
  UserPlus,
  Users,
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
import { Textarea } from "@/components/ui/textarea"

export default function LibrarySettingsHubPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [savedSuccess, setSavedSuccess] = useState(false)

  // General settings state
  const [libraryName, setLibraryName] = useState("Central Study Zone & Reading Library")
  const [legalEntity, setLegalEntity] = useState("Central Education Spaces LLP")
  const [gstin, setGstin] = useState("24AAACC1234D1Z5")
  const [contactEmail, setContactEmail] = useState("admin@centralstudyzone.in")
  const [contactPhone, setContactPhone] = useState("+91 79 4001 2345")
  const [address, setAddress] = useState("Plot 42, Knowledge Park, University Road, Ahmedabad, GJ - 380009")

  const handleSave = () => {
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  const subSettingLinks = [
    {
      title: "Public Microsite & SEO",
      desc: "Customize your public landing page, logo, banner photos, and Google search SEO tags.",
      href: "/pages/settings-library/public-page",
      icon: Globe,
      color: "text-blue-600 bg-blue-500/10",
      badge: "White-label",
    },
    {
      title: "Facilities & Achievers Wall",
      desc: "Manage amenities list (Wi-Fi, AC, Lockers) and student exam toppers / rankers showcase.",
      href: "/pages/settings-library/facilities-achievers",
      icon: Award,
      color: "text-amber-600 bg-amber-500/10",
      badge: "PRD §57",
    },
    {
      title: "Payment Gateway & Invoices",
      desc: "Razorpay API keys, webhooks, offline cash payment modes, and GST invoice number formats.",
      href: "/pages/settings-library/payment-gateway",
      icon: CreditCard,
      color: "text-emerald-600 bg-emerald-500/10",
      badge: "Automated",
    },
    {
      title: "Operating Shifts & Rules",
      desc: "Set morning/evening shifts, auto-checkout time, grace periods, and QR geofence radius.",
      href: "/pages/settings-library/shifts-rules",
      icon: Clock,
      color: "text-purple-600 bg-purple-500/10",
      badge: "Configured",
    },
    {
      title: "Leads & Enquiries CRM",
      desc: "Track prospective students who inquired via website, free trial bookings, and follow-ups.",
      href: "/pages/settings-library/leads",
      icon: UserPlus,
      color: "text-rose-600 bg-rose-500/10",
      badge: "6 Active",
    },
    {
      title: "Review Moderation Wall",
      desc: "Approve or flag student ratings & testimonials before publishing them to the public page.",
      href: "/pages/settings-library/reviews",
      icon: Star,
      color: "text-yellow-600 bg-yellow-500/10",
      badge: "4.9 ★ Rating",
    },
    {
      title: "Data Backup & Retention",
      desc: "Download full database SQL dumps, configure daily cloud backups, and data privacy policies.",
      href: "/pages/settings-library/data-backup",
      icon: HardDrive,
      color: "text-teal-600 bg-teal-500/10",
      badge: "Daily Cloud Sync",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Configuration</span>
            <ChevronRight className="size-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-primary">Library Settings</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Library Administration &amp; Settings Hub
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure your organization profile, public microsite, payment gateways, operating shifts, and lead pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="size-3.5 mr-1" />
              Settings Saved!
            </Badge>
          )}
          <Button size="sm" className="h-9 gap-1.5" onClick={handleSave}>
            <Save className="size-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Sub Settings Navigator Grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Specialized Configuration Dimensions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {subSettingLinks.map((item, idx) => {
            const Icon = item.icon
            return (
              <Link
                key={idx}
                href={ensureLocalizedPathname(item.href, lang)}
                className="group relative flex flex-col justify-between rounded-xl border border-border/60 bg-card/80 p-4 transition-all hover:border-primary/50 hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`rounded-lg p-2.5 ${item.color}`}>
                      <Icon className="size-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {item.badge}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                  <span>Configure</span>
                  <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* General Organization Information */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building className="size-4 text-primary" />
            General Organization Profile
          </CardTitle>
          <CardDescription>
            Core business details appearing on student fee receipts, public website, and official invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lib-name" className="text-xs">Library Brand Display Name</Label>
              <Input
                id="lib-name"
                value={libraryName}
                onChange={(e) => setLibraryName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="legal-name" className="text-xs">Legal Registered Entity Name</Label>
              <Input
                id="legal-name"
                value={legalEntity}
                onChange={(e) => setLegalEntity(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="gstin" className="text-xs">GSTIN / Tax Identification</Label>
              <Input
                id="gstin"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Primary Contact Email</Label>
              <Input
                id="email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs">Support Phone Number</Label>
              <Input
                id="phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs">Registered Head Office Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-border/40 pt-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Operating Currency</Label>
              <Select defaultValue="inr">
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inr">Indian Rupee (₹ INR)</SelectItem>
                  <SelectItem value="usd">US Dollar ($ USD)</SelectItem>
                  <SelectItem value="gbp">British Pound (£ GBP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Timezone</Label>
              <Select defaultValue="ist">
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ist">Asia/Kolkata (IST +05:30)</SelectItem>
                  <SelectItem value="utc">UTC (+00:00)</SelectItem>
                  <SelectItem value="est">America/New_York (EST -05:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Date Display Format</Label>
              <Select defaultValue="ddmmyyyy">
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ddmmyyyy">DD/MM/YYYY (e.g. 03/11/2026)</SelectItem>
                  <SelectItem value="mmddyyyy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="yyyymmdd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

