"use client"

import { Cell, Label, Pie, PieChart } from "recharts"
import { Layers } from "lucide-react"

import type { ChartConfig } from "@/components/ui/chart"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  Starter: { label: "Starter", color: "#0ea5e9" },
  Growth: { label: "Growth", color: "#8b5cf6" },
  Pro: { label: "Pro", color: "#ec4899" },
  Enterprise: { label: "Enterprise", color: "#f59e0b" },
} satisfies ChartConfig

const PLAN_TIER_COLORS: Record<string, string> = {
  starter: "#0ea5e9",
  growth: "#8b5cf6",
  pro: "#ec4899",
  enterprise: "#f59e0b",
}

const FALLBACK_PLAN_PALETTE = [
  "#0ea5e9",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
]

function resolvePlanColor(
  name: string,
  color: string | undefined,
  index: number
): string {
  const n = (name || "").toLowerCase()
  for (const [key, val] of Object.entries(PLAN_TIER_COLORS)) {
    if (n.includes(key)) return val
  }
  if (
    color &&
    !color.includes("--chart-1") &&
    (color.startsWith("#") || color.startsWith("hsl"))
  ) {
    return color
  }
  return FALLBACK_PLAN_PALETTE[index % FALLBACK_PLAN_PALETTE.length]
}

interface PlanDistributionChartProps {
  data: Array<{
    name: string
    count: number
    percentage: number
    color: string
  }>
}

export function PlanDistributionChart({ data }: PlanDistributionChartProps) {
  const safeData = (Array.isArray(data) ? data : []).map((item, index) => ({
    ...item,
    color: resolvePlanColor(item?.name, item?.color, index),
  }))
  const total = safeData.reduce(
    (acc, item) => acc + Number(item?.count || 0),
    0
  )

  return (
    <Card className="h-full flex flex-col justify-between rounded-xl border border-border/70 bg-card/90 shadow-xs overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-5 py-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500 ring-1 ring-inset ring-sky-500/20">
            <Layers className="size-4" />
          </div>
          <CardTitle className="text-sm font-bold tracking-tight">
            Plan Tiers
          </CardTitle>
        </div>
        <span className="text-xs font-bold text-muted-foreground tabular-nums">
          {total} Libs
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
              nameKey="name"
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
                          className="fill-foreground text-2xl font-black tabular-nums"
                        >
                          {total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 18}
                          className="fill-muted-foreground text-[11px] font-semibold"
                        >
                          Tenants
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
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-foreground truncate">
                  {item.name}
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
