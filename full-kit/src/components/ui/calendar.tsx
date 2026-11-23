"use client"

import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"

import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = ComponentProps<typeof DayPicker>

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
            classNames={{
        months: "relative",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 items-center h-7 relative",
        caption_label: "text-xs font-semibold flex items-center gap-1 cursor-pointer",
        dropdowns: "flex items-center justify-center gap-1.5",
        dropdown_root: "relative inline-flex items-center rounded-md border border-border bg-card px-2 py-0.5 text-xs font-semibold text-foreground hover:bg-muted/50 cursor-pointer shadow-2xs",
        dropdown: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20",
        nav: "flex items-center justify-between w-full absolute top-1 inset-x-0 px-1 pointer-events-none z-10",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-card p-0 opacity-70 hover:opacity-100 pointer-events-auto cursor-pointer"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-card p-0 opacity-70 hover:opacity-100 pointer-events-auto cursor-pointer"
        ),

        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "relative h-8 w-8 p-0 font-normal text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-e-md"
        ),
        day_button: "cursor-pointer h-full w-full aria-selected:opacity-100",
        range_start: "rounded-md!",
        range_end: "rounded-md!",
        selected: cn(
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          props.mode === "range" && "rounded-none"
        ),
        today: "bg-accent text-accent-foreground",
        outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
            components={{
        Chevron: (props) => {
          if (props.orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />
          }
          if (props.orientation === "right") {
            return <ChevronRight className="h-4 w-4" />
          }
          if (props.orientation === "up") {
            return <ChevronUp className="h-3.5 w-3.5" />
          }
          return <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        },
      }}
      {...props}
    />
  )
}
