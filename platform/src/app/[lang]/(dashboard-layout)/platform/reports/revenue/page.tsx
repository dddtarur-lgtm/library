"use client"

import { useState } from "react"

import { initialPlatformRevenueData } from "@/data/platform/platform-data"

import {
  ReportChartCard,
  ReportKpiGrid,
  ReportsHeader,
} from "../_components/reports-shell"

export default function RevenueReportPage() {
  const [range, setRange] = useState("30d")

  return (
    <section className="container space-y-5 py-5">
      <ReportsHeader
        title="Revenue & MRR"
        description="Analyze recurring subscription revenue, ARPU, GST collections, and expansion MRR."
        range={range}
        onRangeChange={setRange}
        csvFilename="revenue-mrr"
        csvRows={initialPlatformRevenueData}
      />

      <ReportKpiGrid
        items={[
          { label: "Current MRR", value: "₹4,86,400", delta: "+18.4% MoM" },
          { label: "Annualized Run Rate", value: "₹58.3L", delta: "+22.1% YoY" },
          { label: "ARPU (Per Library)", value: "₹3,425", delta: "+₹210 vs Q3" },
          { label: "Invoice Collection Rate", value: "98.2%", delta: "Auto-debit enabled" },
        ]}
      />

      <ReportChartCard
        title="Monthly Recurring Revenue"
        description="Gross SaaS collections across Starter, Pro, and Enterprise plans"
        data={initialPlatformRevenueData}
        xKey="month"
        yKey="revenue"
        yLabel="MRR (₹)"
        type="bar"
      />
    </section>
  )
}
