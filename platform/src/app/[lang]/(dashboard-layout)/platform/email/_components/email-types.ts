export type MailFolder =
  | "inbox"
  | "starred"
  | "sent"
  | "drafts"
  | "templates"
  | "archived"
  | "spam"
  | "trash"

export interface MailLabel {
  id: string
  name: string
  colorClass: string
}

export interface EmailMessage {
  id: string
  folder: Exclude<MailFolder, "starred" | "templates">
  senderName: string
  senderEmail: string
  libraryCode?: string
  logo?: string
  subject: string
  snippet: string
  body: string
  dateShort: string
  timestamp: string
  unread: boolean
  starred: boolean
  labels: string[]
  attachment?: {
    name: string
    size: string
  }
}

export interface EmailTemplateRecord {
  id: string
  name: string
  language: "en" | "hi" | "gu"
  subject: string
  body: string
  variables: string[]
}

export interface EmailDeliveryLog {
  id: string
  recipient: string
  subject: string
  template: string
  status: "delivered" | "bounced" | "spam_complaint"
  sentAt: string
  gatewayResponse: string
}

export interface TenantConnectionRecord {
  id: string
  libraryName: string
  libraryCode?: string
  logo?: string
  provider: string
  senderAccount: string
  status: "healthy" | "token_expiring_soon" | "auth_failed"
  tokenExpires: string
  dailySent: number
  dailyLimit: number
}

export const INITIAL_MAIL_LABELS: MailLabel[] = [
  { id: "onboarding", name: "Onboarding", colorClass: "text-sky-500" },
  { id: "billing", name: "Billing", colorClass: "text-amber-500" },
  { id: "support", name: "Support", colorClass: "text-emerald-500" },
  { id: "infra", name: "Infra", colorClass: "text-violet-500" },
]

export const INITIAL_EMAIL_MESSAGES: EmailMessage[] = [
  {
    id: "em-1",
    folder: "inbox",
    senderName: "Apex Study Hub",
    senderEmail: "office@apexstudyhub.com",
    libraryCode: "LIB-PUN-001",
    subject: "Welcome & Branch Expansion Setup — Need 2 More Sub-Admins",
    snippet:
      "Hi Team, we upgraded to Pro Tier and want to enable two additional branch...",
    body: "Hello Platform Team,\n\nThank you for upgrading Apex Study Hub to the Pro Tier! We are excited to onboard our second branch in Kothrud next week.\n\nCould you please confirm:\n1. Whether our GST invoice #INV-2026-001 reflects our updated GSTIN.\n2. How to enable biometric QR sync on the new branch tablet.\n\nBest regards,\nRohan Deshmukh\nApex Study Hub",
    dateShort: "Nov 12",
    timestamp: "Thu, Nov 12, 2026, 11:20 AM",
    unread: true,
    starred: true,
    labels: ["onboarding", "billing"],
    attachment: {
      name: "Apex_GST_Certificate.pdf",
      size: "312 KB",
    },
  },
  {
    id: "em-2",
    folder: "inbox",
    senderName: "Metro Library Network",
    senderEmail: "admin@metrolibrary.in",
    libraryCode: "LIB-DEL-002",
    subject: "OAuth Token Renewal Notice — Microsoft 365 Graph API",
    snippet:
      "Our IT team noticed the Graph API token expires on Nov 19. Can we...",
    body: "Hi Super Admin,\n\nWe received an automated alert that our Microsoft 365 Graph API token is expiring soon.\n\nPlease share the one-click re-authorization link so our automated student fee receipts continue without interruption.\n\nThanks,\nMetro Library Network Ops",
    dateShort: "Nov 12",
    timestamp: "Thu, Nov 12, 2026, 09:45 AM",
    unread: true,
    starred: false,
    labels: ["infra", "support"],
  },
  {
    id: "em-3",
    folder: "inbox",
    senderName: "RevenueBot",
    senderEmail: "digest@lmsplatform.com",
    subject: "Weekly SaaS Metrics & Renewal Pipeline Report",
    snippet:
      "MRR increased +18.4% this week with 12 renewals scheduled in the next 7...",
    body: "Hello Admin,\n\nHere is your weekly platform summary:\n\n• Active Paid Libraries: 86\n• Collected This Month: ₹4,82,500\n• Renewals Due (7 Days): 12 Libraries\n• Email Delivery Rate: 99.2% (2 bounces logged)\n\nOpen Billing Control for full settlement breakdowns.",
    dateShort: "Nov 11",
    timestamp: "Wed, Nov 11, 2026, 06:00 PM",
    unread: true,
    starred: true,
    labels: ["billing"],
  },
  {
    id: "em-4",
    folder: "inbox",
    senderName: "Scholars Den Library",
    senderEmail: "desk@scholarsden.co.in",
    libraryCode: "LIB-BLR-004",
    subject: "Custom Sender Domain Verification (DKIM/SPF)",
    snippet: "We added the TXT records for scholarsden.co.in. Kindly verify...",
    body: "Hi Support,\n\nWe have added both DKIM and SPF TXT records in Cloudflare for scholarsden.co.in.\n\nPlease trigger a DNS verification check from the Email Infrastructure tab and let us know once verified.\n\nRegards,\nAnanya Rao",
    dateShort: "Nov 10",
    timestamp: "Tue, Nov 10, 2026, 03:15 PM",
    unread: false,
    starred: false,
    labels: ["infra"],
  },
  {
    id: "em-5",
    folder: "sent",
    senderName: "LMS Platform Support",
    senderEmail: "support@lmsplatform.com",
    subject: "Re: GST Invoice #INV-2026-004 Dispatched",
    snippet:
      "Hi Scholars Den team, attached is your Rule 46 compliant GST tax invoice...",
    body: "Hi Scholars Den Team,\n\nAttached is your Rule 46 compliant GST tax invoice #INV-2026-004 for your Pro Tier renewal.\n\nLet us know if you need any billing updates.\n\nRegards,\nPlatform Billing Desk",
    dateShort: "Nov 09",
    timestamp: "Mon, Nov 09, 2026, 01:10 PM",
    unread: false,
    starred: false,
    labels: ["billing"],
  },
  {
    id: "em-6",
    folder: "drafts",
    senderName: "Platform Operations",
    senderEmail: "ops@lmsplatform.com",
    subject: "Scheduled Maintenance Window — Sunday 02:00 AM IST",
    snippet:
      "Draft announcement for all library owners regarding database upgrade...",
    body: "Dear Library Partners,\n\nWe will perform a 15-minute database maintenance window on Sunday at 02:00 AM IST.",
    dateShort: "Nov 08",
    timestamp: "Sun, Nov 08, 2026, 04:30 PM",
    unread: false,
    starred: false,
    labels: ["infra"],
  },
]

