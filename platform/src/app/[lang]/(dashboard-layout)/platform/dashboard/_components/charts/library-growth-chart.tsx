"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { TrendingUp } from "lucide-react"

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
  totalLibraries: {
    label: "Total",
    color: "hsl(var(--chart-1))",
  },
  activeLibraries: {
    label: "Active",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface LibraryGrowthChartProps {
  data: Array<{
    month: string
    totalLibraries: number
    activeLibraries: number
  }>
}

export function LibraryGrowthChart({ data }: LibraryGrowthChartProps) {
  const isRtl = useIsRtl()
  const safeData = Array.isArray(data) ? data : []
  const latestItem = safeData[safeData.length - 1]
  const badgeLabel = latestItem
    ? `${latestItem.totalLibraries || 0} Total Libraries`
    : "Growth Overview"

  return (
    <Card className="h-full rounded-xl border border-border/70 bg-card/90 shadow-xs overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-5 py-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <TrendingUp className="size-4" />
          </div>
          <CardTitle className="text-sm font-bold tracking-tight">
            Library Growth
          </CardTitle>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/25">
          {badgeLabel}
        </span>
      </CardHeader>
      <CardContent className="p-5 pt-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-56 w-full"
        >
          <AreaChart
            data={safeData}
            accessibilityLayer
            margin={{ left: -12, right: 8, top: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--chart-1))"
                  stopOpacity={0.5}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--chart-1))"
                  stopOpacity={0.02}
                />
              </linearGradient>
              <linearGradient id="fillActive" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--chart-2))"
                  stopOpacity={0.55}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--chart-2))"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
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
              orientation={isRtl ? "right" : "left"}
            />
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
