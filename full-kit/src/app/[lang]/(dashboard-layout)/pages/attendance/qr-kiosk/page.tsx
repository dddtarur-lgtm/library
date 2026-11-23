"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

import { ensureLocalizedPathname } from "@/lib/i18n"
import type { LocaleType } from "@/types"

export default function QrKioskRedirect() {
  const router = useRouter()
  const params = useParams()
  const lang = (params?.lang as LocaleType) || "en"

  useEffect(() => {
    router.replace(ensureLocalizedPathname("/pages/attendance", lang))
  }, [router, lang])

  return null
}
