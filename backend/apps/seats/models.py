"""Seat, Floor, Layout, Allocation, Locker, and AttendanceRecord models."""
import uuid
from django.db import models

SEAT_TYPE_CHOICES = [
    ('Desk', 'Desk'),
    ('Cabin', 'Cabin'),
    ('PC', 'PC'),
    ('Locker', 'Locker'),
]

SEAT_PHYSICAL_STATUS_CHOICES = [
    ('available', 'Available'),
    ('occupied', 'Occupied'),
    ('reserved', 'Reserved'),
    ('maintenance', 'Maintenance'),
    ('hidden', 'Hidden'),
]

ATTENDANCE_METHOD_CHOICES = [
    ('QR Scan', 'QR Scan'),
    ('Staff Manual', 'Staff Manual'),
    ('Auto-Checkout', 'Auto-Checkout'),
]

ATTENDANCE_STATUS_CHOICES = [
    ('Present', 'Present'),
    ('Late Entry', 'Late Entry'),
    ('Under-time', 'Under-time'),
    ('Auto-Checkout', 'Auto-Checkout'),
    ('Absent', 'Absent'),
]


class Floor(models.Model):
    """Floor plan within a branch."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey(
        'libraries.Branch',
        on_delete=models.CASCADE,
        related_name='floors',
    )
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True, default='')
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('branch', 'name')]
        ordering = ['sort_order', 'name']

    def __str__(self):
        return f'{self.branch.name} - {self.name}'


class FloorRow(models.Model):
    """Row or corridor grouping of seats on a floor."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    floor = models.ForeignKey(
        Floor,
        on_delete=models.CASCADE,
        related_name='rows',
    )
    label = models.CharField(max_length=50)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'label']

    def __str__(self):
        return f'{self.floor.name} - {self.label}'


class SeatCategory(models.Model):
    """Category classification for seats (e.g. Regular, Girls Only, Premium)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='seat_categories',
    )
    code = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
    allowed_gender = models.CharField(
        max_length=10,
        choices=[('any', 'Any'), ('female', 'Female'), ('male', 'Male')],
        default='any'
    )
    color = models.CharField(max_length=30, blank=True, default='#4F46E5')
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('library', 'code')]
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.allowed_gender})'


class Shift(models.Model):
    """Operating study shift / batch within a library or branch."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='shifts',
    )
    branch = models.ForeignKey(
        'libraries.Branch',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='shifts',
    )
    name = models.CharField(max_length=100)
    start_minute = models.PositiveIntegerField(default=360)
    end_minute = models.PositiveIntegerField(default=720)
    is_full_day = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['start_minute', 'name']

    def __str__(self):
        return f'{self.name} ({self.start_minute//60:02d}:{self.start_minute%60:02d} - {self.end_minute//60:02d}:{self.end_minute%60:02d})'


class Seat(models.Model):
    """Physical seat, cabin, or PC desk within a library branch."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey(
        'libraries.Branch',
        on_delete=models.CASCADE,
        related_name='seats',
    )
    floor_rel = models.ForeignKey(
        Floor,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='seats',
    )
    row = models.ForeignKey(
        FloorRow,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='seats',
    )
    category = models.ForeignKey(
        SeatCategory,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='seats',
    )
    label = models.CharField(max_length=20)
    floor = models.PositiveIntegerField(default=1)
    zone = models.CharField(max_length=50, blank=True)
    type = models.CharField(
        max_length=20,
        choices=SEAT_TYPE_CHOICES,
        default='Desk',
    )
    physical_status = models.CharField(
        max_length=20,
        choices=SEAT_PHYSICAL_STATUS_CHOICES,
        default='available',
    )
    maintenance_reason = models.TextField(blank=True, default='')
    layout = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    is_reserved_for_girls = models.BooleanField(default=False)
    notes = models.TextField(blank=True, default='')
    student = models.ForeignKey(
        'students.Student',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_seats',
    )

    class Meta:
        unique_together = ('branch', 'label')
        ordering = ['floor', 'label']

    @property
    def library_id(self):
        return self.branch.library_id

    @property
    def is_occupied(self):
        return self.student_id is not None or self.physical_status == 'occupied'

    def __str__(self):
        return f'{self.branch.name} - {self.label}'


class SeatAllocation(models.Model):
    """Specific shift-based or full allocation of a seat to a student."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seat = models.ForeignKey(
        Seat,
        on_delete=models.CASCADE,
        related_name='allocations',
    )
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='seat_allocations',
    )
    shift = models.ForeignKey(
        Shift,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='allocations',
    )
    membership = models.ForeignKey(
        'students.StudentMembership',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='seat_allocations',
    )
    from_date = models.DateField()
    to_date = models.DateField(null=True, blank=True)
    released_at = models.DateTimeField(null=True, blank=True)
    allocated_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='allocations_made',
    )
    reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-from_date', '-created_at']

    @property
    def is_active(self):
        return self.released_at is None

    def __str__(self):
        return f'{self.seat.label} -> {self.student.name} ({self.from_date})'


