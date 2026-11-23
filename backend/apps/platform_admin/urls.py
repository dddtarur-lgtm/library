"""URL routing for platform_admin (Super Admin) and library-scoped admin/report endpoints."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AppFeatureFlagListView,
    AppFeatureFlagUpdateView,
    LibraryAttendanceReportView,
    LibraryEmailLogListView,
    LibraryPublicPageApproveView,
    LibraryPublicPageListView,
    LibraryPublicPageRejectView,
    LibraryReportsOverviewView,
    LibraryRevenueReportView,
    LibrarySmtpConfigView,
    LibrarySmtpTestView,
    LibrarySupportTicketViewSet,
    PlatformDashboardKPIsView,
    PlatformEmailHealthView,
    PlatformExpiringPlansView,
    PlatformExpiryForecastView,
    PlatformGraceLockedView,
    PlatformGrowthReportView,
    PlatformOccupancyReportView,
    PlatformPendingRequestsView,
    PlatformPlanDistributionView,
    PlatformRecentPaymentsView,
    PlatformRevenueReportView,
    PlatformStudentStatusView,
    PlatformSupportTicketViewSet,
    PlatformUsageReportView,
    WebsiteContentDetailView,
    WebsiteContentListView,
    WebsiteMediaDeleteView,
    WebsiteMediaListCreateView,
)

# /api/v1/platform/
platform_router = DefaultRouter()
platform_router.register('support', PlatformSupportTicketViewSet, basename='platform-support')

platform_urlpatterns = [
    # Dashboard KPIs
    path('dashboard/kpis/', PlatformDashboardKPIsView.as_view(), name='platform-dashboard-kpis'),
    path(
        'dashboard/expiring-plans/',
        PlatformExpiringPlansView.as_view(),
        name='platform-dashboard-expiring-plans',
    ),
    path(
        'dashboard/grace-locked/',
        PlatformGraceLockedView.as_view(),
        name='platform-dashboard-grace-locked',
    ),
    path(
        'dashboard/recent-payments/',
        PlatformRecentPaymentsView.as_view(),
        name='platform-dashboard-recent-payments',
    ),
    path(
        'dashboard/pending-requests/',
        PlatformPendingRequestsView.as_view(),
        name='platform-dashboard-pending-requests',
    ),
    path(
        'dashboard/email-health/',
        PlatformEmailHealthView.as_view(),
        name='platform-dashboard-email-health',
    ),
    # Reports
    path('reports/revenue/', PlatformRevenueReportView.as_view(), name='platform-reports-revenue'),
    path('reports/growth/', PlatformGrowthReportView.as_view(), name='platform-reports-growth'),
    path(
        'reports/plan-distribution/',
        PlatformPlanDistributionView.as_view(),
        name='platform-reports-plan-distribution',
    ),
    path(
        'reports/student-status/',
        PlatformStudentStatusView.as_view(),
        name='platform-reports-student-status',
    ),
    path(
        'reports/expiry-forecast/',
        PlatformExpiryForecastView.as_view(),
        name='platform-reports-expiry-forecast',
    ),
    path(
        'reports/occupancy/',
        PlatformOccupancyReportView.as_view(),
        name='platform-reports-occupancy',
    ),
    path('reports/usage/', PlatformUsageReportView.as_view(), name='platform-reports-usage'),
    # CMS & App Management (media routes must precede <str:section>)
    path('website-content/', WebsiteContentListView.as_view(), name='platform-cms-list'),
    path(
        'website-content/media/',
        WebsiteMediaListCreateView.as_view(),
        name='platform-cms-media-list',
    ),
    path(
        'website-content/media/<uuid:pk>/',
        WebsiteMediaDeleteView.as_view(),
        name='platform-cms-media-delete',
    ),
    path(
        'website-content/<str:section>/',
        WebsiteContentDetailView.as_view(),
        name='platform-cms-detail',
    ),
    path('app-management/', AppFeatureFlagListView.as_view(), name='platform-app-flags-list'),
    path(
        'app-management/<str:feature>/',
        AppFeatureFlagUpdateView.as_view(),
        name='platform-app-flags-update',
    ),
    # Library Public Page Review
    path('library-pages/', LibraryPublicPageListView.as_view(), name='platform-library-pages'),
    path(
        'library-pages/<uuid:pk>/approve/',
        LibraryPublicPageApproveView.as_view(),
        name='platform-library-pages-approve',
    ),
    path(
        'library-pages/<uuid:pk>/reject/',
        LibraryPublicPageRejectView.as_view(),
        name='platform-library-pages-reject',
    ),
    # Email Health
    path('email-health/', PlatformEmailHealthView.as_view(), name='platform-email-health'),
    # Support Tickets
    path('', include(platform_router.urls)),
]

# /api/v1/library/
library_router = DefaultRouter()
library_router.register('support', LibrarySupportTicketViewSet, basename='library-support')

library_urlpatterns = [
    # Reports
    path('reports/', LibraryReportsOverviewView.as_view(), name='library-reports-overview'),
    path('reports/revenue/', LibraryRevenueReportView.as_view(), name='library-reports-revenue'),
    path(
        'reports/attendance/',
        LibraryAttendanceReportView.as_view(),
        name='library-reports-attendance',
    ),
    # Email Management
    path('email-management/smtp/', LibrarySmtpConfigView.as_view(), name='library-smtp-config'),
    path('email-management/smtp/test/', LibrarySmtpTestView.as_view(), name='library-smtp-test'),
    path('email-management/logs/', LibraryEmailLogListView.as_view(), name='library-email-logs'),
    # Support Tickets
    path('', include(library_router.urls)),
]
