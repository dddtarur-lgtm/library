"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  ArrowRight,
  FileText,
  Globe,
  Image as ImageIcon,
  MessageSquare,
  Save,
  Sparkles,
} from "lucide-react"

import {
  LeadInquiriesPanel,
  MarketingPagesPanel,
  MediaAssetsPanel,
} from "./_components/cms-panels"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type CmsTab = "hub" | "pages" | "media" | "messages"

export default function WebsiteContentPage() {
  const [activeTab, setActiveTab] = useState<CmsTab>("hub")
  const [siteTitle, setSiteTitle] = useState(
    "StudyHub — All-in-One Library & Reading Room OS"
  )
  const [heroHeadline, setHeroHeadline] = useState(
    "Run Your Study Library on Autopilot"
  )
  const [heroSubcopy, setHeroSubcopy] = useState(
    "Automate seat allocation, biometric attendance, WhatsApp fee reminders, and GST billing across all your branches."
  )
  const [ctaText, setCtaText] = useState("Start 14-Day Free Trial")
  const [maintenanceBanner, setMaintenanceBanner] = useState(false)

  return (
    <section className="container space-y-5 py-5">
      {/* Unified Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Website CMS
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage public marketing copy, landing pages, media library, and
            inbound sales leads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">
            {[
              { id: "hub", label: "CMS Hub", icon: Globe },
              { id: "pages", label: "Marketing Pages", icon: FileText },
              { id: "media", label: "Media Assets", icon: ImageIcon },
              { id: "messages", label: "Lead Inquiries", icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as CmsTab)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${isActive
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

          {activeTab === "hub" && (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() =>
                toast.success("Public marketing settings published to edge CDN")
              }
            >
              <Save className="size-3.5" />
              Publish
            </Button>
          )}
        </div>
      </div>

      {activeTab === "hub" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Marketing Pages",
                value: "4 Configured",
                sub: "Home, Pricing, Features, Enterprise",
                tab: "pages" as const,
                icon: FileText,
                tone: "text-primary bg-primary/10",
              },
              {
                label: "Media Assets",
                value: "4 CDN Files",
                sub: "18.4 MB CDN storage used",
                tab: "media" as const,
                icon: ImageIcon,
                tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
              },
              {
                label: "Lead Inquiries",
                value: "3 Active",
                sub: "1 new demo request today",
                tab: "messages" as const,
                icon: MessageSquare,
                tone: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
              },
              {
                label: "Edge Cache",
                value: "99.98%",
                sub: "Global CDN status healthy",
                tab: "hub" as const,
                icon: Globe,
                tone: "text-sky-600 bg-sky-500/10 dark:text-sky-400",
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveTab(item.tab)}
                  className="text-left"
                >
                  <Card className="h-full border-border bg-card shadow-sm transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          {item.value}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.sub}
                        </p>
                      </div>
                      <div
                        className={`flex size-10 items-center justify-center rounded-lg ${item.tone}`}
                      >
                        <Icon className="size-5" />
                      </div>
                    </CardContent>
                  </Card>
                </button>
              )
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border/70 pb-4">
                <CardTitle className="text-base">
                  Homepage Hero &amp; Global SEO
                </CardTitle>
                <CardDescription>
                  Edit the primary landing headline, CTA button, and site meta
                  title.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cms-site-title" className="text-xs">
                    Global Meta Title
                  </Label>
                  <Input
                    id="cms-site-title"
                    value={siteTitle}
                    onChange={(e) => setSiteTitle(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cms-hero-headline" className="text-xs">
                    Hero Headline
                  </Label>
                  <Input
                    id="cms-hero-headline"
                    value={heroHeadline}
                    onChange={(e) => setHeroHeadline(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cms-hero-sub" className="text-xs">
                    Hero Subtitle
                  </Label>
                  <Textarea
                    id="cms-hero-sub"
                    rows={3}
                    value={heroSubcopy}
                    onChange={(e) => setHeroSubcopy(e.target.value)}
                    className="text-xs leading-relaxed"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="cms-cta" className="text-xs">
                      Primary CTA Label
                    </Label>
                    <Input
                      id="cms-cta"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2">
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        Promo Top Bar
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Show announcement strip
                      </p>
                    </div>
                    <Switch
                      checked={maintenanceBanner}
                      onCheckedChange={setMaintenanceBanner}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 pb-4">
                <div>
                  <CardTitle className="text-base">Live Hero Preview</CardTitle>
                  <CardDescription>
                    Real-time preview of above-the-fold marketing copy.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[11px]">
                  studyhub.io
                </Badge>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="space-y-4 rounded-xl border border-border bg-background p-6 text-center">
                  {maintenanceBanner && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                      <Sparkles className="size-3" />
                      New: Biometric QR Sync 2.4 Now Live
                    </div>
                  )}
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {heroHeadline}
                  </h2>
                  <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground">
                    {heroSubcopy}
                  </p>
                  <div className="flex justify-center gap-2 pt-1">
                    <Button size="sm" className="gap-1.5 text-xs">
                      {ctaText}
                      <ArrowRight className="size-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Book Demo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "pages" && <MarketingPagesPanel />}
      {activeTab === "media" && <MediaAssetsPanel />}
      {activeTab === "messages" && <LeadInquiriesPanel />}
    </section>
  )
}
