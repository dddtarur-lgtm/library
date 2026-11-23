import type { NavigationType } from "@/types"

export const navigationsData: NavigationType[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Platform Dashboard",
        href: "/platform/dashboard",
        iconName: "LayoutGrid",
      },
    ],
  },
  {
    title: "Libraries",
    items: [
      {
        title: "Requests & Approval",
        href: "/platform/library-requests",
        iconName: "ClipboardCheck",
        badge: "6 Pending",
        badgeVariant: "warning",
      },
      {
        title: "All Libraries",
        href: "/platform/libraries",
        iconName: "Building2",
        badge: "142 Total",
        badgeVariant: "primary",
      },
      {
        title: "Add Library",
        href: "/platform/libraries/add",
        iconName: "CirclePlus",
      },
    ],
  },
  {
    title: "Plans & Billing",
    items: [
      {
        title: "Platform Plans",
        href: "/platform/plans",
        iconName: "Tag",
      },
      {
        title: "Billing & Invoices",
        href: "/platform/billing",
        iconName: "ReceiptText",
        badge: "2 Failed",
        badgeVariant: "destructive",
      },
    ],
  },
  {
    title: "Communication",
    items: [
      {
        title: "Notifications",
        href: "/platform/notifications",
        iconName: "Bell",
      },
      {
        title: "Email & Mailbox",
        iconName: "Mail",
        href: "/platform/email",
        badge: "4 Unread",
        badgeVariant: "secondary",
      },
    ],
  },
  {
    title: "People & Content",
    items: [
      {
        title: "Students Directory",
        href: "/platform/students",
        iconName: "Users",
        badge: "14.8k Live",
        badgeVariant: "secondary",
      },
      {
        title: "Public Page Review",
        href: "/platform/library-pages",
        iconName: "Globe",
        badge: "3 Pending",
        badgeVariant: "warning",
      },
      {
        title: "Website CMS",
        href: "/platform/website-content",
        iconName: "FileText",
      },
      {
        title: "App Controls",
        href: "/platform/app-management",
        iconName: "Smartphone",
      },
    ],
  },
  {
    title: "Insights & Support",
    items: [
      {
        title: "Platform Reports",
        href: "/platform/reports",
        iconName: "ChartColumn",
      },
      {
        title: "Support Tickets",
        href: "/platform/support",
        iconName: "LifeBuoy",
        badge: "5 Open",
        badgeVariant: "destructive",
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        title: "Team & Roles",
        href: "/platform/users-roles",
        iconName: "ShieldCheck",
      },
      {
        title: "Platform Settings",
        href: "/platform/settings",
        iconName: "Settings",
      },
      {
        title: "Audit & System Health",
        href: "/platform/audit-health",
        iconName: "Activity",
      },
      {
        title: "My Account",
        href: "/platform/my-account",
        iconName: "UserCheck",
      },
    ],
  },
]
