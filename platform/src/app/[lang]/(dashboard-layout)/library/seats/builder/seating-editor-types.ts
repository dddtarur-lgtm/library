import {
  Armchair,
  BookOpen,
  Building2,
  DoorOpen,
  Droplets,
  LayoutGrid,
  Monitor,
  Shield,
  Square,
  Type,
  Wind,
} from "lucide-react"

import type { SeatingTemplate } from "@/data/seating-templates"

export type ElementType =
  | "seat"
  | "cabin"
  | "pc"
  | "door"
  | "reception"
  | "pillar"
  | "shelf"
  | "water"
  | "ac"
  | "zone"
  | "label"

export type ActiveTool = "select" | "hand" | ElementType

export type SeatStatus = "free" | "taken" | "reserved"

export interface CanvasElement {
  id: string
  type: ElementType
  x: number
  y: number
  w: number
  h: number
  label: string
  status?: SeatStatus
  auto?: boolean
  rotation?: number
  opacity?: number
  cornerRadius?: number
  radiusTL?: number
  radiusTR?: number
  radiusBL?: number
  radiusBR?: number
}

export interface ViewportState {
  x: number
  y: number
  z: number
}

export const GRID_SIZE = 20

export function snap(val: number, step = GRID_SIZE): number {
  return Math.round(val / step) * step
}

export const SEATING_STORAGE_KEY = "lib-seating-v2"
export const SEATING_DRAFT_KEY = "lib-seating-draft-v2"
export const SEATS_DATA_STORAGE_KEY = "lib-seats-data-v2"

export function getFloorSlug(floor?: string): string {
  if (!floor) return "main"
  return floor.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}

export function getStorageKeyForFloor(floor?: string): string {
  if (!floor || floor.toLowerCase().includes("ground")) return SEATING_STORAGE_KEY
  return `${SEATING_STORAGE_KEY}-${getFloorSlug(floor)}`
}

export function getDraftStorageKeyForFloor(floor?: string): string {
  if (!floor || floor.toLowerCase().includes("ground")) return SEATING_DRAFT_KEY
  return `${SEATING_DRAFT_KEY}-${getFloorSlug(floor)}`
}

export interface ToolDef {
  type: ElementType
  name: string
  key: string
  icon: any
  defaultW: number
  defaultH: number
  color: string
  defaultLabel?: string
  isBookable?: boolean
}

export const TOOLS_CONFIG: Record<ElementType, ToolDef> = {
  seat: {
    type: "seat",
    name: "Seat",
    key: "S",
    icon: Armchair,
    defaultW: 88,
    defaultH: 116,
    color: "#16a34a",
    isBookable: true,
  },
  cabin: {
    type: "cabin",
    name: "Silent Cabin",
    key: "C",
    icon: Shield,
    defaultW: 180,
    defaultH: 110,
    color: "#6366f1",
    isBookable: true,
  },
  pc: {
    type: "pc",
    name: "PC Terminal",
    key: "P",
    icon: Monitor,
    defaultW: 88,
    defaultH: 116,
    color: "#2563eb",
    isBookable: true,
  },
  door: {
    type: "door",
    name: "Entry Door",
    key: "D",
    icon: DoorOpen,
    defaultW: 60,
    defaultH: 20,
    color: "#f59e0b",
    defaultLabel: "Door",
  },
  reception: {
    type: "reception",
    name: "Reception Desk",
    key: "R",
    icon: Building2,
    defaultW: 120,
    defaultH: 40,
    color: "#10b981",
    defaultLabel: "Reception",
  },
  pillar: {
    type: "pillar",
    name: "Pillar / Wall",
    key: "W",
    icon: Square,
    defaultW: 40,
    defaultH: 40,
    color: "#6b7280",
    defaultLabel: "",
  },
  shelf: {
    type: "shelf",
    name: "Book Shelf",
    key: "B",
    icon: BookOpen,
    defaultW: 120,
    defaultH: 24,
    color: "#a16207",
    defaultLabel: "Book shelf",
  },
  water: {
    type: "water",
    name: "RO Water Point",
    key: "O",
    icon: Droplets,
    defaultW: 32,
    defaultH: 32,
    color: "#06b6d4",
    defaultLabel: "RO",
  },
  ac: {
    type: "ac",
    name: "Air Conditioner",
    key: "A",
    icon: Wind,
    defaultW: 60,
    defaultH: 24,
    color: "#64748b",
    defaultLabel: "AC",
  },
  zone: {
    type: "zone",
    name: "Zone",
    key: "Z",
    icon: LayoutGrid,
    defaultW: 240,
    defaultH: 140,
    color: "#e11d6a",
    defaultLabel: "New zone",
  },
  label: {
    type: "label",
    name: "Label",
    key: "T",
    icon: Type,
    defaultW: 80,
    defaultH: 24,
    color: "#777c8f",
    defaultLabel: "Label",
  },
}

