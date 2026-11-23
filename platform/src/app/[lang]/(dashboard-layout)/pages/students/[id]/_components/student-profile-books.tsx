"use client"

import { BookOpen, CheckCircle2, Clock, TriangleAlert } from "lucide-react"

import type { StudentProfile } from "@/data/students-data"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function StudentProfileBooks({ student }: { student: StudentProfile }) {
  return (
    <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
      <CardHeader className="p-4 pb-3 border-b border-border/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground truncate">
              <BookOpen className="size-4.5 text-primary shrink-0" />
              <span className="truncate">Book Lending & Circulation History</span>
            </CardTitle>
            <CardDescription className="text-xs truncate">
              History of reference books and study materials borrowed from the library.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="text-xs font-semibold border-border bg-muted/50 self-start sm:self-auto shrink-0"
          >
            {student.bookHistory.length} Total Books Borrowed
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto no-scrollbar max-w-full min-w-0">
        <Table className="min-w-[650px] w-full">
          <TableHeader>
            <TableRow className="border-border/80 hover:bg-transparent">
              <TableHead className="text-xs font-bold text-muted-foreground ps-4">
                Book Title & Author
              </TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">
                Barcode ID
              </TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">
                Issued Date
              </TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">
                Due Date
              </TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">
                Return Date
              </TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground pe-4 text-end">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {student.bookHistory.map((bk) => {
              const isReturned = bk.status === "Returned"
              const isIssued = bk.status === "Issued"

              return (
                <TableRow key={bk.id} className="border-border/60 hover:bg-muted/40">
                  <TableCell className="ps-4">
                    <p className="text-xs font-bold text-foreground">
                      {bk.bookTitle}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      By {bk.author} • {bk.category}
                    </p>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-primary font-bold">
                    {bk.barcode}
                  </TableCell>
                  <TableCell className="text-xs text-foreground/90 font-medium">
                    {bk.issuedDate}
                  </TableCell>
                  <TableCell className="text-xs text-foreground/90 font-medium">
                    {bk.dueDate}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-foreground">
                    {bk.returnedDate || "—"}
                  </TableCell>
                  <TableCell className="pe-4 text-end">
                    <Badge
                      className={
                        isReturned
                          ? "border border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]"
                          : isIssued
                          ? "border border-blue-500/25 bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold text-[11px]"
                          : "border border-rose-500/25 bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold text-[11px]"
                      }
                    >
                      {bk.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
