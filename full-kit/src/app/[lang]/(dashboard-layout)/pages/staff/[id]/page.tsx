import Link from "next/link"
import type { Metadata } from "next"
import {
  ChevronLeft,
  History,
  Receipt,
  ShieldCheck,
} from "lucide-react"

import type { LocaleType } from "@/types"
import { getStaffMemberById } from "@/data/library-management-data"
import { ensureLocalizedPathname } from "@/lib/i18n"
import { buttonVariants } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import { StaffProfileHeader } from "./_components/staff-profile-header"
import { StaffProfileInfo } from "./_components/staff-profile-info"
import { StaffProfilePermissions } from "./_components/staff-profile-permissions"
import { StaffProfileCollections } from "./_components/staff-profile-collections"
import { StaffProfileSessions } from "./_components/staff-profile-sessions"

export const metadata: Metadata = {
  title: "Staff Profile & Permissions",
}

export default async function StaffProfilePage(props: {
  params: Promise<{ lang: LocaleType; id: string }>
}) {
  const { lang, id } = await props.params
  const staff = getStaffMemberById(id)

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden space-y-3.5 p-3 sm:p-4">
      {/* Top Breadcrumb / Back Navigation */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href={ensureLocalizedPathname("/pages/staff", lang)}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0 cursor-pointer",
          })}
        >
          <ChevronLeft className="size-4" />
          <span>Back to Staff Directory</span>
        </Link>
        <span className="text-xs font-mono text-muted-foreground truncate">
          Staff ID: <span className="font-bold text-foreground">{staff.id.toUpperCase()}</span>
        </span>
      </div>

      {/* Profile Header (Avatar, Quick Actions, Role Badges, Highlights) */}
      <StaffProfileHeader staff={staff} locale={lang} />

      {/* Main Content: Left Info Column + Right Tabs */}
      <div className="flex flex-col lg:flex-row gap-4 pt-1 min-w-0 w-full items-start">
        {/* Left Column: Personal & Credentials Information */}
        <StaffProfileInfo staff={staff} />

        {/* Right Column: Unified Tabs for Permissions, Collections (if permitted), and Activity Timeline */}
        <div className="flex-1 min-w-0 w-full overflow-hidden">
          <Tabs defaultValue="permissions" className="w-full min-w-0">
            {/* Tabs List — dynamically adapts if collections is permitted */}
            <TabsList
              className={`grid ${
                staff.canViewRevenue ? "grid-cols-3" : "grid-cols-2"
              } w-full h-auto p-1 bg-muted/80 border border-border rounded-lg mb-3 gap-1`}
            >
              <TabsTrigger
                value="permissions"
                className="gap-1.5 text-xs font-semibold py-1.5 px-2.5 truncate data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg cursor-pointer"
              >
                <ShieldCheck className="size-3.5 text-primary shrink-0" />
                <span className="truncate">Permission Assignment</span>
              </TabsTrigger>

              {/* Only show Desk Collections tab if staff has financial view permission */}
              {staff.canViewRevenue && (
                <TabsTrigger
                  value="collections"
                  className="gap-1.5 text-xs font-semibold py-1.5 px-2.5 truncate data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg cursor-pointer"
                >
                  <Receipt className="size-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">Desk Collections</span>
                </TabsTrigger>
              )}

              <TabsTrigger
                value="sessions"
                className="gap-1.5 text-xs font-semibold py-1.5 px-2.5 truncate data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg cursor-pointer"
              >
                <History className="size-3.5 text-blue-500 shrink-0" />
                <span className="truncate">Activity Timeline</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Permission Assignment */}
            <TabsContent value="permissions" className="mt-0 focus-visible:outline-hidden">
              <StaffProfilePermissions staff={staff} />
            </TabsContent>

            {/* Tab 2: Desk Collections (only rendered if permitted) */}
            {staff.canViewRevenue && (
              <TabsContent value="collections" className="mt-0 focus-visible:outline-hidden">
                <StaffProfileCollections staff={staff} />
              </TabsContent>
            )}

            {/* Tab 3: Activity Timeline */}
            <TabsContent value="sessions" className="mt-0 focus-visible:outline-hidden">
              <StaffProfileSessions staff={staff} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
