"use client"

import { useParams } from "next/navigation"

import React, { use, useCallback, useEffect, useRef, useState } from "react"

import type { SeatingTemplate } from "@/data/seating-templates"
import type { LocaleType } from "@/types"

import { BottomBar } from "./_components/bottom-bar"
import { CanvasArea } from "./_components/canvas-area"
import { EditorTopBar } from "./_components/editor-top-bar"
import { GridGeneratorDialog } from "./_components/grid-generator-dialog"
import { JsonModal } from "./_components/json-modal"
import { LeftToolbar } from "./_components/left-toolbar"
import { RightPanel } from "./_components/right-panel"
import { TemplatePickerDialog } from "./_components/template-picker-dialog"
import {
  canPlaceWithoutCollision,
  computeHallSizeForElements,
  convertTemplateToElements,
  createElement,
  createFloorLayout,
  createSampleLayout,
  getDraftStorageKeyForFloor,
  getStorageKeyForFloor,
  GRID_SIZE,
  isBookable,
  renumberElements,
  SEATING_DRAFT_KEY,
  SEATING_STORAGE_KEY,
  type ActiveTool,
  type CanvasElement,
  type ElementType,
  type SeatStatus,
  type ViewportState,
} from "./seating-editor-types"
import {
  applyHistoryAction,
  hasActionChanged,
  type DocumentState,
  type ElementPatch,
  type HistoryAction,
  type HistoryItem,
} from "./_lib/editor-history"

function loadInitialState(floor?: string): {
  name: string
  elements: CanvasElement[]
  canvasWidth: number
  canvasHeight: number
  isDraft: boolean
} {
  const currentFloor = floor || "Ground Floor"
  const storageKey = getStorageKeyForFloor(currentFloor)
  const draftKey = getDraftStorageKeyForFloor(currentFloor)
  const sample = createFloorLayout(currentFloor)
  const defaultSize = computeHallSizeForElements(sample, 960, 600)
  const defaultName = `Central Library — ${currentFloor}`

  if (typeof window === "undefined") {
    return {
      name: defaultName,
      elements: sample,
      canvasWidth: defaultSize.width,
      canvasHeight: defaultSize.height,
      isDraft: false,
    }
  }
  try {
    // 1. Try draft first if user has in-progress work
    const draftRaw = localStorage.getItem(draftKey)
    const liveRaw = localStorage.getItem(storageKey)
    if (draftRaw) {
      const parsed = JSON.parse(draftRaw)
      if (parsed.elements && Array.isArray(parsed.elements)) {
        const size = computeHallSizeForElements(
          parsed.elements,
          parsed.canvasWidth || 960,
          parsed.canvasHeight || 600
        )
        return {
          name: parsed.name || defaultName,
          elements: parsed.elements,
          canvasWidth: parsed.canvasWidth || size.width,
          canvasHeight: parsed.canvasHeight || size.height,
          isDraft: draftRaw !== liveRaw,
        }
      }
    }

    // 2. Fallback to live published layout
    if (liveRaw) {
      const parsed = JSON.parse(liveRaw)
      if (Array.isArray(parsed)) {
        const size = computeHallSizeForElements(parsed, 960, 600)
        return {
          name: defaultName,
          elements: parsed,
          canvasWidth: size.width,
          canvasHeight: size.height,
          isDraft: false,
        }
      }
      if (parsed.elements && Array.isArray(parsed.elements)) {
        const size = computeHallSizeForElements(
          parsed.elements,
          parsed.canvasWidth || 960,
          parsed.canvasHeight || 600
        )
        return {
          name: parsed.name || defaultName,
          elements: parsed.elements,
          canvasWidth: parsed.canvasWidth || size.width,
          canvasHeight: parsed.canvasHeight || size.height,
          isDraft: false,
        }
      }
    }
  } catch {
    // fallback
  }
  return {
    name: defaultName,
    elements: sample,
    canvasWidth: defaultSize.width,
    canvasHeight: defaultSize.height,
    isDraft: false,
  }
}

