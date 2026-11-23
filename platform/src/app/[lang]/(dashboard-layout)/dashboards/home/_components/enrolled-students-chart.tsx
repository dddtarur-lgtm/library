"use client"

import { Cell, Label, Pie, PieChart } from "recharts"

import type { ChartConfig } from "@/components/ui/chart"

import { enrolledStudentsData } from "../_data/enrolled-students"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  Studying: {
    label: "Studying",
    color: "hsl(158, 85%, 44%)",
  },
  Waiting: {
    label: "Waiting",
    color: "hsl(38, 92%, 50%)",
  },
  "Plan ended": {
    label: "Plan ended",
    color: "hsl(25, 95%, 53%)",
  },
  Stopped: {
    label: "Stopped",
    color: "hsl(0, 84%, 60%)",
  },
} satisfies ChartConfig

export function EnrolledStudentsChart() {
  const chartData = enrolledStudentsData.breakdown

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[220px] w-full min-w-0"
    >
      <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name) => (
                <div className="flex items-center gap-x-2">
                  <span className="font-medium text-foreground">{name}:</span>
                  <span className="font-semibold text-foreground">
                    {Number(value).toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round((Number(value) / enrolledStudentsData.total) * 100)}%)
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
          innerRadius={64}
          outerRadius={92}
          stroke="hsl(var(--card))"
          strokeWidth={3}
          startAngle={90}
          endAngle={-270}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
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
                      y={(viewBox.cy || 0) - 6}
                      className="fill-foreground text-3xl font-extrabold tracking-tight"
                    >
                      {enrolledStudentsData.studyingCount}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 18}
                      className="fill-[hsl(158,85%,44%)] text-xs font-bold tracking-widest"
                    >
                      STUDYING
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
