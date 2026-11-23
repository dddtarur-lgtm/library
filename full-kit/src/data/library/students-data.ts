export interface StudentProfile {
  id: string
  studentId: string
  name: string
  email: string
  phone: string
  avatar: string
  bannerBg?: string
  gender: "Male" | "Female" | "Other"
  dob: string
  bloodGroup: string
  address: string
  guardianName: string
  guardianPhone: string
  guardianRelation: string
  examTarget: string
  college: string
  targetYear: string

  // Membership & Allocation (PRD Sections 6, 16 & 18)
  branch: string
  status: "Live" | "Pending" | "Expired" | "Suspended"
  plan: string
  planDuration: string
  shift: string
  seatNo: string
  room: string
  floor: string
  lockerNo: string
  joinDate: string
  dueDate: string
  daysLeft: number
  totalFee: number
  paidAmount: number
  dueAmount: number
  feeStatus: "Paid" | "Pending" | "Overdue"
  qrCardId: string

  // Analytics (PRD Sections 5.3 & 5.4)
  analytics: {
    monthlyHours: number
    hoursGoal: number
    dailyAverageHours: number
    streakDays: number
    attendanceRate: number
    totalSessions: number
    onTimePercentage: number
    weeklyHours: { day: string; morning: number; evening: number; total: number }[]
    monthlyTrend: { month: string; hours: number; attendance: number }[]
  }

  // Attendance History (PRD Sections 7.3 & 20)
  attendanceHistory: {
    id: string
    date: string
    checkIn: string
    checkOut: string
    totalHours: string
    method: "QR Scan" | "Biometric" | "Staff Manual" | "Holiday / Off"
    status: "Present" | "Late Entry" | "Half Day" | "Absent" | "Holiday"
    notes?: string
  }[]

  // Payment & Invoices History (PRD Section 17 & 7.6)
  paymentHistory: {
    id: string
    invoiceNo: string
    date: string
    description: string
    amount: number
    mode: "UPI / QR" | "Cash" | "Credit Card" | "Net Banking"
    status: "Paid" | "Partial" | "Refunded"
    receiptUrl: string
  }[]

  // Book Lending History (PRD Section 7.4 & 19)
  bookHistory: {
    id: string
    bookTitle: string
    author: string
    category: string
    barcode: string
    issuedDate: string
    dueDate: string
    returnedDate?: string
    fine: number
    status: "Returned" | "Issued" | "Overdue"
  }[]

  // Seat Allocation History (PRD Section 18.5)
  seatHistory: {
    id: string
    seatNo: string
    shift: string
    allocatedAt: string
    releasedAt?: string
    allocatedBy: string
    reason: string
  }[]
}

