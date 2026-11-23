"""Library, Branch, Onboarding Request, Settings, and QR Kiosk models."""
import secrets
import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone

PLAN_STATUS_CHOICES = [
    ('Trial', 'Trial'),
    ('Pending', 'Pending'),
    ('Active', 'Active'),
    ('Grace', 'Grace'),
    ('Locked', 'Locked'),
    ('Expired', 'Expired'),
    ('Cancelled', 'Cancelled'),
]

LIBRARY_STATUS_CHOICES = [
    ('Active', 'Active'),
    ('Suspended', 'Suspended'),
    ('Locked', 'Locked'),
    ('Closed', 'Closed'),
]

CHOSEN_PLAN_CHOICES = [
    ('Starter', 'Starter'),
    ('Growth', 'Growth'),
    ('Pro', 'Pro'),
    ('Enterprise', 'Enterprise'),
]

BILLING_CYCLE_CHOICES = [
    ('Monthly', 'Monthly'),
    ('Quarterly', 'Quarterly'),
    ('Annual', 'Annual'),
]

REQUEST_STATUS_CHOICES = [
    ('Pending', 'Pending'),
    ('Approved', 'Approved'),
    ('Rejected', 'Rejected'),
    ('Info Requested', 'Info Requested'),
]


class Library(models.Model):
    """Tenant library entity."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    logo = models.ImageField(upload_to='library_logos/', null=True, blank=True)
    owner = models.OneToOneField(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='owned_library',
    )
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    area = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, default='India')
    pin_code = models.CharField(max_length=20, blank=True, default='')
    address = models.TextField()
    phone = models.CharField(max_length=20)
    contact_email = models.EmailField(blank=True, default='')
    website = models.URLField(max_length=255, blank=True, default='')
    gstin = models.CharField(max_length=20, blank=True)
    timezone = models.CharField(max_length=50, default='Asia/Kolkata')
    currency = models.CharField(max_length=3, default='INR')
    default_language = models.CharField(max_length=10, default='en')
    established_year = models.PositiveSmallIntegerField(null=True, blank=True)
    plan_status = models.CharField(
        max_length=20, choices=PLAN_STATUS_CHOICES, default='Trial'
    )
    library_status = models.CharField(
        max_length=20, choices=LIBRARY_STATUS_CHOICES, default='Active'
    )
    status_reason = models.TextField(blank=True)
    student_notice = models.TextField(blank=True, default='')
    joined_date = models.DateField(auto_now_add=True)
    email_connection_status = models.CharField(max_length=20, default='Not connected')
    closed_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Libraries'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.code})'


class Branch(models.Model):
    """Physical branch belonging to a Library."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        Library, on_delete=models.CASCADE, related_name='branches'
    )
    name = models.CharField(max_length=255)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    is_main = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    floors_count = models.PositiveIntegerField(default=1)
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    allowed_qr_radius_meters = models.PositiveIntegerField(default=100)
    facilities = models.JSONField(default=list, blank=True)
    operating_hours = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Branches'
        ordering = ['-is_main', 'name']

    def __str__(self):
        return f'{self.library.name} - {self.name}'


class LibraryRequest(models.Model):
    """Onboarding / signup request submitted by a prospective library owner."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request_number = models.CharField(max_length=30, unique=True, blank=True)
    library_name = models.CharField(max_length=255)
    owner_name = models.CharField(max_length=255)
    mobile = models.CharField(max_length=20)
    email = models.EmailField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    branches_planned = models.PositiveIntegerField(default=1)
    planned_seats = models.PositiveIntegerField(default=50)
    chosen_plan = models.CharField(max_length=50, default='Starter', blank=True)
    billing_cycle = models.CharField(max_length=20, default='Monthly', blank=True)
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    email_verified = models.BooleanField(default=False)
    mobile_verified = models.BooleanField(default=False)
    aadhaar_uploaded = models.BooleanField(default=False)
    gst_uploaded = models.BooleanField(default=False)
    ownership_proof_uploaded = models.BooleanField(default=False)
    document_check = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=30, choices=REQUEST_STATUS_CHOICES, default='Pending'
    )
    notes = models.TextField(blank=True)
    duplicate_warning = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_library_requests',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    approved_library = models.ForeignKey(
        Library,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='origin_requests',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.request_number:
            self.request_number = f'REQ-{uuid.uuid4().hex[:8].upper()}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.request_number} - {self.library_name}'


class LibraryDocument(models.Model):
    """Supporting document attached to a LibraryRequest."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.ForeignKey(
        LibraryRequest, on_delete=models.CASCADE, related_name='documents'
    )
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='library_requests/documents/')
    file_size = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.request.request_number})'


