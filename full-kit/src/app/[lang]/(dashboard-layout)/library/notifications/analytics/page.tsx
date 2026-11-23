"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  CheckCheck,
  ChevronLeft,
  Clock,
  Download,
  Eye,
  Filter,
  Search,
  Smartphone,
  Users,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function NotificationDeliveryAnalyticsPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [deliveries, setDeliveries] = useState([
    { id: "del-1", studentName: "Aarav Patel", studentCode: "STU-1081", campaign: "Diwali Extended Hours Notice", channel: "Push + In-App", deliveredAt: "01 Nov, 09:30 AM", seenAt: "01 Nov, 09:34 AM", clickedCta: true },
    { id: "del-2", studentName: "Priya Sharma", studentCode: "STU-1082", campaign: "Diwali Extended Hours Notice", channel: "Push + In-App", deliveredAt: "01 Nov, 09:30 AM", seenAt: "01 Nov, 10:15 AM", clickedCta: false },
    { id: "del-3", studentName: "Jayesh Shah", studentCode: "STU-1089", campaign: "Overdue Book Lending Fine", channel: "WhatsApp + Push", deliveredAt: "02 Nov, 11:00 AM", seenAt: "02 Nov, 11:04 AM", clickedCta: true },
    { id: "del-4", studentName: "Sunil Parmar", studentCode: "STU-1094", campaign: "Quarterly Fee Renewal Reminder", channel: "SMS + Email", deliveredAt: "31 Oct, 11:00 AM", seenAt: "Not Seen Yet", clickedCta: false },
  ])

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
          Delivery Audits & Seen Timestamps (SQL notification_recipients)
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CheckCheck className="size-5 text-emerald-600" />
            Notification Delivery Logs & Read Receipts
          </h1>
          <p className="text-xs text-muted-foreground">
            Per-student delivery logs with delivered timestamps, seen confirmation & call-to-action engagement (PRD §21.4)
          </p>
        </div>

        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border">
          <Download className="size-3.5" />
          <span>Export Receipts (.xlsx)</span>
        </Button>
      </div>

      {/* Table */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold">Student Recipient</TableHead>
                <TableHead className="text-xs font-bold">Campaign Subject</TableHead>
                <TableHead className="text-xs font-bold">Channel</TableHead>
                <TableHead className="text-xs font-bold">Delivered Time</TableHead>
                <TableHead className="text-xs font-bold">Read / Seen Time</TableHead>
                <TableHead className="text-xs font-bold text-right">CTA Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((d) => (
                <TableRow key={d.id} className="text-xs">
                  <TableCell>
                    <div className="font-semibold text-foreground">{d.studentName}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{d.studentCode}</div>
                  </TableCell>

                  <TableCell className="font-medium text-foreground">{d.campaign}</TableCell>

                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {d.channel}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-mono text-muted-foreground text-[11px]">{d.deliveredAt}</TableCell>

                  <TableCell className="font-mono text-[11px]">
                    {d.seenAt.includes("Not") ? (
                      <span className="text-muted-foreground italic">{d.seenAt}</span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">{d.seenAt}</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    {d.clickedCta ? (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px]">
                        Clicked Link
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-[10px]">Dismissed</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

