export interface PlatformKPIs {
  totalLibraries: number
  totalLibrariesGrowth: number // e.g. +14 this quarter
  activeLibraries: number
  activeLibrariesRate: number // e.g. 90.1%
  pendingApprovals: number
  inGracePeriod: number
  graceDaysNotice: number // 5 days grace period rule
  lockedLibraries: number
  lockedImpactStudents: number
  liveStudents: number
  liveStudentsGrowth: number // e.g. +840 this month
  revenueThisMonth: number // in INR (e.g. 482500)
  revenueGrowthPercent: number // e.g. +18.4%
  failedPayments: number
  failedPaymentsAmount: number
  lastUpdated: string
}

export interface LibraryRequest {
  id: string
  requestNumber: string
  libraryName: string
  logo?: string
  ownerName: string
  mobile: string
  email: string
  city: string
  state: string
  submittedDate: string
  chosenPlan: "Starter" | "Growth" | "Pro" | "Enterprise"
  billingCycle: "Monthly" | "Quarterly" | "Annual"
  feeAmount: number
  branchesPlanned: number
  plannedSeats: number
  documentCheck: {
    emailVerified: boolean
    mobileVerified: boolean
    aadhaarUploaded: boolean
    gstOrRegistrationUploaded: boolean
    ownershipProofUploaded: boolean
  }
  documents: {
    title: string
    fileName: string
    fileSize: string
    fileUrl: string
  }[]
  duplicateWarning?: string
  status: "Pending" | "More information needed" | "Approved" | "Rejected"
  notes?: string
}

export interface ExpiringLibraryPlan {
  id: string
  libraryCode: string
  libraryName: string
  logo?: string
  ownerName: string
  phone: string
  planName: string
  planFee: number
  expiryDate: string
  daysLeft: number
  isInGrace: boolean
  graceDaysLeft?: number
  liveStudents: number
  renewalProbability: "High" | "Medium" | "Low"
}

export interface GraceAndLockedLibrary {
  id: string
  libraryCode: string
  libraryName: string
  logo?: string
  ownerName: string
  phone: string
  city: string
  planName: string
  status: "Grace" | "Locked" | "Suspended"
  reason: string
  graceDaysRemaining?: number
  affectedStudents: number
  affectedStaff: number
  sinceDate: string
}

export interface PlatformPayment {
  id: string
  transactionId: string
  libraryCode: string
  libraryName: string
  logo?: string
  planName: string
  amount: number
  method: "Razorpay" | "UPI" | "Bank Transfer" | "Cash" | "Cheque"
  type: "Subscription" | "Renewal" | "Branch Expansion" | "Manual Adjust"
  timestamp: string
  status: "Success" | "Failed" | "Pending"
  referenceNumber: string
}

export interface PlatformSupportTicket {
  id: string
  ticketNumber: string
  libraryCode: string
  libraryName: string
  logo?: string
  contactPerson: string
  subject: string
  category:
    | "Billing & Plans"
    | "Student App Issues"
    | "Seat Matrix"
    | "Email Sync"
    | "Technical"
  priority: "Urgent" | "High" | "Normal"
  status: "Open" | "In Progress" | "Resolved"
  createdTime: string
  assignedRole: string
}

export interface EmailConnectionHealth {
  id: string
  libraryCode: string
  libraryName: string
  logo?: string
  provider: "Google Workspace" | "Microsoft 365" | "Custom Domain"
  connectedEmail: string
  status: "Connected" | "Needs reconnect" | "Disconnected"
  lastSuccessfulSend: string
  lastError?: string
  failureCount: number
}

export interface PlatformLibraryRecord {
  id: string
  code: string
  name: string
  logo: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  city: string
  state: string
  branchesCount: number
  planName: string
  planFee: number
  planStatus: "Trial" | "Active" | "Grace" | "Locked" | "Expired"
  planEndDate: string
  liveStudents: number
  totalSeats: number
  emailConnection: "Connected" | "Needs reconnect" | "Not connected"
  libraryStatus: "Active" | "Suspended" | "Locked" | "Closed"
  joinedDate: string
}

