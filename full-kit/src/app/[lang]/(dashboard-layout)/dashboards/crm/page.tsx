import { redirect } from "next/navigation"

import type { LocaleType } from "@/types"
import { ensureLocalizedPathname } from "@/lib/i18n"

export default async function CRMPage(props: {
  params: Promise<{ lang: LocaleType }>
}) {
  const { lang } = await props.params
  redirect(ensureLocalizedPathname("/pages/settings-library/leads", lang))
}
