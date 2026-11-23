import { redirect } from "next/navigation"

import type { LocaleType } from "@/types"

import { ensureLocalizedPathname } from "@/lib/i18n"

export default async function DefaultStudentProfilePage(props: {
  params: Promise<{ lang: LocaleType }>
}) {
  const { lang } = await props.params
  redirect(ensureLocalizedPathname("/pages/students/STU-1081", lang))
}
