"""Book, BookLoan, and BookRequest models."""
import uuid
from django.db import models

LOAN_STATUS_CHOICES = [
    ('Issued', 'Issued'),
    ('Returned', 'Returned'),
    ('Overdue', 'Overdue'),
    ('Lost', 'Lost'),
]

FINE_STATUS_CHOICES = [
    ('Unpaid', 'Unpaid'),
    ('Paid', 'Paid'),
    ('Waived', 'Waived'),
    ('N/A', 'N/A'),
]

BOOK_REQUEST_STATUS_CHOICES = [
    ('Requested', 'Requested'),
    ('Approved', 'Approved'),
    ('Ordered', 'Ordered'),
    ('Available', 'Available'),
    ('Rejected', 'Rejected'),
]


class BookCategory(models.Model):
    """Categorization for books (e.g. UPSC, Engineering, Fiction)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='book_categories',
    )
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('library', 'name')]
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.library.name})'


class Book(models.Model):
    """Library book catalog entry."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='books',
    )
    category_ref = models.ForeignKey(
        BookCategory,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='books',
    )
    book_number = models.CharField(max_length=30, blank=True)
    title = models.CharField(max_length=500)
    author = models.CharField(max_length=255)
    isbn = models.CharField(max_length=20)
    category = models.CharField(max_length=100)
    rack_location = models.CharField(max_length=50, blank=True)
    total_copies = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    publisher = models.CharField(max_length=255, blank=True)
    edition_year = models.PositiveIntegerField(null=True, blank=True)
    cover_image = models.ImageField(upload_to='book_covers/', null=True, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def available_copies(self):
        active_loans = self.loans.filter(status__in=['Issued', 'Overdue']).count()
        return max(0, self.total_copies - active_loans)

    def __str__(self):
        return f'{self.title} by {self.author}'


class BookCopy(models.Model):
    """Individual physical copy of a book with barcode."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='copies',
    )
    branch = models.ForeignKey(
        'libraries.Branch',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='book_copies',
    )
    barcode = models.CharField(max_length=50, unique=True, db_index=True)
    rack = models.CharField(max_length=50, blank=True, default='')
    status = models.CharField(
        max_length=20,
        choices=[('available', 'Available'), ('issued', 'Issued'), ('lost', 'Lost'), ('damaged', 'Damaged'), ('archived', 'Archived')],
        default='available',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['barcode']

    def __str__(self):
        return f'{self.barcode} ({self.book.title}) - {self.status}'



class BookLoan(models.Model):
    """Book lending / return / fine tracking record."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    book = models.ForeignKey(
        Book,
        on_delete=models.PROTECT,
        related_name='loans',
    )
    copy_barcode = models.CharField(max_length=50)
    copy = models.ForeignKey(
        BookCopy,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='loans',
    )
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='book_loans',
    )
    issued_at = models.DateTimeField()
    due_date = models.DateField()
    returned_at = models.DateTimeField(null=True, blank=True)
    renew_count = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=LOAN_STATUS_CHOICES,
        default='Issued',
    )
    fine_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    fine_status = models.CharField(
        max_length=20,
        choices=FINE_STATUS_CHOICES,
        default='N/A',
    )

    class Meta:
        ordering = ['-issued_at']

    @property
    def library_id(self):
        return self.book.library_id

    def __str__(self):
        return f'{self.book.title} -> {self.student.name} ({self.status})'


class BookRequest(models.Model):
    """Student request for a new book to be added to the library."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='book_requests',
    )
    book = models.ForeignKey(
        Book,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='requests',
    )
    copy = models.ForeignKey(
        BookCopy,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='requests',
    )
    title = models.CharField(max_length=500)
    author = models.CharField(max_length=255, blank=True, default='')
    category = models.CharField(max_length=100, blank=True, default='')
    note = models.TextField(blank=True, default='')
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='book_requests',
    )
    upvotes = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=30,
        choices=BOOK_REQUEST_STATUS_CHOICES,
        default='Requested',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-upvotes', '-created_at']

    def __str__(self):
        return f'{self.title} ({self.status})'


class BookFine(models.Model):
    """Fine levied for overdue, lost, or damaged books."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    loan = models.ForeignKey(
        BookLoan,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='fines',
    )
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='fines',
    )
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    reason = models.CharField(max_length=255)
    status = models.CharField(
        max_length=20,
        choices=[('unpaid', 'Unpaid'), ('paid', 'Paid'), ('waived', 'Waived')],
        default='unpaid',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Fine {self.amount} for {self.student.name} ({self.status})'


class StockAudit(models.Model):
    """Periodic book inventory audit."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        on_delete=models.CASCADE,
        related_name='stock_audits',
    )
    branch = models.ForeignKey(
        'libraries.Branch',
        on_delete=models.CASCADE,
        related_name='stock_audits',
    )
    rack = models.CharField(max_length=50, blank=True, default='')
    status = models.CharField(
        max_length=20,
        choices=[('open', 'Open'), ('completed', 'Completed')],
        default='open',
    )
    expected_count = models.PositiveIntegerField(default=0)
    scanned_barcodes = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Stock Audit {self.branch.name} ({self.status})'

