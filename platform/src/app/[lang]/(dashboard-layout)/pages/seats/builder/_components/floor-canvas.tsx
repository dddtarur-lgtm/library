"use client"

import React, { useCallback, useRef, useState, useEffect } from "react"
import {
  Armchair,
  BookOpen,
  Building2,
  DoorOpen,
  Droplets,
  Edit2,
  Monitor,
  Move,
  Shield,
  Square,
  Trash2,
  Wind,
  X,
  ZoomIn,
} from "lucide-react"

import type { CellType, GridCell } from "@/data/seating-templates"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { ActiveTool } from "./left-panel"

const CELL_SIZE = 70 // px per cell
const GAP = 6 // px gap between cells

interface CanvasProps {
  rows: number
  cols: number
  cells: GridCell[]
  activeTool: ActiveTool
  zoom: number
  onCellClick: (x: number, y: number) => void
  onMoveCell: (fromX: number, fromY: number, toX: number, toY: number) => void
  onDropNewTool: (x: number, y: number, tool: CellType) => void
  onUpdateCellLabel: (x: number, y: number, newLabel: string) => void
  onDeleteCell: (x: number, y: number) => void
}

// Cell colour/icon config
const CELL_CONFIG: Record<
  CellType,
  {
    icon: any
    border: string
    bg: string
    textColor: string
    label: string
  }
> = {
  empty: {
    icon: null,
    border: "border-dashed border-border/40",
    bg: "bg-transparent hover:bg-primary/5 hover:border-primary/40",
    textColor: "",
    label: "",
  },
  seat: {
    icon: Armchair,
    border: "border-primary/70",
    bg: "bg-card shadow-xs",
    textColor: "text-primary",
    label: "Desk",
  },
  cabin: {
    icon: Shield,
    border: "border-purple-500/60",
    bg: "bg-purple-500/10",
    textColor: "text-purple-600 dark:text-purple-400",
    label: "Cabin",
  },
  computer: {
    icon: Monitor,
    border: "border-blue-500/60",
    bg: "bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
    label: "PC",
  },
  door: {
    icon: DoorOpen,
    border: "border-amber-500/60",
    bg: "bg-amber-500/10",
    textColor: "text-amber-700 dark:text-amber-400",
    label: "ENTRY",
  },
  reception: {
    icon: Building2,
    border: "border-emerald-500/60",
    bg: "bg-emerald-500/10",
    textColor: "text-emerald-700 dark:text-emerald-400",
    label: "DESK",
  },
  rack: {
    icon: BookOpen,
    border: "border-orange-500/60",
    bg: "bg-orange-500/10",
    textColor: "text-orange-700 dark:text-orange-400",
    label: "BOOKS",
  },
  water: {
    icon: Droplets,
    border: "border-cyan-500/60",
    bg: "bg-cyan-500/10",
    textColor: "text-cyan-700 dark:text-cyan-400",
    label: "WATER",
  },
  ac: {
    icon: Wind,
    border: "border-teal-500/60",
    bg: "bg-teal-500/10",
    textColor: "text-teal-700 dark:text-teal-400",
    label: "AC",
  },
  pillar: {
    icon: Square,
    border: "border-border",
    bg: "bg-muted",
    textColor: "text-muted-foreground",
    label: "PILLAR",
  },
  restroom: {
    icon: DoorOpen,
    border: "border-rose-500/60",
    bg: "bg-rose-500/10",
    textColor: "text-rose-700 dark:text-rose-400",
    label: "WC",
  },
}

