"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Plus,
  Star,
  ThumbsUp,
  User,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function StudentBookRequestsPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [requests, setRequests] = useState([
    {
      id: "req-1",
      title: "Macroeconomics (12th Edition)",
      author: "H.L. Ahuja",
      category: "UPSC & Civil Services",
      requestedBy: "Aarav Patel (STU-1081)",
      requestDate: "28 Oct 2026",
      upvotes: 18,
      status: "Approved for Purchase",
    },
    {
      id: "req-2",
      title: "Pathology Illustrated (8th Edition)",
      author: "Fiona Roberts",
      category: "Medical & NEET",
      requestedBy: "Priya Sharma (STU-1082)",
      requestDate: "01 Nov 2026",
      upvotes: 12,
      status: "Under Review",
    },
    {
      id: "req-3",
      title: "Quantitative Aptitude for Competitive Exams",
      author: "R.S. Aggarwal",
      category: "Banking & SSC",
      requestedBy: "Jayesh Shah (STU-1089)",
      requestDate: "15 Oct 2026",
      upvotes: 27,
      status: "Procured & Available",
    },
  ])

  const handleStatusChange = (id: string, newStatus: string) => {
    setRequests(
      requests.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden space-y-4 p-3 sm:p-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href={ensureLocalizedPathname("/pages/books", lang)}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0",
          })}
        >
          <ChevronLeft className="size-4" />
          <span>Back to Book Catalog</span>
        </Link>
        <span className="text-xs font-mono text-muted-foreground">
          Student Book Suggestions & Wishlist (PRD §5.4 & Phase 2)
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Star className="size-5 text-purple-600" />
            Student Book Requests & Acquisition Wishlist
          </h1>
          <p className="text-xs text-muted-foreground">
            Review textbook purchase suggestions submitted by students through the mobile app and track procurement
          </p>
        </div>
      </div>

      {/* Requests Table */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-bold">Suggested Book Title & Author</TableHead>
                  <TableHead className="text-xs font-bold">Category</TableHead>
                  <TableHead className="text-xs font-bold">Requested By</TableHead>
                  <TableHead className="text-xs font-bold text-center">Student Upvotes</TableHead>
                  <TableHead className="text-xs font-bold">Procurement Status</TableHead>
                  <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id} className="text-xs">
                    <TableCell>
                      <div className="font-semibold text-foreground">{r.title}</div>
                      <div className="text-[10px] text-muted-foreground">by {r.author}</div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {r.category}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-foreground">{r.requestedBy}</div>
                      <div className="text-[10px] text-muted-foreground">{r.requestDate}</div>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1 font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full text-[11px]">
                        <ThumbsUp className="size-3" />
                        <span>{r.upvotes}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          r.status === "Procured & Available"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
                            : r.status === "Approved for Purchase"
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]"
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      {r.status !== "Procured & Available" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(r.id, "Approved for Purchase")}
                            className="h-7 text-xs text-primary"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(r.id, "Procured & Available")}
                            className="h-7 text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            Mark Procured
                          </Button>
                        </div>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[11px]">In Library Shelf</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

