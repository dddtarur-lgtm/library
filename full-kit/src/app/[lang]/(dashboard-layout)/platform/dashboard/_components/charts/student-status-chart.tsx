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
  Live: { label: "Live (Active)", color: "hsl(var(--chart-2))" },
  Pending: { label: "Pending Approval", color: "hsl(var(--chart-3))" },
  Expired: { label: "Expired Plan", color: "hsl(var(--chart-5))" },
  Suspended: { label: "Suspended", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

interface StudentStatusChartProps {
  data: Array<{ status: string; count: number; percentage: number; color: string }>
}

export function StudentStatusChart({ data }: StudentStatusChartProps) {
  const total = data.reduce((acc, curr) => acc + curr.count, 0)

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold">Platform Student Statuses</CardTitle>
          <span className="text-xs font-semibold text-muted-foreground">{total.toLocaleString("en-IN")} Total</span>
        </div>
        <p className="text-xs text-muted-foreground">Live students are strictly locked to 1 library</p>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col items-center">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-44">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
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
            <div key={item.status} className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 truncate">
                <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="font-medium text-foreground truncate">{item.status}</span>
              </div>
              <span className="font-bold text-muted-foreground">
                {item.count.toLocaleString("en-IN")} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

