"use client"

import React from "react"
import {
  Hash,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface TopBarProps {
  layoutName: string
  totalSeats: number
  rows: number
  cols: number
  zoom: number
  savedSuccess: boolean
  onAutoRenumber: () => void
  onClearCanvas: () => void
  onOpenTemplates: () => void
  onSave: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onAddRow: () => void
  onRemoveRow: () => void
  onAddCol: () => void
  onRemoveCol: () => void
}

export function TopBar({
  layoutName,
  totalSeats,
  rows,
  cols,
  zoom,
  savedSuccess,
  onAutoRenumber,
  onClearCanvas,
  onOpenTemplates,
  onSave,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onAddRow,
  onRemoveRow,
  onAddCol,
  onRemoveCol,
}: TopBarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border shrink-0 overflow-x-auto">
      {/* Layout Name */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="size-5 rounded-md bg-primary/10 flex items-center justify-center">
          <div className="size-2.5 rounded-sm bg-primary" />
        </div>
        <span className="text-xs font-bold text-foreground max-w-[140px] truncate">
          {layoutName}
        </span>
        <Badge
          variant="outline"
          className="h-5 text-[10px] font-mono rounded-md bg-muted/60 text-muted-foreground shrink-0"
        >
          {rows}R × {cols}C
        </Badge>
        <Badge
          variant="outline"
          className="h-5 text-[10px] font-semibold rounded-md bg-primary/10 text-primary border-primary/20 shrink-0"
        >
          {totalSeats} seats
        </Badge>
      </div>

      <Separator orientation="vertical" className="h-5 mx-1 shrink-0" />

      {/* Grid Size Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
          Rows:
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemoveRow}
          className="size-6 rounded-md text-muted-foreground hover:text-foreground"
          disabled={rows <= 4}
        >
          <Minus className="size-3" />
        </Button>
        <span className="text-xs font-mono w-5 text-center text-foreground font-bold">
          {rows}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onAddRow}
          className="size-6 rounded-md text-muted-foreground hover:text-foreground"
          disabled={rows >= 20}
        >
          <Plus className="size-3" />
        </Button>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
          Cols:
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemoveCol}
          className="size-6 rounded-md text-muted-foreground hover:text-foreground"
          disabled={cols <= 4}
        >
          <Minus className="size-3" />
        </Button>
        <span className="text-xs font-mono w-5 text-center text-foreground font-bold">
          {cols}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onAddCol}
          className="size-6 rounded-md text-muted-foreground hover:text-foreground"
          disabled={cols >= 20}
        >
          <Plus className="size-3" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-5 mx-1 shrink-0" />

      {/* Action Buttons */}
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenTemplates}
        className="h-7 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10 rounded-md font-semibold shrink-0"
      >
        <Sparkles className="size-3.5" />
        <span className="hidden sm:inline">20 Templates</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onAutoRenumber}
        className="h-7 text-xs gap-1.5 rounded-md shrink-0"
        title="Auto-number all desks A-01, A-02, B-01..."
      >
        <Hash className="size-3.5 text-muted-foreground" />
        <span className="hidden sm:inline">Renumber</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearCanvas}
        className="h-7 text-xs text-destructive hover:bg-destructive/10 rounded-md shrink-0"
      >
        <Trash2 className="size-3.5 mr-1" />
        <span className="hidden sm:inline">Clear</span>
      </Button>

      {/* Spacer */}
      <div className="flex-1 min-w-4" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 shrink-0 border border-border rounded-md overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          className="size-7 rounded-none border-r border-border"
          title="Zoom Out"
        >
          <ZoomOut className="size-3.5" />
        </Button>
        <button
          onClick={onResetZoom}
          className="h-7 px-2 text-[11px] font-mono text-foreground hover:bg-muted transition-colors min-w-[46px] text-center"
          title="Reset Zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          className="size-7 rounded-none border-l border-border"
          title="Zoom In"
        >
          <ZoomIn className="size-3.5" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-5 mx-1 shrink-0" />

      {/* Save Button */}
      <Button
        size="sm"
        onClick={onSave}
        className={`h-7 text-xs font-bold rounded-md px-3 gap-1.5 shrink-0 transition-all ${
          savedSuccess
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        <Save className="size-3.5" />
        <span>{savedSuccess ? "Saved!" : "Save & Apply"}</span>
      </Button>
    </div>
  )
}