class SeatReservation(models.Model):
    """Temporary reservation of a seat for a student or prospective member."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seat = models.ForeignKey(
        Seat,
        on_delete=models.CASCADE,
        related_name='reservations',
    )
    shift = models.ForeignKey(
        Shift,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reservations',
    )
    student = models.ForeignKey(
        'students.Student',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='seat_reservations',
    )
    reserved_for = models.CharField(max_length=100, blank=True, default='')
    reserved_until = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=[('active', 'Active'), ('converted', 'Converted'), ('expired', 'Expired'), ('cancelled', 'Cancelled')],
        default='active',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-reserved_until']

    def __str__(self):
        return f'Reservation: {self.seat.label} for {self.reserved_for or (self.student.name if self.student else "Unknown")}'


class SeatWaitingList(models.Model):
    """Waiting list entry for students desiring a seat or category."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='seat_waiting_entries',
    )
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='seat_waiting_entries',
    )
    shift = models.ForeignKey(
        Shift,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='waiting_entries',
    )
    category = models.ForeignKey(
        SeatCategory,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='waiting_entries',
    )
    status = models.CharField(
        max_length=20,
        choices=[('waiting', 'Waiting'), ('offered', 'Offered'), ('fulfilled', 'Fulfilled'), ('cancelled', 'Cancelled')],
        default='waiting',
    )
    offered_seat = models.ForeignKey(
        Seat,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='offered_to_waiting',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Waiting: {self.student.name} ({self.status})'


class SeatChangeRequest(models.Model):
    """Student request to switch to a different seat or category."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='seat_change_requests',
    )
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='seat_change_requests',
    )
    current_seat = models.ForeignKey(
        Seat,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='current_for_change_requests',
    )
    requested_seat = models.ForeignKey(
        Seat,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='requested_for_change_requests',
    )
    requested_category = models.ForeignKey(
        SeatCategory,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='requested_change_requests',
    )
    reason = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')],
        default='pending',
    )
    note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Seat Change: {self.student.name} ({self.status})'


class Locker(models.Model):
    """Physical locker amenity."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey(
        'libraries.Branch',
        on_delete=models.CASCADE,
        related_name='lockers',
    )
    number = models.CharField(max_length=30)
    status = models.CharField(
        max_length=20,
        choices=[('available', 'Available'), ('occupied', 'Occupied'), ('maintenance', 'Maintenance')],
        default='available',
    )
    student = models.ForeignKey(
        'students.Student',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_lockers',
    )
    from_date = models.DateField(null=True, blank=True)
    to_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('branch', 'number')]
        ordering = ['number']

    def __str__(self):
        return f'{self.branch.name} Locker {self.number} ({self.status})'



