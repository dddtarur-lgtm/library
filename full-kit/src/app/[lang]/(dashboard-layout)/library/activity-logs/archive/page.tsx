"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  Archive,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Database,
  Download,
  FileCheck,
  FileText,
  HardDrive,
  History,
  Lock,
  Search,
  Shield,
  ShieldCheck,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AuditArchivePage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const archives = [
    {
      id: "arc-2026-10",
      month: "October 2026",
      recordsCount: "4,912 Events",
      fileSize: "8.4 MB",
      sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      archivedAt: "01 Nov 2026, 00:00 UTC",
      retentionUntil: "31 Oct 2028 (2 Years Required)",
      status: "Cryptographically Sealed",
    },
    {
      id: "arc-2026-09",
      month: "September 2026",
      recordsCount: "4,640 Events",
      fileSize: "7.9 MB",
      sha256Hash: "5f4dcc3b5aa765d61d8327deb882cf992b95990a9151374cedeb2a42fc170296",
      archivedAt: "01 Oct 2026, 00:00 UTC",
      retentionUntil: "30 Sep 2028 (2 Years Required)",
      status: "Cryptographically Sealed",
    },
    {
      id: "arc-2026-08",
      month: "August 2026",
      recordsCount: "4,208 Events",
      fileSize: "7.2 MB",
      sha256Hash: "7d793037a0760186574b0282f2f435e7090a6ffb8e19036c6460309be0d10c8f",
      archivedAt: "01 Sep 2026, 00:00 UTC",
      retentionUntil: "31 Aug 2028 (2 Years Required)",
      status: "Cryptographically Sealed",
    },
    {
      id: "arc-2026-07",
      month: "July 2026",
      recordsCount: "3,890 Events",
      fileSize: "6.8 MB",
      sha256Hash: "1253e9373e781b7500266caa55150e08e210bc86f45c90c58d3b820026217e41",
      archivedAt: "01 Aug 2026, 00:00 UTC",
      retentionUntil: "31 Jul 2028 (2 Years Required)",
      status: "Cryptographically Sealed",
    },
  ]

  const copyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={ensureLocalizedPathname("/pages/activity-logs", lang)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Activity Logs
            </Link>
            <ChevronRight className="size-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-primary">2-Year Compliance Archive</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Immutable 2-Year Audit Compliance Archive
          </h1>
          <p className="text-sm text-muted-foreground">
            Cold storage of historical administrative events sealed with SHA-256 cryptographic hashes for regulatory audit readiness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={ensureLocalizedPathname("/pages/activity-logs", lang)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs font-medium hover:bg-muted/50"
          >
            ← Back to Active Logs
          </Link>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Statutory Retention Policy
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
              <ShieldCheck className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">730 Days (2 Years)</div>
            <div className="mt-1 text-xs text-muted-foreground">Compliant with digital library norms</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Total Sealed Archives
            </CardTitle>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Archive className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">17,650 Events</div>
            <div className="mt-1 text-xs text-muted-foreground">Across 4 monthly cold storage snapshots</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Storage Encryption
            </CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
              <Lock className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">AES-256 GCM</div>
            <div className="mt-1 text-xs text-muted-foreground">Immutable write-once read-many</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Archive Registry Table */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Monthly Sealed Archive Bundles</CardTitle>
          <CardDescription>
            Download cryptographically sealed bundles with tamper-proof checksum verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs">Archive Month</TableHead>
                  <TableHead className="text-xs">Total Records</TableHead>
                  <TableHead className="text-xs">Package Size</TableHead>
                  <TableHead className="text-xs">SHA-256 Checksum</TableHead>
                  <TableHead className="text-xs">Retention Expiry</TableHead>
                  <TableHead className="text-xs">Integrity Status</TableHead>
                  <TableHead className="text-right text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archives.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="font-semibold text-xs">
                      <div className="flex items-center gap-2">
                        <FileCheck className="size-4 text-primary" />
                        <span>{item.month}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs font-mono">
                      {item.recordsCount}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {item.fileSize}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                        <span className="truncate max-w-[140px]">{item.sha256Hash}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => copyHash(item.sha256Hash)}
                        >
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {item.retentionUntil}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px]">
                        <CheckCircle2 className="mr-1 size-3" />
                        {item.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <Download className="size-3" />
                        Download Bundle
                      </Button>
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