export const STATUS_CONFIG: Record<SeatStatus, { label: string; color: string }> = {
  free: { label: "Free", color: "#16a34a" },
  taken: { label: "Occupied", color: "#5b5bf0" },
  reserved: { label: "Reserved", color: "#f59e0b" },
}

export const isBookable = (type: ElementType): boolean =>
  type === "seat" || type === "pc" || type === "cabin"

export function isOverlapping(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  )
}

export function canPlaceWithoutCollision(
  proposed: { x: number; y: number; w: number; h: number; type?: ElementType },
  existingElements: CanvasElement[],
  ignoreIds: string[] = []
): boolean {
  if (proposed.type === "zone") return true
  return !existingElements.some((el) => {
    if (ignoreIds.includes(el.id)) return false
    if (el.type === "zone") return false
    return isOverlapping(proposed, el)
  })
}

let seq = 0
export const uid = (): string =>
  "e" + Date.now().toString(36) + (seq++).toString(36)

export function renumberElements(els: CanvasElement[]): CanvasElement[] {
  const m: Record<string, string> = {}

  // Renumber seats and PCs
  ;(["seat", "pc"] as const).forEach((t) => {
    const list = els
      .filter((e) => e.type === t && e.auto !== false)
      .sort((a, b) => a.y - b.y || a.x - b.x)

    let r = -1
    let ry = -1e9
    let n = 0

    list.forEach((e) => {
      if (t === "pc") {
        m[e.id] = `PC-${String(++n).padStart(2, "0")}`
        return
      }
      if (e.y - ry > 30) {
        r++
        ry = e.y
        n = 0
      }
      m[e.id] = `${String.fromCharCode(65 + (r % 26))}-${String(++n).padStart(2, "0")}`
    })
  })

  // Renumber cabins
  els
    .filter((e) => e.type === "cabin" && e.auto !== false)
    .sort((a, b) => a.x - b.x || a.y - b.y)
    .forEach((e, i) => {
      m[e.id] = `Cabin ${i + 1}`
    })

  return els.map((e) => (m[e.id] !== undefined ? { ...e, label: m[e.id] } : e))
}

export function createElement(
  type: ElementType,
  x: number,
  y: number,
  overrides?: Partial<CanvasElement>
): CanvasElement {
  const t = TOOLS_CONFIG[type]
  return {
    id: uid(),
    type,
    x,
    y,
    w: t.defaultW,
    h: t.defaultH,
    label: t.defaultLabel || "",
    status: "free",
    ...overrides,
  }
}

