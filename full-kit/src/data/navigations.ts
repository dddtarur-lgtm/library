import type { NavigationType } from "@/types"

export const navigationsData: NavigationType[] = [
  {
    title: "Dashboards",
    items: [
      {
        title: "Home",
        href: "/dashboards/home",
        iconName: "LayoutGrid",
      },
    ],
  },
  {
    title: "People",
    items: [
      {
        title: "Students",
        href: "/dashboards/students",
        iconName: "Users",
        badge: "1 Waiting",
        badgeVariant: "warning",
      },
      {
        title: "Enquiries & Leads",
        href: "/pages/settings-library/leads",
        iconName: "UserPlus",
      },
      {
        title: "Team & Staff",
        href: "/pages/staff",
        iconName: "ShieldCheck",
      },
    ],
  },
  {
    title: "Library Space",
    items: [
      {
        title: "Seats & Lockers",
        href: "/pages/seats",
        iconName: "Armchair",
      },
      {
        title: "Attendance",
        href: "/pages/attendance",
        iconName: "QrCode",
      },
      {
        title: "Branches",
        href: "/pages/branches",
        iconName: "Building2",
        badge: "2 Active",
        badgeVariant: "primary",
      },
    ],
  },
  {
    title: "Money",
    items: [
      {
        title: "Fees & Day Book",
        href: "/pages/plans/day-book",
        iconName: "ReceiptText",
        badge: "₹3,000",
        badgeVariant: "destructive",
      },
      {
        title: "Plans",
        href: "/pages/plans",
        iconName: "Tag",
      },
    ],
  },
  {
    title: "Learning",
    items: [
      {
        title: "Books & Lending",
        href: "/pages/books",
        iconName: "BookMarked",
        badge: "1 Due",
        badgeVariant: "destructive",
      },
      {
        title: "Study Sessions",
        href: "/pages/study-hours/sessions",
        iconName: "Timer",
      },
    ],
  },
  {
    title: "Messages",
    items: [
      {
        title: "Notifications",
        href: "/pages/notifications",
        iconName: "Bell",
      },
      {
        title: "Public Website",
        href: "/pages/settings-library/public-page",
        iconName: "Globe",
      },
      {
        title: "Email & SMTP",
        href: "/pages/email-management",
        iconName: "Mail",
      },
    ],
  },
  {
    title: "Reports",
    items: [
      {
        title: "Reports",
        href: "/pages/reports",
        iconName: "ChartColumn",
      },
      {
        title: "Activity Log",
        href: "/pages/activity-logs",
        iconName: "History",
      },
    ],
  },
  {
    title: "Setup",
    items: [
      {
        title: "My Library Plan",
        href: "/pages/pricing",
        iconName: "CreditCard",
      },
      {
        title: "Settings",
        href: "/pages/settings-library",
        iconName: "Settings",
      },
      {
        title: "Help & Support",
        href: "/pages/support",
        iconName: "CircleHelp",
      },
    ],
  },
]
