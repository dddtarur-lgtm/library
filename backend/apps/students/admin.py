"""Django admin configuration for students app."""
from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from .models import Student, StudentMembership


@admin.register(Student)
class StudentAdmin(ModelAdmin):
    """Admin configuration for Student."""

    list_display = ('student_code', 'name', 'library', 'branch', 'phone', 'status', 'is_deleted')
    list_filter = ('status', 'gender', 'is_deleted', 'library')
    search_fields = ('student_code', 'name', 'email', 'phone', 'qr_card_id')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(StudentMembership)
class StudentMembershipAdmin(ModelAdmin):
    """Admin configuration for StudentMembership."""

    list_display = ('student', 'shift', 'start_date', 'end_date', 'status', 'amount_paid', 'payment_mode')
    list_filter = ('status', 'payment_mode', 'auto_renewal')
    search_fields = ('student__name', 'student__student_code')
    readonly_fields = ('created_at',)
