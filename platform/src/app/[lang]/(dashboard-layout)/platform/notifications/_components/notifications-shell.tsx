"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Bell, FileCode, Sparkles } from "lucide-react"

import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export type NotificationAccent =
  | "primary"
  | "emerald"
  | "amber"
  | "rose"
  | "blue"
  | "indigo"

const KPI_TOP_ACCENT: Record<NotificationAccent, string> = {
  primary: "from-primary/85 via-primary/35 to-transparent",
  emerald: "from-emerald-500/85 via-emerald-400/35 to-transparent",
  amber: "from-amber-500/85 via-amber-400/35 to-transparent",
  rose: "from-rose-500/85 via-rose-400/35 to-transparent",
  blue: "from-blue-500/85 via-blue-400/35 to-transparent",
  indigo: "from-indigo-500/85 via-indigo-400/35 to-transparent",
}

const KPI_ICON_TONE: Record<NotificationAccent, string> = {
  primary: "bg-primary/12 text-primary",
  emerald: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
  blue: "bg-blue-500/12 text-blue-600 dark:text-blue-400",
  indigo: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-400",
}

export interface NotificationsKpiCardProps {
  label: string
  value: string | number
  subtext?: string
  accent?: NotificationAccent
  icon: LucideIcon
}

export function NotificationsKpiCard({
  label,
  value,
  subtext,
  accent = "primary",
  icon: Icon,
}: NotificationsKpiCardProps) {
  return (
    <Card className="relative overflow-hidden border border-border/70 bg-card/90 backdrop-blur-xs rounded-xl shadow-xs">
      <div
        className={cn(
          "h-[2px] w-full bg-gradient-to-r",
          KPI_TOP_ACCENT[accent]
        )}
      />
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">
            {label}
          </p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
              {value}
            </span>
            {subtext && (
              <span className="text-[11px] font-medium text-muted-foreground truncate">
                {subtext}
              </span>
            )}
          </div>
        </div>
        <div
          className={cn(
            "size-9 rounded-lg flex items-center justify-center shrink-0",
            KPI_ICON_TONE[accent]
          )}
        >
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  )
}

export type NotificationTab = "broadcast" | "composer" | "templates" | "reports"

interface NotificationsHeaderProps {
  lang: string
  title: string
  badgeText?: string
  actions?: React.ReactNode
  activeTab?: NotificationTab
  onTabChange?: (tab: NotificationTab) => void
}

export function NotificationsHeader({
  lang,
  title,
  badgeText,
  actions,
  activeTab,
  onTabChange,
}: NotificationsHeaderProps) {
  const pathname = usePathname()

  const navItems: Array<{
    id: NotificationTab
    label: string
    href: string
    icon: LucideIcon
    exact?: boolean
  }> = [
    {
      id: "broadcast",
      label: "Broadcast Center",
      href: `/${lang}/platform/notifications`,
      icon: Bell,
      exact: true,
    },
    {
      id: "composer",
      label: "Rich Composer",
      href: `/${lang}/platform/notifications/composer`,
      icon: Sparkles,
    },
    {
      id: "templates",
      label: "Templates",
      href: `/${lang}/platform/notifications/templates`,
      icon: FileCode,
    },
    {
      id: "reports",
      label: "Delivery Reports",
      href: `/${lang}/platform/notifications/reports`,
      icon: BarChart3,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {badgeText && (
            <Badge variant="outline" className="font-mono text-xs bg-card">
              {badgeText}
            </Badge>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {navItems.map((item) => {
          const isActive = activeTab
            ? activeTab === item.id
            : item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)
          const ItemIcon = item.icon
          const itemClassName = cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer",
            isActive
              ? "bg-primary text-primary-foreground border-primary shadow-2xs"
              : "bg-card/80 text-muted-foreground border-border/70 hover:text-foreground hover:bg-muted/60"
          )

          if (onTabChange) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={itemClassName}
              >
                <ItemIcon className="size-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          }

          return (
            <Link key={item.href} href={item.href} className={itemClassName}>
              <ItemIcon className="size-3.5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

interface NotificationsPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function NotificationsPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: NotificationsPaginationProps) {
  if (totalItems === 0) return null

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(totalItems, currentPage * pageSize)
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/70 bg-muted/15">
      <p className="text-xs text-muted-foreground tabular-nums">
        Showing <span className="font-semibold text-foreground">{start}</span>–
        <span className="font-semibold text-foreground">{end}</span> of{" "}
        <span className="font-semibold text-foreground">{totalItems}</span>
      </p>

      {totalPages > 1 && (
        <Pagination className="w-auto mx-0">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) onPageChange(currentPage - 1)
                }}
                className={
                  currentPage <= 1
                    ? "pointer-events-none opacity-40 h-8 text-xs"
                    : "h-8 text-xs"
                }
              />
            </PaginationItem>

            {pages.map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === currentPage}
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(p)
                  }}
                  className="size-8 text-xs"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages) onPageChange(currentPage + 1)
                }}
                className={
                  currentPage >= totalPages
                    ? "pointer-events-none opacity-40 h-8 text-xs"
                    : "h-8 text-xs"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
