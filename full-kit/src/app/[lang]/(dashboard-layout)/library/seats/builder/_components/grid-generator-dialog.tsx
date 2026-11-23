"use client"

import React, { useState } from "react"
import { Armchair, Check, Grid, Monitor, Plus, Shield, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  createElement,
  GRID_SIZE,
  snap,
  type CanvasElement,
  type ElementType,
} from "../seating-editor-types"

interface GridGeneratorDialogProps {
  open: boolean
  canvasWidth?: number
  canvasHeight?: number
  onClose: () => void
  onAddGrid: (newElements: CanvasElement[], neededW?: number, neededH?: number) => void
}

const PRESETS = [
  { r: 3, c: 4, label: "3 × 4 (12)" },
  { r: 4, c: 5, label: "4 × 5 (20)" },
  { r: 5, c: 6, label: "5 × 6 (30)" },
  { r: 6, c: 6, label: "6 × 6 (36)" },
  { r: 6, c: 8, label: "6 × 8 (48)" },
]

export function GridGeneratorDialog({
  open,
  canvasWidth = 960,
  canvasHeight = 600,
  onClose,
  onAddGrid,
}: GridGeneratorDialogProps) {
  const [rows, setRows] = useState(5)
  const [cols, setCols] = useState(6)
  const [elementType, setElementType] = useState<ElementType>("seat")
  const [spacingX, setSpacingX] = useState(20)
  const [spacingY, setSpacingY] = useState(20)

  const totalCount = rows * cols

  const handleGenerate = () => {
    const validRows = Math.min(20, Math.max(1, rows))
    const validCols = Math.min(20, Math.max(1, cols))

    const deskW = elementType === "cabin" ? 180 : 88
    const deskH = elementType === "cabin" ? 110 : 116
    const gapX = Math.max(16, spacingX)
    const gapY = Math.max(16, spacingY)

    const totalW = validCols * deskW + (validCols - 1) * gapX
    const totalH = validRows * deskH + (validRows - 1) * gapY

    // Auto-expand canvas if grid exceeds current hall bounds
    const neededW = Math.max(canvasWidth, Math.ceil((totalW + 100) / 20) * 20)
    const neededH = Math.max(canvasHeight, Math.ceil((totalH + 120) / 20) * 20)

    // Center in hall
    const startX = Math.max(40, snap((neededW - totalW) / 2))
    const startY = Math.max(60, snap((neededH - totalH) / 2))

    const newCells: CanvasElement[] = []

    for (let r = 0; r < validRows; r++) {
      const rowChar = String.fromCharCode(65 + (r % 26))
      for (let c = 0; c < validCols; c++) {
        const x = startX + c * (deskW + gapX)
        const y = startY + r * (deskH + gapY)
        const seatNum = c + 1

        let label = `${rowChar}-${String(seatNum).padStart(2, "0")}`
        if (elementType === "pc") {
          label = `PC-${String(r * validCols + seatNum).padStart(2, "0")}`
        } else if (elementType === "cabin") {
          label = `Cabin ${r * validCols + seatNum}`
        }

        newCells.push(
          createElement(elementType, snap(x), snap(y), {
            w: deskW,
            h: deskH,
            label,
            status: "free",
            auto: true,
          })
        )
      }
    }

    onAddGrid(newCells, neededW, neededH)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-border/80 shadow-2xl rounded-2xl z-[200] bg-card/95 backdrop-blur-md">
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-xs">
              <Grid className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <span>Add Seat Grid (Rows × Columns)</span>
                <Badge variant="secondary" className="text-[11px] font-mono">
                  {totalCount} Seats
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Generate a block of seats in rows and columns to place anywhere in your library.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Quick Presets */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground font-semibold">
              Quick Size Presets
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setRows(p.r)
                    setCols(p.c)
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    rows === p.r && cols === p.c
                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                      : "bg-muted/60 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rows & Columns inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground font-semibold">
                Rows (Height)
              </Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={rows}
                onChange={(e) => setRows(Math.min(20, Math.max(1, +e.target.value || 1)))}
                className="h-8 text-xs font-mono font-bold bg-background/80 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground font-semibold">
                Columns (Width)
              </Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={cols}
                onChange={(e) => setCols(Math.min(20, Math.max(1, +e.target.value || 1)))}
                className="h-8 text-xs font-mono font-bold bg-background/80 rounded-xl"
              />
            </div>
          </div>

          {/* Element Type Selector */}
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground font-semibold">
              Seat / Unit Type
            </Label>
            <Select
              value={elementType}
              onValueChange={(v) => setElementType(v as ElementType)}
            >
              <SelectTrigger className="h-8 text-xs bg-background/80 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[210]">
                <SelectItem value="seat" className="text-xs">
                  <div className="flex items-center gap-2">
                    <Armchair className="size-3.5 text-emerald-500" />
                    <span>Standard Study Seat (40×40)</span>
                  </div>
                </SelectItem>
                <SelectItem value="pc" className="text-xs">
                  <div className="flex items-center gap-2">
                    <Monitor className="size-3.5 text-blue-500" />
                    <span>PC Workstation Terminal (40×40)</span>
                  </div>
                </SelectItem>
                <SelectItem value="cabin" className="text-xs">
                  <div className="flex items-center gap-2">
                    <Shield className="size-3.5 text-indigo-500" />
                    <span>Silent Cabin Unit (100×80)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Spacing / Gap inputs */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">
                Column Gap ({spacingX}px)
              </Label>
              <Input
                type="number"
                step={GRID_SIZE}
                min={0}
                max={100}
                value={spacingX}
                onChange={(e) => setSpacingX(Math.max(0, +e.target.value || 0))}
                className="h-7 text-xs font-mono bg-background/80 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">
                Row Gap ({spacingY}px)
              </Label>
              <Input
                type="number"
                step={GRID_SIZE}
                min={0}
                max={100}
                value={spacingY}
                onChange={(e) => setSpacingY(Math.max(0, +e.target.value || 0))}
                className="h-7 text-xs font-mono bg-background/80 rounded-xl"
              />
            </div>
          </div>

          {/* Mini Visual Preview Box */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-center">
            <div
              className="grid gap-1 mx-auto w-fit max-w-[240px] max-h-[100px] overflow-hidden"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: Math.min(totalCount, 40) }).map((_, i) => (
                <div
                  key={i}
                  className="size-3 rounded-xs bg-primary/80 flex items-center justify-center"
                />
              ))}
            </div>
            <p className="text-[11px] font-semibold text-foreground mt-2">
              Will generate {rows} rows × {cols} columns ({totalCount} total units)
            </p>
            <p className="text-[10px] text-muted-foreground">
              Tip: Once placed, all {totalCount} seats will be selected so you can move them as a group!
            </p>
          </div>
        </div>

        <DialogFooter className="p-3 sm:px-5 border-t border-border/60 bg-muted/20 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs rounded-xl"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleGenerate}
            className="text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-md"
          >
            <Plus className="size-3.5" />
            <span>Generate & Place {totalCount} Seats</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
