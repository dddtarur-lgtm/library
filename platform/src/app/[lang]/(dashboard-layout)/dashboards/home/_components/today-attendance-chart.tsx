"use client"

import { Cell, Label, Pie, PieChart } from "recharts"

import type { ChartConfig } from "@/components/ui/chart"

import { todayAttendanceData } from "../_data/today-attendance"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  Girls: {
    label: "Girls",
    color: "hsl(var(--chart-1))",
  },
  Boys: {
    label: "Boys",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function TodayAttendanceChart() {
  const chartData = todayAttendanceData.breakdown.map((item) => ({
    name: item.name,
    value: item.present,
    fill: item.fill,
    percentage: item.percentage,
    total: item.total,
  }))

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-square max-h-[140px] w-full min-w-0"
    >
      <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name, item) => (
                <div className="flex items-center gap-x-2">
                  <span className="font-medium text-foreground">
                    {name}: {Number(value).toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({item.payload.percentage}%)
                  </span>
                </div>
              )}
            />
          }
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={44}
          outerRadius={60}
          strokeWidth={2}
          stroke="hsl(var(--card))"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) - 5}
                      className="fill-foreground text-sm font-bold"
                    >
                      {todayAttendanceData.totalPresent}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 11}
                      className="fill-muted-foreground text-[10px]"
                    >
                      / {todayAttendanceData.totalEnrolled}
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
