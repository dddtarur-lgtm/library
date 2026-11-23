import type { Metadata } from "next"

import type { LocaleType } from "@/types"
import { getStudentById } from "@/data/students-data"
import { StudentEditForm } from "./_components/student-edit-form"

export const metadata: Metadata = {
  title: "Edit Student Profile",
}

export default async function StudentEditPage(props: {
  params: Promise<{ lang: LocaleType; id: string }>
}) {
  const { lang, id } = await props.params
  const student = getStudentById(id)

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden p-3 sm:p-4">
      <StudentEditForm student={student} locale={lang} />
    </div>
  )
}
