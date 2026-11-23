"use client"

import { AlertOctagon, Clock, Lock, ShieldCheck, Unlock } from "lucide-react"

import type { GraceAndLockedLibrary } from "@/data/platform-admin-data"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LibraryAvatar } from "@/components/platform/library-logo"

interface GraceAndLockedCardProps {
  items: GraceAndLockedLibrary[]
  onOpenLockUnlock: (library: GraceAndLockedLibrary) => void
}

export function GraceAndLockedCard({
  items,
  onOpenLockUnlock,
}: GraceAndLockedCardProps) {
  return (
    <Card className="h-full flex flex-col justify-between rounded-xl border border-border/70 bg-card/90 shadow-xs overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-5 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20">
            <Lock className="size-4" />
          </div>
          <CardTitle className="text-sm font-bold tracking-tight">
            Grace & Locked
          </CardTitle>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-destructive/15 text-destructive ring-1 ring-inset ring-destructive/25">
          {items.length} Flagged
        </span>
      </CardHeader>

      <CardContent className="px-5 py-2 flex-1 flex flex-col divide-y divide-border/40">
        {items.slice(0, 4).map((lib) => {
          const isGrace = lib.status === "Grace"
          const isLocked = lib.status === "Locked"

          return (
            <div
              key={lib.id}
              className="py-3 flex items-center justify-between gap-3 hover:bg-muted/35 -mx-2.5 px-2.5 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <LibraryAvatar
                  name={lib.libraryName}
                  code={lib.libraryCode}
                  src={lib.logo}
                  size="sm"
                  status={lib.status}
                  showStatusDot
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground truncate">
                      {lib.libraryName}
                    </span>

                    {isGrace ? (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-500">
                        <Clock className="size-2.5" /> Grace ·{" "}
                        {lib.graceDaysRemaining}d
                      </span>
                    ) : isLocked ? (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-destructive/15 text-destructive">
                        <Lock className="size-2.5" /> Locked
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-destructive/15 text-destructive">
                        <AlertOctagon className="size-2.5" /> Suspended
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                    <span className="text-rose-400 font-semibold shrink-0 tabular-nums">
                      {lib.affectedStudents} students paused
                    </span>
                    <span className="text-border">•</span>
                    <span className="truncate">{lib.ownerName}</span>
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                variant={isLocked ? "default" : "outline"}
                onClick={() => onOpenLockUnlock(lib)}
                className={
                  isLocked
                    ? "h-7 px-2.5 text-xs font-bold gap-1 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "h-7 px-2.5 text-xs font-semibold gap-1 shrink-0 border-border/70"
                }
              >
                {isLocked ? (
                  <>
                    <Unlock className="size-3" />
                    <span>Unlock</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-3 text-primary" />
                    <span>Manage</span>
                  </>
                )}
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
