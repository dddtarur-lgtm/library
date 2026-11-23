"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Copy, Trash2 } from "lucide-react"

import {
  canPlaceWithoutCollision,
  GRID_SIZE,
  isBookable,
  snap,
  STATUS_CONFIG,
  TOOLS_CONFIG,
  type ActiveTool,
  type CanvasElement,
  type ElementType,
  type SeatStatus,
  type ViewportState,
} from "../seating-editor-types"
import type { ElementPatch, HistoryAction } from "../_lib/editor-history"

type ResizeDirection = "nw" | "ne" | "sw" | "se" | "n" | "s" | "w" | "e"

interface CanvasAreaProps {
  elements: CanvasElement[]
  selectedIds: string[]
  activeTool: ActiveTool
  mode: "edit" | "preview"
  viewport: ViewportState
  spacePressed: boolean
  canvasWidth?: number
  canvasHeight?: number
  hallName?: string
  onViewportChange: (
    v: ViewportState | ((prev: ViewportState) => ViewportState)
  ) => void
  onSelectElements: (ids: string[]) => void
  onLiveUpdateElements?: (newElements: CanvasElement[]) => void
  onCommitElements: (newElements: CanvasElement[]) => void
  onCommitHistoryAction?: (action: HistoryAction) => void
  onAddElement: (tool: ElementType, x: number, y: number) => void
  onCycleStatus: (id: string) => void
  onCanvasSizeChange?: (w: number, h: number) => void
  onOpenHallSettings?: () => void
  onDuplicateSelected?: (ids: string[]) => void
  onDeleteSelected?: (ids: string[]) => void
}