export function createSampleLayout(): CanvasElement[] {
  const a: CanvasElement[] = []

  // Row 1 & 2: 5 seats each (A-01 to A-05, B-01 to B-05) with 88x116 cards matching reference UI
  for (let i = 0; i < 5; i++) {
    for (let r = 0; r < 2; r++) {
      a.push(createElement("seat", 50 + i * 104, 60 + r * 132, { w: 88, h: 116 }))
    }
  }

  // Dedicated PC Station (PC-01, PC-02)
  a.push(
    createElement("pc", 590, 60, { w: 88, h: 116 }),
    createElement("pc", 590, 192, { w: 88, h: 116 })
  )

  // Architectural Pillar in walkway
  a.push(createElement("pillar", 710, 120, { w: 32, h: 32, label: "" }))

  // Facilities & Amenities
  a.push(
    createElement("door", 50, 16, { w: 80, h: 26 }),
    createElement("ac", 340, 16, { w: 60, h: 24 }),
    createElement("reception", 770, 16, { w: 140, h: 40 }),
    createElement("water", 930, 80, { w: 36, h: 36 })
  )

  // Girls Only Wing Zone
  a.push(
    createElement("zone", 40, 340, {
      w: 460,
      h: 290,
      label: "Girls only wing",
    })
  )

  // Row 3 & 4: 4 seats each inside zone (C-01 to C-04, D-01 to D-04) with generous spacing
  for (let i = 0; i < 4; i++) {
    for (let r = 0; r < 2; r++) {
      a.push(createElement("seat", 60 + i * 104, 370 + r * 132, { w: 88, h: 116 }))
    }
  }

  // Silent Study Cabins
  a.push(
    createElement("cabin", 540, 350, { w: 180, h: 110 }),
    createElement("cabin", 750, 350, { w: 180, h: 110 })
  )

  // Bookshelf
  a.push(createElement("shelf", 540, 490, { w: 390, h: 28 }))

  const s = renumberElements(a)
  s.forEach((e, i) => {
    if (isBookable(e.type)) {
      if (i % 3 === 0) e.status = "taken"
      else if (i % 7 === 4) e.status = "reserved"
    }
  })
  return s
}

export function createFloorLayout(floor?: string): CanvasElement[] {
  if (!floor || floor.toLowerCase().includes("ground")) {
    return createSampleLayout()
  }
  if (floor.toLowerCase().includes("1st") || floor.toLowerCase().includes("first")) {
    // 1st Floor - Girls Silent Wing (Row G-01 to G-16, 2 cabins, bookshelf, AC, entrance)
    const a: CanvasElement[] = []
    a.push(createElement("door", 60, 20, { w: 80, h: 26 }))
    a.push(createElement("ac", 340, 20, { w: 60, h: 24 }))
    a.push(createElement("water", 820, 30, { w: 36, h: 36 }))
    a.push(
      createElement("zone", 40, 70, {
        w: 520,
        h: 460,
        label: "Silent Study Zone — Girls Only",
      })
    )
    for (let i = 0; i < 4; i++) {
      for (let r = 0; r < 3; r++) {
        a.push(
          createElement("seat", 60 + i * 110, 100 + r * 132, {
            w: 88,
            h: 116,
            label: `G-${String(r * 4 + i + 1).padStart(2, "0")}`,
            auto: false,
          })
        )
      }
    }
    a.push(
      createElement("cabin", 600, 100, { w: 180, h: 110, label: "VIP Cabin 1" }),
      createElement("cabin", 600, 230, { w: 180, h: 110, label: "VIP Cabin 2" }),
      createElement("shelf", 600, 380, { w: 260, h: 28, label: "Academic Stacks" })
    )
    return a
  }
  if (floor.toLowerCase().includes("2nd") || floor.toLowerCase().includes("second")) {
    // 2nd Floor - Executive PC Lab & Cubicles
    const a: CanvasElement[] = []
    a.push(createElement("door", 60, 20, { w: 80, h: 26 }))
    a.push(createElement("reception", 680, 20, { w: 140, h: 40 }))
    a.push(createElement("ac", 360, 20, { w: 60, h: 24 }))
    for (let i = 0; i < 4; i++) {
      for (let r = 0; r < 2; r++) {
        a.push(
          createElement("pc", 60 + i * 110, 90 + r * 132, {
            w: 88,
            h: 116,
            label: `PC-${String(r * 4 + i + 1).padStart(2, "0")}`,
            auto: false,
          })
        )
      }
    }
    for (let i = 0; i < 3; i++) {
      a.push(
        createElement("cabin", 550, 90 + i * 125, {
          w: 180,
          h: 110,
          label: `Exec Cabin ${i + 1}`,
          auto: false,
        })
      )
    }
    a.push(createElement("shelf", 60, 370, { w: 420, h: 28, label: "Research Archive" }))
    return a
  }
  return createSampleLayout()
}

