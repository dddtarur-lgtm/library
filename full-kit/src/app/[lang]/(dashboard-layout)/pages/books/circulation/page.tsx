"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Barcode,
  BookMarked,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
} from "lucide-react"

import { initialBookLoans, type BookLoanRecord } from "@/data/library-management-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function BookCirculationDeskPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [loans, setLoans] = useState<BookLoanRecord[]>(initialBookLoans)
  const [issueModalOpen, setIssueModalOpen] = useState(false)

  // Issue modal fields
  const [studentCode, setStudentCode] = useState("")
  const [studentName, setStudentName] = useState("")
  const [bookTitle, setBookTitle] = useState("")
  const [copyBarcode, setCopyBarcode] = useState("")

  const handleIssueBook = () => {
    if (!studentName || !bookTitle) return
    const newLoan: BookLoanRecord = {
      id: `loan-${Date.now()}`,
      bookId: "book-new",
      bookTitle,
      bookIsbn: "978-9355325051",
      copyBarcode: copyBarcode || `BC-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: "stu-new",
      studentCode: studentCode || "STU-1081",
      studentName,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      issuedAt: "Today, 02 Nov",
      dueDate: "16 Nov 2026",
      returnedAt: null,
      status: "Issued",
      fineAmount: 0,
      fineStatus: "N/A",
    }
    setLoans([newLoan, ...loans])
    setIssueModalOpen(false)
    setStudentName("")
    setBookTitle("")
    setCopyBarcode("")
  }

  const handleReturnBook = (id: string) => {
    setLoans(
      loans.map((l) =>
        l.id === id ? { ...l, status: "Returned", returnedAt: "Today, 02 Nov" } : l
      )
    )
  }

  const handleRenewLoan = (id: string) => {
    setLoans(
      loans.map((l) =>
        l.id === id ? { ...l, dueDate: "23 Nov 2026" } : l
      )
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
          Barcode Circulation Desk & Lending Workflows (PRD §7.4)
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookMarked className="size-5 text-primary" />
            Book Issue & Return Circulation Desk
          </h1>
          <p className="text-xs text-muted-foreground">
            Fast checkout scanner by student card & book copy barcode, lending renewals & return reconciliations (PRD §7.4)
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIssueModalOpen(true)}
          className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
        >
          <Plus className="size-3.5" />
          <span>Issue Book to Student</span>
        </Button>
      </div>

      {/* Circulation Ledger Table */}
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-bold">Student Borrower</TableHead>
                  <TableHead className="text-xs font-bold">Book Title</TableHead>
                  <TableHead className="text-xs font-bold">Copy Barcode</TableHead>
                  <TableHead className="text-xs font-bold">Issue Date</TableHead>
                  <TableHead className="text-xs font-bold">Due Date</TableHead>
                  <TableHead className="text-xs font-bold">Loan Status</TableHead>
                  <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((l) => (
                  <TableRow key={l.id} className="text-xs">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img
                          src={l.avatar}
                          alt={l.studentName}
                          className="size-7 rounded-full object-cover border border-border"
                        />
                        <div>
                          <div className="font-semibold text-foreground">{l.studentName}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{l.studentCode}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="font-semibold text-foreground">
                      {l.bookTitle}
                    </TableCell>

                    <TableCell className="font-mono text-primary font-bold">
                      {l.copyBarcode}
                    </TableCell>

                    <TableCell className="font-mono text-muted-foreground text-[11px]">
                      {l.issuedAt}
                    </TableCell>

                    <TableCell className="font-mono font-medium text-foreground text-[11px]">
                      {l.dueDate}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          l.status === "Issued"
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]"
                            : l.status === "Returned"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
                              : "bg-destructive/10 text-destructive border-destructive/20 text-[10px]"
                        }
                      >
                        {l.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      {l.status !== "Returned" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRenewLoan(l.id)}
                            className="h-7 text-xs text-muted-foreground gap-1"
                          >
                            <RefreshCw className="size-3" />
                            <span>Renew</span>
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleReturnBook(l.id)}
                            className="h-7 text-xs bg-emerald-600 text-white hover:bg-emerald-700 font-semibold gap-1"
                          >
                            <ArrowDownLeft className="size-3" />
                            <span>Return</span>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Returned {l.returnedAt}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Issue Book to Student */}
      <Dialog open={issueModalOpen} onOpenChange={setIssueModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookMarked className="size-5 text-primary" />
              Issue Book to Student
            </DialogTitle>
            <DialogDescription className="text-xs">
              Scan student ID card and physical book copy barcode (PRD §7.4).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Student ID / Code</Label>
              <Input
                placeholder="Scan or type STU-1081"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Student Name</Label>
              <Input
                placeholder="e.g. Aarav Patel"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Book Title</Label>
              <Input
                placeholder="e.g. Indian Polity (7th Edition)"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Copy Barcode Sticker No</Label>
              <Input
                placeholder="Scan barcode e.g. BK-POL-003"
                value={copyBarcode}
                onChange={(e) => setCopyBarcode(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIssueModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleIssueBook}
              disabled={!studentName || !bookTitle}
              className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirm Loan (14 Days)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

