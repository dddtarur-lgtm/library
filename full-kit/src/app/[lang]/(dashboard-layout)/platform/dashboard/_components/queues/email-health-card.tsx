"use client"

import {
  AlertTriangle,
  CheckCircle2,
  MailCheck,
  MailWarning,
  RefreshCw,
  Send,
} from "lucide-react"

import type { EmailConnectionHealth } from "@/data/platform-admin-data"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <MailCheck className="size-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">Email Connections & OAuth Health</CardTitle>
            <p className="text-xs text-muted-foreground">Libraries' connected Google/Microsoft accounts (No SMTP)</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-semibold">
          Token Monitor
        </Badge>
      </CardHeader>

      <CardContent className="pt-2 px-3 flex-1 flex flex-col justify-between divide-y divide-border/40">
        {connections.map((c) => {
          const isConnected = c.status === "Connected"
          return (
            <div key={c.id} className="py-2.5 flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {isConnected ? (
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  ) : (
                    <MailWarning className="size-4 text-amber-500 shrink-0" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs text-foreground">{c.libraryName}</span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1 border-border">
                      {c.provider}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] py-0 px-1.5 font-bold ${
                        isConnected
                          ? "text-muted-foreground"
                          : "text-amber-600 border-amber-400 bg-amber-500/10"
                      }`}
                    >
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {c.connectedEmail}
                  </p>
                  {c.lastError && (
                    <p className="text-[10px] text-destructive font-medium line-clamp-1 mt-0.5">
                      ⚠️ {c.lastError}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onTestEmail(c)}
                  className="h-7 px-2 text-xs font-semibold gap-1"
                  title="Send diagnostic test message"
                >
                  <Send className="size-3 text-sky-600" />
                  <span>Test</span>
                </Button>
                {!isConnected && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRequestReconnect(c)}
                    className="h-7 px-2 text-xs font-semibold gap-1 hover:border-amber-500"
                    title="Send re-authentication notification to library admin"
                  >
                    <RefreshCw className="size-3 text-amber-600" />
                    <span>Reconnect</span>
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
