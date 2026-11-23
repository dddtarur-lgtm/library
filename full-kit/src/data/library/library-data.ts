export interface BranchItem {
  id: string
  name: string
  address: string
  phone: string
  isMain: boolean
  isActive: boolean
  totalSeats: number
  occupiedSeats: number
  totalStudents: number
  monthlyRevenue: number
  subAdmins: string[]
  staffCount: number
  floorsCount: number
  coordinates: { lat: number; lng: number }
  allowedQrRadiusMeters: number
  facilities: string[]
  operatingHours: { open: string; close: string; weeklyOff: string }
}

export interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  studentCode: string
  avatar: string
  branch: string
  seatLabel: string
  shift: "Morning (6 AM - 2 PM)" | "Evening (2 PM - 10 PM)" | "Full Day (6 AM - 10 PM)" | "24x7 Night Owl"
  date: string
  timeIn: string
  timeOut: string | null
  totalMinutes: number | null
  method: "QR Scan" | "Staff Manual" | "Auto-Checkout"
  status: "Present" | "Late Entry" | "Under-time" | "Auto-Checkout" | "Absent"
  markedBy?: string
  note?: string
}

export interface AttendanceQrKioskConfig {
  id: string
  branchId: string
  branchName: string
  token: string
  qrDataUrl: string
  validDate: string
  expiryMode: "1 Day" | "1 Week" | "1 Month" | "Custom"
  expiresAt: string
  allowedRadiusMeters: number
  singleDeviceLock: boolean
  screenshotLeakProtection: boolean
  autoRenew: boolean
  posterSubtitle: string
}

export interface FeePlanItem {
  id: string
  name: string
  description: string
  durationDays: number
  price: number
  benefits: string[]
  isActive: boolean
  sortOrder: number
  enrolledStudentsCount: number
  badgeText?: string
}

export interface StudentMembershipRecord {
  id: string
  studentId: string
  studentCode: string
  studentName: string
  avatar: string
  branch: string
  seatNo: string
  planId: string
  planName: string
  startDate: string
  endDate: string
  daysLeft: number
  status: "Active" | "Expiring Soon" | "Grace Period" | "Expired" | "Cancelled"
  amountPaid: number
  paymentMode: "Cash" | "UPI" | "Razorpay" | "Bank Transfer"
  autoRenewal: boolean
}

export interface FeeDueRecord {
  id: string
  studentId: string
  studentCode: string
  studentName: string
  phone: string
  avatar: string
  branch: string
  membershipPlan: string
  totalFee: number
  paidAmount: number
  dueAmount: number
  dueDate: string
  status: "Pending" | "Overdue" | "Partially Paid"
  daysOverdue: number
  lastReminderSentAt?: string
}

export interface CouponItem {
  id: string
  code: string
  discountType: "Percentage" | "Flat Amount"
  discountValue: number
  minPurchaseAmount: number
  validUntil: string
  usageLimit: number
  usedCount: number
  isActive: boolean
}

export interface CashDayBookEntry {
  id: string
  date: string
  time: string
  staffName: string
  shift: "Morning" | "Evening"
  studentCode: string
  studentName: string
  amount: number
  paymentMode: "Cash" | "UPI QR" | "Card"
  receiptNo: string
  purpose: "New Admission" | "Plan Renewal" | "Locker Deposit" | "Book Fine" | "Partial Balance"
  notes?: string
}

export type StaffPermissionLevel = "No Access" | "View Only" | "Full Access"

export interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  role: "Library Admin" | "Sub Admin" | "Front Desk Staff"
  branchId: string
  branchName: string
  shift: "Morning (06:00 - 14:00)" | "Afternoon (14:00 - 22:00)" | "Night (22:00 - 06:00)" | "General All-Day"
  status: "Active" | "Paused" | "Invited"
  joinedAt: string
  lastActiveAt: string
  canViewRevenue: boolean
  actionsTodayCount: number
  collectionsToday: number
  templateUsed?: "Manager" | "Accountant" | "Front Desk" | "Marketing" | "Branch Manager" | "Custom"
  permissions: Record<string, "No Access" | "View Only" | "Full Access">
}

export interface BookItem {
  id: string
  bookNumber?: string
  title: string
  author: string
  isbn: string
  category: "UPSC & Civil Services" | "Medical & NEET" | "Engineering & JEE" | "Banking & SSC" | "Novels & Literature" | "General Studies"
  rackLocation: string
  totalCopies: number
  availableCopies: number
  issuedCopies: number
  price: number
  publisher: string
  editionYear: number
  coverImage: string
  rating: number
}