// Initial Platform Store Data
export const initialPlatformKPIs: PlatformKPIs = {
  totalLibraries: 142,
  totalLibrariesGrowth: 14,
  activeLibraries: 128,
  activeLibrariesRate: 90.1,
  pendingApprovals: 6,
  inGracePeriod: 4,
  graceDaysNotice: 5,
  lockedLibraries: 3,
  lockedImpactStudents: 412,
  liveStudents: 14850,
  liveStudentsGrowth: 840,
  revenueThisMonth: 482500,
  revenueGrowthPercent: 18.4,
  failedPayments: 2,
  failedPaymentsAmount: 9400,
  lastUpdated: "Just now",
}

export const initialPendingRequests: LibraryRequest[] = [
  {
    id: "req-101",
    requestNumber: "REQ-2026-089",
    libraryName: "Apex Study Hub & Library",
    ownerName: "Rajeshwar Sharma",
    mobile: "+91 98290 14820",
    email: "apex.studyhub@gmail.com",
    city: "Jaipur",
    state: "Rajasthan",
    submittedDate: "03 Nov 2026, 14:20",
    chosenPlan: "Growth",
    billingCycle: "Annual",
    feeAmount: 38400,
    branchesPlanned: 2,
    plannedSeats: 220,
    documentCheck: {
      emailVerified: true,
      mobileVerified: true,
      aadhaarUploaded: true,
      gstOrRegistrationUploaded: true,
      ownershipProofUploaded: true,
    },
    documents: [
      {
        title: "Aadhaar Card (Owner)",
        fileName: "rajeshwar_aadhaar_verified.pdf",
        fileSize: "1.2 MB",
        fileUrl: "#",
      },
      {
        title: "Shop & Commercial Establishment Act",
        fileName: "apex_jaipur_license.pdf",
        fileSize: "2.4 MB",
        fileUrl: "#",
      },
      {
        title: "Rental Lease Agreement (5 Years)",
        fileName: "lease_apex_hub.pdf",
        fileSize: "4.1 MB",
        fileUrl: "#",
      },
    ],
    status: "Pending",
    notes: "Owner requested 2 branch licenses on onboarding.",
  },
  {
    id: "req-102",
    requestNumber: "REQ-2026-090",
    libraryName: "Pratibha Reading Lounge",
    ownerName: "Neha Kulkarni",
    mobile: "+91 94220 58190",
    email: "neha.pratibha@rediffmail.com",
    city: "Pune",
    state: "Maharashtra",
    submittedDate: "03 Nov 2026, 18:45",
    chosenPlan: "Pro",
    billingCycle: "Quarterly",
    feeAmount: 14200,
    branchesPlanned: 1,
    plannedSeats: 160,
    documentCheck: {
      emailVerified: true,
      mobileVerified: true,
      aadhaarUploaded: true,
      gstOrRegistrationUploaded: true,
      ownershipProofUploaded: false,
    },
    documents: [
      {
        title: "Aadhaar Card",
        fileName: "neha_kulkarni_aadhaar.pdf",
        fileSize: "980 KB",
        fileUrl: "#",
      },
      {
        title: "MSME Udyam Registration",
        fileName: "pratibha_udyam_cert.pdf",
        fileSize: "1.1 MB",
        fileUrl: "#",
      },
    ],
    duplicateWarning: "Similar phone number matched archive record from 2024",
    status: "Pending",
  },
  {
    id: "req-103",
    requestNumber: "REQ-2026-091",
    libraryName: "Samarpan Central Library",
    ownerName: "Chirag Patel",
    mobile: "+91 98980 32110",
    email: "chirag.samarpan@gmail.com",
    city: "Ahmedabad",
    state: "Gujarat",
    submittedDate: "04 Nov 2026, 09:15",
    chosenPlan: "Enterprise",
    billingCycle: "Annual",
    feeAmount: 72000,
    branchesPlanned: 4,
    plannedSeats: 540,
    documentCheck: {
      emailVerified: true,
      mobileVerified: true,
      aadhaarUploaded: true,
      gstOrRegistrationUploaded: true,
      ownershipProofUploaded: true,
    },
    documents: [
      {
        title: "Aadhaar & PAN",
        fileName: "chirag_kyc_pack.pdf",
        fileSize: "2.8 MB",
        fileUrl: "#",
      },
      {
        title: "GST Certificate (Gujarat)",
        fileName: "samarpan_gst_cert.pdf",
        fileSize: "1.6 MB",
        fileUrl: "#",
      },
    ],
    status: "Pending",
    notes:
      "Main branch has 2 sub admins configured; 3 extension branches planned.",
  },
  {
    id: "req-104",
    requestNumber: "REQ-2026-092",
    libraryName: "Sankalp Youth Library",
    ownerName: "Vikram Bundela",
    mobile: "+91 97550 49122",
    email: "sankalp.indore@gmail.com",
    city: "Indore",
    state: "Madhya Pradesh",
    submittedDate: "04 Nov 2026, 11:30",
    chosenPlan: "Starter",
    billingCycle: "Monthly",
    feeAmount: 2400,
    branchesPlanned: 1,
    plannedSeats: 80,
    documentCheck: {
      emailVerified: true,
      mobileVerified: false,
      aadhaarUploaded: true,
      gstOrRegistrationUploaded: false,
      ownershipProofUploaded: false,
    },
    documents: [
      {
        title: "PAN Card",
        fileName: "vikram_pan.jpg",
        fileSize: "620 KB",
        fileUrl: "#",
      },
    ],
    status: "More information needed",
    notes: "Mobile OTP not completed; missing business registration proof.",
  },
  {
    id: "req-105",
    requestNumber: "REQ-2026-093",
    libraryName: "Vivekananda Study Center",
    ownerName: "Bhavin Trivedi",
    mobile: "+91 99090 11200",
    email: "bhavin@vivekanandastudy.in",
    city: "Vadodara",
    state: "Gujarat",
    submittedDate: "04 Nov 2026, 15:10",
    chosenPlan: "Growth",
    billingCycle: "Annual",
    feeAmount: 38400,
    branchesPlanned: 2,
    plannedSeats: 250,
    documentCheck: {
      emailVerified: true,
      mobileVerified: true,
      aadhaarUploaded: true,
      gstOrRegistrationUploaded: true,
      ownershipProofUploaded: true,
    },
    documents: [
      {
        title: "Trust Deed & Aadhaar",
        fileName: "trust_reg_docs.pdf",
        fileSize: "3.4 MB",
        fileUrl: "#",
      },
    ],
    status: "Pending",
  },
]

