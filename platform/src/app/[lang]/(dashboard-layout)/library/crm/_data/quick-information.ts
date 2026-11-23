export interface QuickInfoItem {
  id: string
  title: string
  avatar?: string
  actionText: string
  actionVariant: "default" | "secondary" | "outline" | "destructive"
  category: "student" | "sub-admin" | "fee" | "attendance"
}

export const quickInformationData: QuickInfoItem[] = [
  {
    id: "1",
    title: "New Student: Aarav Sharma",
    avatar: "/images/avatars/male-02.svg",
    actionText: "View",
    actionVariant: "default",
    category: "student",
  },
  {
    id: "2",
    title: "Sub-Admin Priya: Seat Allocation",
    avatar: "/images/avatars/female-01.svg",
    actionText: "Review",
    actionVariant: "secondary",
    category: "sub-admin",
  },
  {
    id: "3",
    title: "Fee Reminder (18 Overdue)",
    actionText: "Caution",
    actionVariant: "destructive",
    category: "fee",
  },
  {
    id: "4",
    title: "Morning Attendance Synced",
    actionText: "Logs",
    actionVariant: "outline",
    category: "attendance",
  },
]
