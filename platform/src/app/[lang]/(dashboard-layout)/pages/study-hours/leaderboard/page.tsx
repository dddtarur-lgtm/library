"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  Award,
  ChevronLeft,
  Flame,
  Medal,
  Shield,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react"

import { initialStudyLeaderboard, type StudyLeaderboardEntry } from "@/data/library-management-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function StudyLeaderboardPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [leaderboardPeriod, setLeaderboardPeriod] = useState("This Week")
  const [board, setBoard] = useState<StudyLeaderboardEntry[]>(initialStudyLeaderboard)

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden space-y-4 p-3 sm:p-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href={ensureLocalizedPathname("/pages/study-hours", lang)}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0",
          })}
        >
          <ChevronLeft className="size-4" />
          <span>Back to Study Hours</span>
        </Link>
        <span className="text-xs font-mono text-muted-foreground">
          Library Study Leaderboard & Milestones (PRD §39)
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Trophy className="size-5 text-amber-500" />
            Library Study Leaderboard & Top Achievers
          </h1>
          <p className="text-xs text-muted-foreground">
            Inspire healthy reading competition; rankings update from completed study sessions with student privacy opt-outs (PRD §39)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={leaderboardPeriod} onValueChange={setLeaderboardPeriod}>
            <SelectTrigger className="h-8 text-xs w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Today">Today (Daily)</SelectItem>
              <SelectItem value="This Week">This Week (Weekly)</SelectItem>
              <SelectItem value="This Month">This Month (Monthly)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Privacy Notice (PRD §39) */}
      <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground flex items-center gap-3">
        <Shield className="size-4 text-primary shrink-0" />
        <div className="space-y-0.5">
          <span className="font-semibold text-primary">Student Privacy Setting (PRD §39):</span>
          <p className="text-muted-foreground">
            Leaderboard participation is strictly library-level only. Students can choose to display their name or remain anonymous (displayed as <em>Student #Code</em>) in their mobile app settings.
          </p>
        </div>
      </div>

      {/* Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {board.slice(0, 3).map((entry) => (
          <Card
            key={entry.studentId}
            className={`border-border/60 bg-card shadow-xs text-center relative overflow-hidden ${
              entry.rank === 1 ? "border-amber-500/50 ring-1 ring-amber-500/30" : ""
            }`}
          >
            {entry.rank === 1 && (
              <div className="absolute top-0 inset-x-0 bg-amber-500 text-amber-950 text-[10px] font-bold py-0.5 uppercase tracking-wider">
                👑 #1 Top Reader This Week
              </div>
            )}
            <CardContent className="p-5 pt-7 flex flex-col items-center space-y-2">
              <div className="relative">
                <img
                  src={entry.avatar}
                  alt={entry.studentName}
                  className="size-16 rounded-full object-cover border-2 border-primary/30 shadow-sm"
                />
                <span
                  className={`absolute -bottom-1 -right-1 size-6 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                    entry.rank === 1 ? "bg-amber-500" : entry.rank === 2 ? "bg-slate-400" : "bg-amber-700"
                  }`}
                >
                  #{entry.rank}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-foreground text-sm flex items-center justify-center gap-1.5">
                  {entry.studentName}
                  {entry.isAnonymous && (
                    <Badge variant="outline" className="text-[9px] py-0 h-4">
                      Incognito
                    </Badge>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">{entry.goal}</p>
              </div>

              <div className="pt-2 border-t border-border/60 w-full flex justify-around font-mono text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Study Time</span>
                  <span className="font-bold text-foreground text-sm">{entry.totalHoursThisWeek}h</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Streak</span>
                  <span className="font-bold text-rose-500 text-sm flex items-center justify-center gap-0.5">
                    <Flame className="size-3.5 fill-rose-500" /> {entry.streakDays}d
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 justify-center pt-1">
                {entry.badges.map((b, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                    {b}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leaderboard Table */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold text-center w-16">Rank</TableHead>
                <TableHead className="text-xs font-bold">Student</TableHead>
                <TableHead className="text-xs font-bold">Target Stream</TableHead>
                <TableHead className="text-xs font-bold text-center">Total Hours</TableHead>
                <TableHead className="text-xs font-bold text-center">Daily Average</TableHead>
                <TableHead className="text-xs font-bold text-center">Streak</TableHead>
                <TableHead className="text-xs font-bold text-right">Earned Badges</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {board.map((entry) => (
                <TableRow key={entry.studentId} className="text-xs">
                  <TableCell className="text-center font-bold font-mono text-foreground">
                    #{entry.rank}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img
                        src={entry.avatar}
                        alt={entry.studentName}
                        className="size-7 rounded-full object-cover border border-border"
                      />
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <span>{entry.studentName}</span>
                          {entry.isAnonymous && (
                            <Badge variant="outline" className="text-[9px] py-0 h-4">
                              Private
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">{entry.studentCode}</div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground">{entry.goal}</TableCell>

                  <TableCell className="text-center font-mono font-bold text-primary">
                    {entry.totalHoursThisWeek}h
                  </TableCell>

                  <TableCell className="text-center font-mono text-muted-foreground">
                    {entry.dailyAvgHours}h / day
                  </TableCell>

                  <TableCell className="text-center font-mono font-semibold text-rose-500">
                    {entry.streakDays} Days
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {entry.badges.map((b, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">
                          {b}
                        </Badge>
                      ))}
                    </div>
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