export interface BookLoanRecord {
  id: string
  bookId: string
  bookTitle: string
  bookIsbn: string
  copyBarcode: string
  studentId: string
  studentCode: string
  studentName: string
  avatar: string
  issuedAt: string
  dueDate: string
  returnedAt: string | null
  status: "Issued" | "Returned" | "Overdue" | "Lost"
  fineAmount: number
  fineStatus: "Unpaid" | "Paid" | "Waived" | "N/A"
}

export interface BookRequestItem {
  id: string
  title: string
  author: string
  category: string
  requestedByStudent: string
  studentCode: string
  requestDate: string
  upvotesCount: number
  status: "Requested" | "Under Review" | "Approved for Purchase" | "Procured"
}

export interface LiveStudySession {
  id: string
  studentId: string
  studentCode: string
  studentName: string
  avatar: string
  branch: string
  seatNo: string
  subjectTag: "UPSC Polity" | "NEET Organic Chemistry" | "JEE Advanced Math" | "CA Final Financial Reporting" | "General Reading"
  startedAt: string
  studyDurationMinutes: number
  breakMinutes: number
  currentStatus: "Focusing" | "Tea Break" | "Lunch Break" | "Completed"
  streakDays: number
}

export interface StudyLeaderboardEntry {
  rank: number
  studentId: string
  studentCode: string
  studentName: string
  avatar: string
  goal: string
  totalHoursThisWeek: number
  dailyAvgHours: number
  streakDays: number
  badges: string[]
  isAnonymous: boolean
}

export interface NotificationBroadcast {
  id: string
  title: string
  subtitle: string
  body: string
  audience: "All Students" | "Live Members Only" | "Pending Approval" | "Expired Members" | "Girls Only" | "Custom Branch"
  channels: ("Push" | "In-App" | "Email" | "SMS")[]
  displayMode: "Inbox" | "Modal Dialog"
  dialogType?: "Text Only" | "Half Image + Text" | "Full Screen Image Overlay"
  imageBanner?: string
  ctaText?: string
  ctaLink?: string
  priority: "Normal" | "Important" | "Urgent"
  status: "Sent" | "Scheduled" | "Draft"
  sentAt: string | null
  recipientsCount: number
  deliveredCount: number
  seenCount: number
  clickCount: number
}

export interface SmtpConfigState {
  providerType: "Platform SMTP" | "Custom Library SMTP"
  host: string
  port: number
  security: "TLS" | "SSL" | "None"
  username: string
  passwordMasked: string
  fromName: string
  fromEmail: string
  replyTo: string
  dailySendingLimit: number
  sentToday: number
  spfVerified: boolean
  dkimVerified: boolean
  lastTestResult: {
    status: "Success" | "Failed"
    timestamp: string
    message: string
  }
}

export interface TransactionalEmailLog {
  id: string
  recipientEmail: string
  recipientName: string
  templateName: "Fee Receipt" | "Membership Expiry" | "Welcome Student" | "Due Fee Reminder" | "Password Reset"
  subject: string
  sentAt: string
  status: "Delivered" | "Bounced" | "Failed" | "Queued"
  errorCode?: string
}

export interface ActivityLogItem {
  id: string
  timestamp: string
  actorId: string
  actorName: string
  actorRole: "Library Admin" | "Sub Admin" | "Front Desk Staff"
  avatar: string
  module: "Students" | "Fees & Plans" | "Seats" | "Attendance" | "Books" | "Settings" | "Security"
  action: string
  targetEntity: string
  entityId: string
  ipAddress: string
  device: string
  isRisky: boolean
  diff?: { before: string; after: string }
}

export interface SupportTicketItem {
  id: string
  ticketNo: string
  subject: string
  category: "Billing & Subscription" | "Hardware / Biometric" | "Feature Request" | "Bug Report" | "Account Support"
  priority: "Low" | "Normal" | "High" | "Urgent"
  status: "Open" | "In Progress" | "Resolved" | "Closed"
  createdAt: string
  updatedAt: string
  messagesCount: number
  lastMessagePreview: string
  messages: {
    id: string
    senderName: string
    senderRole: "Library Owner" | "Platform Support Specialist"
    avatar: string
    timestamp: string
    text: string
    attachments?: string[]
  }[]
}

// -------------------------------------------------------------
// SEED MOCK DATA
// -------------------------------------------------------------