export function computeHallSizeForElements(
  elements: CanvasElement[],
  minW = 960,
  minH = 600
): { width: number; height: number } {
  let maxX = minW - 40
  let maxY = minH - 40
  elements.forEach((el) => {
    if (el.x + el.w + 40 > maxX) {
      maxX = el.x + el.w + 40
    }
    if (el.y + el.h + 40 > maxY) {
      maxY = el.y + el.h + 40
    }
  })
  return {
    width: Math.max(minW, Math.ceil(maxX / 20) * 20),
    height: Math.max(minH, Math.ceil(maxY / 20) * 20),
  }
}

export const HALL_PRESETS = [
  { label: "Compact (960 × 600)", w: 960, h: 600 },
  { label: "Standard (1100 × 760)", w: 1100, h: 760 },
  { label: "Large (1300 × 960)", w: 1300, h: 960 },
  { label: "Grand Hall (1500 × 1200)", w: 1500, h: 1200 },
]

export function convertTemplateToElements(tpl: SeatingTemplate): {
  elements: CanvasElement[]
  canvasWidth: number
  canvasHeight: number
} {
  const elements: CanvasElement[] = []

  // Ensure every seat card has generous portrait proportions matching the reference UI (88x116)
  // deskW = 88px, deskH = 116px, gapX = 16px, gapY = 16px
  const cellW = 104
  const cellH = 132
  const deskW = 88
  const deskH = 116

  const totalW = tpl.cols * cellW
  const totalH = tpl.rows * cellH

  // Automatically adjust preview box size so every template fits with generous padding
  const canvasWidth = Math.max(960, Math.ceil((totalW + 120) / 20) * 20)
  const canvasHeight = Math.max(600, Math.ceil((totalH + 120) / 20) * 20)

  const offsetX = Math.max(40, snap((canvasWidth - totalW) / 2))
  const offsetY = 50

  tpl.cells.forEach((cell) => {
    if (cell.type === "empty") return
    const x = offsetX + cell.x * cellW
    const y = offsetY + cell.y * cellH

    let type: ElementType = "seat"
    let w = deskW
    let h = deskH
    let label = cell.label || cell.seatNo || ""

    switch (cell.type) {
      case "seat":
        type = "seat"
        w = deskW
        h = deskH
        label = cell.seatNo || ""
        break
      case "cabin":
        type = "cabin"
        w = Math.max(160, cellW * 2 - 16)
        h = Math.max(104, cellH * 2 - 16)
        label = cell.label || cell.seatNo || "Cabin"
        break
      case "computer":
        type = "pc"
        w = deskW
        h = deskH
        label = cell.seatNo || "PC"
        break
      case "door":
        type = "door"
        w = Math.max(60, cellW)
        h = 22
        label = cell.label || "Door"
        break
      case "reception":
        type = "reception"
        w = Math.max(100, cellW * 2)
        h = 36
        label = cell.label || "Reception"
        break
      case "pillar":
        type = "pillar"
        w = Math.min(36, deskW)
        h = Math.min(36, deskH)
        label = ""
        break
      case "rack":
        type = "shelf"
        w = Math.max(90, cellW * 2)
        h = 24
        label = cell.label || "Book shelf"
        break
      case "water":
        type = "water"
        w = 32
        h = 32
        label = cell.label || "RO"
        break
      case "ac":
        type = "ac"
        w = 56
        h = 22
        label = cell.label || "AC"
        break
      default:
        type = "seat"
        w = deskW
        h = deskH
        label = cell.seatNo || ""
        break
    }

    elements.push(
      createElement(type, snap(x), snap(y), {
        w: Math.round(w),
        h: Math.round(h),
        label,
        status: "free",
        auto: true,
      })
    )
  })

  return {
    elements: renumberElements(elements),
    canvasWidth,
    canvasHeight,
  }
}
