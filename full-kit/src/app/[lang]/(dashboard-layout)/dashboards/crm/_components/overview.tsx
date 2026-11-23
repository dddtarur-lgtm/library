import { Armchair, Coins, GraduationCap, IndianRupee } from "lucide-react"

import { overviewData } from "../_data/overview"

import { Card } from "@/components/ui/card"

export function Overview() {
  const cards = [
    {
      title: overviewData.totalRevenueMonth.title,
      amount: overviewData.totalRevenueMonth.amount,
      icon: Coins,
      cardBg: "bg-amber-50/80 dark:bg-amber-950/30",
      borderColor: "border-amber-200/90 dark:border-amber-500/30",
      textColor: "text-amber-700 dark:text-amber-300",
      badgeBg: "bg-amber-500 text-white shadow-sm shadow-amber-500/25",
    },
    {
      title: overviewData.totalStudents.title,
      amount: overviewData.totalStudents.amount,
      icon: GraduationCap,
      cardBg: "bg-orange-50/80 dark:bg-orange-950/30",
      borderColor: "border-orange-200/90 dark:border-orange-500/30",
      textColor: "text-orange-700 dark:text-orange-300",
      badgeBg: "bg-orange-500 text-white shadow-sm shadow-orange-500/25",
    },
    {
      title: overviewData.remainingFeeCollection.title,
      amount: overviewData.remainingFeeCollection.amount,
      icon: IndianRupee,
      cardBg: "bg-pink-50/80 dark:bg-pink-950/30",
      borderColor: "border-pink-200/90 dark:border-pink-500/30",
      textColor: "text-pink-700 dark:text-pink-300",
      badgeBg: "bg-pink-600 text-white shadow-sm shadow-pink-500/25",
    },
    {
      title: overviewData.seatsAllocated.title,
      amount: overviewData.seatsAllocated.amount,
      icon: Armchair,
      cardBg: "bg-teal-50/80 dark:bg-teal-950/30",
      borderColor: "border-teal-200/90 dark:border-teal-500/30",
      textColor: "text-teal-700 dark:text-teal-300",
      badgeBg: "bg-teal-600 text-white shadow-sm shadow-teal-500/25",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-2 md:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card
            key={card.title}
            className={`flex flex-col justify-between p-5 rounded-xl border transition-colors ${card.cardBg} ${card.borderColor}`}
          >
            <div className="flex items-center justify-between gap-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                {card.title}
              </span>
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${card.badgeBg}`}
              >
                <Icon className="size-4.5" aria-hidden />
              </div>
            </div>
            <div className="mt-4">
              <p
                className={`text-3xl font-extrabold tracking-tight ${card.textColor}`}
              >
                {card.amount}
              </p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