export const initialExpiringPlans: ExpiringLibraryPlan[] = [
  {
    id: "exp-1",
    libraryCode: "LIB-DEL-014",
    libraryName: "Drona Knowledge Point",
    ownerName: "Devender Sehgal",
    phone: "+91 98110 33400",
    planName: "Pro Tier (Annual)",
    planFee: 42000,
    expiryDate: "06 Nov 2026",
    daysLeft: 2,
    isInGrace: false,
    liveStudents: 185,
    renewalProbability: "High",
  },
  {
    id: "exp-2",
    libraryCode: "LIB-LKO-029",
    libraryName: "Gyan Sarovar Reading Hall",
    ownerName: "Akhilesh Trivedi",
    phone: "+91 94150 99820",
    planName: "Growth Tier (Quarterly)",
    planFee: 11400,
    expiryDate: "08 Nov 2026",
    daysLeft: 4,
    isInGrace: false,
    liveStudents: 110,
    renewalProbability: "Medium",
  },
  {
    id: "exp-3",
    libraryCode: "LIB-SUR-041",
    libraryName: "Karnavati Study Hub",
    ownerName: "Sanjay Desai",
    phone: "+91 98250 44100",
    planName: "Starter Tier (Monthly)",
    planFee: 2400,
    expiryDate: "10 Nov 2026",
    daysLeft: 6,
    isInGrace: false,
    liveStudents: 74,
    renewalProbability: "Low",
  },
  {
    id: "exp-4",
    libraryCode: "LIB-BPL-067",
    libraryName: "Ashoka Self Study Center",
    ownerName: "Manish Verma",
    phone: "+91 97540 66200",
    planName: "Pro Tier (Annual)",
    planFee: 42000,
    expiryDate: "11 Nov 2026",
    daysLeft: 7,
    isInGrace: false,
    liveStudents: 220,
    renewalProbability: "High",
  },
]

