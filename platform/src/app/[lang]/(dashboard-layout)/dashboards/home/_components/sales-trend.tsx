"use client"

import {
  monthlyRevenueComparisonData,
  studentAttendanceHistoryData,
} from "../_data/sales-trend"

import { formatCurrency } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MonthlyRevenueChart } from "./monthly-revenue-chart"
import { StudentAttendanceHistoryChart } from "./student-attendance-history-chart"

export function SalesTrend() {
  const { summary: revSummary, chart: revChart } = monthlyRevenueComparisonData
  const { summary: attSummary, chart: attChart } = studentAttendanceHistoryData

  return (
    <Card className="h-full flex flex-col justify-between overflow-hidden">
      <Tabs defaultValue="revenue" className="gap-0 w-full min-w-0">
        <CardHeader className="flex flex-col gap-y-3 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle>Trends &amp; History</CardTitle>
            <CardDescription>
              Monthly revenue comparison &amp; student attendance tracking
            </CardDescription>
          </div>
          <TabsList className="grid grid-cols-2 sm:w-auto">
            <TabsTrigger value="revenue">Monthly Revenue</TabsTrigger>
            <TabsTrigger value="attendance">Attendance History</TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent className="space-y-4 pt-0 w-full min-w-0">
          <TabsContent value="revenue" className="mt-0 space-y-4 w-full min-w-0">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border p-3">
              <div>
                <p className="text-xs text-muted-foreground">This Month</p>
                <div className="flex items-center gap-x-2">
                  <span className="text-xl font-bold text-foreground">
                    {formatCurrency(revSummary.thisMonth)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    +{revSummary.percentageChange}%
                  </Badge>
                </div>
              </div>
              <div className="border-s border-border ps-6">
                <p className="text-xs text-muted-foreground">Last Month</p>
                <span className="text-xl font-semibold text-muted-foreground">
                  {formatCurrency(revSummary.lastMonth)}
                </span>
              </div>
            </div>

            <div className="w-full min-w-0 overflow-hidden">
              <MonthlyRevenueChart data={revChart} />
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="mt-0 space-y-4 w-full min-w-0">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border p-3">
              <div>
                <p className="text-xs text-muted-foreground">Average Attendance</p>
                <span className="text-xl font-bold text-foreground">
                  {attSummary.averageRate}%
                </span>
              </div>
              <div className="border-s border-border ps-6">
                <p className="text-xs text-muted-foreground">Best Day</p>
                <span className="text-xl font-semibold text-foreground">
                  {attSummary.highestRate}%{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({attSummary.highestDate})
                  </span>
                </span>
              </div>
              <div className="border-s border-border ps-6">
                <p className="text-xs text-muted-foreground">Total Enrolled</p>
                <span className="text-xl font-semibold text-foreground">
                  {attSummary.totalEnrolled.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="w-full min-w-0 overflow-hidden">
              <StudentAttendanceHistoryChart data={attChart} />
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}
