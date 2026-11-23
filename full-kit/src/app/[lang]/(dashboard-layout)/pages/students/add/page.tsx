import type { Metadata } from "next"

import type { LocaleType } from "@/types"
import { StudentEditForm } from "../[id]/edit/_components/student-edit-form"

export const metadata: Metadata = {
  title: "New Student Admission",
}

export default async function AddStudentPage(props: {
  params: Promise<{ lang: LocaleType }>
}) {
  const { lang } = await props.params

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden p-3 sm:p-4">
      <StudentEditForm locale={lang} mode="add" />
    </div>
  )
}
