"""Django admin configuration for books app."""
from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from .models import Book, BookLoan, BookRequest


@admin.register(Book)
class BookAdmin(ModelAdmin):
    """Admin configuration for Book."""

    list_display = ('title', 'author', 'isbn', 'category', 'library', 'total_copies', 'price')
    list_filter = ('category', 'library')
    search_fields = ('title', 'author', 'isbn', 'book_number')


@admin.register(BookLoan)
class BookLoanAdmin(ModelAdmin):
    """Admin configuration for BookLoan."""

    list_display = ('book', 'copy_barcode', 'student', 'issued_at', 'due_date', 'status', 'fine_amount', 'fine_status')
    list_filter = ('status', 'fine_status')
    search_fields = ('book__title', 'student__name', 'copy_barcode')


@admin.register(BookRequest)
class BookRequestAdmin(ModelAdmin):
    """Admin configuration for BookRequest."""

    list_display = ('title', 'author', 'category', 'student', 'library', 'upvotes', 'status')
    list_filter = ('status', 'category', 'library')
    search_fields = ('title', 'author', 'student__name')
