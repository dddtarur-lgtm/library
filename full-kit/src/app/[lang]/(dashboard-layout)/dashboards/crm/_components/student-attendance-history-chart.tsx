"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import type { ChartConfig } from "@/components/ui/chart"

import { useIsRtl } from "@/hooks/use-is-rtl"
import { useRadius } from "@/hooks/use-radius"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  girls: {
    label: "Girls Present",
    color: "hsl(var(--chart-1))",
  },
  boys: {
    label: "Boys Present",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function StudentAttendanceHistoryChart({
  data,
}: {
  data: Array<{
    date: string
    girls: number
    boys: number
    total: number
    rate: number
  }>
}) {
  const isRtl = useIsRtl()
  const radius = useRadius()

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full min-w-0">
      <BarChart
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
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          domain={[0, 1300]}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, name, item) => (
                <div className="flex items-center gap-x-2">
                  <span className="text-muted-foreground">
                    {name === "girls" ? "Girls" : "Boys"}:
                  </span>
                  <span className="font-semibold text-foreground">
                    {Number(value).toLocaleString()}
                  </span>
                  {name === "boys" && (
                    <span className="ms-auto text-xs text-muted-foreground">
                      Total: {item.payload.total} ({item.payload.rate}%)
                    </span>
                  )}
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="girls"
          stackId="attendance"
          fill="var(--color-girls)"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="boys"
          stackId="attendance"
          fill="var(--color-boys)"
          radius={[radius, radius, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}