export const initialGraceAndLocked: GraceAndLockedLibrary[] = [
  {
    id: "gl-1",
    libraryCode: "LIB-JPR-008",
    libraryName: "Maharaja Reading Hall",
    ownerName: "Gopal Shekhawat",
    phone: "+91 98290 88200",
    city: "Jaipur",
    planName: "Growth Tier",
    status: "Grace",
    reason:
      "Renewal payment overdue since 01 Nov 2026. Daily grace banner active.",
    graceDaysRemaining: 2,
    affectedStudents: 145,
    affectedStaff: 3,
    sinceDate: "01 Nov 2026",
  },
  {
    id: "gl-2",
    libraryCode: "LIB-PAT-033",
    libraryName: "Nalanda Modern Study Hub",
    ownerName: "Pankaj Kishor",
    phone: "+91 93340 77100",
    city: "Patna",
    planName: "Starter Tier",
    status: "Grace",
    reason:
      "Payment failed via Razorpay autopay. 3 days remaining in 5-day grace window.",
    graceDaysRemaining: 3,
    affectedStudents: 68,
    affectedStaff: 1,
    sinceDate: "02 Nov 2026",
  },
  {
    id: "gl-3",
    libraryCode: "LIB-VAR-052",
    libraryName: "Kashi Vidyapeeth Library Space",
    ownerName: "Surendra Pandey",
    phone: "+91 94500 22100",
    city: "Varanasi",
    planName: "Pro Tier",
    status: "Locked",
    reason:
      "5-day grace period expired on 31 Oct. Student app access paused with error banner.",
    affectedStudents: 162,
    affectedStaff: 4,
    sinceDate: "31 Oct 2026",
  },
  {
    id: "gl-4",
    libraryCode: "LIB-IND-078",
    libraryName: "Malwa Scholar Desk",
    ownerName: "Rohit Agrawal",
    phone: "+91 98930 11440",
    city: "Indore",
    planName: "Growth Tier",
    status: "Locked",
    reason: "Grace period lapsed without manual or gateway payment receipt.",
    affectedStudents: 105,
    affectedStaff: 2,
    sinceDate: "29 Oct 2026",
  },
  {
    id: "gl-5",
    libraryCode: "LIB-RPR-091",
    libraryName: "Central Reading Room",
    ownerName: "Tushar Chandrakar",
    phone: "+91 98260 55000",
    city: "Raipur",
    planName: "Pro Tier",
    status: "Suspended",
    reason:
      "Policy violation: Reported for copyright material distribution without authorization.",
    affectedStudents: 145,
    affectedStaff: 3,
    sinceDate: "27 Oct 2026",
  },
]

export const initialPlatformPayments: PlatformPayment[] = [
  {
    id: "pay-101",
    transactionId: "pay_Rzp982187311",
    libraryCode: "LIB-AHM-005",
    libraryName: "Kalam Study Arena",
    planName: "Pro Plan (Annual)",
    amount: 48000,
    method: "Razorpay",
    type: "Renewal",
    timestamp: "04 Nov 2026, 17:15",
    status: "Success",
    referenceNumber: "RZP-AUTOPAY-66381",
  },
  {
    id: "pay-102",
    transactionId: "pay_Rzp982144810",
    libraryCode: "LIB-PUN-022",
    libraryName: "Shivaji Study Lounge",
    planName: "Growth Plan (Quarterly)",
    amount: 11400,
    method: "UPI",
    type: "Subscription",
    timestamp: "04 Nov 2026, 15:40",
    status: "Success",
    referenceNumber: "UPI/33019844012/HDFC",
  },
  {
    id: "pay-103",
    transactionId: "pay_Rzp981992140",
    libraryCode: "LIB-PAT-033",
    libraryName: "Nalanda Modern Study Hub",
    planName: "Starter Tier (Monthly)",
    amount: 2400,
    method: "Razorpay",
    type: "Renewal",
    timestamp: "04 Nov 2026, 11:20",
    status: "Failed",
    referenceNumber: "ERR-CARD-DECLINED-402",
  },
  {
    id: "pay-104",
    transactionId: "pay_MAN-2026-041",
    libraryCode: "LIB-DEL-087",
    libraryName: "Pragati Self Study Point",
    planName: "Enterprise Tier (Annual)",
    amount: 72000,
    method: "Bank Transfer",
    type: "Manual Adjust",
    timestamp: "03 Nov 2026, 16:30",
    status: "Success",
    referenceNumber: "NEFT-SBIN0001842-9901",
  },
  {
    id: "pay-105",
    transactionId: "pay_Rzp981755102",
    libraryCode: "LIB-JPR-008",
    libraryName: "Maharaja Reading Hall",
    planName: "Growth Tier (Renewal)",
    amount: 7000,
    method: "Razorpay",
    type: "Renewal",
    timestamp: "02 Nov 2026, 19:05",
    status: "Failed",
    referenceNumber: "ERR-MANDATE-LIMIT-EXCEEDED",
  },
]

