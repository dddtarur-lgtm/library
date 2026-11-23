export type SeatCategory =
  | "General"
  | "Girls Only"
  | "Boys Only"
  | "Silent Cabin"
  | "Divyang / Accessible"
  | "Reserved"

export type SeatType = "Single Table" | "Private Cabin" | "Computer Desk"

export type SeatStatus = "Available" | "Occupied" | "Reserved" | "Maintenance"

export type ShiftType = "Morning" | "Evening" | "Full Day"

export interface SeatAllocation {
  studentId: string
  studentName: string
  avatar: string
  planName: string
  planEnd: string
  allocatedAt: string
  shift: ShiftType
}

export interface SeatHistoryItem {
  id: string
  studentName: string
  studentId: string
  from: string
  to: string
  shift: string
  allocatedBy: string
  reason: string
}

export interface SeatItem {
  id: string
  seatNo: string
  floor: string
  room: string
  row: string
  type: SeatType
  category: SeatCategory
  pricePerMonth: number
  status: SeatStatus
  shifts: {
    morning?: SeatAllocation
    evening?: SeatAllocation
    fullDay?: SeatAllocation
  }
  history: SeatHistoryItem[]
  notes?: string
}

export interface LockerItem {
  id: string
  lockerNo: string
  floor: string
  room: string
  status: "Available" | "Assigned" | "Maintenance"
  assignedStudent?: {
    id: string
    name: string
    studentId: string
    phone: string
    assignedAt: string
  }
  depositAmount: number
  depositStatus: "Paid" | "Pending" | "Refunded"
  keyStatus: "Issued" | "In Cabinet"
}

export interface SeatChangeRequest {
  id: string
  studentId: string
  studentName: string
  avatar: string
  currentSeat: string
  currentShift: string
  requestedSeat: string
  requestedShift: string
  requestedFloor: string
  reason: string
  requestDate: string
  status: "Pending" | "Approved" | "Rejected"
  priority: "High" | "Normal"
  reviewedBy?: string
  reviewedAt?: string
  rejectionReason?: string
}

export const floorsList = [
  { id: "floor-g", name: "Ground Floor", room: "Central Reading Hall", totalSeats: 32 },
  { id: "floor-1", name: "1st Floor", room: "Girls Silent Wing", totalSeats: 24 },
  { id: "floor-2", name: "2nd Floor", room: "Executive Cubicles", totalSeats: 18 },
]

