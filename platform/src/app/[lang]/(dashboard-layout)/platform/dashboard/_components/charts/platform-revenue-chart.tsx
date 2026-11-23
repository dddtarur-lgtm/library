"use client"

import { Bar, BarChart, CartesianGrid, Line, XAxis, YAxis } from "recharts"
import { IndianRupee } from "lucide-react"

import type { ChartConfig } from "@/components/ui/chart"

import { useIsRtl } from "@/hooks/use-is-rtl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-2))",
  },
  target: {
    label: "Target",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

interface PlatformRevenueChartProps {
  data: Array<{ month: string; revenue: number; target: number }>
}

function formatLakhs(value: number) {
  return `₹${(value / 100000).toFixed(1)}L`
}

export function PlatformRevenueChart({ data }: PlatformRevenueChartProps) {
  const isRtl = useIsRtl()
  const safeData = Array.isArray(data) ? data : []
  const totalRev = safeData.reduce(
    (acc, curr) => acc + (Number(curr.revenue) || 0),
    0
  )
  const formattedRev =
    totalRev >= 100000
      ? `₹${(totalRev / 100000).toFixed(2)}L`
      : totalRev > 0
        ? `₹${totalRev.toLocaleString("en-IN")}`
        : "₹0"

  return (
    <Card className="h-full rounded-xl border border-border/70 bg-card/90 shadow-xs overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-5 py-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20">
            <IndianRupee className="size-4" />
          </div>
          <CardTitle className="text-sm font-bold tracking-tight">
            Revenue & Target
          </CardTitle>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary ring-1 ring-inset ring-primary/25 tabular-nums">
          {formattedRev}
        </span>
      </CardHeader>
      <CardContent className="p-5 pt-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-56 w-full"
        >
          <BarChart
            data={safeData}
            accessibilityLayer
            margin={{ left: -12, right: 8, top: 8, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              opacity={0.2}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              reversed={isRtl}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatLakhs}
              orientation={isRtl ? "right" : "left"}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 0,
                    }).format(Number(value))
                  }
                />
              }
            />
            <Bar
              dataKey="revenue"
              fill="hsl(var(--chart-2))"
              radius={[6, 6, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ r: 2.5 }}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
