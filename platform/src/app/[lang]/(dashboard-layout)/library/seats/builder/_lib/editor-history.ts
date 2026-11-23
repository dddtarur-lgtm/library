import type { CanvasElement } from "../seating-editor-types"

export interface ElementPatch {
  id: string
  before: Partial<CanvasElement>
  after: Partial<CanvasElement>
}

export type HistoryAction =
  | {
      type: "update-elements"
      patches: ElementPatch[]
      description?: string
      selectionBefore?: string[]
      selectionAfter?: string[]
    }
  | {
      type: "add-elements"
      elements: CanvasElement[]
      description?: string
      selectionBefore?: string[]
      selectionAfter?: string[]
    }
  | {
      type: "delete-elements"
      elements: CanvasElement[]
      indices: Array<{ id: string; index: number }>
      description?: string
      selectionBefore?: string[]
      selectionAfter?: string[]
    }
  | {
      type: "canvas-size"
      before: { width: number; height: number }
      after: { width: number; height: number }
      description?: string
      selectionBefore?: string[]
      selectionAfter?: string[]
    }
  | {
      type: "hall-name"
      before: string
      after: string
      description?: string
      selectionBefore?: string[]
      selectionAfter?: string[]
    }
  | {
      type: "transaction"
      actions: HistoryAction[]
      description?: string
      selectionBefore?: string[]
      selectionAfter?: string[]
    }

export interface HistoryItem {
  id: string
  timestamp: number
  action: HistoryAction
  selectionBefore?: string[]
  selectionAfter?: string[]
}

export interface DocumentState {
  elements: CanvasElement[]
  canvasWidth: number
  canvasHeight: number
  name: string
  selectedIds: string[]
}

/**
 * Checks whether an action actually represents a meaningful change.
 * If before and after values are identical, returns false to avoid polluting history.
 */
export function hasActionChanged(action: HistoryAction): boolean {
  switch (action.type) {
    case "update-elements": {
      if (!action.patches || action.patches.length === 0) return false
      return action.patches.some((p) => {
        const keys = Array.from(
          new Set([...Object.keys(p.before), ...Object.keys(p.after)])
        )
        return keys.some(
          (k) =>
            (p.before as Record<string, unknown>)[k] !==
            (p.after as Record<string, unknown>)[k]
        )
      })
    }
    case "add-elements":
    case "delete-elements":
      return !!action.elements && action.elements.length > 0
    case "canvas-size":
      return (
        action.before.width !== action.after.width ||
        action.before.height !== action.after.height
      )
    case "hall-name":
      return action.before !== action.after
    case "transaction":
      return !!action.actions && action.actions.some(hasActionChanged)
    default:
      return false
  }
}

/**
 * Applies a history action in either the "undo" or "redo" direction.
 * Updates only the affected elements without cloning the entire document.
 */
export function applyHistoryAction(
  action: HistoryAction,
  direction: "undo" | "redo",
  state: DocumentState
): DocumentState {
  switch (action.type) {
    case "update-elements": {
      const patchMap = new Map<string, Partial<CanvasElement>>()
      for (const p of action.patches) {
        patchMap.set(p.id, direction === "undo" ? p.before : p.after)
      }

      const nextElements = state.elements.map((el) => {
        const patch = patchMap.get(el.id)
        return patch ? { ...el, ...patch } : el
      })

      const nextSelected =
        direction === "undo" ? action.selectionBefore : action.selectionAfter

      return {
        ...state,
        elements: nextElements,
        selectedIds:
          nextSelected !== undefined ? nextSelected : state.selectedIds,
      }
    }

    case "add-elements": {
      const addedIds = new Set(action.elements.map((e) => e.id))

      if (direction === "undo") {
        // Undo adding: remove added elements
        const nextElements = state.elements.filter((e) => !addedIds.has(e.id))
        const nextSelected =
          action.selectionBefore !== undefined ? action.selectionBefore : []
        return {
          ...state,
          elements: nextElements,
          selectedIds: nextSelected,
        }
      } else {
        // Redo adding: append elements back
        const existingIds = new Set(state.elements.map((e) => e.id))
        const toAdd = action.elements.filter((e) => !existingIds.has(e.id))
        const nextElements = [...state.elements, ...toAdd]
        const nextSelected =
          action.selectionAfter !== undefined
            ? action.selectionAfter
            : action.elements.map((e) => e.id)
        return {
          ...state,
          elements: nextElements,
          selectedIds: nextSelected,
        }
      }
    }

    case "delete-elements": {
      const deletedIds = new Set(action.elements.map((e) => e.id))

      if (direction === "undo") {
        // Undo delete: restore deleted elements at their original indices if possible
        const nextElements = [...state.elements]
        // Sort by index ascending
        const sorted = [...action.indices].sort((a, b) => a.index - b.index)
        for (const item of sorted) {
          const el = action.elements.find((e) => e.id === item.id)
          if (el && !nextElements.some((e) => e.id === el.id)) {
            const idx = Math.min(Math.max(0, item.index), nextElements.length)
            nextElements.splice(idx, 0, el)
          }
        }
        const nextSelected =
          action.selectionBefore !== undefined
            ? action.selectionBefore
            : action.elements.map((e) => e.id)
        return {
          ...state,
          elements: nextElements,
          selectedIds: nextSelected,
        }
      } else {
        // Redo delete: remove elements again
        const nextElements = state.elements.filter((e) => !deletedIds.has(e.id))
        const nextSelected =
          action.selectionAfter !== undefined ? action.selectionAfter : []
        return {
          ...state,
          elements: nextElements,
          selectedIds: nextSelected,
        }
      }
    }

    case "canvas-size": {
      const target = direction === "undo" ? action.before : action.after
      const nextSelected =
        direction === "undo" ? action.selectionBefore : action.selectionAfter
      return {
        ...state,
        canvasWidth: target.width,
        canvasHeight: target.height,
        selectedIds: nextSelected !== undefined ? nextSelected : state.selectedIds,
      }
    }

    case "hall-name": {
      const target = direction === "undo" ? action.before : action.after
      const nextSelected =
        direction === "undo" ? action.selectionBefore : action.selectionAfter
      return {
        ...state,
        name: target,
        selectedIds: nextSelected !== undefined ? nextSelected : state.selectedIds,
      }
    }

    case "transaction": {
      let cur = { ...state }
      if (direction === "undo") {
        for (let i = action.actions.length - 1; i >= 0; i--) {
          cur = applyHistoryAction(action.actions[i], "undo", cur)
        }
        if (action.selectionBefore !== undefined) {
          cur.selectedIds = action.selectionBefore
        }
      } else {
        for (let i = 0; i < action.actions.length; i++) {
          cur = applyHistoryAction(action.actions[i], "redo", cur)
        }
        if (action.selectionAfter !== undefined) {
          cur.selectedIds = action.selectionAfter
        }
      }
      return cur
    }

    default:
      return state
  }
}
