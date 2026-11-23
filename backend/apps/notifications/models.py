"""NotificationBroadcast and StudentNotification models for library-to-student broadcasts."""
import uuid
from django.db import models

NOTIFICATION_PRIORITY_CHOICES = [
    ('Low', 'Low'),
    ('Normal', 'Normal'),
    ('High', 'High'),
    ('Urgent', 'Urgent'),
]

NOTIFICATION_STATUS_CHOICES = [
    ('Draft', 'Draft'),
    ('Scheduled', 'Scheduled'),
    ('Sent', 'Sent'),
    ('Paused', 'Paused'),
    ('Cancelled', 'Cancelled'),
    ('Failed', 'Failed'),
]


class NotificationBroadcast(models.Model):
    """Broadcast notification created by a library owner for targeted student audiences."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
    )
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_notifications',
    )
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True, default='')
    body = models.TextField()
    details = models.TextField(blank=True, default='')
    translations = models.JSONField(default=dict, blank=True)
    audience = models.CharField(max_length=50, default='All Students')
    channels = models.JSONField(default=list, blank=True)
    display_mode = models.CharField(max_length=20, default='Banner')
    dialog_layout = models.CharField(max_length=50, default='text_only')
    dialog_type = models.CharField(max_length=50, blank=True, default='')
    show_on_screen = models.BooleanField(default=False)
    is_dismissible = models.BooleanField(default=True)
    image_banner = models.ImageField(
        upload_to='notification_banners/', null=True, blank=True
    )
    image_url = models.CharField(max_length=500, blank=True, default='')
    background_image_file_id = models.CharField(max_length=100, blank=True, default='')
    cta = models.JSONField(default=dict, blank=True)
    cta_text = models.CharField(max_length=100, blank=True, default='')
    cta_link = models.CharField(max_length=500, blank=True, default='')
    priority = models.CharField(
        max_length=20, choices=NOTIFICATION_PRIORITY_CHOICES, default='Normal'
    )
    status = models.CharField(
        max_length=20, choices=NOTIFICATION_STATUS_CHOICES, default='Draft'
    )
    frequency = models.CharField(max_length=20, default='one_time')
    schedule = models.JSONField(default=dict, blank=True)
    filters = models.JSONField(default=dict, blank=True)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    max_shows = models.PositiveIntegerField(default=3)
    respect_quiet_hours = models.BooleanField(default=True)
    recipients_count = models.PositiveIntegerField(default=0)
    delivered_count = models.PositiveIntegerField(default=0)
    failure_count = models.PositiveIntegerField(default=0)
    seen_count = models.PositiveIntegerField(default=0)
    click_count = models.PositiveIntegerField(default=0)
    dismissed_count = models.PositiveIntegerField(default=0)
    cancel_reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.library.code if self.library else "Global"} - {self.status})'


class StudentNotification(models.Model):
    """Inbox delivery of a notification to an individual student."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='student_notifications',
    )
    broadcast = models.ForeignKey(
        NotificationBroadcast,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='deliveries',
    )
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True, default='')
    body = models.TextField()
    details = models.TextField(blank=True, default='')
    translations = models.JSONField(default=dict, blank=True)
    show_on_screen = models.BooleanField(default=False)
    dialog_layout = models.CharField(max_length=50, default='text_only')
    priority = models.CharField(
        max_length=20, choices=NOTIFICATION_PRIORITY_CHOICES, default='Normal'
    )
    is_dismissible = models.BooleanField(default=True)
    image_url = models.CharField(max_length=500, blank=True, default='')
    cta = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    seen_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)
    dismissed_at = models.DateTimeField(null=True, blank=True)
    show_count = models.PositiveIntegerField(default=0)
    max_shows = models.PositiveIntegerField(default=3)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} -> {self.student.name} ({self.is_read})'
