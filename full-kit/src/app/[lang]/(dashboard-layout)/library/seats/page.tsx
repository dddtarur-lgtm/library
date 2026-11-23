import type { Metadata } from "next"

import type { LocaleType } from "@/types"

import { SeatsInteractiveMap } from "./_components/seats-interactive-map"
import { SeatsMetricsCards } from "./_components/seats-metrics-cards"
import { SeatsPageHeader } from "./_components/seats-page-header"

export const metadata: Metadata = {
  title: "Seat & Floor Management",
  description: "Interactive shift-based floor grid, category restrictions & allocation timeline",
}

export default async function SeatsPage(props: {
  params: Promise<{ lang: LocaleType }>
}) {
  const { lang } = await props.params

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden space-y-4 p-3 sm:p-4">
      {/* Header */}
      <SeatsPageHeader lang={lang} />

      {/* Overview Metrics Cards */}
      <SeatsMetricsCards lang={lang} />

      {/* Interactive Visual Floor Grid */}
      <SeatsInteractiveMap lang={lang} />
    </div>
  )
}
