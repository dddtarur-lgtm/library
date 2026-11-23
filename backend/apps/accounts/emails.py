"""Transactional email helpers for authentication and staff onboarding."""
from django.conf import settings
from django.core.mail import send_mail


def send_verification_otp_email(user, otp: str) -> None:
    """Send 6-digit email verification OTP to the user."""
    subject = 'Verify your email - LMS Platform'
    message = (
        f'Hi {user.first_name},\n\n'
        f'Your email verification code is: {otp}\n\n'
        f'This code will expire in 10 minutes.\n\n'
        f'If you did not request this, please ignore this email.'
    )
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def send_password_reset_email(user, reset_token: str, otp: str | None = None) -> None:
    """Send password reset token (and optional OTP) to the user."""
    subject = 'Reset your password - LMS Platform'
    otp_line = f'Verification OTP: {otp}\n' if otp else ''
    message = (
        f'Hi {user.first_name},\n\n'
        f'We received a request to reset your password.\n'
        f'{otp_line}'
        f'Reset Token: {reset_token}\n\n'
        f'This token expires in 30 minutes.\n\n'
        f'If you did not request a password reset, you can safely ignore this email.'
    )
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def send_staff_invite_email(user, inviter, reset_token: str | None = None) -> None:
    """Send invitation email to newly added library staff or platform team member."""
    subject = 'You have been invited to LMS Platform'
    token_line = (
        f'\nUse this setup token to set your password: {reset_token}\n'
        if reset_token
        else ''
    )
    message = (
        f'Hi {user.first_name},\n\n'
        f'{inviter.name or inviter.email} has invited you to join as {user.get_role_display()}.\n'
        f'Your login email is: {user.email}\n'
        f'{token_line}\n'
        f'Welcome aboard!'
    )
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )

