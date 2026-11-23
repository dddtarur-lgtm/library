"""URL routing for platform audit logs and library activity logs."""
from django.urls import path

from .views import LibraryActivityLogListView, PlatformAuditLogListView

# /api/v1/platform/
platform_urlpatterns = [
    path('audit-logs/', PlatformAuditLogListView.as_view(), name='platform-audit-logs'),
]

# /api/v1/library/
library_urlpatterns = [
    path('activity-logs/', LibraryActivityLogListView.as_view(), name='library-activity-logs'),
]
