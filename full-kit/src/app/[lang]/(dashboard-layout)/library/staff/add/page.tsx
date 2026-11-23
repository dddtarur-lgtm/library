import type { Metadata } from "next"

import type { LocaleType } from "@/types"
import { StaffEditForm } from "../[id]/_components/staff-edit-form"

export const metadata: Metadata = {
  title: "Add New Staff Member",
}

export default async function AddStaffPage(props: {
  params: Promise<{ lang: LocaleType }>
}) {
  const { lang } = await props.params

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden p-3 sm:p-4">
      <StaffEditForm locale={lang} mode="add" />
    </div>
  )
}

