"use client"

import { Headphones, MessageSquare } from "lucide-react"

import type { PlatformSupportTicket } from "@/data/platform-admin-data"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LibraryAvatar } from "@/components/platform/library-logo"

interface SupportTicketsCardProps {
  tickets: PlatformSupportTicket[]
  onOpenTicket: (ticket: PlatformSupportTicket) => void
}

export function SupportTicketsCard({
  tickets,
  onOpenTicket,
}: SupportTicketsCardProps) {
  return (
    <Card className="h-full flex flex-col justify-between rounded-xl border border-border/70 bg-card/90 shadow-xs overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 ring-1 ring-inset ring-violet-500/20">
            <Headphones className="size-4" />
          </div>
          <CardTitle className="text-sm font-bold tracking-tight">
            Support Tickets
          </CardTitle>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
          {tickets.length} Open
        </span>
      </CardHeader>

      <CardContent className="px-5 py-2 flex-1 flex flex-col divide-y divide-border/40">
        {tickets.slice(0, 4).map((t) => {
          const priorityClass =
            t.priority === "Urgent"
              ? "bg-destructive/15 text-destructive"
              : t.priority === "High"
                ? "bg-amber-500/15 text-amber-500"
                : "bg-muted text-muted-foreground"

          return (
            <div
              key={t.id}
              className="py-3 flex items-center justify-between gap-3 hover:bg-muted/35 -mx-2.5 px-2.5 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <LibraryAvatar
                  name={t.libraryName}
                  code={t.libraryCode}
                  src={t.logo}
                  size="sm"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground truncate">
                      {t.libraryName}
                    </span>
                    <span
                      className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${priorityClass}`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {t.subject} ·{" "}
                    <span className="text-muted-foreground/70">
                      {t.createdTime}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenTicket(t)}
                className="h-7 px-2.5 text-xs font-semibold shrink-0 gap-1 border-border/70"
              >
                <MessageSquare className="size-3" />
                <span>Reply</span>
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
