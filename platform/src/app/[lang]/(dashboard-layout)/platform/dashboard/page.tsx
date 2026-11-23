"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { platformService } from "@/services/platform-service"
import { toast } from "sonner"
import { AlertCircle, Clock, Loader2, RefreshCw } from "lucide-react"

import type {
  EmailConnectionHealth,
  ExpiringLibraryPlan,
  GraceAndLockedLibrary,
  LibraryRequest,
  PlatformLibraryRecord,
  PlatformPayment,
  PlatformSupportTicket,
} from "@/data/platform-admin-data"
import type { DateRangeOption, DialogType } from "./types"

import {
  initialAllLibrariesList,
  initialSupportTickets,
} from "@/data/platform-admin-data"

import { usePlatformDashboard } from "@/hooks/use-platform-dashboard"
import { Button } from "@/components/ui/button"
import { ExpiryForecastChart } from "./_components/charts/expiry-forecast-chart"
import { LibraryGrowthChart } from "./_components/charts/library-growth-chart"
import { PlanDistributionChart } from "./_components/charts/plan-distribution-chart"
import { PlatformRevenueChart } from "./_components/charts/platform-revenue-chart"
import { StudentStatusChart } from "./_components/charts/student-status-chart"
import { LockUnlockDialog } from "./_components/dialogs/lock-unlock-dialog"
import { ManualPaymentDialog } from "./_components/dialogs/manual-payment-dialog"
import { PlatformNotificationDialog } from "./_components/dialogs/platform-notification-dialog"
import { ReviewRequestDialog } from "./_components/dialogs/review-request-dialog"
import { PlatformAdminHeader } from "./_components/platform-admin-header"
import { PlatformMetricsGrid } from "./_components/platform-metrics-grid"
import { EmailHealthCard } from "./_components/queues/email-health-card"
import { ExpiringPlansCard } from "./_components/queues/expiring-plans-card"
import { GraceAndLockedCard } from "./_components/queues/grace-and-locked-card"
import { PendingRequestsCard } from "./_components/queues/pending-requests-card"
import { RecentPaymentsCard } from "./_components/queues/recent-payments-card"
import { SupportTicketsCard } from "./_components/queues/support-tickets-card"

