"""URL routing for library-scoped and platform-scoped notification endpoints."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LibraryNotificationViewSet, PlatformNotificationListView

# /api/v1/library/
library_router = DefaultRouter()
library_router.register(
    'notifications', LibraryNotificationViewSet, basename='library-notifications'
)

library_urlpatterns = [
    path('', include(library_router.urls)),
]

# /api/v1/platform/
platform_urlpatterns = [
    path(
        'notifications/',
        PlatformNotificationListView.as_view(),
        name='platform-notifications-list',
    ),
]