class LibrarySettings(models.Model):
    """Per-library operational & integration settings."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.OneToOneField(
        Library, on_delete=models.CASCADE, related_name='settings'
    )
    smtp_config = models.JSONField(default=dict, blank=True)
    allow_student_self_register = models.BooleanField(default=False)
    grace_days = models.PositiveIntegerField(default=5)
    auto_checkout_time = models.TimeField(null=True, blank=True)
    late_after_time = models.TimeField(null=True, blank=True)
    default_allowed_study_minutes = models.PositiveIntegerField(default=0)
    premium_gating_enabled = models.BooleanField(default=True)
    expiry_dialog_title = models.CharField(max_length=200, default='Membership expired')
    expiry_dialog_message = models.TextField(
        default='Please renew your membership to continue.'
    )
    public_page_enabled = models.BooleanField(default=False)
    public_page_slug = models.SlugField(unique=True, blank=True, null=True)
    public_page_status = models.CharField(max_length=20, default='draft')
    public_page_published_at = models.DateTimeField(null=True, blank=True)
    public_page_sections = models.JSONField(default=list, blank=True)
    email_sending_mode = models.CharField(max_length=20, default='platform')
    email_fallback_to_platform = models.BooleanField(default=True)
    email_daily_limit = models.PositiveIntegerField(default=500)
    email_sent_today = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Library Settings'

    def __str__(self):
        return f'Settings - {self.library.name}'


class AttendanceQrKioskConfig(models.Model):
    """Branch-level QR kiosk configuration and rotating check-in token."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.OneToOneField(
        Branch, on_delete=models.CASCADE, related_name='qr_kiosk_config'
    )
    qr_token = models.CharField(max_length=128, unique=True, blank=True)
    is_enabled = models.BooleanField(default=True)
    require_geo_fence = models.BooleanField(default=True)
    refresh_interval_seconds = models.PositiveIntegerField(default=300)
    last_regenerated_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Attendance QR Kiosk Config'
        verbose_name_plural = 'Attendance QR Kiosk Configs'

    def save(self, *args, **kwargs):
        if not self.qr_token:
            self.qr_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    def regenerate_token(self):
        """Generate a fresh QR token and update regeneration timestamp."""
        self.qr_token = secrets.token_urlsafe(32)
        self.last_regenerated_at = timezone.now()
        self.save(update_fields=['qr_token', 'last_regenerated_at', 'updated_at'])
        return self.qr_token

    def __str__(self):
        return f'QR Kiosk - {self.branch}'


class AdminInbox(models.Model):
    """Bell inbox items for library administrators."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        Library,
        on_delete=models.CASCADE,
        related_name='admin_inbox',
    )
    type = models.CharField(max_length=50)
    title = models.CharField(max_length=200)
    message = models.TextField(blank=True, default='')
    related_type = models.CharField(max_length=50, blank=True, default='')
    related_id = models.CharField(max_length=100, blank=True, default='')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.library.name})'


class ActivityLog(models.Model):
    """Audit log tracking sensitive and normal actions per tenant library."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        Library,
        on_delete=models.CASCADE,
        related_name='activity_logs',
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs',
    )
    actor_role = models.CharField(max_length=30, blank=True, default='')
    action = models.CharField(max_length=255)
    entity_type = models.CharField(max_length=60, blank=True, default='')
    entity_id = models.CharField(max_length=60, blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.action} on {self.entity_type}:{self.entity_id}'


