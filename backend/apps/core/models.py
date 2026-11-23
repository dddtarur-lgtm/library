"""Core models for Multi-Tenancy, Token Revocation, OTP Challenges, and Idempotency."""
import hashlib
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class AuthTokenRevocation(models.Model):
    """
    Stores revoked JWT tokens and token family IDs to prevent replay attacks.
    If a revoked refresh token is re-submitted, the entire token family is revoked.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='revoked_tokens',
        null=True,
        blank=True,
    )
    jti = models.CharField(max_length=255, unique=True, db_index=True)
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    family_id = models.CharField(max_length=64, db_index=True, blank=True, default='')
    revoked_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True, db_index=True)
    reason = models.CharField(max_length=100, default='rotated')

    class Meta:
        db_table = 'auth_token_revocations'
        indexes = [
            models.Index(fields=['family_id']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f'Revoked JTI {self.jti[:8]}... (family: {self.family_id})'


class OTPChallenge(models.Model):
    """
    Mobile/Email OTP challenge records with rate-limiting, expiration, and tamper prevention.
    """
    CHANNEL_CHOICES = [
        ('sms', 'SMS'),
        ('email', 'Email'),
        ('whatsapp', 'WhatsApp'),
    ]
    PURPOSE_CHOICES = [
        ('login', 'Login'),
        ('signup', 'Signup'),
        ('library_signup', 'Library Signup'),
        ('reset_password', 'Reset Password'),
        ('two_step', 'Two Step Verification'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='otp_challenges',
    )
    phone = models.CharField(max_length=20, blank=True, default='', db_index=True)
    email = models.EmailField(blank=True, default='', db_index=True)
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES, default='sms')
    purpose = models.CharField(max_length=30, choices=PURPOSE_CHOICES, default='login')
    code_hash = models.CharField(max_length=128)
    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=3)
    expires_at = models.DateTimeField(db_index=True)
    consumed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'otp_challenges'
        ordering = ['-created_at']

    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    def is_consumed(self) -> bool:
        return self.consumed_at is not None

    def verify_code(self, raw_code: str) -> bool:
        if self.is_expired() or self.is_consumed():
            return False
        if self.attempts >= self.max_attempts:
            return False

        self.attempts += 1
        code_str = str(raw_code).strip()
        calculated_hash = hashlib.sha256(code_str.encode('utf-8')).hexdigest()
        
        # Test hook support
        test_static_otp = getattr(settings, 'TEST_STATIC_OTP', None)
        if test_static_otp and code_str == str(test_static_otp):
            is_valid = True
        else:
            is_valid = (calculated_hash == self.code_hash)

        if is_valid:
            self.consumed_at = timezone.now()

        self.save(update_fields=['attempts', 'consumed_at'])
        return is_valid


class IdempotencyRecord(models.Model):
    """
    Prevents duplicate mutations on financial, assignment, and messaging requests.
    Stores response payload for 24 hours.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idempotency_key = models.UUIDField(unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    request_path = models.CharField(max_length=255)
    request_hash = models.CharField(max_length=64)
    status_code = models.PositiveSmallIntegerField()
    response_body = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(db_index=True)

    class Meta:
        db_table = 'core_idempotency_records'
        indexes = [
            models.Index(fields=['expires_at']),
        ]

    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at


class UserTOTPFactor(models.Model):
    """TOTP two-step verification factor for a user."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='totp_factor',
    )
    secret = models.CharField(max_length=64)
    backup_codes = models.JSONField(default=list)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_totp_factors'

    def __str__(self):
        return f'TOTPFactor for {self.user.email} (active={self.is_active})'


class UserSession(models.Model):
    """Active user sessions across devices with IP and platform tracking."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_sessions',
    )
    device_id = models.CharField(max_length=128, blank=True, default='')
    device_name = models.CharField(max_length=255, blank=True, default='Web Browser')
    platform = models.CharField(max_length=50, default='web')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    last_seen_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_sessions'
        ordering = ['-last_seen_at']

    def __str__(self):
        return f'Session {self.id} for {self.user.email} on {self.platform}'


class MemberInvitation(models.Model):
    """Invitations sent to join library staff / sub-admins."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    token = models.CharField(max_length=64, unique=True, db_index=True)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='member_invitations',
    )
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_invitations',
        null=True,
        blank=True,
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=20)
    role = models.CharField(max_length=20, default='staff')
    branch_ids = models.JSONField(default=list)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'member_invitations'
        ordering = ['-created_at']

    def is_valid(self) -> bool:
        return self.accepted_at is None and timezone.now() < self.expires_at

    def __str__(self):
        return f'Invite for {self.email or self.phone} ({self.role})'




class FileAsset(models.Model):
    """Uploaded files tracking across avatar, logos, documents, and media."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='file_assets',
    )
    library = models.ForeignKey(
        'libraries.Library',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='file_assets',
    )
    purpose = models.CharField(max_length=50)
    filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100)
    size_bytes = models.PositiveIntegerField()
    status = models.CharField(max_length=20, default='pending')
    storage_path = models.CharField(max_length=500, blank=True, default='')
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_file_assets'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.filename} ({self.purpose})'
