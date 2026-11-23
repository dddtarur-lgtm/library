"use client"

import React, { useState } from "react"
import {
  Armchair,
  ArrowUpDown,
  BookOpen,
  Building2,
  Check,
  DoorOpen,
  Droplets,
  Edit2,
  GripHorizontal,
  GripVertical,
  Minus,
  Monitor,
  Move,
  Plus,
  Shield,
  Square,
  Trash2,
  Wind,
  X,
} from "lucide-react"

import type { CellType, GridCell } from "@/data/seating-templates"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { ActiveTool } from "./builder-toolbar"

interface SeatingChartCanvasProps {
  rows: number
  cols: number
  cells: GridCell[]
  activeTool: ActiveTool
  onCellClick: (x: number, y: number) => void
  onMoveCell: (fromX: number, fromY: number, toX: number, toY: number) => void
  onDropNewTool: (x: number, y: number, tool: CellType) => void
  onUpdateCellLabel: (x: number, y: number, newLabel: string) => void
  onDeleteCell: (x: number, y: number) => void
  onAddRow: () => void
  onRemoveRow: () => void
  onAddCol: () => void
  onRemoveCol: () => void
}

export function SeatingChartCanvas({
  rows,
  cols,
  cells,
  activeTool,
  onCellClick,
  onMoveCell,
  onDropNewTool,
  onUpdateCellLabel,
  onDeleteCell,
  onAddRow,
  onRemoveRow,
  onAddCol,
  onRemoveCol,
}: SeatingChartCanvasProps) {
  // Cell Edit Dialog State
  const [editingCell, setEditingCell] = useState<GridCell | null>(null)
  const [cellLabelInput, setCellLabelInput] = useState<string>("")

  // Drag & Drop State
  const [dragOverCoord, setDragOverCoord] = useState<string | null>(null)
  const [draggingCell, setDraggingCell] = useState<{ x: number; y: number } | null>(
    null
  )

  const handleOpenEdit = (cell: GridCell, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditingCell(cell)
    setCellLabelInput(cell.seatNo || cell.label || "")
  }

  const handleSaveCellLabel = () => {
    if (!editingCell) return
    onUpdateCellLabel(editingCell.x, editingCell.y, cellLabelInput.trim())
    setEditingCell(null)
  }

  // Drag Handlers for moving elements inside the grid
  const handleDragStart = (
    e: React.DragEvent,
    cell: GridCell
  ) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ type: "canvas-move", fromX: cell.x, fromY: cell.y })
    )
    e.dataTransfer.effectAllowed = "move"
    setDraggingCell({ x: cell.x, y: cell.y })
  }

  const handleDragOver = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    const coordKey = `${x}-${y}`
    if (dragOverCoord !== coordKey) {
      setDragOverCoord(coordKey)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, toX: number, toY: number) => {
    e.preventDefault()
    setDragOverCoord(null)
    setDraggingCell(null)

    // Check if dragging from another canvas cell
    const rawData = e.dataTransfer.getData("application/json")
    if (rawData) {
      try {
        const parsed = JSON.parse(rawData)
        if (parsed.type === "canvas-move") {
          onMoveCell(parsed.fromX, parsed.fromY, toX, toY)
          return
        }
      } catch (err) {
        // Fallback
      }
    }

    // Check if dragging from the toolbar palette
    const paletteTool = e.dataTransfer.getData("text/plain") as CellType
    if (paletteTool && paletteTool !== "empty") {
      onDropNewTool(toX, toY, paletteTool)
    }
  }

  const renderCellContent = (cell: GridCell) => {
    const isDesk =
      cell.type === "seat" || cell.type === "cabin" || cell.type === "computer"

    switch (cell.type) {
      case "seat":
        return (
          <div className="relative size-full flex flex-col items-center justify-center p-1 rounded-md bg-card border-2 border-primary/70 text-primary shadow-xs group-hover:border-primary">
            <span className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Move className="size-2.5 text-muted-foreground" />
            </span>
            <Armchair className="size-4 mb-0.5" />
            <span className="text-[10px] font-mono font-bold leading-none truncate max-w-full">
              {cell.seatNo || "Seat"}
            </span>
          </div>
        )
      case "cabin":
        return (
          <div className="relative size-full flex flex-col items-center justify-center p-1 rounded-md bg-purple-500/10 border-2 border-purple-500/70 text-purple-600 dark:text-purple-400 shadow-xs group-hover:border-purple-500">
            <span className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Move className="size-2.5 text-muted-foreground" />
            </span>
            <Shield className="size-4 mb-0.5" />
            <span className="text-[10px] font-mono font-bold leading-none truncate max-w-full">
              {cell.seatNo || "Cabin"}
            </span>
          </div>
        )
      case "computer":
        return (
          <div className="relative size-full flex flex-col items-center justify-center p-1 rounded-md bg-blue-500/10 border-2 border-blue-500/70 text-blue-600 dark:text-blue-400 shadow-xs group-hover:border-blue-500">
            <span className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Move className="size-2.5 text-muted-foreground" />
            </span>
            <Monitor className="size-4 mb-0.5" />
            <span className="text-[10px] font-mono font-bold leading-none truncate max-w-full">
              {cell.seatNo || "PC"}
            </span>
          </div>
        )
      case "door":
        return (
          <div className="relative size-full flex flex-col items-center justify-center p-1 rounded-md bg-amber-500/15 border-2 border-amber-500/70 text-amber-700 dark:text-amber-400">
            <DoorOpen className="size-4 mb-0.5" />
            <span className="text-[9px] font-bold leading-none truncate">
              {cell.label || "DOOR"}
            </span>
          </div>
        )
      case "reception":
        return (
          <div className="relative size-full flex flex-col items-center justify-center p-1 rounded-md bg-emerald-500/15 border-2 border-emerald-500/70 text-emerald-700 dark:text-emerald-400">
            <Building2 className="size-4 mb-0.5" />
            <span className="text-[8px] font-bold leading-none truncate">
              {cell.label || "DESK"}
            </span>
          </div>
        )
      case "water":
        return (
          <div className="relative size-full flex flex-col items-center justify-center p-1 rounded-md bg-cyan-500/15 border-2 border-cyan-500/70 text-cyan-700 dark:text-cyan-400">
            <Droplets className="size-4 mb-0.5" />
            <span className="text-[9px] font-bold leading-none truncate">RO WATER</span>
          </div>
        )
      case "ac":
        return (
          <div className="relative size-full flex flex-col items-center justify-center p-1 rounded-md bg-teal-500/15 border-2 border-teal-500/70 text-teal-700 dark:text-teal-400">
            <Wind className="size-4 mb-0.5" />
            <span className="text-[9px] font-bold leading-none truncate">AC</span>
          </div>
        )
      case "rack":
        return (
          <div className="relative size-full flex flex-col items-center justify-center p-1 rounded-md bg-orange-500/15 border-2 border-orange-500/70 text-orange-700 dark:text-orange-400">
            <BookOpen className="size-4 mb-0.5" />
            <span className="text-[8px] font-bold leading-none truncate">BOOKS</span>
          </div>
        )
      case "pillar":
        return (
          <div className="size-full flex flex-col items-center justify-center p-1 rounded-md bg-muted border-2 border-border text-muted-foreground">
            <Square className="size-4 fill-muted-foreground/30" />
            <span className="text-[8px] font-semibold">PILLAR</span>
          </div>
        )
      default:
        return (
          <div className="size-full flex items-center justify-center rounded-md border border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all">
            <Plus className="size-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
          </div>
        )
    }
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-3 sm:p-4 shadow-xs space-y-3">
        {/* Visual Tip and Help Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-md bg-primary/5 border border-primary/20 text-xs text-foreground">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <span>
              <strong>How to move elements:</strong> Simply <strong>drag & drop</strong> any seat or object to move it to any cell! Or click an empty spot to place your selected tool.
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>{rows} Rows × {cols} Columns</span>
          </div>
        </div>

        {/* Canvas Dimension Controls Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-1 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Floor Grid Boundary:</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onAddRow}
                className="h-6 text-[11px] px-2 gap-1 rounded-md hover:bg-muted"
                title="Add 1 Row to the bottom of the floor"
              >
                <Plus className="size-3" />
                <span>Row ({rows})</span>
              </Button>
              {rows > 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemoveRow}
                  className="h-6 text-[11px] px-1.5 text-muted-foreground hover:text-destructive rounded-md"
                  title="Remove bottom row"
                >
                  <Minus className="size-3" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onAddCol}
                className="h-6 text-[11px] px-2 gap-1 rounded-md hover:bg-muted"
                title="Add 1 Column to the right of the floor"
              >
                <Plus className="size-3" />
                <span>Col ({cols})</span>
              </Button>
              {cols > 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemoveCol}
                  className="h-6 text-[11px] px-1.5 text-muted-foreground hover:text-destructive rounded-md"
                  title="Remove right column"
                >
                  <Minus className="size-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground">
            {activeTool === "select" ? (
              <span>👆 Click any seat to edit number or delete</span>
            ) : activeTool === "erase" ? (
              <span className="text-destructive font-semibold">
                🧹 Click any cell to erase to empty aisle
              </span>
            ) : (
              <span>
                🎯 Active tool: <strong className="text-primary capitalize">{activeTool}</strong> (Click cell to place)
              </span>
            )}
          </div>
        </div>

        {/* The Blueprint Floor Canvas with Column Header & Row Letter Labels */}
        <div
          className="overflow-x-auto p-4 rounded-lg bg-muted/20 border border-border flex flex-col items-center justify-center min-h-[460px]"
          onDragLeave={handleDragLeave}
        >
          {/* Column Number Headers */}
          <div
            className="grid gap-2 mb-2 pointer-events-none"
            style={{
              gridTemplateColumns: `32px repeat(${cols}, minmax(56px, 62px))`,
            }}
          >
            <div className="size-full" />
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={`col-${c}`}
                className="text-center font-mono text-[10px] text-muted-foreground/60 font-semibold"
              >
                Col {c + 1}
              </div>
            ))}
          </div>

          {/* Row-by-Row Grid with Row Letter on Left */}
          <div className="flex flex-col gap-2">
            {Array.from({ length: rows }).map((_, r) => {
              const rowLetter = String.fromCharCode(65 + (r % 26))

              return (
                <div
                  key={`row-${r}`}
                  className="flex items-center gap-2"
                >
                  {/* Row Letter Header */}
                  <div className="w-8 text-center font-mono font-bold text-xs text-muted-foreground select-none shrink-0">
                    {rowLetter}
                  </div>

                  {/* Row Cells */}
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${cols}, minmax(56px, 62px))`,
                    }}
                  >
                    {Array.from({ length: cols }).map((_, c) => {
                      const cell = cells.find((item) => item.x === c && item.y === r) || {
                        x: c,
                        y: r,
                        type: "empty",
                      }
                      const coordKey = `${c}-${r}`
                      const isDragOver = dragOverCoord === coordKey
                      const isBeingDragged =
                        draggingCell?.x === c && draggingCell?.y === r
                      const hasContent = cell.type !== "empty"

                      return (
                        <div
                          key={coordKey}
                          draggable={hasContent}
                          onDragStart={(e) => hasContent && handleDragStart(e, cell)}
                          onDragOver={(e) => handleDragOver(e, c, r)}
                          onDrop={(e) => handleDrop(e, c, r)}
                          onClick={() => {
                            if (activeTool === "select" && hasContent) {
                              handleOpenEdit(cell)
                            } else {
                              onCellClick(c, r)
                            }
                          }}
                          className={`group relative size-[58px] sm:size-[62px] select-none rounded-md transition-all cursor-pointer ${
                            isBeingDragged
                              ? "opacity-30 scale-95"
                              : isDragOver
                                ? "ring-2 ring-primary ring-offset-2 scale-105 bg-primary/20"
                                : ""
                          }`}
                        >
                          {renderCellContent(cell)}

                          {/* Quick Hover Controls for Placed Items */}
                          {hasContent && (
                            <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-0.5 bg-background/90 backdrop-blur-xs p-0.5 rounded shadow-xs z-10">
                              <button
                                type="button"
                                onClick={(e) => handleOpenEdit(cell, e)}
                                title="Edit Number"
                                className="p-0.5 hover:text-primary text-muted-foreground"
                              >
                                <Edit2 className="size-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeleteCell(cell.x, cell.y)
                                }}
                                title="Delete"
                                className="p-0.5 hover:text-destructive text-muted-foreground"
                              >
                                <X className="size-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Edit Cell Label Modal */}
      <Dialog
        open={!!editingCell}
        onOpenChange={(v) => !v && setEditingCell(null)}
      >
        <DialogContent className="sm:max-w-xs rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Edit2 className="size-4 text-primary" />
              Edit {editingCell?.type}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground">
                Seat Number / Label:
              </label>
              <Input
                value={cellLabelInput}
                onChange={(e) => setCellLabelInput(e.target.value)}
                placeholder="e.g. A-12 or Water Point"
                className="h-8 text-xs font-mono rounded-md"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Position: Row {String.fromCharCode(65 + ((editingCell?.y || 0) % 26))}, Column {(editingCell?.x || 0) + 1}
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (editingCell) {
                  onDeleteCell(editingCell.x, editingCell.y)
                  setEditingCell(null)
                }
              }}
              className="text-xs h-7 mr-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md font-bold"
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
              onClick={handleSaveCellLabel}
              className="text-xs h-7 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-semibold"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
