"use client"

import React from "react"
import {
  Armchair,
  BookOpen,
  Building2,
  DoorOpen,
  Droplets,
  Eraser,
  GripHorizontal,
  Hash,
  LayoutTemplate,
  Monitor,
  MousePointer,
  Shield,
  Square,
  Trash2,
  Wind,
} from "lucide-react"

import type { CellType } from "@/data/seating-templates"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export type ActiveTool = "select" | "erase" | CellType

interface ElementItem {
  id: ActiveTool
  label: string
  desc: string
  icon: any
  color: string
  bg: string
  group: string
}

const ELEMENTS: ElementItem[] = [
  // Seating
  {
    id: "seat",
    label: "Study Desk",
    desc: "Standard reading seat",
    icon: Armchair,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/30",
    group: "Seating",
  },
  {
    id: "cabin",
    label: "Silent Cabin",
    desc: "Private soundproof booth",
    icon: Shield,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10 border-purple-400/30",
    group: "Seating",
  },
  {
    id: "computer",
    label: "PC Terminal",
    desc: "Desktop workstation",
    icon: Monitor,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 border-blue-400/30",
    group: "Seating",
  },
  // Structure
  {
    id: "door",
    label: "Entry Door",
    desc: "Hall entrance or exit",
    icon: DoorOpen,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-400/30",
    group: "Structure",
  },
  {
    id: "reception",
    label: "Reception Desk",
    desc: "Admin / help counter",
    icon: Building2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-400/30",
    group: "Structure",
  },
  {
    id: "pillar",
    label: "Pillar / Wall",
    desc: "Building column or wall",
    icon: Square,
    color: "text-muted-foreground",
    bg: "bg-muted border-border",
    group: "Structure",
  },
  // Amenities
  {
    id: "rack",
    label: "Book Shelf",
    desc: "Book stack / newspaper",
    icon: BookOpen,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10 border-orange-400/30",
    group: "Amenities",
  },
  {
    id: "water",
    label: "RO Water Point",
    desc: "Water dispenser",
    icon: Droplets,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-400/30",
    group: "Amenities",
  },
  {
    id: "ac",
    label: "Air Conditioner",
    desc: "Split AC unit position",
    icon: Wind,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10 border-teal-400/30",
    group: "Amenities",
  },
]

const GROUPS = ["Seating", "Structure", "Amenities"]

interface LeftPanelProps {
  activeTool: ActiveTool
  onSelectTool: (tool: ActiveTool) => void
  onOpenTemplates: () => void
  totalSeats: number
}

export function LeftPanel({
  activeTool,
  onSelectTool,
  onOpenTemplates,
  totalSeats,
}: LeftPanelProps) {
  const handleDragStart = (e: React.DragEvent, toolId: string) => {
    e.dataTransfer.setData("text/plain", toolId)
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
    <div className="flex flex-col h-full w-full bg-card border-r border-border">
      {/* Panel Header */}
      <div className="px-3 py-3 border-b border-border bg-muted/30 shrink-0">
        <div className="text-xs font-bold text-foreground mb-1">Elements</div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="text-[10px] font-mono rounded-md bg-primary/10 text-primary border-primary/20 h-5"
          >
            {totalSeats} desks
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            Drag onto canvas
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          {/* Tool Mode Selectors */}
          <div className="space-y-1">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
              Tools
            </div>
            <button
              onClick={() => onSelectTool("select")}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-all border ${
                activeTool === "select"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              }`}
            >
              <MousePointer className="size-3.5 shrink-0" />
              <span>Select & Move</span>
            </button>
            <button
              onClick={() => onSelectTool("erase")}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-all border ${
                activeTool === "erase"
                  ? "bg-destructive text-destructive-foreground border-destructive"
                  : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              }`}
            >
              <Eraser className="size-3.5 shrink-0 text-destructive group-hover:text-current" />
              <span>Eraser</span>
            </button>
          </div>

          <Separator />

          {/* Element Groups */}
          {GROUPS.map((group) => {
            const groupItems = ELEMENTS.filter((e) => e.group === group)
            return (
              <div key={group} className="space-y-1">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
                  {group}
                </div>
                {groupItems.map((el) => {
                  const Icon = el.icon
                  const isActive = activeTool === el.id
                  return (
                    <div
                      key={el.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, el.id)}
                      onClick={() => onSelectTool(el.id as ActiveTool)}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer border text-xs font-medium select-none transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : `${el.bg} hover:opacity-90 hover:shadow-sm`
                      }`}
                      title={`${el.desc} (drag onto canvas)`}
                    >
                      <div
                        className={`size-7 rounded-md flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-primary-foreground/20"
                            : "bg-background/70"
                        }`}
                      >
                        <Icon
                          className={`size-3.5 ${isActive ? "text-primary-foreground" : el.color}`}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span
                          className={`font-semibold truncate ${isActive ? "text-primary-foreground" : "text-foreground"}`}
                        >
                          {el.label}
                        </span>
                        <span
                          className={`text-[10px] truncate ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                        >
                          {el.desc}
                        </span>
                      </div>
                      <GripHorizontal
                        className={`size-3 ml-auto shrink-0 ${isActive ? "text-primary-foreground/50" : "text-muted-foreground/40"}`}
                      />
                    </div>
                  )
                })}
              </div>
            )
          })}

          <Separator />

          {/* Templates CTA */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Floor Templates
            </div>
            <button
              onClick={onOpenTemplates}
              className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-md cursor-pointer border text-xs font-semibold transition-all bg-primary/5 hover:bg-primary/10 border-primary/25 text-primary"
            >
              <LayoutTemplate className="size-3.5 shrink-0" />
              <span>Browse 20 Library Maps</span>
            </button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