export const initialSeatsData: SeatItem[] = [
  // Ground Floor - Row A (General Reading)
  {
    id: "seat-g-a01",
    seatNo: "A-01",
    floor: "Ground Floor",
    room: "Central Reading Hall",
    row: "Row A",
    type: "Single Table",
    category: "General",
    pricePerMonth: 1200,
    status: "Occupied",
    shifts: {
      morning: {
        studentId: "STU-1083",
        studentName: "Rohan Verma",
        avatar: "/images/avatars/avatar-2.png",
        planName: "Morning Shift (6 AM - 2 PM)",
        planEnd: "2024-11-20",
        allocatedAt: "2024-08-01",
        shift: "Morning",
      },
      evening: {
        studentId: "STU-1085",
        studentName: "Vikas Dubey",
        avatar: "/images/avatars/avatar-4.png",
        planName: "Evening Shift (2 PM - 10 PM)",
        planEnd: "2024-12-05",
        allocatedAt: "2024-09-10",
        shift: "Evening",
      },
    },
    history: [
      {
        id: "sh-1",
        studentName: "Rohan Verma",
        studentId: "STU-1083",
        from: "2024-08-01",
        to: "Current",
        shift: "Morning",
        allocatedBy: "Front Desk Staff",
        reason: "Initial admission allocation",
      },
    ],
  },
  {
    id: "seat-g-a02",
    seatNo: "A-02",
    floor: "Ground Floor",
    room: "Central Reading Hall",
    row: "Row A",
    type: "Single Table",
    category: "General",
    pricePerMonth: 1200,
    status: "Available",
    shifts: {},
    history: [],
  },
  {
    id: "seat-g-a03",
    seatNo: "A-03",
    floor: "Ground Floor",
    room: "Central Reading Hall",
    row: "Row A",
    type: "Single Table",
    category: "Divyang / Accessible",
    pricePerMonth: 1200,
    status: "Available",
    shifts: {},
    history: [],
    notes: "Wide aisle clearance for wheelchair accessibility",
  },
  {
    id: "seat-g-a04",
    seatNo: "A-04",
    floor: "Ground Floor",
    room: "Central Reading Hall",
    row: "Row A",
    type: "Single Table",
    category: "General",
    pricePerMonth: 1200,
    status: "Reserved",
    shifts: {
      morning: {
        studentId: "STU-1090",
        studentName: "Mohit Saini (Trial)",
        avatar: "/images/avatars/avatar-5.png",
        planName: "Free Trial Reservation",
        planEnd: "2024-11-02",
        allocatedAt: "2024-10-30",
        shift: "Morning",
      },
    },
    history: [],
    notes: "Held for trial visitor until 6:00 PM today",
  },
  {
    id: "seat-g-a05",
    seatNo: "A-05",
    floor: "Ground Floor",
    room: "Central Reading Hall",
    row: "Row A",
    type: "Single Table",
    category: "General",
    pricePerMonth: 1200,
    status: "Maintenance",
    shifts: {},
    history: [],
    notes: "Power socket faulty; electrician ticket #402 opened",
  },
  {
    id: "seat-g-a06",
    seatNo: "A-06",
    floor: "Ground Floor",
    room: "Central Reading Hall",
    row: "Row A",
    type: "Single Table",
    category: "General",
    pricePerMonth: 1200,
    status: "Available",
    shifts: {},
    history: [],
  },
  {
    id: "seat-g-a12",
    seatNo: "A-12",
    floor: "Ground Floor",
    room: "Central Reading Hall",
    row: "Row A",
    type: "Single Table",
    category: "General",
    pricePerMonth: 1400,
    status: "Occupied",
    shifts: {
      fullDay: {
        studentId: "STU-1081",
        studentName: "Aarav Patel",
        avatar: "/images/avatars/avatar-1.png",
        planName: "24x7 Unlimited Premium Study",
        planEnd: "2024-11-15",
        allocatedAt: "2024-06-15",
        shift: "Full Day",
      },
    },
    history: [
      {
        id: "sh-12",
        studentName: "Aarav Patel",
        studentId: "STU-1081",
        from: "2024-06-15",
        to: "Current",
        shift: "Full Day",
        allocatedBy: "Library Admin",
        reason: "Allocated near silent zone with locker L-14",
      },
    ],
  },
  {
    id: "seat-g-b01",
    seatNo: "A-07",
    floor: "Ground Floor",
    room: "Central Reading Hall",
    row: "Row B",
    type: "Single Table",
    category: "Boys Only",
    pricePerMonth: 1200,
    status: "Occupied",
    shifts: {
      morning: {
        studentId: "STU-1087",
        studentName: "Devansh Rathore",
        avatar: "/images/avatars/avatar-6.png",
        planName: "Morning Shift (6 AM - 2 PM)",
        planEnd: "2024-11-28",
        allocatedAt: "2024-09-01",
        shift: "Morning",
      },
    },
    history: [],
  },
  {
    id: "seat-g-b02",
    seatNo: "A-08",
    floor: "Ground Floor",
    room: "Central Reading Hall",
    row: "Row B",
    type: "Single Table",
    category: "Boys Only",
    pricePerMonth: 1200,
    status: "Available",
    shifts: {},
    history: [],
  },

  // 1st Floor - Girls Silent Wing (Row B)
  {
    id: "seat-1-b01",
    seatNo: "B-01",
    floor: "1st Floor",
    room: "Girls Silent Wing",
    row: "Row B",
    type: "Single Table",
    category: "Girls Only",
    pricePerMonth: 1300,
    status: "Available",
    shifts: {},
    history: [],
  },
  {
    id: "seat-1-b02",
    seatNo: "B-02",
    floor: "1st Floor",
    room: "Girls Silent Wing",
    row: "Row B",
    type: "Single Table",
    category: "Girls Only",
    pricePerMonth: 1300,
    status: "Occupied",
    shifts: {
      morning: {
        studentId: "STU-1084",
        studentName: "Ananya Deshmukh",
        avatar: "/images/avatars/avatar-3.png",
        planName: "Morning Shift (6 AM - 2 PM)",
        planEnd: "2024-11-10",
        allocatedAt: "2024-07-15",
        shift: "Morning",
      },
    },
    history: [],
  },
  {
    id: "seat-1-b04",
    seatNo: "B-04",
    floor: "1st Floor",
    room: "Girls Silent Wing",
    row: "Row B",
    type: "Single Table",
    category: "Girls Only",
    pricePerMonth: 1300,
    status: "Occupied",
    shifts: {
      morning: {
        studentId: "STU-1082",
        studentName: "Priya Sharma",
        avatar: "/images/avatars/avatar-2.png",
        planName: "Morning Shift (8 AM - 2 PM)",
        planEnd: "2024-11-25",
        allocatedAt: "2024-07-01",
        shift: "Morning",
      },
    },
    history: [
      {
        id: "sh-b04",
        studentName: "Priya Sharma",
        studentId: "STU-1082",
        from: "2024-07-01",
        to: "Current",
        shift: "Morning",
        allocatedBy: "Library Admin",
        reason: "Allocated in Girls Silent Wing per preference",
      },
    ],
  },
  {
    id: "seat-1-b05",
    seatNo: "B-05",
    floor: "1st Floor",
    room: "Girls Silent Wing",
    row: "Row B",
    type: "Single Table",
    category: "Girls Only",
    pricePerMonth: 1300,
    status: "Available",
    shifts: {},
    history: [],
  },

  // 2nd Floor - Executive Cubicles (Row C)
  {
    id: "seat-2-c01",
    seatNo: "C-01",
    floor: "2nd Floor",
    room: "Executive Cubicles",
    row: "Row C",
    type: "Private Cabin",
    category: "Silent Cabin",
    pricePerMonth: 2200,
    status: "Occupied",
    shifts: {
      fullDay: {
        studentId: "STU-1088",
        studentName: "Aditya Roy",
        avatar: "/images/avatars/avatar-7.png",
        planName: "Full Day VIP Cabin Plan",
        planEnd: "2024-12-30",
        allocatedAt: "2024-05-10",
        shift: "Full Day",
      },
    },
    history: [],
    notes: "Includes soundproof acoustic partition, soft lighting & dedicated power unit",
  },
  {
    id: "seat-2-c02",
    seatNo: "C-02",
    floor: "2nd Floor",
    room: "Executive Cubicles",
    row: "Row C",
    type: "Private Cabin",
    category: "Silent Cabin",
    pricePerMonth: 2200,
    status: "Available",
    shifts: {},
    history: [],
    notes: "Private cabin with lockable under-desk storage",
  },
  {
    id: "seat-2-c03",
    seatNo: "C-03",
    floor: "2nd Floor",
    room: "Executive Cubicles",
    row: "Row C",
    type: "Computer Desk",
    category: "General",
    pricePerMonth: 1800,
    status: "Available",
    shifts: {},
    history: [],
    notes: "Equipped with 24-inch monitor & LAN cable for online tests",
  },
]

