"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import type { ChartConfig } from "@/components/ui/chart"

import { formatCurrency } from "@/lib/utils"

import { useIsRtl } from "@/hooks/use-is-rtl"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  thisMonth: {
    label: "This Month",
    color: "hsl(var(--chart-1))",
  },
  lastMonth: {
    label: "Last Month",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function MonthlyRevenueChart({
  data,
}: {
  data: Array<{ day: string; thisMonth: number; lastMonth: number }>
}) {
  const isRtl = useIsRtl()

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full min-w-0">
      <LineChart
        accessibilityLayer
        data={data}
        margin={{
          top: 12,
          left: 12,
          right: 12,
          bottom: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          reversed={isRtl}
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={(value) => `$${Number(value) / 1000}k`}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex items-center gap-x-2">
                  <span className="text-muted-foreground">
                    {name === "thisMonth" ? "This Month" : "Last Month"}:
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="thisMonth"
          type="monotone"
          stroke="var(--color-thisMonth)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--color-thisMonth)" }}
          activeDot={{ r: 5 }}
        />
        <Line
          dataKey="lastMonth"
          type="monotone"
          stroke="var(--color-lastMonth)"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={{ r: 2.5, fill: "var(--color-lastMonth)" }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
