export interface GenderDistributionItem {
  name: string
  value: number
  count: number
  percentage: number
  fill: string
}

export const genderDistributionData: GenderDistributionItem[] = [
  {
    name: "Boys",
    value: 58,
    count: 685,
    percentage: 58,
    fill: "hsl(var(--chart-1))",
  },
  {
    name: "Girls",
    value: 42,
    count: 495,
    percentage: 42,
    fill: "hsl(var(--chart-5))",
  },
]
