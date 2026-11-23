"use client"

import { useParams } from "next/navigation"

import Link from "next/link"
import { useState } from "react"
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Copy,
  Database,
  Download,
  FileArchive,
  HardDrive,
  Lock,
  RefreshCw,
  Save,
  Server,
  Shield,
  ShieldAlert,
  Trash2,
  Zap,
} from "lucide-react"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function DataBackupSettingsPage() {
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  const [isExporting, setIsExporting] = useState(false)
  const [exportComplete, setExportComplete] = useState(false)

  const [snapshots, setSnapshots] = useState([
    {
      id: "snap-01",
      filename: "backup-central-library-2026-11-03-0300.enc.zip",
      createdAt: "Today, 03:00 AM (Automated)",
      size: "18.4 MB",
      type: "Full System Snapshot",
      status: "Verified & Encrypted",
      destination: "Google Drive + AWS S3",
    },
    {
      id: "snap-02",
      filename: "backup-central-library-2026-11-02-0300.enc.zip",
      createdAt: "Yesterday, 03:00 AM (Automated)",
      size: "18.2 MB",
      type: "Full System Snapshot",
      status: "Verified & Encrypted",
      destination: "Google Drive + AWS S3",
    },
    {
      id: "snap-03",
      filename: "backup-central-library-2026-11-01-0300.enc.zip",
      createdAt: "01 Nov 2026, 03:00 AM (Automated)",
      size: "17.9 MB",
      type: "Full System Snapshot",
      status: "Verified & Encrypted",
      destination: "Google Drive + AWS S3",
    },
  ])

  // Auto-backup configuration
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true)
  const [retentionDays, setRetentionDays] = useState("30")
  const [cloudProvider, setCloudProvider] = useState("gdrive")

  const triggerManualBackup = () => {
    setIsExporting(true)
    setTimeout(() => {
      setIsExporting(false)
      setExportComplete(true)
      const newSnapshot = {
        id: `snap-${Date.now()}`,
        filename: `backup-manual-${new Date().toISOString().slice(0, 10)}.enc.zip`,
        createdAt: "Just now (Manual)",
        size: "18.5 MB",
        type: "Full System Snapshot",
        status: "Verified & Encrypted",
        destination: "Direct Download",
      }
      setSnapshots([newSnapshot, ...snapshots])
      setTimeout(() => setExportComplete(false), 3000)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={ensureLocalizedPathname("/pages/settings-library", lang)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Library Settings
            </Link>
            <ChevronRight className="size-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-primary">Data Backup &amp; Retention</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Data Backup, Export &amp; Privacy Retention
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure automated encrypted cloud backups, download complete PostgreSQL database dumps, and manage data retention policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {exportComplete && (
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="size-3.5 mr-1" />
              Backup Ready!
            </Badge>
          )}
          <Button
            size="sm"
            className="h-9 gap-1.5"
            onClick={triggerManualBackup}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                Compiling Archive...
              </>
            ) : (
              <>
                <Download className="size-4" />
                Download Instant Backup
              </>
            )}
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Last Backup Snapshot
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
              <CheckCircle2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Today, 03:00 AM</div>
            <div className="mt-1 text-xs text-muted-foreground">Automated daily snapshot healthy</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Cloud Storage Destination
            </CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
              <Cloud className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Dual Sync</div>
            <div className="mt-1 text-xs text-muted-foreground">Google Drive + Encrypted S3</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              Data Encryption
            </CardTitle>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Lock className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AES-256 GCM</div>
            <div className="mt-1 text-xs text-muted-foreground">Encrypted with your library master key</div>
          </CardContent>
        </Card>
      </div>

      {/* Cloud Schedule Settings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Cloud className="size-4 text-primary" />
              Automated Cloud Schedule
            </CardTitle>
            <CardDescription>
              Sync database snapshots automatically to your offsite cloud accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/20">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold">Enable Daily Auto-Backup</span>
                <p className="text-[11px] text-muted-foreground">
                  Triggers every morning at 03:00 AM IST during non-operational hours
                </p>
              </div>
              <Switch
                checked={autoBackupEnabled}
                onCheckedChange={setAutoBackupEnabled}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Storage Target</Label>
                <Select value={cloudProvider} onValueChange={setCloudProvider}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gdrive">Google Drive (Connected)</SelectItem>
                    <SelectItem value="s3">Amazon AWS S3 Bucket</SelectItem>
                    <SelectItem value="dropbox">Dropbox Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Retention Window (Days)</Label>
                <Input
                  type="number"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground border border-border/40">
              Snapshots older than {retentionDays} days are automatically culled from cloud storage to optimize quota.
            </div>
          </CardContent>
        </Card>

        {/* Data Privacy & GDPR */}
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="size-4 text-emerald-600" />
              Student Data Privacy &amp; GDPR Retention
            </CardTitle>
            <CardDescription>
              Compliance policies for student personally identifiable information (PII)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/20">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold">Mask Student Phone Numbers in Exports</span>
                <p className="text-[11px] text-muted-foreground">
                  Prevents front desk staff from downloading full unmasked contact lists
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-muted/20">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold">Right to Erasure / Account Anonymization</span>
                <p className="text-[11px] text-muted-foreground">
                  Anonymizes name and Aadhaar details when a student membership is cancelled &gt; 1 year
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="rounded-lg bg-emerald-500/10 p-3 border border-emerald-500/20 text-xs text-muted-foreground">
              <span className="font-semibold text-emerald-600">Statutory Audit Exemption:</span> Financial fee receipts and cash day-books are retained for 7 years as required by Indian accounting standards, even after student profile anonymization.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Snapshot History Table */}
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Backup Archives</CardTitle>
          <CardDescription>
            Download point-in-time snapshots for offline archival or server migration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs">Archive Filename</TableHead>
                  <TableHead className="text-xs">Generated Timestamp</TableHead>
                  <TableHead className="text-xs">File Size</TableHead>
                  <TableHead className="text-xs">Backup Type</TableHead>
                  <TableHead className="text-xs">Cloud Target</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshots.map((snap) => (
                  <TableRow key={snap.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <FileArchive className="size-4 text-primary shrink-0" />
                        <span className="truncate max-w-[220px]">{snap.filename}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {snap.createdAt}
                    </TableCell>

                    <TableCell className="text-xs font-mono">
                      {snap.size}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {snap.type}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {snap.destination}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px]">
                        <CheckCircle2 className="size-3 mr-1" />
                        {snap.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <Download className="size-3" />
                        Download
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

