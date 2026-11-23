import { genderDistributionData } from "../_data/gender-distribution"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GenderDistributionChart } from "./gender-distribution-chart"

export function GenderDistribution() {
  return (
    <Card className="flex flex-col justify-between border-border/80 bg-card/60">
      <CardHeader className="px-3.5 py-2 pb-0">
        <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
          Gender Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0 flex items-center justify-center min-w-0">
        <GenderDistributionChart data={genderDistributionData} />
      </CardContent>
    </Card>
  )
}
