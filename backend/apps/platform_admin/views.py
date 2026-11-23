"""Unified views export for apps/platform_admin."""
from .views_cms import (
    AppFeatureFlagListView,
    AppFeatureFlagUpdateView,
    LibraryPublicPageApproveView,
    LibraryPublicPageListView,
    LibraryPublicPageRejectView,
    WebsiteContentDetailView,
    WebsiteContentListView,
    WebsiteMediaDeleteView,
    WebsiteMediaListCreateView,
)
from .views_dashboard import (
    PlatformDashboardKPIsView,
    PlatformEmailHealthView,
    PlatformExpiringPlansView,
    PlatformGraceLockedView,
    PlatformPendingRequestsView,
    PlatformRecentPaymentsView,
)
from .views_email import (
    LibraryEmailLogListView,
    LibrarySmtpConfigView,
    LibrarySmtpTestView,
)
from .views_reports import (
    LibraryAttendanceReportView,
    LibraryReportsOverviewView,
    LibraryRevenueReportView,
    PlatformExpiryForecastView,
    PlatformGrowthReportView,
    PlatformOccupancyReportView,
    PlatformPlanDistributionView,
    PlatformRevenueReportView,
    PlatformStudentStatusView,
    PlatformUsageReportView,
)
from .views_support import (
    LibrarySupportTicketViewSet,
    PlatformSupportTicketViewSet,
)

__all__ = [
    'AppFeatureFlagListView',
    'AppFeatureFlagUpdateView',
    'LibraryAttendanceReportView',
    'LibraryEmailLogListView',
    'LibraryPublicPageApproveView',
    'LibraryPublicPageListView',
    'LibraryPublicPageRejectView',
    'LibraryReportsOverviewView',
    'LibraryRevenueReportView',
    'LibrarySmtpConfigView',
    'LibrarySmtpTestView',
    'LibrarySupportTicketViewSet',
    'PlatformDashboardKPIsView',
    'PlatformEmailHealthView',
    'PlatformExpiringPlansView',
    'PlatformExpiryForecastView',
    'PlatformGraceLockedView',
    'PlatformGrowthReportView',
    'PlatformOccupancyReportView',
    'PlatformPendingRequestsView',
    'PlatformPlanDistributionView',
    'PlatformRecentPaymentsView',
    'PlatformRevenueReportView',
    'PlatformStudentStatusView',
    'PlatformSupportTicketViewSet',
    'PlatformUsageReportView',
    'WebsiteContentDetailView',
    'WebsiteContentListView',
    'WebsiteMediaDeleteView',
    'WebsiteMediaListCreateView',
]
