"use client"

import {
  AlertOctagon,
  Clock,
  Lock,
  PauseCircle,
  ShieldCheck,
  Unlock,
  Users,
} from "lucide-react"

import type { GraceAndLockedLibrary } from "@/data/platform-admin-data"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface GraceAndLockedCardProps {
  items: GraceAndLockedLibrary[]
  onOpenLockUnlock: (library: GraceAndLockedLibrary) => void
}

export function GraceAndLockedCard({ items, onOpenLockUnlock }: GraceAndLockedCardProps) {
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <Lock className="size-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">Libraries in Grace or Locked</CardTitle>
            <p className="text-xs text-muted-foreground">5-day grace period enforcement & student app lock</p>
          </div>
        </div>
        <Badge variant="destructive" className="font-bold text-[10px] py-0 px-2">
          {items.length} Action Needed
        </Badge>
      </CardHeader>

      <CardContent className="pt-2 px-3 flex-1 flex flex-col justify-between divide-y divide-border/40">
        {items.slice(0, 4).map((lib) => {
          const isGrace = lib.status === "Grace"
          const isLocked = lib.status === "Locked"
          const isSuspended = lib.status === "Suspended"

          return (
            <div key={lib.id} className="py-2.5 flex flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">
                      {lib.libraryName}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1 border-border">
                      {lib.libraryCode}
                    </Badge>

                    {isGrace && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold flex items-center gap-1 text-amber-600 border-amber-400 bg-amber-500/10">
                        <Clock className="size-2.5" />
                        <span>Grace ({lib.graceDaysRemaining}d left)</span>
                      </Badge>
                    )}

                    {isLocked && (
                      <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-bold flex items-center gap-1">
                        <Lock className="size-2.5" />
                        <span>Locked</span>
                      </Badge>
                    )}

                    {isSuspended && (
                      <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-bold flex items-center gap-1">
                        <AlertOctagon className="size-2.5" />
                        <span>Suspended</span>
                      </Badge>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {lib.reason}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant={isLocked ? "default" : "outline"}
                  onClick={() => onOpenLockUnlock(lib)}
                  className={`h-7 px-2.5 text-xs font-bold gap-1 shrink-0 ${
                    isLocked
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "border-border/80"
                  }`}
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

              {/* Student app impact badge */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                <span className="flex items-center gap-1 text-destructive font-semibold">
                  <PauseCircle className="size-3" />
                  {lib.affectedStudents} students paused in mobile app
                </span>
                <span>Owner: {lib.ownerName} ({lib.phone})</span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
