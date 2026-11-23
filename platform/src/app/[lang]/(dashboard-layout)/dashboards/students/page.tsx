import type { Metadata } from "next"

import { CustomerInsights } from "./_components/customer-insights"
import { GenderDistribution } from "./_components/gender-distribution"
import { Invoices } from "./_components/invoices"
import { TopActions } from "./_components/top-actions"

// Define metadata for the page
export const metadata: Metadata = {
  title: "Students Directory",
}

export default function StudentsDashboardPage() {
  return (
    <section className="container grid gap-4 p-4 md:grid-cols-2">
      <TopActions />
      <div className="col-span-full grid gap-4 md:grid-cols-4">
        <CustomerInsights />
        <GenderDistribution />
      </div>
      <Invoices />
    </section>
  )
}