export function FloorCanvas({
  rows,
  cols,
  cells,
  activeTool,
  zoom,
  onCellClick,
  onMoveCell,
  onDropNewTool,
  onUpdateCellLabel,
  onDeleteCell,
}: CanvasProps) {
  // Panning state
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })

  // Edit dialog
  const [editingCell, setEditingCell] = useState<GridCell | null>(null)
  const [cellLabelInput, setCellLabelInput] = useState("")

  // Drag state
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [dragging, setDragging] = useState<{ x: number; y: number } | null>(null)

  // Centered on mount
  useEffect(() => {
    if (canvasWrapRef.current) {
      const wrapper = canvasWrapRef.current
      const totalW = cols * (CELL_SIZE + GAP) + GAP
      const totalH = rows * (CELL_SIZE + GAP) + GAP
      setPanOffset({
        x: Math.max(0, (wrapper.clientWidth - totalW * zoom) / 2),
        y: Math.max(0, (wrapper.clientHeight - totalH * zoom) / 2),
      })
    }
  }, [rows, cols, zoom])

  // Middle-mouse / space+drag panning
  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle mouse or space is held — pan
    if (e.button === 1 || e.altKey) {
      e.preventDefault()
      setIsPanning(true)
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        ox: panOffset.x,
        oy: panOffset.y,
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    const dx = e.clientX - panStart.current.x
    const dy = e.clientY - panStart.current.y
    setPanOffset({ x: panStart.current.ox + dx, y: panStart.current.oy + dy })
  }

  const handleMouseUp = () => setIsPanning(false)

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    // zoom handled by parent via buttons; swallow if ctrl to avoid page scroll
    if (e.ctrlKey) e.preventDefault()
  }

  // Edit dialog save
  const handleSaveLabel = () => {
    if (!editingCell) return
    onUpdateCellLabel(editingCell.x, editingCell.y, cellLabelInput.trim())
    setEditingCell(null)
  }

  // Drag-and-drop handlers for canvas cells
  const handleCellDragStart = (e: React.DragEvent, cell: GridCell) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ type: "canvas-move", fromX: cell.x, fromY: cell.y })
    )
    e.dataTransfer.effectAllowed = "move"
    setDragging({ x: cell.x, y: cell.y })
  }

  const handleCellDragOver = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOver(`${x}-${y}`)
  }

  const handleCellDrop = (e: React.DragEvent, toX: number, toY: number) => {
    e.preventDefault()
    setDragOver(null)
    setDragging(null)

    const jsonData = e.dataTransfer.getData("application/json")
    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData)
        if (parsed.type === "canvas-move") {
          onMoveCell(parsed.fromX, parsed.fromY, toX, toY)
          return
        }
      } catch (_) {}
    }

    const paletteTool = e.dataTransfer.getData("text/plain") as CellType
    if (paletteTool && paletteTool !== "empty") {
      onDropNewTool(toX, toY, paletteTool)
    }
  }

  const handleCellClick = (x: number, y: number, cell: GridCell) => {
    if (isPanning) return
    if (activeTool === "select") {
      if (cell.type !== "empty") {
        setEditingCell(cell)
        setCellLabelInput(cell.seatNo || cell.label || "")
      }
    } else {
      onCellClick(x, y)
    }
  }

  // Render a single cell
  const renderCell = (x: number, y: number) => {
    const cell = cells.find((c) => c.x === x && c.y === y) ?? {
      x,
      y,
      type: "empty" as CellType,
    }
    const cfg = CELL_CONFIG[cell.type] || CELL_CONFIG.empty
    const Icon = cfg.icon
    const hasContent = cell.type !== "empty"
    const coordKey = `${x}-${y}`
    const isDragOver = dragOver === coordKey
    const isBeingDragged = dragging?.x === x && dragging?.y === y

    return (
      <div
        key={coordKey}
        className={`relative group rounded-lg border-2 flex flex-col items-center justify-center select-none transition-all duration-100 cursor-pointer overflow-hidden
          ${cfg.bg} ${cfg.border}
          ${isDragOver ? "ring-2 ring-primary ring-offset-2 scale-105 !bg-primary/20 !border-primary" : ""}
          ${isBeingDragged ? "opacity-30 scale-95" : ""}
          ${activeTool === "erase" && hasContent ? "hover:!border-destructive hover:!bg-destructive/10" : ""}
        `}
        style={{ width: CELL_SIZE, height: CELL_SIZE }}
        draggable={hasContent}
        onDragStart={(e) => hasContent && handleCellDragStart(e, cell)}
        onDragOver={(e) => handleCellDragOver(e, x, y)}
        onDragLeave={() => setDragOver(null)}
        onDrop={(e) => handleCellDrop(e, x, y)}
        onClick={() => handleCellClick(x, y, cell)}
        onDragEnd={() => setDragging(null)}
      >
        {hasContent ? (
          <>
            {Icon && (
              <Icon className={`size-5 mb-1 ${cfg.textColor}`} />
            )}
            <span
              className={`text-[10px] font-mono font-bold leading-none truncate px-1 text-center ${cfg.textColor}`}
            >
              {cell.seatNo || cell.label || cfg.label}
            </span>

            {/* Hover Actions */}
            <div className="absolute top-0.5 right-0.5 hidden group-hover:flex items-center gap-0.5 bg-background/90 backdrop-blur-sm p-0.5 rounded-md shadow-md z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingCell(cell)
                  setCellLabelInput(cell.seatNo || cell.label || "")
                }}
                className="p-0.5 rounded text-muted-foreground hover:text-primary"
                title="Edit label"
              >
                <Edit2 className="size-2.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteCell(x, y)
                }}
                className="p-0.5 rounded text-muted-foreground hover:text-destructive"
                title="Delete"
              >
                <X className="size-2.5" />
              </button>
            </div>

            {/* Move cursor hint */}
            <Move className="absolute bottom-0.5 right-0.5 size-2.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
          </>
        ) : (
          <span className="text-[10px] text-muted-foreground/20 font-mono opacity-0 group-hover:opacity-100 transition-opacity select-none">
            +
          </span>
        )}
      </div>
    )
  }

  // Total canvas dimensions in px
  const canvasWidth = cols * (CELL_SIZE + GAP) + GAP
  const canvasHeight = rows * (CELL_SIZE + GAP) + GAP

  return (
    <>
      {/* Outer panning viewport */}
      <div
        ref={canvasWrapRef}
        className={`relative w-full h-full overflow-hidden bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:20px_20px] ${isPanning ? "cursor-grabbing" : activeTool === "select" ? "cursor-default" : "cursor-crosshair"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Panning + Zooming container */}
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: canvasWidth,
            height: canvasHeight,
            willChange: "transform",
          }}
        >
          {/* Grid Cells */}
          <div
            className="relative"
            style={{ padding: GAP, display: "grid", gap: GAP, gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)` }}
          >
            {Array.from({ length: rows }).map((_, r) =>
              Array.from({ length: cols }).map((_, c) => renderCell(c, r))
            )}
          </div>

          {/* Row Letter Gutter — overlaid on left */}
          <div
            className="absolute left-0 top-0 pointer-events-none flex flex-col"
            style={{ paddingTop: GAP }}
          >
            {Array.from({ length: rows }).map((_, r) => (
              <div
                key={`row-${r}`}
                className="flex items-center justify-end pr-1"
                style={{ height: CELL_SIZE + GAP, width: 24 }}
              >
                <span className="text-[10px] font-mono font-bold text-muted-foreground/50 select-none">
                  {String.fromCharCode(65 + (r % 26))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pan hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/40 font-mono pointer-events-none select-none">
          Alt + Drag to pan · Ctrl+Wheel to zoom · Drag elements to move
        </div>
      </div>

      {/* Edit Label Modal */}
      <Dialog open={!!editingCell} onOpenChange={(v) => !v && setEditingCell(null)}>
        <DialogContent className="sm:max-w-xs rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Edit2 className="size-4 text-primary" />
              Edit {editingCell?.type}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">
                Seat Number / Label
              </label>
              <Input
                value={cellLabelInput}
                onChange={(e) => setCellLabelInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveLabel()}
                placeholder="e.g. A-12 or Entry Door"
                className="h-8 text-xs font-mono rounded-md"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Position: Row{" "}
              {String.fromCharCode(65 + ((editingCell?.y || 0) % 26))}, Column{" "}
              {(editingCell?.x || 0) + 1}
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (editingCell) {
                  onDeleteCell(editingCell.x, editingCell.y)
                  setEditingCell(null)
                }
              }}
              className="text-xs h-7 mr-auto rounded-md font-bold"
            >
              <Trash2 className="size-3 mr-1" />
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingCell(null)}
              className="text-xs h-7 rounded-md"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveLabel}
              className="text-xs h-7 rounded-md bg-primary text-primary-foreground"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
