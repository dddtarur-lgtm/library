"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Layers,
  Plus,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react"

import type { LocaleType } from "@/types"
import type { DateRangeOption } from "../types"

import { ensureLocalizedPathname } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"

interface PlatformAdminHeaderProps {
  dateRange: DateRangeOption
  setDateRange: (range: DateRangeOption) => void
  comparePrevious: boolean
  setComparePrevious: (compare: boolean) => void
  onOpenDialog: (
    dialog: "review-request" | "manual-payment" | "platform-notification" | "add-library"
  ) => void
  pendingCount: number
}

const dateRangeLabels: Record<DateRangeOption, string> = {
  today: "Today",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "this-month": "This Month (Nov 2026)",
  quarter: "Last Quarter (Q3)",
  custom: "Custom Range",
}

export function PlatformAdminHeader({
  dateRange,
  setDateRange,
  comparePrevious,
  setComparePrevious,
  onOpenDialog,
  pendingCount,
}: PlatformAdminHeaderProps) {
  const params = useParams()
  const locale = (params.lang as LocaleType) || "en"

  return (
    <div className="flex flex-col gap-3 pb-2 border-b border-border/60">
      {/* Top Banner Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Layers className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-foreground">
                Super Admin Control Tower
              </h1>
              <Badge variant="outline" className="text-xs font-semibold border-primary/40 text-primary">
                Platform v1.0
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Multi-tenant overview • Indian Standard Time (IST) • Direct Razorpay Gateway
            </p>
          </div>
        </div>

        {/* View Switcher Pill */}
        <div className="flex items-center gap-2">
          <Link
            href={ensureLocalizedPathname("/dashboards/home", locale)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full border border-border/80 bg-muted/60 text-foreground hover:bg-muted transition-colors shadow-2xs"
            title="Preview standard Library Admin dashboard"
          >
            <Building2 className="size-3.5 text-primary" />
            <span>Library Admin View</span>
            <ExternalLink className="size-3 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Filter and Quick Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        {/* Left: Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date range picker trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium">
                <Calendar className="size-3.5 text-muted-foreground" />
                <span>{dateRangeLabels[dateRange]}</span>
                <SlidersHorizontal className="size-3 text-muted-foreground ms-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {(Object.keys(dateRangeLabels) as DateRangeOption[]).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setDateRange(key)}
                  className="flex items-center justify-between text-xs"
                >
                  <span>{dateRangeLabels[key]}</span>
                  {dateRange === key && <CheckCircle2 className="size-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Compare Toggle */}
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none px-2 py-1 rounded-md border border-border/50 bg-background/50">
            <Switch
              checked={comparePrevious}
              onCheckedChange={setComparePrevious}
              className="scale-75"
            />
            <span>Compare with previous period</span>
          </label>
        </div>

        {/* Right: Quick Actions conforming to rules */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => onOpenDialog("review-request")}
            className="h-8 gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
          >
            <CheckCircle2 className="size-3.5" />
            <span>Review Requests</span>
            {pendingCount > 0 && (
              <span className="ms-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-amber-950 font-black">
                {pendingCount}
              </span>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenDialog("manual-payment")}
            className="h-8 gap-1.5 text-xs font-bold border-border/80"
          >
            <CreditCard className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Add Manual Payment</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenDialog("platform-notification")}
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            <Bell className="size-3.5 text-sky-600 dark:text-sky-400" />
            <span>Send Notification</span>
          </Button>

          <Link href={`/${lang}/platform/libraries/add`}>
            <Button
              size="sm"
              variant="default"
              className="h-8 gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Add Library</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

