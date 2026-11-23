"use client"

import { useState } from "react"
import type { Metadata } from "next"

import type { DateRangeOption, DialogType } from "./types"
import type {
  GraceAndLockedLibrary,
  LibraryRequest,
  PlatformLibraryRecord,
  PlatformPayment,
  PlatformSupportTicket,
  EmailConnectionHealth,
  ExpiringLibraryPlan,
} from "@/data/platform-admin-data"

import {
  initialAllLibrariesList,
  initialEmailConnections,
  initialExpiringPlans,
  initialExpiryForecastData,
  initialGraceAndLocked,
  initialLibraryGrowthData,
  initialPendingRequests,
  initialPlanDistributionData,
  initialPlatformKPIs,
  initialPlatformPayments,
  initialPlatformRevenueData,
  initialStudentStatusData,
  initialSupportTickets,
} from "@/data/platform-admin-data"

import { PlatformAdminHeader } from "./_components/platform-admin-header"
import { PlatformMetricsGrid } from "./_components/platform-metrics-grid"
import { LibraryGrowthChart } from "./_components/charts/library-growth-chart"
import { PlatformRevenueChart } from "./_components/charts/platform-revenue-chart"
import { PlanDistributionChart } from "./_components/charts/plan-distribution-chart"
import { StudentStatusChart } from "./_components/charts/student-status-chart"
import { ExpiryForecastChart } from "./_components/charts/expiry-forecast-chart"
import { PendingRequestsCard } from "./_components/queues/pending-requests-card"
import { GraceAndLockedCard } from "./_components/queues/grace-and-locked-card"
import { ExpiringPlansCard } from "./_components/queues/expiring-plans-card"
import { RecentPaymentsCard } from "./_components/queues/recent-payments-card"
import { SupportTicketsCard } from "./_components/queues/support-tickets-card"
import { EmailHealthCard } from "./_components/queues/email-health-card"
import { ReviewRequestDialog } from "./_components/dialogs/review-request-dialog"
import { ManualPaymentDialog } from "./_components/dialogs/manual-payment-dialog"
import { AddLibraryDialog } from "./_components/dialogs/add-library-dialog"
import { LockUnlockDialog } from "./_components/dialogs/lock-unlock-dialog"
import { PlatformNotificationDialog } from "./_components/dialogs/platform-notification-dialog"
import { toast } from "sonner"

