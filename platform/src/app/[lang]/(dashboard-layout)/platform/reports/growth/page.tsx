"use client"

import { useState } from "react"

import { initialLibraryGrowthData } from "@/data/platform/platform-data"

import { LibraryAvatar } from "@/components/platform/library-logo"
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
import {
  ReportChartCard,
  ReportKpiGrid,
  ReportsHeader,
} from "../_components/reports-shell"

const RECENT_ONBOARDINGS = [
  {
    name: "Apex Study Hub",
    code: "LIB-PUN-001",
    city: "Pune",
    plan: "Pro Tier",
    seats: 180,
    date: "11 Nov 2026",
  },
  {
    name: "Kalam Study Arena",
    code: "LIB-AHM-005",
    city: "Ahmedabad",
    plan: "Enterprise",
    seats: 320,
    date: "08 Nov 2026",
  },
  {
    name: "Scholars Point",
    code: "LIB-JAI-004",
    city: "Jaipur",
    plan: "Starter",
    seats: 90,
    date: "04 Nov 2026",
  },
]

export default function GrowthReportPage() {
  const [range, setRange] = useState("30d")

  return (
    <section className="container space-y-5 py-5">
      <ReportsHeader
        title="Network Growth"
        description="Track new library signups, trial-to-paid conversions, and city expansion."
        range={range}
        onRangeChange={setRange}
        csvFilename="network-growth"
        csvRows={initialLibraryGrowthData}
      />

      <ReportKpiGrid
        items={[
          { label: "Total Libraries", value: "142", delta: "+14 this month" },
          { label: "Trial Conversion", value: "68.5%", delta: "+5.1% vs 30d" },
          { label: "Active Cities", value: "28", delta: "+3 new Tier-2 cities" },
          { label: "Total Managed Seats", value: "19,420", delta: "+1,640 seats" },
        ]}
      />

      <ReportChartCard
        title="Library Growth Trajectory"
        description="Net active libraries over time"
        data={initialLibraryGrowthData}
        xKey="month"
        yKey="total"
        yLabel="Libraries"
        type="area"
      />

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle className="text-base">Recent Tenant Activations</CardTitle>
          <CardDescription>
            Latest libraries converted to active paid subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Library</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead className="pr-4 text-right">Activated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RECENT_ONBOARDINGS.map((row) => (
                <TableRow key={row.code}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2.5">
                      <LibraryAvatar name={row.name} code={row.code} size="sm" />
                      <span className="text-sm font-medium text-foreground">
                        {row.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.city}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.plan}</Badge>
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">
                    {row.seats}
                  </TableCell>
                  <TableCell className="pr-4 text-right text-xs text-muted-foreground">
                    {row.date}
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
