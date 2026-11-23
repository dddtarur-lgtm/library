"""Student and StudentMembership models."""
import uuid
from django.db import models

GENDER_CHOICES = [
    ('Male', 'Male'),
    ('Female', 'Female'),
    ('Other', 'Other'),
]

STUDENT_STATUS_CHOICES = [
    ('Live', 'Live'),
    ('Pending', 'Pending'),
    ('Expired', 'Expired'),
    ('Suspended', 'Suspended'),
]

MEMBERSHIP_STATUS_CHOICES = [
    ('Active', 'Active'),
    ('Expiring Soon', 'Expiring Soon'),
    ('Grace Period', 'Grace Period'),
    ('Expired', 'Expired'),
    ('Cancelled', 'Cancelled'),
]

PAYMENT_MODE_CHOICES = [
    ('Cash', 'Cash'),
    ('UPI', 'UPI'),
    ('Razorpay', 'Razorpay'),
    ('Bank Transfer', 'Bank Transfer'),
]


class Student(models.Model):
    """Library student profile with multi-tenant isolation by library."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_code = models.CharField(max_length=20, unique=True, blank=True)
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students',
    )
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='students',
    )
    branch = models.ForeignKey(
        'libraries.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students',
    )
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    avatar = models.ImageField(upload_to='student_avatars/', null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    dob = models.DateField(null=True, blank=True)
    blood_group = models.CharField(max_length=5, blank=True)
    address = models.TextField(blank=True)
    guardian_name = models.CharField(max_length=255, blank=True)
    guardian_phone = models.CharField(max_length=20, blank=True)
    guardian_relation = models.CharField(max_length=50, blank=True)
    exam_target = models.CharField(max_length=255, blank=True)
    college = models.CharField(max_length=255, blank=True)
    target_year = models.CharField(max_length=10, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STUDENT_STATUS_CHOICES,
        default='Pending',
    )
    qr_card_id = models.CharField(max_length=50, unique=True, blank=True)
    joining_date = models.DateField(null=True, blank=True)
    allowed_study_minutes = models.PositiveIntegerField(null=True, blank=True)
    suspended_at = models.DateTimeField(null=True, blank=True)
    suspension_reason = models.TextField(blank=True, default='')
    rejection_reason = models.TextField(blank=True, default='')
    left_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    study_daily_goal_minutes = models.PositiveIntegerField(default=480)
    study_weekly_goal_minutes = models.PositiveIntegerField(default=2880)
    study_leaderboard_hidden = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'library')

    def clean(self):
        super().clean()
        if (self.status or '').lower() == 'live' and self.user:
            conflict = Student.objects.filter(
                user=self.user,
                status__iexact='live',
            ).exclude(pk=self.pk).exists()
            if conflict:
                from django.core.exceptions import ValidationError
                raise ValidationError("Student can be Live in only one library at a time.")

    def save(self, *args, **kwargs):
        self.clean()
        if not self.student_code:
            self.student_code = f'STU-{uuid.uuid4().hex[:6].upper()}'
        if not self.qr_card_id:
            self.qr_card_id = f'QR-{uuid.uuid4().hex[:12].upper()}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.name} ({self.student_code})'


class StudentMembership(models.Model):
    """Student fee plan membership & seat/shift enrollment."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='memberships',
    )
    plan = models.ForeignKey(
        'billing.FeePlan',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='memberships',
    )
    seat = models.ForeignKey(
        'seats.Seat',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='memberships',
    )
    shift = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=MEMBERSHIP_STATUS_CHOICES,
        default='Active',
    )
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODE_CHOICES)
    auto_renewal = models.BooleanField(default=False)
    plan_name_snapshot = models.CharField(max_length=100, blank=True, default='')
    price_snapshot = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    renewal_count = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.plan_id:
            if not self.plan_name_snapshot:
                self.plan_name_snapshot = self.plan.name
            if not self.price_snapshot:
                self.price_snapshot = self.plan.price
        super().save(*args, **kwargs)

    @property
    def library_id(self):
        return self.student.library_id

    def __str__(self):
        return f'{self.student.name} - {self.plan.name}'


class BranchChangeRequest(models.Model):
    """Student request to transfer between branches."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='branch_change_requests',
    )
    from_branch = models.ForeignKey(
        'libraries.Branch',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='branch_change_requests_from',
    )
    to_branch = models.ForeignKey(
        'libraries.Branch',
        on_delete=models.CASCADE,
        related_name='branch_change_requests_to',
    )
    reason = models.TextField(blank=True, default='')
    status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')],
        default='pending',
    )
    decision_note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class StudentLeaveRequest(models.Model):
    """Student request to end enrollment and mark status as Left."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='leave_requests',
    )
    reason = models.TextField(blank=True, default='')
    status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')],
        default='pending',
    )
    decision_note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class StudentDevice(models.Model):
    """Push notification device tokens for students."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='student_devices',
    )
    platform = models.CharField(max_length=10, choices=[('android', 'Android'), ('ios', 'iOS'), ('web', 'Web')])
    device_id = models.CharField(max_length=255)
    push_token = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'device_id')
        ordering = ['-last_seen_at']


class StudentNote(models.Model):
    """Internal admin notes on a student."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='admin_notes',
    )
    author = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    author_name = models.CharField(max_length=150, blank=True, default='')
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Note on {self.student.name} ({self.created_at.date()})'


class StudentDocument(models.Model):
    """Identity, address proof, or registration documents uploaded for a student."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='documents',
    )
    doc_type = models.CharField(max_length=50, default='id_proof')
    file_url = models.URLField(max_length=500)
    original_name = models.CharField(max_length=255, blank=True, default='')
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.doc_type} for {self.student.name}'



class StudentFeedbackTicket(models.Model):
    """Student feedback and complaints raised in the student app."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=30, unique=True, blank=True)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='feedback_tickets',
    )
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='feedback_tickets',
    )
    subject = models.CharField(max_length=255)
    type = models.CharField(max_length=30, default='feedback')
    status = models.CharField(max_length=20, default='open')
    assigned_to = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_feedback_tickets',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_feedback_tickets'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            self.ticket_number = f'FB-{uuid.uuid4().hex[:8].upper()}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.ticket_number} - {self.subject}'


class StudentFeedbackMessage(models.Model):
    """Messages and staff responses in a StudentFeedbackTicket thread."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(
        StudentFeedbackTicket,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='sent_feedback_messages',
    )
    message = models.TextField()
    is_staff_reply = models.BooleanField(default=False)
    attachment_file_id = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'student_feedback_messages'
        ordering = ['created_at']

    def __str__(self):
        return f'Message on {self.ticket.ticket_number}'