export const studentsDatabase: StudentProfile[] = [
  {
    id: "1",
    studentId: "STU-1081",
    name: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    phone: "+91 98765 43210",
    avatar: "/images/avatars/male-01.svg",
    bannerBg: "/images/backgrounds/bg-01.jpg",
    gender: "Male",
    dob: "2001-04-12",
    bloodGroup: "O+",
    address: "H-42, Sector 15, Near City Metro, New Delhi",
    guardianName: "Rajesh Sharma",
    guardianPhone: "+91 98110 54321",
    guardianRelation: "Father",
    examTarget: "UPSC Civil Services (IAS/IPS)",
    college: "Delhi University (Pol. Science Hons)",
    targetYear: "2025",

    branch: "Central Study Hub (Main Branch)",
    status: "Live",
    plan: "UPSC 6-Month Pass",
    planDuration: "6 Months",
    shift: "Full Day (8:00 AM - 10:00 PM)",
    seatNo: "A-12",
    room: "Quiet Hall (AC Zone)",
    floor: "1st Floor",
    lockerNo: "L-14",
    joinDate: "2024-06-15",
    dueDate: "2024-12-15",
    daysLeft: 46,
    totalFee: 4500,
    paidAmount: 4500,
    dueAmount: 0,
    feeStatus: "Paid",
    qrCardId: "LIB-QR-1081-SECURE",

    analytics: {
      monthlyHours: 194,
      hoursGoal: 210,
      dailyAverageHours: 7.8,
      streakDays: 18,
      attendanceRate: 96.4,
      totalSessions: 52,
      onTimePercentage: 92,
      weeklyHours: [
        { day: "Mon", morning: 4.5, evening: 4.0, total: 8.5 },
        { day: "Tue", morning: 4.0, evening: 3.8, total: 7.8 },
        { day: "Wed", morning: 5.0, evening: 4.2, total: 9.2 },
        { day: "Thu", morning: 3.5, evening: 3.5, total: 7.0 },
        { day: "Fri", morning: 4.5, evening: 4.0, total: 8.5 },
        { day: "Sat", morning: 5.5, evening: 4.5, total: 10.0 },
        { day: "Sun", morning: 3.0, evening: 2.5, total: 5.5 },
      ],
      monthlyTrend: [
        { month: "Jun", hours: 160, attendance: 90 },
        { month: "Jul", hours: 178, attendance: 93 },
        { month: "Aug", hours: 185, attendance: 95 },
        { month: "Sep", hours: 172, attendance: 92 },
        { month: "Oct", hours: 194, attendance: 96 },
      ],
    },

    attendanceHistory: [
      {
        id: "att-31",
        date: "2024-10-31",
        checkIn: "-",
        checkOut: "-",
        totalHours: "0 hrs",
        method: "Holiday / Off",
        status: "Holiday",
        notes: "Diwali Public Holiday",
      },
      {
        id: "att-30",
        date: "2024-10-30",
        checkIn: "08:10 AM",
        checkOut: "09:20 PM",
        totalHours: "13 hrs 10 mins",
        method: "QR Scan",
        status: "Present",
      },
      {
        id: "att-29",
        date: "2024-10-29",
        checkIn: "08:05 AM",
        checkOut: "09:45 PM",
        totalHours: "13 hrs 40 mins",
        method: "QR Scan",
        status: "Present",
      },
      {
        id: "att-28",
        date: "2024-10-28",
        checkIn: "08:12 AM",
        checkOut: "09:30 PM",
        totalHours: "13 hrs 18 mins",
        method: "QR Scan",
        status: "Present",
      },
      {
        id: "att-27",
        date: "2024-10-27",
        checkIn: "09:20 AM",
        checkOut: "07:10 PM",
        totalHours: "9 hrs 50 mins",
        method: "QR Scan",
        status: "Late Entry",
      },
      {
        id: "att-26",
        date: "2024-10-26",
        checkIn: "08:00 AM",
        checkOut: "10:00 PM",
        totalHours: "14 hrs 00 mins",
        method: "Biometric",
        status: "Present",
      },
      {
        id: "att-25",
        date: "2024-10-25",
        checkIn: "08:10 AM",
        checkOut: "08:45 PM",
        totalHours: "12 hrs 35 mins",
        method: "QR Scan",
        status: "Present",
      },
      {
        id: "att-24",
        date: "2024-10-24",
        checkIn: "08:02 AM",
        checkOut: "01:15 PM",
        totalHours: "5 hrs 13 mins",
        method: "Staff Manual",
        status: "Half Day",
      },
      {
        id: "att-23",
        date: "2024-10-23",
        checkIn: "08:25 AM",
        checkOut: "09:30 PM",
        totalHours: "13 hrs 05 mins",
        method: "QR Scan",
        status: "Present",
      },
      {
        id: "att-22",
        date: "2024-10-22",
        checkIn: "08:00 AM",
        checkOut: "09:15 PM",
        totalHours: "13 hrs 15 mins",
        method: "QR Scan",
        status: "Present",
      },
      {
        id: "att-21",
        date: "2024-10-21",
        checkIn: "08:10 AM",
        checkOut: "09:40 PM",
        totalHours: "13 hrs 30 mins",
        method: "QR Scan",
        status: "Present",
      },
      {
        id: "att-20",
        date: "2024-10-20",
        checkIn: "-",
        checkOut: "-",
        totalHours: "0 hrs",
        method: "Holiday / Off",
        status: "Holiday",
        notes: "Sunday (Weekly Library Off)",
      },
      {
        id: "att-19",
        date: "2024-10-19",
        checkIn: "08:30 AM",
        checkOut: "10:00 PM",
        totalHours: "13 hrs 30 mins",
        method: "Biometric",
        status: "Present",
      },
      {
        id: "att-18",
        date: "2024-10-18",
        checkIn: "-",
        checkOut: "-",
        totalHours: "0 hrs",
        method: "Staff Manual",
        status: "Absent",
        notes: "Leave / Absent",
      },
      {
        id: "att-17",
        date: "2024-10-17",
        checkIn: "08:15 AM",
        checkOut: "09:30 PM",
        totalHours: "13 hrs 15 mins",
        method: "QR Scan",
        status: "Present",
      },
      {
        id: "att-16",
        date: "2024-10-16",
        checkIn: "08:05 AM",
        checkOut: "09:15 PM",
        totalHours: "13 hrs 10 mins",
        method: "QR Scan",
        status: "Present",
      },
      {
        id: "att-15",
        date: "2024-10-15",
        checkIn: "09:40 AM",
        checkOut: "08:30 PM",
        totalHours: "10 hrs 50 mins",
        method: "QR Scan",
        status: "Late Entry",
      },
      {
        id: "att-14",
        date: "2024-10-14",
        checkIn: "08:10 AM",
        checkOut: "09:30 PM",
        totalHours: "13 hrs 20 mins",
        method: "QR Scan",
        status: "Present",
      },
      {
        id: "att-13",
        date: "2024-10-13",
        checkIn: "-",
        checkOut: "-",
        totalHours: "0 hrs",
        method: "Holiday / Off",
        status: "Holiday",
        notes: "Sunday (Weekly Library Off)",
      },
      {
        id: "att-12",
        date: "2024-10-12",
        checkIn: "-",
        checkOut: "-",
        totalHours: "0 hrs",
        method: "Holiday / Off",
        status: "Holiday",
        notes: "Dussehra Public Holiday",
      },
      {
        id: "att-11",
        date: "2024-10-11",
        checkIn: "08:20 AM",
        checkOut: "09:45 PM",
        totalHours: "13 hrs 25 mins",
        method: "QR Scan",
        status: "Present",
      },
      {
        id: "att-10",
        date: "2024-10-10",
        checkIn: "08:00 AM",
        checkOut: "09:15 PM",
        totalHours: "13 hrs 15 mins",
        method: "QR Scan",
        status: "Present",
      },
      {
        id: "att-9",
        date: "2024-10-09",
        checkIn: "-",
        checkOut: "-",
        totalHours: "0 hrs",
        method: "Staff Manual",
        status: "Absent",
        notes: "College Exam Leave",
      },
      {
        id: "att-8",
        date: "2024-10-08",
        checkIn: "08:05 AM",
        checkOut: "09:35 PM",
        totalHours: "13 hrs 30 mins",
        method: "QR Scan",
        status: "Present",
      },
      {
        id: "att-7",
        date: "2024-10-07",
        checkIn: "08:15 AM",
        checkOut: "09:20 PM",
        totalHours: "13 hrs 05 mins",
        method: "QR Scan",
        status: "Present",
      },
      {
        id: "att-6b",
        date: "2024-10-06",
        checkIn: "-",
        checkOut: "-",
        totalHours: "0 hrs",
        method: "Holiday / Off",
        status: "Holiday",
        notes: "Sunday (Weekly Library Off)",
      },
      {
        id: "att-5b",
        date: "2024-10-05",
        checkIn: "08:30 AM",
        checkOut: "10:00 PM",
        totalHours: "13 hrs 30 mins",
        method: "QR Scan",
        status: "Present",
      },
      {
        id: "att-4b",
        date: "2024-10-04",
        checkIn: "08:00 AM",
        checkOut: "08:50 PM",
        totalHours: "12 hrs 50 mins",
        method: "Biometric",
        status: "Present",
      },
      {
        id: "att-3b",
        date: "2024-10-03",
        checkIn: "08:10 AM",
        checkOut: "09:40 PM",
        totalHours: "13 hrs 30 mins",
        method: "QR Scan",
        status: "Present",
      },
      {
        id: "att-2b",
        date: "2024-10-02",
        checkIn: "-",
        checkOut: "-",
        totalHours: "0 hrs",
        method: "Holiday / Off",
        status: "Holiday",
        notes: "Gandhi Jayanti Public Holiday",
      },
      {
        id: "att-1b",
        date: "2024-10-01",
        checkIn: "08:15 AM",
        checkOut: "09:30 PM",
        totalHours: "13 hrs 15 mins",
        method: "QR Scan",
        status: "Present",
      },
    ],

    paymentHistory: [
      {
        id: "pay-1",
        invoiceNo: "INV-2024-001081",
        date: "2024-06-15",
        description: "UPSC 6-Month Pass + Locker L-14",
        amount: 4500,
        mode: "UPI / QR",
        status: "Paid",
        receiptUrl: "#",
      },
      {
        id: "pay-2",
        invoiceNo: "INV-2024-000845",
        date: "2024-01-10",
        description: "Previous UPSC Foundation 6-Month Pass",
        amount: 4200,
        mode: "UPI / QR",
        status: "Paid",
        receiptUrl: "#",
      },
    ],

    bookHistory: [
      {
        id: "bk-1",
        bookTitle: "Indian Polity (6th Edition)",
        author: "M. Laxmikanth",
        category: "UPSC Preparation",
        barcode: "BK-POL-042",
        issuedDate: "2024-10-12",
        dueDate: "2024-10-26",
        returnedDate: "2024-10-25",
        fine: 0,
        status: "Returned",
      },
      {
        id: "bk-2",
        bookTitle: "A Brief History of Modern India",
        author: "Rajiv Ahir (Spectrum)",
        category: "History",
        barcode: "BK-HIS-119",
        issuedDate: "2024-10-20",
        dueDate: "2024-11-04",
        fine: 0,
        status: "Issued",
      },
      {
        id: "bk-3",
        bookTitle: "Certificate Physical and Human Geography",
        author: "G.C. Leong",
        category: "Geography",
        barcode: "BK-GEO-028",
        issuedDate: "2024-09-05",
        dueDate: "2024-09-19",
        returnedDate: "2024-09-18",
        fine: 0,
        status: "Returned",
      },
    ],

    seatHistory: [
      {
        id: "sh-1",
        seatNo: "A-12",
        shift: "Full Day (8 AM - 10 PM)",
        allocatedAt: "2024-06-15",
        allocatedBy: "Library Admin",
        reason: "Initial Enrollment and AC Zone preference",
      },
      {
        id: "sh-2",
        seatNo: "B-06",
        shift: "Morning (8 AM - 2 PM)",
        allocatedAt: "2024-01-10",
        releasedAt: "2024-06-14",
        allocatedBy: "Sub-Admin Priya",
        reason: "Upgraded to Full Day Pass on renewal",
      },
    ],
  },
  {
    id: "2",
    studentId: "STU-1082",
    name: "Ananya Patel",
    email: "ananya.patel@example.com",
    phone: "+91 98234 56789",
    avatar: "/images/avatars/female-01.svg",
    bannerBg: "/images/backgrounds/bg-02.jpg",
    gender: "Female",
    dob: "2003-08-21",
    bloodGroup: "B+",
    address: "B-12, Green Park Residency, Ahmedabad",
    guardianName: "Mahesh Patel",
    guardianPhone: "+91 98230 11223",
    guardianRelation: "Father",
    examTarget: "NEET UG 2025",
    college: "St. Xavier's High School",
    targetYear: "2025",

    branch: "Central Study Hub (Main Branch)",
    status: "Live",
    plan: "NEET 1-Year Pass",
    planDuration: "1 Year",
    shift: "Morning (8:00 AM - 2:00 PM)",
    seatNo: "B-04",
    room: "Girls Silent Wing",
    floor: "2nd Floor",
    lockerNo: "L-22",
    joinDate: "2024-07-01",
    dueDate: "2024-11-28",
    daysLeft: 29,
    totalFee: 3200,
    paidAmount: 3200,
    dueAmount: 0,
    feeStatus: "Paid",
    qrCardId: "LIB-QR-1082-SECURE",

    analytics: {
      monthlyHours: 142,
      hoursGoal: 150,
      dailyAverageHours: 5.8,
      streakDays: 24,
      attendanceRate: 98.1,
      totalSessions: 26,
      onTimePercentage: 96,
      weeklyHours: [
        { day: "Mon", morning: 5.5, evening: 0, total: 5.5 },
        { day: "Tue", morning: 5.8, evening: 0, total: 5.8 },
        { day: "Wed", morning: 6.0, evening: 0, total: 6.0 },
        { day: "Thu", morning: 5.2, evening: 0, total: 5.2 },
        { day: "Fri", morning: 6.0, evening: 0, total: 6.0 },
        { day: "Sat", morning: 6.2, evening: 0, total: 6.2 },
        { day: "Sun", morning: 4.0, evening: 0, total: 4.0 },
      ],
      monthlyTrend: [
        { month: "Jul", hours: 130, attendance: 95 },
        { month: "Aug", hours: 138, attendance: 97 },
        { month: "Sep", hours: 140, attendance: 96 },
        { month: "Oct", hours: 142, attendance: 98 },
      ],
    },

    attendanceHistory: [
      {
        id: "att-10",
        date: "2024-10-29",
        checkIn: "07:55 AM",
        checkOut: "02:05 PM",
        totalHours: "6 hrs 10 mins",
        method: "QR Scan",
        status: "Present",
      },
      {
        id: "att-11",
        date: "2024-10-28",
        checkIn: "08:00 AM",
        checkOut: "02:10 PM",
        totalHours: "6 hrs 10 mins",
        method: "QR Scan",
        status: "Present",
      },
    ],

    paymentHistory: [
      {
        id: "pay-10",
        invoiceNo: "INV-2024-001082",
        date: "2024-07-01",
        description: "NEET 1-Year Morning Pass",
        amount: 3200,
        mode: "Credit Card",
        status: "Paid",
        receiptUrl: "#",
      },
    ],

    bookHistory: [
      {
        id: "bk-10",
        bookTitle: "Trueman's Elementary Biology Vol 1 & 2",
        author: "K.N. Bhatia",
        category: "Medical / NEET",
        barcode: "BK-BIO-055",
        issuedDate: "2024-10-05",
        dueDate: "2024-10-19",
        returnedDate: "2024-10-18",
        fine: 0,
        status: "Returned",
      },
    ],

    seatHistory: [
      {
        id: "sh-10",
        seatNo: "B-04",
        shift: "Morning (8 AM - 2 PM)",
        allocatedAt: "2024-07-01",
        allocatedBy: "Library Admin",
        reason: "Allocated in Girls Silent Wing per preference",
      },
    ],
  },
]

export function getStudentById(idOrStudentId: string): StudentProfile {
  const cleanId = decodeURIComponent(idOrStudentId).toLowerCase()
  const found = studentsDatabase.find(
    (s) =>
      s.id.toLowerCase() === cleanId ||
      s.studentId.toLowerCase() === cleanId ||
      s.name.toLowerCase().includes(cleanId)
  )
  return found || studentsDatabase[0]
}
