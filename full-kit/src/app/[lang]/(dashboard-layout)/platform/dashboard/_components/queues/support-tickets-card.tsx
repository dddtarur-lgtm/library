"use client"

import { AlertCircle, Headphones, MessageSquare, ShieldCheck } from "lucide-react"

import type { PlatformSupportTicket } from "@/data/platform-admin-data"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SupportTicketsCardProps {
  tickets: PlatformSupportTicket[]
  onOpenTicket: (ticket: PlatformSupportTicket) => void
}

export function SupportTicketsCard({ tickets, onOpenTicket }: SupportTicketsCardProps) {
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Headphones className="size-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">Open Support Tickets</CardTitle>
            <p className="text-xs text-muted-foreground">Library admin enquiries & technical assistance</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-semibold">
          {tickets.length} Active
        </Badge>
      </CardHeader>

      <CardContent className="pt-2 px-3 flex-1 flex flex-col justify-between divide-y divide-border/40">
        {tickets.map((t) => (
          <div key={t.id} className="py-2.5 flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs text-foreground">{t.libraryName}</span>
                <Badge variant="outline" className="text-[10px] py-0 px-1 border-border">
                  {t.ticketNumber}
                </Badge>
                <Badge
                  variant={t.priority === "Urgent" ? "destructive" : t.priority === "High" ? "outline" : "secondary"}
                  className={`text-[10px] py-0 px-1.5 font-bold ${
                    t.priority === "High"
                      ? "text-amber-600 border-amber-400 bg-amber-500/10"
                      : ""
                  }`}
                >
                  {t.priority}
                </Badge>
              </div>
              <p className="text-[11px] text-foreground font-medium mt-0.5 line-clamp-1">
                {t.subject}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {t.category} • Assigned: {t.assignedRole} • {t.createdTime}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenTicket(t)}
              className="h-7 px-2 text-xs font-semibold shrink-0 gap-1"
            >
              <MessageSquare className="size-3" />
              <span>Reply</span>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
