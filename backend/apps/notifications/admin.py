"""Django Admin registrations for notification broadcasts."""
from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from .models import NotificationBroadcast


@admin.register(NotificationBroadcast)
class NotificationBroadcastAdmin(ModelAdmin):
    list_display = (
        'title',
        'library',
        'audience',
        'priority',
        'status',
        'recipients_count',
        'delivered_count',
        'sent_at',
        'created_at',
    )
    list_filter = ('status', 'priority', 'audience', 'display_mode')
    search_fields = ('title', 'subtitle', 'body', 'library__name')