export const INITIAL_EMAIL_TEMPLATES: EmailTemplateRecord[] = [
  {
    id: "welcome",
    name: "Library Onboarding & Credentials",
    language: "en",
    subject: "Welcome to LMS Platform - Your Super Admin Credentials",
    body: "Hello {{owner_name}},\n\nYour library {{library_name}} (Code: {{library_code}}) is now active!\n\nLogin URL: {{login_url}}\nEmail: {{email}}\nTemporary Password: {{temp_password}}\n\nBest regards,\nPlatform Operations Team",
    variables: ["owner_name", "library_name", "library_code", "login_url"],
  },
  {
    id: "renewal",
    name: "Subscription Expiry & Dunning Notice",
    language: "en",
    subject: "Action Required: {{library_name}} Subscription Renewal Due",
    body: "Hello {{owner_name}},\n\nYour {{plan_name}} subscription expires on {{expiry_date}}. Please complete renewal to prevent automated grace lock.\n\nRenew Now: {{billing_url}}",
    variables: ["owner_name", "library_name", "plan_name", "expiry_date"],
  },
  {
    id: "invoice",
    name: "GST Tax Invoice Receipt",
    language: "en",
    subject: "Tax Invoice {{invoice_id}} — {{library_name}}",
    body: "Hello {{owner_name}},\n\nThank you for your payment of {{amount}}. Your GST Rule 46 invoice ({{invoice_id}}) is attached.\n\nPlatform Billing",
    variables: ["owner_name", "invoice_id", "amount", "library_name"],
  },
]

export const INITIAL_DELIVERY_LOGS: EmailDeliveryLog[] = [
  {
    id: "MSG-89021",
    recipient: "rahul.sharma@gmail.com",
    subject: "Seat Booking Confirmed: Desk A-12 (Apex Study Hub)",
    template: "Seat Confirmation",
    status: "delivered",
    sentAt: "2026-11-12 11:42",
    gatewayResponse: "250 2.0.0 OK 1730805130",
  },
  {
    id: "MSG-89020",
    recipient: "priya.patel@outlook.com",
    subject: "Monthly Fee Receipt #INV-2026-092",
    template: "Invoice Receipt",
    status: "delivered",
    sentAt: "2026-11-12 10:30",
    gatewayResponse: "250 2.0.0 OK 1730804405",
  },
  {
    id: "MSG-89019",
    recipient: "deepak.verma@yahoo.com",
    subject: "Account Password Reset Token",
    template: "Password Reset",
    status: "bounced",
    sentAt: "2026-11-11 15:10",
    gatewayResponse: "550 5.1.1 User unknown / mailbox unavailable",
  },
  {
    id: "MSG-89018",
    recipient: "ananya.joshi@rediffmail.com",
    subject: "Welcome to Apex Study Hub",
    template: "Student Welcome",
    status: "spam_complaint",
    sentAt: "2026-11-10 14:02",
    gatewayResponse: "FBL Spam Complaint Registered by ISP",
  },
]

export const INITIAL_TENANT_CONNECTIONS: TenantConnectionRecord[] = [
  {
    id: "CONN-01",
    libraryName: "Apex Study Hub",
    libraryCode: "LIB-PUN-001",
    provider: "Google Workspace (Gmail API)",
    senderAccount: "office@apexstudyhub.com",
    status: "healthy",
    tokenExpires: "2027-01-15",
    dailySent: 142,
    dailyLimit: 2000,
  },
  {
    id: "CONN-02",
    libraryName: "Metro Library Network",
    libraryCode: "LIB-DEL-002",
    provider: "Microsoft 365 (Graph API)",
    senderAccount: "admin@metrolibrary.in",
    status: "token_expiring_soon",
    tokenExpires: "2026-11-19",
    dailySent: 512,
    dailyLimit: 10000,
  },
  {
    id: "CONN-03",
    libraryName: "City Reader Corner",
    libraryCode: "LIB-JPR-003",
    provider: "Custom SMTP",
    senderAccount: "notify@cityreader.org",
    status: "auth_failed",
    tokenExpires: "N/A",
    dailySent: 0,
    dailyLimit: 500,
  },
  {
    id: "CONN-04",
    libraryName: "Scholars Den Library",
    libraryCode: "LIB-BLR-004",
    provider: "Google Workspace (Gmail API)",
    senderAccount: "desk@scholarsden.co.in",
    status: "healthy",
    tokenExpires: "2026-12-30",
    dailySent: 89,
    dailyLimit: 2000,
  },
]
