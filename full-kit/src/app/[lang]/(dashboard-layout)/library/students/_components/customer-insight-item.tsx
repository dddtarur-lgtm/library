"use client"

import type { IconType } from "@/types"

import { Badge } from "@/components/ui/badge"

export function CustomerInsightItem({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  icon: IconType
  color: string
}) {
  return (
    <li className="flex items-center gap-x-3 min-w-0">
      <Badge
        style={{
          backgroundColor: color,
        }}
        className="size-11 shrink-0 aspect-square p-2.5 rounded-xl flex items-center justify-center text-white"
        aria-hidden
      >
        <Icon className="size-5 shrink-0" />
      </Badge>
      <div className="overflow-hidden min-w-0">
        <h4 className="text-xs font-medium text-muted-foreground leading-tight truncate">
          {title}
        </h4>
        <p className="text-xl font-bold tracking-tight text-foreground mt-0.5">
          {value.toLocaleString()}
        </p>
      </div>
    </li>
  )
}