export const initialBranches: BranchItem[] = [
  {
    id: "branch-central",
    name: "Main Branch - Central Library",
    address: "Plot 42, Knowledge Park, University Road, Ahmedabad, GJ",
    phone: "+91 79 4001 2345",
    isMain: true,
    isActive: true,
    totalSeats: 160,
    occupiedSeats: 142,
    totalStudents: 310,
    monthlyRevenue: 248000,
    subAdmins: ["Rohan Desai", "Pooja Mehta"], // 2 sub admins for main branch (PRD §40)
    staffCount: 5,
    floorsCount: 3,
    coordinates: { lat: 23.0338, lng: 72.5463 },
    allowedQrRadiusMeters: 100,
    facilities: ["High-speed 500Mbps Wi-Fi", "Dual AC Zones", "RO Drinking Water", "CCTV 24x7", "Power Backup 100%"],
    operatingHours: { open: "06:00 AM", close: "11:00 PM", weeklyOff: "None (Open 7 Days)" }
  },
  {
    id: "branch-west",
    name: "Branch 2 - West Campus Annex",
    address: "2nd Floor, Sterling Arcade, Drive-In Road, Ahmedabad, GJ",
    phone: "+91 79 4002 8899",
    isMain: false,
    isActive: true,
    totalSeats: 90,
    occupiedSeats: 74,
    totalStudents: 145,
    monthlyRevenue: 122000,
    subAdmins: ["Ankit Trivedi"], // 1 sub admin for satellite branch (PRD §40)
    staffCount: 3,
    floorsCount: 2,
    coordinates: { lat: 23.0512, lng: 72.5298 },
    allowedQrRadiusMeters: 75,
    facilities: ["Wi-Fi 300Mbps", "Silent Study Cabin", "Discussion Room", "Cafeteria Nook"],
    operatingHours: { open: "06:00 AM", close: "10:00 PM", weeklyOff: "Sundays (10 AM - 6 PM)" }
  },
  {
    id: "branch-north",
    name: "Branch 3 - North Tech Hub",
    address: "Tower B, Silicon Hills, Gandhinagar Highway, GJ",
    phone: "+91 79 4003 5511",
    isMain: false,
    isActive: true,
    totalSeats: 70,
    occupiedSeats: 58,
    totalStudents: 98,
    monthlyRevenue: 89000,
    subAdmins: ["Deepa Nair"],
    staffCount: 2,
    floorsCount: 1,
    coordinates: { lat: 23.1895, lng: 72.6452 },
    allowedQrRadiusMeters: 80,
    facilities: ["24x7 Biometric Entry", "Personal Lockers", "High-Speed Ethernet", "Ergonomic Chairs"],
    operatingHours: { open: "24 Hours (Round-the-Clock)", close: "24 Hours", weeklyOff: "None" }
  }
]

export const initialAttendanceRecords: AttendanceRecord[] = [
  {
    id: "att-001",
    studentId: "stu-1081",
    studentCode: "STU-1081",
    studentName: "Aarav Patel",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    branch: "Main Branch - Central Library",
    seatLabel: "Desk A-14",
    shift: "Full Day (6 AM - 10 PM)",
    date: "Today, 02 Nov",
    timeIn: "06:12 AM",
    timeOut: null,
    totalMinutes: 384,
    method: "QR Scan",
    status: "Present"
  },
  {
    id: "att-002",
    studentId: "stu-1082",
    studentCode: "STU-1082",
    studentName: "Priya Sharma",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    branch: "Main Branch - Central Library",
    seatLabel: "Desk B-08 (Girls Only)",
    shift: "Morning (6 AM - 2 PM)",
    date: "Today, 02 Nov",
    timeIn: "06:42 AM",
    timeOut: "01:50 PM",
    totalMinutes: 428,
    method: "QR Scan",
    status: "Late Entry",
    note: "Arrived 42m after 6:00 AM shift start"
  },
  {
    id: "att-003",
    studentId: "stu-1083",
    studentCode: "STU-1083",
    studentName: "Rohan Verma",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    branch: "Main Branch - Central Library",
    seatLabel: "Cabin C-02",
    shift: "Full Day (6 AM - 10 PM)",
    date: "Today, 02 Nov",
    timeIn: "07:05 AM",
    timeOut: null,
    totalMinutes: 330,
    method: "Staff Manual",
    status: "Present",
    markedBy: "Pooja Mehta (Sub Admin)",
    note: "Student phone battery dead; verified student digital ID card"
  },
  {
    id: "att-004",
    studentId: "stu-1084",
    studentCode: "STU-1084",
    studentName: "Ananya Iyer",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
    branch: "Branch 2 - West Campus Annex",
    seatLabel: "Desk W-21",
    shift: "Evening (2 PM - 10 PM)",
    date: "Today, 02 Nov",
    timeIn: "02:00 PM",
    timeOut: null,
    totalMinutes: 60,
    method: "QR Scan",
    status: "Present"
  },
  {
    id: "att-005",
    studentId: "stu-1085",
    studentCode: "STU-1085",
    studentName: "Kavita Reddy",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    branch: "Main Branch - Central Library",
    seatLabel: "Desk B-11 (Girls Only)",
    shift: "Morning (6 AM - 2 PM)",
    date: "Yesterday, 01 Nov",
    timeIn: "06:15 AM",
    timeOut: "11:00 PM",
    totalMinutes: 480,
    method: "Auto-Checkout",
    status: "Auto-Checkout",
    note: "Student forgot to scan out; checked out automatically at 11:00 PM closing"
  }
]

