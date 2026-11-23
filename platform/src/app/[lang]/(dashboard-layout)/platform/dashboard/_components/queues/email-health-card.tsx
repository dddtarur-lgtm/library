"use client"

import { MailCheck, RefreshCw, Send } from "lucide-react"

import type { EmailConnectionHealth } from "@/data/platform-admin-data"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LibraryAvatar } from "@/components/platform/library-logo"

interface EmailHealthCardProps {
  connections: EmailConnectionHealth[]
  onTestEmail: (conn: EmailConnectionHealth) => void
  onRequestReconnect: (conn: EmailConnectionHealth) => void
}

export function EmailHealthCard({
  connections,
  onTestEmail,
  onRequestReconnect,
}: EmailHealthCardProps) {
  const alertCount = connections.filter((c) => c.status !== "Connected").length

  return (
    <Card className="h-full flex flex-col justify-between rounded-xl border border-border/70 bg-card/90 shadow-xs overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500 ring-1 ring-inset ring-sky-500/20">
            <MailCheck className="size-4" />
          </div>
          <CardTitle className="text-sm font-bold tracking-tight">
            Email OAuth Health
          </CardTitle>
        </div>
        {alertCount > 0 ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-500 ring-1 ring-inset ring-amber-500/25">
            {alertCount} Reconnect
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/25">
            All Healthy
          </span>
        )}
      </CardHeader>

      <CardContent className="px-5 py-2 flex-1 flex flex-col divide-y divide-border/40">
        {connections.slice(0, 4).map((c) => {
          const isConnected = c.status === "Connected"
          const shortProvider = c.provider.includes("Google")
            ? "Google"
            : "Microsoft"

          return (
            <div
              key={c.id}
              className="py-3 flex items-center justify-between gap-3 hover:bg-muted/35 -mx-2.5 px-2.5 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <LibraryAvatar
                  name={c.libraryName}
                  code={c.libraryCode}
                  src={c.logo}
                  size="sm"
                  status={c.status}
                  showStatusDot
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground truncate">
                      {c.libraryName}
                    </span>
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                      {shortProvider}
                    </span>
                    {!isConnected && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500">
                        Expired
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {c.connectedEmail}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!isConnected && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRequestReconnect(c)}
                    className="h-7 px-2.5 text-xs font-bold gap-1 border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                  >
                    <RefreshCw className="size-3" />
                    <span>Reconnect</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onTestEmail(c)}
                  className="h-7 w-7 p-0 border-border/70 hover:border-sky-500/60"
                  title="Send diagnostic test ping"
                >
                  <Send className="size-3.5 text-sky-500" />
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
