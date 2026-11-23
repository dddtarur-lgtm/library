"""Unified URL routing for Section 17 Platform Super Admin APIs."""
from django.urls import path
from apps.platform_admin import v1_platform_views as v1_views

raw_routes = [
    # 17.1 Dashboard and analytics
    ('dashboard', v1_views.PlatformDashboardView.as_view(), 'platform-v1-dashboard'),
    ('analytics', v1_views.PlatformAnalyticsView.as_view(), 'platform-v1-analytics'),
    ('activity', v1_views.PlatformActivityView.as_view(), 'platform-v1-activity'),

    # 17.2 Library lifecycle
    ('libraries', v1_views.PlatformLibrariesListView.as_view(), 'platform-v1-libraries'),
    ('libraries/<uuid:id>', v1_views.PlatformLibraryDetailView.as_view(), 'platform-v1-library-detail'),
    ('libraries/<uuid:id>/approve', v1_views.PlatformLibraryApproveView.as_view(), 'platform-v1-library-approve'),
    ('libraries/<uuid:id>/reject', v1_views.PlatformLibraryRejectView.as_view(), 'platform-v1-library-reject'),
    ('libraries/<uuid:id>/request-info', v1_views.PlatformLibraryRequestInfoView.as_view(), 'platform-v1-library-request-info'),
    ('libraries/<uuid:id>/suspend', v1_views.PlatformLibrarySuspendView.as_view(), 'platform-v1-library-suspend'),
    ('libraries/<uuid:id>/reactivate', v1_views.PlatformLibraryReactivateView.as_view(), 'platform-v1-library-reactivate'),
    ('libraries/<uuid:id>/impersonate', v1_views.PlatformLibraryImpersonateView.as_view(), 'platform-v1-library-impersonate'),
    ('libraries/<uuid:id>/archive', v1_views.PlatformLibraryArchiveView.as_view(), 'platform-v1-library-archive'),

    # 17.3 Plans, subscriptions, manual payments, coupons
    ('plans', v1_views.PlatformPlansListView.as_view(), 'platform-v1-plans'),
    ('plans/<uuid:id>', v1_views.PlatformPlanDetailView.as_view(), 'platform-v1-plan-detail'),
    ('plans/<uuid:id>/archive', v1_views.PlatformPlanDetailView.as_view(), 'platform-v1-plan-archive'),
    ('subscriptions', v1_views.PlatformSubscriptionsListView.as_view(), 'platform-v1-subscriptions'),
    ('subscriptions/assign', v1_views.PlatformLibrarySubscriptionAssignView.as_view(), 'platform-v1-subscription-assign'),
    ('subscriptions/extend', v1_views.PlatformLibrarySubscriptionExtendView.as_view(), 'platform-v1-subscription-extend'),
    ('libraries/<uuid:id>/subscription', v1_views.PlatformLibrarySubscriptionAssignView.as_view(), 'platform-v1-library-subscription-assign'),
    ('libraries/<uuid:id>/subscription/extend', v1_views.PlatformLibrarySubscriptionExtendView.as_view(), 'platform-v1-library-subscription-extend'),
    ('payments', v1_views.PlatformPaymentsListView.as_view(), 'platform-v1-payments'),
    ('payments/manual', v1_views.PlatformPaymentsListView.as_view(), 'platform-v1-payments-manual'),
    ('payments/<uuid:id>/approve', v1_views.PlatformPaymentApproveView.as_view(), 'platform-v1-payment-approve'),
    ('payments/<uuid:id>/refund', v1_views.PlatformPaymentRefundView.as_view(), 'platform-v1-payment-refund'),
    ('invoices', v1_views.PlatformInvoicesListView.as_view(), 'platform-v1-invoices'),
    ('invoices/<uuid:id>/resend', v1_views.PlatformInvoiceResendView.as_view(), 'platform-v1-invoice-resend'),
    ('revenue', v1_views.PlatformRevenueView.as_view(), 'platform-v1-revenue'),
    ('commission', v1_views.PlatformCommissionView.as_view(), 'platform-v1-commission'),

    # 17.4 Announcements, support, staff, settings
    ('announcements', v1_views.PlatformAnnouncementsListView.as_view(), 'platform-v1-announcements'),
    ('announcements/audience-preview', v1_views.PlatformAnnouncementsAudiencePreviewView.as_view(), 'platform-v1-announcements-audience-preview'),
    ('announcements/<uuid:id>', v1_views.PlatformAnnouncementDetailView.as_view(), 'platform-v1-announcement-detail'),
    ('notifications', v1_views.PlatformAnnouncementsListView.as_view(), 'platform-v1-notifications'),
    ('notifications/audience-preview', v1_views.PlatformAnnouncementsAudiencePreviewView.as_view(), 'platform-v1-notifications-audience-preview'),
    ('notifications/<uuid:id>', v1_views.PlatformAnnouncementDetailView.as_view(), 'platform-v1-notifications-detail'),
    ('support/tickets', v1_views.PlatformSupportTicketsListView.as_view(), 'platform-v1-support-tickets'),
    ('support/tickets/<uuid:id>', v1_views.PlatformSupportTicketDetailView.as_view(), 'platform-v1-support-ticket-detail'),
    ('support/tickets/<uuid:id>/messages', v1_views.PlatformSupportTicketMessagesView.as_view(), 'platform-v1-support-ticket-messages'),
    ('staff', v1_views.PlatformStaffListView.as_view(), 'platform-v1-staff'),
    ('staff/<uuid:id>', v1_views.PlatformStaffDetailView.as_view(), 'platform-v1-staff-detail'),
    ('staff/<uuid:id>/reset-2fa', v1_views.PlatformStaffResetTwoStepView.as_view(), 'platform-v1-staff-reset-2fa'),
    ('staff/<uuid:id>/reset-two-step', v1_views.PlatformStaffResetTwoStepView.as_view(), 'platform-v1-staff-reset-two-step'),
    ('settings', v1_views.PlatformSettingsView.as_view(), 'platform-v1-settings'),
    ('settings/<str:key>', v1_views.PlatformSettingsView.as_view(), 'platform-v1-settings-key'),
    ('app-versions', v1_views.PlatformAppVersionsView.as_view(), 'platform-v1-app-versions'),
    ('app-versions/<str:platform>', v1_views.PlatformAppVersionsView.as_view(), 'platform-v1-app-version-platform'),
    ('maintenance', v1_views.PlatformMaintenanceView.as_view(), 'platform-v1-maintenance'),
    ('email', v1_views.PlatformEmailView.as_view(), 'platform-v1-email'),
    ('email/test', v1_views.PlatformEmailView.as_view(), 'platform-v1-email-test'),
    ('custom-domains', v1_views.PlatformCustomDomainsView.as_view(), 'platform-v1-custom-domains'),
    ('custom-domains/<uuid:id>/verify', v1_views.PlatformCustomDomainsView.as_view(), 'platform-v1-custom-domains-verify'),
    ('data-requests', v1_views.PlatformDataRequestsView.as_view(), 'platform-v1-data-requests'),
    ('data-requests/<uuid:id>/approve', v1_views.PlatformDataRequestsView.as_view(), 'platform-v1-data-requests-approve'),
    ('data-requests/<uuid:id>/complete', v1_views.PlatformDataRequestsView.as_view(), 'platform-v1-data-requests-complete'),
    ('jobs', v1_views.PlatformJobsView.as_view(), 'platform-v1-jobs'),
    ('jobs/run', v1_views.PlatformJobsView.as_view(), 'platform-v1-jobs-run'),
    ('jobs/<str:name>/run', v1_views.PlatformJobsView.as_view(), 'platform-v1-jobs-name-run'),
]

urlpatterns = []
for p, view, name in raw_routes:
    urlpatterns.append(path(p, view, name=name))
    urlpatterns.append(path(f'{p}/', view, name=f'{name}-slash'))

