"use client"

import React from "react"
import {
  Armchair,
  BookOpen,
  Building2,
  DoorOpen,
  Droplets,
  Eraser,
  Hash,
  LayoutGrid,
  Monitor,
  MousePointer,
  RotateCcw,
  Shield,
  Sparkles,
  Square,
  Trash2,
  Wind,
} from "lucide-react"

import type { CellType } from "@/data/seating-templates"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export type ActiveTool = "select" | "erase" | CellType

interface BuilderToolbarProps {
  activeTool: ActiveTool
  onSelectTool: (tool: ActiveTool) => void
  onOpenTemplates: () => void
  onAutoRenumber: () => void
  onClearCanvas: () => void
  totalSeats: number
}

export function BuilderToolbar({
  activeTool,
  onSelectTool,
  onOpenTemplates,
  onAutoRenumber,
  onClearCanvas,
  totalSeats,
}: BuilderToolbarProps) {
  const tools: { id: ActiveTool; label: string; icon: any; color: string; desc: string }[] = [
    {
      id: "select",
      label: "Select / Move",
      icon: MousePointer,
      color: "text-foreground",
      desc: "Drag items to move, or click to edit",
    },
    {
      id: "seat",
      label: "Study Desk",
      icon: Armchair,
      color: "text-primary",
      desc: "Standard single reading seat",
    },
    {
      id: "cabin",
      label: "Silent Cabin",
      icon: Shield,
      color: "text-purple-600 dark:text-purple-400",
      desc: "Soundproof private cubicle",
    },
    {
      id: "computer",
      label: "PC Terminal",
      icon: Monitor,
      color: "text-blue-600 dark:text-blue-400",
      desc: "Desktop workstation seat",
    },
    {
      id: "door",
      label: "Entry Door",
      icon: DoorOpen,
      color: "text-amber-600 dark:text-amber-400",
      desc: "Main hall entrance / exit",
    },
    {
      id: "reception",
      label: "Reception",
      icon: Building2,
      color: "text-emerald-600 dark:text-emerald-400",
      desc: "Admin counter / Help desk",
    },
    {
      id: "rack",
      label: "Book Shelf",
      icon: BookOpen,
      color: "text-orange-600 dark:text-orange-400",
      desc: "Book stack / Newspaper stand",
    },
    {
      id: "water",
      label: "RO Water",
      icon: Droplets,
      color: "text-cyan-600 dark:text-cyan-400",
      desc: "Water dispenser station",
    },
    {
      id: "ac",
      label: "Air Cond.",
      icon: Wind,
      color: "text-teal-600 dark:text-teal-400",
      desc: "Split AC unit position",
    },
    {
      id: "pillar",
      label: "Pillar / Wall",
      icon: Square,
      color: "text-muted-foreground",
      desc: "Building column or divider",
    },
    {
      id: "erase",
      label: "Eraser",
      icon: Eraser,
      color: "text-destructive",
      desc: "Remove element to walkway",
    },
  ]

  const handleDragStartTool = (
    e: React.DragEvent,
    toolId: ActiveTool
  ) => {
    if (toolId !== "select" && toolId !== "erase") {
      e.dataTransfer.setData("text/plain", toolId)
      e.dataTransfer.effectAllowed = "copy"
    }
  }

  return (
    <div className="rounded-lg border border-border p-3 bg-card shadow-xs space-y-2.5">
      {/* Top Header Row of Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground">
            Element Palette:
          </span>
          <Badge
            variant="outline"
            className="text-[10px] rounded-md font-mono bg-primary/10 text-primary border-primary/20"
          >
            {totalSeats} Desks Configured
          </Badge>
          <span className="text-[11px] text-muted-foreground hidden md:inline">
            (Drag any item directly into the floor or click to select tool)
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenTemplates}
            className="h-7 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10 rounded-md font-semibold"
          >
            <Sparkles className="size-3.5" />
            <span>20 Library Templates</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onAutoRenumber}
            className="h-7 text-xs gap-1.5 border-border rounded-md hover:bg-muted font-medium"
            title="Auto-label all desks row by row (A-01, A-02, B-01...)"
          >
            <Hash className="size-3 text-muted-foreground" />
            <span>Auto Renumber</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onClearCanvas}
            className="h-7 text-xs text-destructive hover:bg-destructive/10 rounded-md"
          >
            <Trash2 className="size-3 mr-1" />
            <span>Clear Grid</span>
          </Button>
        </div>
      </div>

      {/* Tool Selector Buttons Palette (Draggable + Clickable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {tools.map((tool) => {
          const Icon = tool.icon
          const isActive = activeTool === tool.id
          const canDrag = tool.id !== "select" && tool.id !== "erase"

          return (
            <button
              key={tool.id}
              type="button"
              draggable={canDrag}
              onDragStart={(e) => canDrag && handleDragStartTool(e, tool.id)}
              onClick={() => onSelectTool(tool.id)}
              title={tool.desc}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all border select-none cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold scale-102"
                  : "bg-muted/40 text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              <Icon
                className={`size-3.5 ${
                  isActive ? "text-primary-foreground" : tool.color
                }`}
              />
              <span>{tool.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
