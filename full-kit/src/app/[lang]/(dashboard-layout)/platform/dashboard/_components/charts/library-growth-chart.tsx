"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
  totalLibraries: {
    label: "Total Registered",
    color: "hsl(var(--chart-1))",
  },
  activeLibraries: {
    label: "Active Running",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface LibraryGrowthChartProps {
  data: Array<{ month: string; totalLibraries: number; activeLibraries: number }>
}

export function LibraryGrowthChart({ data }: LibraryGrowthChartProps) {
  const isRtl = useIsRtl()

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-bold">Library Growth Trajectory</CardTitle>
          <p className="text-xs text-muted-foreground">12-Month Total vs Active libraries onboarded</p>
        </div>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          +238% YoY
        </span>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
          <AreaChart data={data} accessibilityLayer margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} reversed={isRtl} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} orientation={isRtl ? "right" : "left"} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="totalLibraries"
              type="monotone"
              fill="url(#fillTotal)"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
            />
            <Area
              dataKey="activeLibraries"
              type="monotone"
              fill="url(#fillActive)"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

