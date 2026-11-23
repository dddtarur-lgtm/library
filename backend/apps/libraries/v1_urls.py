"""Unified URL routing for Section 9 and Section 10 Library Panel APIs."""
from django.urls import path

from apps.libraries import v1_views
from apps.students import library_v1_views
from apps.billing import v1_views as billing_v1_views
from apps.seats import v1_views as seats_v1_views
from apps.seats import v1_attendance_views as attendance_v1_views
from apps.books import v1_views as books_v1_views
from apps.notifications import v1_library_views as notify_v1_views
from apps.public import v1_editor_views as editor_v1_views
from apps.libraries import v1_email_views as email_v1_views
from apps.libraries import v1_leads_views as leads_v1_views
from apps.libraries import v1_feedback_views as feedback_v1_views
from apps.libraries import v1_reports_views as reports_v1_views
from apps.libraries import v1_platform_billing_views as platform_billing_v1_views

urlpatterns = [
    # 9.1 Session, search, bell inbox
    path('me', v1_views.LibraryMeView.as_view(), name='library-v1-me'),
    path('access-state', v1_views.LibraryAccessStateView.as_view(), name='library-v1-access-state'),
    path('search', v1_views.LibrarySearchView.as_view(), name='library-v1-search'),
    path('inbox', v1_views.LibraryInboxView.as_view(), name='library-v1-inbox'),
    path('inbox/unread-count', v1_views.LibraryInboxUnreadCountView.as_view(), name='library-v1-inbox-unread-count'),
    path('inbox/<uuid:pk>/read', v1_views.LibraryInboxItemReadView.as_view(), name='library-v1-inbox-item-read'),
    path('inbox/read-all', v1_views.LibraryInboxView.as_view(), name='library-v1-inbox-read-all'),

    # 9.2 Dashboard
    path('dashboard', v1_views.LibraryDashboardView.as_view(), name='library-v1-dashboard'),
    path('counts', v1_views.LibraryCountsView.as_view(), name='library-v1-counts'),

    # 9.3 Setup progress
    path('setup/progress', v1_views.LibrarySetupProgressView.as_view(), name='library-v1-setup-progress'),

    # 9.4 Profile & Settings
    path('profile', v1_views.LibraryProfileView.as_view(), name='library-v1-profile'),
    path('settings/student-rules', v1_views.LibraryStudentRulesView.as_view(), name='library-v1-settings-student-rules'),

    # 9.5 Branches
    path('branches', v1_views.LibraryBranchesView.as_view(), name='library-v1-branches'),
    path('branches/<uuid:pk>', v1_views.LibraryBranchDetailView.as_view(), name='library-v1-branch-detail'),
    path('branches/<uuid:pk>/attendance-rules', v1_views.LibraryBranchAttendanceRulesView.as_view(), name='library-v1-branch-attendance-rules'),
    path('branches/<uuid:pk>/pause', v1_views.LibraryBranchPauseResumeView.as_view(), name='library-v1-branch-pause'),
    path('branches/<uuid:pk>/resume', v1_views.LibraryBranchPauseResumeView.as_view(), name='library-v1-branch-resume'),

    # 9.6 Team & Permissions
    path('team/members', v1_views.LibraryTeamMembersView.as_view(), name='library-v1-team-members'),
    path('team/slots', v1_views.LibraryTeamSlotsView.as_view(), name='library-v1-team-slots'),
    path('team/members/<uuid:pk>/permissions', v1_views.LibraryTeamMemberPermissionsView.as_view(), name='library-v1-team-permissions'),
    path('team/templates', v1_views.LibraryTeamTemplatesView.as_view(), name='library-v1-team-templates'),
    path('team/transfer-ownership', v1_views.LibraryTransferOwnershipView.as_view(), name='library-v1-team-transfer-ownership'),
    path('permissions', v1_views.LibraryPermissionsCatalogView.as_view(), name='library-v1-permissions-catalog'),

    # 10.1 Students
    path('students', library_v1_views.LibraryStudentsView.as_view(), name='library-v1-students'),
    path('students/summary', library_v1_views.LibraryStudentSummaryView.as_view(), name='library-v1-students-summary'),
    path('students/<uuid:pk>', library_v1_views.LibraryStudentDetailView.as_view(), name='library-v1-student-detail'),
    path('students/<uuid:pk>/status', library_v1_views.LibraryStudentStatusUpdateView.as_view(), name='library-v1-student-status'),
    path('students/<uuid:pk>/branch', library_v1_views.LibraryStudentBranchTransferView.as_view(), name='library-v1-student-branch'),
    path('students/<uuid:pk>/notes', library_v1_views.LibraryStudentNotesView.as_view(), name='library-v1-student-notes'),
    path('students/<uuid:pk>/card', library_v1_views.LibraryStudentCardView.as_view(), name='library-v1-student-card'),
    path('students/<uuid:pk>/delete', library_v1_views.LibraryStudentDeleteView.as_view(), name='library-v1-student-delete'),
    path('students/<uuid:pk>/memberships', library_v1_views.LibraryStudentMembershipsAssignView.as_view(), name='library-v1-student-memberships-assign'),

    # 10.2 Join Requests
    path('join-requests', library_v1_views.LibraryJoinRequestsView.as_view(), name='library-v1-join-requests'),
    path('join-requests/<uuid:pk>/approve', library_v1_views.LibraryJoinRequestApproveView.as_view(), name='library-v1-join-request-approve'),
    path('join-requests/<uuid:pk>/reject', library_v1_views.LibraryJoinRequestRejectView.as_view(), name='library-v1-join-request-reject'),
    path('join-requests/<uuid:pk>/request-info', library_v1_views.LibraryJoinRequestRequestInfoView.as_view(), name='library-v1-join-request-request-info'),

    # 10.3 Branch change and leave requests
    path('branch-change-requests', library_v1_views.LibraryBranchChangeRequestsListView.as_view(), name='library-v1-branch-change-requests'),
    path('branch-change-requests/<uuid:pk>/approve', library_v1_views.LibraryBranchChangeRequestActionView.as_view(), name='library-v1-branch-change-request-approve'),
    path('branch-change-requests/<uuid:pk>/reject', library_v1_views.LibraryBranchChangeRequestActionView.as_view(), name='library-v1-branch-change-request-reject'),
    path('leave-requests', library_v1_views.LibraryLeaveRequestsListView.as_view(), name='library-v1-leave-requests'),
    path('leave-requests/<uuid:pk>/approve', library_v1_views.LibraryLeaveRequestActionView.as_view(), name='library-v1-leave-request-approve'),
    path('leave-requests/<uuid:pk>/reject', library_v1_views.LibraryLeaveRequestActionView.as_view(), name='library-v1-leave-request-reject'),

    # 10.4 Plans & Memberships
    path('plans', library_v1_views.LibraryPlansView.as_view(), name='library-v1-plans'),
    path('plans/<uuid:pk>', library_v1_views.LibraryPlanDetailView.as_view(), name='library-v1-plan-detail'),
    path('memberships/<uuid:pk>/pause', library_v1_views.LibraryMembershipPauseResumeView.as_view(), name='library-v1-membership-pause'),
    path('memberships/<uuid:pk>/resume', library_v1_views.LibraryMembershipPauseResumeView.as_view(), name='library-v1-membership-resume'),

    # 10.6 Coupons
    path('coupons', library_v1_views.LibraryCouponsView.as_view(), name='library-v1-coupons'),

    # 11.1 Fees overview & charts
    path('fees/summary', billing_v1_views.LibraryFeesSummaryView.as_view(), name='library-v1-fees-summary'),
    path('fees/charts', billing_v1_views.LibraryFeesChartsView.as_view(), name='library-v1-fees-charts'),

    # 11.2 Payments
    path('payments', billing_v1_views.LibraryPaymentsView.as_view(), name='library-v1-payments'),
    path('payments/<uuid:pk>', billing_v1_views.LibraryPaymentDetailView.as_view(), name='library-v1-payment-detail'),
    path('payments/<uuid:pk>/cancel', billing_v1_views.LibraryPaymentCancelView.as_view(), name='library-v1-payment-cancel'),
    path('payments/<uuid:pk>/refunds', billing_v1_views.LibraryPaymentRefundsView.as_view(), name='library-v1-payment-refunds'),
    path('payments/<uuid:pk>/receipt', billing_v1_views.LibraryPaymentReceiptView.as_view(), name='library-v1-payment-receipt'),
    path('payments/<uuid:pk>/receipt/send', billing_v1_views.LibraryPaymentReceiptSendView.as_view(), name='library-v1-payment-receipt-send'),
    path('payments/links', billing_v1_views.LibraryPaymentLinksView.as_view(), name='library-v1-payment-links'),
    path('refunds', billing_v1_views.LibraryRefundsView.as_view(), name='library-v1-refunds'),
    path('payments/export', billing_v1_views.LibraryPaymentsExportView.as_view(), name='library-v1-payments-export'),

    # 11.3 Dues & charges
    path('dues', billing_v1_views.LibraryDuesView.as_view(), name='library-v1-dues'),
    path('charges', billing_v1_views.LibraryChargesView.as_view(), name='library-v1-charges'),
    path('dues/<uuid:pk>', billing_v1_views.LibraryDueDetailView.as_view(), name='library-v1-due-detail'),
    path('dues/<uuid:pk>/waive', billing_v1_views.LibraryDueWaiveView.as_view(), name='library-v1-due-waive'),
    path('dues/remind/preview', billing_v1_views.LibraryDuesRemindPreviewView.as_view(), name='library-v1-dues-remind-preview'),
    path('dues/remind', billing_v1_views.LibraryDuesRemindView.as_view(), name='library-v1-dues-remind'),

    # 11.4 Day book
    path('day-book', billing_v1_views.LibraryDayBookView.as_view(), name='library-v1-day-book'),
    path('day-book/opening', billing_v1_views.LibraryDayBookOpeningView.as_view(), name='library-v1-day-book-opening'),
    path('day-book/close', billing_v1_views.LibraryDayBookCloseView.as_view(), name='library-v1-day-book-close'),
    path('day-book/<uuid:pk>/unlock', billing_v1_views.LibraryDayBookUnlockView.as_view(), name='library-v1-day-book-unlock'),
    path('day-book/history', billing_v1_views.LibraryDayBookHistoryView.as_view(), name='library-v1-day-book-history'),

    # 11.5 Invoices & GST
    path('invoices', billing_v1_views.LibraryInvoicesView.as_view(), name='library-v1-invoices'),
    path('invoices/<uuid:pk>', billing_v1_views.LibraryInvoiceDetailView.as_view(), name='library-v1-invoice-detail'),
    path('invoices/<uuid:pk>/resend', billing_v1_views.LibraryInvoiceResendView.as_view(), name='library-v1-invoice-resend'),
    path('invoices/export', billing_v1_views.LibraryInvoicesExportView.as_view(), name='library-v1-invoices-export'),
    path('invoices/gst-summary', billing_v1_views.LibraryInvoicesGSTSummaryView.as_view(), name='library-v1-invoices-gst-summary'),

    # 12.1 Seats summary, floors & rows
    path('seats/summary', seats_v1_views.LibrarySeatsSummaryView.as_view(), name='library-v1-seats-summary'),
    path('floors', seats_v1_views.LibraryFloorsView.as_view(), name='library-v1-floors'),
    path('floors/<uuid:pk>', seats_v1_views.LibraryFloorDetailView.as_view(), name='library-v1-floor-detail'),
    path('floors/order', seats_v1_views.LibraryFloorsOrderView.as_view(), name='library-v1-floors-order'),
    path('floors/<uuid:pk>/map', seats_v1_views.LibraryFloorMapView.as_view(), name='library-v1-floor-map'),
    path('floors/<uuid:pk>/layout', seats_v1_views.LibraryFloorLayoutUpdateView.as_view(), name='library-v1-floor-layout'),
    path('floors/<uuid:pk>/rows', seats_v1_views.LibraryFloorRowsView.as_view(), name='library-v1-floor-rows'),
    path('rows/<uuid:pk>', seats_v1_views.LibraryRowDetailView.as_view(), name='library-v1-row-detail'),

    # 12.2 Seats, categories & shifts
    path('seats', seats_v1_views.LibrarySeatsView.as_view(), name='library-v1-seats'),
    path('seats/bulk', seats_v1_views.LibrarySeatsBulkCreateView.as_view(), name='library-v1-seats-bulk'),
    path('seats/<uuid:pk>', seats_v1_views.LibrarySeatDetailView.as_view(), name='library-v1-seat-detail'),
    path('seats/<uuid:pk>/block', seats_v1_views.LibrarySeatBlockView.as_view(), name='library-v1-seat-block'),
    path('seats/<uuid:pk>/unblock', seats_v1_views.LibrarySeatUnblockView.as_view(), name='library-v1-seat-unblock'),
    path('seat-categories', seats_v1_views.LibrarySeatCategoriesView.as_view(), name='library-v1-seat-categories'),
    path('seat-categories/<uuid:pk>', seats_v1_views.LibrarySeatCategoryDetailView.as_view(), name='library-v1-seat-category-detail'),
    path('shifts', seats_v1_views.LibraryShiftsView.as_view(), name='library-v1-shifts'),
    path('shifts/<uuid:pk>', seats_v1_views.LibraryShiftDetailView.as_view(), name='library-v1-shift-detail'),

    # 12.3 Allocations, reservations, waiting list & change requests
    path('seats/unassigned-students', seats_v1_views.LibrarySeatsUnassignedStudentsView.as_view(), name='library-v1-seats-unassigned-students'),
    path('seat-allocations', seats_v1_views.LibrarySeatAllocationsView.as_view(), name='library-v1-seat-allocations'),
    path('seat-allocations/<uuid:pk>/change', seats_v1_views.LibrarySeatAllocationChangeView.as_view(), name='library-v1-seat-allocation-change'),
    path('seat-allocations/<uuid:pk>/release', seats_v1_views.LibrarySeatAllocationReleaseView.as_view(), name='library-v1-seat-allocation-release'),
    path('seats/<uuid:pk>/history', seats_v1_views.LibrarySeatHistoryView.as_view(), name='library-v1-seat-history-detail'),
    path('seat-history', seats_v1_views.LibrarySeatHistoryView.as_view(), name='library-v1-seat-history'),
    path('seat-reservations', seats_v1_views.LibrarySeatReservationsView.as_view(), name='library-v1-seat-reservations'),
    path('seat-reservations/<uuid:pk>', seats_v1_views.LibrarySeatReservationDeleteView.as_view(), name='library-v1-seat-reservation-delete'),
    path('seat-reservations/<uuid:pk>/convert', seats_v1_views.LibrarySeatReservationConvertView.as_view(), name='library-v1-seat-reservation-convert'),
    path('seat-waiting-list', seats_v1_views.LibrarySeatWaitingListView.as_view(), name='library-v1-seat-waiting-list'),
    path('seat-waiting-list/<uuid:pk>/offer', seats_v1_views.LibrarySeatWaitingListOfferView.as_view(), name='library-v1-seat-waiting-list-offer'),
    path('seat-waiting-list/<uuid:pk>', seats_v1_views.LibrarySeatWaitingListDeleteView.as_view(), name='library-v1-seat-waiting-list-delete'),
    path('seat-change-requests', seats_v1_views.LibrarySeatChangeRequestsView.as_view(), name='library-v1-seat-change-requests'),
    path('seat-change-requests/<uuid:pk>/approve', seats_v1_views.LibrarySeatChangeRequestApproveView.as_view(), name='library-v1-seat-change-request-approve'),
    path('seat-change-requests/<uuid:pk>/reject', seats_v1_views.LibrarySeatChangeRequestRejectView.as_view(), name='library-v1-seat-change-request-reject'),

    # 12.4 Lockers
    path('lockers', seats_v1_views.LibraryLockersView.as_view(), name='library-v1-lockers'),
    path('lockers/<uuid:pk>', seats_v1_views.LibraryLockerDetailView.as_view(), name='library-v1-locker-detail'),
    path('lockers/<uuid:pk>/assign', seats_v1_views.LibraryLockerAssignView.as_view(), name='library-v1-locker-assign'),
    path('lockers/<uuid:pk>/release', seats_v1_views.LibraryLockerReleaseView.as_view(), name='library-v1-locker-release'),

    # 13.1 Attendance QR codes
    path('qr-codes', attendance_v1_views.LibraryQRCodesView.as_view(), name='library-v1-qr-codes'),
    path('qr-codes/<uuid:pk>', attendance_v1_views.LibraryQRCodeDetailView.as_view(), name='library-v1-qr-code-detail'),
    path('qr-codes/<uuid:pk>/regenerate', attendance_v1_views.LibraryQRCodeRegenerateView.as_view(), name='library-v1-qr-code-regenerate'),
    path('qr-codes/<uuid:pk>/disable', attendance_v1_views.LibraryQRCodeDisableView.as_view(), name='library-v1-qr-code-disable'),
    path('qr-codes/<uuid:pk>/poster', attendance_v1_views.LibraryQRCodePosterView.as_view(), name='library-v1-qr-code-poster'),
    path('qr-codes/<uuid:pk>/stats', attendance_v1_views.LibraryQRCodeStatsView.as_view(), name='library-v1-qr-code-stats'),
    path('qr-codes/test-scan', attendance_v1_views.LibraryQRCodeTestScanView.as_view(), name='library-v1-qr-code-test-scan'),

    # 13.2 Live Attendance & Register
    path('attendance/live', attendance_v1_views.LibraryAttendanceLiveView.as_view(), name='library-v1-attendance-live'),
    path('attendance/hourly', attendance_v1_views.LibraryAttendanceHourlyView.as_view(), name='library-v1-attendance-hourly'),
    path('attendance/register', attendance_v1_views.LibraryAttendanceRegisterView.as_view(), name='library-v1-attendance-register'),
    path('attendance/insights', attendance_v1_views.LibraryAttendanceInsightsView.as_view(), name='library-v1-attendance-insights'),
    path('attendance/<uuid:pk>', attendance_v1_views.LibraryAttendanceDetailView.as_view(), name='library-v1-attendance-detail'),

    # 13.3 Manual marking & correction
    path('attendance/manual', attendance_v1_views.LibraryAttendanceManualView.as_view(), name='library-v1-attendance-manual'),
    path('attendance/<uuid:pk>/check-out', attendance_v1_views.LibraryAttendanceCheckOutView.as_view(), name='library-v1-attendance-checkout'),
    path('attendance/remind-absent', attendance_v1_views.LibraryAttendanceRemindAbsentView.as_view(), name='library-v1-attendance-remind-absent'),

    # 13.4 Flagged scans & holidays
    path('scan-attempts', attendance_v1_views.LibraryScanAttemptsView.as_view(), name='library-v1-scan-attempts'),
    path('scan-attempts/bulk-review', attendance_v1_views.LibraryScanAttemptsBulkReviewView.as_view(), name='library-v1-scan-attempts-bulk-review'),
    path('scan-attempts/<uuid:pk>', attendance_v1_views.LibraryScanAttemptDetailView.as_view(), name='library-v1-scan-attempt-detail'),
    path('scan-attempts/<uuid:pk>/review', attendance_v1_views.LibraryScanAttemptReviewView.as_view(), name='library-v1-scan-attempt-review'),
    path('holidays', attendance_v1_views.LibraryHolidaysView.as_view(), name='library-v1-holidays'),
    path('holidays/<uuid:pk>', attendance_v1_views.LibraryHolidayDetailView.as_view(), name='library-v1-holiday-detail'),

    # 13.5 Study sessions (library view)
    path('study/overview', attendance_v1_views.LibraryStudyOverviewView.as_view(), name='library-v1-study-overview'),
    path('study/leaderboard', attendance_v1_views.LibraryStudyLeaderboardView.as_view(), name='library-v1-study-leaderboard'),
    path('study/sessions', attendance_v1_views.LibraryStudySessionsView.as_view(), name='library-v1-study-sessions'),
    path('study/sessions/<uuid:pk>', attendance_v1_views.LibraryStudySessionDetailView.as_view(), name='library-v1-study-session-detail'),

    # 14.1 Books Catalog
    path('books/summary', books_v1_views.LibraryBooksSummaryView.as_view(), name='library-v1-books-summary'),
    path('book-categories', books_v1_views.LibraryBookCategoriesView.as_view(), name='library-v1-book-categories'),
    path('book-categories/<uuid:pk>', books_v1_views.LibraryBookCategoryDetailView.as_view(), name='library-v1-book-category-detail'),
    path('books', books_v1_views.LibraryBooksView.as_view(), name='library-v1-books'),
    path('books/labels', books_v1_views.LibraryBooksLabelsView.as_view(), name='library-v1-books-labels'),
    path('books/<uuid:pk>', books_v1_views.LibraryBookDetailView.as_view(), name='library-v1-book-detail'),
    path('books/<uuid:pk>/copies', books_v1_views.LibraryBookCopiesView.as_view(), name='library-v1-book-copies'),
    path('book-copies/lookup', books_v1_views.LibraryBookCopyLookupView.as_view(), name='library-v1-book-copy-lookup'),
    path('book-copies/<uuid:pk>', books_v1_views.LibraryBookCopyDetailView.as_view(), name='library-v1-book-copy-detail'),

    # 14.2 Desk mode: issue, return, renew (Flow 19.12)
    path('desk/student-lookup', books_v1_views.LibraryDeskStudentLookupView.as_view(), name='library-v1-desk-student-lookup'),
    path('loans', books_v1_views.LibraryLoansView.as_view(), name='library-v1-loans'),
    path('loans/remind-overdue', books_v1_views.LibraryLoansRemindOverdueView.as_view(), name='library-v1-loans-remind-overdue'),
    path('loans/<uuid:pk>/return', books_v1_views.LibraryLoanReturnView.as_view(), name='library-v1-loan-return'),
    path('loans/<uuid:pk>/renew', books_v1_views.LibraryLoanRenewView.as_view(), name='library-v1-loan-renew'),
    path('loans/<uuid:pk>/remind', books_v1_views.LibraryLoanRemindView.as_view(), name='library-v1-loan-remind'),

    # 14.3 Requests, fines & stock audit
    path('book-requests', books_v1_views.LibraryBookRequestsView.as_view(), name='library-v1-book-requests'),
    path('book-requests/<uuid:pk>/ready', books_v1_views.LibraryBookRequestReadyView.as_view(), name='library-v1-book-request-ready'),
    path('book-requests/<uuid:pk>/reject', books_v1_views.LibraryBookRequestRejectView.as_view(), name='library-v1-book-request-reject'),
    path('book-requests/<uuid:pk>/collected', books_v1_views.LibraryBookRequestCollectedView.as_view(), name='library-v1-book-request-collected'),
    path('book-fines', books_v1_views.LibraryBookFinesView.as_view(), name='library-v1-book-fines'),
    path('book-fines/<uuid:pk>/pay', books_v1_views.LibraryBookFinePayView.as_view(), name='library-v1-book-fine-pay'),
    path('book-fines/<uuid:pk>/waive', books_v1_views.LibraryBookFineWaiveView.as_view(), name='library-v1-book-fine-waive'),
    path('stock-audits', books_v1_views.LibraryStockAuditsView.as_view(), name='library-v1-stock-audits'),
    path('stock-audits/<uuid:pk>', books_v1_views.LibraryStockAuditDetailView.as_view(), name='library-v1-stock-audit-detail'),
    path('stock-audits/<uuid:pk>/scans', books_v1_views.LibraryStockAuditScansView.as_view(), name='library-v1-stock-audit-scans'),
    path('stock-audits/<uuid:pk>/complete', books_v1_views.LibraryStockAuditCompleteView.as_view(), name='library-v1-stock-audit-complete'),

    # 15.1 Notifications
    path('notifications/audience-preview', notify_v1_views.LibraryNotificationAudiencePreviewView.as_view(), name='library-v1-notifications-audience-preview'),
    path('notifications', notify_v1_views.LibraryNotificationsListView.as_view(), name='library-v1-notifications-list'),
    path('notifications/kpis', notify_v1_views.LibraryNotificationsKpisView.as_view(), name='library-v1-notifications-kpis'),
    path('notifications/<uuid:id>', notify_v1_views.LibraryNotificationDetailView.as_view(), name='library-v1-notification-detail'),
    path('notifications/<uuid:id>/send', notify_v1_views.LibraryNotificationSendView.as_view(), name='library-v1-notification-send'),
    path('notifications/<uuid:id>/pause', notify_v1_views.LibraryNotificationPauseView.as_view(), name='library-v1-notification-pause'),
    path('notifications/<uuid:id>/resume', notify_v1_views.LibraryNotificationResumeView.as_view(), name='library-v1-notification-resume'),
    path('notifications/<uuid:id>/cancel', notify_v1_views.LibraryNotificationCancelView.as_view(), name='library-v1-notification-cancel'),

    # 15.2 Public Page Editor
    path('page', editor_v1_views.LibraryPageView.as_view(), name='library-v1-page'),
    path('page/sections', editor_v1_views.LibraryPageSectionsView.as_view(), name='library-v1-page-sections'),
    path('page/publish', editor_v1_views.LibraryPagePublishView.as_view(), name='library-v1-page-publish'),
    path('page/unpublish', editor_v1_views.LibraryPageUnpublishView.as_view(), name='library-v1-page-unpublish'),
    path('page/preview-token', editor_v1_views.LibraryPagePreviewTokenView.as_view(), name='library-v1-page-preview-token'),
    path('page/facilities', editor_v1_views.LibraryPageFacilitiesView.as_view(), name='library-v1-page-facilities'),
    path('page/facilities/<uuid:id>', editor_v1_views.LibraryPageFacilityDetailView.as_view(), name='library-v1-page-facility-detail'),
    path('page/banners', editor_v1_views.LibraryPageBannersView.as_view(), name='library-v1-page-banners'),
    path('page/banners/<uuid:id>', editor_v1_views.LibraryPageBannerDetailView.as_view(), name='library-v1-page-banner-detail'),
    path('page/gallery', editor_v1_views.LibraryPageGalleryView.as_view(), name='library-v1-page-gallery'),
    path('page/gallery/<uuid:id>', editor_v1_views.LibraryPageGalleryDetailView.as_view(), name='library-v1-page-gallery-detail'),
    path('page/achievers', editor_v1_views.LibraryPageAchieversView.as_view(), name='library-v1-page-achievers'),
    path('page/achievers/<uuid:id>', editor_v1_views.LibraryPageAchieverDetailView.as_view(), name='library-v1-page-achiever-detail'),
    path('page/notices', editor_v1_views.LibraryPageNoticesView.as_view(), name='library-v1-page-notices'),
    path('page/notices/<uuid:id>', editor_v1_views.LibraryPageNoticeDetailView.as_view(), name='library-v1-page-notice-detail'),

    # 15.3 Email Connections, Templates & Usage
    path('email/connections', email_v1_views.LibraryEmailConnectionsView.as_view(), name='library-v1-email-connections'),
    path('email/connect/start', email_v1_views.LibraryEmailConnectStartView.as_view(), name='library-v1-email-connect-start'),
    path('email/connections/start', email_v1_views.LibraryEmailConnectStartView.as_view(), name='library-v1-email-connections-start'),
    path('email/connections/smtp', email_v1_views.LibraryEmailConnectionsSmtpView.as_view(), name='library-v1-email-connections-smtp'),
    path('email/connections/<uuid:id>', email_v1_views.LibraryEmailConnectionDetailView.as_view(), name='library-v1-email-connection-detail'),
    path('email/connections/<uuid:id>/test', email_v1_views.LibraryEmailConnectionTestView.as_view(), name='library-v1-email-connection-test'),
    path('email/connections/<uuid:id>/reconnect', email_v1_views.LibraryEmailConnectionReconnectView.as_view(), name='library-v1-email-connection-reconnect'),
    path('email/sending-mode', email_v1_views.LibraryEmailSendingModeView.as_view(), name='library-v1-email-sending-mode'),
    path('email/templates', email_v1_views.LibraryEmailTemplatesView.as_view(), name='library-v1-email-templates'),
    path('email/templates/<str:code>', email_v1_views.LibraryEmailTemplateDetailView.as_view(), name='library-v1-email-template-detail'),
    path('email/templates/<str:code>/preview', email_v1_views.LibraryEmailTemplatePreviewView.as_view(), name='library-v1-email-template-preview'),
    path('email/log', email_v1_views.LibraryEmailLogView.as_view(), name='library-v1-email-log'),
    path('email/log/<uuid:id>/resend', email_v1_views.LibraryEmailLogResendView.as_view(), name='library-v1-email-log-resend'),
    path('email/usage', email_v1_views.LibraryEmailUsageView.as_view(), name='library-v1-email-usage'),

    # 16.1 Leads (Enquiries)
    path('leads/stats', leads_v1_views.LibraryLeadsStatsView.as_view(), name='library-v1-leads-stats'),
    path('leads', leads_v1_views.LibraryLeadsListView.as_view(), name='library-v1-leads'),
    path('leads/<uuid:id>', leads_v1_views.LibraryLeadDetailView.as_view(), name='library-v1-lead-detail'),
    path('leads/<uuid:id>/notes', leads_v1_views.LibraryLeadNotesView.as_view(), name='library-v1-lead-notes'),
    path('leads/<uuid:id>/convert', leads_v1_views.LibraryLeadConvertView.as_view(), name='library-v1-lead-convert'),

    # 16.2 Student Feedback & Complaints
    path('feedback-tickets', feedback_v1_views.LibraryFeedbackTicketsListView.as_view(), name='library-v1-feedback-tickets'),
    path('feedback-tickets/<uuid:id>', feedback_v1_views.LibraryFeedbackTicketDetailView.as_view(), name='library-v1-feedback-ticket-detail'),
    path('feedback-tickets/<uuid:id>/messages', feedback_v1_views.LibraryFeedbackTicketMessagesView.as_view(), name='library-v1-feedback-ticket-messages'),

    # 16.3 Reports & 16.4 Activity Logs
    path('reports/catalog', reports_v1_views.LibraryReportsCatalogView.as_view(), name='library-v1-reports-catalog'),
    path('reports/owner-summary', reports_v1_views.LibraryReportsOwnerSummaryView.as_view(), name='library-v1-reports-owner-summary'),
    path('reports/owner-summary/send', reports_v1_views.LibraryReportsOwnerSummaryView.as_view(), name='library-v1-reports-owner-summary-send'),
    path('reports/schedules', reports_v1_views.LibraryReportSchedulesView.as_view(), name='library-v1-reports-schedules'),
    path('reports/schedules/<uuid:id>', reports_v1_views.LibraryReportScheduleDetailView.as_view(), name='library-v1-reports-schedule-detail'),
    path('reports/schedules/<uuid:id>/send-now', reports_v1_views.LibraryReportScheduleSendNowView.as_view(), name='library-v1-reports-schedule-send-now'),
    path('reports/<str:code>', reports_v1_views.LibraryReportDetailView.as_view(), name='library-v1-reports-detail'),
    path('reports/<str:code>/export', reports_v1_views.LibraryReportExportView.as_view(), name='library-v1-reports-export'),
    path('exports', reports_v1_views.LibraryExportsListView.as_view(), name='library-v1-exports'),
    path('exports/<uuid:id>', reports_v1_views.LibraryExportDetailView.as_view(), name='library-v1-export-detail'),
    path('activity', reports_v1_views.LibraryActivityLogView.as_view(), name='library-v1-activity'),

    # 16.5 Platform Billing for Libraries
    path('billing/plans', platform_billing_v1_views.LibraryBillingPlansView.as_view(), name='library-v1-billing-plans'),
    path('billing/preview', platform_billing_v1_views.LibraryBillingPreviewView.as_view(), name='library-v1-billing-preview'),
    path('billing/trial', platform_billing_v1_views.LibraryBillingTrialView.as_view(), name='library-v1-billing-trial'),
    path('billing/orders', platform_billing_v1_views.LibraryBillingOrdersView.as_view(), name='library-v1-billing-orders'),
    path('billing/verify', platform_billing_v1_views.LibraryBillingVerifyView.as_view(), name='library-v1-billing-verify'),
    path('billing/auto-renew', platform_billing_v1_views.LibraryBillingAutoRenewView.as_view(), name='library-v1-billing-auto-renew'),
    path('billing/invoices', platform_billing_v1_views.LibraryBillingInvoicesView.as_view(), name='library-v1-billing-invoices'),
    path('billing/payments', platform_billing_v1_views.LibraryBillingPaymentsView.as_view(), name='library-v1-billing-payments'),
    path('billing/addons', platform_billing_v1_views.LibraryBillingAddonsView.as_view(), name='library-v1-billing-addons'),
    path('billing/addons/orders', platform_billing_v1_views.LibraryBillingAddonsView.as_view(), name='library-v1-billing-addons-orders'),

    # 16.6 Support Tickets (Library Panel)
    path('support/tickets', feedback_v1_views.LibrarySupportTicketsView.as_view(), name='library-v1-support-tickets'),
    path('support/tickets/<uuid:id>', feedback_v1_views.LibrarySupportTicketDetailView.as_view(), name='library-v1-support-ticket-detail'),
    path('support/tickets/<uuid:id>/messages', feedback_v1_views.LibrarySupportTicketMessagesView.as_view(), name='library-v1-support-ticket-messages'),
]
