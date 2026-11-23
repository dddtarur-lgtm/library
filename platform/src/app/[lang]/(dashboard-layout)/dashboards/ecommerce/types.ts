export interface MetricType {
  value: number
  percentageChange: number
  period: string
}

export interface OverviewType {
  totalSales: MetricType
  revenueSummary: MetricType
  numberOfOrders: MetricType
  averageOrderValue: MetricType
}

export interface SalesTrendType {
  period: string
  summary: {
    lowestSales: { date: number; sales: number }
    highestSales: { date: number; sales: number }
    avgSales: number
    totalSales: number
  }
  salesTrends: Array<{ date: number; sales: number }>
}

export interface TopProductType {
  period: string
  products: Array<{
    name: string
    sales: {
      value: number
      percentageChange: number
    }
    revenue: {
      value: number
      percentageChange: number
    }
    order: number
    image: string
    sku: string
  }>
}

export interface CustomerInsightsType {
  period?: string
  total: number
  live: number
  pending: number
  expired: number
  suspended: number
}

export interface StudentType {
  id: string
  studentId: string
  name: string
  email: string
  phone: string
  avatar: string
  gender: "Male" | "Female"
  seatNo: string
  shift: string
  plan: string
  joinDate: string
  dueDate: string
  feeStatus: "Paid" | "Pending" | "Overdue"
  status: "Live" | "Pending" | "Expired" | "Suspended"
  totalFee: number
}

export type InvoiceType = StudentType

export interface RevenueBySourceType {
  period: string
  summary: {
    totalRevenue: number
    percentageChange: number
  }
  sources: Array<{
    name: string
    value: number
    percentage: number
    fill: string
  }>
}

export interface ChurnRateType {
  period: string
  summary: {
    totalCustomers: number
    totalLostCustomers: number
    averageChurnRate: number
  }
  months: Array<{
    month: string
    totalCustomers: number
    lostCustomers: number
    churnRate: number
  }>
}
