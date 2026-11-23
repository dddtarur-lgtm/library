"use client"

import { useState } from "react"
import { Building2 } from "lucide-react"

import { cn } from "@/lib/utils"

export type LibraryLogoSize = "xs" | "sm" | "md" | "lg" | "xl" | "responsive"

export type LibraryLogoShape = "rounded" | "circle" | "square"

export type LibraryStatusTone =
  | "Active"
  | "Grace"
  | "Locked"
  | "Suspended"
  | "Trial"
  | "Expired"
  | "Pending"
  | "Connected"
  | "Needs reconnect"
  | "Disconnected"

interface BrandPalette {
  surface: string
  ring: string
  accent: string
}

const BRAND_PALETTES: BrandPalette[] = [
  {
    surface:
      "bg-indigo-500/12 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
    ring: "ring-indigo-500/25 dark:ring-indigo-400/30",
    accent: "from-indigo-500/20 via-indigo-500/5 to-transparent",
  },
  {
    surface:
      "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    ring: "ring-emerald-500/25 dark:ring-emerald-400/30",
    accent: "from-emerald-500/20 via-emerald-500/5 to-transparent",
  },
  {
    surface: "bg-sky-500/12 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
    ring: "ring-sky-500/25 dark:ring-sky-400/30",
    accent: "from-sky-500/20 via-sky-500/5 to-transparent",
  },
  {
    surface:
      "bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
    ring: "ring-amber-500/30 dark:ring-amber-400/30",
    accent: "from-amber-500/20 via-amber-500/5 to-transparent",
  },
  {
    surface:
      "bg-violet-500/12 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    ring: "ring-violet-500/25 dark:ring-violet-400/30",
    accent: "from-violet-500/20 via-violet-500/5 to-transparent",
  },
  {
    surface:
      "bg-teal-500/12 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
    ring: "ring-teal-500/25 dark:ring-teal-400/30",
    accent: "from-teal-500/20 via-teal-500/5 to-transparent",
  },
  {
    surface:
      "bg-rose-500/12 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    ring: "ring-rose-500/25 dark:ring-rose-400/30",
    accent: "from-rose-500/20 via-rose-500/5 to-transparent",
  },
  {
    surface:
      "bg-orange-500/12 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
    ring: "ring-orange-500/25 dark:ring-orange-400/30",
    accent: "from-orange-500/20 via-orange-500/5 to-transparent",
  },
]

const SKIP_WORDS = new Set(["&", "the", "of", "and", "at", "in", "by"])

/**
 * Strips parenthetical suffixes such as "(LIB-AHM-005)" or "(Main Branch)"
 * when resolving a library's clean display name from audit/report strings.
 */
export function normalizeLibraryName(rawName: string): string {
  return rawName.replace(/\s*\([^)]*\)\s*$/, "").trim()
}

/**
 * Computes a deterministic 2-character monogram and curated color palette
 * from a library's name so every screen renders identical tenant branding.
 */
export function getLibraryBrand(name: string, code?: string) {
  const cleanName = normalizeLibraryName(name || "")
  const words = cleanName
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter((w) => w.length > 0 && !SKIP_WORDS.has(w.toLowerCase()))

  let initials = "LB"
  if (words.length >= 2) {
    initials = `${words[0][0]}${words[1][0]}`.toUpperCase()
  } else if (words.length === 1) {
    initials = words[0].slice(0, 2).toUpperCase()
  } else if (code) {
    initials =
      code
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 2)
        .toUpperCase() || "LB"
  }

  const seed = cleanName.toLowerCase() || (code || "library").toLowerCase()
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }

  const palette = BRAND_PALETTES[hash % BRAND_PALETTES.length]
  return { initials, palette, cleanName }
}

function isCustomLogoUrl(src?: string): src is string {
  if (!src) return false
  const trimmed = src.trim()
  if (!trimmed) return false
  if (trimmed.includes("shadboard.svg")) return false
  return true
}

const SIZE_CLASSES: Record<LibraryLogoSize, string> = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-9 sm:size-10 text-xs sm:text-sm",
  lg: "size-12 sm:size-14 text-sm sm:text-base",
  xl: "size-14 sm:size-16 md:size-20 text-base sm:text-lg md:text-xl",
  responsive: "size-9 sm:size-11 lg:size-14 text-xs sm:text-sm lg:text-base",
}

const SHAPE_CLASSES: Record<
  LibraryLogoShape,
  Record<LibraryLogoSize, string>
