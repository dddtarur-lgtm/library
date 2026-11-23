/**
 * LMS Library Admin Service
 * Fully typed service for students, seats, attendance, daybook, dues, payments, plans, and branches.
 */

import { apiClient, ApiResponse } from "@/lib/api-client"

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface LibraryDashboardStats {
  total_students: number
  active_students: number
  seats_total: number
  seats_occupied: number
  occupancy_rate: number
  today_attendance_count: number
  monthly_revenue: number
  pending_dues_count: number
  pending_dues_amount: number
  available_lockers: number
}

export interface StudentRecord {
  id: string
  full_name: string
  email: string
  phone: string
  gender?: string
  status: "ACTIVE" | "PENDING" | "EXPIRED" | "SUSPENDED" | "INACTIVE"
  seat_number?: string | null
  seat_id?: string | null
  plan_name?: string | null
  plan_id?: string | null
  branch_name?: string | null
  branch_id?: string | null
  joined_date?: string
  start_date?: string
  end_date?: string
  photo_url?: string | null
  aadhaar_number?: string | null
  notes?: string | null
}

export interface SeatRecord {
  id: string
  seat_number: string
  section: string
  floor?: string
  tier?: string
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "RESERVED"
  student_name?: string | null
  student_id?: string | null
  shift?: string
}

export interface AttendanceRecord {
  id: string
  student_id: string
  student_name: string
  seat_number?: string
  date: string
  clock_in: string | null
  clock_out: string | null
  duration_minutes?: number
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY"
}

export interface DaybookEntry {
  id: string
  entry_type: "INCOME" | "EXPENSE"
  category: string
  amount: number
  payment_mode: "CASH" | "UPI" | "CARD" | "BANK_TRANSFER"
  description: string
  receipt_number?: string
  created_at: string
  created_by?: string
}

export interface DueRecord {
  id: string
  student_id: string
  student_name: string
  student_phone?: string
  amount: number
  due_date: string
  status: "PENDING" | "PARTIALLY_PAID" | "OVERDUE" | "PAID" | "WAIVED"
  remarks?: string
}

export interface PlanRecord {
  id: string
  name: string
  plan_type: "FIXED_SEAT" | "FLEXI_SEAT" | "DAILY" | "HOURLY"
  price: number
  duration_days: number
  shifts?: string[]
  is_active: boolean
}

export interface BranchRecord {
  id: string
  name: string
  code: string
  address?: string
  city?: string
  is_main: boolean
}

export const libraryService = {
  // Dashboard statistics
  getDashboardStats: async (): Promise<LibraryDashboardStats> => {
    return apiClient.get<LibraryDashboardStats>("/library/dashboard/")
  },

  // Students
  getStudents: async (params?: {
    search?: string
    status?: string
    branch_id?: string
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<StudentRecord>> => {
    return apiClient.get<PaginatedResponse<StudentRecord>>("/library/students/", params)
  },

  getStudentDetail: async (id: string): Promise<StudentRecord> => {
    return apiClient.get<StudentRecord>(`/library/students/${id}/`)
  },

  createStudent: async (studentData: Partial<StudentRecord>): Promise<StudentRecord> => {
    return apiClient.post<StudentRecord>("/library/students/", studentData)
  },

  updateStudent: async (id: string, studentData: Partial<StudentRecord>): Promise<StudentRecord> => {
    return apiClient.patch<StudentRecord>(`/library/students/${id}/`, studentData)
  },

  setStudentStatus: async (id: string, status: string, reason?: string): Promise<any> => {
    return apiClient.post(`/library/students/${id}/status/`, { status, reason })
  },

  // Seats
  getSeats: async (params?: {
    branch_id?: string
    section?: string
    status?: string
  }): Promise<SeatRecord[]> => {
    return apiClient.get<SeatRecord[]>("/library/seats/", params)
  },

  getSeatMatrix: async (params?: { branch_id?: string }): Promise<any> => {
    return apiClient.get("/library/seats/matrix/", params)
  },

  assignSeat: async (seatId: string, studentId: string): Promise<any> => {
    return apiClient.post(`/library/seats/${seatId}/assign/`, { student_id: studentId })
  },

  vacateSeat: async (seatId: string, reason?: string): Promise<any> => {
    return apiClient.post(`/library/seats/${seatId}/release/`, { reason })
  },

  // Attendance
  getAttendanceList: async (params?: {
    date?: string
    branch_id?: string
    student_id?: string
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<AttendanceRecord>> => {
    return apiClient.get<PaginatedResponse<AttendanceRecord>>("/library/attendance/", params)
  },

  clockIn: async (studentId: string, seatId?: string): Promise<any> => {
    return apiClient.post("/library/attendance/check-in/", { student_id: studentId, seat_id: seatId })
  },

  clockOut: async (studentId: string): Promise<any> => {
    return apiClient.post("/library/attendance/check-out/", { student_id: studentId })
  },

  // Daybook
  getDaybookEntries: async (params?: {
    entry_type?: string
    category?: string
    payment_mode?: string
    date_from?: string
    date_to?: string
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<DaybookEntry>> => {
    return apiClient.get<PaginatedResponse<DaybookEntry>>("/library/cashbook/", params)
  },

  getDaybookSummary: async (params?: { date_from?: string; date_to?: string }): Promise<any> => {
    return apiClient.get("/library/cashbook/summary/", params)
  },

  createDaybookEntry: async (entry: Partial<DaybookEntry>): Promise<DaybookEntry> => {
    return apiClient.post<DaybookEntry>("/library/cashbook/", entry)
  },

  // Dues
  getDues: async (params?: {
    status?: string
    is_overdue?: boolean
    student_id?: string
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<DueRecord>> => {
    return apiClient.get<PaginatedResponse<DueRecord>>("/library/fee-dues/", params)
  },

  getDuesSummary: async (): Promise<any> => {
    return apiClient.get("/library/fee-dues/summary/")
  },

  waiveDue: async (dueId: string, reason: string): Promise<any> => {
    return apiClient.post(`/library/fee-dues/${dueId}/waive/`, { reason })
  },

  // Membership Plans
  getPlans: async (params?: { is_active?: boolean }): Promise<PlanRecord[]> => {
    return apiClient.get<PlanRecord[]>("/library/fee-plans/", params)
  },

  createPlan: async (plan: Partial<PlanRecord>): Promise<PlanRecord> => {
    return apiClient.post<PlanRecord>("/library/fee-plans/", plan)
  },

  // Branches
  getBranches: async (): Promise<BranchRecord[]> => {
    return apiClient.get<BranchRecord[]>("/library/branches/")
  },
}

export default libraryService