class SeatAllocationHistory(models.Model):
    """Audit trail of seat assignments and releases."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seat = models.ForeignKey(
        Seat,
        on_delete=models.CASCADE,
        related_name='allocation_history',
    )
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='seat_history',
    )
    allocated_at = models.DateTimeField()
    released_at = models.DateTimeField(null=True, blank=True)
    allocated_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='seat_allocations',
    )
    reason = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['-allocated_at']
        verbose_name_plural = 'Seat allocation histories'

    @property
    def library_id(self):
        return self.seat.branch.library_id

    def __str__(self):
        return f'{self.seat.label} -> {self.student.name}'


class AttendanceRecord(models.Model):
    """Student check-in / check-out attendance & study hours record."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='attendance_records',
    )
    branch = models.ForeignKey(
        'libraries.Branch',
        on_delete=models.CASCADE,
        related_name='attendance_records',
    )
    seat = models.ForeignKey(
        Seat,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='attendance_records',
    )
    shift = models.CharField(max_length=50, default='Morning')
    date = models.DateField()
    time_in = models.DateTimeField()
    time_out = models.DateTimeField(null=True, blank=True)
    total_minutes = models.PositiveIntegerField(null=True, blank=True)
    method = models.CharField(
        max_length=20,
        choices=ATTENDANCE_METHOD_CHOICES,
        default='Staff Manual',
    )
    status = models.CharField(
        max_length=20,
        choices=ATTENDANCE_STATUS_CHOICES,
        default='Present',
    )
    late_mark = models.BooleanField(default=False)
    under_time = models.BooleanField(default=False)
    marked_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='marked_attendance',
    )
    note = models.TextField(blank=True)
    location_ok = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-time_in']

    @property
    def library_id(self):
        return self.branch.library_id

    def __str__(self):
        return f'{self.student.name} ({self.date}) - {self.status}'


class AttendanceQRCode(models.Model):
    """Dynamic / rotating or standing QR code for student check-in/out."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='qr_codes',
    )
    branch = models.ForeignKey(
        'libraries.Branch',
        on_delete=models.CASCADE,
        related_name='qr_codes',
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    name = models.CharField(max_length=100, default='Front Door QR')
    expiry_option = models.CharField(max_length=20, default='day')
    allowed_radius_m = models.PositiveIntegerField(default=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    auto_renew = models.BooleanField(default=True)
    status = models.CharField(max_length=20, default='active')
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} - {self.branch.name} ({self.status})'


class ScanAttempt(models.Model):
    """Log of every scan attempt with GPS validation, device info, and review status."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='scan_attempts',
    )
    student = models.ForeignKey(
        'students.Student',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='scan_attempts',
    )
    qr_code = models.ForeignKey(
        AttendanceQRCode,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='scans',
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    accuracy_m = models.FloatField(null=True, blank=True)
    device_id = models.CharField(max_length=120, blank=True, default='')
    is_mock_location = models.BooleanField(default=False)
    result = models.CharField(max_length=20, default='accepted')  # accepted, flagged, rejected
    reason = models.CharField(max_length=255, blank=True, default='')
    reviewed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Scan by {self.student.name if self.student else "Unknown"}: {self.result}'


class Holiday(models.Model):
    """Calendar holidays and scheduled library closures."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='holidays',
    )
    branch = models.ForeignKey(
        'libraries.Branch',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='holidays',
    )
    holiday_date = models.DateField()
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['holiday_date']

    def __str__(self):
        return f'{self.holiday_date}: {self.title}'


class StudySession(models.Model):
    """Timer-tracked study session for a student."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='study_sessions',
    )
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='study_sessions',
    )
    subject_tag = models.CharField(max_length=100, default='General')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=0)
    paused_minutes = models.PositiveIntegerField(default=0)
    breaks_count = models.PositiveIntegerField(default=0)
    breaks_data = models.JSONField(default=list, blank=True)
    current_break_started_at = models.DateTimeField(null=True, blank=True)
    current_break_type = models.CharField(max_length=30, blank=True, default='')
    current_break_id = models.UUIDField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[('running', 'Running'), ('paused', 'Paused'), ('completed', 'Completed'), ('cancelled', 'Cancelled')],
        default='running',
    )
    last_heartbeat_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_time']

    def __str__(self):
        return f'{self.student.name} - {self.subject_tag} ({self.duration_minutes} min, {self.status})'

