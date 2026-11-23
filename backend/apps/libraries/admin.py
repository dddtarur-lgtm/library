"""Admin configuration for libraries app."""
from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from .models import (
    AttendanceQrKioskConfig,
    Branch,
    Library,
    LibraryDocument,
    LibraryRequest,
    LibrarySettings,
)


@admin.register(Library)
class LibraryAdmin(ModelAdmin):
    """Admin view for Library."""

    list_display = ('code', 'name', 'owner', 'city', 'plan_status', 'library_status')
    search_fields = ('code', 'name', 'city', 'owner__email')
    list_filter = ('plan_status', 'library_status')


@admin.register(Branch)
class BranchAdmin(ModelAdmin):
    """Admin view for Branch."""

    list_display = ('name', 'library', 'is_main', 'is_active')
    search_fields = ('name', 'library__name')
    list_filter = ('is_main', 'is_active')


class LibraryDocumentInline(TabularInline):
    """Inline documents on a LibraryRequest."""

    model = LibraryDocument
    extra = 0


@admin.register(LibraryRequest)
class LibraryRequestAdmin(ModelAdmin):
    """Admin view for LibraryRequest."""

    list_display = (
        'request_number',
        'library_name',
        'owner_name',
        'email',
        'status',
        'created_at',
    )
    search_fields = ('request_number', 'library_name', 'owner_name', 'email', 'city')
    list_filter = ('status', 'city', 'state')
    inlines = [LibraryDocumentInline]


@admin.register(LibraryDocument)
class LibraryDocumentAdmin(ModelAdmin):
    """Admin view for LibraryDocument."""

    list_display = ('title', 'request', 'file_size', 'created_at')
    search_fields = ('title', 'request__request_number')


@admin.register(LibrarySettings)
class LibrarySettingsAdmin(ModelAdmin):
    """Admin view for LibrarySettings."""

    list_display = (
        'library',
        'allow_student_self_register',
        'grace_days',
        'public_page_enabled',
        'updated_at',
    )
    search_fields = ('library__name', 'library__code', 'public_page_slug')


@admin.register(AttendanceQrKioskConfig)
class AttendanceQrKioskConfigAdmin(ModelAdmin):
    """Admin view for AttendanceQrKioskConfig."""

    list_display = (
        'branch',
        'is_enabled',
        'require_geo_fence',
        'refresh_interval_seconds',
        'last_regenerated_at',
    )
    search_fields = ('branch__name', 'branch__library__name')
    list_filter = ('is_enabled', 'require_geo_fence')