class BranchAttendanceRule(models.Model):
    """Attendance criteria & auto-checkout configuration per branch."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.OneToOneField(
        Branch,
        on_delete=models.CASCADE,
        related_name='attendance_rule',
    )
    late_after_minutes = models.PositiveIntegerField(default=15)
    auto_checkout_time = models.TimeField(null=True, blank=True)
    absent_alert_days = models.PositiveIntegerField(default=3)
    min_daily_minutes = models.PositiveIntegerField(default=120)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'branch_attendance_rules'

    def __str__(self):
        return f'Attendance Rules for {self.branch.name}'


class PermissionTemplate(models.Model):
    """Reusable permission bundles (Manager, Accountant, Front desk, etc.)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        Library,
        on_delete=models.CASCADE,
        related_name='permission_templates',
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    is_builtin = models.BooleanField(default=False)
    grants = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'permission_templates'

    def __str__(self):
        return self.name




class LibraryEmailConnection(models.Model):
    """Email connection (Google/Microsoft OAuth or Custom SMTP) per library."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        Library,
        on_delete=models.CASCADE,
        related_name='email_connections',
    )
    provider = models.CharField(max_length=50, default='smtp')
    email_address = models.EmailField()
    display_name = models.CharField(max_length=100, blank=True, default='')
    reply_to = models.EmailField(blank=True, default='')
    smtp_host = models.CharField(max_length=255, blank=True, default='')
    smtp_port = models.PositiveIntegerField(default=587)
    smtp_security = models.CharField(max_length=20, default='tls')
    smtp_username = models.CharField(max_length=255, blank=True, default='')
    smtp_password = models.CharField(max_length=255, blank=True, default='')
    access_level = models.CharField(max_length=50, default='send_only')
    is_primary = models.BooleanField(default=True)
    fallback_to_platform = models.BooleanField(default=True)
    status = models.CharField(max_length=30, default='Connected')
    last_tested_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'library_email_connections'
        ordering = ['-is_primary', '-created_at']

    def __str__(self):
        return f'{self.email_address} ({self.provider}) - {self.library.name}'


class LibraryEmailTemplate(models.Model):
    """Customized email templates per library."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        Library,
        on_delete=models.CASCADE,
        related_name='custom_email_templates',
    )
    code = models.CharField(max_length=50)
    translations = models.JSONField(default=dict)
    is_custom = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'library_email_templates'
        unique_together = ('library', 'code')

    def __str__(self):
        return f'{self.code} ({self.library.name})'



class ReportSchedule(models.Model):
    """Recurring scheduled report dispatch per library."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        Library,
        on_delete=models.CASCADE,
        related_name='report_schedules',
    )
    report_codes = models.JSONField(default=list)
    frequency = models.CharField(max_length=20, default='weekly')
    day_of_week = models.CharField(max_length=20, blank=True, default='')
    day_of_month = models.PositiveIntegerField(null=True, blank=True)
    time = models.CharField(max_length=10, default='09:00')
    recipients = models.JSONField(default=list)
    format = models.CharField(max_length=10, default='pdf')
    branch = models.ForeignKey(
        Branch,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='report_schedules',
    )
    next_run_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'library_report_schedules'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.library.name} - {self.frequency}'


class ReportExport(models.Model):
    """Asynchronous report or data export job status and signed download URL."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        Library,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='report_exports',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='report_exports',
    )
    type = models.CharField(max_length=50, default='report')
    status = models.CharField(max_length=20, default='queued')
    download_url = models.CharField(max_length=500, blank=True, default='')
    error = models.TextField(blank=True, default='')
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'library_report_exports'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.type} export ({self.status})'