export function CanvasArea({
  elements,
  selectedIds,
  activeTool,
  mode,
  viewport,
  spacePressed,
  canvasWidth = 960,
  canvasHeight = 600,
  hallName,
  onViewportChange,
  onSelectElements,
  onLiveUpdateElements,
  onCommitElements,
  onCommitHistoryAction,
  onAddElement,
  onCycleStatus,
  onCanvasSizeChange,
  onOpenHallSettings,
  onDuplicateSelected,
  onDeleteSelected,
}: CanvasAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const liveUpdateElements = onLiveUpdateElements || onCommitElements

  // Drag tracking state
  const dragRef = useRef<{
    type: "pan" | "move" | "resize" | "marquee" | "hall-resize"
    direction?: ResizeDirection
    startX: number
    startY: number
    screenStartX?: number
    screenStartY?: number
    initialViewport?: ViewportState
    initialPositions?: Map<string, { x: number; y: number }>
    initialEl?: CanvasElement
    initialHallW?: number
    initialHallH?: number
    hasMoved?: boolean
  } | null>(null)

  // Floating dimension tooltip during drag / resize (Figma micro-feature)
  const [dragTooltip, setDragTooltip] = useState<{
    x: number
    y: number
    text: string
  } | null>(null)

  // State to render marquee selection rectangle
  const [marqueeBox, setMarqueeBox] = useState<{
    x: number
    y: number
    w: number
    h: number
  } | null>(null)

  const elementsRef = useRef(elements)
  elementsRef.current = elements

  const selectedIdsRef = useRef(selectedIds)
  selectedIdsRef.current = selectedIds

  const viewportRef = useRef(viewport)
  viewportRef.current = viewport

  // Convert screen coordinates to canvas world coordinates
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    const v = viewportRef.current
    return {
      x: (clientX - rect.left - v.x) / v.z,
      y: (clientY - rect.top - v.y) / v.z,
    }
  }, [])

  // Mouse Wheel: Pan and Ctrl+Zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top

      if (e.ctrlKey || e.metaKey) {
        // Zoom centered at cursor
        const factor = e.deltaY < 0 ? 1.12 : 0.89
        const v = viewportRef.current
        const newZ = Math.min(3.0, Math.max(0.25, v.z * factor))
        onViewportChange({
          z: newZ,
          x: cursorX - ((cursorX - v.x) * newZ) / v.z,
          y: cursorY - ((cursorY - v.y) * newZ) / v.z,
        })
      } else if (e.shiftKey) {
        // Shift + Wheel: Horizontal scroll left and right (Figma standard)
        const dx = e.deltaX !== 0 ? e.deltaX : e.deltaY
        onViewportChange((v) => ({
          ...v,
          x: v.x - dx,
        }))
      } else {
        // Normal Wheel: Scroll up and down vertically
        onViewportChange((v) => ({
          ...v,
          x: v.x - e.deltaX,
          y: v.y - e.deltaY,
        }))
      }
    }

    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [onViewportChange])

  // Pointer Down handler
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return

    const isPan = e.button === 1 || spacePressed || activeTool === "hand"
    const worldPos = screenToWorld(e.clientX, e.clientY)

    const target = e.target as HTMLElement
    const handleEl = target.closest("[data-resize-handle]") as HTMLElement | null
    const elementEl = target.closest("[data-element-id]") as HTMLElement | null

    containerRef.current.setPointerCapture(e.pointerId)

    if (isPan) {
      dragRef.current = {
        type: "pan",
        startX: e.clientX,
        startY: e.clientY,
        initialViewport: viewportRef.current,
      }
      return
    }

    // Hall preview box corner resize handle (when user drags corner of hall box)
    const hallResizeEl = target.closest("[data-hall-resize-handle]") as HTMLElement | null
    if (hallResizeEl && mode === "edit") {
      dragRef.current = {
        type: "hall-resize",
        startX: worldPos.x,
        startY: worldPos.y,
        initialHallW: canvasWidth,
        initialHallH: canvasHeight,
        hasMoved: false,
      }
      return
    }

    // In Preview mode
    if (mode === "preview") {
      if (elementEl) {
        const id = elementEl.dataset.elementId!
        const el = elementsRef.current.find((x) => x.id === id)
        if (el && isBookable(el.type)) {
          onCycleStatus(id)
        }
      } else {
        dragRef.current = {
          type: "pan",
          startX: e.clientX,
          startY: e.clientY,
          initialViewport: viewportRef.current,
        }
      }
      return
    }

    // In Edit mode - element placement tools (anti-stacking)
    if (activeTool !== "select") {
      const toolCfg = TOOLS_CONFIG[activeTool]
      const px = snap(worldPos.x - toolCfg.defaultW / 2)
      const py = snap(worldPos.y - toolCfg.defaultH / 2)

      // Search for the closest free non-colliding grid spot
      let placeX = px
      let placeY = py
      let found = false

      for (let radius = 0; radius <= 200; radius += GRID_SIZE) {
        for (let ox = -radius; ox <= radius; ox += GRID_SIZE) {
          for (let oy = -radius; oy <= radius; oy += GRID_SIZE) {
            const test = {
              x: px + ox,
              y: py + oy,
              w: toolCfg.defaultW,
              h: toolCfg.defaultH,
              type: activeTool,
            }
            if (
              test.x >= 20 &&
              test.y >= 20 &&
              test.x + test.w <= canvasWidth - 20 &&
              test.y + test.h <= canvasHeight - 20
            ) {
              if (canPlaceWithoutCollision(test, elementsRef.current)) {
                placeX = test.x
                placeY = test.y
                found = true
                break
              }
            }
          }
          if (found) break
        }
        if (found) break
      }

      if (found) {
        onAddElement(activeTool, placeX, placeY)
      }
      return
    }

    // Single item resize handle (only for non-seat elements like cabins, zones, shelves, pillars)
    if (handleEl && selectedIdsRef.current.length === 1 && mode === "edit") {
      const el = elementsRef.current.find((x) => x.id === selectedIdsRef.current[0])
      if (el && el.type !== "seat" && el.type !== "pc") {
        const dir = (handleEl.dataset.resizeHandle || "se") as ResizeDirection
        dragRef.current = {
          type: "resize",
          direction: dir,
          startX: worldPos.x,
          startY: worldPos.y,
          initialEl: { ...el },
          hasMoved: false,
        }
        return
      }
    }

    // Clicked an element
    if (elementEl) {
      const id = elementEl.dataset.elementId!
      const isShift = e.shiftKey || e.ctrlKey || e.metaKey

      let targetIds = [...selectedIdsRef.current]

      if (isShift) {
        // Toggle selection
        if (targetIds.includes(id)) {
          targetIds = targetIds.filter((x) => x !== id)
        } else {
          targetIds.push(id)
        }
      } else {
        // If clicked element was not in current selection, select only this element
        if (!targetIds.includes(id)) {
          targetIds = [id]
        }
      }

      onSelectElements(targetIds)

      // Start multi-element move
      const positions = new Map<string, { x: number; y: number }>()
      elementsRef.current.forEach((el) => {
        if (targetIds.includes(el.id)) {
          positions.set(el.id, { x: el.x, y: el.y })
        }
      })

      dragRef.current = {
        type: "move",
        startX: worldPos.x,
        startY: worldPos.y,
        initialPositions: positions,
        hasMoved: false,
      }
      return
    }

    // Clicked on empty canvas -> Marquee selection box
    if (!e.shiftKey) {
      onSelectElements([])
    }

    dragRef.current = {
      type: "marquee",
      startX: worldPos.x,
      startY: worldPos.y,
      screenStartX: e.clientX,
      screenStartY: e.clientY,
      hasMoved: false,
    }
  }

  // Pointer Move handler
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return

    // Pan
    if (drag.type === "pan" && drag.initialViewport) {
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      onViewportChange({
        ...drag.initialViewport,
        x: drag.initialViewport.x + dx,
        y: drag.initialViewport.y + dy,
      })
      return
    }

    const worldPos = screenToWorld(e.clientX, e.clientY)
    const dx = worldPos.x - drag.startX
    const dy = worldPos.y - drag.startY

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      drag.hasMoved = true
    }

    // Hall preview box corner resize (drag corner to change hall width & height)
    if (drag.type === "hall-resize" && onCanvasSizeChange) {
      const newW = Math.max(600, snap((drag.initialHallW || 960) + dx))
      const newH = Math.max(400, snap((drag.initialHallH || 600) + dy))
      onCanvasSizeChange(newW, newH)
      return
    }

    // Multi-element move (Anti-stacking / Anti-collision)
    if (drag.type === "move" && drag.initialPositions) {
      const snappedDx = snap(dx)
      const snappedDy = snap(dy)

      const movingIds = Array.from(drag.initialPositions.keys())
      const stationary = elementsRef.current.filter(
        (el) => !movingIds.includes(el.id)
      )

      let collision = false
      for (const [id, init] of drag.initialPositions.entries()) {
        const el = elementsRef.current.find((e) => e.id === id)
        if (!el) continue

        const proposed = {
          ...el,
          x: Math.max(0, snap(init.x + snappedDx)),
          y: Math.max(0, snap(init.y + snappedDy)),
        }

        // Keep strictly inside hall boundaries
        if (
          proposed.x + proposed.w > canvasWidth ||
          proposed.y + proposed.h > canvasHeight
        ) {
          collision = true
          break
        }

        // Check against any stationary element
        if (!canPlaceWithoutCollision(proposed, stationary)) {
          collision = true
          break
        }
      }

        if (!collision) {
        const updated = elementsRef.current.map((el) => {
          const init = drag.initialPositions?.get(el.id)
          if (init) {
            return {
              ...el,
              x: Math.max(0, snap(init.x + snappedDx)),
              y: Math.max(0, snap(init.y + snappedDy)),
            }
          }
          return el
        })
        liveUpdateElements(updated)

        // Show move tooltip for primary moving element
        const firstId = movingIds[0]
        const firstInit = drag.initialPositions?.get(firstId)
        if (firstInit) {
          setDragTooltip({
            x: e.clientX + 14,
            y: e.clientY + 14,
            text: `X: ${Math.max(0, snap(firstInit.x + snappedDx))}  Y: ${Math.max(0, snap(firstInit.y + snappedDy))}`,
          })
        }
      }
      return
    }

    // Single element resize in 8 directions (Anti-stacking / Anti-collision)
    if (drag.type === "resize" && drag.initialEl) {
      const dir = drag.direction || "se"
      const init = drag.initialEl
      let newX = init.x
      let newY = init.y
      let newW = init.w
      let newH = init.h

      if (dir.includes("e")) {
        newW = Math.max(40, snap(init.w + dx))
      }
      if (dir.includes("s")) {
        newH = Math.max(40, snap(init.h + dy))
      }
      if (dir.includes("w")) {
        const potentialW = snap(init.w - dx)
        if (potentialW >= 40) {
          newW = potentialW
          newX = snap(init.x + dx)
        }
      }
      if (dir.includes("n")) {
        const potentialH = snap(init.h - dy)
        if (potentialH >= 40) {
          newH = potentialH
          newY = snap(init.y + dy)
        }
      }

      // Check canvas boundaries
      newX = Math.max(0, newX)
      newY = Math.max(0, newY)
      if (newX + newW > canvasWidth) newW = canvasWidth - newX
      if (newY + newH > canvasHeight) newH = canvasHeight - newY

      const proposed = {
        ...init,
        x: newX,
        y: newY,
        w: newW,
        h: newH,
      }

      if (canPlaceWithoutCollision(proposed, elementsRef.current, [init.id])) {
        const updated = elementsRef.current.map((el) =>
          el.id === init.id ? proposed : el
        )
        liveUpdateElements(updated)
        setDragTooltip({
          x: e.clientX + 14,
          y: e.clientY + 14,
          text: `W: ${newW}  H: ${newH}`,
        })
      }
      return
    }

    // Rubber-band marquee selection
    if (drag.type === "marquee") {
      const minX = Math.min(drag.startX, worldPos.x)
      const maxX = Math.max(drag.startX, worldPos.x)
      const minY = Math.min(drag.startY, worldPos.y)
      const maxY = Math.max(drag.startY, worldPos.y)

      setMarqueeBox({
        x: minX,
        y: minY,
        w: maxX - minX,
        h: maxY - minY,
      })
    }
  }

  // Pointer Up handler (Commits single history entry when gesture ends)
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) {
      setDragTooltip(null)
      return
    }

    // 1. Multi-element move ended: commit ONE history entry with delta patches
    if (drag.type === "move" && drag.hasMoved && drag.initialPositions) {
      const movingIds = Array.from(drag.initialPositions.keys())
      const patches: ElementPatch[] = []

      for (const [id, init] of drag.initialPositions.entries()) {
        const cur = elementsRef.current.find((el) => el.id === id)
        if (cur && (cur.x !== init.x || cur.y !== init.y)) {
          patches.push({
            id,
            before: { x: init.x, y: init.y },
            after: { x: cur.x, y: cur.y },
          })
        }
      }

      if (patches.length > 0 && onCommitHistoryAction) {
        onCommitHistoryAction({
          type: "update-elements",
          patches,
          selectionBefore: movingIds,
          selectionAfter: movingIds,
          description: `Move ${patches.length} element(s)`,
        })
      }
    }

    // 2. Single element resize ended: commit ONE history entry with delta patch
    if (drag.type === "resize" && drag.hasMoved && drag.initialEl) {
      const init = drag.initialEl
      const cur = elementsRef.current.find((el) => el.id === init.id)
      if (
        cur &&
        (cur.x !== init.x ||
          cur.y !== init.y ||
          cur.w !== init.w ||
          cur.h !== init.h)
      ) {
        if (onCommitHistoryAction) {
          onCommitHistoryAction({
            type: "update-elements",
            patches: [
              {
                id: init.id,
                before: { x: init.x, y: init.y, w: init.w, h: init.h },
                after: { x: cur.x, y: cur.y, w: cur.w, h: cur.h },
              },
            ],
            selectionBefore: [init.id],
            selectionAfter: [init.id],
            description: `Resize ${cur.label || "element"}`,
          })
        }
      }
    }

    // 3. Hall canvas corner resize ended: commit ONE history entry
    if (drag.type === "hall-resize" && drag.hasMoved) {
      const initW = drag.initialHallW || 960
      const initH = drag.initialHallH || 600
      if (
        (canvasWidth !== initW || canvasHeight !== initH) &&
        onCommitHistoryAction
      ) {
        onCommitHistoryAction({
          type: "canvas-size",
          before: { width: initW, height: initH },
          after: { width: canvasWidth, height: canvasHeight },
          description: "Resize Hall Canvas",
        })
      }
    }

    // 4. Marquee selection
    if (drag.type === "marquee") {
      const worldPos = screenToWorld(e.clientX, e.clientY)
      const minX = Math.min(drag.startX, worldPos.x)
      const maxX = Math.max(drag.startX, worldPos.x)
      const minY = Math.min(drag.startY, worldPos.y)
      const maxY = Math.max(drag.startY, worldPos.y)

      const boxW = maxX - minX
      const boxH = maxY - minY

      // If user dragged a meaningful box (> 6px)
      if (boxW > 6 || boxH > 6) {
        const enclosedIds = elementsRef.current
          .filter(
            (el) =>
              el.x < maxX &&
              el.x + el.w > minX &&
              el.y < maxY &&
              el.y + el.h > minY
          )
          .map((el) => el.id)

        if (e.shiftKey) {
          const combined = Array.from(
            new Set([...selectedIdsRef.current, ...enclosedIds])
          )
          onSelectElements(combined)
        } else {
          onSelectElements(enclosedIds)
        }
      } else {
        if (!e.shiftKey) {
          onSelectElements([])
        }
      }
      setMarqueeBox(null)
    }

    setDragTooltip(null)
    dragRef.current = null
  }

  // Cursor style
  const getCursorStyle = () => {
    if (spacePressed || activeTool === "hand") return "grab"
    if (activeTool !== "select" && mode === "edit") return "crosshair"
    return "default"
  }

  // Sort elements so zones stay at bottom layer, interactive elements on top
  const orderedElements = [...elements].sort((a, b) => {
    if (a.type === "zone" && b.type !== "zone") return -1
    if (a.type !== "zone" && b.type === "zone") return 1
    return 0
  })

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 select-none overflow-hidden touch-none"
      style={{
        backgroundColor: "var(--background)",
        cursor: getCursorStyle(),
        backgroundImage:
          "radial-gradient(hsl(var(--muted-foreground) / 0.22) 1.2px, transparent 1.2px)",
        backgroundSize: `${20 * viewport.z}px ${20 * viewport.z}px`,
        backgroundPosition: `${viewport.x}px ${viewport.y}px`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Scalable & Pannable World Container */}
      <div
        className="absolute left-0 top-0 origin-top-left pointer-events-auto"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.z})`,
        }}
      >
        {/* Hall boundary rectangle */}
        <div
          className="absolute left-0 top-0 rounded-2xl border-2 border-foreground/30 bg-card/60 shadow-inner group/hall transition-all duration-75"
          style={{
            width: canvasWidth,
            height: canvasHeight,
          }}
        >
          {/* Hall Title Badge */}
          <div className="absolute top-3 left-4 z-20 flex items-center gap-2 pointer-events-none select-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/70 bg-card/90 text-foreground shadow-sm text-xs font-semibold">
              <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold tracking-wide uppercase text-[11px]">
                {hallName || "Main Library Hall"}
              </span>
            </div>
          </div>

          {/* Interactive Corner Resize Handle for Hall Preview Box */}
          {mode === "edit" && onCanvasSizeChange && (
            <div
              data-hall-resize-handle="1"
              className="absolute -right-3 -bottom-3 size-6 rounded-lg border-2 border-primary bg-primary text-primary-foreground shadow-lg cursor-nwse-resize flex items-center justify-center hover:scale-115 active:scale-95 transition-all z-30"
              title="Click and drag corner to resize Hall Preview Box (Width × Height)"
            >
              <div className="size-2.5 border-r-2 border-b-2 border-primary-foreground rounded-br-xs" />
            </div>
          )}
        </div>

        {/* Marquee Rubber-band Selection Box */}
        {marqueeBox && (
          <div
            className="absolute rounded-md border-2 border-primary bg-primary/15 pointer-events-none z-30"
            style={{
              left: marqueeBox.x,
              top: marqueeBox.y,
              width: marqueeBox.w,
              height: marqueeBox.h,
            }}
          />
        )}

        {/* Canvas Elements */}
        {orderedElements.map((el) => {
          const isSelected = selectedIds.includes(el.id) && mode === "edit"
          const toolCfg = TOOLS_CONFIG[el.type]
          const isBook = isBookable(el.type)
          const isPreview = mode === "preview"
          const isSeatOrPc = el.type === "seat" || el.type === "pc"
          const isSingleSelected = isSelected && selectedIds.length === 1

          // Figma Selection Overlay (8 Handles + Border hit-strips + Floating Customization Pill)
          const renderFigmaSelectionControls = () => {
            if (!isSingleSelected) return null
            return (
              <>
                {/* Floating On-Canvas Customization Bar (Figma-style quick toolbar) */}
                <div
                  className="absolute -top-11 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181a1e]/95 border border-[#0d99ff]/50 shadow-2xl backdrop-blur-md text-white select-none whitespace-nowrap pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <span className="font-bold text-[11px] text-white/95 font-mono tracking-tight px-1">
                    {el.label || toolCfg.name}
                  </span>
                  <span className="text-[10px] font-mono text-white/70 bg-white/10 px-1.5 py-0.5 rounded">
                    {el.w}×{el.h}
                  </span>
                  {isBook && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCycleStatus(el.id)
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer hover:brightness-110 active:scale-95 shadow-xs"
                      style={{
                        backgroundColor:
                          el.status === "taken"
                            ? "#eab308"
                            : el.status === "reserved"
                              ? "#a855f7"
                              : "#1fc749",
                        color: el.status === "reserved" ? "#ffffff" : "#000000",
                      }}
                      title="Click to toggle status (Free / Occupied / Reserved)"
                    >
                      <span className="size-1.5 rounded-full bg-current opacity-80" />
                      <span>{STATUS_CONFIG[el.status || "free"].label}</span>
                    </button>
                  )}
                  <div className="w-px h-3.5 bg-white/20 mx-0.5" />
                  {onDuplicateSelected && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDuplicateSelected([el.id])
                      }}
                      className="size-5 rounded flex items-center justify-center hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer"
                      title="Duplicate element (Ctrl+D)"
                    >
                      <Copy className="size-3" />
                    </button>
                  )}
                  {onDeleteSelected && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteSelected([el.id])
                      }}
                      className="size-5 rounded flex items-center justify-center hover:bg-red-500/25 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      title="Delete element (Del)"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>

                {/* 8 Resize Handles (Only for non-seat elements: cabins, zones, shelves, reception, pillars) */}
                {!isSeatOrPc && (
                  <>
                    {/* 4 Border Edge Drag Strips */}
                    <div
                      data-resize-handle="n"
                      className="absolute -top-1 left-2 right-2 h-2 cursor-ns-resize z-30 pointer-events-auto"
                      title="Drag top border to resize height"
                    />
                    <div
                      data-resize-handle="s"
                      className="absolute -bottom-1 left-2 right-2 h-2 cursor-ns-resize z-30 pointer-events-auto"
                      title="Drag bottom border to resize height"
                    />
                    <div
                      data-resize-handle="w"
                      className="absolute top-2 bottom-2 -left-1 w-2 cursor-ew-resize z-30 pointer-events-auto"
                      title="Drag left border to resize width"
                    />
                    <div
                      data-resize-handle="e"
                      className="absolute top-2 bottom-2 -right-1 w-2 cursor-ew-resize z-30 pointer-events-auto"
                      title="Drag right border to resize width"
                    />

                    {/* 4 Corner Resize Handles */}
                    <div
                      data-resize-handle="nw"
                      className="absolute -top-1.5 -left-1.5 size-2.5 bg-white border-[1.5px] border-[#0d99ff] rounded-[1px] shadow-sm cursor-nwse-resize z-40 hover:scale-130 transition-transform pointer-events-auto"
                      title="Drag corner to resize"
                    />
                    <div
                      data-resize-handle="ne"
                      className="absolute -top-1.5 -right-1.5 size-2.5 bg-white border-[1.5px] border-[#0d99ff] rounded-[1px] shadow-sm cursor-nesw-resize z-40 hover:scale-130 transition-transform pointer-events-auto"
                      title="Drag corner to resize"
                    />
                    <div
                      data-resize-handle="sw"
                      className="absolute -bottom-1.5 -left-1.5 size-2.5 bg-white border-[1.5px] border-[#0d99ff] rounded-[1px] shadow-sm cursor-nesw-resize z-40 hover:scale-130 transition-transform pointer-events-auto"
                      title="Drag corner to resize"
                    />
                    <div
                      data-resize-handle="se"
                      className="absolute -bottom-1.5 -right-1.5 size-2.5 bg-white border-[1.5px] border-[#0d99ff] rounded-[1px] shadow-sm cursor-nwse-resize z-40 hover:scale-130 transition-transform pointer-events-auto"
                      title="Drag corner to resize"
                    />

                    {/* 4 Midpoint Edge Handles */}
                    <div
                      data-resize-handle="n"
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 size-2 bg-white border-[1.5px] border-[#0d99ff] rounded-[1px] shadow-sm cursor-ns-resize z-40 hover:scale-130 transition-transform pointer-events-auto"
                      title="Drag top edge"
                    />
                    <div
                      data-resize-handle="s"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-2 bg-white border-[1.5px] border-[#0d99ff] rounded-[1px] shadow-sm cursor-ns-resize z-40 hover:scale-130 transition-transform pointer-events-auto"
                      title="Drag bottom edge"
                    />
                    <div
                      data-resize-handle="w"
                      className="absolute top-1/2 -left-1.5 -translate-y-1/2 size-2 bg-white border-[1.5px] border-[#0d99ff] rounded-[1px] shadow-sm cursor-ew-resize z-40 hover:scale-130 transition-transform pointer-events-auto"
                      title="Drag left edge"
                    />
                    <div
                      data-resize-handle="e"
                      className="absolute top-1/2 -right-1.5 -translate-y-1/2 size-2 bg-white border-[1.5px] border-[#0d99ff] rounded-[1px] shadow-sm cursor-ew-resize z-40 hover:scale-130 transition-transform pointer-events-auto"
                      title="Drag right edge"
                    />
                  </>
                )}
              </>
            )
          }

          // If seat or pc, render using the rich card UI
          if (isSeatOrPc) {
            const isTaken = el.status === "taken"
            const isReserved = el.status === "reserved"

            return (
              <div
                key={el.id}
                data-element-id={el.id}
                className={`group absolute select-none transition-all duration-75 ${
                  isPreview && isBook
                    ? "cursor-pointer hover:brightness-110 active:scale-95"
                    : "cursor-move"
                }`}
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.w || 88,
                  height: el.h || 116,
                  zIndex: isSelected ? 30 : 2,
                }}
                title={
                  isPreview && isBook
                    ? `${el.label || toolCfg.name} • ${
                        STATUS_CONFIG[el.status || "free"].label
                      } (Click to toggle)`
                    : `${toolCfg.name}: ${el.label}`
                }
              >
                {/* Inner Card Body with fixed 20px radius and element's own border highlighted on hover and selection */}
                <div
                  className={`w-full h-full overflow-hidden flex flex-col items-center justify-between p-2 bg-[#202226] text-card-foreground shadow-md transition-colors duration-100 rounded-[20px] ${
                    isSelected
                      ? "border-2 border-[#0d99ff] shadow-[0_0_12px_rgba(13,153,255,0.35)]"
                      : mode === "edit"
                        ? "border-[1.5px] border-white/10 group-hover:border-[#0d99ff] group-hover:shadow-[0_0_8px_rgba(13,153,255,0.25)]"
                        : "border border-white/10"
                  }`}
                >
                  {/* Top Status Capsule Pill (Matching Seats Screen UI) */}
                  {isTaken ? (
                    <div className="w-full h-5.5 px-2 rounded-full bg-[#eab308] text-black flex items-center shadow-xs shrink-0 select-none pointer-events-none">
                      <span className="size-2.5 rounded-full bg-black/20 shrink-0" />
                      <span className="text-[11px] font-bold tracking-tight flex-1 text-center -ml-2.5 text-black">
                        Occupied
                      </span>
                    </div>
                  ) : isReserved ? (
                    <div className="w-full h-5.5 px-2 rounded-full bg-purple-500 text-white flex items-center shadow-xs shrink-0 select-none pointer-events-none">
                      <span className="size-2.5 rounded-full bg-black/25 shrink-0" />
                      <span className="text-[10.5px] font-bold tracking-tight flex-1 text-center -ml-2.5 text-white">
                        Reserved
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-5.5 px-2 rounded-full bg-[#1fc749] text-black flex items-center shadow-xs shrink-0 select-none pointer-events-none">
                      <span className="size-2.5 rounded-full bg-black/20 shrink-0" />
                      <span className="text-[11px] font-bold tracking-tight flex-1 text-center -ml-2.5 text-black">
                        Free
                      </span>
                    </div>
                  )}

                  {/* PC badge indicator if PC terminal */}
                  {el.type === "pc" && (
                    <div className="absolute top-7 right-2.5 text-sky-400 opacity-80 pointer-events-none">
                      <span className="text-[9px] font-bold font-mono">PC</span>
                    </div>
                  )}

                  {/* Center Card Content based on Status */}
                  {isTaken ? (
                    <div className="flex-1 w-full flex flex-col items-center justify-center min-w-0 py-0.5 pointer-events-none select-none">
                      <div className="size-8.5 rounded-xl bg-[#3f4145] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        <img
                          src="/images/avatars/female-01.svg"
                          alt="Occupant"
                          className="size-full object-cover"
                        />
                      </div>
                      <span className="text-[10.5px] font-bold text-white truncate max-w-full text-center leading-tight mt-1 px-1">
                        Anju Patel
                      </span>
                      <span className="mt-0.5 px-2 py-0.2 rounded-full bg-[#eab308] text-black text-[9px] font-bold font-mono tracking-tight shrink-0">
                        {el.label || "A-06"}
                      </span>
                    </div>
                  ) : isReserved ? (
                    <div className="flex-1 w-full flex flex-col items-center justify-center pointer-events-none select-none">
                      <span className="text-xl font-black font-mono tracking-tight text-white leading-none">
                        {el.label || "A-01"}
                      </span>
                      <span className="mt-1 px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-[9px] font-bold">
                        Reserved
                      </span>
                    </div>
                  ) : (
                    <div className="flex-1 w-full flex items-center justify-center pointer-events-none select-none">
                      <span className="text-2xl font-extrabold font-mono tracking-tight text-white leading-none">
                        {el.label || "A-01"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Figma Selection Overlay */}
                {renderFigmaSelectionControls()}
              </div>
            )
          }

          // Non-seat elements (cabin, pc, door, reception, pillar, shelf, water, ac, zone, label)
          let strokeColor = toolCfg.color
          let bgColor = `${toolCfg.color}18`
          let textColor = toolCfg.color

          if (isPreview && isBook) {
            const st = (el.status || "free") as SeatStatus
            if (st === "taken") {
              strokeColor = "hsl(var(--primary) / 0.6)"
              bgColor = "hsl(var(--primary) / 0.12)"
              textColor = "hsl(var(--primary))"
            } else if (st === "reserved") {
              strokeColor = "rgba(245, 158, 11, 0.6)"
              bgColor = "rgba(245, 158, 11, 0.12)"
              textColor = "rgb(217, 119, 6)"
            } else {
              strokeColor = "rgba(16, 185, 129, 0.6)"
              bgColor = "hsl(var(--card))"
              textColor = "hsl(var(--foreground))"
            }
          }

          if (el.type === "pillar") {
            bgColor = "#6b7280"
            strokeColor = "#4b5563"
            textColor = "#ffffff"
          }

          if (el.type === "label") {
            bgColor = "transparent"
            strokeColor = "transparent"
            textColor = "hsl(var(--foreground))"
          }

          const style: React.CSSProperties = {
            left: el.x,
            top: el.y,
            width: el.w,
            height: el.h,
            borderColor: strokeColor,
            backgroundColor: bgColor,
            color: textColor,
            zIndex: el.type === "zone" ? 0 : isSelected ? 30 : 2,
            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
            opacity: el.opacity !== undefined ? el.opacity / 100 : undefined,
            borderRadius: el.cornerRadius !== undefined ? `${el.cornerRadius}px` : undefined,
            borderTopLeftRadius: el.radiusTL !== undefined ? `${el.radiusTL}px` : undefined,
            borderTopRightRadius: el.radiusTR !== undefined ? `${el.radiusTR}px` : undefined,
            borderBottomLeftRadius: el.radiusBL !== undefined ? `${el.radiusBL}px` : undefined,
            borderBottomRightRadius: el.radiusBR !== undefined ? `${el.radiusBR}px` : undefined,
          }

          if (el.type === "zone") {
            style.borderStyle = "dashed"
            style.borderWidth = 2
            style.borderRadius = el.cornerRadius !== undefined ? el.cornerRadius : 16
            style.alignItems = "flex-start"
            style.justifyContent = "flex-start"
            style.padding = "6px 10px"
          }

          return (
            <div
              key={el.id}
              data-element-id={el.id}
              className={`group absolute flex items-center justify-center font-semibold text-xs select-none transition-colors duration-100 ${
                el.type === "zone"
                  ? "rounded-2xl"
                  : el.type === "pillar"
                    ? "rounded-md shadow-sm"
                    : "rounded-lg border-[1.5px] shadow-xs"
              } ${
                isSelected
                  ? "border-2 border-[#0d99ff] shadow-[0_0_12px_rgba(13,153,255,0.35)]"
                  : mode === "edit"
                    ? "hover:!border-[#0d99ff] hover:shadow-[0_0_8px_rgba(13,153,255,0.25)] cursor-pointer"
                    : ""
              } ${
                isPreview && isBook
                  ? "cursor-pointer hover:brightness-110 active:scale-95"
                  : "cursor-move"
              }`}
              style={{
                ...style,
                borderColor: isSelected ? "#0d99ff" : style.borderColor,
              }}
              title={
                isPreview && isBook
                  ? `${el.label || toolCfg.name} • ${
                      STATUS_CONFIG[el.status || "free"].label
                    } (Click to toggle)`
                  : `${toolCfg.name}: ${el.label}`
              }
            >
              {/* Element Label */}
              <span className="truncate px-1 pointer-events-none select-none text-center">
                {el.label || (el.type === "pillar" ? "" : toolCfg.name)}
              </span>

              {/* Figma Selection Overlay */}
              {renderFigmaSelectionControls()}
            </div>
          )
        })}
      </div>

      {/* Floating Dimension / Position Tooltip (Figma micro-feature) */}
      {dragTooltip && (
        <div
          className="fixed z-50 pointer-events-none px-2.5 py-1 rounded-md bg-[#18181b]/95 text-white font-mono text-[11px] font-bold shadow-xl border border-white/20 backdrop-blur-xs flex items-center gap-1.5"
          style={{ left: dragTooltip.x, top: dragTooltip.y }}
        >
          <span className="inline-block size-1.5 rounded-full bg-[#0d99ff]" />
          <span>{dragTooltip.text}</span>
        </div>
      )}
    </div>
  )
}