export const initialSupportTickets: PlatformSupportTicket[] = [
  {
    id: "tkt-1",
    ticketNumber: "TCK-8812",
    libraryCode: "LIB-JPR-008",
    libraryName: "Maharaja Reading Hall",
    contactPerson: "Gopal Shekhawat",
    subject: "Payment debited from bank but plan still shows in 5-day grace",
    category: "Billing & Plans",
    priority: "Urgent",
    status: "Open",
    createdTime: "2 hours ago",
    assignedRole: "Finance Manager",
  },
  {
    id: "tkt-2",
    ticketNumber: "TCK-8811",
    libraryCode: "LIB-VAR-052",
    libraryName: "Kashi Vidyapeeth Library Space",
    contactPerson: "Surendra Pandey",
    subject:
      "Students cannot log in to mobile app; showing library locked error",
    category: "Student App Issues",
    priority: "Urgent",
    status: "In Progress",
    createdTime: "4 hours ago",
    assignedRole: "Support Manager",
  },
  {
    id: "tkt-3",
    ticketNumber: "TCK-8809",
    libraryCode: "LIB-BLR-019",
    libraryName: "Silicon City Study Hub",
    contactPerson: "Kavitha R.",
    subject:
      "Google Workspace OAuth token expired; test email returning 401 error",
    category: "Email Sync",
    priority: "High",
    status: "Open",
    createdTime: "6 hours ago",
    assignedRole: "Support Manager",
  },
  {
    id: "tkt-4",
    ticketNumber: "TCK-8805",
    libraryCode: "LIB-CHD-044",
    libraryName: "Tagore Memorial Reading Room",
    contactPerson: "Harpal Singh",
    subject: "Requesting guidance to add second branch and assign sub admin",
    category: "Seat Matrix",
    priority: "Normal",
    status: "In Progress",
    createdTime: "1 day ago",
    assignedRole: "Support Manager",
  },
]

export const initialEmailConnections: EmailConnectionHealth[] = [
  {
    id: "em-1",
    libraryCode: "LIB-BLR-019",
    libraryName: "Silicon City Study Hub",
    provider: "Google Workspace",
    connectedEmail: "notifications@siliconstudy.in",
    status: "Needs reconnect",
    lastSuccessfulSend: "02 Nov 2026, 08:30",
    lastError: "Invalid Refresh Token: Token revoked by account administrator",
    failureCount: 14,
  },
  {
    id: "em-2",
    libraryCode: "LIB-KOL-061",
    libraryName: "Victoria Academic Center",
    provider: "Microsoft 365",
    connectedEmail: "admin@victoriaacademic.org",
    status: "Needs reconnect",
    lastSuccessfulSend: "03 Nov 2026, 12:15",
    lastError: "OAuth consent expired: Re-authorization required",
    failureCount: 6,
  },
  {
    id: "em-3",
    libraryCode: "LIB-AHM-005",
    libraryName: "Kalam Study Arena",
    provider: "Google Workspace",
    connectedEmail: "desk@kalamarena.com",
    status: "Connected",
    lastSuccessfulSend: "04 Nov 2026, 17:30",
    failureCount: 0,
  },
  {
    id: "em-4",
    libraryCode: "LIB-HYD-038",
    libraryName: "Charminar Scholars Point",
    provider: "Google Workspace",
    connectedEmail: "info@scholarsspace.in",
    status: "Connected",
    lastSuccessfulSend: "04 Nov 2026, 16:50",
    failureCount: 0,
  },
]

export const initialLibraryGrowthData = [
  { month: "Nov 25", totalLibraries: 42, activeLibraries: 38, growth: 7 },
  { month: "Dec 25", totalLibraries: 51, activeLibraries: 47, growth: 9 },
  { month: "Jan 26", totalLibraries: 63, activeLibraries: 58, growth: 12 },
  { month: "Feb 26", totalLibraries: 74, activeLibraries: 69, growth: 11 },
  { month: "Mar 26", totalLibraries: 88, activeLibraries: 81, growth: 14 },
  { month: "Apr 26", totalLibraries: 96, activeLibraries: 89, growth: 8 },
  { month: "May 26", totalLibraries: 104, activeLibraries: 95, growth: 8 },
  { month: "Jun 26", totalLibraries: 112, activeLibraries: 103, growth: 8 },
  { month: "Jul 26", totalLibraries: 120, activeLibraries: 110, growth: 8 },
  { month: "Aug 26", totalLibraries: 128, activeLibraries: 116, growth: 8 },
  { month: "Sep 26", totalLibraries: 135, activeLibraries: 122, growth: 7 },
  { month: "Oct 26", totalLibraries: 142, activeLibraries: 128, growth: 7 },
]

