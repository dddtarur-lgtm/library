"use client"

import { Cell, Pie, PieChart } from "recharts"

import type { ChartConfig } from "@/components/ui/chart"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  Starter: { label: "Starter", color: "hsl(var(--chart-1))" },
  Growth: { label: "Growth", color: "hsl(var(--chart-2))" },
  Pro: { label: "Pro", color: "hsl(var(--chart-3))" },
  Enterprise: { label: "Enterprise", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig

interface PlanDistributionChartProps {
  data: Array<{ name: string; count: number; percentage: number; color: string }>
}

export function PlanDistributionChart({ data }: PlanDistributionChartProps) {
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">Plan Tier Distribution</CardTitle>
        <p className="text-xs text-muted-foreground">Libraries by active subscription plan</p>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col items-center">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-44">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={4}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="grid grid-cols-2 gap-2 w-full pt-2 border-t border-border/50 text-xs">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 truncate">
                <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="font-medium text-foreground truncate">{item.name}</span>
              </div>
              <span className="font-bold text-muted-foreground">{item.count} ({item.percentage}%)</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

