"use client"

import { useState } from "react"
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  KeyRound,
  Laptop,
  LogOut,
  MapPin,
  Monitor,
  Shield,
  Smartphone,
  Trash2,
  UserCheck,
} from "lucide-react"
import { toast } from "sonner"

import type { StaffMember } from "@/data/library-management-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine,
} from "@/components/ui/timeline"

interface StaffTimelineEvent {
  id: string
  title: string
  description: string
  module: string
  time: string
  fill: string
  iconName: any
}

export function StaffProfileSessions({ staff }: { staff: StaffMember }) {
  const [sessions, setSessions] = useState([
    {
      id: "sess-1",
      device: "Windows 11 Workstation (Front Desk PC)",
      browser: "Chrome 130 • Front Desk Terminal",
      ip: "103.21.58.12",
      location: "Pune, Maharashtra",
      loginTime: "Today at 05:50 AM",
      current: true,
      type: "desktop",
    },
    {
      id: "sess-2",
      device: "Samsung Galaxy S23 (Staff App)",
      browser: "ShelfSpace Operator APK v3.2",
      ip: "49.36.120.45",
      location: "Pune, Maharashtra",
      loginTime: "Yesterday at 06:15 PM",
      current: false,
      type: "mobile",
    },
  ])

  // Timeline events representing admin / staff activity using dashboard timeline format
  const timelineActivities: StaffTimelineEvent[] = [
    {
      id: "act-1",
      title: "QR Check-in Verified & Seat Activated",
      description: "Approved student QR check-in for Aditya Kulkarni (SHR-0103) at Seat C-08 (Main Campus).",
      module: "Attendance",
      time: "10 mins ago",
      fill: "hsl(142.1 76.2% 36.3%)", // emerald
      iconName: "Check",
    },
    {
      id: "act-2",
      title: "Fee Receipt Generated & Payment Logged",
      description: "Processed ₹3,200 payment via UPI QR for Rohan Sharma (SHR-0101) - Receipt REC-2026-902.",
      module: "Fees & Plans",
      time: "45 mins ago",
      fill: "hsl(217.2 91.2% 59.8%)", // blue
      iconName: "Circle",
    },
    {
      id: "act-3",
      title: "Locker Allocation & Deposit Recorded",
      description: "Assigned Locker L-14 to Sneha Deshmukh. Security deposit ₹500 credited to day-book.",
      module: "Seats & Lockers",
      time: "2 hours ago",
      fill: "hsl(37.7 92.1% 50.2%)", // amber
      iconName: "Circle",
    },
    {
      id: "act-4",
      title: "Turnstile Manual Override Granted",
      description: "Granted manual gate turnstile access for student reporting phone battery drain (SHR-0107).",
      module: "Gate Security",
      time: "3 hours ago",
      fill: "hsl(var(--primary))",
      iconName: "Check",
    },
    {
      id: "act-5",
      title: "Staff System Authentication",
      description: "Operator session signed in via Front Desk Terminal (IP 103.21.58.12, Chrome 130).",
      module: "Security Auth",
      time: "Today at 05:50 AM",
      fill: "hsl(var(--muted-foreground))",
      iconName: "Circle",
    },
  ]

  const handleRevokeSession = (id: string) => {
    setSessions(sessions.filter((s) => s.id !== id))
    toast.success("Session terminated", {
      description: "The selected device session has been signed out immediately.",
    })
  }

  return (
    <div className="space-y-4">
      {/* Activity Timeline Card (using dashboard timeline UI) */}
      <Card className="border border-border bg-card rounded-xl shadow-xs overflow-hidden">
        <CardHeader className="p-3.5 sm:p-4 border-b border-border/80 flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <History className="size-4 text-primary" />
              Activity Timeline
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Real-time audit log of actions performed by {staff.name}.
            </p>
          </div>
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
            {timelineActivities.length} Events Logged
          </Badge>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Timeline align="left">
            {timelineActivities.map((item, idx) => (
              <TimelineItem key={item.id}>
                <TimelineHeading className="text-xs sm:text-sm font-bold text-foreground">
                  {item.title}
                </TimelineHeading>
                <TimelineDot
                  style={{ backgroundColor: item.fill }}
                  customIconName={item.iconName}
                  customStatusName={item.module}
                  iconClassName="size-3.5 text-white p-0.5"
                  className="size-5 sm:size-6"
                />
                {idx < timelineActivities.length - 1 && <TimelineLine done />}
                <TimelineContent className="space-y-1.5 pb-6">
                  <div className="flex items-center text-xs text-muted-foreground gap-2">
                    <span className="font-mono text-[11px]">{item.time}</span>
                    <Badge variant="outline" className="text-[10px] bg-muted/40 border-border text-muted-foreground px-1.5 py-0">
                      {item.module}
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {item.description}
                  </p>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </CardContent>
      </Card>

      {/* Active Login Sessions */}
      <Card className="border border-border bg-card rounded-xl shadow-xs overflow-hidden">
        <CardHeader className="p-3.5 sm:p-4 border-b border-border/80 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Monitor className="size-4 text-primary" />
              Active System Sessions
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Workstations and devices currently authenticated.
            </p>
          </div>
          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            {sessions.length} Active Sessions
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="size-9 rounded-lg bg-muted/60 border border-border flex items-center justify-center shrink-0 text-muted-foreground">
                    {sess.type === "desktop" ? (
                      <Laptop className="size-4 text-primary" />
                    ) : (
                      <Smartphone className="size-4 text-blue-500" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">
                        {sess.device}
                      </span>
                      {sess.current && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-1.5 py-0 font-medium"
                        >
                          This Device
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {sess.browser}
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-2 pt-0.5">
                      <span>IP: {sess.ip}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {sess.location}
                      </span>
                      <span>•</span>
                      <span>{sess.loginTime}</span>
                    </div>
                  </div>
                </div>

                {!sess.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeSession(sess.id)}
                    className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border-border self-start sm:self-auto cursor-pointer"
                  >
                    <LogOut className="size-3.5 mr-1" />
                    <span>Terminate</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
