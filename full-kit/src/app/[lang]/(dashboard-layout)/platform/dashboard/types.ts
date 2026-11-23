export type DateRangeOption = "today" | "7d" | "30d" | "this-month" | "quarter" | "custom"

export interface PlatformFilterState {
  dateRange: DateRangeOption
  compareWithPrevious: boolean
  searchQuery: string
  statusFilter: string
}

export type DialogType =
  | null
  | "review-request"
  | "manual-payment"
  | "platform-notification"
  | "add-library"
  | "lock-unlock"