export const initialFeePlans: FeePlanItem[] = [
  {
    id: "plan-monthly-shift",
    name: "1 Month Single Shift (Morning / Evening)",
    description: "Dedicated reserved seat for morning (6 AM - 2 PM) or evening (2 PM - 10 PM) shifts with full amenities and book borrowing privileges.",
    durationDays: 30,
    price: 1200,
    benefits: [
      "Fixed reserved seat in designated shift",
      "Unlimited high-speed 500Mbps Wi-Fi",
      "Locker allocation eligible (optional)",
      "Issue up to 2 books from library catalog",
      "Digital Student ID Card in mobile app",
      "Air-conditioned quiet zone access"
    ],
    isActive: true,
    sortOrder: 1,
    enrolledStudentsCount: 124,
    badgeText: "Most Popular"
  },
  {
    id: "plan-monthly-fullday",
    name: "1 Month Full Day Intensive",
    description: "Unrestricted seat access from 6:00 AM to 10:00 PM daily. Ideal for UPSC, NEET, and CA final aspirants.",
    durationDays: 30,
    price: 1800,
    benefits: [
      "All-day dedicated personal desk (6 AM - 10 PM)",
      "Complimentary dedicated locker included",
      "Issue up to 4 books simultaneously",
      "Quiet focus study tracking & streak badges",
      "Priority charging point & RO water access",
      "Study discussion room booking access"
    ],
    isActive: true,
    sortOrder: 2,
    enrolledStudentsCount: 168,
    badgeText: "Best for Aspirants"
  },
  {
    id: "plan-quarterly-fullday",
    name: "3 Months Full Day Super Saver",
    description: "Comprehensive 90-day plan offering maximum value and uninterrupted seat allocation for dedicated competitive study.",
    durationDays: 90,
    price: 4800,
    benefits: [
      "Guaranteed seat reservation for 90 days",
      "Free locker for entire duration",
      "Unlimited book circulation privileges",
      "10% discount on printout & cafeteria services",
      "Exam mock test resources in student app"
    ],
    isActive: true,
    sortOrder: 3,
    enrolledStudentsCount: 82,
    badgeText: "Save ₹600"
  },
  {
    id: "plan-annual-pro",
    name: "1 Year Unlimited 24x7 Fellowship",
    description: "Annual all-access pass for 365 days including round-the-clock entry, permanent desk, and premium cabin access.",
    durationDays: 365,
    price: 18000,
    benefits: [
      "Permanent premium cabin desk all year",
      "24x7 Night Owl access with biometric backup",
      "Free locker & dedicated power station",
      "Personalized student achievement wall feature",
      "Zero late fee on book returns"
    ],
    isActive: true,
    sortOrder: 4,
    enrolledStudentsCount: 35,
    badgeText: "VIP Fellowship"
  }
]

export const initialStudentMemberships: StudentMembershipRecord[] = [
  {
    id: "mem-101",
    studentId: "stu-1081",
    studentCode: "STU-1081",
    studentName: "Aarav Patel",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    branch: "Main Branch - Central Library",
    seatNo: "Desk A-14",
    planId: "plan-monthly-fullday",
    planName: "1 Month Full Day Intensive",
    startDate: "15 Oct 2026",
    endDate: "14 Nov 2026",
    daysLeft: 12,
    status: "Active",
    amountPaid: 1800,
    paymentMode: "UPI",
    autoRenewal: true
  },
  {
    id: "mem-102",
    studentId: "stu-1082",
    studentCode: "STU-1082",
    studentName: "Priya Sharma",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    branch: "Main Branch - Central Library",
    seatNo: "Desk B-08",
    planId: "plan-monthly-shift",
    planName: "1 Month Single Shift (Morning)",
    startDate: "05 Oct 2026",
    endDate: "04 Nov 2026",
    daysLeft: 2,
    status: "Expiring Soon",
    amountPaid: 1200,
    paymentMode: "Razorpay",
    autoRenewal: false
  },
  {
    id: "mem-103",
    studentId: "stu-1086",
    studentCode: "STU-1086",
    studentName: "Siddharth Rao",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    branch: "Branch 2 - West Campus Annex",
    seatNo: "Desk W-05",
    planId: "plan-monthly-shift",
    planName: "1 Month Single Shift (Evening)",
    startDate: "28 Sep 2026",
    endDate: "28 Oct 2026",
    daysLeft: 0,
    status: "Grace Period",
    amountPaid: 1200,
    paymentMode: "Cash",
    autoRenewal: false
  }
]

