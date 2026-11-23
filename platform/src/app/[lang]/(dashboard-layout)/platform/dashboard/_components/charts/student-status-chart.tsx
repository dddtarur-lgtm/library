"use client"

import { Cell, Label, Pie, PieChart } from "recharts"
import { Users } from "lucide-react"

import type { ChartConfig } from "@/components/ui/chart"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  Live: { label: "Live", color: "#10b981" },
  Pending: { label: "Pending", color: "#f59e0b" },
  Expired: { label: "Expired", color: "#ef4444" },
  Suspended: { label: "Suspended", color: "#8b5cf6" },
} satisfies ChartConfig

const STUDENT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#10b981",
  LIVE: "#10b981",
  PENDING: "#f59e0b",
  TRIAL: "#3b82f6",
  EXPIRED: "#ef4444",
  SUSPENDED: "#8b5cf6",
  INACTIVE: "#64748b",
}

const FALLBACK_STUDENT_PALETTE = [
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#3b82f6",
  "#06b6d4",
]

function resolveStudentColor(
  status: string,
  color: string | undefined,
  index: number
): string {
  const s = (status || "").trim().toUpperCase()
  if (STUDENT_STATUS_COLORS[s]) return STUDENT_STATUS_COLORS[s]
  if (
    color &&
    !color.includes("--chart-1") &&
    (color.startsWith("#") || color.startsWith("hsl"))
  ) {
    return color
  }
  return FALLBACK_STUDENT_PALETTE[index % FALLBACK_STUDENT_PALETTE.length]
}

interface StudentStatusChartProps {
  data: Array<{
    status: string
    count: number
    percentage: number
    color: string
  }>
}

export function StudentStatusChart({ data }: StudentStatusChartProps) {
  const safeData = (Array.isArray(data) ? data : []).map((item, index) => ({
    ...item,
    color: resolveStudentColor(item?.status, item?.color, index),
  }))
  const total = safeData.reduce(
    (acc, curr) => acc + Number(curr?.count || 0),
    0
  )

  return (
    <Card className="h-full flex flex-col justify-between rounded-xl border border-border/70 bg-card/90 shadow-xs overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-5 py-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 ring-1 ring-inset ring-violet-500/20">
            <Users className="size-4" />
          </div>
          <CardTitle className="text-sm font-bold tracking-tight">
            Student Status
          </CardTitle>
        </div>
        <span className="text-xs font-bold text-muted-foreground tabular-nums">
          {(total / 1000).toFixed(1)}k Total
        </span>
      </CardHeader>

      <CardContent className="p-5 pt-3 flex-1 flex flex-col justify-between items-center gap-3">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-44"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={safeData}
              dataKey="count"
              nameKey="status"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={4}
              strokeWidth={0}
            >
              {safeData.map((entry, index) => (
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
                          y={viewBox.cy}
                          className="fill-foreground text-xl font-black tabular-nums"
                        >
                          {total.toLocaleString("en-IN")}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 18}
                          className="fill-muted-foreground text-[11px] font-semibold"
                        >
                          Students
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full pt-3 border-t border-border/40 text-xs">
          {safeData.map((item) => (
            <div
              key={item.status}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-foreground truncate">
                  {item.status}
                </span>
              </div>
              <span className="font-bold text-muted-foreground tabular-nums">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
