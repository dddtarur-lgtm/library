"""Custom User model, UserManager, and StaffPermission model."""
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

ROLE_CHOICES = [
    ('SUPER_ADMIN', 'Super Admin'),
    ('LIBRARY_OWNER', 'Library Owner'),
    ('SUB_ADMIN', 'Sub Admin'),
    ('STAFF', 'Staff'),
    ('STUDENT', 'Student'),
]

PERMISSION_LEVEL_CHOICES = [
    ('No Access', 'No Access'),
    ('View Only', 'View Only'),
    ('Full Access', 'Full Access'),
]


class UserManager(BaseUserManager):
    """Custom manager for email-based User authentication."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password."""
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email).strip().lower()
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        """Create and save a Super Admin user."""
        extra_fields.setdefault('role', 'SUPER_ADMIN')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('email_verified', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Platform & Library user model with UUID PK and email login."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=100, blank=True, default='')
    last_name = models.CharField(max_length=50)
    username = models.CharField(max_length=50, unique=True, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    preferred_language = models.CharField(max_length=10, default='en')
    status = models.CharField(max_length=20, default='ONLINE')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='LIBRARY_OWNER')
    phone = models.CharField(max_length=20, blank=True)

    # Library FK — null for SUPER_ADMIN, set for LIBRARY_OWNER/SUB_ADMIN/STAFF
    library = models.ForeignKey(
        'libraries.Library',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='users',
    )
    assigned_branches = models.ManyToManyField(
        'libraries.Branch',
        blank=True,
        related_name='sub_admins',
    )

    # Email verification (OTP hash + timestamps)
    email_verified = models.BooleanField(default=False)
    email_otp = models.CharField(max_length=128, blank=True, null=True)
    email_otp_expires = models.DateTimeField(null=True, blank=True)
    email_otp_sent_at = models.DateTimeField(null=True, blank=True)

    # Password reset
    password_reset_token = models.CharField(max_length=128, blank=True, null=True)
    password_reset_expires = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    perm_ver = models.PositiveIntegerField(default=1)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        ordering = ['-created_at']

    @property
    def name(self) -> str:
        """Full display name used in NextAuth payloads."""
        return f'{self.first_name} {self.last_name}'.strip()

    def get_full_name(self) -> str:
        """Standard Django get_full_name helper."""
        return self.name or self.email

    def get_short_name(self) -> str:
        return self.first_name or self.email

    @property
    def student_profile(self):
        """Return the primary student profile linked to this user account."""
        return self.students.first()

    def __str__(self) -> str:
        return self.email


class StaffPermission(models.Model):
    """Granular module-level permissions for library staff / sub-admins."""

    staff = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='staff_permission',
    )
    students = models.CharField(
        max_length=20, choices=PERMISSION_LEVEL_CHOICES, default='Full Access'
    )
    fees_plans = models.CharField(
        max_length=20, choices=PERMISSION_LEVEL_CHOICES, default='Full Access'
    )
    seats = models.CharField(
        max_length=20, choices=PERMISSION_LEVEL_CHOICES, default='View Only'
    )
    attendance = models.CharField(
        max_length=20, choices=PERMISSION_LEVEL_CHOICES, default='Full Access'
    )
    books = models.CharField(
        max_length=20, choices=PERMISSION_LEVEL_CHOICES, default='View Only'
    )
    settings = models.CharField(
        max_length=20, choices=PERMISSION_LEVEL_CHOICES, default='No Access'
    )
    security = models.CharField(
        max_length=20, choices=PERMISSION_LEVEL_CHOICES, default='No Access'
    )
    can_view_revenue = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f'Permissions for {self.staff.email}'


DELETION_TARGET_CHOICES = [
    ('ACCOUNT', 'User Account'),
    ('LIBRARY', 'Library Tenant'),
    ('STUDENT', 'Student Profile'),
]

DELETION_STATUS_CHOICES = [
    ('Pending', 'Pending'),
    ('Approved', 'Approved'),
    ('Rejected', 'Rejected'),
]


class DeletionRequest(models.Model):
    """Request to delete/deactivate an account, library, or student profile."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    target_type = models.CharField(
        max_length=20, choices=DELETION_TARGET_CHOICES, default='ACCOUNT'
    )
    requested_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='deletion_requests',
    )
    library = models.ForeignKey(
        'libraries.Library',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='deletion_requests',
    )
    student = models.ForeignKey(
        'students.Student',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='deletion_requests',
    )
    reason = models.TextField()
    status = models.CharField(
        max_length=20, choices=DELETION_STATUS_CHOICES, default='Pending'
    )
    review_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_deletion_requests',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'{self.target_type} deletion by {self.requested_by.email} ({self.status})'

