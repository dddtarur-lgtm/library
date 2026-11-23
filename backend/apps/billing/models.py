"""Billing models: SubscriptionPlan, LibrarySubscription, PlatformPayment, FeePlan, Coupon, CashDayBookEntry."""
import uuid
from django.db import models

from apps.libraries.models import BILLING_CYCLE_CHOICES, PLAN_STATUS_CHOICES

PLATFORM_PAYMENT_METHOD_CHOICES = [
    ('Razorpay', 'Razorpay'),
    ('UPI', 'UPI'),
    ('Bank Transfer', 'Bank Transfer'),
    ('Cash', 'Cash'),
    ('Cheque', 'Cheque'),
]

PLATFORM_PAYMENT_TYPE_CHOICES = [
    ('Subscription', 'Subscription'),
    ('Renewal', 'Renewal'),
    ('Branch Expansion', 'Branch Expansion'),
    ('Manual Adjust', 'Manual Adjust'),
]

PLATFORM_PAYMENT_STATUS_CHOICES = [
    ('Success', 'Success'),
    ('Failed', 'Failed'),
    ('Pending', 'Pending'),
]

DISCOUNT_TYPE_CHOICES = [
    ('Percentage', 'Percentage'),
    ('Flat Amount', 'Flat Amount'),
]

CASHBOOK_PAYMENT_MODE_CHOICES = [
    ('Cash', 'Cash'),
    ('UPI QR', 'UPI QR'),
    ('Card', 'Card'),
]


class SubscriptionPlan(models.Model):
    """Platform-level SaaS subscription plans (Starter / Growth / Pro / Enterprise)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True, default='')
    tier = models.PositiveIntegerField(unique=True)
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2)
    quarterly_fee = models.DecimalField(max_digits=10, decimal_places=2)
    annual_fee = models.DecimalField(max_digits=10, decimal_places=2)
    max_branches = models.PositiveIntegerField()
    max_seats = models.PositiveIntegerField()
    max_students = models.PositiveIntegerField(null=True, blank=True)
    max_staff = models.PositiveIntegerField(null=True, blank=True)
    features = models.JSONField(default=dict, blank=True)
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['tier']

    def __str__(self):
        return f'{self.name} (Tier {self.tier})'


class LibrarySubscription(models.Model):
    """Tenant library subscription lifecycle record."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='subscriptions',
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name='subscriptions',
    )
    billing_cycle = models.CharField(
        max_length=20, choices=BILLING_CYCLE_CHOICES, default='Monthly'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=20, choices=PLAN_STATUS_CHOICES, default='Trial'
    )
    grace_ends = models.DateField(null=True, blank=True)
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2)
    auto_renew = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.library.name} - {self.plan.name} ({self.status})'


class PlatformPayment(models.Model):
    """Platform-level payment and invoice record for library subscriptions."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='platform_payments',
    )
    subscription = models.ForeignKey(
        LibrarySubscription,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='payments',
    )
    transaction_id = models.CharField(max_length=100, unique=True, blank=True)
    invoice_no = models.CharField(max_length=40, blank=True, default='')
    library_name_snapshot = models.CharField(max_length=255, blank=True, default='')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    method = models.CharField(max_length=20, choices=PLATFORM_PAYMENT_METHOD_CHOICES)
    type = models.CharField(max_length=30, choices=PLATFORM_PAYMENT_TYPE_CHOICES)
    status = models.CharField(
        max_length=20, choices=PLATFORM_PAYMENT_STATUS_CHOICES, default='Success'
    )
    reference_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True, default='')
    paid_at = models.DateTimeField(null=True, blank=True)
    recorded_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='recorded_platform_payments',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.transaction_id:
            self.transaction_id = f'TXN-{uuid.uuid4().hex[:10].upper()}'
        if not self.invoice_no:
            self.invoice_no = f'INV-{uuid.uuid4().hex[:8].upper()}'
        if self.library_id and not self.library_name_snapshot:
            self.library_name_snapshot = self.library.name
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.transaction_id} - {self.library.name} ({self.amount})'


class FeePlan(models.Model):
    """Library-level student fee plans."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='fee_plans',
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    duration_days = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    benefits = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    badge_text = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sort_order', 'price', '-created_at']

    def __str__(self):
        return f'{self.library.name} - {self.name}'


class Coupon(models.Model):
    """Discount coupon scoped to a tenant library."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='coupons',
    )
    code = models.CharField(max_length=50)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES)
    discount_value = models.DecimalField(max_digits=8, decimal_places=2)
    min_purchase = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    valid_until = models.DateField()
    usage_limit = models.PositiveIntegerField()
    used_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('library', 'code')]
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.strip().upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.code} ({self.library.code})'


class CashDayBookEntry(models.Model):
    """Daily cash/counter collection ledger entry for a library branch."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='cashbook_entries',
    )
    branch = models.ForeignKey(
        'libraries.Branch',
        on_delete=models.CASCADE,
        related_name='cashbook_entries',
    )
    date = models.DateField()
    recorded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cashbook_entries',
    )
    shift = models.CharField(max_length=20)
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cashbook_entries',
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_mode = models.CharField(max_length=20, choices=CASHBOOK_PAYMENT_MODE_CHOICES)
    receipt_no = models.CharField(max_length=50, blank=True)
    purpose = models.CharField(max_length=50)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Cash Day Book Entries'
        ordering = ['-date', '-created_at']

    def save(self, *args, **kwargs):
        if not self.receipt_no:
            self.receipt_no = f'RCP-{uuid.uuid4().hex[:8].upper()}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.receipt_no} - {self.amount} ({self.date})'


