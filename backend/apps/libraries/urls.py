"""URL routing for platform library management and library owner endpoints."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BranchViewSet,
    LibraryDashboardView,
    LibraryDeletionRequestView,
    LibraryOnboardingRequestView,
    LibraryProfileView,
    LibrarySettingsView,
    PlatformLibraryRequestViewSet,
    PlatformLibraryViewSet,
)

# /api/v1/platform/
platform_router = DefaultRouter()
platform_router.register(
    'libraries', PlatformLibraryViewSet, basename='platform-libraries'
)
platform_router.register(
    'library-requests',
    PlatformLibraryRequestViewSet,
    basename='platform-library-requests',
)
platform_urlpatterns = [
    path('', include(platform_router.urls)),
]

# /api/v1/library/
library_router = DefaultRouter()
library_router.register('branches', BranchViewSet, basename='library-branches')
library_urlpatterns = [
    path('profile/', LibraryProfileView.as_view(), name='library-profile'),
    path('settings/', LibrarySettingsView.as_view(), name='library-settings'),
    path('dashboard/', LibraryDashboardView.as_view(), name='library-dashboard'),
    path(
        'onboarding-request/',
        LibraryOnboardingRequestView.as_view(),
        name='library-onboarding-request',
    ),
    path(
        'request-delete/',
        LibraryDeletionRequestView.as_view(),
        name='library-request-delete',
    ),
    path('', include(library_router.urls)),
]