export const initialFeeDues: FeeDueRecord[] = [
  {
    id: "due-001",
    studentId: "stu-1087",
    studentCode: "STU-1087",
    studentName: "Mehul Joshi",
    phone: "+91 98250 11223",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    branch: "Main Branch - Central Library",
    membershipPlan: "3 Months Full Day Super Saver",
    totalFee: 4800,
    paidAmount: 2400,
    dueAmount: 2400,
    dueDate: "25 Oct 2026",
    status: "Overdue",
    daysOverdue: 8,
    lastReminderSentAt: "01 Nov 2026"
  },
  {
    id: "due-002",
    studentId: "stu-1088",
    studentCode: "STU-1088",
    studentName: "Divya Nair",
    phone: "+91 97240 55667",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    branch: "Main Branch - Central Library",
    membershipPlan: "1 Month Full Day Intensive",
    totalFee: 1800,
    paidAmount: 1000,
    dueAmount: 800,
    dueDate: "05 Nov 2026",
    status: "Pending",
    daysOverdue: 0
  }
]

export const initialStaffMembers: StaffMember[] = [
  {
    id: "staff-1",
    name: "Vikram Singhania",
    email: "vikram.owner@shelfspace.in",
    phone: "+91 98790 12345",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    role: "Library Admin",
    branchId: "branch-central",
    branchName: "All Branches (Owner Access)",
    shift: "General All-Day",
    status: "Active",
    joinedAt: "12 Jan 2025",
    lastActiveAt: "Just now",
    canViewRevenue: true,
    actionsTodayCount: 42,
    collectionsToday: 8400,
    templateUsed: "Manager",
    permissions: {
      dashboard: "Full Access",
      students: "Full Access",
      plansAndFees: "Full Access",
      seats: "Full Access",
      attendance: "Full Access",
      studyHours: "Full Access",
      books: "Full Access",
      notifications: "Full Access",
      publicPage: "Full Access",
      reports: "Full Access",
      branches: "Full Access",
      staff: "Full Access",
      smtp: "Full Access",
      settings: "Full Access",
      activityLog: "Full Access"
    }
  },
  {
    id: "staff-2",
    name: "Rohan Desai",
    email: "rohan.desai@shelfspace.in",
    phone: "+91 98251 77889",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    role: "Sub Admin",
    branchId: "branch-central",
    branchName: "Main Branch - Central Library",
    shift: "Morning (06:00 - 14:00)",
    status: "Active",
    joinedAt: "01 Mar 2025",
    lastActiveAt: "10 mins ago",
    canViewRevenue: false, // Revenue hidden by default per PRD §30.10 & §40
    actionsTodayCount: 28,
    collectionsToday: 3600,
    templateUsed: "Manager",
    permissions: {
      dashboard: "View Only",
      students: "Full Access",
      plansAndFees: "Full Access",
      seats: "Full Access",
      attendance: "Full Access",
      studyHours: "View Only",
      books: "Full Access",
      notifications: "Full Access",
      publicPage: "View Only",
      reports: "View Only",
      branches: "View Only",
      staff: "No Access",
      smtp: "No Access",
      settings: "No Access",
      activityLog: "View Only"
    }
  },
  {
    id: "staff-3",
    name: "Pooja Mehta",
    email: "pooja.mehta@shelfspace.in",
    phone: "+91 98255 44332",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    role: "Sub Admin",
    branchId: "branch-central",
    branchName: "Main Branch - Central Library",
    shift: "Afternoon (14:00 - 22:00)",
    status: "Active",
    joinedAt: "15 Apr 2025",
    lastActiveAt: "1 hour ago",
    canViewRevenue: false,
    actionsTodayCount: 19,
    collectionsToday: 4800,
    templateUsed: "Accountant",
    permissions: {
      dashboard: "View Only",
      students: "Full Access",
      plansAndFees: "Full Access",
      seats: "View Only",
      attendance: "Full Access",
      studyHours: "No Access",
      books: "View Only",
      notifications: "View Only",
      publicPage: "No Access",
      reports: "Full Access",
      branches: "View Only",
      staff: "No Access",
      smtp: "No Access",
      settings: "No Access",
      activityLog: "View Only"
    }
  },
  {
    id: "staff-4",
    name: "Ankit Trivedi",
    email: "ankit.trivedi@shelfspace.in",
    phone: "+91 98258 99001",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    role: "Sub Admin",
    branchId: "branch-west",
    branchName: "Branch 2 - West Campus Annex",
    shift: "Morning (06:00 - 14:00)",
    status: "Active",
    joinedAt: "10 Jun 2025",
    lastActiveAt: "25 mins ago",
    canViewRevenue: false,
    actionsTodayCount: 15,
    collectionsToday: 2400,
    templateUsed: "Branch Manager",
    permissions: {
      dashboard: "View Only",
      students: "Full Access",
      plansAndFees: "Full Access",
      seats: "Full Access",
      attendance: "Full Access",
      studyHours: "View Only",
      books: "Full Access",
      notifications: "Full Access",
      publicPage: "No Access",
      reports: "View Only",
      branches: "View Only",
      staff: "No Access",
      smtp: "No Access",
      settings: "No Access",
      activityLog: "View Only"
    }
  }
]

