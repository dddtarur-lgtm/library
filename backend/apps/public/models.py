"""Models for Public Website APIs: Enquiries, Reviews, Facilities, Achievers, and Visits."""
import uuid
from django.conf import settings
from django.db import models


class LibraryEnquiry(models.Model):
    """Visitor enquiry / lead generated from public library page."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='enquiries',
    )
    branch = models.ForeignKey(
        'libraries.Branch',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='enquiries',
    )
    name = models.CharField(max_length=255)
    mobile = models.CharField(max_length=20)
    email = models.EmailField(blank=True, default='')
    message = models.TextField(blank=True, default='')
    source = models.CharField(max_length=50, default='page')
    status = models.CharField(max_length=20, default='new')
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_leads',
    )
    next_follow_up_at = models.DateTimeField(null=True, blank=True)
    lost_reason = models.TextField(blank=True, default='')
    notes = models.JSONField(default=list, blank=True)
    enrollment_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'public_library_enquiries'
        ordering = ['-created_at']

    def __str__(self):
        return f'Enquiry from {self.name} ({self.mobile})'


class LibraryReview(models.Model):
    """Student/visitor review of a library."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='public_reviews',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    student_name = models.CharField(max_length=100)
    rating = models.PositiveSmallIntegerField(default=5)
    comment = models.TextField(blank=True, default='')
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'public_library_reviews'
        ordering = ['-created_at']


class LibraryFacility(models.Model):
    """Facility cards displayed on public library page and student app."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='public_facilities',
    )
    name = models.CharField(max_length=100)
    icon_key = models.CharField(max_length=50, blank=True, default='wifi')
    description = models.TextField(blank=True, default='')
    image_url = models.CharField(max_length=500, blank=True, default='')
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'public_library_facilities'
        ordering = ['sort_order', 'name']


class LibraryAchiever(models.Model):
    """Exam toppers and achievers showcase."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='public_achievers',
    )
    name = models.CharField(max_length=100)
    photo_url = models.CharField(max_length=500, blank=True, default='')
    achievement = models.CharField(max_length=255)
    goal = models.CharField(max_length=100, blank=True, default='')
    year = models.PositiveSmallIntegerField(default=2024)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'public_library_achievers'
        ordering = ['-is_featured', 'sort_order', '-year']


class LibraryPageVisit(models.Model):
    """Anonymous page view tracking for analytics."""
    id = models.BigAutoField(primary_key=True)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='page_visits',
    )
    session_id = models.UUIDField()
    referrer = models.CharField(max_length=255, blank=True, default='')
    visited_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'public_library_page_visits'
        ordering = ['-visited_at']



class LibraryBanner(models.Model):
    """Banners for the public library website."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='public_banners',
    )
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True, default='')
    image_url = models.CharField(max_length=500, blank=True, default='')
    link_url = models.CharField(max_length=500, blank=True, default='')
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'public_library_banners'
        ordering = ['sort_order', '-created_at']


class LibraryGalleryItem(models.Model):
    """Photos and videos in the public library gallery."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='public_gallery',
    )
    media_type = models.CharField(max_length=20, default='image')
    url = models.CharField(max_length=500)
    caption = models.CharField(max_length=255, blank=True, default='')
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'public_library_gallery'
        ordering = ['sort_order', '-created_at']


class LibraryNotice(models.Model):
    """Notices published on the public page or student app."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='public_notices',
    )
    title = models.CharField(max_length=255)
    body = models.TextField()
    visible_to = models.CharField(max_length=20, default='public')
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'public_library_notices'
        ordering = ['-created_at']


class LibraryFaq(models.Model):
    """Frequently Asked Questions on public library page."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='public_faqs',
    )
    question = models.CharField(max_length=255)
    answer = models.TextField()
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'public_library_faqs'
        ordering = ['sort_order', 'id']
