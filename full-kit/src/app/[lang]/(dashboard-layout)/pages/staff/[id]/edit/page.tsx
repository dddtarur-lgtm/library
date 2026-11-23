import type { Metadata } from "next"

import type { LocaleType } from "@/types"
import { getStaffMemberById } from "@/data/library-management-data"
import { StaffEditForm } from "../_components/staff-edit-form"

export const metadata: Metadata = {
  title: "Edit Staff Profile & Permissions",
}

export default async function StaffEditPage(props: {
  params: Promise<{ lang: LocaleType; id: string }>
}) {
  const { lang, id } = await props.params
  const staff = getStaffMemberById(id)

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden p-3 sm:p-4">
      <StaffEditForm staff={staff} locale={lang} mode="edit" />
    </div>
  )
}

