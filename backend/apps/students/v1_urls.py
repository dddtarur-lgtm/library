"""URL routing for Section 8.1 and 8.2 Student APIs."""
from django.urls import path

from apps.students import v1_views
from apps.billing import v1_views as billing_v1_views
from apps.seats import v1_attendance_views as attendance_v1_views
from apps.books import v1_views as books_v1_views
from apps.notifications import v1_student_views as notify_v1_views

urlpatterns = [
    # 8.1 Home, profile, devices, settings
    path('home', v1_views.StudentHomeView.as_view(), name='student-home'),
    path('profile', v1_views.StudentProfileView.as_view(), name='student-profile'),
    path('devices', v1_views.StudentDevicesView.as_view(), name='student-devices'),
    path('devices/<uuid:pk>', v1_views.StudentDeviceDetailView.as_view(), name='student-device-detail'),
    path('settings', v1_views.StudentSettingsView.as_view(), name='student-settings'),
    path('account-deletion-requests', v1_views.StudentAccountDeletionRequestsView.as_view(), name='student-deletion-request'),
    path('library-card', v1_views.StudentLibraryCardView.as_view(), name='student-library-card'),

    # 8.2 Join a library
    path('libraries/<slug:slug>/join-eligibility', v1_views.StudentJoinEligibilityView.as_view(), name='student-join-eligibility'),
    path('join-requests', v1_views.StudentJoinRequestsView.as_view(), name='student-join-requests'),
    path('join-requests/<uuid:enrollment_id>', v1_views.StudentJoinRequestDetailView.as_view(), name='student-join-request-detail'),
    path('enrollment', v1_views.StudentEnrollmentView.as_view(), name='student-enrollment'),
    path('leave-requests', v1_views.StudentLeaveRequestsView.as_view(), name='student-leave-requests'),
    path('branch-change-requests', v1_views.StudentBranchChangeRequestsView.as_view(), name='student-branch-change-requests'),
    path('branch-change-requests/<uuid:pk>', v1_views.StudentBranchChangeRequestDetailView.as_view(), name='student-branch-change-request-detail'),

    # 8.3 Student plans, dues, payments & orders
    path('plans', v1_views.StudentPlansListView.as_view(), name='student-plans'),
    path('dues', v1_views.StudentDuesListView.as_view(), name='student-dues'),
    path('coupons/validate', v1_views.StudentCouponValidateView.as_view(), name='student-coupon-validate'),
    path('payments/orders', billing_v1_views.StudentPaymentOrdersView.as_view(), name='student-payment-orders'),
    path('payments/verify', billing_v1_views.StudentPaymentVerifyView.as_view(), name='student-payment-verify'),
    path('payments', billing_v1_views.StudentPaymentsListView.as_view(), name='student-payments-list'),
    path('payments/<uuid:pk>', billing_v1_views.StudentPaymentsListView.as_view(), name='student-payment-detail'),
    path('payments/<uuid:pk>/receipt', billing_v1_views.StudentPaymentReceiptView.as_view(), name='student-payment-receipt'),

    # 8.6 Student Seats & Change Requests
    path('seat', v1_views.StudentSeatView.as_view(), name='student-seat'),
    path('seat-change-requests', v1_views.StudentSeatChangeRequestsView.as_view(), name='student-seat-change-requests'),
    path('seat-change-requests/<uuid:pk>', v1_views.StudentSeatChangeRequestDetailView.as_view(), name='student-seat-change-request-detail'),

    # 8.7 Student Attendance (Flow 19.13)
    path('attendance/scan', attendance_v1_views.StudentAttendanceScanView.as_view(), name='student-attendance-scan'),
    path('attendance/today', attendance_v1_views.StudentAttendanceTodayView.as_view(), name='student-attendance-today'),
    path('attendance', attendance_v1_views.StudentAttendanceListView.as_view(), name='student-attendance-list'),
    path('holidays', v1_views.StudentHolidaysView.as_view(), name='student-holidays'),

    # 8.8 Student Study Sessions
    path('study/current', attendance_v1_views.StudentStudyCurrentView.as_view(), name='student-study-current'),
    path('study/sessions', attendance_v1_views.StudentStudySessionsView.as_view(), name='student-study-sessions'),
    path('study/sessions/<uuid:pk>/breaks', attendance_v1_views.StudentStudyBreaksView.as_view(), name='student-study-session-breaks'),
    path('study/sessions/<uuid:pk>/breaks/<uuid:break_id>/end', attendance_v1_views.StudentStudyBreakEndView.as_view(), name='student-study-session-break-end'),
    path('study/sessions/<uuid:pk>/end', attendance_v1_views.StudentStudySessionEndView.as_view(), name='student-study-session-end'),
    path('study/sessions/<uuid:pk>/heartbeat', attendance_v1_views.StudentStudyHeartbeatView.as_view(), name='student-study-session-heartbeat'),
    path('study/stats', attendance_v1_views.StudentStudyStatsView.as_view(), name='student-study-stats'),
    path('study/goals', attendance_v1_views.StudentStudyGoalsView.as_view(), name='student-study-goals'),
    path('study/leaderboard', attendance_v1_views.StudentStudyLeaderboardView.as_view(), name='student-study-leaderboard'),
    path('study/leaderboard-visibility', attendance_v1_views.StudentStudyLeaderboardVisibilityView.as_view(), name='student-study-leaderboard-visibility'),

    # 8.9 Student Books & Requests
    path('book-categories', books_v1_views.StudentBookCategoriesView.as_view(), name='student-book-categories'),
    path('books', books_v1_views.StudentBooksView.as_view(), name='student-books'),
    path('books/<uuid:pk>', books_v1_views.StudentBookDetailView.as_view(), name='student-book-detail'),
    path('books/<uuid:pk>/requests', books_v1_views.StudentBookRequestCreateView.as_view(), name='student-book-request-create'),
    path('book-requests', books_v1_views.StudentBookRequestsListView.as_view(), name='student-book-requests'),
    path('book-requests/<uuid:pk>', books_v1_views.StudentBookRequestDeleteView.as_view(), name='student-book-request-delete'),
    path('loans', books_v1_views.StudentBookLoansView.as_view(), name='student-loans'),
    path('loans/<uuid:pk>/renew', books_v1_views.StudentBookLoanRenewView.as_view(), name='student-loan-renew'),
    path('fines', books_v1_views.StudentBookFinesView.as_view(), name='student-fines'),

    # 8.4 Notifications & Dialogs
    path('notifications', notify_v1_views.StudentNotificationsListView.as_view(), name='student-notifications'),
    path('notifications/unread-count', notify_v1_views.StudentNotificationsUnreadCountView.as_view(), name='student-notifications-unread-count'),
    path('notifications/<uuid:id>/seen', notify_v1_views.StudentNotificationSeenView.as_view(), name='student-notification-seen'),
    path('notifications/seen-all', notify_v1_views.StudentNotificationSeenAllView.as_view(), name='student-notification-seen-all'),
    path('notifications/<uuid:id>/clicked', notify_v1_views.StudentNotificationClickedView.as_view(), name='student-notification-clicked'),
    path('notifications/<uuid:id>/dismissed', notify_v1_views.StudentNotificationDismissedView.as_view(), name='student-notification-dismissed'),
    path('dialogs/pending', notify_v1_views.StudentDialogsPendingView.as_view(), name='student-dialogs-pending'),
    path('dialogs/<uuid:id>/shown', notify_v1_views.StudentDialogShownView.as_view(), name='student-dialog-shown'),

    # 8.10 Feedback & Referral
    path('feedback-tickets', v1_views.StudentFeedbackTicketsView.as_view(), name='student-feedback-tickets'),
    path('feedback-tickets/<uuid:pk>', v1_views.StudentFeedbackTicketDetailView.as_view(), name='student-feedback-ticket-detail'),
    path('feedback-tickets/<uuid:pk>/messages', v1_views.StudentFeedbackTicketMessagesView.as_view(), name='student-feedback-ticket-messages'),
    path('referral', v1_views.StudentReferralView.as_view(), name='student-referral'),
    path('referral/apply', v1_views.StudentReferralApplyView.as_view(), name='student-referral-apply'),
]

