"use client"

import { Armchair, CheckCircle2, History, UserCheck } from "lucide-react"

import type { StudentProfile } from "@/data/students-data"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function StudentProfileSeats({ student }: { student: StudentProfile }) {
  return (
    <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
      <CardHeader className="p-4 pb-3 border-b border-border/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground truncate">
              <Armchair className="size-4.5 text-primary shrink-0" />
              <span className="truncate">Seat & Room Allocation History</span>
            </CardTitle>
            <CardDescription className="text-xs truncate">
              Audit log of desk allocations, shift upgrades, and room transfers.
            </CardDescription>
          </div>
          <Badge className="border border-blue-500/25 bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold text-xs self-start sm:self-auto shrink-0">
            Current: {student.seatNo} ({student.shift})
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 min-w-0">
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {student.seatHistory.map((history, idx) => (
            <div key={history.id} className="relative min-w-0">
              {/* Dot */}
              <div
                className={`absolute -left-6 top-1.5 size-4 rounded-full border-2 border-card flex items-center justify-center ${
                  idx === 0
                    ? "bg-primary ring-4 ring-primary/20"
                    : "bg-muted-foreground/60"
                }`}
              />

              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-extrabold text-sm text-foreground">
                      {history.seatNo}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold text-muted-foreground border-border"
                    >
                      {history.shift}
                    </Badge>
                    {idx === 0 && (
                      <Badge className="border border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        Active Allocation
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    Allocated: {history.allocatedAt}{" "}
                    {history.releasedAt ? `— ${history.releasedAt}` : "(Current)"}
                  </span>
                </div>

                <p className="text-xs text-foreground/80 mt-1.5 leading-relaxed font-medium">
                  {history.reason}
                </p>

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/60">
                  <UserCheck className="size-3 text-primary" />
                  <span>Authorized by:</span>
                  <span className="font-semibold text-foreground">
                    {history.allocatedBy}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