export const initialPlatformRevenueData = [
  { month: "Nov 25", revenue: 145000, target: 120000 },
  { month: "Dec 25", revenue: 178000, target: 150000 },
  { month: "Jan 26", revenue: 215000, target: 180000 },
  { month: "Feb 26", revenue: 258000, target: 220000 },
  { month: "Mar 26", revenue: 304000, target: 260000 },
  { month: "Apr 26", revenue: 332000, target: 300000 },
  { month: "May 26", revenue: 360000, target: 320000 },
  { month: "Jun 26", revenue: 395000, target: 350000 },
  { month: "Jul 26", revenue: 422000, target: 380000 },
  { month: "Aug 26", revenue: 445000, target: 410000 },
  { month: "Sep 26", revenue: 462000, target: 440000 },
  { month: "Oct 26", revenue: 482500, target: 460000 },
]

export const initialPlanDistributionData = [
  { name: "Starter", count: 40, percentage: 28, color: "hsl(var(--chart-1))" },
  { name: "Growth", count: 60, percentage: 42, color: "hsl(var(--chart-2))" },
  { name: "Pro", count: 31, percentage: 22, color: "hsl(var(--chart-3))" },
  {
    name: "Enterprise",
    count: 11,
    percentage: 8,
    color: "hsl(var(--chart-4))",
  },
]

export const initialStudentStatusData = [
  {
    status: "Live",
    count: 11583,
    percentage: 78,
    color: "hsl(var(--chart-2))",
  },
  {
    status: "Pending",
    count: 1188,
    percentage: 8,
    color: "hsl(var(--chart-3))",
  },
  {
    status: "Expired",
    count: 1633,
    percentage: 11,
    color: "hsl(var(--chart-5))",
  },
  {
    status: "Suspended",
    count: 446,
    percentage: 3,
    color: "hsl(var(--destructive))",
  },
]

export const initialExpiryForecastData = [
  { period: "1-7 Days", count: 12, value: "₹68,400", risk: "Immediate Action" },
  { period: "8-15 Days", count: 18, value: "₹94,200", risk: "Reminders Sent" },
  { period: "16-23 Days", count: 24, value: "₹1,24,000", risk: "Upcoming" },
  { period: "24-30 Days", count: 21, value: "₹1,12,000", risk: "Healthy" },
]

