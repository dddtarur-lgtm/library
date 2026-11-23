"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Armchair,
  BookOpen,
  Building2,
  Check,
  DoorOpen,
  Droplets,
  ExternalLink,
  Layers,
  LayoutGrid,
  Maximize2,
  Minus,
  Monitor,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Square,
  Wind,
  Wrench,
  ZoomIn,
  ZoomOut,
} from "lucide-react"

import type {
  SeatAllocation,
  SeatCategory,
  SeatItem,
  SeatType,
  ShiftType,
} from "@/data/seats-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import { cn, getInitials } from "@/lib/utils"
import type { LocaleType } from "@/types"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  TOOLS_CONFIG,
  type CanvasElement,
  type ElementType,
} from "../builder/seating-editor-types"

interface SeatsFloorBlueprintProps {
  lang: LocaleType
  activeShift: ShiftType
  searchQuery: string
  seats: SeatItem[]
  selectedFloor: string
  layoutName: string
  elements: CanvasElement[]
  canvasWidth?: number
  canvasHeight?: number
  onSelectSeat: (seat: SeatItem) => void
  onRefreshLayout?: () => void
}

export function SeatsFloorBlueprint({
  lang,
  activeShift,
  searchQuery,
  seats,
  selectedFloor,
  layoutName,
  elements,
  canvasWidth,
  canvasHeight,
  onSelectSeat,
  onRefreshLayout,
}: SeatsFloorBlueprintProps) {
  // Zoom level persisted across page visits and reloads (default 1.0)
  const [zoom, setZoom] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("lib-seats-map-zoom-v1")
        if (saved) {
          const parsed = parseFloat(saved)
          if (!isNaN(parsed) && parsed >= 0.25 && parsed <= 3.0) {
            return Number(parsed.toFixed(2))
          }
        }
      } catch {}
    }
    return 1.0
  })

  // Hydrate stored zoom on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lib-seats-map-zoom-v1")
      if (saved) {
        const parsed = parseFloat(saved)
        if (!isNaN(parsed) && parsed >= 0.25 && parsed <= 3.0) {
          setZoom(Number(parsed.toFixed(2)))
        }
      }
    } catch {}
  }, [])

  // Persist zoom whenever user changes it (e.g. 60%, 80%, etc.)
  useEffect(() => {
    try {
      localStorage.setItem("lib-seats-map-zoom-v1", zoom.toFixed(2))
    } catch {}
  }, [zoom])

  const shiftKey =
    activeShift === "Morning"
      ? "morning"
      : activeShift === "Evening"
        ? "evening"
        : "fullDay"

  // Search query normalization
  const hasSearch = searchQuery.trim().length > 0
  const normalizedQuery = searchQuery.trim().toLowerCase()

  // Memoized O(1) seat lookup map prioritizing the currently selected floor
  const seatMap = useMemo(() => {
    const map = new Map<string, SeatItem>()
    // 1. Primary: match seats on selectedFloor
    seats.forEach((s) => {
      if (s.floor === selectedFloor) {
        map.set(s.seatNo.toLowerCase(), s)
        map.set(s.id.toLowerCase(), s)
      }
    })
    // 2. Fallback: match any other floor seat by seatNo
    seats.forEach((s) => {
      if (!map.has(s.seatNo.toLowerCase())) {
        map.set(s.seatNo.toLowerCase(), s)
      }
    })
    return map
  }, [seats, selectedFloor])

  // Pre-compute matching seat identifiers for zero-lag instant search filtering
  const matchingSeatIds = useMemo(() => {
    if (!hasSearch) return new Set<string>()
    const set = new Set<string>()
    seats.forEach((seat) => {
      const matchNo = seat.seatNo.toLowerCase().includes(normalizedQuery)
      const mStu = seat.shifts.morning
      const eStu = seat.shifts.evening
      const fStu = seat.shifts.fullDay

      const matchStu =
        mStu?.studentName.toLowerCase().includes(normalizedQuery) ||
        mStu?.studentId.toLowerCase().includes(normalizedQuery) ||
        eStu?.studentName.toLowerCase().includes(normalizedQuery) ||
        eStu?.studentId.toLowerCase().includes(normalizedQuery) ||
        fStu?.studentName.toLowerCase().includes(normalizedQuery) ||
        fStu?.studentId.toLowerCase().includes(normalizedQuery)

      if (matchNo || matchStu) {
        set.add(seat.id.toLowerCase())
        set.add(seat.seatNo.toLowerCase())
      }
    })
    return set
  }, [seats, hasSearch, normalizedQuery])

  // Fast O(1) mapping of elements to SeatItem objects
  const getSeatForElement = (el: CanvasElement): SeatItem => {
    const keyLabel = el.label?.toLowerCase() || ""
    const keyId = el.id.toLowerCase()
    const match = (keyLabel && seatMap.get(keyLabel)) || seatMap.get(keyId)
    if (match) return match

    // 2. Synthesize fallback seat so clicking & student assignment always works
    const isOccupiedInTpl = el.status === "taken"
    const isReservedInTpl = el.status === "reserved"

    const category: SeatCategory =
      el.type === "cabin" ? "Silent Cabin" : "General"

    const seatType: SeatType =
      el.type === "cabin"
        ? "Private Cabin"
        : el.type === "pc"
          ? "Computer Desk"
          : "Single Table"

    const firstChar = el.label ? el.label.charAt(0).toUpperCase() : "A"
    const row = /^[A-Z]$/.test(firstChar) ? `Row ${firstChar}` : "Row A"

    return {
      id: `canvas-${el.id}`,
      seatNo: el.label || `S-${el.id.slice(-4)}`,
      floor: selectedFloor,
      room: "Main Hall",
      row,
      type: seatType,
      category,
      pricePerMonth: el.type === "cabin" ? 2500 : el.type === "pc" ? 1800 : 1200,
      status: isOccupiedInTpl
        ? "Occupied"
        : isReservedInTpl
          ? "Reserved"
          : "Available",
      shifts: isOccupiedInTpl
        ? {
          [shiftKey]: {
            studentId: `STU-${el.label || "001"}`,
            studentName: `Member (${el.label})`,
            avatar: "/images/avatars/male-01.svg",
            planName: "Full Access Pass",
            planEnd: "2024-12-31",
            allocatedAt: "2024-10-01",
            shift: activeShift,
          },
        }
        : {},
      history: [],
    }
  }

  // Fast O(1) match check
  const checkMatch = (seat: SeatItem) => {
    if (!hasSearch) return false
    return (
      matchingSeatIds.has(seat.id.toLowerCase()) ||
      matchingSeatIds.has(seat.seatNo.toLowerCase())
    )
  }

  // Summary Metrics for this blueprint (Calculated once in O(N))
  const metrics = useMemo(() => {
    let bookableCount = 0
    let occupiedCount = 0
    let reservedCount = 0
    let maintenanceCount = 0

    elements.forEach((el) => {
      if (el.type === "seat" || el.type === "cabin" || el.type === "pc") {
        bookableCount++
        const seat = getSeatForElement(el)
        const alloc = seat.shifts[shiftKey] || seat.shifts.fullDay
        if (alloc) {
          occupiedCount++
        } else if (seat.status === "Reserved") {
          reservedCount++
        } else if (seat.status === "Maintenance") {
          maintenanceCount++
        }
      }
    })

    const freeCount = Math.max(
      0,
      bookableCount - occupiedCount - reservedCount - maintenanceCount
    )

    return {
      bookableCount,
      occupiedCount,
      freeCount,
      reservedCount,
      maintenanceCount,
    }
  }, [elements, seatMap, shiftKey])

  // Dynamic Blueprint Canvas Dimensions based on elements (adapts to any hall size with margin)
  const { hallW, hallH } = useMemo(() => {
    let maxX = canvasWidth || 960
    let maxY = canvasHeight || 600
    elements.forEach((el) => {
      if (el.x + el.w + 40 > maxX) {
        maxX = el.x + el.w + 40
      }
      if (el.y + el.h + 40 > maxY) {
        maxY = el.y + el.h + 40
      }
    })
    return {
      hallW: Math.max(canvasWidth || 960, Math.ceil(maxX / 20) * 20),
      hallH: Math.max(canvasHeight || 600, Math.ceil(maxY / 20) * 20),
    }
  }, [elements, canvasWidth, canvasHeight])

  // Sorting elements so zones render at the bottom, amenities next, seats on top
  const sortedElements = useMemo(() => {
    const order: Record<ElementType, number> = {
      zone: 0,
      pillar: 1,
      door: 2,
      reception: 3,
      shelf: 4,
      water: 5,
      ac: 6,
      label: 7,
      seat: 10,
      pc: 10,
      cabin: 10,
    }
    return [...elements].sort(
      (a, b) => (order[a.type] ?? 5) - (order[b.type] ?? 5)
    )
  }, [elements])

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-all">
      {/* Blueprint Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 sm:p-4 border-b border-border/80 bg-muted/20">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <LayoutGrid className="size-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                {layoutName || "Central Library — Floor Blueprint"}
              </h2>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold gap-1 py-0.5"
              >
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Blueprint
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span>Shift: <strong className="text-foreground">{activeShift}</strong></span>
              <span>•</span>
              <span>Hall canvas: <strong>{hallW} × {hallH} px</strong></span>
              <span>•</span>
              <span>{metrics.bookableCount} bookable spaces</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Legend */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Metrics Badges */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              {metrics.freeCount} Free
            </span>
            <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
              {metrics.occupiedCount} Occupied
            </span>
            {metrics.reservedCount > 0 && (
              <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/20">
                {metrics.reservedCount} Reserved
              </span>
            )}
            {metrics.maintenanceCount > 0 && (
              <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground font-medium border border-border">
                {metrics.maintenanceCount} Maint
              </span>
            )}
          </div>

          <div className="h-5 w-px bg-border hidden sm:block" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/60">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => setZoom((z) => Math.max(0.3, Number((z - 0.1).toFixed(1))))}
              title="Zoom Out"
            >
              <Minus className="size-3.5" />
            </Button>
            <span className="text-[11px] font-mono font-semibold px-1.5 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => setZoom((z) => Math.min(2.0, Number((z + 0.1).toFixed(1))))}
              title="Zoom In"
            >
              <Plus className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              onClick={() => {
                const fitScale = Math.min(
                  1.0,
                  Math.max(0.35, Number((680 / Math.max(hallW, hallH)).toFixed(2)))
                )
                setZoom(fitScale)
              }}
              title="Fit entire hall on screen"
            >
              Fit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setZoom(1.0)}
              title="Reset to 100%"
            >
              100%
            </Button>
          </div>

          {/* Builder Edit Link Button */}
          <Link
            href={`${ensureLocalizedPathname("/pages/seats/builder", lang)}?floor=${encodeURIComponent(selectedFloor)}`}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs transition-colors"
          >
            <Pencil className="size-3.5" />
            <span>Edit in Builder</span>
          </Link>
        </div>
      </div>

      {/* Blueprint Visual Canvas Container with Pan/Zoom & Full Scroll Coverage (No Clipping) */}
      <div
        className="relative w-full overflow-auto bg-muted/30 min-h-[580px] max-h-[820px] select-none"
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            const delta = e.deltaY < 0 ? 0.05 : -0.05
            setZoom((z) => Math.max(0.3, Math.min(2.0, Number((z + delta).toFixed(2)))))
          }
        }}
      >
        <div className="w-max min-w-full min-h-full p-6 sm:p-10 flex">
          <div
            className="relative transition-transform duration-100 ease-out shrink-0 m-auto"
            style={{
              width: hallW * zoom,
              height: hallH * zoom,
            }}
          >
            {/* Inner Scaled World (exact hallW x hallH coordinates matching builder preview) */}
            <div
              className="absolute left-0 top-0 origin-top-left"
              style={{
                width: hallW,
                height: hallH,
                transform: `scale(${zoom})`,
              }}
            >
            {/* Hall Boundary Rectangle with Dot Grid */}
            <div
              className="absolute inset-0 rounded-2xl border-2 border-border/80 bg-background shadow-md overflow-hidden"
              style={{
                backgroundImage:
                  "radial-gradient(hsl(var(--muted-foreground) / 0.18) 1.2px, transparent 1.2px)",
                backgroundSize: "20px 20px",
              }}
            >
              {/* Hall Header & Dimension Stamp */}
              <div className="absolute top-3 left-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 pointer-events-none z-10">
                <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{layoutName || "Main Library Hall"} ({hallW} × {hallH} px)</span>
              </div>
            </div>

            {/* Elements Layer */}
            {sortedElements.map((el) => {
              const toolCfg = TOOLS_CONFIG[el.type]
              const isBookable =
                el.type === "seat" || el.type === "cabin" || el.type === "pc"

              // If non-bookable, render static amenity/architectural element exactly like builder
              if (!isBookable) {
                if (el.type === "zone") {
                  return (
                    <div
                      key={el.id}
                      className="absolute rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.04] p-2 text-left pointer-events-none z-0"
                      style={{
                        left: el.x,
                        top: el.y,
                        width: el.w,
                        height: el.h,
                      }}
                    >
                      <span className="inline-block px-2 py-0.5 rounded-md bg-card/90 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider shadow-xs">
                        {el.label || "Zone"}
                      </span>
                    </div>
                  )
                }

                if (el.type === "pillar") {
                  return (
                    <div
                      key={el.id}
                      className="absolute rounded-md bg-muted-foreground/30 border border-muted-foreground/50 flex items-center justify-center z-1"
                      style={{
                        left: el.x,
                        top: el.y,
                        width: el.w,
                        height: el.h,
                      }}
                      title="Structural Pillar"
                    >
                      <Square className="size-3 text-muted-foreground" />
                    </div>
                  )
                }

                if (el.type === "door") {
                  return (
                    <div
                      key={el.id}
                      className="absolute rounded-lg border-[1.5px] border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center justify-center gap-1 z-2 shadow-xs"
                      style={{
                        left: el.x,
                        top: el.y,
                        width: el.w,
                        height: el.h,
                      }}
                      title="Entry / Exit Door"
                    >
                      <DoorOpen className="size-3" />
                      <span className="truncate">{el.label || "Door"}</span>
                    </div>
                  )
                }

                if (el.type === "reception") {
                  return (
                    <div
                      key={el.id}
                      className="absolute rounded-xl border-[1.5px] border-sky-500/50 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-xs flex items-center justify-center gap-1.5 z-2 shadow-xs"
                      style={{
                        left: el.x,
                        top: el.y,
                        width: el.w,
                        height: el.h,
                      }}
                      title="Front Desk & Reception"
                    >
                      <Building2 className="size-4" />
                      <span className="truncate">{el.label || "Reception"}</span>
                    </div>
                  )
                }

                if (el.type === "shelf") {
                  return (
                    <div
                      key={el.id}
                      className="absolute rounded-lg border-[1.5px] border-purple-500/50 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[10px] flex items-center justify-center gap-1 z-2 shadow-xs"
                      style={{
                        left: el.x,
                        top: el.y,
                        width: el.w,
                        height: el.h,
                      }}
                      title="Book Shelf / Stacks"
                    >
                      <BookOpen className="size-3" />
                      <span className="truncate">{el.label || "Books"}</span>
                    </div>
                  )
                }

                if (el.type === "water") {
                  return (
                    <div
                      key={el.id}
                      className="absolute rounded-lg border-[1.5px] border-cyan-500/50 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold text-[10px] flex items-center justify-center gap-1 z-2 shadow-xs"
                      style={{
                        left: el.x,
                        top: el.y,
                        width: el.w,
                        height: el.h,
                      }}
                      title="Water Dispenser / RO Purifier"
                    >
                      <Droplets className="size-3.5" />
                      <span className="truncate">{el.label || "RO"}</span>
                    </div>
                  )
                }

                if (el.type === "ac") {
                  return (
                    <div
                      key={el.id}
                      className="absolute rounded-lg border-[1.5px] border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center justify-center gap-1 z-2 shadow-xs"
                      style={{
                        left: el.x,
                        top: el.y,
                        width: el.w,
                        height: el.h,
                      }}
                      title="Air Conditioning Unit"
                    >
                      <Wind className="size-3" />
                      <span className="truncate">{el.label || "AC"}</span>
                    </div>
                  )
                }

                if (el.type === "label") {
                  return (
                    <div
                      key={el.id}
                      className="absolute font-bold text-xs text-foreground/80 flex items-center pointer-events-none z-2"
                      style={{
                        left: el.x,
                        top: el.y,
                        width: el.w,
                        height: el.h,
                      }}
                    >
                      {el.label}
                    </div>
                  )
                }

                return null
              }

              // BOOKABLE ELEMENT: Seat, Cabin, or PC Terminal
              const seat = getSeatForElement(el)
              const allocation = seat.shifts[shiftKey] || seat.shifts.fullDay
              const isOccupied = !!allocation
              const isMaintenance = seat.status === "Maintenance"
              const isReserved = seat.status === "Reserved"

              const isMatch = checkMatch(seat)
              const isDimmed = hasSearch && !isMatch

              // Distinct style for Cabin vs PC vs Regular Seat
              const isCabin = el.type === "cabin"
              const isPc = el.type === "pc"
              const isSeatOrPc = el.type === "seat" || el.type === "pc"

              // Sized exactly according to builder element dimensions so seating gap is 100% identical
              const cardW = el.w
              const cardH = el.h
              const posX = el.x
              const posY = el.y

              // Website default avatar mapped cleanly to local SVGs (matching Image 3 & 4)
              const femaleNames = ["Ritu", "Anju", "Pooja", "Neha", "Priya", "Sneha", "Kavita", "Divya", "Swati"]
              const isFemale = allocation?.studentName
                ? femaleNames.some((fn) => allocation.studentName.toLowerCase().includes(fn.toLowerCase()))
                : false
              const websiteDefaultAvatar = isFemale
                ? "/images/avatars/female-01.svg"
                : "/images/avatars/male-01.svg"
              const studentAvatar =
                allocation?.avatar &&
                allocation.avatar.startsWith("/images/avatars/") &&
                allocation.avatar.endsWith(".svg")
                  ? allocation.avatar
                  : websiteDefaultAvatar

              return (
                <div
                  key={el.id}
                  className="absolute pointer-events-auto"
                  style={{
                    left: posX,
                    top: posY,
                    width: cardW,
                    height: cardH,
                    zIndex: isOccupied ? 12 : 5,
                  }}
                >
                  <HoverCard openDelay={80} closeDelay={120}>
                    <HoverCardTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onSelectSeat(seat)}
                        className={cn(
                          "group relative size-full flex flex-col items-center justify-between p-2 rounded-[20px] border transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring select-none overflow-hidden",
                          "bg-[#202226] dark:bg-[#1e2022] text-card-foreground border-white/5 shadow-md hover:shadow-xl",
                          "hover:scale-[1.02]",
                          isMatch &&
                            "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.04] z-30 shadow-md",
                          isDimmed && "opacity-25 scale-95",
                          isOccupied
                            ? "hover:border-amber-500/70"
                            : isReserved
                              ? "hover:border-purple-500/70"
                              : isMaintenance
                                ? "opacity-60 cursor-not-allowed bg-muted/40"
                                : "hover:border-emerald-500/70"
                        )}
                        style={{
                          margin: 0,
                          width: "100%",
                          height: "100%",
                        }}
                        title={`${seat.seatNo} • Click to assign/view`}
                      >
                        {/* Top Status Capsule Pill (Matching Image 2, 3, 4) */}
                        {isOccupied ? (
                          <div className="w-full h-5.5 px-2 rounded-full bg-[#eab308] text-black flex items-center shadow-xs shrink-0 select-none">
                            <span className="size-2.5 rounded-full bg-black/20 shrink-0" />
                            <span className="text-[11px] font-bold tracking-tight flex-1 text-center -ml-2.5 text-black">
                              Occupied
                            </span>
                          </div>
                        ) : isReserved ? (
                          <div className="w-full h-5.5 px-2 rounded-full bg-purple-500 text-white flex items-center shadow-xs shrink-0 select-none">
                            <span className="size-2.5 rounded-full bg-black/25 shrink-0" />
                            <span className="text-[10.5px] font-bold tracking-tight flex-1 text-center -ml-2.5 text-white">
                              Reserved
                            </span>
                          </div>
                        ) : isMaintenance ? (
                          <div className="w-full h-5.5 px-2 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700/60 flex items-center shadow-xs shrink-0 select-none">
                            <span className="size-2.5 rounded-full bg-neutral-600 shrink-0" />
                            <span className="text-[10.5px] font-bold tracking-tight flex-1 text-center -ml-2.5 text-neutral-300">
                              Maint
                            </span>
                          </div>
                        ) : (
                          /* Free Pill (Matching Image 2) */
                          <div className="w-full h-5.5 px-2 rounded-full bg-[#1fc749] text-black flex items-center shadow-xs shrink-0 select-none">
                            <span className="size-2.5 rounded-full bg-black/20 shrink-0" />
                            <span className="text-[11px] font-bold tracking-tight flex-1 text-center -ml-2.5 text-black">
                              Free
                            </span>
                          </div>
                        )}

                        {/* Top badges for VIP Cabin or PC Terminal */}
                        {isCabin && (
                          <div className="absolute top-6.5 left-2 flex items-center gap-0.5 text-[8px] font-bold text-indigo-400 opacity-90 uppercase tracking-wider pointer-events-none">
                            <Shield className="size-2.5" />
                            <span>VIP</span>
                          </div>
                        )}
                        {isPc && (
                          <div className="absolute top-6.5 right-2 text-sky-400 opacity-80 pointer-events-none">
                            <Monitor className="size-2.5" />
                          </div>
                        )}

                        {/* Card Center Content */}
                        {isOccupied && allocation ? (
                          /* Occupied Card Body (Matching Image 3 & 4) */
                          <div className="flex-1 w-full flex flex-col items-center justify-center min-w-0 py-0.5">
                            {/* Avatar Container: rounded square with dark gray background */}
                            <div className="size-9 rounded-xl bg-[#444849] flex items-center justify-center overflow-hidden shrink-0 shadow-xs my-0.5">
                              <img
                                src={studentAvatar}
                                alt={allocation.studentName}
                                className="size-full object-cover p-0.5"
                              />
                            </div>

                            {/* Student Name (Bold White text) */}
                            <span className="text-[11px] font-bold text-white truncate max-w-full text-center leading-tight mt-0.5 px-1">
                              {allocation.studentName}
                            </span>

                            {/* Seat Number Mini-Pill Badge (Gold background with black text) */}
                            <span className="mt-1 px-2.5 py-0.5 rounded-full bg-[#eab308] text-black text-[9.5px] font-bold font-mono tracking-tight shadow-xs shrink-0 leading-none">
                              {seat.seatNo}
                            </span>
                          </div>
                        ) : isMaintenance ? (
                          <div className="flex-1 w-full flex flex-col items-center justify-center gap-1">
                            <Wrench className="size-4 text-muted-foreground" />
                            <span className="text-[10px] font-bold font-mono text-muted-foreground">
                              {seat.seatNo}
                            </span>
                          </div>
                        ) : isReserved ? (
                          <div className="flex-1 w-full flex flex-col items-center justify-center">
                            <span className="text-xl font-black font-mono tracking-tight text-white leading-none">
                              {seat.seatNo}
                            </span>
                            <span className="mt-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-bold">
                              Reserved
                            </span>
                          </div>
                        ) : (
                          /* Free Seat Card Body - Big Bold High-Contrast White Seat Number (Matching Image 2) */
                          <div className="flex-1 w-full flex items-center justify-center">
                            <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white select-none leading-none">
                              {seat.seatNo}
                            </span>
                          </div>
                        )}
                      </button>
                    </HoverCardTrigger>

                    {/* Clean Hover Card Popup */}
                    <HoverCardContent
                      align="center"
                      side="top"
                      className="w-72 p-3 space-y-2 z-50 border border-border bg-popover text-popover-foreground shadow-xl rounded-xl"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                        <div>
                          <h4 className="text-sm font-bold flex items-center gap-1.5">
                            {isCabin ? (
                              <Shield className="size-4 text-indigo-500" />
                            ) : isPc ? (
                              <Monitor className="size-4 text-blue-500" />
                            ) : (
                              <Armchair className="size-4 text-emerald-500" />
                            )}
                            <span>Seat {seat.seatNo}</span>
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            {isCabin ? "VIP Silent Cabin" : isPc ? "Computer Terminal" : "Study Desk"} • {selectedFloor}
                          </p>
                        </div>

                        <Badge
                          variant="outline"
                          className={
                            isOccupied
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-semibold"
                              : isReserved
                                ? "bg-purple-500/10 text-purple-600 border-purple-500/30 text-[10px] font-semibold"
                                : isMaintenance
                                  ? "bg-muted text-muted-foreground text-[10px]"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold"
                          }
                        >
                          {isOccupied
                            ? `Occupied (${activeShift})`
                            : isReserved
                              ? "Reserved"
                              : isMaintenance
                                ? "Maintenance"
                                : "Available"}
                        </Badge>
                      </div>

                      {/* Occupied Student Information */}
                      {isOccupied && allocation ? (
                        <div className="space-y-1.5 p-2 rounded-lg bg-muted/50 border border-border/60">
                          <div className="flex items-center gap-2">
                            <div className="size-8 rounded-lg bg-[#444849] overflow-hidden shrink-0 flex items-center justify-center">
                              <img
                                src={studentAvatar}
                                alt={allocation.studentName}
                                className="size-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-foreground truncate">
                                {allocation.studentName}
                              </p>
                              <p className="text-[10px] font-mono text-muted-foreground">
                                ID: {allocation.studentId}
                              </p>
                            </div>
                          </div>
                          <div className="text-[10px] space-y-0.5 text-muted-foreground pt-1 border-t border-border/40">
                            <div className="flex justify-between">
                              <span>Plan:</span>
                              <span className="font-semibold text-foreground">
                                {allocation.planName}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Valid Until:</span>
                              <span className="font-semibold text-foreground">
                                {allocation.planEnd}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground py-1">
                          Seat is free and available for direct student allocation during {activeShift} shift.
                        </div>
                      )}

                      {/* Click prompt */}
                      <div className="text-[10px] text-center text-primary font-medium pt-1 border-t border-border/40 flex items-center justify-center gap-1">
                        <span>Click to allocate, vacate, or edit</span>
                        <ExternalLink className="size-3" />
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>

      {/* Blueprint Footer Legend & Controls */}
      <div className="p-3 sm:p-3.5 border-t border-border/80 bg-muted/20 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-foreground">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#1fc749]" />
            <span>Available ({metrics.freeCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#eab308]" />
            <span>Occupied ({metrics.occupiedCount})</span>
          </div>
          {metrics.reservedCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-purple-500" />
              <span>Reserved ({metrics.reservedCount})</span>
            </div>
          )}
          {metrics.maintenanceCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-neutral-600" />
              <span>Maintenance ({metrics.maintenanceCount})</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Shield className="size-3 text-indigo-400" />
            <span>VIP Cabin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Monitor className="size-3 text-sky-400" />
            <span>PC Station</span>
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground">
          Tip: Click any seat to allocate a student or change shift assignments.
        </div>
      </div>
    </div>
  )
}
