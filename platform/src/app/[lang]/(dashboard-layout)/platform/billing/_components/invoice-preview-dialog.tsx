"use client"

import { toast } from "sonner"
import { Download, Printer } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LibraryLogo } from "@/components/platform/library-logo"
import { downloadTextFile, formatINR } from "./billing-shell"

export interface BillingInvoiceRecord {
  id: string
  libraryName: string
  libraryCode?: string
  logo?: string
  amount: number
  date: string
  status: string
  planName?: string
  reference?: string
}

interface InvoicePreviewDialogProps {
  invoice: BillingInvoiceRecord | null
  onOpenChange: (open: boolean) => void
}

export function InvoicePreviewDialog({
  invoice,
  onOpenChange,
}: InvoicePreviewDialogProps) {
  if (!invoice) return null

  const taxableBase = Math.round(invoice.amount / 1.18)
  const totalGst = invoice.amount - taxableBase
  const cgst = Math.round(totalGst / 2)
  const sgst = totalGst - cgst

  const handleDownloadStatement = () => {
    const receipt = [
      "TAX INVOICE (RULE 46 - GST INDIA)",
      "==================================",
      `Invoice No:   ${invoice.id}`,
      `Date:         ${invoice.date}`,
      `Status:       ${invoice.status.toUpperCase()}`,
      `Supplier:     LMS Platform Private Limited (GSTIN: 27AABCL1429K1ZX)`,
      `Billed To:    ${invoice.libraryName}${invoice.libraryCode ? ` (${invoice.libraryCode})` : ""}`,
      `Description:  ${invoice.planName || "LMS SaaS Platform Subscription"} (SAC 998314)`,
      `Reference:    ${invoice.reference || "-"}`,
      "----------------------------------",
      `Taxable Value: ${formatINR(taxableBase)}`,
      `CGST (9%):     ${formatINR(cgst)}`,
      `SGST (9%):     ${formatINR(sgst)}`,
      `Total Paid:    ${formatINR(invoice.amount)}`,
    ].join("\n")

    downloadTextFile(`${invoice.id}.txt`, receipt)
    toast.success(`Downloaded ${invoice.id} invoice summary`)
  }

  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-bold flex items-center justify-between pr-6">
            <span>GST Tax Invoice</span>
            <Badge variant="outline" className="font-mono text-xs">
              {invoice.id}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 border border-border rounded-xl space-y-4 bg-muted/20">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-border pb-4">
            <div className="space-y-0.5">
              <h3 className="font-bold text-base text-foreground">
                LMS Platform Private Limited
              </h3>
              <p className="text-xs font-mono text-muted-foreground">
                GSTIN: 27AABCL1429K1ZX • SAC: 998314
              </p>
              <p className="text-xs text-muted-foreground">
                World Trade Centre, Tower 4, Pune - 411014
              </p>
            </div>
            <div className="sm:text-right space-y-1">
              <Badge
                variant="outline"
                className="font-mono uppercase font-bold text-[10px]"
              >
                Original for Recipient
              </Badge>
              <p className="text-xs text-muted-foreground tabular-nums">
                Date: {invoice.date}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <LibraryLogo
                name={invoice.libraryName}
                code={invoice.libraryCode}
                src={invoice.logo}
                size="md"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Billed To
                </p>
                <p className="font-bold text-sm text-foreground truncate">
                  {invoice.libraryName}
                </p>
                {invoice.libraryCode && (
                  <p className="text-xs font-mono text-muted-foreground">
                    {invoice.libraryCode}
                  </p>
                )}
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                invoice.status.toLowerCase() === "paid" ||
                invoice.status.toLowerCase() === "success" ||
                invoice.status.toLowerCase() === "successful"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 capitalize"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25 capitalize"
              }
            >
              {invoice.status}
            </Badge>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border bg-background/60">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 font-semibold text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5">SAC</th>
                  <th className="p-2.5 text-right">Taxable</th>
                  <th className="p-2.5 text-right">CGST (9%)</th>
                  <th className="p-2.5 text-right">SGST (9%)</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2.5 font-medium text-foreground">
                    {invoice.planName || "LMS SaaS Platform Subscription"}
                  </td>
                  <td className="p-2.5 font-mono text-muted-foreground">
                    998314
                  </td>
                  <td className="p-2.5 text-right font-mono tabular-nums">
                    {formatINR(taxableBase)}
                  </td>
                  <td className="p-2.5 text-right font-mono tabular-nums">
                    {formatINR(cgst)}
                  </td>
                  <td className="p-2.5 text-right font-mono tabular-nums">
                    {formatINR(sgst)}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold tabular-nums text-foreground">
                    {formatINR(invoice.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (typeof window !== "undefined") window.print()
            }}
          >
            <Printer className="size-3.5 mr-1.5" />
            Print
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleDownloadStatement}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
          >
            <Download className="size-3.5 mr-1.5" />
            Download Statement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
