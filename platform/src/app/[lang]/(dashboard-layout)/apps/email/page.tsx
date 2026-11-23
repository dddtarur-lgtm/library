import { redirect } from "next/navigation"
import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

export default async function EmailIndexPage(props: {
  params: Promise<{ lang: string }>
}) {
  const params = await props.params
  const lang = (params.lang as LocaleType) || "en"
  redirect(ensureLocalizedPathname("/pages/email-management", lang))
}