> = {
  rounded: {
    xs: "rounded-md",
    sm: "rounded-lg",
    md: "rounded-lg",
    lg: "rounded-xl",
    xl: "rounded-2xl",
    responsive: "rounded-lg sm:rounded-xl",
  },
  circle: {
    xs: "rounded-full",
    sm: "rounded-full",
    md: "rounded-full",
    lg: "rounded-full",
    xl: "rounded-full",
    responsive: "rounded-full",
  },
  square: {
    xs: "rounded-sm",
    sm: "rounded-md",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    responsive: "rounded-md sm:rounded-lg",
  },
}

const DOT_SIZE_CLASSES: Record<LibraryLogoSize, string> = {
  xs: "size-1.5 -bottom-0.5 -right-0.5 border",
  sm: "size-2 -bottom-0.5 -right-0.5 border-[1.5px]",
  md: "size-2.5 -bottom-0.5 -right-0.5 border-2",
  lg: "size-3 -bottom-0.5 -right-0.5 border-2",
  xl: "size-3.5 bottom-0 right-0 border-2",
  responsive: "size-2.5 sm:size-3 -bottom-0.5 -right-0.5 border-2",
}

function getStatusDotClass(status?: LibraryStatusTone): string {
  switch (status) {
    case "Active":
    case "Connected":
      return "bg-emerald-500"
    case "Grace":
    case "Needs reconnect":
    case "Trial":
    case "Pending":
      return "bg-amber-500"
    case "Locked":
    case "Suspended":
    case "Expired":
    case "Disconnected":
      return "bg-destructive"
    default:
      return "bg-muted-foreground"
  }
}

export interface LibraryLogoProps {
  name: string
  code?: string
  src?: string
  subtitle?: string
  size?: LibraryLogoSize
  shape?: LibraryLogoShape
  status?: LibraryStatusTone
  showStatusDot?: boolean
  showLockup?: boolean
  interactive?: boolean
  className?: string
  textClassName?: string
}

/**
 * Responsive library brand widget with custom logo image support, deterministic
 * monogram fallback, theme-safe surfaces, and optional status indicator dot.
 */
export function LibraryLogo({
  name,
  code,
  src,
  subtitle,
  size = "md",
  shape = "rounded",
  status,
  showStatusDot = false,
  showLockup = false,
  interactive = false,
  className,
  textClassName,
}: LibraryLogoProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const { initials, palette, cleanName } = getLibraryBrand(name, code)
  const hasCustomImage = isCustomLogoUrl(src) && !imgFailed

  const shapeClass = SHAPE_CLASSES[shape][size]
  const sizeClass = SIZE_CLASSES[size]

  const emblem = (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center select-none font-bold tracking-tight transition-all duration-200 ring-1",
        sizeClass,
        shapeClass,
        hasCustomImage
          ? "bg-background border border-border/80 ring-border/40 overflow-hidden p-1 shadow-2xs"
          : cn(
              palette.surface,
              palette.ring,
              "bg-gradient-to-br",
              palette.accent
            ),
        interactive &&
          "hover:scale-[1.03] hover:ring-primary/50 hover:shadow-xs",
        !showLockup && className
      )}
      aria-label={`${cleanName || "Library"} logo`}
    >
      {hasCustomImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={cleanName || name}
          onError={() => setImgFailed(true)}
          className={cn(
            "h-full w-full object-contain",
            shape === "circle" ? "rounded-full" : "rounded-[inherit]"
          )}
        />
      ) : cleanName || code ? (
        <span className="leading-none">{initials}</span>
      ) : (
        <Building2 className="size-1/2 opacity-80" />
      )}

      {showStatusDot && status && (
        <span
          title={status}
          className={cn(
            "absolute rounded-full border-background shadow-2xs",
            DOT_SIZE_CLASSES[size],
            getStatusDotClass(status)
          )}
        />
      )}
    </span>
  )

  if (!showLockup) {
    return emblem
  }

  return (
    <div className={cn("flex items-center gap-2.5 min-w-0", className)}>
      {emblem}
      <div className={cn("min-w-0 flex-1", textClassName)}>
        <p className="font-bold text-foreground truncate leading-tight">
          {name}
        </p>
        {(subtitle || code) && (
          <p className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">
            {subtitle || code}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Compact profile-avatar-style library emblem for dense data tables,
 * dashboard operational queues, selectors, and activity logs.
 */
export function LibraryAvatar({
  size = "sm",
  shape = "rounded",
  ...props
}: LibraryLogoProps) {
  return <LibraryLogo size={size} shape={shape} {...props} />
}
