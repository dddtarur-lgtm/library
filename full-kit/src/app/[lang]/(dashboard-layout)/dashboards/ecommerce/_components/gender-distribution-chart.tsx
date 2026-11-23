"use client"

import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts"

import type { GenderDistributionItem } from "../_data/gender-distribution"

import { useRadius } from "@/hooks/use-radius"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  Boys: {
    label: "Boys",
    color: "hsl(var(--chart-1))",
  },
  Girls: {
    label: "Girls",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function GenderDistributionChart({
  data,
}: {
  data: GenderDistributionItem[]
}) {
  const radius = useRadius()

  return (
    <div className="flex h-full w-full items-center justify-around gap-2 px-1">
      <ChartContainer
        config={chartConfig}
        className="aspect-square h-20 max-w-[85px] shrink-0"
      >
        <RadialBarChart
          data={data}
          innerRadius="30%"
          outerRadius="100%"
          barSize={7}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <RadialBar
            dataKey="value"
            background={{ fill: "hsl(var(--muted) / 0.5)" }}
            cornerRadius={radius}
          />
        </RadialBarChart>
      </ChartContainer>

      <div className="flex flex-col justify-center gap-y-1.5 text-xs">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-x-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.fill }}
              aria-hidden
            />
            <div>
              <p className="font-semibold text-foreground text-xs leading-none">
                {item.name}
              </p>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                {item.percentage}% ({item.count})
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
