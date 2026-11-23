"use client"

import { CreditCard, Download, FileText } from "lucide-react"
import { toast } from "sonner"

import type { StudentProfile } from "@/data/students-data"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

export function StudentProfilePayments({
  student,
}: {
  student: StudentProfile
}) {
  const handleDownload = (invoiceNo: string) => {
    toast.success(`Downloading invoice receipt for ${invoiceNo}`)
  }

  return (
    <Card className="border-border bg-card shadow-xs min-w-0 overflow-hidden">
      <CardHeader className="p-4 pb-3 border-b border-border/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground truncate">
              <CreditCard className="size-4.5 text-primary shrink-0" />
              <span className="truncate">Payments & Invoices History</span>
            </CardTitle>
            <CardDescription className="text-xs truncate">
              Complete transaction receipts, membership plan payments, and locker fees.
            </CardDescription>
          </div>
          <div className="text-xs font-bold text-foreground bg-muted/60 px-3 py-1.5 rounded-lg border border-border/60 self-start sm:self-auto shrink-0">
            Total Paid:{" "}
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
              ₹{student.paidAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto no-scrollbar max-w-full min-w-0">
        <Table className="min-w-[650px] w-full">
          <TableHeader>
            <TableRow className="border-border/80 hover:bg-transparent">
              <TableHead className="text-xs font-bold text-muted-foreground ps-4">
                Invoice No
              </TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">
                Date
              </TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">
                Description
              </TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">
                Amount
              </TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">
                Payment Mode
              </TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground pe-4 text-end">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {student.paymentHistory.map((invoice) => (
              <TableRow
                key={invoice.id}
                className="border-border/60 hover:bg-muted/40"
              >
                <TableCell className="font-mono font-bold text-xs text-primary ps-4">
                  {invoice.invoiceNo}
                </TableCell>
                <TableCell className="text-xs text-foreground/90 font-medium">
                  {invoice.date}
                </TableCell>
                <TableCell className="text-xs font-semibold text-foreground">
                  {invoice.description}
                </TableCell>
                <TableCell className="text-xs font-extrabold text-foreground">
                  ₹{invoice.amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <span className="bg-muted px-2 py-0.5 rounded text-[11px] font-medium text-foreground">
                    {invoice.mode}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge className="border border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="pe-4 text-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-primary hover:bg-primary/10 cursor-pointer"
                    onClick={() => handleDownload(invoice.invoiceNo)}
                  >
                    <Download className="size-3.5" />
                    <span>Receipt</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
