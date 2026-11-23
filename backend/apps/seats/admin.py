"""Django admin configuration for seats and attendance app."""
from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from .models import AttendanceRecord, Seat, SeatAllocationHistory


@admin.register(Seat)
class SeatAdmin(ModelAdmin):
    """Admin configuration for Seat."""

    list_display = ('label', 'branch', 'floor', 'zone', 'type', 'is_active', 'student')
    list_filter = ('type', 'is_active', 'floor', 'branch')
    search_fields = ('label', 'zone', 'student__name', 'student__student_code')


@admin.register(SeatAllocationHistory)
class SeatAllocationHistoryAdmin(ModelAdmin):
    """Admin configuration for SeatAllocationHistory."""

    list_display = ('seat', 'student', 'allocated_at', 'released_at', 'allocated_by')
    list_filter = ('allocated_at',)
    search_fields = ('seat__label', 'student__name')


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(ModelAdmin):
    """Admin configuration for AttendanceRecord."""

    list_display = ('student', 'branch', 'seat', 'date', 'time_in', 'time_out', 'total_minutes', 'method', 'status')
    list_filter = ('status', 'method', 'date', 'branch')
    search_fields = ('student__name', 'student__student_code')
