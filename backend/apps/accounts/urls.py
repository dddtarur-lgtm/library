"""URL routing for authentication, platform users, and library staff."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AccountDeletionRequestView,
    AvatarUploadView,
    ChangePasswordView,
    CustomTokenRefreshView,
    ForgotPasswordView,
    LibraryStaffViewSet,
    LogoutView,
    MeView,
    PlatformDeletionRequestViewSet,
    PlatformUserViewSet,
    RegisterView,
    ResendOTPView,
    ResetPasswordView,
    SignInView,
    StudentRegisterView,
    VerifyEmailView,
)

# /api/v1/auth/
urlpatterns = [
    path('sign-in/', SignInView.as_view(), name='auth-sign-in'),
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('student/register/', StudentRegisterView.as_view(), name='auth-student-register'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='auth-token-refresh'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('verify-email/', VerifyEmailView.as_view(), name='auth-verify-email'),
    path('resend-otp/', ResendOTPView.as_view(), name='auth-resend-otp'),
    path('reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('request-delete/', AccountDeletionRequestView.as_view(), name='auth-request-delete'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('avatar/', AvatarUploadView.as_view(), name='auth-avatar'),
]

# /api/v1/platform/users/ & /api/v1/platform/deletion-requests/
platform_router = DefaultRouter()
platform_router.register('users', PlatformUserViewSet, basename='platform-users')
platform_router.register(
    'deletion-requests',
    PlatformDeletionRequestViewSet,
    basename='platform-deletion-requests',
)
platform_urlpatterns = [
    path('', include(platform_router.urls)),
]

# /api/v1/library/staff/
library_router = DefaultRouter()
library_router.register('staff', LibraryStaffViewSet, basename='library-staff')
library_urlpatterns = [
    path('', include(library_router.urls)),
]

