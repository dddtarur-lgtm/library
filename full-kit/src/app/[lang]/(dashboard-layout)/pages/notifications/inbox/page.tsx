"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  AlertCircle,
  Bell,
  Check,
  ChevronLeft,
  CircleDollarSign,
  Clock,
  Eye,
  Inbox,
  Sparkles,
  Trash2,
  UserCheck,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminNotificationInboxPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [inboxItems, setInboxItems] = useState([
    {
      id: "inb-1",
      type: "Student Join Request",
      title: "New student registration submitted",
      message: "Ananya Iyer applied for Main Branch (Morning Shift). Pending ID proof review.",
      time: "10 mins ago",
      isRead: false,
      link: "/pages/students/requests",
    },
    {
      id: "inb-2",
      type: "Payment Collected",
      title: "Fee payment of ₹1,800 received",
      message: "Aarav Patel settled 1 Month Full Day Intensive plan via UPI QR Desk.",
      time: "1 hour ago",
      isRead: false,
      link: "/pages/plans/dues",
    },
    {
      id: "inb-3",
      type: "Book Overdue Alert",
      title: "Loan overdue for 9 days",
      message: "A Brief History of Modern India issued to Jayesh Shah is past due date.",
      time: "3 hours ago",
      isRead: true,
      link: "/pages/books/overdue-fines",
    },
    {
      id: "inb-4",
      type: "Branch Change Request",
      title: "Branch transfer requested",
      message: "Karan Mehta requested transfer from West Campus to North Tech Hub.",
      time: "Yesterday",
      isRead: true,
      link: "/pages/branches/change-requests",
    },
  ])

  const markAllAsRead = () => {
    setInboxItems(inboxItems.map((item) => ({ ...item, isRead: true })))
  }

  const deleteItem = (id: string) => {
    setInboxItems(inboxItems.filter((item) => item.id !== id))
  }

  const unreadCount = inboxItems.filter((item) => !item.isRead).length

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden space-y-4 p-3 sm:p-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href={ensureLocalizedPathname("/pages/notifications", lang)}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0",
          })}
        >
          <ChevronLeft className="size-4" />
          <span>Back to Notifications Hub</span>
        </Link>
        <span className="text-xs font-mono text-muted-foreground">
          Operator Bell Notifications & Inbox (SQL admin_inbox)
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Inbox className="size-5 text-primary" />
            Admin Notifications & Alert Center
          </h1>
          <p className="text-xs text-muted-foreground">
            Centralized operational notifications for student join requests, incoming payments, overdue alerts & branch transfers
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={markAllAsRead}
              className="h-8 text-xs gap-1.5 border-border"
            >
              <Check className="size-3.5" />
              <span>Mark All as Read</span>
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5 max-w-3xl">
        {inboxItems.map((item) => (
          <Card
            key={item.id}
            className={`border-border/60 transition-all ${
              !item.isRead ? "bg-primary/5 border-primary/30" : "bg-card"
            }`}
          >
            <CardContent className="p-3.5 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <div
                  className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    !item.isRead ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Bell className="size-4" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">{item.title}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {item.type}
                    </Badge>
                    {!item.isRead && (
                      <span className="size-2 rounded-full bg-primary inline-block" />
                    )}
                  </div>

                  <p className="text-muted-foreground text-xs leading-relaxed">{item.message}</p>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                    <span className="font-mono">{item.time}</span>
                    <span>•</span>
                    <Link
                      href={ensureLocalizedPathname(item.link, lang)}
                      className="text-primary font-medium hover:underline"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteItem(item.id)}
                className="size-7 text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