export default function PlatformAdminDashboardPage() {
  // State for metrics and lists
  const [kpis, setKpis] = useState(initialPlatformKPIs)
  const [requests, setRequests] = useState<LibraryRequest[]>(initialPendingRequests)
  const [graceAndLocked, setGraceAndLocked] = useState<GraceAndLockedLibrary[]>(initialGraceAndLocked)
  const [expiringPlans, setExpiringPlans] = useState<ExpiringLibraryPlan[]>(initialExpiringPlans)
  const [payments, setPayments] = useState<PlatformPayment[]>(initialPlatformPayments)
  const [tickets, setTickets] = useState<PlatformSupportTicket[]>(initialSupportTickets)
  const [emailConns, setEmailConns] = useState<EmailConnectionHealth[]>(initialEmailConnections)
  const [libraries, setLibraries] = useState<PlatformLibraryRecord[]>(initialAllLibrariesList)

  // Filters
  const [dateRange, setDateRange] = useState<DateRangeOption>("this-month")
  const [comparePrevious, setComparePrevious] = useState(false)

  // Dialog states
  const [activeDialog, setActiveDialog] = useState<DialogType>(null)
  const [reviewingRequest, setReviewingRequest] = useState<LibraryRequest | null>(null)
  const [lockTargetLib, setLockTargetLib] = useState<GraceAndLockedLibrary | null>(null)

  // Handlers for approval queue
  const handleReviewRequest = (req: LibraryRequest) => {
    setReviewingRequest(req)
    setActiveDialog("review-request")
  }

  const handleApproveRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id))
    setKpis((prev) => ({
      ...prev,
      pendingApprovals: Math.max(0, prev.pendingApprovals - 1),
      totalLibraries: prev.totalLibraries + 1,
      activeLibraries: prev.activeLibraries + 1,
      lastUpdated: "Just now",
    }))
  }

  const handleRejectRequest = (id: string, reason: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id))
    setKpis((prev) => ({
      ...prev,
      pendingApprovals: Math.max(0, prev.pendingApprovals - 1),
      lastUpdated: "Just now",
    }))
  }

  // Handler for manual payment
  const handleRecordPayment = (newPay: Omit<PlatformPayment, "id">) => {
    const created: PlatformPayment = {
      ...newPay,
      id: `pay-${Date.now()}`,
    }
    setPayments((prev) => [created, ...prev])
    setKpis((prev) => ({
      ...prev,
      revenueThisMonth: prev.revenueThisMonth + newPay.amount,
      lastUpdated: "Just now",
    }))
  }

  // Handler for adding library manually
  const handleAddLibrary = (newLib: PlatformLibraryRecord) => {
    setLibraries((prev) => [newLib, ...prev])
    setKpis((prev) => ({
      ...prev,
      totalLibraries: prev.totalLibraries + 1,
      activeLibraries: prev.activeLibraries + 1,
      lastUpdated: "Just now",
    }))
  }

  // Handler for lock/unlock
  const handleOpenLockUnlock = (lib: GraceAndLockedLibrary) => {
    setLockTargetLib(lib)
    setActiveDialog("lock-unlock")
  }

  const handleToggleLockStatus = (
    id: string,
    action: "Lock" | "Unlock" | "Suspend",
    reason: string
  ) => {
    if (action === "Unlock") {
      setGraceAndLocked((prev) => prev.filter((l) => l.id !== id))
      setKpis((prev) => ({
        ...prev,
        lockedLibraries: Math.max(0, prev.lockedLibraries - 1),
        activeLibraries: prev.activeLibraries + 1,
        lastUpdated: "Just now",
      }))
    } else {
      setGraceAndLocked((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, status: action === "Suspend" ? "Suspended" : "Locked", reason } : l
        )
      )
      setKpis((prev) => ({
        ...prev,
        lockedLibraries: prev.lockedLibraries + 1,
        activeLibraries: Math.max(0, prev.activeLibraries - 1),
        lastUpdated: "Just now",
      }))
    }
  }

  // Quick reminder & extend triggers
  const handleSendReminder = (plan: ExpiringLibraryPlan) => {
    toast.success(`Payment link & grace warning dispatched to ${plan.ownerName} (${plan.phone})`)
  }

  const handleExtendPlan = (plan: ExpiringLibraryPlan) => {
    toast.info(`Opened 7-day grace extension dialog for ${plan.libraryName}`)
  }

  // Email diagnostic triggers
  const handleTestEmail = (conn: EmailConnectionHealth) => {
    toast.info(`Dispatched test verification ping to ${conn.connectedEmail}. Sent successfully!`)
  }

  const handleRequestReconnect = (conn: EmailConnectionHealth) => {
    toast.warning(`Re-authorization request dispatched to ${conn.libraryName} administrator.`)
  }

  const handleOpenTicket = (ticket: PlatformSupportTicket) => {
    toast.info(`Opening support workspace for ticket ${ticket.ticketNumber}...`)
  }

  return (
    <div className="flex flex-col gap-5 p-4 container max-w-7xl mx-auto">
      {/* 1. Header & Filter Toolbar */}
      <PlatformAdminHeader
        dateRange={dateRange}
        setDateRange={setDateRange}
        comparePrevious={comparePrevious}
        setComparePrevious={setComparePrevious}
        onOpenDialog={(diag) => {
          if (diag === "review-request" && requests.length > 0) {
            setReviewingRequest(requests[0])
          }
          setActiveDialog(diag)
        }}
        pendingCount={requests.length}
      />

      {/* 2. Top 8 Metrics Cards */}
      <PlatformMetricsGrid
        kpis={kpis}
        onSelectMetric={(key) => {
          if (key === "pending-approvals" && requests.length > 0) {
            setReviewingRequest(requests[0])
            setActiveDialog("review-request")
          } else if (key === "grace-period" || key === "locked-libraries") {
            if (graceAndLocked.length > 0) {
              setLockTargetLib(graceAndLocked[0])
              setActiveDialog("lock-unlock")
            }
          } else if (key === "failed-payments") {
            toast.error("2 failed Razorpay mandates. Follow up initiated with payment gateway.")
          }
        }}
      />

      {/* 3. Primary Charts Section (Growth & Revenue) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LibraryGrowthChart data={initialLibraryGrowthData} />
        <PlatformRevenueChart data={initialPlatformRevenueData} />
      </div>

      {/* 4. Secondary Breakdown Charts (Plan Distribution, Student Statuses, Expiry Forecast) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PlanDistributionChart data={initialPlanDistributionData} />
        <StudentStatusChart data={initialStudentStatusData} />
        <ExpiryForecastChart data={initialExpiryForecastData} />
      </div>

      {/* 5. Core Operational Queues (2-column grids) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PendingRequestsCard
          requests={requests}
          onReview={handleReviewRequest}
          onApprove={handleApproveRequest}
          onReject={(id) => handleRejectRequest(id, "Rejected via queue")}
          onViewAll={() => {
            if (requests.length > 0) handleReviewRequest(requests[0])
          }}
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
          payments={payments}
          onViewAll={() => toast.info("Displaying full financial audit ledger...")}
        />
      </div>

      {/* 7. Support & Email Integration Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SupportTicketsCard
          tickets={tickets}
          onOpenTicket={handleOpenTicket}
        />
        <EmailHealthCard
          connections={emailConns}
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

      <AddLibraryDialog
        open={activeDialog === "add-library"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        onAddLibrary={handleAddLibrary}
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

