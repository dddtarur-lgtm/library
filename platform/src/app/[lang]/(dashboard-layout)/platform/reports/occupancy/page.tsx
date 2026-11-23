"use client"

import { useState } from "react"

import { LibraryAvatar } from "@/components/platform/library-logo"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ReportChartCard,
  ReportKpiGrid,
  ReportsHeader,
} from "../_components/reports-shell"

const OCCUPANCY_SERIES = [
  { shift: "Morning", occupancy: 88 },
  { shift: "Afternoon", occupancy: 92 },
  { shift: "Evening", occupancy: 81 },
  { shift: "Night", occupancy: 64 },
]

const TOP_LIBRARIES = [
  {
    name: "Apex Study Hub",
    code: "LIB-PUN-001",
    seats: 180,
    occupied: 169,
    pct: 94,
  },
  {
    name: "Kalam Study Arena",
    code: "LIB-AHM-005",
    seats: 320,
    occupied: 288,
    pct: 90,
  },
  {
    name: "Metro Library Network",
    code: "LIB-DEL-002",
    seats: 410,
    occupied: 344,
    pct: 84,
  },
]

export default function OccupancyReportPage() {
  const [range, setRange] = useState("30d")

  return (
    <section className="container space-y-5 py-5">
      <ReportsHeader
        title="Desk Occupancy"
        description="Track shift-wise seat utilization across all managed study halls."
        range={range}
        onRangeChange={setRange}
        csvFilename="desk-occupancy"
        csvRows={OCCUPANCY_SERIES}
      />

      <ReportKpiGrid
        items={[
          { label: "Network Occupancy", value: "84.6%", delta: "+4.2% vs last month" },
          { label: "Occupied Desks", value: "16,429", delta: "Out of 19,420 seats" },
          { label: "Peak Shift", value: "Afternoon", delta: "92% average fill" },
          { label: "Avg Daily Check-Ins", value: "21,840", delta: "QR + Biometric" },
        ]}
      />

      <ReportChartCard
        title="Occupancy by Shift (%)"
        description="Average desk utilization across daily study shifts"
        data={OCCUPANCY_SERIES}
        xKey="shift"
        yKey="occupancy"
        yLabel="Occupancy (%)"
        type="bar"
      />

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle className="text-base">Top Utilized Libraries</CardTitle>
          <CardDescription>
            Libraries operating above 80% desk capacity
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Library</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead className="w-56">Utilization</TableHead>
                <TableHead className="pr-4 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TOP_LIBRARIES.map((lib) => (
                <TableRow key={lib.code}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2.5">
                      <LibraryAvatar name={lib.name} code={lib.code} size="sm" />
                      <span className="text-sm font-medium">{lib.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">
                    {lib.occupied} / {lib.seats}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={lib.pct} className="h-1.5" />
                      <span className="text-xs font-semibold tabular-nums">
                        {lib.pct}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    >
                      Optimal
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}