export const initialBooksCatalog: BookItem[] = [
  {
    id: "book-01",
    title: "Indian Polity (7th Edition)",
    author: "M. Laxmikanth",
    isbn: "978-9355325051",
    category: "UPSC & Civil Services",
    rackLocation: "Rack A-01 (Shelf 2)",
    totalCopies: 6,
    availableCopies: 2,
    issuedCopies: 4,
    price: 895,
    publisher: "McGraw Hill",
    editionYear: 2023,
    coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80",
    rating: 4.9
  },
  {
    id: "book-02",
    title: "A Brief History of Modern India",
    author: "Rajiv Ahir (Spectrum)",
    isbn: "978-8179307447",
    category: "UPSC & Civil Services",
    rackLocation: "Rack A-01 (Shelf 3)",
    totalCopies: 5,
    availableCopies: 1,
    issuedCopies: 4,
    price: 495,
    publisher: "Spectrum Books",
    editionYear: 2024,
    coverImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&auto=format&fit=crop&q=80",
    rating: 4.8
  },
  {
    id: "book-03",
    title: "Objective Biology for NEET (Vol 1 & 2)",
    author: "Dr. Ali & Dr. Sharma",
    isbn: "978-9389971212",
    category: "Medical & NEET",
    rackLocation: "Rack B-04 (Shelf 1)",
    totalCopies: 4,
    availableCopies: 3,
    issuedCopies: 1,
    price: 1150,
    publisher: "MTG Learning",
    editionYear: 2024,
    coverImage: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=300&auto=format&fit=crop&q=80",
    rating: 4.7
  },
  {
    id: "book-04",
    title: "Concepts of Physics (Part 1 & 2)",
    author: "H.C. Verma",
    isbn: "978-8177091878",
    category: "Engineering & JEE",
    rackLocation: "Rack C-02 (Shelf 4)",
    totalCopies: 8,
    availableCopies: 5,
    issuedCopies: 3,
    price: 950,
    publisher: "Bharati Bhawan",
    editionYear: 2022,
    coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&auto=format&fit=crop&q=80",
    rating: 5.0
  }
]

export const initialBookLoans: BookLoanRecord[] = [
  {
    id: "loan-01",
    bookId: "book-01",
    bookTitle: "Indian Polity (7th Edition)",
    bookIsbn: "978-9355325051",
    copyBarcode: "BK-POL-003",
    studentId: "stu-1081",
    studentCode: "STU-1081",
    studentName: "Aarav Patel",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    issuedAt: "24 Oct 2026",
    dueDate: "07 Nov 2026",
    returnedAt: null,
    status: "Issued",
    fineAmount: 0,
    fineStatus: "N/A"
  },
  {
    id: "loan-02",
    bookId: "book-02",
    bookTitle: "A Brief History of Modern India",
    bookIsbn: "978-8179307447",
    copyBarcode: "BK-HIS-002",
    studentId: "stu-1089",
    studentCode: "STU-1089",
    studentName: "Jayesh Shah",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    issuedAt: "10 Oct 2026",
    dueDate: "24 Oct 2026",
    returnedAt: null,
    status: "Overdue",
    fineAmount: 45, // 9 days overdue x ₹5/day
    fineStatus: "Unpaid"
  }
]

