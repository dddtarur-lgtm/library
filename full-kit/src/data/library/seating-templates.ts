export type CellType =
  | "empty"
  | "seat"
  | "cabin"
  | "computer"
  | "door"
  | "reception"
  | "rack"
  | "water"
  | "ac"
  | "pillar"
  | "restroom"

export interface GridCell {
  x: number
  y: number
  type: CellType
  label?: string
  seatNo?: string
  category?: string
}

export interface SeatingTemplate {
  id: string
  name: string
  description: string
  seatCount: number
  category: "15-25 Seats" | "30-45 Seats" | "50-65 Seats" | "70-100 Seats"
  rows: number
  cols: number
  cells: GridCell[]
}

// Helper to generate empty grid
function makeGrid(rows: number, cols: number): GridCell[] {
  const cells: GridCell[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ x: c, y: r, type: "empty" })
    }
  }
  return cells
}

// 20 Distinct Real-World Library & Conference Templates
export const seatingTemplates: SeatingTemplate[] = [
  // 1. Dual Long Study Benches (24 Seats) — From User Image 1
  {
    id: "tpl-1",
    name: "Dual Long Study Benches",
    description: "Two continuous longitudinal study tables with dual-sided chairs and wide central walkway.",
    seatCount: 24,
    category: "15-25 Seats",
    rows: 9,
    cols: 10,
    cells: (() => {
      const g = makeGrid(9, 10)
      let sNum = 1
      g.forEach((c) => {
        // Amenities at top/bottom
        if (c.y === 0 && c.x === 1) { c.type = "door"; c.label = "Entrance" }
        else if (c.y === 0 && c.x === 4) { c.type = "reception"; c.label = "Reception" }
        else if (c.y === 0 && c.x === 8) { c.type = "water"; c.label = "RO Water" }
        else if (c.y === 0 && c.x === 6) { c.type = "ac"; c.label = "AC" }
        else if (c.y === 8 && (c.x === 4 || c.x === 5)) { c.type = "rack"; c.label = "Bookshelf" }
        // Left Table: 6 seats on left (x=1), 6 seats on right (x=3), y=2..7
        else if (c.y >= 2 && c.y <= 7 && (c.x === 1 || c.x === 3)) {
          c.type = "seat"
          c.seatNo = `L-${String(sNum++).padStart(2, "0")}`
        }
        // Right Table: 6 seats on left (x=6), 6 seats on right (x=8), y=2..7
        else if (c.y >= 2 && c.y <= 7 && (c.x === 6 || c.x === 8)) {
          c.type = "seat"
          c.seatNo = `R-${String(sNum++).padStart(2, "0")}`
        }
      })
      return g
    })(),
  },

  // 2. Comb / E-Shape Reading Hall (26 Seats) — From User Image 2
  {
    id: "tpl-2",
    name: "Comb / E-Shape Reading Hall",
    description: "Header bench table with three perpendicular branches extending down, optimal for group review.",
    seatCount: 26,
    category: "15-25 Seats",
    rows: 8,
    cols: 10,
    cells: (() => {
      const g = makeGrid(8, 10)
      let sNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 0) { c.type = "door"; c.label = "Main Door" }
        else if (c.y === 0 && c.x === 8) { c.type = "ac"; c.label = "AC" }
        else if (c.y === 7 && c.x === 0) { c.type = "reception"; c.label = "Desk" }
        else if (c.y === 7 && c.x === 8) { c.type = "water"; c.label = "RO" }
        // Top head table (6 seats at y=1, x=2..7)
        else if (c.y === 1 && c.x >= 2 && c.x <= 7) {
          c.type = "seat"
          c.seatNo = `H-${String(sNum++).padStart(2, "0")}`
        }
        // Left Branch: y=3..6, x=1 (left) and x=2 (right) -> 7 seats
        else if (c.y >= 3 && c.y <= 6 && (c.x === 1 || c.x === 2)) {
          if (sNum <= 13) {
            c.type = "seat"
            c.seatNo = `A-${String(sNum++).padStart(2, "0")}`
          }
        }
        // Middle Branch: y=3..6, x=4 (left) and x=5 (right) -> 7 seats
        else if (c.y >= 3 && c.y <= 6 && (c.x === 4 || c.x === 5)) {
          if (sNum <= 20) {
            c.type = "seat"
            c.seatNo = `B-${String(sNum++).padStart(2, "0")}`
          }
        }
        // Right Branch: y=3..5, x=7 (left) and x=8 (right) -> 6 seats
        else if (c.y >= 3 && c.y <= 5 && (c.x === 7 || c.x === 8)) {
          if (sNum <= 26) {
            c.type = "seat"
            c.seatNo = `C-${String(sNum++).padStart(2, "0")}`
          }
        }
      })
      return g
    })(),
  },

  // 3. Executive U-Shape with Center Island (26 Seats) — From User Image 3 Left
  {
    id: "tpl-3",
    name: "Executive U-Shape with Center Island",
    description: "Formal conference & reading hall with top presenter table, outer U-shape, and inner island pod.",
    seatCount: 26,
    category: "15-25 Seats",
    rows: 9,
    cols: 10,
    cells: (() => {
      const g = makeGrid(9, 10)
      let sNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 0) { c.type = "door"; c.label = "Entrance" }
        else if (c.y === 0 && c.x === 9) { c.type = "water"; c.label = "RO Water" }
        else if (c.y === 8 && c.x === 0) { c.type = "reception"; c.label = "Reception" }
        else if (c.y === 0 && c.x === 4) { c.type = "ac"; c.label = "AC" }
        // Top presenter table (5 seats at y=1, x=2..6)
        else if (c.y === 1 && c.x >= 2 && c.x <= 6) {
          c.type = "seat"
          c.seatNo = `P-${String(sNum++).padStart(2, "0")}`
        }
        // Outer U-Shape: Left (x=1, y=3..6: 4 seats), Right (x=7, y=3..6: 4 seats), Bottom (y=7, x=2..6: 5 seats)
        else if (c.y >= 3 && c.y <= 6 && (c.x === 1 || c.x === 7)) {
          c.type = "seat"
          c.seatNo = `U-${String(sNum++).padStart(2, "0")}`
        }
        else if (c.y === 7 && c.x >= 2 && c.x <= 6) {
          c.type = "seat"
          c.seatNo = `U-${String(sNum++).padStart(2, "0")}`
        }
        // Center Island: 2 columns of 3 seats (x=3, x=5, y=3..5 = 6 seats)
        else if (c.y >= 3 && c.y <= 5 && (c.x === 3 || c.x === 5)) {
          c.type = "seat"
          c.seatNo = `I-${String(sNum++).padStart(2, "0")}`
        }
      })
      return g
    })(),
  },

  // 4. Wide Hollow-U Conference Hall (32 Seats) — From User Image 3 Right
  {
    id: "tpl-4",
    name: "Wide Hollow-U Conference Hall",
    description: "Expansive collaborative hall with top head bench, outer U perimeter, and inner conversation seats.",
    seatCount: 32,
    category: "30-45 Seats",
    rows: 9,
    cols: 11,
    cells: (() => {
      const g = makeGrid(9, 11)
      let sNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 1) { c.type = "door"; c.label = "Door 1" }
        else if (c.y === 8 && c.x === 1) { c.type = "door"; c.label = "Door 2" }
        else if (c.y === 0 && c.x === 9) { c.type = "reception"; c.label = "Board Desk" }
        else if (c.y === 8 && c.x === 9) { c.type = "water"; c.label = "Water" }
        else if (c.y === 0 && c.x === 5) { c.type = "ac"; c.label = "AC" }
        // Top presenter table (7 seats at y=1, x=2..8)
        else if (c.y === 1 && c.x >= 2 && c.x <= 8) {
          c.type = "seat"
          c.seatNo = `T-${String(sNum++).padStart(2, "0")}`
        }
        // Outer U-Shape: Left (x=1, y=3..7: 5 seats), Right (x=9, y=3..7: 5 seats), Bottom (y=8, x=3..7: 5 seats)
        else if (c.y >= 3 && c.y <= 7 && (c.x === 1 || c.x === 9)) {
          c.type = "seat"
          c.seatNo = `O-${String(sNum++).padStart(2, "0")}`
        }
        else if (c.y === 8 && c.x >= 3 && c.x <= 7) {
          c.type = "seat"
          c.seatNo = `O-${String(sNum++).padStart(2, "0")}`
        }
        // Inner perimeter seats: 3 on left (x=3, y=4..6), 3 on right (x=7, y=4..6) -> 6 seats
        else if (c.y >= 4 && c.y <= 6 && (c.x === 3 || c.x === 7)) {
          if (sNum <= 32) {
            c.type = "seat"
            c.seatNo = `M-${String(sNum++).padStart(2, "0")}`
          }
        }
      })
      return g
    })(),
  },

  // 5. Boutique Study Lounge (20 Seats)
  {
    id: "tpl-5",
    name: "Boutique Study Lounge",
    description: "Compact corridor with side single desks, front reception desk and water station.",
    seatCount: 20,
    category: "15-25 Seats",
    rows: 7,
    cols: 6,
    cells: (() => {
      const g = makeGrid(7, 6)
      let sNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 0) { c.type = "door"; c.label = "Entrance" }
        else if (c.y === 0 && c.x === 2) { c.type = "reception"; c.label = "Front Desk" }
        else if (c.y === 0 && c.x === 5) { c.type = "water"; c.label = "Water" }
        else if (c.y >= 2 && (c.x === 0 || c.x === 1 || c.x === 4 || c.x === 5)) {
          c.type = "seat"
          c.seatNo = `A-${String(sNum++).padStart(2, "0")}`
        }
      })
      return g
    })(),
  },

  // 6. Corner Reading Room (24 Seats)
  {
    id: "tpl-6",
    name: "Corner Reading Room",
    description: "Perimeter wall study tables with central book shelves and natural light.",
    seatCount: 24,
    category: "15-25 Seats",
    rows: 6,
    cols: 8,
    cells: (() => {
      const g = makeGrid(6, 8)
      let sNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 0) { c.type = "door"; c.label = "Entrance" }
        else if (c.y === 3 && (c.x === 3 || c.x === 4)) { c.type = "rack"; c.label = "Books" }
        else if (c.y === 0 && c.x === 7) { c.type = "ac"; c.label = "AC" }
        else if (
          ((c.y === 1 || c.y === 5) && c.x >= 1 && c.x <= 6) ||
          ((c.x === 0 || c.x === 7) && c.y >= 1 && c.y <= 4)
        ) {
          if (sNum <= 24) {
            c.type = "seat"
            c.seatNo = `B-${String(sNum++).padStart(2, "0")}`
          }
        }
      })
      return g
    })(),
  },

  // 7. Girls Silent Wing (25 Seats)
  {
    id: "tpl-7",
    name: "Girls Silent Wing",
    description: "Private quiet wing with acoustic dividers, dedicated cabins and security gate.",
    seatCount: 25,
    category: "15-25 Seats",
    rows: 7,
    cols: 7,
    cells: (() => {
      const g = makeGrid(7, 7)
      let sNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 3) { c.type = "door"; c.label = "Girls Gate" }
        else if (c.y === 0 && c.x === 0) { c.type = "cabin"; c.label = "Cabin 1" }
        else if (c.y === 0 && c.x === 6) { c.type = "water"; c.label = "RO Water" }
        else if (c.y >= 2 && c.y <= 6 && c.x !== 3) {
          if (sNum <= 25) {
            c.type = "seat"
            c.seatNo = `G-${String(sNum++).padStart(2, "0")}`
          }
        }
      })
      return g
    })(),
  },

  // 8. Tech Hub & PC Lab (30 Terminals)
  {
    id: "tpl-8",
    name: "Tech Hub & PC Lab",
    description: "Dedicated computer workstations with server rack, air conditioning and supervisor desk.",
    seatCount: 30,
    category: "30-45 Seats",
    rows: 7,
    cols: 9,
    cells: (() => {
      const g = makeGrid(7, 9)
      let sNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 0) { c.type = "door"; c.label = "Lab Entry" }
        else if (c.y === 0 && c.x === 4) { c.type = "reception"; c.label = "Admin Desk" }
        else if (c.y === 0 && c.x === 8) { c.type = "water"; c.label = "Water" }
        else if (c.y === 6 && c.x === 4) { c.type = "ac"; c.label = "AC" }
        else if (c.y >= 1 && c.y <= 5 && c.x >= 1 && c.x <= 7 && c.x !== 4) {
          if (sNum <= 30) {
            c.type = "computer"
            c.seatNo = `PC-${String(sNum++).padStart(2, "0")}`
          }
        }
      })
      return g
    })(),
  },

  // 9. Study Pods & Clusters (32 Seats)
  {
    id: "tpl-9",
    name: "Study Pods & Clusters",
    description: "4-seater collaborative pod pods with acoustic dividers and central aisle.",
    seatCount: 32,
    category: "30-45 Seats",
    rows: 7,
    cols: 10,
    cells: (() => {
      const g = makeGrid(7, 10)
      let sNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 1) { c.type = "door"; c.label = "Entrance" }
        else if (c.y === 0 && c.x === 8) { c.type = "reception"; c.label = "Help Desk" }
        else if (c.y >= 1 && c.y <= 6 && c.x >= 1 && c.x <= 8) {
          const isPodX = c.x === 1 || c.x === 2 || c.x === 4 || c.x === 5 || c.x === 7 || c.x === 8
          const isPodY = c.y === 1 || c.y === 2 || c.y === 4 || c.y === 5
          if (isPodX && isPodY && sNum <= 32) {
            c.type = "seat"
            c.seatNo = `P-${String(sNum++).padStart(2, "0")}`
          }
        }
      })
      return g
    })(),
  },

  // 10. Central Academic Library (36 Seats)
  {
    id: "tpl-10",
    name: "Central Academic Library",
    description: "Classic symmetrical 6-table blocks separated by central book stacks.",
    seatCount: 36,
    category: "30-45 Seats",
    rows: 7,
    cols: 10,
    cells: (() => {
      const g = makeGrid(7, 10)
      let sNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 0) { c.type = "door"; c.label = "Entry" }
        else if (c.y === 0 && c.x === 4) { c.type = "reception"; c.label = "Issue Desk" }
        else if (c.y === 0 && c.x === 9) { c.type = "water"; c.label = "Water" }
        else if (c.x === 4 && (c.y === 2 || c.y === 3 || c.y === 4)) { c.type = "rack"; c.label = "Books" }
        else if (c.y >= 1 && c.y <= 6 && (c.x <= 3 || c.x >= 6)) {
          if (sNum <= 36) {
            c.type = "seat"
            c.seatNo = `C-${String(sNum++).padStart(2, "0")}`
          }
        }
      })
      return g
    })(),
  },

  // 11. Dual-Aisle Study Commons (40 Seats)
  {
    id: "tpl-11",
    name: "Dual-Aisle Study Commons",
    description: "Four large desk quadrants with wide dual aisles, AC stations and entry vestibule.",
    seatCount: 40,
    category: "30-45 Seats",
    rows: 8,
    cols: 11,
    cells: (() => {
      const g = makeGrid(8, 11)
      let sNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 0) { c.type = "door"; c.label = "Door 1" }
        else if (c.y === 7 && c.x === 0) { c.type = "door"; c.label = "Door 2" }
        else if (c.y === 0 && c.x === 5) { c.type = "reception"; c.label = "Reception" }
        else if (c.y === 0 && c.x === 10) { c.type = "water"; c.label = "RO Water" }
        else if (c.y >= 1 && c.y <= 6 && c.x >= 1 && c.x <= 9) {
          if (c.x !== 3 && c.x !== 7 && c.y !== 3 && sNum <= 40) {
            c.type = "seat"
            c.seatNo = `S-${String(sNum++).padStart(2, "0")}`
          }
        }
      })
      return g
    })(),
  },

  // 12. Silent Reading Sanctuary (45 Seats)
  {
    id: "tpl-12",
    name: "Silent Reading Sanctuary",
    description: "High-focus silent hall with private acoustic cabins and individual reading desks.",
    seatCount: 45,
    category: "30-45 Seats",
    rows: 8,
    cols: 11,
    cells: (() => {
      const g = makeGrid(8, 11)
      let sNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 1) { c.type = "door"; c.label = "Quiet Gate" }
        else if (c.y === 0 && c.x === 9) { c.type = "water"; c.label = "RO" }
        else if (c.y === 1 && (c.x === 2 || c.x === 8)) { c.type = "cabin"; c.label = "Cabin" }
        else if (c.y >= 2 && c.y <= 7 && c.x >= 1 && c.x <= 9) {
          if (c.x !== 5 && sNum <= 45) {
            c.type = "seat"
            c.seatNo = `Q-${String(sNum++).padStart(2, "0")}`
          }
        }
      })
      return g
    })(),
  },

  // 13. University Floor Commons (50 Seats)
  {
    id: "tpl-13",
    name: "University Floor Commons",
    description: "Spacious 50-desk hall with central circulation path, twin book stacks and air conditioning.",
    seatCount: 50,
    category: "50-65 Seats",
    rows: 9,
    cols: 12,
    cells: (() => {
      const g = makeGrid(9, 12)
      let sNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 0) { c.type = "door"; c.label = "North Entry" }
        else if (c.y === 8 && c.x === 0) { c.type = "door"; c.label = "South Entry" }
        else if (c.y === 0 && c.x === 5) { c.type = "reception"; c.label = "Control Desk" }
        else if (c.y === 0 && c.x === 11) { c.type = "water"; c.label = "Water" }
        else if (c.y >= 1 && c.y <= 7 && c.x >= 1 && c.x <= 10) {
          if (c.x !== 5 && c.x !== 6 && sNum <= 50) {
            c.type = "seat"
            c.seatNo = `U-${String(sNum++).padStart(2, "0")}`
          }
        }
      })
      return g
    })(),
  },

  // 14. Modern Digital Library (56 Seats)
  {
    id: "tpl-14",
    name: "Modern Digital Library",
    description: "Hybrid floor with 40 reading desks and 16 high-speed computer terminals.",
    seatCount: 56,
    category: "50-65 Seats",
    rows: 9,
    cols: 12,
    cells: (() => {
      const g = makeGrid(9, 12)
      let sNum = 1
      let pcNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 0) { c.type = "door"; c.label = "Entrance" }
        else if (c.y === 0 && c.x === 6) { c.type = "reception"; c.label = "Digital Desk" }
        // Left section: PCs (16)
        else if (c.y >= 1 && c.y <= 8 && (c.x === 1 || c.x === 2)) {
          if (pcNum <= 16) {
            c.type = "computer"
            c.seatNo = `PC-${String(pcNum++).padStart(2, "0")}`
          }
        }
        // Right section: Study seats (40)
        else if (c.y >= 1 && c.y <= 8 && c.x >= 5 && c.x <= 10) {
          if (c.x !== 7 && sNum <= 40) {
            c.type = "seat"
            c.seatNo = `D-${String(sNum++).padStart(2, "0")}`
          }
        }
      })
      return g
    })(),
  },

  // 15. Two-Tier Academic Center (60 Seats)
  {
    id: "tpl-15",
    name: "Two-Tier Academic Center",
    description: "Split layout with Quiet Hall and Group Hall separated by reference library racks.",
    seatCount: 60,
    category: "50-65 Seats",
    rows: 10,
    cols: 12,
    cells: (() => {
      const g = makeGrid(10, 12)
      let sNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 0) { c.type = "door"; c.label = "Wing A" }
        else if (c.y === 0 && c.x === 11) { c.type = "door"; c.label = "Wing B" }
        else if (c.y === 0 && c.x === 5) { c.type = "reception"; c.label = "Main Desk" }
        else if (c.y >= 1 && c.y <= 8 && c.x >= 1 && c.x <= 10) {
          if (c.x === 5 || c.x === 6) {
            c.type = "rack"
            c.label = "Books"
          } else if (sNum <= 60) {
            c.type = "seat"
            c.seatNo = `M-${String(sNum++).padStart(2, "0")}`
          }
        }
      })
      return g
    })(),
  },

  // 16. Silent Study Pavilion (64 Seats)
  {
    id: "tpl-16",
    name: "Silent Study Pavilion",
    description: "56 open desks plus 8 soundproof executive study cabins for postgraduate research.",
    seatCount: 64,
    category: "50-65 Seats",
    rows: 10,
    cols: 13,
    cells: (() => {
      const g = makeGrid(10, 13)
      let sNum = 1
      let cabNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 0) { c.type = "door"; c.label = "Entrance" }
        else if (c.y === 0 && c.x === 6) { c.type = "reception"; c.label = "Reception" }
        // Perimeter Cabins (8)
        else if ((c.y === 1 || c.y === 8) && (c.x === 2 || c.x === 4 || c.x === 8 || c.x === 10)) {
          if (cabNum <= 8) {
            c.type = "cabin"
            c.label = `Cabin ${cabNum++}`
          }
        }
        // Center Desks (56)
        else if (c.y >= 2 && c.y <= 7 && c.x >= 1 && c.x <= 11) {
          if (c.x !== 6 && sNum <= 56) {
            c.type = "seat"
            c.seatNo = `P-${String(sNum++).padStart(2, "0")}`
          }
        }
      })
      return g
    })(),
  },

  // 17. Mega Examination & Study Hall (72 Seats)
  {
    id: "tpl-17",
    name: "Mega Examination & Study Hall",
    description: "8 rows of 9 desks with uniform grid spacing, proctor station and double emergency exits.",
    seatCount: 72,
    category: "70-100 Seats",
    rows: 11,
    cols: 13,
    cells: (() => {
      const g = makeGrid(11, 13)
      let sNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 1) { c.type = "door"; c.label = "Gate A" }
        else if (c.y === 0 && c.x === 11) { c.type = "door"; c.label = "Gate B" }
        else if (c.y === 0 && c.x === 6) { c.type = "reception"; c.label = "Proctor Desk" }
        else if (c.y >= 2 && c.y <= 9 && c.x >= 2 && c.x <= 10) {
          if (sNum <= 72) {
            c.type = "seat"
            c.seatNo = `E-${String(sNum++).padStart(2, "0")}`
          }
        }
      })
      return g
    })(),
  },

  // 18. Campus Central Knowledge Center (80 Seats)
  {
    id: "tpl-18",
    name: "Campus Central Knowledge Center",
    description: "Flagship multi-section library with computer bay, reading zones, cabins and cafe area.",
    seatCount: 80,
    category: "70-100 Seats",
    rows: 9,
    cols: 12,
    cells: (() => {
      const g = makeGrid(9, 12)
      let sNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 0) { c.type = "door"; c.label = "Main Entrance" }
        else if (c.y === 0 && c.x === 5) { c.type = "reception"; c.label = "Help Desk" }
        else if (c.y === 0 && c.x === 10) { c.type = "water"; c.label = "Water Station" }
        else if (c.y >= 1 && c.y <= 8 && c.x >= 0 && c.x <= 11) {
          if (c.x !== 3 && c.x !== 8 && sNum <= 80) {
            const rowLetter = String.fromCharCode(64 + c.y) // 1 -> A, 2 -> B ... 8 -> H
            const colNum = c.x < 3 ? c.x + 1 : c.x < 8 ? c.x : c.x - 1
            c.type = "seat"
            c.seatNo = `${rowLetter}-${String(colNum).padStart(2, "0")}`
            sNum++
          }
        }
      })
      return g
    })(),
  },

  // 19. Metro City Reading Complex (88 Seats)
  {
    id: "tpl-19",
    name: "Metro City Reading Complex",
    description: "High-capacity municipal library with 4 wings, central inquiry counter and water hubs.",
    seatCount: 88,
    category: "70-100 Seats",
    rows: 12,
    cols: 15,
    cells: (() => {
      const g = makeGrid(12, 15)
      let sNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 2) { c.type = "door"; c.label = "North Gate" }
        else if (c.y === 11 && c.x === 2) { c.type = "door"; c.label = "South Gate" }
        else if (c.y === 0 && c.x === 7) { c.type = "reception"; c.label = "Inquiry" }
        else if (c.y >= 1 && c.y <= 10 && c.x >= 1 && c.x <= 13) {
          if (c.x !== 4 && c.x !== 10 && c.y !== 5 && sNum <= 88) {
            c.type = "seat"
            c.seatNo = `M-${String(sNum++).padStart(2, "0")}`
          }
        }
      })
      return g
    })(),
  },

  // 20. Flagship Research Library (100 Seats)
  {
    id: "tpl-20",
    name: "Flagship Research Library",
    description: "Maximum capacity 100-desk academic floor with dual reception, computer wing and quiet corners.",
    seatCount: 100,
    category: "70-100 Seats",
    rows: 13,
    cols: 15,
    cells: (() => {
      const g = makeGrid(13, 15)
      let sNum = 1
      g.forEach((c) => {
        if (c.y === 0 && c.x === 0) { c.type = "door"; c.label = "West Gate" }
        else if (c.y === 0 && c.x === 14) { c.type = "door"; c.label = "East Gate" }
        else if (c.y === 0 && c.x === 7) { c.type = "reception"; c.label = "Information Desk" }
        else if (c.y === 12 && (c.x === 6 || c.x === 8)) { c.type = "rack"; c.label = "Archives" }
        else if (c.y >= 1 && c.y <= 11 && c.x >= 1 && c.x <= 13) {
          if (c.x !== 4 && c.x !== 10 && sNum <= 100) {
            c.type = "seat"
            c.seatNo = `F-${String(sNum++).padStart(2, "0")}`
          }
        }
      })
      return g
    })(),
  },
]
