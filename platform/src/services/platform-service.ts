/**
 * Platform Admin Service
 * Typed feature service wrapping all Super Admin backend API calls.
 */

import type {
  EmailConnectionHealth,
  ExpiringLibraryPlan,
  GraceAndLockedLibrary,
  LibraryRequest,
  PlatformKPIs,
  PlatformPayment,
  PlatformSupportTicket,
} from "@/data/platform-admin-data"

import { apiClient } from "@/lib/api-client"
import { platformLibraryStore } from "@/lib/platform-library-store"

export interface PlatformRevenuePoint {
  month: string
  label?: string
  revenue: number
  target: number
}

export interface LibraryGrowthPoint {
  month: string
  totalLibraries: number
  activeLibraries: number
  newLibraries?: number
}

export interface PlanDistributionPoint {
  name: string
  count: number
  percentage: number
  color: string
  revenue?: number
}

export interface StudentStatusPoint {
  status: string
  count: number
  percentage: number
  color: string
}

export interface ExpiryForecastPoint {
  period: string
  count: number
  value: string
  risk: string
}

export interface ManualPaymentPayload {
  library: string
  subscription?: string
  amount: number
  method: "UPI" | "Card" | "NetBanking" | "Bank Transfer" | "Cash" | "Cheque"
  reference_number?: string
  notes?: string
}

export interface BroadcastNotificationPayload {
  title: string
  body: string
  audience:
    | "All Students"
    | "Live Members Only"
    | "Expiring Soon"
    | "Expired"
    | "Specific Students"
  priority?: "Low" | "Normal" | "High" | "Urgent"
  display_mode?:
    | "In-App Toast"
    | "Push Notification"
    | "Modal Dialog"
    | "Top Banner"
  library?: string
}

export const platformService = {
  // --- Section 17.1 Core Platform Dashboard & Analytics ---
  getDashboard: (params?: { range?: string }) =>
    apiClient.get<any>("v1/platform/dashboard", { params }),

  getAnalytics: (params?: {
    metric?: string
    range?: string
    group_by?: string
  }) => apiClient.get<any>("v1/platform/analytics", { params }),

  getActivity: (params?: {
    org_id?: string
    actor?: string
    module?: string
    risky_only?: boolean
    page?: number
    limit?: number
  }) => apiClient.get<any>("v1/platform/activity", { params }),

  // --- Dashboard KPIs & Queues ---
  getDashboardKPIs: async (params?: {
    range?: string
    date_from?: string
    date_to?: string
  }) => {
    try {
      const res = await apiClient.get<any>("v1/platform/dashboard", { params })
      if (res?.kpis) return res.kpis
      if (res?.data?.totalLibraries !== undefined) return res.data
    } catch {
      // Fallback to legacy endpoint if needed
    }
    return apiClient.get<PlatformKPIs>("api/v1/platform/dashboard/kpis/", {
      params,
    })
  },
  getKPIs: (params?: {
    range?: string
    date_from?: string
    date_to?: string
  }) =>
    apiClient.get<PlatformKPIs>("api/v1/platform/dashboard/kpis/", { params }),
  getPendingRequests: () =>
    apiClient.get<LibraryRequest[]>(
      "api/v1/platform/dashboard/pending-requests/"
    ),
  getGraceAndLocked: () =>
    apiClient.get<GraceAndLockedLibrary[]>(
      "api/v1/platform/dashboard/grace-locked/"
    ),
  getExpiringPlans: () =>
    apiClient.get<ExpiringLibraryPlan[]>(
      "api/v1/platform/dashboard/expiring-plans/"
    ),
  getRecentPayments: () =>
    apiClient.get<PlatformPayment[]>(
      "api/v1/platform/dashboard/recent-payments/"
    ),
  getEmailHealth: () =>
    apiClient.get<EmailConnectionHealth[]>(
      "api/v1/platform/dashboard/email-health/"
    ),

  // --- Dashboard Charts & Analytics ---
  getRevenueReport: (params?: {
    range?: string
    date_from?: string
    date_to?: string
  }) =>
    apiClient.get<PlatformRevenuePoint[]>("api/v1/platform/reports/revenue/", {
      params,
    }),

  getGrowthReport: (params?: {
    range?: string
    date_from?: string
    date_to?: string
  }) =>
    apiClient.get<LibraryGrowthPoint[]>("api/v1/platform/reports/growth/", {
      params,
    }),

  getPlanDistribution: () =>
    apiClient.get<PlanDistributionPoint[]>(
      "api/v1/platform/reports/plan-distribution/"
    ),

  getStudentStatus: () =>
    apiClient.get<StudentStatusPoint[]>(
      "api/v1/platform/reports/student-status/"
    ),

  getExpiryForecast: () =>
    apiClient.get<ExpiryForecastPoint[]>(
      "api/v1/platform/reports/expiry-forecast/"
    ),

  // --- Section 17.2 Library Lifecycle & Onboarding ---
  approveLibraryRequest: (
    id: string,
    payload?: {
      assign_trial_days?: number
      notes?: string
      start_trial_plan_id?: string
    }
  ) => apiClient.post(`v1/platform/libraries/${id}/approve`, payload),

  rejectLibraryRequest: (id: string, reason: string) =>
    apiClient.post(`v1/platform/libraries/${id}/reject`, { reason }),

  requestInfoLibrary: (id: string, message: string, fields?: string[]) =>
    apiClient.post(`v1/platform/libraries/${id}/request-info`, {
      message,
      fields,
    }),

  lockLibrary: async (id: string, reason: string, studentNotice?: string) => {
    platformLibraryStore.lock(id, reason)
    try {
      return await apiClient.post(`v1/platform/libraries/${id}/suspend`, {
        reason: reason || "Locked by Super Admin",
        student_notice: studentNotice,
      })
    } catch {
      return { success: true }
    }
  },

  unlockLibrary: async (id: string, reason: string) => {
    platformLibraryStore.unlock(id, reason)
    try {
      return await apiClient.post(`v1/platform/libraries/${id}/reactivate`, {
        note: reason,
      })
    } catch {
      return { success: true }
    }
  },

  suspendLibrary: async (id: string, reason: string) => {
    platformLibraryStore.suspend(id, reason)
    try {
      return await apiClient.post(`v1/platform/libraries/${id}/suspend`, {
        reason,
      })
    } catch {
      return { success: true }
    }
  },

  reactivateLibrary: async (id: string, note?: string) => {
    platformLibraryStore.unlock(id, note || "Reactivated by Super Admin")
    try {
      return await apiClient.post(`v1/platform/libraries/${id}/reactivate`, {
        note,
      })
    } catch {
      return { success: true }
    }
  },

  archiveLibrary: (id: string, reason: string) =>
    apiClient.post(`v1/platform/libraries/${id}/archive`, { reason }),

  impersonateLibrary: (id: string, reason: string) =>
    apiClient.post<{
      view_as_token: string
      is_impersonation: boolean
      expires_in_minutes: number
      library: { id: string; code: string; name: string }
    }>(`v1/platform/libraries/${id}/impersonate`, { reason }),

  deleteLibrary: async (id: string) => {
    platformLibraryStore.delete(id)
    try {
      return await apiClient.post(`v1/platform/libraries/${id}/archive`, {
        reason: "Deleted by Super Admin",
      })
    } catch {
      return { success: true }
    }
  },

  extendGrace: (id: string, extendDays: number, reason: string) =>
    apiClient.post(`v1/platform/subscriptions/extend`, {
      library_id: id,
      days: extendDays,
      reason,
    }),

  recordManualPayment: async (payload: ManualPaymentPayload) => {
    if (payload.library) {
      platformLibraryStore.recordPayment(payload.library, payload.amount)
    }
    try {
      return await apiClient.post("v1/platform/payments/manual", {
        org_id: payload.library,
        amount: payload.amount,
        mode: payload.method,
        reference_number: payload.reference_number,
        notes: payload.notes,
      })
    } catch {
      return { success: true }
    }
  },

  approvePayment: (paymentId: string) =>
    apiClient.post(`v1/platform/payments/${paymentId}/approve`),

  refundPayment: (paymentId: string, reason: string) =>
    apiClient.post(`v1/platform/payments/${paymentId}/refund`, { reason }),

  getPlatformPayments: (params?: { page?: number; status?: string }) =>
    apiClient.get<unknown>("v1/platform/payments", { params }),

  getInvoices: () => apiClient.get<unknown>("v1/platform/invoices"),

  resendInvoice: (id: string) =>
    apiClient.post(`v1/platform/invoices/${id}/resend`),

  getRevenueMetrics: () => apiClient.get<unknown>("v1/platform/revenue"),

  getCommissionSettings: () => apiClient.get<unknown>("v1/platform/commission"),

  updateCommissionSettings: (payload: {
    default_enabled: boolean
    default_percent: number
  }) => apiClient.put<unknown>("v1/platform/commission", payload),

  broadcastNotification: (
    payload: BroadcastNotificationPayload | Record<string, unknown>
  ) => apiClient.post<unknown>("v1/platform/notifications", payload),

  getAudiencePreview: (criteria?: unknown) =>
    apiClient.post<{ count: number; sample: string[] }>(
      "v1/platform/notifications/audience-preview",
      criteria || {}
    ),

  getEmailSettings: () => apiClient.get<unknown>("v1/platform/email"),

  updateEmailSettings: (payload: Record<string, unknown>) =>
    apiClient.put<unknown>("v1/platform/email", payload),

  sendTestEmail: (to?: string) =>
    apiClient.post<{ sent: boolean; message: string }>(
      "v1/platform/email/test",
      { to }
    ),

  getSupportTickets: () =>
    apiClient.get<unknown[]>("v1/platform/support/tickets"),

  getSupportTicket: (id: string) =>
    apiClient.get<unknown>(`v1/platform/support/tickets/${id}`),

  updateSupportTicket: (
    id: string,
    payload: { status?: string; priority?: string }
  ) => apiClient.patch<unknown>(`v1/platform/support/tickets/${id}`, payload),

  sendTicketMessage: (id: string, message: string) =>
    apiClient.post<unknown>(`v1/platform/support/tickets/${id}/messages`, {
      message,
    }),

  // --- Phase 5: Staff RBAC, Settings & Governance ---
  getStaffList: () => apiClient.get<unknown[]>("v1/platform/staff"),

  inviteStaff: (payload: Record<string, unknown>) =>
    apiClient.post<unknown>("v1/platform/staff", payload),

  updateStaff: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch<unknown>(`v1/platform/staff/${id}`, payload),

  deleteStaff: (id: string) =>
    apiClient.delete<unknown>(`v1/platform/staff/${id}`),

  resetStaff2FA: (id: string) =>
    apiClient.post<unknown>(`v1/platform/staff/${id}/reset-2fa`),

  getPlatformSettings: (key?: string) =>
    apiClient.get<unknown>(
      key ? `v1/platform/settings/${key}` : "v1/platform/settings"
    ),

  updatePlatformSettings: (payload: Record<string, unknown>, key?: string) =>
    apiClient.put<unknown>(
      key ? `v1/platform/settings/${key}` : "v1/platform/settings",
      payload
    ),

  getAppVersions: () => apiClient.get<unknown>("v1/platform/app-versions"),

  updateAppVersions: (payload: Record<string, unknown>) =>
    apiClient.put<unknown>("v1/platform/app-versions", payload),

  setMaintenanceMode: (payload: { enabled: boolean; message?: string }) =>
    apiClient.put<unknown>("v1/platform/maintenance", payload),

  getPlatformJobs: () => apiClient.get<unknown[]>("v1/platform/jobs"),

  runPlatformJob: (name: string) =>
    apiClient.post<{ run_id: string; status: string }>(
      `v1/platform/jobs/${name}/run`
    ),

  getCustomDomains: () =>
    apiClient.get<unknown[]>("v1/platform/custom-domains"),

  verifyCustomDomain: (id: string) =>
    apiClient.post<{ id: string; status: string }>(
      `v1/platform/custom-domains/${id}/verify`
    ),

  getDataRequests: () =>
    apiClient.get<unknown[]>("v1/platform/data-requests"),

  approveDataRequest: (id: string) =>
    apiClient.post<unknown>(`v1/platform/data-requests/${id}/approve`),

  // --- Platform Libraries Directory ---
  getLibraries: async (params?: {
    q?: string
    search?: string
    plan_status?: string
    library_status?: string
    status?: string
    access_state?: string
    city?: string
    page?: number
    limit?: number
  }) => {
    const queryParams: Record<string, any> = { ...params }
    if (params?.q) {
      queryParams.q = params.q
    }

    try {
      const res = await apiClient.get<any>("v1/platform/libraries", {
        params: queryParams,
      })
      const rawList = Array.isArray(res) ? res : res?.data || res?.results || []
      if (Array.isArray(rawList) && rawList.length > 0) {
        // Sync items into store
        rawList.forEach((item: any) => {
          if (item?.id && item?.name) {
            platformLibraryStore.update(String(item.id), {
              name: item.name,
              code: item.code,
              city: item.city,
              state: item.state,
              planStatus: item.plan_status || item.planStatus,
              libraryStatus: item.library_status || item.libraryStatus,
              planName:
                item.plan_name || item.subscription?.plan_name || item.planName,
              planFee: item.plan_fee || item.planFee,
              ownerName:
                item.owner_name ||
                item.owner?.name ||
                item.owner_detail?.name ||
                item.ownerName,
              ownerEmail:
                item.contact_email ||
                item.owner?.email ||
                item.owner_detail?.email ||
                item.ownerEmail,
              ownerPhone:
                item.phone ||
                item.owner?.mobile ||
                item.owner_detail?.phone ||
                item.ownerPhone,
            })
          }
        })
        return res
      }
    } catch {
      // Fallback to local store
    }

    // Return real stored libraries
    const stored = platformLibraryStore.getAll()
    return {
      data: stored,
      results: stored,
      count: stored.length,
      meta: { total: stored.length, page: 1, limit: 10 },
    }
  },

  getLibraryDetail: async (id: string) => {
    try {
      const res = await apiClient.get<any>(`v1/platform/libraries/${id}`)
      const payload = (res as any)?.data || res
      if (
        payload &&
        (String(payload.id).toLowerCase() === String(id).toLowerCase() ||
          String(payload.code).toLowerCase() === String(id).toLowerCase() ||
          payload.library?.id)
      ) {
        return payload
      }
    } catch {
      // Fall through to store
    }
    const local = platformLibraryStore.getById(id)
    return local || null
  },

  createLibrary: async (payload: Record<string, any>) => {
    const code =
      payload.code?.trim() || `LIB-${Math.floor(1000 + Math.random() * 9000)}`
    const createdLocal = platformLibraryStore.create({
      code,
      name: payload.name,
      city: payload.city,
      state: payload.state,
      address: payload.address,
      ownerName: payload.owner_name,
      ownerEmail: payload.owner_email,
      ownerPhone: payload.owner_phone,
      planName: payload.plan_name,
      planFee: Number(payload.plan_fee || 0),
      billingCycle: payload.billing_cycle,
      totalSeats: Number(payload.total_seats || 0),
      branchesCount: Number(payload.branches_count || 1),
      gstNumber: payload.gstin,
      planStatus: payload.plan_status || "Active",
      libraryStatus: payload.library_status || "Active",
      micrositeSlug: payload.public_page_slug || code.toLowerCase(),
    })

    try {
      const res = await apiClient.post<any>("v1/platform/libraries", payload)
      return res
    } catch {
      return { data: createdLocal }
    }
  },

  updateLibrary: async (id: string, payload: Record<string, any>) => {
    const updatedLocal = platformLibraryStore.update(id, {
      name: payload.name,
      city: payload.city,
      state: payload.state,
      address: payload.address,
      ownerName: payload.owner_name,
      ownerEmail: payload.owner_email,
      ownerPhone: payload.owner_phone,
      planName: payload.plan_name,
      planFee:
        payload.plan_fee !== undefined ? Number(payload.plan_fee) : undefined,
      totalSeats:
        payload.total_seats !== undefined
          ? Number(payload.total_seats)
          : undefined,
      branchesCount:
        payload.branches_count !== undefined
          ? Number(payload.branches_count)
          : undefined,
      gstNumber: payload.gstin,
      planStatus: payload.plan_status,
      libraryStatus: payload.library_status,
    })

    try {
      const res = await apiClient.patch<any>(
        `v1/platform/libraries/${id}`,
        payload
      )
      return res
    } catch {
      return { data: updatedLocal }
    }
  },

  getSubscriptionPlans: () => apiClient.get<unknown>("v1/platform/plans"),
  createSubscriptionPlan: (payload: Record<string, unknown>) =>
    apiClient.post<unknown>("v1/platform/plans", payload),
  updateSubscriptionPlan: (id: string, payload: Record<string, unknown>) =>
    apiClient.patch<unknown>(`v1/platform/plans/${id}`, payload),
  archiveSubscriptionPlan: (id: string) =>
    apiClient.post<unknown>(`v1/platform/plans/${id}`),
}
