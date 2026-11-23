"use client"

import React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Code2,
  Eye,
  Grid,
  LayoutGrid,
  Pencil,
  Redo2,
  Undo2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

interface EditorTopBarProps {
  lang: LocaleType
  name: string
  currentFloor?: string
  mode: "edit" | "preview"
  canUndo: boolean
  canRedo: boolean
  isSaved: boolean
  canvasWidth?: number
  canvasHeight?: number
  onNameChange: (name: string) => void
  onNameCommit?: (oldName: string, newName: string) => void
  onFloorChange?: (floor: string) => void
  onModeChange: (mode: "edit" | "preview") => void
  onUndo: () => void
  onRedo: () => void
  onOpenTemplates: () => void
  onOpenGridGenerator: () => void
  onOpenJson: () => void
  onPublish: () => void
  onCanvasSizeChange?: (w: number, h: number) => void
  onAutoFitCanvas?: () => void
}

export function EditorTopBar({
  lang,
  name,
  currentFloor = "Ground Floor",
  mode,
  canUndo,
  canRedo,
  isSaved,
  canvasWidth = 960,
  canvasHeight = 600,
  onNameChange,
  onNameCommit,
  onFloorChange,
  onModeChange,
  onUndo,
  onRedo,
  onOpenTemplates,
  onOpenGridGenerator,
  onOpenJson,
  onPublish,
  onCanvasSizeChange,
  onAutoFitCanvas,
}: EditorTopBarProps) {
  const startNameRef = React.useRef(name)

  const handleNameFocus = () => {
    startNameRef.current = name
  }

  const handleNameBlur = () => {
    if (onNameCommit && startNameRef.current !== name) {
      onNameCommit(startNameRef.current, name)
      startNameRef.current = name
    }
  }

  const exitHref = currentFloor
    ? `/pages/seats?floor=${encodeURIComponent(currentFloor)}`
    : "/pages/seats"

  return (
    <header className="fixed top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 px-3 max-w-[calc(100vw-32px)] rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl transition-all">
      {/* Return to Seats Back Button */}
      <Link
        href={ensureLocalizedPathname(exitHref, lang)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
        title="Exit to Seat Map"
      >
        <ArrowLeft className="size-3.5" />
        <span className="hidden sm:inline font-semibold">Exit</span>
      </Link>

      {/* Floor Switcher Dropdown */}
      {onFloorChange && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 rounded-xl text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground hover:bg-muted/70 cursor-pointer"
              title="Switch Floor"
            >
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                {currentFloor}
              </span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="text-xs rounded-xl z-50">
            {["Ground Floor", "1st Floor", "2nd Floor"].map((fl) => (
              <DropdownMenuItem
                key={fl}
                onClick={() => onFloorChange(fl)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>{fl}</span>
                {currentFloor === fl && <Check className="size-3 text-primary ml-2" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <div className="h-5 w-px bg-border/80 mx-0.5 shrink-0" />

      {/* Editable Hall/Layout Name Input */}
      <div className="relative flex items-center gap-1.5">
        <input
          value={name}
          onFocus={handleNameFocus}
          onBlur={handleNameBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              ;(e.target as HTMLInputElement).blur()
            }
          }}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Hall Layout Name..."
          className="h-8 px-2.5 rounded-xl bg-transparent hover:bg-muted/40 focus:bg-muted/60 border border-transparent hover:border-border/60 focus:border-border font-semibold text-xs sm:text-sm text-foreground outline-none transition-all w-36 sm:w-56"
          title="Click to rename layout"
        />
        {!isSaved && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider select-none">
            Draft
          </span>
        )}
      </div>

      <div className="h-5 w-px bg-border/80 mx-1 shrink-0" />

      {/* Undo & Redo (Edit mode only) */}
      {mode === "edit" && (
        <>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 disabled:opacity-30"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 disabled:opacity-30"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z / Ctrl+Y)"
            >
              <Redo2 className="size-3.5" />
            </Button>
          </div>
          <div className="h-5 w-px bg-border/80 mx-1 shrink-0" />
        </>
      )}

      {/* Mode Segmented Switch: Editor vs Live Preview */}
      <div className="flex items-center p-0.5 rounded-xl bg-muted/60 border border-border/50">
        <button
          type="button"
          onClick={() => onModeChange("edit")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            mode === "edit"
              ? "bg-background text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Pencil className="size-3" />
          <span>Editor</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange("preview")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            mode === "preview"
              ? "bg-background text-primary shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="size-3" />
          <span>Live preview</span>
        </button>
      </div>

      <div className="h-5 w-px bg-border/80 mx-1 shrink-0" />

      {/* Add Seat Grid (Rows x Columns) Button */}
      {mode === "edit" && (
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenGridGenerator}
          className="h-8 px-2.5 rounded-xl text-xs font-semibold text-foreground hover:bg-muted/70 gap-1.5 border-primary/30 text-primary transition-colors"
          title="Create Custom Seat Grid (Rows × Columns)"
        >
          <Grid className="size-3.5 text-primary" />
          <span className="hidden md:inline">+ Seat Grid (R×C)</span>
          <span className="md:hidden">+ Grid</span>
        </Button>
      )}


      {/* Templates Modal Trigger */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onOpenTemplates}
        className="h-8 px-2.5 rounded-xl text-xs font-medium text-foreground hover:bg-muted/70 gap-1.5 transition-colors"
        title="Browse 20 Ready Seating Templates"
      >
        <LayoutGrid className="size-3.5 text-primary" />
        <span className="font-semibold">Templates</span>
      </Button>

      {/* JSON Import/Export Trigger */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onOpenJson}
        className="h-8 px-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 gap-1.5 transition-colors"
        title="View / Import Layout JSON"
      >
        <Code2 className="size-3.5" />
        <span className="hidden md:inline">JSON</span>
      </Button>

      {/* Publish / Save Button */}
      <Button
        size="sm"
        onClick={onPublish}
        className={`h-8 px-3.5 rounded-xl text-xs font-semibold shadow-md transition-all gap-1.5 ${
          isSaved
            ? "bg-emerald-600/90 hover:bg-emerald-700 text-white cursor-default"
            : "bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"
        }`}
      >
        {isSaved ? (
          <>
            <Check className="size-3.5 text-white" />
            <span>Published</span>
          </>
        ) : (
          <span>Publish Changes</span>
        )}
      </Button>
    </header>
  )
}
