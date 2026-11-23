import { redirect } from "next/navigation"

import type { LocaleType } from "@/types"
import { ensureLocalizedPathname } from "@/lib/i18n"

export default async function EcommercePage(props: {
  params: Promise<{ lang: LocaleType }>
}) {
  const { lang } = await props.params
  redirect(ensureLocalizedPathname("/dashboards/students", lang))
}
