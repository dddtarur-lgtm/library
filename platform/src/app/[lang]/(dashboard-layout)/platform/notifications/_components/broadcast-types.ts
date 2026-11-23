export type BroadcastSurface = "header_alert" | "dialog_modal" | "in_app_push"

export type DialogVariant =
  | "info_card"
  | "half_banner"
  | "full_bleed"
  | "attachment_notice"

export type BroadcastSeverity = "info" | "success" | "warning" | "critical"

export interface BroadcastAttachment {
  name: string
  sizeLabel: string
  type: string
}

export interface BroadcastDraft {
  surface: BroadcastSurface
  dialogVariant: DialogVariant
  severity: BroadcastSeverity
  audience: string
  targetLibraryId: string
  title: string
  message: string
  imageUrl: string
  ctaLabel: string
  ctaUrl: string
  attachment: BroadcastAttachment | null
  dismissible: boolean
  scheduleEnabled: boolean
  scheduledAt: string
  channels: {
    inApp: boolean
    push: boolean
    email: boolean
  }
}

export interface BroadcastHistoryItem {
  id: string
  title: string
  surface: BroadcastSurface
  variantLabel: string
  severity: BroadcastSeverity
  audience: string
  deliveredAt: string
  reach: string
  openRate: string
  hasAttachment: boolean
  hasLink: boolean
  hasImage: boolean
  status: "Delivered" | "Scheduled" | "Active Header"
}

export interface NotificationTemplateItem {
  id: string
  name: string
  category: string
  surface: BroadcastSurface
  dialogVariant: DialogVariant
  severity: BroadcastSeverity
  title: string
  preview: string
  ctaLabel: string
  ctaUrl: string
  hasAttachment: boolean
  lastUsed: string
  usageCount: number
}

export const DEFAULT_BROADCAST_DRAFT: BroadcastDraft = {
  surface: "dialog_modal",
  dialogVariant: "half_banner",
  severity: "info",
  audience: "all",
  targetLibraryId: "",
  title: "Scheduled Platform Upgrade & GST Invoice Sync",
  message:
    "Scheduled infrastructure upgrade on Sunday, 10 Nov at 02:00 AM IST (under 15 mins downtime). Download the updated GST compliance circular below.",
  imageUrl: "",
  ctaLabel: "View Release Notes",
  ctaUrl: "https://status.studyhall.in/releases",
  attachment: {
    name: "GST_Compliance_Update_Nov2026.pdf",
    sizeLabel: "420 KB",
    type: "application/pdf",
  },
  dismissible: true,
  scheduleEnabled: false,
  scheduledAt: "2026-11-15T10:00",
  channels: {
    inApp: true,
    push: true,
    email: false,
  },
}

export const INITIAL_BROADCAST_HISTORY: BroadcastHistoryItem[] = [
  {
    id: "nt-1",
    title: "New Feature: AI Seating Grid Generator Live",
    surface: "dialog_modal",
    variantLabel: "Image + Text Dialog",
    severity: "success",
    audience: "Pro & Enterprise (32 Libs)",
    deliveredAt: "03 Nov 2026, 10:00 AM",
    reach: "1,420 Admins & Staff",
    openRate: "84.2%",
    hasAttachment: false,
    hasLink: true,
    hasImage: true,
    status: "Delivered",
  },
  {
    id: "nt-2",
    title: "GST E-Invoicing Mandatory Circular (Nov 2026)",
    surface: "header_alert",
    variantLabel: "Pinned Header Alert",
    severity: "warning",
    audience: "All Libraries (142 Libs)",
    deliveredAt: "01 Nov 2026, 09:30 AM",
    reach: "3,840 Recipients",
    openRate: "96.4%",
    hasAttachment: true,
    hasLink: true,
    hasImage: false,
    status: "Active Header",
  },
  {
    id: "nt-3",
    title: "Mandatory 2FA Policy Implementation",
    surface: "dialog_modal",
    variantLabel: "Attachment Circular",
    severity: "critical",
    audience: "Libraries with 2FA Disabled (48 Libs)",
    deliveredAt: "Scheduled: 15 Nov 2026",
    reach: "Est. 320 Users",
    openRate: "-",
    hasAttachment: true,
    hasLink: true,
    hasImage: false,
    status: "Scheduled",
  },
  {
    id: "nt-4",
    title: "Diwali Early-Bird Renewal Offer (20% OFF)",
    surface: "dialog_modal",
    variantLabel: "Full-Bleed Visual",
    severity: "info",
    audience: "All Libraries (142 Libs)",
    deliveredAt: "29 Oct 2026, 11:00 AM",
    reach: "3,610 Recipients",
    openRate: "91.6%",
    hasAttachment: false,
    hasLink: true,
    hasImage: true,
    status: "Delivered",
  },
]

export const INITIAL_NOTIFICATION_TEMPLATES: NotificationTemplateItem[] = [
  {
    id: "TPL-01",
    name: "Scheduled System Maintenance",
    category: "System Alerts",
    surface: "header_alert",
    dialogVariant: "info_card",
    severity: "warning",
    title: "Scheduled Maintenance Window Tonight",
    preview:
      "Routine database maintenance from 02:00 to 03:30 AM IST. Offline student check-ins remain active.",
    ctaLabel: "Live Status",
    ctaUrl: "https://status.studyhall.in",
    hasAttachment: false,
    lastUsed: "2026-11-01",
    usageCount: 14,
  },
  {
    id: "TPL-02",
    name: "Urgent Payment Renewal Notice",
    category: "Billing Dunning",
    surface: "dialog_modal",
    dialogVariant: "info_card",
    severity: "critical",
    title: "Action Required: Subscription Renewal Due",
    preview:
      "Your library subscription expires in 48 hours. Renew now to avoid automatic branch access lock.",
    ctaLabel: "Renew Subscription",
    ctaUrl: "/platform/billing",
    hasAttachment: false,
    lastUsed: "2026-11-04",
    usageCount: 38,
  },
  {
    id: "TPL-03",
    name: "New Feature Release: Biometric QR",
    category: "Product Updates",
    surface: "dialog_modal",
    dialogVariant: "full_bleed",
    severity: "success",
    title: "Biometric QR Check-In Is Now Live",
    preview:
      "Instant contactless check-in with dynamic QR is now enabled across all Pro & Enterprise branches.",
    ctaLabel: "Explore Feature",
    ctaUrl: "/platform/app-management/features",
    hasAttachment: true,
    lastUsed: "2026-10-20",
    usageCount: 6,
  },
  {
    id: "TPL-04",
    name: "GST & Compliance Circular",
    category: "Operational",
    surface: "dialog_modal",
    dialogVariant: "attachment_notice",
    severity: "info",
    title: "Updated GST Invoice Circular Attached",
    preview:
      "Please review the attached compliance PDF for updated SAC codes and monthly filing dates.",
    ctaLabel: "Open Invoices",
    ctaUrl: "/platform/billing/invoices",
    hasAttachment: true,
    lastUsed: "2026-10-01",
    usageCount: 9,
  },
]

export function getSurfaceLabel(surface: BroadcastSurface): string {
  switch (surface) {
    case "header_alert":
      return "Header Alert"
    case "dialog_modal":
      return "Dialog Modal"
    case "in_app_push":
      return "Push & Feed"
  }
}

export function getDialogVariantLabel(variant: DialogVariant): string {
  switch (variant) {
    case "info_card":
      return "Information Card"
    case "half_banner":
      return "Image + Text"
    case "full_bleed":
      return "Full-Bleed Visual"
    case "attachment_notice":
      return "Attachment Notice"
  }
}
