import type { Metadata } from "next"

import { ActivityTimeline } from "./_components/activity-timeline"
import { CustomerSatisfaction } from "./_components/customer-satisfaction"
import { EnrolledStudents } from "./_components/enrolled-students"
import { Overview } from "./_components/overview"
import { QuickInformation } from "./_components/quick-information"
import { SalesTrend } from "./_components/sales-trend"
import { TodayAttendance } from "./_components/today-attendance"
import { TopActions } from "./_components/top-actions"

// Define metadata for the page
// More info: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
export const metadata: Metadata = {
  title: "Home",
}

export default function HomePage() {
  return (
    <section className="container grid gap-4 p-4 md:grid-cols-2">
      <TopActions />
      <Overview />
      <div className="col-span-full grid gap-4 md:grid-cols-3">
        <div className="min-w-0 md:col-span-2">
          <SalesTrend />
        </div>
        <div className="min-w-0 md:col-span-1 flex flex-col gap-4">
          <QuickInformation />
          <TodayAttendance />
        </div>
      </div>
      <EnrolledStudents />
      <ActivityTimeline />
      <CustomerSatisfaction />
    </section>
  )
}
