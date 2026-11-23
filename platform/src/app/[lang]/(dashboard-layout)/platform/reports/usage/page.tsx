"use client"

import { useState } from "react"

import {
  ReportChartCard,
  ReportKpiGrid,
  ReportsHeader,
} from "../_components/reports-shell"

const TELEMETRY_SERIES = [
  { day: "Mon", checkins: 19400 },
  { day: "Tue", checkins: 21200 },
  { day: "Wed", checkins: 22100 },
  { day: "Thu", checkins: 21800 },
  { day: "Fri", checkins: 22600 },
  { day: "Sat", checkins: 24100 },
  { day: "Sun", checkins: 18900 },
]

export default function UsageTelemetryReportPage() {
  const [range, setRange] = useState("7d")

  return (
    <section className="container space-y-5 py-5">
      <ReportsHeader
        title="App Telemetry"
        description="Monitor daily QR/biometric check-ins, API latency, and mobile client adoption."
        range={range}
        onRangeChange={setRange}
        csvFilename="app-telemetry"
        csvRows={TELEMETRY_SERIES}
      />

      <ReportKpiGrid
        items={[
          { label: "Daily Active Students", value: "21,840", delta: "+9.4% WoW" },
          { label: "Median API Latency", value: "42 ms", delta: "99.98% uptime" },
          { label: "WhatsApp Alerts Sent", value: "8,420", delta: "99.1% delivered" },
          { label: "App v2.4 Adoption", value: "86.3%", delta: "+12% this week" },
        ]}
      />

      <ReportChartCard
        title="Daily Check-In Events"
        description="Combined QR & biometric gate punches per day"
        data={TELEMETRY_SERIES}
        xKey="day"
        yKey="checkins"
        yLabel="Check-Ins"
        type="area"
      />
    </section>
  )
}