export const initialLockersData: LockerItem[] = [
  {
    id: "loc-1",
    lockerNo: "L-01",
    floor: "Ground Floor",
    room: "Locker Bay A",
    status: "Assigned",
    assignedStudent: {
      id: "STU-1083",
      name: "Rohan Verma",
      studentId: "STU-1083",
      phone: "+91 98765 43211",
      assignedAt: "2024-08-01",
    },
    depositAmount: 500,
    depositStatus: "Paid",
    keyStatus: "Issued",
  },
  {
    id: "loc-2",
    lockerNo: "L-02",
    floor: "Ground Floor",
    room: "Locker Bay A",
    status: "Available",
    depositAmount: 500,
    depositStatus: "Pending",
    keyStatus: "In Cabinet",
  },
  {
    id: "loc-3",
    lockerNo: "L-03",
    floor: "Ground Floor",
    room: "Locker Bay A",
    status: "Maintenance",
    depositAmount: 500,
    depositStatus: "Pending",
    keyStatus: "In Cabinet",
  },
  {
    id: "loc-14",
    lockerNo: "L-14",
    floor: "Ground Floor",
    room: "Locker Bay A",
    status: "Assigned",
    assignedStudent: {
      id: "STU-1081",
      name: "Aarav Patel",
      studentId: "STU-1081",
      phone: "+91 98765 43210",
      assignedAt: "2024-06-15",
    },
    depositAmount: 500,
    depositStatus: "Paid",
    keyStatus: "Issued",
  },
  {
    id: "loc-15",
    lockerNo: "L-15",
    floor: "1st Floor",
    room: "Girls Locker Room",
    status: "Assigned",
    assignedStudent: {
      id: "STU-1082",
      name: "Priya Sharma",
      studentId: "STU-1082",
      phone: "+91 98765 43212",
      assignedAt: "2024-07-01",
    },
    depositAmount: 500,
    depositStatus: "Paid",
    keyStatus: "Issued",
  },
  {
    id: "loc-16",
    lockerNo: "L-16",
    floor: "1st Floor",
    room: "Girls Locker Room",
    status: "Available",
    depositAmount: 500,
    depositStatus: "Pending",
    keyStatus: "In Cabinet",
  },
]

