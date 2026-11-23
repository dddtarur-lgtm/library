import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="w-full space-y-6 p-4 sm:p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-60" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card/80 p-4 space-y-3"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="rounded-xl border border-border/60 bg-card/80 p-5 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-border/40">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-8 w-36 rounded-md" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex justify-between items-center gap-4 py-2 border-b border-border/20 last:border-0"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

