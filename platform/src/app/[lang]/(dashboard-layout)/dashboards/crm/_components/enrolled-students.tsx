import { enrolledStudentsData } from "../_data/enrolled-students"

import { DashboardCard } from "@/components/dashboards/dashboard-card"
import { EnrolledStudentsChart } from "./enrolled-students-chart"

export function EnrolledStudents() {
  return (
    <DashboardCard
      title="Enrolled Students"
      period={`${enrolledStudentsData.total} total • breakdown by status`}
      size="lg"
      className="flex flex-col justify-between"
    >
      <div className="flex flex-col justify-between h-full space-y-4">
        <EnrolledStudentsChart />

        <div className="space-y-2.5 border-t border-border pt-4">
          {enrolledStudentsData.breakdown.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-x-2.5">
                <span
                  style={{ backgroundColor: item.color }}
                  className="size-2.5 rounded-full"
                  aria-hidden
                />
                <span className="font-medium text-muted-foreground">
                  {item.name}
                </span>
              </div>
              <span className="font-bold text-foreground tabular-nums">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  )
}