export const initialLiveStudySessions: LiveStudySession[] = [
  {
    id: "sess-01",
    studentId: "stu-1081",
    studentCode: "STU-1081",
    studentName: "Aarav Patel",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    branch: "Main Branch - Central Library",
    seatNo: "Desk A-14",
    subjectTag: "UPSC Polity",
    startedAt: "06:15 AM",
    studyDurationMinutes: 340,
    breakMinutes: 30,
    currentStatus: "Focusing",
    streakDays: 14
  },
  {
    id: "sess-02",
    studentId: "stu-1082",
    studentCode: "STU-1082",
    studentName: "Priya Sharma",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    branch: "Main Branch - Central Library",
    seatNo: "Desk B-08",
    subjectTag: "NEET Organic Chemistry",
    startedAt: "06:45 AM",
    studyDurationMinutes: 290,
    breakMinutes: 15,
    currentStatus: "Tea Break",
    streakDays: 21
  },
  {
    id: "sess-03",
    studentId: "stu-1084",
    studentCode: "STU-1084",
    studentName: "Ananya Iyer",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
    branch: "Branch 2 - West Campus Annex",
    seatNo: "Desk W-21",
    subjectTag: "CA Final Financial Reporting",
    startedAt: "02:10 PM",
    studyDurationMinutes: 50,
    breakMinutes: 0,
    currentStatus: "Focusing",
    streakDays: 8
  }
]

export const initialStudyLeaderboard: StudyLeaderboardEntry[] = [
  {
    rank: 1,
    studentId: "stu-1082",
    studentCode: "STU-1082",
    studentName: "Priya Sharma",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    goal: "NEET 2027 Aspirant",
    totalHoursThisWeek: 58.5,
    dailyAvgHours: 8.3,
    streakDays: 21,
    badges: ["Top Reader", "3-Week Streak", "Early Bird"],
    isAnonymous: false
  },
  {
    rank: 2,
    studentId: "stu-1081",
    studentCode: "STU-1081",
    studentName: "Aarav Patel",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    goal: "UPSC CSE 2027",
    totalHoursThisWeek: 54.2,
    dailyAvgHours: 7.7,
    streakDays: 14,
    badges: ["Focus Master", "100-Hour Club"],
    isAnonymous: false
  },
  {
    rank: 3,
    studentId: "stu-1090",
    studentCode: "STU-1090",
    studentName: "Student #1090",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    goal: "JEE Advanced 2027",
    totalHoursThisWeek: 49.0,
    dailyAvgHours: 7.0,
    streakDays: 10,
    badges: ["Math Wizard"],
    isAnonymous: true // Student chose privacy mode (PRD §39)
  }
]

export const initialNotifications: NotificationBroadcast[] = [
  {
    id: "notif-01",
    title: "Diwali Extended Hours & Festival Schedule",
    subtitle: "Central Library will remain open from 6:00 AM to 11:00 PM throughout the festive week.",
    body: "Dear students, wishing you all a joyous and productive Diwali! To support your upcoming exam preparations, all study rooms and AC zones will operate without holiday interruption.",
    audience: "All Students",
    channels: ["Push", "In-App"],
    displayMode: "Modal Dialog",
    dialogType: "Half Image + Text",
    imageBanner: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80",
    ctaText: "View Holiday Timings",
    ctaLink: "/pages/attendance",
    priority: "Important",
    status: "Sent",
    sentAt: "01 Nov 2026, 09:30 AM",
    recipientsCount: 455,
    deliveredCount: 442,
    seenCount: 388,
    clickCount: 164
  },
  {
    id: "notif-02",
    title: "Quarterly Fee Renewal Reminder (Grace Period Notice)",
    subtitle: "Please renew your seat subscription before 5th Nov to keep your reserved desk.",
    body: "Kindly settle your outstanding balance or renew your plan. As per library policy, seats are held for a maximum 5-day grace period.",
    audience: "Expired Members",
    channels: ["Push", "Email", "SMS"],
    displayMode: "Inbox",
    priority: "Urgent",
    status: "Sent",
    sentAt: "31 Oct 2026, 11:00 AM",
    recipientsCount: 32,
    deliveredCount: 32,
    seenCount: 29,
    clickCount: 18
  }
]

