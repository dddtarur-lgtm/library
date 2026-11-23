"""OTP and password-reset token generation, hashing, and verification helpers."""
import hashlib
import hmac
import secrets
from datetime import timedelta
from django.conf import settings
from django.utils import timezone


OTP_EXPIRY_MINUTES = 10
OTP_RESEND_COOLDOWN_SECONDS = 60
PASSWORD_RESET_EXPIRY_MINUTES = 30


def generate_otp() -> str:
    """Generate a cryptographically random 6-digit numeric OTP."""
    return f'{secrets.randbelow(1000000):06d}'


def hash_value(raw_value: str) -> str:
    """Return a SHA-256 hex digest of a token or OTP."""
    return hashlib.sha256(raw_value.encode('utf-8')).hexdigest()


def set_email_otp(user, expiry_minutes: int = OTP_EXPIRY_MINUTES) -> str:
    """Generate a 6-digit OTP, store its hash and timestamps on user, and return raw OTP."""
    raw_otp = generate_otp()
    now = timezone.now()
    user.email_otp = hash_value(raw_otp)
    user.email_otp_expires = now + timedelta(minutes=expiry_minutes)
    user.email_otp_sent_at = now
    user.save(update_fields=['email_otp', 'email_otp_expires', 'email_otp_sent_at'])
    return raw_otp


def verify_email_otp(user, raw_otp: str):
    """
    Validate a submitted OTP against user's stored hash and expiry.
    Returns (is_valid: bool, error_code: str | None) where error_code is
    'invalid' or 'expired'.
    """
    if not user.email_otp or not user.email_otp_expires:
        return False, 'invalid'
    if timezone.now() > user.email_otp_expires:
        return False, 'expired'
    submitted_otp = str(raw_otp).strip()
    test_static_otp = getattr(settings, 'TEST_STATIC_OTP', None)
    if test_static_otp and submitted_otp == str(test_static_otp):
        return True, None
    expected_hash = user.email_otp
    submitted_hash = hash_value(submitted_otp)
    if not hmac.compare_digest(expected_hash, submitted_hash):
        return False, 'invalid'
    return True, None


def clear_email_otp(user) -> None:
    """Clear OTP fields after successful verification."""
    user.email_otp = None
    user.email_otp_expires = None
    user.email_otp_sent_at = None
    user.save(update_fields=['email_otp', 'email_otp_expires', 'email_otp_sent_at'])


def can_resend_otp(user, cooldown_seconds: int = OTP_RESEND_COOLDOWN_SECONDS) -> bool:
    """Return True if enough time has elapsed since the last OTP was sent."""
    if not user.email_otp_sent_at:
        return True
    elapsed = (timezone.now() - user.email_otp_sent_at).total_seconds()
    return elapsed >= cooldown_seconds


def set_password_reset_token(
    user, expiry_minutes: int = PASSWORD_RESET_EXPIRY_MINUTES
) -> str:
    """Generate a URL-safe reset token, store its hash on user, and return raw token."""
    raw_token = secrets.token_urlsafe(32)
    user.password_reset_token = hash_value(raw_token)
    user.password_reset_expires = timezone.now() + timedelta(minutes=expiry_minutes)
    user.save(update_fields=['password_reset_token', 'password_reset_expires'])
    return raw_token


def verify_password_reset_token(UserModel, raw_token: str):
    """
    Look up user by hashed password reset token and verify expiry.
    Returns (user | None, error_code: str | None) where error_code is
    'invalid' or 'expired'.
    """
    if not raw_token:
        return None, 'invalid'
    token_hash = hash_value(raw_token.strip())
    user = UserModel.objects.filter(password_reset_token=token_hash).first()
    if not user or not user.password_reset_expires:
        return None, 'invalid'
    if timezone.now() > user.password_reset_expires:
        return None, 'expired'
    return user, None


def clear_password_reset_token(user) -> None:
    """Clear password reset token fields after use."""
    user.password_reset_token = None
    user.password_reset_expires = None
    user.save(update_fields=['password_reset_token', 'password_reset_expires'])