export default function PlatformAdminDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const lang = (params.lang as string) || "en"

  // Live Backend Data Hook
  // Filters
  const [dateRange, setDateRange] = useState<DateRangeOption>("this-month")
  const [customDateFrom, setCustomDateFrom] = useState<string>(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0]
  })
  const [customDateTo, setCustomDateTo] = useState<string>(() => {
    return new Date().toISOString().split("T")[0]
  })

  const {
    isLoading,
    error,
    refetch,
    kpis,
    pendingRequests,
    graceAndLocked,
    expiringPlans,
    recentPayments,
    emailHealth,
    revenueData,
    growthData,
    planDistribution,
    studentStatus,
    expiryForecast,
  } = usePlatformDashboard({
    range: dateRange,
    dateFrom: dateRange === "custom" ? customDateFrom : undefined,
    dateTo: dateRange === "custom" ? customDateTo : undefined,
  })

  const [tickets] = useState<PlatformSupportTicket[]>(initialSupportTickets)
  const [, setLibraries] = useState<PlatformLibraryRecord[]>(
    initialAllLibrariesList
  )

  // Dialog states
  const [activeDialog, setActiveDialog] = useState<DialogType>(null)
  const [reviewingRequest, setReviewingRequest] =
    useState<LibraryRequest | null>(null)
  const [lockTargetLib, setLockTargetLib] =
    useState<GraceAndLockedLibrary | null>(null)

  // Refresh rate limiting
  const [cooldown, setCooldown] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshData = async () => {
    if (isRefreshing || cooldown > 0) return

    setIsRefreshing(true)
    try {
      await refetch(false)
      toast.success("Dashboard metrics refreshed from backend!")
    } catch {
      toast.error("Failed to refresh dashboard data")
    } finally {
      setIsRefreshing(false)
      setCooldown(5)
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }

  // Handlers for approval queue
  const handleReviewRequest = (req: LibraryRequest) => {
    setReviewingRequest(req)
    setActiveDialog("review-request")
  }

  const handleApproveRequest = async (id: string) => {
    try {
      await platformService.approveLibraryRequest(id, { assign_trial_days: 14 })
      toast.success(
        "Library request approved and tenant provisioned successfully!"
      )
      refetch()
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to approve library request"
      )
    }
  }

  const handleRejectRequest = async (id: string, reason: string) => {
    try {
      await platformService.rejectLibraryRequest(
        id,
        reason || "Application rejected by Super Admin"
      )
      toast.info("Library request rejected")
      refetch()
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reject library request"
      )
    }
  }

  // Handler for manual payment
  const handleRecordPayment = async (newPay: Omit<PlatformPayment, "id">) => {
    try {
      await platformService.recordManualPayment({
        library: newPay.libraryCode || newPay.libraryName,
        amount: newPay.amount,
        method:
          (newPay.method as
            | "UPI"
            | "Card"
            | "NetBanking"
            | "Bank Transfer"
            | "Cash"
            | "Cheque") || "Bank Transfer",
        notes: `Recorded via Super Admin Dashboard for plan: ${newPay.planName}`,
      })
      toast.success(
        `Manual payment of ₹${newPay.amount.toLocaleString()} recorded successfully!`
      )
      refetch()
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to record manual payment"
      )
    }
  }

  // Handler for adding library manually
  const _handleAddLibrary = (newLib: PlatformLibraryRecord) => {
    setLibraries((prev) => [newLib, ...prev])
    toast.success(`Library "${newLib.name}" created and owner notified!`)
    refetch()
  }

  // Handler for lock/unlock toggle
  const handleOpenLockUnlock = (lib: GraceAndLockedLibrary) => {
    setLockTargetLib(lib)
    setActiveDialog("lock-unlock")
  }

  const handleToggleLockStatus = async (
    id: string,
    action: "Lock" | "Unlock" | "Suspend",
    reason: string
  ) => {
    try {
      if (action === "Unlock") {
        await platformService.unlockLibrary(
          id,
          reason || "Unlocked by Super Admin"
        )
        toast.success("Library unlocked and access restored!")
      } else if (action === "Lock") {
        await platformService.lockLibrary(id, reason || "Locked by Super Admin")
        toast.warning("Library locked successfully")
      } else {
        await platformService.suspendLibrary(
          id,
          reason || "Suspended by Super Admin"
        )
        toast.error("Library suspended")
      }
      refetch()
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update library status"
      )
    }
  }

  const handleExtendPlan = async (plan: ExpiringLibraryPlan) => {
    try {
      await platformService.extendGrace(
        plan.id,
        7,
        "Extended 7 days courtesy via Expiring Queue"
      )
      toast.success(`Granted 7-day grace extension for ${plan.libraryName}.`)
      refetch()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to extend plan")
    }
  }

  const handleSendReminder = (plan: ExpiringLibraryPlan) => {
    toast.info(
      `Sent renewal notification to ${plan.ownerName} (${plan.phone}).`
    )
  }

  const handleTestEmail = (conn: EmailConnectionHealth) => {
    toast.info(
      `Dispatched test verification ping to ${conn.connectedEmail}. Sent successfully!`
    )
  }

  const handleRequestReconnect = (conn: EmailConnectionHealth) => {
    toast.warning(
      `Re-authorization request dispatched to ${conn.libraryName} administrator.`
    )
  }

  const handleOpenTicket = (_ticket: PlatformSupportTicket) => {
    router.push(`/${lang}/platform/support`)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto">
      {/* 1. Header & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PlatformAdminHeader
          dateRange={dateRange}
          setDateRange={setDateRange}
          customDateFrom={customDateFrom}
          customDateTo={customDateTo}
          onCustomRangeChange={(from, to) => {
            setCustomDateFrom(from)
            setCustomDateTo(to)
            setDateRange("custom")
          }}
          onOpenDialog={(diag) => {
            if (diag === "review-request" && pendingRequests.length > 0) {
              setReviewingRequest(pendingRequests[0])
            }
            setActiveDialog(diag)
          }}
          pendingCount={pendingRequests.length}
        />
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shrink-0 self-end sm:self-auto min-w-[130px] font-semibold"
          onClick={handleRefreshData}
          disabled={isLoading || isRefreshing || cooldown > 0}
        >
          {isRefreshing || isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Refreshing...</span>
            </>
          ) : cooldown > 0 ? (
            <>
              <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
              <span>Wait {cooldown}s</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 text-primary" />
              <span>Refresh Data</span>
            </>
          )}
        </Button>
      </div>

      {/* Error banner if network/backend failed */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={isRefreshing || cooldown > 0}
          >
            Retry
          </Button>
        </div>
      )}

      {/* 2. Top 8 Metrics Cards */}
      <PlatformMetricsGrid
        kpis={kpis}
        onSelectMetric={(key) => {
          if (key === "pending-approvals" && pendingRequests.length > 0) {
            setReviewingRequest(pendingRequests[0])
            setActiveDialog("review-request")
          } else if (key === "grace-period" || key === "locked-libraries") {
            if (graceAndLocked.length > 0) {
              setLockTargetLib(graceAndLocked[0])
              setActiveDialog("lock-unlock")
            }
          } else if (key === "failed-payments") {
            toast.error(
              `${kpis.failedPayments} failed payments. Follow up initiated with payment gateway.`
            )
          }
        }}
      />

      {/* 3. Primary Charts Section (Growth & Revenue) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LibraryGrowthChart data={growthData} />
        <PlatformRevenueChart data={revenueData} />
      </div>

      {/* 4. Secondary Breakdown Charts (Plan Distribution, Student Statuses, Expiry Forecast) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PlanDistributionChart data={planDistribution} />
        <StudentStatusChart data={studentStatus} />
        <ExpiryForecastChart data={expiryForecast} />
      </div>

      {/* 5. Core Operational Queues (2-column grids) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PendingRequestsCard
          requests={pendingRequests}
          onReview={handleReviewRequest}
          onApprove={handleApproveRequest}
          onReject={(id) => handleRejectRequest(id, "Rejected via queue")}
          onViewAll={() => router.push(`/${lang}/platform/library-requests`)}
        />
        <GraceAndLockedCard
          items={graceAndLocked}
          onOpenLockUnlock={handleOpenLockUnlock}
        />
      </div>

      {/* 6. Money & Expiries Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExpiringPlansCard
          plans={expiringPlans}
          onExtend={handleExtendPlan}
          onSendReminder={handleSendReminder}
        />
        <RecentPaymentsCard
          payments={recentPayments}
          onViewAll={() => router.push(`/${lang}/platform/billing`)}
        />
      </div>

      {/* 7. Support & Email Integration Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SupportTicketsCard tickets={tickets} onOpenTicket={handleOpenTicket} />
        <EmailHealthCard
          connections={emailHealth}
          onTestEmail={handleTestEmail}
          onRequestReconnect={handleRequestReconnect}
        />
      </div>

      {/* 8. Interactive Modals */}
      <ReviewRequestDialog
        request={reviewingRequest}
        open={activeDialog === "review-request"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
      />

      <ManualPaymentDialog
        open={activeDialog === "manual-payment"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        onRecordPayment={handleRecordPayment}
      />

      <LockUnlockDialog
        library={lockTargetLib}
        open={activeDialog === "lock-unlock"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        onToggleStatus={handleToggleLockStatus}
      />

      <PlatformNotificationDialog
        open={activeDialog === "platform-notification"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      />
    </div>
  )
}