export default function SeatBuilderPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  // Multi-floor awareness from URL query param
  const [currentFloor, setCurrentFloor] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("floor")
      if (p) return p
    }
    return "Ground Floor"
  })

  // Initialize data for active floor
  const [init] = useState(() => loadInitialState(currentFloor))
  const [name, setName] = useState(init.name)
  const [elements, setElements] = useState<CanvasElement[]>(init.elements)
  const [canvasWidth, setCanvasWidth] = useState<number>(init.canvasWidth)
  const [canvasHeight, setCanvasHeight] = useState<number>(init.canvasHeight)
  const [isSaved, setIsSaved] = useState(!init.isDraft)
  const [hallSettingsOpen, setHallSettingsOpen] = useState(false)

  // Multi-element selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeTool, setActiveTool] = useState<ActiveTool>("select")
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const [viewport, setViewport] = useState<ViewportState>({
    x: 80,
    y: 80,
    z: 0.9,
  })
  const [spacePressed, setSpacePressed] = useState(false)

  // Dialogs
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [gridGeneratorOpen, setGridGeneratorOpen] = useState(false)
  const [jsonModalOpen, setJsonModalOpen] = useState(false)

  // Synchronized refs for fresh values inside callbacks
  const elementsRef = useRef(elements)
  elementsRef.current = elements
  const canvasWidthRef = useRef(canvasWidth)
  canvasWidthRef.current = canvasWidth
  const canvasHeightRef = useRef(canvasHeight)
  canvasHeightRef.current = canvasHeight
  const nameRef = useRef(name)
  nameRef.current = name
  const selectedIdsRef = useRef(selectedIds)
  selectedIdsRef.current = selectedIds

  // Delta History Engine in React State (Reactively updates canUndo & canRedo buttons)
  const [past, setPast] = useState<HistoryItem[]>([])
  const [future, setFuture] = useState<HistoryItem[]>([])

  // Clipboard reference for Ctrl+C, Ctrl+X, Ctrl+V
  const clipboardRef = useRef<{ elements: CanvasElement[]; pasteCount: number } | null>(null)

  // Debounced keyboard arrow nudge session tracker (Figma micro-feature)
  const nudgeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const nudgeStartPositionsRef = useRef<Map<string, { x: number; y: number }> | null>(null)

  // Commit history action (delta / patch based, capped at 100 entries, clears redo stack)
  const pushHistoryAction = useCallback((action: HistoryAction) => {
    if (!hasActionChanged(action)) return
    const item: HistoryItem = {
      id: "h_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
      action,
      selectionBefore: action.selectionBefore ?? selectedIdsRef.current,
      selectionAfter: action.selectionAfter ?? selectedIdsRef.current,
    }
    setPast((prev) => [...prev.slice(-99), item])
    setFuture([])
    setIsSaved(false)
  }, [])

  // Flush any pending keyboard arrow nudge session into a single history entry
  const flushNudgeHistory = useCallback(() => {
    if (nudgeTimerRef.current) {
      clearTimeout(nudgeTimerRef.current)
      nudgeTimerRef.current = null
    }
    if (!nudgeStartPositionsRef.current) return

    const initialPositions = nudgeStartPositionsRef.current
    nudgeStartPositionsRef.current = null

    const movingIds = Array.from(initialPositions.keys())
    const patches: ElementPatch[] = []

    for (const [id, init] of initialPositions.entries()) {
      const cur = elementsRef.current.find((el) => el.id === id)
      if (cur && (cur.x !== init.x || cur.y !== init.y)) {
        patches.push({
          id,
          before: { x: init.x, y: init.y },
          after: { x: cur.x, y: cur.y },
        })
      }
    }

    if (patches.length > 0) {
      pushHistoryAction({
        type: "update-elements",
        patches,
        selectionBefore: movingIds,
        selectionAfter: movingIds,
        description: `Nudge ${patches.length} element(s)`,
      })
    }
  }, [pushHistoryAction])

  // Prevent any browser/window scrollbars while in canvas editor
  useEffect(() => {
    const origHtmlOverflow = document.documentElement.style.overflow
    const origBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = origHtmlOverflow
      document.body.style.overflow = origBodyOverflow
    }
  }, [])


  // Live element update on canvas at 60fps without polluting history
  const liveUpdateElements = useCallback((newElements: CanvasElement[]) => {
    setElements(newElements)
  }, [])

  const handleLiveUpdateElement = useCallback(
    (id: string, updates: Partial<CanvasElement>) => {
      setElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
      )
    },
    []
  )

  const handleCommitElementPatch = useCallback(
    (
      id: string,
      before: Partial<CanvasElement>,
      after: Partial<CanvasElement>,
      description?: string
    ) => {
      pushHistoryAction({
        type: "update-elements",
        patches: [{ id, before, after }],
        selectionBefore: [id],
        selectionAfter: [id],
        description,
      })
    },
    [pushHistoryAction]
  )

  // Undo implementation: updates ONLY affected elements via delta patches
  const handleUndo = useCallback(() => {
    flushNudgeHistory()

    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast
      const lastItem = prevPast[prevPast.length - 1]
      const nextPast = prevPast.slice(0, prevPast.length - 1)

      const currentState: DocumentState = {
        elements: elementsRef.current,
        canvasWidth: canvasWidthRef.current,
        canvasHeight: canvasHeightRef.current,
        name: nameRef.current,
        selectedIds: selectedIdsRef.current,
      }

      const nextState = applyHistoryAction(lastItem.action, "undo", currentState)

      setElements(nextState.elements)
      setCanvasWidth(nextState.canvasWidth)
      setCanvasHeight(nextState.canvasHeight)
      setName(nextState.name)
      setSelectedIds(nextState.selectedIds)
      setIsSaved(false)

      setFuture((prevFuture) => [lastItem, ...prevFuture])
      return nextPast
    })
  }, [flushNudgeHistory])

  // Redo implementation: updates ONLY affected elements via delta patches
  const handleRedo = useCallback(() => {
    flushNudgeHistory()

    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture
      const nextItem = prevFuture[0]
      const nextRemainingFuture = prevFuture.slice(1)

      const currentState: DocumentState = {
        elements: elementsRef.current,
        canvasWidth: canvasWidthRef.current,
        canvasHeight: canvasHeightRef.current,
        name: nameRef.current,
        selectedIds: selectedIdsRef.current,
      }

      const nextState = applyHistoryAction(nextItem.action, "redo", currentState)

      setElements(nextState.elements)
      setCanvasWidth(nextState.canvasWidth)
      setCanvasHeight(nextState.canvasHeight)
      setName(nextState.name)
      setSelectedIds(nextState.selectedIds)
      setIsSaved(false)

      setPast((prevPast) => [...prevPast.slice(-99), nextItem])
      return nextRemainingFuture
    })
  }, [flushNudgeHistory])

  // Element Actions
  const handleAddElement = useCallback(
    (tool: ElementType, x: number, y: number) => {
      const newEl = createElement(tool, x, y)
      const prevSelection = [...selectedIdsRef.current]
      setElements((prev) => [...prev, newEl])
      setSelectedIds([newEl.id])
      setActiveTool("select")

      pushHistoryAction({
        type: "add-elements",
        elements: [newEl],
        selectionBefore: prevSelection,
        selectionAfter: [newEl.id],
        description: `Add ${tool}`,
      })
    },
    [pushHistoryAction]
  )

  // Multi-delete (Transactions: deletes all in 1 entry, restored in 1 step)
  const handleDeleteElements = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return
      const curElements = elementsRef.current
      const deletedEls = curElements.filter((el) => ids.includes(el.id))
      if (deletedEls.length === 0) return
      const indices = ids.map((id) => ({
        id,
        index: curElements.findIndex((el) => el.id === id),
      }))
      const prevSelection = [...selectedIdsRef.current]

      setElements(curElements.filter((el) => !ids.includes(el.id)))
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))

      pushHistoryAction({
        type: "delete-elements",
        elements: deletedEls,
        indices,
        selectionBefore: prevSelection,
        selectionAfter: [],
        description: `Delete ${deletedEls.length} element(s)`,
      })
    },
    [pushHistoryAction]
  )

  // Multi-duplicate (Anti-stacking / Anti-collision, Transaction: 1 entry)
  const handleDuplicateElements = useCallback(
    (ids: string[]) => {
      const toDup = elementsRef.current.filter((el) => ids.includes(el.id))
      if (toDup.length === 0) return

      let bestOx = GRID_SIZE
      let bestOy = GRID_SIZE

      for (let step = 1; step <= 8; step++) {
        const testOx = step * GRID_SIZE
        const testOy = step * GRID_SIZE

        const fits = toDup.every((src) => {
          const testEl = {
            ...src,
            x: src.x + testOx,
            y: src.y + testOy,
          }
          if (
            testEl.x + testEl.w > canvasWidthRef.current ||
            testEl.y + testEl.h > canvasHeightRef.current
          )
            return false
          return canPlaceWithoutCollision(testEl, elementsRef.current)
        })

        if (fits) {
          bestOx = testOx
          bestOy = testOy
          break
        }
      }

      const duplicated: CanvasElement[] = toDup.map((src) => ({
        ...src,
        id: "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        x: Math.min(canvasWidthRef.current - src.w, src.x + bestOx),
        y: Math.min(canvasHeightRef.current - src.h, src.y + bestOy),
        auto: src.auto,
      }))

      const prevSelection = [...selectedIdsRef.current]
      const newIds = duplicated.map((d) => d.id)

      setElements((prev) => [...prev, ...duplicated])
      setSelectedIds(newIds)

      pushHistoryAction({
        type: "add-elements",
        elements: duplicated,
        selectionBefore: prevSelection,
        selectionAfter: newIds,
        description: `Duplicate ${duplicated.length} element(s)`,
      })
    },
    [pushHistoryAction]
  )

  // Copy selected elements (Ctrl+C / Cmd+C)
  const handleCopy = useCallback(() => {
    const selected = elementsRef.current.filter((el) =>
      selectedIdsRef.current.includes(el.id)
    )
    if (selected.length === 0) return

    clipboardRef.current = {
      elements: JSON.parse(JSON.stringify(selected)),
      pasteCount: 0,
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(
          JSON.stringify({ type: "library-seats-clipboard", elements: selected })
        )
      }
    } catch {}
  }, [])

  // Cut selected elements (Ctrl+X / Cmd+X)
  const handleCut = useCallback(() => {
    const selected = elementsRef.current.filter((el) =>
      selectedIdsRef.current.includes(el.id)
    )
    if (selected.length === 0) return

    clipboardRef.current = {
      elements: JSON.parse(JSON.stringify(selected)),
      pasteCount: 0,
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(
          JSON.stringify({ type: "library-seats-clipboard", elements: selected })
        )
      }
    } catch {}

    handleDeleteElements(selectedIdsRef.current)
  }, [handleDeleteElements])

  // Paste elements from clipboard (Ctrl+V / Cmd+V with smart offset & history)
  const handlePaste = useCallback(() => {
    if (!clipboardRef.current || clipboardRef.current.elements.length === 0) return

    clipboardRef.current.pasteCount += 1
    const offset = clipboardRef.current.pasteCount * GRID_SIZE

    const prevSelection = [...selectedIdsRef.current]
    const curW = canvasWidthRef.current
    const curH = canvasHeightRef.current

    const pastedElements: CanvasElement[] = clipboardRef.current.elements.map((src) => {
      const newX = Math.min(curW - src.w, Math.max(0, src.x + offset))
      const newY = Math.min(curH - src.h, Math.max(0, src.y + offset))
      return {
        ...src,
        id: "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        x: newX,
        y: newY,
      }
    })

    const newIds = pastedElements.map((el) => el.id)

    setElements((prev) => [...prev, ...pastedElements])
    setSelectedIds(newIds)

    pushHistoryAction({
      type: "add-elements",
      elements: pastedElements,
      selectionBefore: prevSelection,
      selectionAfter: newIds,
      description: `Paste ${pastedElements.length} element(s)`,
    })
  }, [pushHistoryAction])

  // Add Custom Generated Seat Grid (e.g. 5x6 = 30 seats, Transaction: 1 entry)
  const handleAddGrid = useCallback(
    (newCells: CanvasElement[], neededW?: number, neededH?: number) => {
      const curW = canvasWidthRef.current
      const curH = canvasHeightRef.current
      const newW = neededW && neededW > curW ? neededW : curW
      const newH = neededH && neededH > curH ? neededH : curH

      const prevSelection = [...selectedIdsRef.current]
      const newIds = newCells.map((c) => c.id)

      if (newW !== curW || newH !== curH) {
        setCanvasWidth(newW)
        setCanvasHeight(newH)
      }
      setElements((prev) => [...prev, ...newCells])
      setSelectedIds(newIds)

      const actions: HistoryAction[] = []
      if (newW !== curW || newH !== curH) {
        actions.push({
          type: "canvas-size",
          before: { width: curW, height: curH },
          after: { width: newW, height: newH },
        })
      }
      actions.push({
        type: "add-elements",
        elements: newCells,
        selectionBefore: prevSelection,
        selectionAfter: newIds,
      })

      pushHistoryAction({
        type: "transaction",
        actions,
        selectionBefore: prevSelection,
        selectionAfter: newIds,
        description: `Generate ${newCells.length} seat grid`,
      })
    },
    [pushHistoryAction]
  )

  const handleCycleStatus = useCallback(
    (id: string) => {
      const el = elementsRef.current.find((e) => e.id === id)
      if (!el || !isBookable(el.type)) return
      const statuses: SeatStatus[] = ["free", "taken", "reserved"]
      const curIdx = statuses.indexOf(el.status || "free")
      const nextStatus = statuses[(curIdx + 1) % statuses.length]

      setElements((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
      )
      pushHistoryAction({
        type: "update-elements",
        patches: [
          {
            id,
            before: { status: el.status || "free" },
            after: { status: nextStatus },
          },
        ],
        selectionBefore: [id],
        selectionAfter: [id],
        description: `Toggle status ${el.label || id}`,
      })
    },
    [pushHistoryAction]
  )

  // Zoom Controls (Non-document state: NEVER saved in history)
  const handleZoomIn = () => {
    setViewport((v) => ({ ...v, z: Math.min(3.0, +(v.z * 1.2).toFixed(2)) }))
  }

  const handleZoomOut = () => {
    setViewport((v) => ({ ...v, z: Math.max(0.25, +(v.z * 0.85).toFixed(2)) }))
  }

  const handleZoomReset = () => {
    setViewport({ x: 80, y: 80, z: 0.9 })
  }

  // Synchronized ref for keyboard shortcuts to keep effect dependency array static and avoid HMR re-binding
  const keyboardActionsRef = useRef({
    handleUndo,
    handleRedo,
    handleCopy,
    handleCut,
    handlePaste,
    handleDuplicateElements,
    handleDeleteElements,
    flushNudgeHistory,
    mode,
  })
  keyboardActionsRef.current = {
    handleUndo,
    handleRedo,
    handleCopy,
    handleCut,
    handlePaste,
    handleDuplicateElements,
    handleDeleteElements,
    flushNudgeHistory,
    mode,
  }

  // Keyboard Shortcuts Handler (Static [] deps prevents HMR hook array size mismatch)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      const actions = keyboardActionsRef.current
      const key = e.key.toLowerCase()

      if (e.key === " ") {
        setSpacePressed(true)
        e.preventDefault()
        return
      }

      // Undo / Redo Shortcuts (Figma standard)
      if ((e.ctrlKey || e.metaKey) && key === "z") {
        e.preventDefault()
        if (e.shiftKey) actions.handleRedo()
        else actions.handleUndo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && key === "y") {
        e.preventDefault()
        actions.handleRedo()
        return
      }

      // Copy (Ctrl+C / Cmd+C)
      if ((e.ctrlKey || e.metaKey) && key === "c" && actions.mode === "edit") {
        if (selectedIdsRef.current.length > 0) {
          e.preventDefault()
          actions.handleCopy()
          return
        }
      }

      // Cut (Ctrl+X / Cmd+X)
      if ((e.ctrlKey || e.metaKey) && key === "x" && actions.mode === "edit") {
        if (selectedIdsRef.current.length > 0) {
          e.preventDefault()
          actions.handleCut()
          return
        }
      }

      // Paste (Ctrl+V / Cmd+V)
      if ((e.ctrlKey || e.metaKey) && key === "v" && actions.mode === "edit") {
        e.preventDefault()
        actions.handlePaste()
        return
      }

      // Duplicate selected
      if ((e.ctrlKey || e.metaKey) && key === "d") {
        e.preventDefault()
        if (selectedIdsRef.current.length > 0) {
          actions.handleDuplicateElements(selectedIdsRef.current)
        }
        return
      }

      // Delete selected
      if (key === "delete" || key === "backspace") {
        if (selectedIdsRef.current.length > 0) {
          e.preventDefault()
          actions.handleDeleteElements(selectedIdsRef.current)
          return
        }
      }

      // Select All (Ctrl+A / Cmd+A)
      if ((e.ctrlKey || e.metaKey) && key === "a" && actions.mode === "edit") {
        e.preventDefault()
        setSelectedIds(elementsRef.current.map((el) => el.id))
        return
      }

      // Arrow keys: Nudge selected element(s) with live 60fps update & single debounced history entry
      if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key) &&
        selectedIdsRef.current.length > 0 &&
        actions.mode === "edit"
      ) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 2
        let dx = 0
        let dy = 0
        if (key === "arrowup") dy = -step
        if (key === "arrowdown") dy = step
        if (key === "arrowleft") dx = -step
        if (key === "arrowright") dx = step

        // Initialize start positions map on first arrow press of session
        if (!nudgeStartPositionsRef.current) {
          const map = new Map<string, { x: number; y: number }>()
          elementsRef.current.forEach((el) => {
            if (selectedIdsRef.current.includes(el.id)) {
              map.set(el.id, { x: el.x, y: el.y })
            }
          })
          nudgeStartPositionsRef.current = map
        }

        // Live update on canvas immediately
        const updated = elementsRef.current.map((el) => {
          if (selectedIdsRef.current.includes(el.id)) {
            const newX = Math.max(0, Math.min(canvasWidthRef.current - el.w, el.x + dx))
            const newY = Math.max(0, Math.min(canvasHeightRef.current - el.h, el.y + dy))
            return { ...el, x: newX, y: newY }
          }
          return el
        })
        setElements(updated)

        // Reset 500ms idle timer to commit 1 history entry
        if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current)
        nudgeTimerRef.current = setTimeout(actions.flushNudgeHistory, 500)
        return
      }

      // Escape to select
      if (key === "escape") {
        setActiveTool("select")
        setSelectedIds([])
        return
      }

      // V -> Select, H -> Hand
      if (key === "v") {
        setActiveTool("select")
        return
      }
      if (key === "h") {
        setActiveTool("hand")
        return
      }

      // Tool shortcuts (S, C, P, D, R, W, B, O, A, Z, T)
      if (actions.mode === "edit" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const toolMap: Record<string, ElementType> = {
          s: "seat",
          c: "cabin",
          p: "pc",
          d: "door",
          r: "reception",
          w: "pillar",
          b: "shelf",
          o: "water",
          a: "ac",
          z: "zone",
          t: "label",
        }
        if (toolMap[key]) {
          setActiveTool(toolMap[key])
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") {
        setSpacePressed(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Template Loader (Transaction: replaces document elements in 1 step)
  const handleSelectTemplate = useCallback(
    (template: SeatingTemplate) => {
      const { elements: converted, canvasWidth: newW, canvasHeight: newH } =
        convertTemplateToElements(template)

      const prevElements = elementsRef.current
      const prevW = canvasWidthRef.current
      const prevH = canvasHeightRef.current
      const prevName = nameRef.current
      const prevSelection = [...selectedIdsRef.current]

      const indices = prevElements.map((el, i) => ({ id: el.id, index: i }))

      setName(template.name)
      setCanvasWidth(newW)
      setCanvasHeight(newH)
      setElements(converted)
      setSelectedIds([])
      setTemplatePickerOpen(false)

      const scale = Math.min(1.0, Math.max(0.45, 840 / Math.max(newW, newH)))
      setViewport({ x: 60, y: 60, z: Number(scale.toFixed(2)) })

      const actions: HistoryAction[] = [
        {
          type: "hall-name",
          before: prevName,
          after: template.name,
          selectionBefore: prevSelection,
          selectionAfter: [],
        },
        {
          type: "canvas-size",
          before: { width: prevW, height: prevH },
          after: { width: newW, height: newH },
          selectionBefore: prevSelection,
          selectionAfter: [],
        },
      ]

      if (prevElements.length > 0) {
        actions.push({
          type: "delete-elements",
          elements: prevElements,
          indices,
          selectionBefore: prevSelection,
          selectionAfter: [],
        })
      }
      actions.push({
        type: "add-elements",
        elements: converted,
        selectionBefore: [],
        selectionAfter: [],
      })

      pushHistoryAction({
        type: "transaction",
        actions,
        selectionBefore: prevSelection,
        selectionAfter: [],
        description: `Apply template: ${template.name}`,
      })
    },
    [pushHistoryAction]
  )

  // Auto-fit preview box to all current elements (Single canvas-size entry)
  const handleAutoFitCanvas = useCallback(() => {
    const fitted = computeHallSizeForElements(elementsRef.current, 960, 600)
    const prevW = canvasWidthRef.current
    const prevH = canvasHeightRef.current
    if (fitted.width === prevW && fitted.height === prevH) return

    setCanvasWidth(fitted.width)
    setCanvasHeight(fitted.height)
    pushHistoryAction({
      type: "canvas-size",
      before: { width: prevW, height: prevH },
      after: { width: fitted.width, height: fitted.height },
      selectionBefore: selectedIdsRef.current,
      selectionAfter: selectedIdsRef.current,
      description: "Auto-Fit Canvas Size",
    })
  }, [pushHistoryAction])

  // Manual canvas dimension adjustment
  const handleCanvasSizeChange = useCallback(
    (w: number, h: number, commit = false) => {
      const newW = Math.max(600, w)
      const newH = Math.max(400, h)
      const prevW = canvasWidthRef.current
      const prevH = canvasHeightRef.current

      setCanvasWidth(newW)
      setCanvasHeight(newH)

      if (commit && (newW !== prevW || newH !== prevH)) {
        pushHistoryAction({
          type: "canvas-size",
          before: { width: prevW, height: prevH },
          after: { width: newW, height: newH },
          selectionBefore: selectedIdsRef.current,
          selectionAfter: selectedIdsRef.current,
          description: "Resize Canvas",
        })
      }
    },
    [pushHistoryAction]
  )

  // Floor Switcher handler (saves current draft and loads target floor)
  const handleFloorChange = useCallback(
    (newFloor: string) => {
      if (newFloor === currentFloor) return

      // 1. Auto-save current floor draft
      try {
        const curDraftKey = getDraftStorageKeyForFloor(currentFloor)
        localStorage.setItem(
          curDraftKey,
          JSON.stringify({
            name: nameRef.current,
            elements: elementsRef.current,
            canvasWidth: canvasWidthRef.current,
            canvasHeight: canvasHeightRef.current,
            floor: currentFloor,
          })
        )
      } catch {}

      // 2. Load next floor layout
      const nextInit = loadInitialState(newFloor)
      setCurrentFloor(newFloor)
      setName(nextInit.name)
      setElements(nextInit.elements)
      setCanvasWidth(nextInit.canvasWidth)
      setCanvasHeight(nextInit.canvasHeight)
      setSelectedIds([])
      setIsSaved(!nextInit.isDraft)
      setPast([])
      setFuture([])

      // 3. Update URL query param without reload
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        url.searchParams.set("floor", newFloor)
        window.history.replaceState({}, "", url.toString())
      }
    },
    [currentFloor]
  )

  // Debounced auto-save draft to localStorage whenever elements or canvas size change
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const draftKey = getDraftStorageKeyForFloor(currentFloor)
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            name,
            elements,
            canvasWidth,
            canvasHeight,
            floor: currentFloor,
          })
        )
      } catch {
        // quota or SSR
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [name, elements, canvasWidth, canvasHeight, currentFloor])

  // Save / Publish (Only writes to live blueprint on explicit Publish click)
  const handlePublish = useCallback(() => {
    try {
      const storageKey = getStorageKeyForFloor(currentFloor)
      const draftKey = getDraftStorageKeyForFloor(currentFloor)
      const payload = JSON.stringify({
        name,
        elements,
        canvasWidth,
        canvasHeight,
        floor: currentFloor,
      })
      localStorage.setItem(storageKey, payload)
      localStorage.setItem(draftKey, payload)

      // Also sync main storage key if Ground Floor for backward compatibility
      if (currentFloor === "Ground Floor") {
        localStorage.setItem(SEATING_STORAGE_KEY, payload)
        localStorage.setItem(SEATING_DRAFT_KEY, payload)
      }

      // Broadcast storage event to sync live map (/pages/seats) in real time
      window.dispatchEvent(new Event("storage"))
      setIsSaved(true)
    } catch {
      // storage error
    }
  }, [name, elements, canvasWidth, canvasHeight, currentFloor])

  // Reset sample layout (Transaction: 1 step)
  const handleResetSample = useCallback(() => {
    const sample = createSampleLayout()
    const size = computeHallSizeForElements(sample, 960, 600)

    const prevElements = elementsRef.current
    const prevW = canvasWidthRef.current
    const prevH = canvasHeightRef.current
    const prevName = nameRef.current
    const prevSelection = [...selectedIdsRef.current]

    const indices = prevElements.map((el, i) => ({ id: el.id, index: i }))

    setName("Central Library — Hall 1")
    setCanvasWidth(size.width)
    setCanvasHeight(size.height)
    setElements(sample)
    setSelectedIds([])
    setViewport({ x: 80, y: 80, z: 0.9 })

    const actions: HistoryAction[] = [
      {
        type: "hall-name",
        before: prevName,
        after: "Central Library — Hall 1",
      },
      {
        type: "canvas-size",
        before: { width: prevW, height: prevH },
        after: { width: size.width, height: size.height },
      },
    ]

    if (prevElements.length > 0) {
      actions.push({
        type: "delete-elements",
        elements: prevElements,
        indices,
        selectionBefore: prevSelection,
        selectionAfter: [],
      })
    }
    actions.push({
      type: "add-elements",
      elements: sample,
      selectionBefore: [],
      selectionAfter: [],
    })

    pushHistoryAction({
      type: "transaction",
      actions,
      selectionBefore: prevSelection,
      selectionAfter: [],
      description: "Reset to sample layout",
    })
  }, [pushHistoryAction])

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden overscroll-none select-none z-[70] bg-background">
      {/* Interactive Freeform Canvas */}
      <CanvasArea
        elements={elements}
        selectedIds={selectedIds}
        activeTool={activeTool}
        mode={mode}
        viewport={viewport}
        spacePressed={spacePressed}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        hallName={name}
        onViewportChange={setViewport}
        onSelectElements={setSelectedIds}
        onLiveUpdateElements={liveUpdateElements}
        onCommitElements={liveUpdateElements}
        onCommitHistoryAction={pushHistoryAction}
        onAddElement={handleAddElement}
        onCycleStatus={handleCycleStatus}
        onCanvasSizeChange={(w, h) => handleCanvasSizeChange(w, h, false)}
        onOpenHallSettings={() => setHallSettingsOpen((prev) => !prev)}
        onDuplicateSelected={handleDuplicateElements}
        onDeleteSelected={handleDeleteElements}
      />

      {/* Floating Top Pill Toolbar */}
      <EditorTopBar
        lang={lang}
        name={name}
        currentFloor={currentFloor}
        mode={mode}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        isSaved={isSaved}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        onNameChange={(newName) => {
          setName(newName)
          setIsSaved(false)
        }}
        onNameCommit={(oldName, newName) => {
          pushHistoryAction({
            type: "hall-name",
            before: oldName,
            after: newName,
            description: `Rename layout to "${newName}"`,
          })
        }}
        onFloorChange={handleFloorChange}
        onModeChange={(m) => {
          setMode(m)
          setActiveTool("select")
          setSelectedIds([])
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenTemplates={() => setTemplatePickerOpen(true)}
        onOpenGridGenerator={() => setGridGeneratorOpen(true)}
        onOpenJson={() => setJsonModalOpen(true)}
        onPublish={handlePublish}
        onCanvasSizeChange={(w, h) => handleCanvasSizeChange(w, h, true)}
        onAutoFitCanvas={handleAutoFitCanvas}
      />

      {/* Floating Left Toolbar (Edit mode only) */}
      {mode === "edit" && (
        <LeftToolbar
          activeTool={activeTool}
          onSelectTool={(tool) => {
            setActiveTool(tool)
            if (tool !== "select") setSelectedIds([])
          }}
        />
      )}

      {/* Floating Right Sidebar (Properties / Layers Toggle / Multi-select / Live Stats) */}
      <RightPanel
        mode={mode}
        elements={elements}
        selectedIds={selectedIds}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        hallName={name}
        onSelectElement={(id) => setSelectedIds(id ? [id] : [])}
        onLiveUpdateElement={handleLiveUpdateElement}
        onCommitElementPatch={handleCommitElementPatch}
        onCommitHistoryAction={pushHistoryAction}
        onDuplicate={handleDuplicateElements}
        onDelete={handleDeleteElements}
        onClearSelection={() => setSelectedIds([])}
        onCanvasSizeChange={handleCanvasSizeChange}
        onAutoFitCanvas={handleAutoFitCanvas}
        hallSettingsOpen={hallSettingsOpen}
        onCloseHallSettings={() => setHallSettingsOpen(false)}
      />

      {/* Floating Bottom Zoom Bar */}
      <BottomBar
        zoom={viewport.z}
        mode={mode}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
      />

      {/* Custom Seat Grid Generator Dialog (e.g. 5x6 Matrix) */}
      <GridGeneratorDialog
        open={gridGeneratorOpen}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        onClose={() => setGridGeneratorOpen(false)}
        onAddGrid={handleAddGrid}
      />

      {/* Template Picker Dialog (20 Ready Layouts) */}
      <TemplatePickerDialog
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* JSON Modal for Layout Export / Import / Reset */}
      <JsonModal
        open={jsonModalOpen}
        name={name}
        elements={elements}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        onClose={() => setJsonModalOpen(false)}
        onLoadLayout={(loadedName, loadedElements, loadedW, loadedH) => {
          const prevElements = elementsRef.current
          const prevW = canvasWidthRef.current
          const prevH = canvasHeightRef.current
          const prevName = nameRef.current

          setName(loadedName)
          if (loadedW) setCanvasWidth(loadedW)
          if (loadedH) setCanvasHeight(loadedH)
          setElements(loadedElements)
          setSelectedIds([])

          const actions: HistoryAction[] = [
            { type: "hall-name", before: prevName, after: loadedName },
            {
              type: "canvas-size",
              before: { width: prevW, height: prevH },
              after: { width: loadedW || prevW, height: loadedH || prevH },
            },
            {
              type: "delete-elements",
              elements: prevElements,
              indices: prevElements.map((el, i) => ({ id: el.id, index: i })),
            },
            {
              type: "add-elements",
              elements: loadedElements,
            },
          ]
          pushHistoryAction({
            type: "transaction",
            actions,
            description: "Load layout JSON",
          })
        }}
        onResetSample={handleResetSample}
      />
    </div>
  )
}
