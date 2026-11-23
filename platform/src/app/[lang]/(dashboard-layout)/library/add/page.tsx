"use client"

import { useParams } from "next/navigation"
import { LibraryEditForm } from "../../platform/libraries/_components/library-edit-form"

export default function LibraryAddRoutePage() {
  const params = useParams()
  const lang = (params?.lang as string) || "en"

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden p-3 sm:p-4">
      <LibraryEditForm locale={lang} mode="add" />
    </div>
  )
}

