"""Django admin registration for AuditLog."""
from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(ModelAdmin):
    """Read-only admin view for AuditLog entries."""

    list_display = (
        'created_at',
        'module',
        'action',
        'target_entity',
        'entity_id',
        'actor',
        'library',
        'is_risky',
    )
    list_filter = ('module', 'is_risky', 'target_entity')
    search_fields = ('action', 'target_entity', 'entity_id', 'actor__email', 'library__name')
    readonly_fields = (
        'id',
        'library',
        'actor',
        'module',
        'action',
        'target_entity',
        'entity_id',
        'ip_address',
        'device',
        'is_risky',
        'diff',
        'created_at',
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
