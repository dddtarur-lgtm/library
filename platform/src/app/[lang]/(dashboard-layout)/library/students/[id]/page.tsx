import Link from "next/link"
import {
  Armchair,
  BookOpen,
  Calendar,
  ChevronLeft,
  CreditCard,
  History,
  TrendingUp,
} from "lucide-react"

import type { LocaleType } from "@/types"
import type { Metadata } from "next"

import { getStudentById } from "@/data/students-data"
import { ensureLocalizedPathname } from "@/lib/i18n"

import { buttonVariants } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { StudentProfileAnalytics } from "./_components/student-profile-analytics"
import { StudentProfileAttendance } from "./_components/student-profile-attendance"
import { StudentProfileBooks } from "./_components/student-profile-books"
import { StudentProfileHeader } from "./_components/student-profile-header"
import { StudentProfileInfo } from "./_components/student-profile-info"
import { StudentProfilePayments } from "./_components/student-profile-payments"
import { StudentProfileSeats } from "./_components/student-profile-seats"

export const metadata: Metadata = {
  title: "Student Profile",
}

export default async function StudentProfilePage(props: {
  params: Promise<{ lang: LocaleType; id: string }>
}) {
  const { lang, id } = await props.params
  const student = getStudentById(id)

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden space-y-3 p-3 sm:p-4">
      {/* Top Breadcrumb / Back Navigation */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href={ensureLocalizedPathname("/dashboards/students", lang)}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0",
          })}
        >
          <ChevronLeft className="size-4" />
          <span>Back to Students Directory</span>
        </Link>
        <span className="text-xs font-mono text-muted-foreground truncate">
          Student ID: <span className="font-bold text-foreground">{student.studentId}</span>
        </span>
      </div>

      {/* Profile Header (Cover banner, Avatar, Quick Actions, Highlights) */}
      <StudentProfileHeader student={student} locale={lang} />

      {/* Main Content: Left Info Column + Right Tabs */}
      <div className="flex flex-col lg:flex-row gap-4 pt-1 min-w-0 w-full items-start">
        {/* Left Column: Personal, Academic & Membership Details */}
        <StudentProfileInfo student={student} />

        {/* Right Column: Tabs for Analytics, Attendance, Payments, Books, Seats */}
        <div className="flex-1 min-w-0 w-full overflow-hidden">
          <Tabs defaultValue="analytics" className="w-full min-w-0">
            {/* Tabs List — Full-width responsive grid without horizontal scrollbar */}
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 w-full h-auto p-1 bg-muted/80 border border-border/80 rounded-xl mb-3 gap-1">
              <TabsTrigger
                value="analytics"
                className="gap-1.5 text-xs font-semibold py-1.5 px-2.5 truncate data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg"
              >
                <TrendingUp className="size-3.5 text-primary shrink-0" />
                <span className="truncate">Analytics & Stats</span>
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="gap-1.5 text-xs font-semibold py-1.5 px-2.5 truncate data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg"
              >
                <Calendar className="size-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">Attendance History</span>
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="gap-1.5 text-xs font-semibold py-1.5 px-2.5 truncate data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg"
              >
                <CreditCard className="size-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Payments & Invoices</span>
              </TabsTrigger>
              <TabsTrigger
                value="books"
                className="gap-1.5 text-xs font-semibold py-1.5 px-2.5 truncate data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg"
              >
                <BookOpen className="size-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">Book Lending</span>
              </TabsTrigger>
              <TabsTrigger
                value="seats"
                className="col-span-2 sm:col-span-1 gap-1.5 text-xs font-semibold py-1.5 px-2.5 truncate data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg"
              >
                <Armchair className="size-3.5 text-blue-500 shrink-0" />
                <span className="truncate">Seat & Plan History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics">
              <StudentProfileAnalytics student={student} />
            </TabsContent>

            <TabsContent value="attendance">
              <StudentProfileAttendance student={student} />
            </TabsContent>

            <TabsContent value="payments">
              <StudentProfilePayments student={student} />
            </TabsContent>

            <TabsContent value="books">
              <StudentProfileBooks student={student} />
            </TabsContent>

            <TabsContent value="seats">
              <StudentProfileSeats student={student} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
