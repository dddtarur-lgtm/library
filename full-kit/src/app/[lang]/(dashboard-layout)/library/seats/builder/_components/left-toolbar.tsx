"use client"

import React from "react"
import { Hand, MousePointer } from "lucide-react"

import {
  TOOLS_CONFIG,
  type ActiveTool,
  type ElementType,
} from "../seating-editor-types"

interface LeftToolbarProps {
  activeTool: ActiveTool
  onSelectTool: (tool: ActiveTool) => void
}

const SHORT_LABELS: Record<ElementType, string> = {
  seat: "Seat",
  cabin: "Cabin",
  pc: "PC",
  door: "Door",
  reception: "Desk",
  pillar: "Wall",
  shelf: "Shelf",
  water: "RO",
  ac: "AC",
  zone: "Zone",
  label: "Text",
}

export function LeftToolbar({ activeTool, onSelectTool }: LeftToolbarProps) {
  const elementsList = Object.keys(TOOLS_CONFIG) as ElementType[]

  return (
    <aside
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-row items-center gap-1 p-1.5 px-3 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl max-w-[calc(100vw-32px)] overflow-x-auto no-scrollbar"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Pointer / Select tool */}
      <button
        type="button"
        onClick={() => onSelectTool("select")}
        className={`w-10 h-10 flex flex-col items-center justify-center rounded-xl transition-all shrink-0 ${
          activeTool === "select"
            ? "bg-primary text-primary-foreground shadow-sm font-semibold scale-105"
            : "text-foreground/80 hover:bg-muted/70 hover:text-foreground"
        }`}
        title="Select & Move (V)"
      >
        <MousePointer className="size-4" />
        <span
          className={`text-[8px] font-medium leading-none mt-0.5 ${
            activeTool === "select"
              ? "text-primary-foreground"
              : "text-muted-foreground"
          }`}
        >
          Select
        </span>
      </button>

      {/* Hand / Pan tool */}
      <button
        type="button"
        onClick={() => onSelectTool("hand")}
        className={`w-10 h-10 flex flex-col items-center justify-center rounded-xl transition-all shrink-0 ${
          activeTool === "hand"
            ? "bg-primary text-primary-foreground shadow-sm font-semibold scale-105"
            : "text-foreground/80 hover:bg-muted/70 hover:text-foreground"
        }`}
        title="Pan Canvas (H or hold Space)"
      >
        <Hand className="size-4" />
        <span
          className={`text-[8px] font-medium leading-none mt-0.5 ${
            activeTool === "hand"
              ? "text-primary-foreground"
              : "text-muted-foreground"
          }`}
        >
          Pan
        </span>
      </button>

      <div className="w-px h-6 bg-border/80 mx-1 shrink-0" />

      {/* Element Creation Tools */}
      {elementsList.map((type) => {
        const item = TOOLS_CONFIG[type]
        const Icon = item.icon
        const isActive = activeTool === type
        const shortLabel = SHORT_LABELS[type] || item.name

        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelectTool(type)}
            className={`w-10 h-10 flex flex-col items-center justify-center rounded-xl transition-all shrink-0 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm font-semibold scale-105"
                : "text-foreground/80 hover:bg-muted/70 hover:text-foreground"
            }`}
            title={`${item.name} (${item.key})`}
          >
            <Icon
              className="size-4"
              style={{
                color: isActive ? "currentColor" : item.color,
              }}
            />
            <span
              className={`text-[8px] font-medium leading-none mt-0.5 truncate max-w-[36px] ${
                isActive ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {shortLabel}
            </span>
          </button>
        )
      })}
    </aside>
  )
}
