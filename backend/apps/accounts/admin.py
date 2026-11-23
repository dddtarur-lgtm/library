"""Django admin configuration for accounts app."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from .models import DeletionRequest, StaffPermission, User


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    """Admin configuration for email-based User model."""

    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm

    list_display = ('email', 'first_name', 'last_name', 'role', 'library', 'email_verified', 'is_active')
    list_filter = ('role', 'email_verified', 'is_active', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name', 'username')
    ordering = ('-created_at',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (
            'Personal Info',
            {'fields': ('first_name', 'last_name', 'username', 'phone', 'avatar', 'status')},
        ),
        (
            'Role & Tenant',
            {'fields': ('role', 'library', 'assigned_branches')},
        ),
        (
            'Verification & Security',
            {'fields': ('email_verified', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')},
        ),
        ('Important Dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at', 'last_login')

    add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
            },
        ),
    )


@admin.register(StaffPermission)
class StaffPermissionAdmin(ModelAdmin):
    """Admin configuration for StaffPermission."""

    list_display = (
        'staff',
        'students',
        'fees_plans',
        'seats',
        'attendance',
        'books',
        'can_view_revenue',
    )
    search_fields = ('staff__email', 'staff__first_name', 'staff__last_name')


@admin.register(DeletionRequest)
class DeletionRequestAdmin(ModelAdmin):
    """Admin configuration for DeletionRequest."""

    list_display = ('target_type', 'requested_by', 'library', 'student', 'status', 'created_at')
    list_filter = ('target_type', 'status')
    search_fields = ('requested_by__email', 'library__name', 'reason')

