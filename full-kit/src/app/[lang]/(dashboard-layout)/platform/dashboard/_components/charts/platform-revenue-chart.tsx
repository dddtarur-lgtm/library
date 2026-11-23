"use client"

import { Bar, BarChart, CartesianGrid, Line, XAxis, YAxis } from "recharts"

import type { ChartConfig } from "@/components/ui/chart"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useIsRtl } from "@/hooks/use-is-rtl"

const chartConfig = {
  revenue: {
    label: "Actual Revenue (₹)",
    color: "hsl(var(--chart-2))",
  },
  target: {
    label: "Platform Target (₹)",
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

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-bold">Platform Revenue (INR ₹)</CardTitle>
          <p className="text-xs text-muted-foreground">Monthly subscription fees collected from libraries</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-black text-foreground">₹4.82 Lakhs</span>
          <span className="block text-[10px] text-muted-foreground">This month</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
          <BarChart data={data} accessibilityLayer margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} reversed={isRtl} />
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
            <Bar dataKey="revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="target"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

