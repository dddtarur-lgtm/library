"use client"

import { useCallback, useEffect, useState } from "react"
import { Armchair, TrendingUp, Users } from "lucide-react"

import type { LocaleType } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { floorsList, initialSeatsData, type SeatItem } from "@/data/seats-data"
import {
  createFloorLayout,
  getStorageKeyForFloor,
  SEATS_DATA_STORAGE_KEY,
  SEATING_STORAGE_KEY,
  type CanvasElement,
} from "../builder/seating-editor-types"

interface LibraryMetrics {
  totalCapacity: number
  occupancyRate: string
  totalAllocations: number
  morningCount: number
  eveningCount: number
  fullDayCount: number
  floorsCount: number
}

function calculateMetrics(): LibraryMetrics {
  let totalCapacity = 0

  // 1. Calculate total bookable capacity across all floors
  floorsList.forEach((floor) => {
    const floorName = floor.name
    let elements: CanvasElement[] = []
    if (typeof window !== "undefined") {
      try {
        const key = getStorageKeyForFloor(floorName)
        const raw =
          localStorage.getItem(key) ||
          (floorName === "Ground Floor"
            ? localStorage.getItem(SEATING_STORAGE_KEY)
            : null)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            elements = parsed
          } else if (parsed && Array.isArray(parsed.elements)) {
            elements = parsed.elements
          }
        }
      } catch {}
    }

    if (elements.length === 0) {
      elements = createFloorLayout(floorName)
    }

    const bookableCount = elements.filter(
      (el) => el.type === "seat" || el.type === "cabin" || el.type === "pc"
    ).length

    totalCapacity += bookableCount
  })

  // 2. Calculate seat allocations from stored seats database
  let currentSeats: SeatItem[] = initialSeatsData
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(SEATS_DATA_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentSeats = parsed
        }
      }
    } catch {}
  }

  let morningCount = 0
  let eveningCount = 0
  let fullDayCount = 0
  let occupiedSeatsCount = 0

  currentSeats.forEach((seat) => {
    let hasAnyShift = false
    if (seat.shifts?.morning) {
      morningCount++
      hasAnyShift = true
    }
    if (seat.shifts?.evening) {
      eveningCount++
      hasAnyShift = true
    }
    if (seat.shifts?.fullDay) {
      fullDayCount++
      hasAnyShift = true
    }
    if (hasAnyShift || seat.status === "Occupied") {
      occupiedSeatsCount++
    }
  })

  const totalAllocations = morningCount + eveningCount + fullDayCount
  const capacityBase = totalCapacity > 0 ? totalCapacity : 74
  const occupancyNum = Math.min(
    100,
    Math.round((occupiedSeatsCount / capacityBase) * 1000) / 10
  )

  return {
    totalCapacity: capacityBase,
    occupancyRate: occupancyNum.toFixed(1),
    totalAllocations,
    morningCount,
    eveningCount,
    fullDayCount,
    floorsCount: floorsList.length,
  }
}

export function SeatsMetricsCards({ lang }: { lang: LocaleType }) {
  const [metrics, setMetrics] = useState<LibraryMetrics>(calculateMetrics)

  const refreshMetrics = useCallback(() => {
    setMetrics(calculateMetrics())
  }, [])

  useEffect(() => {
    // Initial client evaluation with persisted localStorage
    refreshMetrics()

    // Listen to changes across tabs and local state updates
    window.addEventListener("storage", refreshMetrics)
    return () => {
      window.removeEventListener("storage", refreshMetrics)
    }
  }, [refreshMetrics])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {/* Metric 1: Total Capacity */}
      <Card className="border border-border bg-card shadow-xs rounded-lg">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Total Capacity
            </span>
            <div className="text-xl font-bold text-foreground">
              {metrics.totalCapacity} Seats
            </div>
            <div className="text-[10px] text-muted-foreground">
              {metrics.floorsCount} Floors • Central & Silent Wings
            </div>
          </div>
          <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Armchair className="size-4" />
          </div>
        </CardContent>
      </Card>

      {/* Metric 2: Occupancy Rate */}
      <Card className="border border-border bg-card shadow-xs rounded-lg">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Occupancy Rate
            </span>
            <div className="text-xl font-bold text-foreground">
              {metrics.occupancyRate}%
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Live floor utilization
            </div>
          </div>
          <div className="size-8 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="size-4" />
          </div>
        </CardContent>
      </Card>

      {/* Metric 3: Active Allocations */}
      <Card className="border border-border bg-card shadow-xs rounded-lg">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Active Allocations
            </span>
            <div className="text-xl font-bold text-foreground">
              {metrics.totalAllocations} Students
            </div>
            <div className="text-[10px] text-muted-foreground">
              M: {metrics.morningCount} • E: {metrics.eveningCount} • Full:{" "}
              {metrics.fullDayCount}
            </div>
          </div>
          <div className="size-8 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="size-4" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