STUDENT_PAYMENT_MODE_CHOICES = [
    ('cash', 'Cash'),
    ('upi', 'UPI'),
    ('card', 'Card'),
    ('bank', 'Bank Transfer'),
    ('razorpay', 'Razorpay'),
    ('other', 'Other'),
]

STUDENT_PAYMENT_STATUS_CHOICES = [
    ('paid', 'Paid'),
    ('pending', 'Pending'),
    ('failed', 'Failed'),
    ('cancelled', 'Cancelled'),
    ('refunded', 'Refunded'),
    ('partially_refunded', 'Partially Refunded'),
]

DUE_STATUS_CHOICES = [
    ('open', 'Open'),
    ('paid', 'Paid'),
    ('waived', 'Waived'),
]

CHARGE_TYPE_CHOICES = [
    ('plan_fee', 'Plan Fee'),
    ('late_fee', 'Late Fee'),
    ('seat_fee', 'Seat Fee'),
    ('locker_fee', 'Locker Fee'),
    ('other', 'Other'),
]


class Payment(models.Model):
    """Fee payment collected by library from student."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='fee_payments',
    )
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='fee_payments',
    )
    branch = models.ForeignKey(
        'libraries.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='fee_payments',
    )
    membership = models.ForeignKey(
        'students.StudentMembership',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='fee_payments',
    )
    receipt_no = models.CharField(max_length=60, unique=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    mode = models.CharField(max_length=20, choices=STUDENT_PAYMENT_MODE_CHOICES, default='cash')
    status = models.CharField(max_length=20, choices=STUDENT_PAYMENT_STATUS_CHOICES, default='paid')
    payment_date = models.DateField()
    paid_at = models.DateTimeField(null=True, blank=True)
    transaction_ref = models.CharField(max_length=120, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    refund_reason = models.TextField(blank=True, default='')
    recorded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recorded_fee_payments',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-payment_date', '-created_at']

    def save(self, *args, **kwargs):
        if not self.receipt_no:
            self.receipt_no = f'RCP-{uuid.uuid4().hex[:10].upper()}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.receipt_no} - {self.student.full_name} ({self.amount})'


class FeeDue(models.Model):
    """Outstanding charge / due for student."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='dues',
    )
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='dues',
    )
    charge_type = models.CharField(max_length=30, choices=CHARGE_TYPE_CHOICES, default='plan_fee')
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    promise_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=DUE_STATUS_CHOICES, default='open')
    waived_reason = models.TextField(blank=True, default='')
    last_reminder_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date', '-created_at']

    def __str__(self):
        return f'Due: {self.student.full_name} - {self.description} ({self.amount})'


class Refund(models.Model):
    """Refund transaction on student payment."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='fee_refunds',
    )
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='refunds',
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    mode = models.CharField(max_length=20, choices=STUDENT_PAYMENT_MODE_CHOICES, default='cash')
    reason = models.TextField()
    status = models.CharField(max_length=20, default='completed')
    recorded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recorded_fee_refunds',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Refund {self.id}: {self.amount} for {self.payment.receipt_no}'


class Invoice(models.Model):
    """Tax / billing invoice for fee payment."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='invoices',
    )
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='invoices',
    )
    payment = models.OneToOneField(
        Payment,
        on_delete=models.CASCADE,
        related_name='invoice',
        null=True,
        blank=True,
    )
    invoice_no = models.CharField(max_length=60, unique=True, blank=True)
    invoice_date = models.DateField()
    taxable_amount = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-invoice_date', '-created_at']

    def save(self, *args, **kwargs):
        if not self.invoice_no:
            self.invoice_no = f'INV-{uuid.uuid4().hex[:10].upper()}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.invoice_no} ({self.total_amount})'


class CashDayBookRecord(models.Model):
    """Daily cash register record for a member at a branch."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='day_book_records',
    )
    branch = models.ForeignKey(
        'libraries.Branch',
        on_delete=models.CASCADE,
        related_name='day_book_records',
    )
    member = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='day_book_records',
    )
    date = models.DateField()
    opening_cash = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    counted_cash = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    difference = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    note = models.TextField(blank=True, default='')
    is_locked = models.BooleanField(default=False)
    closed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('library', 'branch', 'member', 'date')]
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.date} - {self.branch.name} - {self.member.first_name} ({"Locked" if self.is_locked else "Open"})'




class PaymentWebhookEvent(models.Model):
    """Logs provider webhook calls to ensure idempotency and prevent replay."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.CharField(max_length=50, default='razorpay')
    event_id = models.CharField(max_length=255, db_index=True)
    event_type = models.CharField(max_length=100)
    payload = models.JSONField(default=dict)
    is_processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payment_webhook_events'
        unique_together = ('provider', 'event_id')

    def __str__(self):
        return f'{self.provider} - {self.event_type} ({self.event_id})'