export const initialSmtpConfig: SmtpConfigState = {
  providerType: "Platform SMTP",
  host: "smtp.shelfspace-lms.com",
  port: 587,
  security: "TLS",
  username: "library-notifications@shelfspace-lms.com",
  passwordMasked: "••••••••••••••••••••",
  fromName: "Central Study Library (via ShelfSpace)",
  fromEmail: "central-library@notifications.shelfspace.in",
  replyTo: "support@centrallibrary.com",
  dailySendingLimit: 1000,
  sentToday: 418,
  spfVerified: true,
  dkimVerified: true,
  lastTestResult: {
    status: "Success",
    timestamp: "02 Nov 2026, 08:15 AM",
    message: "Handshake verified with 250 OK. Test email delivered in 420ms."
  }
}

export const initialActivityLogs: ActivityLogItem[] = [
  {
    id: "act-01",
    timestamp: "Today, 06:45 AM",
    actorId: "staff-2",
    actorName: "Rohan Desai",
    actorRole: "Sub Admin",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    module: "Attendance",
    action: "Manual Attendance Override",
    targetEntity: "Student Check-in (STU-1083)",
    entityId: "STU-1083",
    ipAddress: "192.168.1.45 (Front Desk PC)",
    device: "Windows Chrome 129",
    isRisky: true, // Risky flag for manual attendance edit (PRD §26)
    diff: { before: "Status: Absent", after: "Status: Present (Marked by Staff)" }
  },
  {
    id: "act-02",
    timestamp: "Today, 07:15 AM",
    actorId: "staff-3",
    actorName: "Pooja Mehta",
    actorRole: "Sub Admin",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    module: "Fees & Plans",
    action: "Collected Fee Payment",
    targetEntity: "Receipt #REC-2026-904",
    entityId: "PAY-0042",
    ipAddress: "192.168.1.46 (Desk POS)",
    device: "iPad Safari 18",
    isRisky: false,
    diff: { before: "Due: ₹1,800", after: "Paid: ₹1,800 (UPI QR)" }
  },
  {
    id: "act-03",
    timestamp: "Yesterday, 04:30 PM",
    actorId: "staff-1",
    actorName: "Vikram Singhania",
    actorRole: "Library Admin",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    module: "Seats",
    action: "Reallocated Desk",
    targetEntity: "Student Seat Change (STU-1081)",
    entityId: "STU-1081",
    ipAddress: "103.21.144.12",
    device: "MacBook Pro Chrome 130",
    isRisky: false,
    diff: { before: "Assigned: Desk A-10", after: "Assigned: Desk A-14" }
  }
]

export const initialSupportTickets: SupportTicketItem[] = [
  {
    id: "tick-01",
    ticketNo: "TICK-402",
    subject: "Requesting additional SMS quota for Diwali announcements",
    category: "Billing & Subscription",
    priority: "Normal",
    status: "In Progress",
    createdAt: "01 Nov 2026, 10:20 AM",
    updatedAt: "01 Nov 2026, 02:40 PM",
    messagesCount: 3,
    lastMessagePreview: "We have credited 500 bonus SMS to your library account for Diwali season.",
    messages: [
      {
        id: "msg-1",
        senderName: "Vikram Singhania",
        senderRole: "Library Owner",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
        timestamp: "01 Nov 2026, 10:20 AM",
        text: "Hi Support Team, our Growth plan gives us 1,000 SMS per month. Can we purchase an add-on pack of 500 SMS for our festive schedule notice?"
      },
      {
        id: "msg-2",
        senderName: "Arun Rao (ShelfSpace Support)",
        senderRole: "Platform Support Specialist",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        timestamp: "01 Nov 2026, 02:40 PM",
        text: "Hello Vikram! We have credited 500 bonus SMS to your library account for the Diwali season. You can verify your balance under Email & SMS Management."
      }
    ]
  },
  {
    id: "tick-02",
    ticketNo: "TICK-398",
    subject: "Assistance configuring biometric turnstile integration for Branch 3",
    category: "Hardware / Biometric",
    priority: "High",
    status: "Open",
    createdAt: "30 Oct 2026, 04:15 PM",
    updatedAt: "30 Oct 2026, 05:00 PM",
    messagesCount: 1,
    lastMessagePreview: "We are setting up the eSSL turnstile at Silicon Hills. Please provide the webhook API endpoint.",
    messages: [
      {
        id: "msg-3",
        senderName: "Vikram Singhania",
        senderRole: "Library Owner",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
        timestamp: "30 Oct 2026, 04:15 PM",
        text: "We are setting up the eSSL turnstile at Silicon Hills. Please provide the webhook API endpoint and secret key to sync in-time and out-time with the ShelfSpace database."
      }
    ]
  }
]

export function getStaffMemberById(id: string): StaffMember {
  const found = initialStaffMembers.find((s) => s.id === id)
  if (found) return found
  return initialStaffMembers[0]
}