export const initialSeatChangeRequests: SeatChangeRequest[] = [
  {
    id: "scr-101",
    studentId: "STU-1085",
    studentName: "Vikas Dubey",
    avatar: "/images/avatars/avatar-4.png",
    currentSeat: "A-01 (Evening)",
    currentShift: "Evening Shift",
    requestedSeat: "A-06 (Evening)",
    requestedShift: "Evening Shift",
    requestedFloor: "Ground Floor",
    reason: "Prefer seat closer to the AC and water dispenser due to health reasons.",
    requestDate: "2024-10-30",
    status: "Pending",
    priority: "Normal",
  },
  {
    id: "scr-102",
    studentId: "STU-1087",
    studentName: "Devansh Rathore",
    avatar: "/images/avatars/avatar-6.png",
    currentSeat: "A-07 (Morning)",
    currentShift: "Morning Shift",
    requestedSeat: "C-01 (Full Day)",
    requestedShift: "Full Day",
    requestedFloor: "2nd Floor (Executive Cubicle)",
    reason: "Upgrading to UPSC Mains intensive study plan; need private acoustic cubicle.",
    requestDate: "2024-10-29",
    status: "Pending",
    priority: "High",
  },
  {
    id: "scr-100",
    studentId: "STU-1084",
    studentName: "Ananya Deshmukh",
    avatar: "/images/avatars/avatar-3.png",
    currentSeat: "B-02",
    currentShift: "Morning Shift",
    requestedSeat: "B-04",
    requestedShift: "Morning Shift",
    requestedFloor: "1st Floor",
    reason: "Requested seat next to study partner.",
    requestDate: "2024-10-20",
    status: "Approved",
    priority: "Normal",
    reviewedBy: "Library Admin",
    reviewedAt: "2024-10-21",
  },
]
