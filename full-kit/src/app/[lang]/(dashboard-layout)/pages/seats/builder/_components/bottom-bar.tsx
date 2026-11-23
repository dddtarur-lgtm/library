"use client"

import React from "react"
import { Maximize2, Minus, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

interface BottomBarProps {
  zoom: number
  mode: "edit" | "preview"
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
}

export function BottomBar({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: BottomBarProps) {
  return (
    <div className="fixed bottom-4 left-4 z-30 flex items-center gap-1.5 p-1 px-2.5 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl transition-all">
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        className="size-7 rounded-xl text-muted-foreground hover:text-foreground"
        title="Zoom Out"
      >
        <Minus className="size-3.5" />
      </Button>

      <span className="w-12 text-center font-mono font-semibold text-xs text-foreground select-none">
        {Math.round(zoom * 100)}%
      </span>

      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        className="size-7 rounded-xl text-muted-foreground hover:text-foreground"
        title="Zoom In"
      >
        <Plus className="size-3.5" />
      </Button>

      <div className="h-4 w-px bg-border/80 mx-1" />

      <Button
        variant="ghost"
        size="sm"
        onClick={onZoomReset}
        className="h-7 px-2.5 rounded-xl text-xs text-muted-foreground hover:text-foreground gap-1.5 font-medium"
        title="Fit to Center"
      >
        <Maximize2 className="size-3" />
        <span>Fit</span>
      </Button>
    </div>
  )
}
