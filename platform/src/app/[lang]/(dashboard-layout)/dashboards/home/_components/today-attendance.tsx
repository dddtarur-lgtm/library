import { todayAttendanceData } from "../_data/today-attendance"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TodayAttendanceChart } from "./today-attendance-chart"

export function TodayAttendance() {
  return (
    <Card className="flex flex-col justify-between overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold truncate">Today&apos;s Attendance</CardTitle>
          <CardDescription className="text-xs truncate">
            {todayAttendanceData.totalPresent} of {todayAttendanceData.totalEnrolled} students present
          </CardDescription>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">
          {todayAttendanceData.percentage}%
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-1">
        <div className="flex justify-center w-full min-w-0">
          <TodayAttendanceChart />
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          {todayAttendanceData.breakdown.map((item) => (
            <div
              key={item.name}
              className="flex flex-col gap-y-0.5 rounded-md border border-border px-2.5 py-1.5 min-w-0"
            >
              <div className="flex items-center gap-x-1.5">
                <span
                  style={{ backgroundColor: item.fill }}
                  className="size-2 rounded-full shrink-0"
                  aria-hidden
                />
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {item.name}
                </span>
                <span className="ms-auto text-[11px] font-semibold text-foreground">
                  {item.percentage}%
                </span>
              </div>
              <p className="text-sm font-bold text-foreground">
                {item.present}{" "}
                <span className="text-[10px] font-normal text-muted-foreground">
                  / {item.total}
                </span>
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
