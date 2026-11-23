import type { ActivityTimelineType } from "../types"

export const activityTimelineData: ActivityTimelineType = {
  period: "Today",
  activities: [
    {
      type: "bookIssued",
      iconName: "BookOpen",
      fill: "hsl(var(--chart-1))",
      title: "Book Issued: 'Introduction to Algorithms (CLRS)'",
      description:
        "Issued to Aarav Sharma (Card #LIB-4092) for 14 days. Due date: Nov 13, 2026.",
      status: "Issued",
      date: "2026-10-30T10:15:00Z",
      assignedMembers: [
        {
          name: "Emily Smith",
          avatar: "/images/avatars/female-01.svg",
          href: "/",
        },
      ],
    },
    {
      type: "bookReturned",
      iconName: "BookCheck",
      fill: "hsl(var(--chart-2))",
      title: "Book Returned: 'Concepts of Physics - Vol 1'",
      description:
        "Returned on time by Priya Patel (Seat #B-14). Inspected and reshelved in Rack Physics-02.",
      status: "Returned",
      date: "2026-10-30T11:45:00Z",
      assignedMembers: [
        {
          name: "Michael Brown",
          avatar: "/images/avatars/male-02.svg",
          href: "/",
        },
      ],
    },
    {
      type: "seatAllocated",
      iconName: "Armchair",
      fill: "hsl(var(--chart-3))",
      title: "Seat Allocated: Study Desk #S-28",
      description:
        "Reserved for Rohan Verma - 30-day quiet study zone full-day shift pass approved.",
      status: "Allocated",
      date: "2026-10-30T13:20:00Z",
      assignedMembers: [
        {
          name: "Sarah Johnson",
          avatar: "/images/avatars/female-02.svg",
          href: "/",
        },
      ],
    },
    {
      type: "feePayment",
      iconName: "Receipt",
      fill: "hsl(var(--chart-4))",
      title: "Library Membership Fee Received ($45.00)",
      description:
        "Monthly library reading hall subscription renewed for Ananya Gupta. RFID access renewed.",
      status: "Paid",
      date: "2026-10-30T14:50:00Z",
      assignedMembers: [
        {
          name: "Emily Smith",
          avatar: "/images/avatars/female-01.svg",
          href: "/",
        },
      ],
    },
    {
      type: "overdueNotice",
      iconName: "TriangleAlert",
      fill: "hsl(var(--destructive))",
      title: "Overdue Notice: 'Higher Engineering Mathematics'",
      description:
        "Automated notice sent to Kabir Singh (Card #LIB-3180). 3 days overdue ($1.50 fine accrued).",
      status: "Overdue",
      date: "2026-10-30T16:10:00Z",
      assignedMembers: [
        {
          name: "John Doe",
          avatar: "/images/avatars/male-01.svg",
          href: "/",
        },
      ],
    },
    {
      type: "bookCataloged",
      iconName: "Bookmark",
      fill: "hsl(var(--chart-5))",
      title: "New Arrivals Cataloged (15 Books)",
      description:
        "New competitive exam reference textbooks cataloged and shelved in Section C.",
      status: "Cataloged",
      date: "2026-10-30T17:30:00Z",
      assignedMembers: [
        {
          name: "Michael Brown",
          avatar: "/images/avatars/male-02.svg",
          href: "/",
        },
        {
          name: "Sarah Johnson",
          avatar: "/images/avatars/female-02.svg",
          href: "/",
        },
      ],
    },
  ],
}
