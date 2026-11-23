"""URLs for Section 7 Authentication APIs."""
from django.urls import path

from apps.core.auth_views import (
    AuthInvitationAcceptView,
    AuthInvitationDetailView,
    AuthMeView,
    AuthSessionDetailView,
    AuthSessionRevokeAllView,
    AuthSessionsView,
    LibraryLoginView,
    LibraryRegisterView,
    LibrarySelectOrgView,
    LibraryTwoStepResendView,
    LibraryTwoStepVerifyView,
    LogoutView,
    OTPRequestView,
    OTPVerifyView,
    PasswordChangeView,
    PasswordForgotView,
    PasswordResetView,
    PlatformLoginView,
    PlatformTwoStepVerifyView,
    StudentSignupView,
    TokenRefreshView,
    TwoStepConfirmView,
    TwoStepDisableView,
    TwoStepEnableView,
)

urlpatterns = [
    # 7.1 Student OTP login and signup
    path('otp/request', OTPRequestView.as_view(), name='auth-otp-request'),
    path('otp/verify', OTPVerifyView.as_view(), name='auth-otp-verify'),
    path('student/signup', StudentSignupView.as_view(), name='auth-student-signup'),
    path('token/refresh', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('logout', LogoutView.as_view(), name='auth-logout'),

    # 7.2 Library owner registration
    path('library/register', LibraryRegisterView.as_view(), name='auth-library-register'),

    # 7.3 Library team and platform staff login & 2FA
    path('library/login', LibraryLoginView.as_view(), name='auth-library-login'),
    path('library/select-org', LibrarySelectOrgView.as_view(), name='auth-library-select-org'),
    path('library/two-step/verify', LibraryTwoStepVerifyView.as_view(), name='auth-library-two-step-verify'),
    path('library/two-step/resend', LibraryTwoStepResendView.as_view(), name='auth-library-two-step-resend'),
    path('platform/login', PlatformLoginView.as_view(), name='auth-platform-login'),
    path('platform/two-step/verify', PlatformTwoStepVerifyView.as_view(), name='auth-platform-two-step-verify'),

    # 7.4 Passwords, invitations, sessions, two-step setup
    path('me', AuthMeView.as_view(), name='auth-me'),
    path('password/forgot', PasswordForgotView.as_view(), name='auth-password-forgot'),
    path('password/reset', PasswordResetView.as_view(), name='auth-password-reset'),
    path('password/change', PasswordChangeView.as_view(), name='auth-password-change'),
    path('sessions', AuthSessionsView.as_view(), name='auth-sessions'),
    path('sessions/<uuid:pk>', AuthSessionDetailView.as_view(), name='auth-session-detail'),
    path('sessions/revoke-all', AuthSessionRevokeAllView.as_view(), name='auth-sessions-revoke-all'),
    path('two-step/enable', TwoStepEnableView.as_view(), name='auth-two-step-enable'),
    path('two-step/confirm', TwoStepConfirmView.as_view(), name='auth-two-step-confirm'),
    path('two-step/disable', TwoStepDisableView.as_view(), name='auth-two-step-disable'),
    path('invitations/accept', AuthInvitationAcceptView.as_view(), name='auth-invitation-accept'),
    path('invitations/<str:token>', AuthInvitationDetailView.as_view(), name='auth-invitation-detail'),
]