export const initialAllLibrariesList: PlatformLibraryRecord[] = [
  {
    id: "lib-1",
    code: "LIB-AHM-005",
    name: "Kalam Study Arena",
    logo: "",
    ownerName: "Darshan Mehta",
    ownerEmail: "darshan@kalamarena.com",
    ownerPhone: "+91 98250 81120",
    city: "Ahmedabad",
    state: "Gujarat",
    branchesCount: 3,
    planName: "Pro Tier",
    planFee: 48000,
    planStatus: "Active",
    planEndDate: "04 Nov 2027",
    liveStudents: 310,
    totalSeats: 350,
    emailConnection: "Connected",
    libraryStatus: "Active",
    joinedDate: "12 Jan 2025",
  },
  {
    id: "lib-2",
    code: "LIB-JPR-008",
    name: "Maharaja Reading Hall",
    logo: "",
    ownerName: "Gopal Shekhawat",
    ownerEmail: "gopal@maharajahall.in",
    ownerPhone: "+91 98290 88200",
    city: "Jaipur",
    state: "Rajasthan",
    branchesCount: 2,
    planName: "Growth Tier",
    planFee: 38400,
    planStatus: "Grace",
    planEndDate: "01 Nov 2026",
    liveStudents: 145,
    totalSeats: 180,
    emailConnection: "Connected",
    libraryStatus: "Active",
    joinedDate: "15 Mar 2025",
  },
  {
    id: "lib-3",
    code: "LIB-VAR-052",
    name: "Kashi Vidyapeeth Library Space",
    logo: "",
    ownerName: "Surendra Pandey",
    ownerEmail: "surendra@kashividyapeeth.org",
    ownerPhone: "+91 94500 22100",
    city: "Varanasi",
    state: "Uttar Pradesh",
    branchesCount: 2,
    planName: "Pro Tier",
    planFee: 42000,
    planStatus: "Locked",
    planEndDate: "31 Oct 2026",
    liveStudents: 162,
    totalSeats: 200,
    emailConnection: "Connected",
    libraryStatus: "Locked",
    joinedDate: "20 Jun 2025",
  },
  {
    id: "lib-4",
    code: "LIB-PUN-022",
    name: "Shivaji Study Lounge",
    logo: "",
    ownerName: "Makarand Joshi",
    ownerEmail: "makarand@shivajilounge.in",
    ownerPhone: "+91 98220 77112",
    city: "Pune",
    state: "Maharashtra",
    branchesCount: 1,
    planName: "Growth Tier",
    planFee: 38400,
    planStatus: "Active",
    planEndDate: "18 Aug 2027",
    liveStudents: 140,
    totalSeats: 160,
    emailConnection: "Connected",
    libraryStatus: "Active",
    joinedDate: "10 Feb 2025",
  },
  {
    id: "lib-5",
    code: "LIB-BLR-019",
    name: "Silicon City Study Hub",
    logo: "",
    ownerName: "Kavitha R.",
    ownerEmail: "kavitha@siliconstudy.in",
    ownerPhone: "+91 98450 33201",
    city: "Bengaluru",
    state: "Karnataka",
    branchesCount: 4,
    planName: "Enterprise Tier",
    planFee: 72000,
    planStatus: "Active",
    planEndDate: "01 Dec 2027",
    liveStudents: 480,
    totalSeats: 520,
    emailConnection: "Needs reconnect",
    libraryStatus: "Active",
    joinedDate: "05 Dec 2024",
  },
  {
    id: "lib-6",
    code: "LIB-RPR-091",
    name: "Central Reading Room",
    logo: "",
    ownerName: "Tushar Chandrakar",
    ownerEmail: "tushar@centralroom.in",
    ownerPhone: "+91 98260 55000",
    city: "Raipur",
    state: "Chhattisgarh",
    branchesCount: 1,
    planName: "Pro Tier",
    planFee: 42000,
    planStatus: "Locked",
    planEndDate: "27 Oct 2026",
    liveStudents: 145,
    totalSeats: 170,
    emailConnection: "Connected",
    libraryStatus: "Suspended",
    joinedDate: "14 Jul 2025",
  },
]

export const mockLibraries = initialAllLibrariesList.map((lib) => ({
  ...lib,
  branchCount: lib.branchesCount,
}))

export const mockPayments = [
  {
    id: "PAY-9042",
    date: "2026-11-05 14:30",
    libraryName: "Apex Study Hub",
    libraryId: "lib-1",
    amount: 4999,
    method: "UPI (Auto-Debit)",
    status: "successful",
    gatewayRef: "pay_Pk48194nd821",
  },
  {
    id: "PAY-9041",
    date: "2026-11-05 11:15",
    libraryName: "Metro Library Network",
    libraryId: "lib-2",
    amount: 9999,
    method: "Net Banking (HDFC)",
    status: "successful",
    gatewayRef: "pay_K8392hd920",
  },
  {
    id: "PAY-9040",
    date: "2026-11-04 18:45",
    libraryName: "City Reader Corner",
    libraryId: "lib-3",
    amount: 2499,
    method: "Credit Card (Visa)",
    status: "failed",
    gatewayRef: "pay_F938210928",
  },
  {
    id: "PAY-9039",
    date: "2026-11-04 09:20",
    libraryName: "Scholars Den Library",
    libraryId: "lib-4",
    amount: 4999,
    method: "UPI (PhonePe)",
    status: "successful",
    gatewayRef: "pay_P849201948",
  },
]

export const mockInvoices = [
  {
    id: "INV-2026-001",
    libraryName: "Apex Study Hub",
    amount: 4999,
    date: "2026-11-01",
    status: "paid",
  },
  {
    id: "INV-2026-002",
    libraryName: "Metro Library Network",
    amount: 9999,
    date: "2026-11-01",
    status: "paid",
  },
  {
    id: "INV-2026-003",
    libraryName: "City Reader Corner",
    amount: 2499,
    date: "2026-10-28",
    status: "pending",
  },
  {
    id: "INV-2026-004",
    libraryName: "Scholars Den Library",
    amount: 4999,
    date: "2026-10-25",
    status: "paid",
  },
]

