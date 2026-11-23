"use client"

import React, { useRef, useState } from "react"
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalSpaceBetween,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalSpaceBetween,
  Copy,
  FlipHorizontal,
  FlipVertical,
  Layers,
  Lock,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Scan,
  Sliders,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  GRID_SIZE,
  HALL_PRESETS,
  isBookable,
  STATUS_CONFIG,
  TOOLS_CONFIG,
  type CanvasElement,
  type SeatStatus,
} from "../seating-editor-types"
import type { ElementPatch, HistoryAction } from "../_lib/editor-history"

interface RightPanelProps {
  mode: "edit" | "preview"
  elements: CanvasElement[]
  selectedIds: string[]
  canvasWidth?: number
  canvasHeight?: number
  hallName?: string
  onSelectElement: (id: string | null) => void
  onUpdateElement?: (id: string, updates: Partial<CanvasElement>) => void
  onLiveUpdateElement?: (id: string, updates: Partial<CanvasElement>) => void
  onCommitElementPatch?: (
    id: string,
    before: Partial<CanvasElement>,
    after: Partial<CanvasElement>,
    description?: string
  ) => void
  onCommitHistoryAction?: (action: HistoryAction) => void
  onDuplicate: (ids: string[]) => void
  onDelete: (ids: string[]) => void
  onClearSelection: () => void
  onCanvasSizeChange?: (w: number, h: number, commit?: boolean) => void
  onAutoFitCanvas?: () => void
  hallSettingsOpen?: boolean
  onCloseHallSettings?: () => void
}

