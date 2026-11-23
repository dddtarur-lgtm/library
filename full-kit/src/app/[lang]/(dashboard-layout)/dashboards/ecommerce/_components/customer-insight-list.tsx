"use client"

import {
  Ban,
  CalendarX2,
  Clock,
  UserCheck,
  Users,
} from "lucide-react"

import type { CustomerInsightsType } from "../types"

import { CustomerInsightItem } from "./customer-insight-item"

export function CustomerInsightList({ data }: { data: CustomerInsightsType }) {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 items-center w-full">
      <CustomerInsightItem
        title="Total"
        value={data.total}
        icon={Users}
        color="hsl(var(--chart-1))"
      />
      <CustomerInsightItem
        title="Live"
        value={data.live}
        icon={UserCheck}
        color="hsl(var(--chart-2))"
      />
      <CustomerInsightItem
        title="Pending"
        value={data.pending}
        icon={Clock}
        color="hsl(var(--chart-3))"
      />
      <CustomerInsightItem
        title="Expired"
        value={data.expired}
        icon={CalendarX2}
        color="hsl(var(--chart-4))"
      />
      <CustomerInsightItem
        title="Suspended"
        value={data.suspended}
        icon={Ban}
        color="hsl(var(--destructive))"
      />
    </ul>
  )
}