export const mockSubscriptions = [
  {
    id: "sub-1",
    libraryName: "Apex Study Hub",
    plan: "Standard Multi-Branch",
    amount: 4999,
    nextBilling: "2026-11-08",
    daysLeft: 3,
  },
  {
    id: "sub-2",
    libraryName: "Scholars Den Library",
    plan: "Single Branch Pro",
    amount: 2499,
    nextBilling: "2026-11-05",
    daysLeft: 0,
  },
]

export const mockStaffUsers = [
  {
    id: "usr-1",
    name: "Alex Vance",
    email: "alex.vance@lmsplatform.com",
    role: "Super Admin",
    status: "active",
    lastLogin: "Today, 15:42",
  },
  {
    id: "usr-2",
    name: "Sarah Chen",
    email: "sarah.chen@lmsplatform.com",
    role: "Operations Manager",
    status: "active",
    lastLogin: "Today, 11:15",
  },
  {
    id: "usr-3",
    name: "David Kumar",
    email: "david.kumar@lmsplatform.com",
    role: "Billing & Finance",
    status: "active",
    lastLogin: "Yesterday, 17:30",
  },
  {
    id: "usr-4",
    name: "Priya Sharma",
    email: "priya.sharma@lmsplatform.com",
    role: "Support Agent",
    status: "active",
    lastLogin: "Today, 14:02",
  },
]

export const mockContactInquiries = [
  {
    id: "INQ-101",
    name: "Rajesh Singhania",
    email: "rajesh@nationalstudy.org",
    phone: "+91 98110 22334",
    message:
      "We manage 12 library branches across NCR. Looking for enterprise pricing, custom student RFID badges, and offline turnstile integration.",
    status: "new",
    createdAt: "Today, 14:20",
  },
  {
    id: "INQ-102",
    name: "Meera Nair",
    email: "meera.nair@cochinreading.in",
    phone: "+91 94470 88990",
    message:
      "Interested in onboarding 2 new branches in Kochi. Would like a demonstration of the WhatsApp automated seat renewal notifications.",
    status: "replied",
    createdAt: "Yesterday, 18:05",
  },
]

export const mockWebsitePages = [
  {
    id: "pg-1",
    title: "Homepage / SaaS Landing",
    slug: "",
    seoTitle: "LMS Platform — Library Management System & Student SaaS",
    seoDescription:
      "The #1 Cloud Management Operating System for Modern Reading Rooms & Study Libraries.",
    lastUpdated: "2026-11-01",
    status: "published",
  },
  {
    id: "pg-2",
    title: "Pricing & Plans",
    slug: "pricing",
    seoTitle: "Simple, Predictable Plans for Study Libraries | LMS Platform",
    seoDescription:
      "Explore Single Branch, Multi-Branch, and Enterprise plans with zero setup fees.",
    lastUpdated: "2026-10-28",
    status: "published",
  },
  {
    id: "pg-3",
    title: "Features & Hardware",
    slug: "features",
    seoTitle: "Biometric Attendance, Seat Maps & WhatsApp Billing",
    seoDescription:
      "Automate check-ins with turnstile integrations and dynamic student QR badges.",
    lastUpdated: "2026-10-20",
    status: "published",
  },
]

export const mockAuditLogs = [
  {
    id: "AUD-9402",
    timestamp: "2026-11-05 15:42:10",
    actor: "Alex Vance",
    role: "Super Admin",
    action: "Approved Library Onboarding Request",
    target: "Apex Study Hub (LIB-PUN-042)",
    ipAddress: "103.21.144.12",
    stateDiff: {
      before: { status: "Pending KYC Review", isVerified: false },
      after: {
        status: "Active Tenant",
        isVerified: true,
        plan: "Standard Multi-Branch",
      },
    },
  },
  {
    id: "AUD-9401",
    timestamp: "2026-11-05 14:15:30",
    actor: "Sarah Chen",
    role: "Operations Manager",
    action: "Updated Mobile App Min Version",
    target: "Android Fleet (v3.2.0)",
    ipAddress: "103.21.144.18",
    stateDiff: {
      before: { minVersion: "3.1.5", forceUpdate: false },
      after: { minVersion: "3.2.0", forceUpdate: true },
    },
  },
  {
    id: "AUD-9400",
    timestamp: "2026-11-05 11:02:18",
    actor: "David Kumar",
    role: "Billing Auditor",
    action: "Recorded Offline NEFT Payment",
    target: "Metro Library Network (PAY-9041)",
    ipAddress: "103.21.144.22",
    stateDiff: null,
  },
]