export function RightPanel({
  mode,
  elements,
  selectedIds,
  canvasWidth = 960,
  canvasHeight = 600,
  hallName,
  onSelectElement,
  onUpdateElement,
  onLiveUpdateElement,
  onCommitElementPatch,
  onCommitHistoryAction,
  onDuplicate,
  onDelete,
  onClearSelection,
  onCanvasSizeChange,
  onAutoFitCanvas,
  hallSettingsOpen,
  onCloseHallSettings,
}: RightPanelProps) {
  // State to toggle open/close the Layers panel when nothing is selected
  const [layersOpen, setLayersOpen] = useState(false)
  // State to toggle individual corner radius inputs (matching Figma)
  const [independentCorners, setIndependentCorners] = useState(false)

  const liveUpdate = onLiveUpdateElement || onUpdateElement || (() => {})

  // Track property before/after changes for debounced single history entry (Rule 1 & Rule 2)
  const focusRef = useRef<{
    id: string
    field: string
    beforeValue: any
    timer?: NodeJS.Timeout
  } | null>(null)

  const handleStartField = (id: string, field: string, initialVal: any) => {
    if (focusRef.current) {
      handleCommitField()
    }
    focusRef.current = {
      id,
      field,
      beforeValue: initialVal,
    }
  }

  const handleLiveFieldChange = (
    id: string,
    field: keyof CanvasElement,
    newVal: any,
    extraUpdates?: Partial<CanvasElement>,
    description?: string
  ) => {
    liveUpdate(id, { [field]: newVal, ...extraUpdates })

    if (focusRef.current?.timer) {
      clearTimeout(focusRef.current.timer)
    }

    if (!focusRef.current || focusRef.current.id !== id || focusRef.current.field !== field) {
      const cur = elements.find((e) => e.id === id)
      focusRef.current = {
        id,
        field: field as string,
        beforeValue: cur ? (cur as any)[field] : undefined,
      }
    }

    focusRef.current.timer = setTimeout(() => {
      handleCommitField(description)
    }, 600)
  }

  const handleCommitField = (desc?: string) => {
    if (!focusRef.current) return
    const { id, field, beforeValue, timer } = focusRef.current
    if (timer) clearTimeout(timer)
    focusRef.current = null

    const cur = elements.find((e) => e.id === id)
    if (!cur) return
    const afterValue = (cur as any)[field]

    if (beforeValue !== afterValue && onCommitElementPatch) {
      onCommitElementPatch(
        id,
        { [field]: beforeValue },
        { [field]: afterValue },
        desc || `Change ${field}`
      )
    }
  }

  // Filter valid selected elements from canvas elements array
  const validSelectedElements = elements.filter((e) =>
    selectedIds.includes(e.id)
  )

  // Preview Mode: Live stats summary
  if (mode === "preview") {
    const bookableElements = elements.filter((e) => isBookable(e.type))
    const statusCounts = {
      free: 0,
      taken: 0,
      reserved: 0,
    }
    bookableElements.forEach((e) => {
      const st = (e.status || "free") as SeatStatus
      statusCounts[st]++
    })
    const blockedCount = elements.filter((e) => e.type === "pillar").length

    return (
      <aside className="fixed right-4 bottom-16 z-40 w-64 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl p-4 transition-all">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="text-xs font-semibold tracking-wide uppercase text-foreground">
              Live Seat Map
            </h4>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">
            {bookableElements.length} seats
          </span>
        </div>

        <div className="space-y-2 py-1 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: STATUS_CONFIG.free.color }}
              />
              <span className="text-muted-foreground">Available (Free):</span>
            </div>
            <span className="font-semibold text-foreground">
              {statusCounts.free}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: STATUS_CONFIG.taken.color }}
              />
              <span className="text-muted-foreground">Occupied:</span>
            </div>
            <span className="font-semibold text-foreground">
              {statusCounts.taken}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: STATUS_CONFIG.reserved.color }}
              />
              <span className="text-muted-foreground">Reserved:</span>
            </div>
            <span className="font-semibold text-foreground">
              {statusCounts.reserved}
            </span>
          </div>

          {blockedCount > 0 && (
            <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
              <span>Pillars / Blocked:</span>
              <span>{blockedCount}</span>
            </div>
          )}
        </div>

        <div className="mt-3 pt-2 border-t border-border/40 text-[11px] text-muted-foreground text-center">
          💡 Click any seat on the canvas to cycle its live status!
        </div>
      </aside>
    )
  }

  // Edit Mode:
  // 1. If MULTIPLE valid elements are selected: Multi-Inspector (with Alignment & Distribute transactions)
  if (validSelectedElements.length > 1) {
    const selectedItemIds = validSelectedElements.map((e) => e.id)

    // Multi-element alignment operations (Rule 4: Transactions - 1 entry undone in 1 step)
    const handleAlign = (
      type:
        | "left"
        | "center-h"
        | "right"
        | "top"
        | "center-v"
        | "bottom"
        | "distribute-h"
        | "distribute-v"
    ) => {
      if (validSelectedElements.length < 2) return

      let updated: Array<{ id: string; x: number; y: number }> = []

      if (type === "left") {
        const minX = Math.min(...validSelectedElements.map((e) => e.x))
        updated = validSelectedElements.map((e) => ({ id: e.id, x: minX, y: e.y }))
      } else if (type === "right") {
        const maxRight = Math.max(...validSelectedElements.map((e) => e.x + e.w))
        updated = validSelectedElements.map((e) => ({
          id: e.id,
          x: maxRight - e.w,
          y: e.y,
        }))
      } else if (type === "center-h") {
        const minX = Math.min(...validSelectedElements.map((e) => e.x))
        const maxRight = Math.max(...validSelectedElements.map((e) => e.x + e.w))
        const mid = (minX + maxRight) / 2
        updated = validSelectedElements.map((e) => ({
          id: e.id,
          x: Math.max(0, Math.round((mid - e.w / 2) / GRID_SIZE) * GRID_SIZE),
          y: e.y,
        }))
      } else if (type === "top") {
        const minY = Math.min(...validSelectedElements.map((e) => e.y))
        updated = validSelectedElements.map((e) => ({ id: e.id, x: e.x, y: minY }))
      } else if (type === "bottom") {
        const maxBottom = Math.max(...validSelectedElements.map((e) => e.y + e.h))
        updated = validSelectedElements.map((e) => ({
          id: e.id,
          x: e.x,
          y: maxBottom - e.h,
        }))
      } else if (type === "center-v") {
        const minY = Math.min(...validSelectedElements.map((e) => e.y))
        const maxBottom = Math.max(...validSelectedElements.map((e) => e.y + e.h))
        const mid = (minY + maxBottom) / 2
        updated = validSelectedElements.map((e) => ({
          id: e.id,
          x: e.x,
          y: Math.max(0, Math.round((mid - e.h / 2) / GRID_SIZE) * GRID_SIZE),
        }))
      } else if (type === "distribute-h") {
        const sorted = [...validSelectedElements].sort((a, b) => a.x - b.x)
        const first = sorted[0]
        const last = sorted[sorted.length - 1]
        const totalSpan = last.x - first.x
        const step = totalSpan / (sorted.length - 1)
        updated = sorted.map((e, idx) => ({
          id: e.id,
          x: Math.max(0, Math.round((first.x + idx * step) / GRID_SIZE) * GRID_SIZE),
          y: e.y,
        }))
      } else if (type === "distribute-v") {
        const sorted = [...validSelectedElements].sort((a, b) => a.y - b.y)
        const first = sorted[0]
        const last = sorted[sorted.length - 1]
        const totalSpan = last.y - first.y
        const step = totalSpan / (sorted.length - 1)
        updated = sorted.map((e, idx) => ({
          id: e.id,
          x: e.x,
          y: Math.max(0, Math.round((first.y + idx * step) / GRID_SIZE) * GRID_SIZE),
        }))
      }

      const patches: ElementPatch[] = []
      for (const u of updated) {
        const orig = validSelectedElements.find((e) => e.id === u.id)
        if (orig && (orig.x !== u.x || orig.y !== u.y)) {
          liveUpdate(u.id, { x: u.x, y: u.y })
          patches.push({
            id: u.id,
            before: { x: orig.x, y: orig.y },
            after: { x: u.x, y: u.y },
          })
        }
      }

      if (patches.length > 0 && onCommitHistoryAction) {
        onCommitHistoryAction({
          type: "update-elements",
          patches,
          selectionBefore: selectedItemIds,
          selectionAfter: selectedItemIds,
          description: `Align ${patches.length} element(s)`,
        })
      }
    }

    return (
      <aside className="fixed right-4 top-1/2 -translate-y-1/2 z-40 w-72 rounded-2xl border border-white/10 bg-[#1e1f23]/95 backdrop-blur-md shadow-2xl p-4 space-y-3.5 transition-all animate-in fade-in-50 zoom-in-95 text-white">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#0d99ff]" />
            <h4 className="text-xs font-bold text-white">
              {validSelectedElements.length} Elements Selected
            </h4>
          </div>
          <button
            type="button"
            className="size-6 rounded-md text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            onClick={onClearSelection}
            title="Deselect All (Esc)"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Alignment & Distribution Toolbar (Figma standard) */}
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-white/70">Align & Distribute</div>
          <div className="flex items-center justify-between gap-1 bg-[#2b2d33] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleAlign("left")}
              className="size-7 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Align Left"
            >
              <AlignStartHorizontal className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAlign("center-h")}
              className="size-7 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Align Horizontal Center"
            >
              <AlignCenterHorizontal className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAlign("right")}
              className="size-7 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Align Right"
            >
              <AlignEndHorizontal className="size-3.5" />
            </button>
            <div className="w-px h-4 bg-white/20" />
            <button
              type="button"
              onClick={() => handleAlign("top")}
              className="size-7 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Align Top"
            >
              <AlignStartVertical className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAlign("center-v")}
              className="size-7 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Align Vertical Center"
            >
              <AlignCenterVertical className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAlign("bottom")}
              className="size-7 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Align Bottom"
            >
              <AlignEndVertical className="size-3.5" />
            </button>
            <div className="w-px h-4 bg-white/20" />
            <button
              type="button"
              onClick={() => handleAlign("distribute-h")}
              className="size-7 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Distribute Horizontally"
            >
              <AlignHorizontalSpaceBetween className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAlign("distribute-v")}
              className="size-7 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Distribute Vertically"
            >
              <AlignVerticalSpaceBetween className="size-3.5" />
            </button>
          </div>
        </div>

        <p className="text-[11px] text-white/60 leading-snug">
          Drag any of the selected elements on the canvas to move all{" "}
          <strong className="text-white">{validSelectedElements.length}</strong> units together!
        </p>

        {/* Action Buttons for Multiple Items */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => onDuplicate(selectedItemIds)}
            className="h-8 rounded-xl bg-[#2b2d33] hover:bg-[#383a42] active:scale-95 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/10"
            title="Duplicate selected (Ctrl+D)"
          >
            <Copy className="size-3" />
            <span>Duplicate All</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(selectedItemIds)}
            className="h-8 rounded-xl bg-red-600/90 hover:bg-red-600 active:scale-95 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Delete selected (Delete)"
          >
            <Trash2 className="size-3" />
            <span>Delete All</span>
          </button>
        </div>
      </aside>
    )
  }

  // 2. If SINGLE valid element is selected: Single Item Inspector (Figma-Style Component Values Box)
  if (validSelectedElements.length === 1) {
    const selectedElement = validSelectedElements[0]
    const toolCfg = TOOLS_CONFIG[selectedElement.type]
    const isSeatOrPc = selectedElement.type === "seat" || selectedElement.type === "pc"

    return (
      <aside className="fixed right-4 top-1/2 -translate-y-1/2 z-40 w-72 max-h-[92vh] overflow-y-auto scrollbar-none rounded-2xl border border-white/10 bg-[#1e1f23]/95 backdrop-blur-md shadow-2xl p-4 space-y-3.5 transition-all animate-in fade-in-50 zoom-in-95 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span
              className="size-3 rounded-full shrink-0"
              style={{
                backgroundColor: toolCfg.color,
              }}
            />
            <h4 className="text-xs font-bold tracking-wide uppercase text-white truncate">
              {toolCfg.name}
            </h4>
            {isSeatOrPc && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Lock className="size-2.5" /> Locked
              </span>
            )}
          </div>
          <button
            type="button"
            className="size-6 rounded-md text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            onClick={onClearSelection}
            title="Close Panel"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Seat / Element Label */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-white/70">
            Seat / Element Label
          </label>
          <input
            type="text"
            value={selectedElement.label}
            onFocus={() =>
              handleStartField(selectedElement.id, "label", selectedElement.label)
            }
            onChange={(e) =>
              handleLiveFieldChange(
                selectedElement.id,
                "label",
                e.target.value,
                { auto: false },
                "Change label"
              )
            }
            onBlur={() => handleCommitField("Change label")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCommitField("Change label")
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            className="w-full bg-[#2b2d33] hover:bg-[#32343b] focus:bg-[#32343b] focus:border-[#0d99ff] focus:ring-1 focus:ring-[#0d99ff] border border-transparent rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none transition-colors"
            placeholder="e.g. A-01, Quiet Gate, Reception"
          />
        </div>

        {/* Status Select (if bookable) */}
        {isBookable(selectedElement.type) && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-white/70">Status</label>
            <Select
              value={selectedElement.status || "free"}
              onValueChange={(val) => {
                const curStatus = selectedElement.status || "free"
                liveUpdate(selectedElement.id, { status: val as SeatStatus })
                if (onCommitElementPatch && curStatus !== val) {
                  onCommitElementPatch(
                    selectedElement.id,
                    { status: curStatus },
                    { status: val as SeatStatus },
                    `Set status to ${val}`
                  )
                }
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-[#2b2d33] border-transparent text-white focus:ring-[#0d99ff]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50 bg-[#1e1f23] text-white border-white/10">
                {Object.entries(STATUS_CONFIG).map(([key, item]) => (
                  <SelectItem key={key} value={key} className="text-xs text-white hover:bg-white/10">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Position */}
        <div className="space-y-1 pt-1">
          <div className="text-[11px] font-semibold text-white/70">Position</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center bg-[#2b2d33] hover:bg-[#32343b] focus-within:bg-[#32343b] focus-within:border-[#0d99ff] focus-within:ring-1 focus-within:ring-[#0d99ff] border border-transparent rounded-lg px-2.5 py-1.5 transition-colors">
              <span className="text-[11px] font-mono font-medium text-white/40 mr-2 select-none">X</span>
              <input
                type="number"
                value={selectedElement.x}
                onFocus={() => handleStartField(selectedElement.id, "x", selectedElement.x)}
                onChange={(e) =>
                  handleLiveFieldChange(
                    selectedElement.id,
                    "x",
                    Math.max(0, +e.target.value || 0),
                    undefined,
                    "Change X"
                  )
                }
                onBlur={() => handleCommitField("Change X")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCommitField("Change X")
                    ;(e.target as HTMLInputElement).blur()
                  }
                }}
                className="w-full bg-transparent font-mono text-xs font-semibold text-white focus:outline-none"
              />
            </div>
            <div className="flex items-center bg-[#2b2d33] hover:bg-[#32343b] focus-within:bg-[#32343b] focus-within:border-[#0d99ff] focus-within:ring-1 focus-within:ring-[#0d99ff] border border-transparent rounded-lg px-2.5 py-1.5 transition-colors">
              <span className="text-[11px] font-mono font-medium text-white/40 mr-2 select-none">Y</span>
              <input
                type="number"
                value={selectedElement.y}
                onFocus={() => handleStartField(selectedElement.id, "y", selectedElement.y)}
                onChange={(e) =>
                  handleLiveFieldChange(
                    selectedElement.id,
                    "y",
                    Math.max(0, +e.target.value || 0),
                    undefined,
                    "Change Y"
                  )
                }
                onBlur={() => handleCommitField("Change Y")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCommitField("Change Y")
                    ;(e.target as HTMLInputElement).blur()
                  }
                }}
                className="w-full bg-transparent font-mono text-xs font-semibold text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {isSeatOrPc ? (
          /* Standard Component Dimensions Badge for Seats & PCs (Locked Dimensions & Radius) */
          <div className="space-y-1.5 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-white/70">Dimensions & Radius</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-medium text-white/60">
                <Lock className="size-2.5 text-emerald-400" />
                Standard Component
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#2b2d33]/70 border border-white/5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-semibold text-white">88 × 116 px</span>
                <span className="text-[10px] text-white/40 font-mono">• 20px radius</span>
              </div>
              <span className="text-[10px] font-medium text-emerald-400/90">Fixed Size</span>
            </div>
            <p className="text-[10.5px] text-white/40 leading-snug">
              Seat cards use standardized dimensions to fit occupant avatars and live status pills. They cannot be resized or reshaped.
            </p>
          </div>
        ) : (
          <>
            {/* Rotation */}
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-white/70">Rotation</div>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 flex items-center bg-[#2b2d33] hover:bg-[#32343b] focus-within:bg-[#32343b] focus-within:border-[#0d99ff] focus-within:ring-1 focus-within:ring-[#0d99ff] border border-transparent rounded-lg px-2.5 py-1.5 transition-colors">
                  <span className="text-xs text-white/40 mr-1.5 select-none font-mono">∠</span>
                  <input
                    type="number"
                    value={selectedElement.rotation || 0}
                    onFocus={() =>
                      handleStartField(selectedElement.id, "rotation", selectedElement.rotation || 0)
                    }
                    onChange={(e) =>
                      handleLiveFieldChange(
                        selectedElement.id,
                        "rotation",
                        (+e.target.value || 0) % 360,
                        undefined,
                        "Change rotation"
                      )
                    }
                    onBlur={() => handleCommitField("Change rotation")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCommitField("Change rotation")
                        ;(e.target as HTMLInputElement).blur()
                      }
                    }}
                    className="w-full bg-transparent font-mono text-xs font-semibold text-white focus:outline-none"
                  />
                  <span className="text-xs text-white/40 select-none">°</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const curRot = selectedElement.rotation || 0
                    const nextRot = (curRot + 90) % 360
                    liveUpdate(selectedElement.id, { rotation: nextRot })
                    if (onCommitElementPatch) {
                      onCommitElementPatch(
                        selectedElement.id,
                        { rotation: curRot },
                        { rotation: nextRot },
                        "Rotate 90° Clockwise"
                      )
                    }
                  }}
                  className="size-8 rounded-lg bg-[#2b2d33] hover:bg-[#383a42] active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-transparent"
                  title="Rotate 90° Clockwise"
                >
                  <RotateCw className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const curRot = selectedElement.rotation || 0
                    const nextRot = (curRot + 180) % 360
                    liveUpdate(selectedElement.id, { rotation: nextRot })
                    if (onCommitElementPatch) {
                      onCommitElementPatch(
                        selectedElement.id,
                        { rotation: curRot },
                        { rotation: nextRot },
                        "Flip Horizontal"
                      )
                    }
                  }}
                  className="size-8 rounded-lg bg-[#2b2d33] hover:bg-[#383a42] active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-transparent"
                  title="Flip Horizontal"
                >
                  <FlipHorizontal className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const curRot = selectedElement.rotation || 0
                    const nextRot = (curRot + 180) % 360
                    liveUpdate(selectedElement.id, { rotation: nextRot })
                    if (onCommitElementPatch) {
                      onCommitElementPatch(
                        selectedElement.id,
                        { rotation: curRot },
                        { rotation: nextRot },
                        "Flip Vertical"
                      )
                    }
                  }}
                  className="size-8 rounded-lg bg-[#2b2d33] hover:bg-[#383a42] active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-transparent"
                  title="Flip Vertical"
                >
                  <FlipVertical className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Layout & Dimensions */}
            <div className="space-y-1 pt-1 border-t border-white/10">
              <div className="text-xs font-bold text-white tracking-tight">Layout</div>
              <div className="text-[11px] font-semibold text-white/70">Dimensions</div>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div className="flex items-center bg-[#2b2d33] hover:bg-[#32343b] focus-within:bg-[#32343b] focus-within:border-[#0d99ff] focus-within:ring-1 focus-within:ring-[#0d99ff] border border-transparent rounded-lg px-2.5 py-1.5 transition-colors">
                  <span className="text-[11px] font-mono font-medium text-white/40 mr-2 select-none">W</span>
                  <input
                    type="number"
                    step={GRID_SIZE}
                    value={selectedElement.w}
                    onFocus={() => handleStartField(selectedElement.id, "w", selectedElement.w)}
                    onChange={(e) =>
                      handleLiveFieldChange(
                        selectedElement.id,
                        "w",
                        Math.max(20, +e.target.value || 20),
                        undefined,
                        "Change width"
                      )
                    }
                    onBlur={() => handleCommitField("Change width")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCommitField("Change width")
                        ;(e.target as HTMLInputElement).blur()
                      }
                    }}
                    className="w-full bg-transparent font-mono text-xs font-semibold text-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center bg-[#2b2d33] hover:bg-[#32343b] focus-within:bg-[#32343b] focus-within:border-[#0d99ff] focus-within:ring-1 focus-within:ring-[#0d99ff] border border-transparent rounded-lg px-2.5 py-1.5 transition-colors">
                  <span className="text-[11px] font-mono font-medium text-white/40 mr-2 select-none">H</span>
                  <input
                    type="number"
                    step={GRID_SIZE}
                    value={selectedElement.h}
                    onFocus={() => handleStartField(selectedElement.id, "h", selectedElement.h)}
                    onChange={(e) =>
                      handleLiveFieldChange(
                        selectedElement.id,
                        "h",
                        Math.max(20, +e.target.value || 20),
                        undefined,
                        "Change height"
                      )
                    }
                    onBlur={() => handleCommitField("Change height")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCommitField("Change height")
                        ;(e.target as HTMLInputElement).blur()
                      }
                    }}
                    className="w-full bg-transparent font-mono text-xs font-semibold text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Opacity & Corner Radius */}
            <div className="space-y-1.5 pt-1 border-t border-white/10">
              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-white/70">
                <span>Opacity</span>
                <span>Corner radius</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Opacity Input */}
                <div className="flex-1 flex items-center bg-[#2b2d33] hover:bg-[#32343b] focus-within:bg-[#32343b] focus-within:border-[#0d99ff] focus-within:ring-1 focus-within:ring-[#0d99ff] border border-transparent rounded-lg px-2 py-1.5 transition-colors">
                  <div className="size-3.5 border border-white/30 rounded-xs mr-1.5 grid grid-cols-2 grid-rows-2 shrink-0 overflow-hidden">
                    <div className="bg-white/60" />
                    <div className="bg-transparent" />
                    <div className="bg-transparent" />
                    <div className="bg-white/60" />
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={selectedElement.opacity !== undefined ? selectedElement.opacity : 100}
                    onFocus={() =>
                      handleStartField(
                        selectedElement.id,
                        "opacity",
                        selectedElement.opacity !== undefined ? selectedElement.opacity : 100
                      )
                    }
                    onChange={(e) =>
                      handleLiveFieldChange(
                        selectedElement.id,
                        "opacity",
                        Math.min(100, Math.max(0, +e.target.value || 0)),
                        undefined,
                        "Change opacity"
                      )
                    }
                    onBlur={() => handleCommitField("Change opacity")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCommitField("Change opacity")
                        ;(e.target as HTMLInputElement).blur()
                      }
                    }}
                    className="w-full bg-transparent font-mono text-xs font-semibold text-white focus:outline-none"
                  />
                  <span className="text-[11px] text-white/40 font-mono select-none">%</span>
                </div>

                {/* Corner Radius Input */}
                <div className="flex-1 flex items-center bg-[#2b2d33] hover:bg-[#32343b] focus-within:bg-[#32343b] focus-within:border-[#0d99ff] focus-within:ring-1 focus-within:ring-[#0d99ff] border border-transparent rounded-lg px-2 py-1.5 transition-colors">
                  <div className="size-3 border-t-2 border-l-2 border-white/60 rounded-tl-xs mr-1.5 shrink-0" />
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={
                      selectedElement.cornerRadius !== undefined
                        ? selectedElement.cornerRadius
                        : selectedElement.type === "seat" || selectedElement.type === "pc"
                          ? 20
                          : 8
                    }
                    onFocus={() =>
                      handleStartField(
                        selectedElement.id,
                        "cornerRadius",
                        selectedElement.cornerRadius !== undefined
                          ? selectedElement.cornerRadius
                          : selectedElement.type === "seat" || selectedElement.type === "pc"
                            ? 20
                            : 8
                      )
                    }
                    onChange={(e) => {
                      const val = Math.max(0, +e.target.value || 0)
                      handleLiveFieldChange(
                        selectedElement.id,
                        "cornerRadius",
                        val,
                        {
                          radiusTL: val,
                          radiusTR: val,
                          radiusBL: val,
                          radiusBR: val,
                        },
                        "Change corner radius"
                      )
                    }}
                    onBlur={() => handleCommitField("Change corner radius")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCommitField("Change corner radius")
                        ;(e.target as HTMLInputElement).blur()
                      }
                    }}
                    className="w-full bg-transparent font-mono text-xs font-semibold text-white focus:outline-none"
                  />
                </div>

                {/* Individual corners toggle button */}
                <button
                  type="button"
                  onClick={() => setIndependentCorners(!independentCorners)}
                  className={`size-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    independentCorners
                      ? "bg-[#25395a] text-[#0d99ff] border border-[#0d99ff]/60 shadow-sm"
                      : "bg-[#2b2d33] hover:bg-[#383a42] text-white/70 hover:text-white border border-transparent"
                  }`}
                  title="Individual Corner Radii"
                >
                  <Scan className="size-3.5" />
                </button>
              </div>

              {/* Expanded Individual Corners */}
              {independentCorners && (
                <div className="space-y-1.5 pt-1 animate-in fade-in duration-100">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Top-Left */}
                    <div className="flex items-center bg-[#2b2d33] hover:bg-[#32343b] focus-within:bg-[#32343b] focus-within:border-[#0d99ff] focus-within:ring-1 focus-within:ring-[#0d99ff] border border-transparent rounded-lg px-2 py-1.5">
                      <span className="text-[11px] font-mono text-white/50 mr-1.5 select-none">⌜</span>
                      <input
                        type="number"
                        min={0}
                        value={
                          selectedElement.radiusTL !== undefined
                            ? selectedElement.radiusTL
                            : selectedElement.cornerRadius ?? 20
                        }
                        onFocus={() =>
                          handleStartField(
                            selectedElement.id,
                            "radiusTL",
                            selectedElement.radiusTL !== undefined
                              ? selectedElement.radiusTL
                              : selectedElement.cornerRadius ?? 20
                          )
                        }
                        onChange={(e) =>
                          handleLiveFieldChange(
                            selectedElement.id,
                            "radiusTL",
                            Math.max(0, +e.target.value || 0),
                            undefined,
                            "Change Top-Left Radius"
                          )
                        }
                        onBlur={() => handleCommitField("Change Top-Left Radius")}
                        className="w-full bg-transparent font-mono text-xs font-semibold text-white focus:outline-none"
                      />
                    </div>
                    {/* Top-Right */}
                    <div className="flex items-center bg-[#2b2d33] hover:bg-[#32343b] focus-within:bg-[#32343b] focus-within:border-[#0d99ff] focus-within:ring-1 focus-within:ring-[#0d99ff] border border-transparent rounded-lg px-2 py-1.5">
                      <span className="text-[11px] font-mono text-white/50 mr-1.5 select-none">⌝</span>
                      <input
                        type="number"
                        min={0}
                        value={
                          selectedElement.radiusTR !== undefined
                            ? selectedElement.radiusTR
                            : selectedElement.cornerRadius ?? 20
                        }
                        onFocus={() =>
                          handleStartField(
                            selectedElement.id,
                            "radiusTR",
                            selectedElement.radiusTR !== undefined
                              ? selectedElement.radiusTR
                              : selectedElement.cornerRadius ?? 20
                          )
                        }
                        onChange={(e) =>
                          handleLiveFieldChange(
                            selectedElement.id,
                            "radiusTR",
                            Math.max(0, +e.target.value || 0),
                            undefined,
                            "Change Top-Right Radius"
                          )
                        }
                        onBlur={() => handleCommitField("Change Top-Right Radius")}
                        className="w-full bg-transparent font-mono text-xs font-semibold text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Bottom-Left */}
                    <div className="flex-1 flex items-center bg-[#2b2d33] hover:bg-[#32343b] focus-within:bg-[#32343b] focus-within:border-[#0d99ff] focus-within:ring-1 focus-within:ring-[#0d99ff] border border-transparent rounded-lg px-2 py-1.5">
                      <span className="text-[11px] font-mono text-white/50 mr-1.5 select-none">⌞</span>
                      <input
                        type="number"
                        min={0}
                        value={
                          selectedElement.radiusBL !== undefined
                            ? selectedElement.radiusBL
                            : selectedElement.cornerRadius ?? 20
                        }
                        onFocus={() =>
                          handleStartField(
                            selectedElement.id,
                            "radiusBL",
                            selectedElement.radiusBL !== undefined
                              ? selectedElement.radiusBL
                              : selectedElement.cornerRadius ?? 20
                          )
                        }
                        onChange={(e) =>
                          handleLiveFieldChange(
                            selectedElement.id,
                            "radiusBL",
                            Math.max(0, +e.target.value || 0),
                            undefined,
                            "Change Bottom-Left Radius"
                          )
                        }
                        onBlur={() => handleCommitField("Change Bottom-Left Radius")}
                        className="w-full bg-transparent font-mono text-xs font-semibold text-white focus:outline-none"
                      />
                    </div>
                    {/* Bottom-Right */}
                    <div className="flex-1 flex items-center bg-[#2b2d33] hover:bg-[#32343b] focus-within:bg-[#32343b] focus-within:border-[#0d99ff] focus-within:ring-1 focus-within:ring-[#0d99ff] border border-transparent rounded-lg px-2 py-1.5">
                      <span className="text-[11px] font-mono text-white/50 mr-1.5 select-none">⌟</span>
                      <input
                        type="number"
                        min={0}
                        value={
                          selectedElement.radiusBR !== undefined
                            ? selectedElement.radiusBR
                            : selectedElement.cornerRadius ?? 20
                        }
                        onFocus={() =>
                          handleStartField(
                            selectedElement.id,
                            "radiusBR",
                            selectedElement.radiusBR !== undefined
                              ? selectedElement.radiusBR
                              : selectedElement.cornerRadius ?? 20
                          )
                        }
                        onChange={(e) =>
                          handleLiveFieldChange(
                            selectedElement.id,
                            "radiusBR",
                            Math.max(0, +e.target.value || 0),
                            undefined,
                            "Change Bottom-Right Radius"
                          )
                        }
                        onBlur={() => handleCommitField("Change Bottom-Right Radius")}
                        className="w-full bg-transparent font-mono text-xs font-semibold text-white focus:outline-none"
                      />
                    </div>
                    {/* Sliders settings icon */}
                    <div className="size-8 rounded-lg bg-[#2b2d33] text-white/50 flex items-center justify-center shrink-0">
                      <Sliders className="size-3.5" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Duplicate & Delete Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => onDuplicate([selectedElement.id])}
            className="h-8 rounded-xl bg-[#2b2d33] hover:bg-[#383a42] active:scale-95 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/10"
            title="Duplicate element (Ctrl+D)"
          >
            <Copy className="size-3" />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete([selectedElement.id])}
            className="h-8 rounded-xl bg-red-600/90 hover:bg-red-600 active:scale-95 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Delete element (Del)"
          >
            <Trash2 className="size-3" />
            <span>Delete</span>
          </button>
        </div>

        {/* Re-enable auto numbering if manual label was given */}
        {selectedElement.auto === false && isBookable(selectedElement.type) && (
          <button
            type="button"
            onClick={() => {
              liveUpdate(selectedElement.id, { auto: true })
              if (onCommitElementPatch) {
                onCommitElementPatch(
                  selectedElement.id,
                  { auto: false },
                  { auto: true },
                  "Re-enable auto numbering"
                )
              }
            }}
            className="w-full h-7 rounded-xl bg-[#2b2d33]/80 hover:bg-[#2b2d33] text-[11px] font-semibold text-[#0d99ff] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="size-3" />
            <span>Re-enable Auto Numbering</span>
          </button>
        )}
      </aside>
    )
  }

  // 3. When NO element is selected:
  return (
    <>
      {/* Prominent Layers Toggle Button at Top-Right */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setLayersOpen(!layersOpen)}
        className={`fixed top-3.5 right-4 z-40 h-8 px-3 rounded-xl border border-border/80 bg-card/95 backdrop-blur-md shadow-md text-xs font-semibold text-foreground hover:bg-muted/70 gap-2 transition-all flex items-center ${
          layersOpen ? "border-primary text-primary" : ""
        }`}
        title="Toggle Elements Layers List"
      >
        <Layers className="size-3.5 text-primary" />
        <span>Layers ({elements.length})</span>
      </Button>

      {/* Hall Canvas Box Settings Card (Shown ONLY when user clicks customize icon or text) */}
      {mode === "edit" && onCanvasSizeChange && hallSettingsOpen && (
        <aside className="fixed right-4 bottom-16 z-40 w-64 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl p-3.5 space-y-3 transition-all animate-in fade-in-50 zoom-in-95">
          <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
            <div className="flex items-center gap-1.5">
              <Maximize2 className="size-3.5 text-primary" />
              <h4 className="text-xs font-bold text-foreground">Hall Canvas Box</h4>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-muted-foreground mr-1">
                {canvasWidth} × {canvasHeight} px
              </span>
              {onCloseHallSettings && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 rounded-md text-muted-foreground hover:text-foreground"
                  onClick={onCloseHallSettings}
                  title="Close"
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Width</label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 rounded-lg"
                  onClick={() =>
                    onCanvasSizeChange(Math.max(600, canvasWidth - 40), canvasHeight, true)
                  }
                >
                  <Minus className="size-3" />
                </Button>
                <Input
                  type="number"
                  value={canvasWidth}
                  onChange={(e) =>
                    onCanvasSizeChange(
                      Math.max(400, Number(e.target.value) || 960),
                      canvasHeight,
                      false
                    )
                  }
                  onBlur={() => onCanvasSizeChange(canvasWidth, canvasHeight, true)}
                  className="h-7 text-xs text-center font-mono p-1 rounded-lg"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 rounded-lg"
                  onClick={() => onCanvasSizeChange(canvasWidth + 40, canvasHeight, true)}
                >
                  <Plus className="size-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Height</label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 rounded-lg"
                  onClick={() =>
                    onCanvasSizeChange(canvasWidth, Math.max(400, canvasHeight - 40), true)
                  }
                >
                  <Minus className="size-3" />
                </Button>
                <Input
                  type="number"
                  value={canvasHeight}
                  onChange={(e) =>
                    onCanvasSizeChange(
                      canvasWidth,
                      Math.max(300, Number(e.target.value) || 600),
                      false
                    )
                  }
                  onBlur={() => onCanvasSizeChange(canvasWidth, canvasHeight, true)}
                  className="h-7 text-xs text-center font-mono p-1 rounded-lg"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 rounded-lg"
                  onClick={() => onCanvasSizeChange(canvasWidth, canvasHeight + 40, true)}
                >
                  <Plus className="size-3" />
                </Button>
              </div>
            </div>
          </div>

          {onAutoFitCanvas && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onAutoFitCanvas}
              className="w-full h-7 text-xs font-semibold gap-1.5 rounded-xl text-primary"
              title="Automatically adjust preview box size to envelop all elements"
            >
              <Sparkles className="size-3 text-primary" />
              <span>Auto-Fit Box to Elements</span>
            </Button>
          )}

          {/* Quick presets */}
          <div className="pt-1.5 border-t border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Size Presets</span>
            <div className="grid grid-cols-2 gap-1 mt-1">
              {HALL_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => onCanvasSizeChange(p.w, p.h, true)}
                  className={`text-[10px] py-1 px-1.5 rounded-lg border text-left truncate transition-colors ${
                    canvasWidth === p.w && canvasHeight === p.h
                      ? "bg-primary/10 border-primary text-primary font-bold"
                      : "border-border/60 hover:bg-muted/70 text-muted-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground/75 text-center pt-1 border-t border-border/40">
            Tip: Drag the bottom-right corner handle of the hall boundary on the canvas to resize freely.
          </div>
        </aside>
      )}

      {/* Expanded Layers Drawer */}
      {layersOpen && (
        <aside className="fixed right-4 top-14 z-40 w-64 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl p-3.5 max-h-[calc(100vh-120px)] flex flex-col transition-all animate-in fade-in-50 zoom-in-95">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
            <div className="flex items-center gap-1.5">
              <Layers className="size-3.5 text-primary" />
              <h4 className="text-xs font-semibold tracking-wide uppercase text-foreground">
                Layers ({elements.length})
              </h4>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => setLayersOpen(false)}
              title="Close Layers Panel"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          <div
            className="flex-1 overflow-y-auto space-y-1 pr-1 no-scrollbar"
            style={{ maxHeight: 360 }}
          >
            {elements.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No elements on canvas.
              </div>
            ) : (
              elements
                .slice()
                .reverse()
                .map((el) => {
                  const cfg = TOOLS_CONFIG[el.type]
                  return (
                    <button
                      key={el.id}
                      onClick={() => {
                        onSelectElement(el.id)
                        setLayersOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-left hover:bg-muted/70 transition-colors group"
                    >
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <span className="truncate font-medium text-foreground">
                        {el.label || cfg.name}
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground opacity-60 group-hover:opacity-100">
                        {cfg.name}
                      </span>
                    </button>
                  )
                })
            )}
          </div>
        </aside>
      )}
    </>
  )
}
