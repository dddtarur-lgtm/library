"""Models for support tickets, CMS, feature flags, public page review, and email health."""
import uuid
from django.db import models

TICKET_CATEGORY_CHOICES = [
    ('Billing', 'Billing'),
    ('Technical', 'Technical'),
    ('Account', 'Account'),
    ('Feature Request', 'Feature Request'),
    ('Other', 'Other'),
]

TICKET_PRIORITY_CHOICES = [
    ('Low', 'Low'),
    ('Medium', 'Medium'),
    ('High', 'High'),
    ('Urgent', 'Urgent'),
]

TICKET_STATUS_CHOICES = [
    ('Open', 'Open'),
    ('In Progress', 'In Progress'),
    ('Waiting on Customer', 'Waiting on Customer'),
    ('Resolved', 'Resolved'),
    ('Closed', 'Closed'),
]

MEDIA_TYPE_CHOICES = [
    ('Image', 'Image'),
    ('Video', 'Video'),
    ('Document', 'Document'),
    ('Other', 'Other'),
]

PUBLIC_PAGE_STATUS_CHOICES = [
    ('Pending', 'Pending'),
    ('Approved', 'Approved'),
    ('Rejected', 'Rejected'),
]

EMAIL_HEALTH_STATUS_CHOICES = [
    ('Connected', 'Connected'),
    ('Not connected', 'Not connected'),
    ('Degraded', 'Degraded'),
    ('Failed', 'Failed'),
]

EMAIL_LOG_STATUS_CHOICES = [
    ('Sent', 'Sent'),
    ('Failed', 'Failed'),
    ('Queued', 'Queued'),
]


class SupportTicket(models.Model):
    """Support ticket raised by a library owner and handled by platform staff."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=30, unique=True, blank=True)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='support_tickets',
    )
    created_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='created_support_tickets',
    )
    assigned_to = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_support_tickets',
    )
    subject = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=50, choices=TICKET_CATEGORY_CHOICES, default='Technical'
    )
    priority = models.CharField(
        max_length=20, choices=TICKET_PRIORITY_CHOICES, default='Medium'
    )
    status = models.CharField(
        max_length=30, choices=TICKET_STATUS_CHOICES, default='Open'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            self.ticket_number = f'TKT-{uuid.uuid4().hex[:8].upper()}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.ticket_number} - {self.subject}'


class SupportMessage(models.Model):
    """Message or reply within a SupportTicket thread."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(
        SupportTicket,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='support_messages',
    )
    message = models.TextField()
    is_staff_reply = models.BooleanField(default=False)
    attachment = models.FileField(
        upload_to='support_attachments/', null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Reply on {self.ticket.ticket_number}'


class WebsiteContentBlock(models.Model):
    """CMS content block for the public marketing website."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    section = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=255, blank=True)
    subtitle = models.CharField(max_length=500, blank=True)
    content = models.JSONField(default=dict, blank=True)
    is_published = models.BooleanField(default=True)
    updated_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='updated_cms_blocks',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['section']

    def __str__(self):
        return f'CMS: {self.section}'


class WebsiteMedia(models.Model):
    """Media asset uploaded for the marketing website CMS."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='website_media/')
    media_type = models.CharField(
        max_length=30, choices=MEDIA_TYPE_CHOICES, default='Image'
    )
    alt_text = models.CharField(max_length=255, blank=True)
    file_size = models.PositiveIntegerField(default=0)
    uploaded_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='uploaded_website_media',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Website Media'

    def __str__(self):
        return self.title


class AppFeatureFlag(models.Model):
    """Platform-wide feature toggle and rollout configuration."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    feature = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_enabled = models.BooleanField(default=True)
    rollout_percentage = models.PositiveIntegerField(default=100)
    config = models.JSONField(default=dict, blank=True)
    updated_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='updated_feature_flags',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['feature']

    def __str__(self):
        state = 'ON' if self.is_enabled else 'OFF'
        return f'{self.feature} ({state})'


class LibraryPublicPage(models.Model):
    """Moderation queue entry for a library's public micro-site."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.OneToOneField(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='public_page_review',
    )
    slug = models.SlugField(max_length=120, unique=True)
    headline = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=PUBLIC_PAGE_STATUS_CHOICES, default='Pending'
    )
    rejection_reason = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_public_pages',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.library.name} (/{self.slug}) - {self.status}'


class EmailConnectionHealth(models.Model):
    """Per-library email/SMTP connection health status monitored by Super Admin."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.OneToOneField(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='email_health',
    )
    status = models.CharField(
        max_length=30,
        choices=EMAIL_HEALTH_STATUS_CHOICES,
        default='Not connected',
    )
    provider = models.CharField(max_length=50, default='Custom SMTP', blank=True)
    connected_email = models.EmailField(blank=True, default='')
    failure_count = models.PositiveIntegerField(default=0)
    last_checked_at = models.DateTimeField(null=True, blank=True)
    last_success_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True)
    bounce_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Email Connection Health'
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.library.name} - {self.status}'


class SmtpConfig(models.Model):
    """Per-library custom SMTP credentials and verification state."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.OneToOneField(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='smtp_config_record',
    )
    host = models.CharField(max_length=255)
    port = models.PositiveIntegerField(default=587)
    username = models.CharField(max_length=255)
    password = models.CharField(max_length=255, blank=True)
    from_email = models.EmailField()
    from_name = models.CharField(max_length=255, blank=True)
    use_tls = models.BooleanField(default=True)
    use_ssl = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    last_tested_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'SMTP Config'
        verbose_name_plural = 'SMTP Configs'

    def __str__(self):
        return f'SMTP ({self.library.code}): {self.host}:{self.port}'


class TransactionalEmailLog(models.Model):
    """Log of transactional emails dispatched on behalf of a library."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='transactional_email_logs',
    )
    recipient = models.EmailField()
    subject = models.CharField(max_length=255)
    template_name = models.CharField(max_length=100, blank=True)
    status = models.CharField(
        max_length=20, choices=EMAIL_LOG_STATUS_CHOICES, default='Sent'
    )
    provider_message_id = models.CharField(max_length=255, blank=True)
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-sent_at']

    def __str__(self):
        return f'{self.recipient} - {self.subject} ({self.status})'



class GlobalSetting(models.Model):
    """Platform global configurations (key/value store)."""
    key = models.CharField(max_length=100, primary_key=True)
    value = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'global_settings'

    def __str__(self):
        return self.key


class PlatformAnnouncement(models.Model):
    """Platform-wide announcements sent to libraries or students."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    body = models.TextField()
    audience = models.JSONField(default=dict, blank=True)
    channels = models.JSONField(default=list, blank=True)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='platform_announcements',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'platform_announcements'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
