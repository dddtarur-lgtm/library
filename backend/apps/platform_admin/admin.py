"""Django admin registrations for platform_admin models."""
from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from .models import (
    AppFeatureFlag,
    EmailConnectionHealth,
    LibraryPublicPage,
    SmtpConfig,
    SupportMessage,
    SupportTicket,
    TransactionalEmailLog,
    WebsiteContentBlock,
    WebsiteMedia,
)


@admin.register(SupportTicket)
class SupportTicketAdmin(ModelAdmin):
    list_display = ('ticket_number', 'subject', 'library', 'category', 'priority', 'status', 'created_at')
    list_filter = ('status', 'priority', 'category')
    search_fields = ('ticket_number', 'subject', 'library__name')


@admin.register(SupportMessage)
class SupportMessageAdmin(ModelAdmin):
    list_display = ('ticket', 'sender', 'is_staff_reply', 'created_at')
    list_filter = ('is_staff_reply',)


@admin.register(WebsiteContentBlock)
class WebsiteContentBlockAdmin(ModelAdmin):
    list_display = ('section', 'title', 'is_published', 'updated_at')
    list_filter = ('is_published',)


@admin.register(WebsiteMedia)
class WebsiteMediaAdmin(ModelAdmin):
    list_display = ('title', 'media_type', 'file_size', 'created_at')
    list_filter = ('media_type',)


@admin.register(AppFeatureFlag)
class AppFeatureFlagAdmin(ModelAdmin):
    list_display = ('feature', 'name', 'is_enabled', 'rollout_percentage', 'updated_at')
    list_filter = ('is_enabled',)


@admin.register(LibraryPublicPage)
class LibraryPublicPageAdmin(ModelAdmin):
    list_display = ('library', 'slug', 'status', 'reviewed_at', 'updated_at')
    list_filter = ('status',)


@admin.register(EmailConnectionHealth)
class EmailConnectionHealthAdmin(ModelAdmin):
    list_display = ('library', 'status', 'bounce_rate', 'last_checked_at')
    list_filter = ('status',)


@admin.register(SmtpConfig)
class SmtpConfigAdmin(ModelAdmin):
    list_display = ('library', 'host', 'port', 'from_email', 'is_verified', 'last_tested_at')
    list_filter = ('is_verified', 'use_tls')


@admin.register(TransactionalEmailLog)
class TransactionalEmailLogAdmin(ModelAdmin):
    list_display = ('recipient', 'subject', 'library', 'status', 'sent_at')
    list_filter = ('status',)
    search_fields = ('recipient', 'subject', 'library__name')
