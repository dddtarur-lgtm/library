"""Serializers for support tickets, CMS, feature flags, public pages, and email management."""
from rest_framework import serializers

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


class SupportMessageSerializer(serializers.ModelSerializer):
    """Serializer for individual messages within a support ticket thread."""

    sender_name = serializers.CharField(source='sender.name', read_only=True, default=None)
    sender_email = serializers.EmailField(source='sender.email', read_only=True, default=None)
    sender_role = serializers.CharField(source='sender.role', read_only=True, default=None)

    class Meta:
        model = SupportMessage
        fields = [
            'id',
            'ticket',
            'sender',
            'sender_name',
            'sender_email',
            'sender_role',
            'message',
            'is_staff_reply',
            'attachment',
            'created_at',
        ]
        read_only_fields = ['id', 'ticket', 'sender', 'is_staff_reply', 'created_at']


class SupportReplySerializer(serializers.Serializer):
    """Payload for posting a reply to a support ticket."""

    message = serializers.CharField()
    attachment = serializers.FileField(required=False, allow_null=True)


class SupportTicketSerializer(serializers.ModelSerializer):
    """Serializer for listing, creating, and updating support tickets."""

    library_name = serializers.CharField(source='library.name', read_only=True)
    library_code = serializers.CharField(source='library.code', read_only=True)
    created_by_name = serializers.CharField(
        source='created_by.name', read_only=True, default=None
    )
    assigned_to_name = serializers.CharField(
        source='assigned_to.name', read_only=True, default=None
    )
    messages_count = serializers.IntegerField(source='messages.count', read_only=True)

    class Meta:
        model = SupportTicket
        fields = [
            'id',
            'ticket_number',
            'library',
            'library_name',
            'library_code',
            'created_by',
            'created_by_name',
            'assigned_to',
            'assigned_to_name',
            'subject',
            'description',
            'category',
            'priority',
            'status',
            'messages_count',
            'resolved_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'ticket_number',
            'library',
            'created_by',
            'resolved_at',
            'created_at',
            'updated_at',
        ]


class SupportTicketDetailSerializer(SupportTicketSerializer):
    """Detailed support ticket serializer including full message thread."""

    messages = SupportMessageSerializer(many=True, read_only=True)

    class Meta(SupportTicketSerializer.Meta):
        fields = SupportTicketSerializer.Meta.fields + ['messages']


class WebsiteContentBlockSerializer(serializers.ModelSerializer):
    """Serializer for CMS content sections."""

    updated_by_name = serializers.CharField(
        source='updated_by.name', read_only=True, default=None
    )

    class Meta:
        model = WebsiteContentBlock
        fields = [
            'id',
            'section',
            'title',
            'subtitle',
            'content',
            'is_published',
            'updated_by',
            'updated_by_name',
            'updated_at',
        ]
        read_only_fields = ['id', 'section', 'updated_by', 'updated_at']


class WebsiteMediaSerializer(serializers.ModelSerializer):
    """Serializer for uploaded CMS media assets."""

    uploaded_by_name = serializers.CharField(
        source='uploaded_by.name', read_only=True, default=None
    )

    class Meta:
        model = WebsiteMedia
        fields = [
            'id',
            'title',
            'file',
            'media_type',
            'alt_text',
            'file_size',
            'uploaded_by',
            'uploaded_by_name',
            'created_at',
        ]
        read_only_fields = ['id', 'file_size', 'uploaded_by', 'created_at']


class AppFeatureFlagSerializer(serializers.ModelSerializer):
    """Serializer for platform feature flags."""

    updated_by_name = serializers.CharField(
        source='updated_by.name', read_only=True, default=None
    )

    class Meta:
        model = AppFeatureFlag
        fields = [
            'id',
            'feature',
            'name',
            'description',
            'is_enabled',
            'rollout_percentage',
            'config',
            'updated_by',
            'updated_by_name',
            'updated_at',
        ]
        read_only_fields = ['id', 'feature', 'updated_by', 'updated_at']


class LibraryPublicPageSerializer(serializers.ModelSerializer):
    """Serializer for library public page moderation queue."""

    library_name = serializers.CharField(source='library.name', read_only=True)
    library_code = serializers.CharField(source='library.code', read_only=True)
    reviewed_by_name = serializers.CharField(
        source='reviewed_by.name', read_only=True, default=None
    )

    class Meta:
        model = LibraryPublicPage
        fields = [
            'id',
            'library',
            'library_name',
            'library_code',
            'slug',
            'headline',
            'description',
            'status',
            'rejection_reason',
            'reviewed_by',
            'reviewed_by_name',
            'reviewed_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class LibraryPublicPageRejectSerializer(serializers.Serializer):
    """Reason payload when rejecting a library's public page."""

    reason = serializers.CharField(required=False, allow_blank=True, default='')
    rejection_reason = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        r = attrs.get('reason') or attrs.get('rejection_reason')
        if not r:
            raise serializers.ValidationError({'reason': 'A rejection reason is required.'})
        attrs['reason'] = r
        return attrs


class EmailConnectionHealthSerializer(serializers.ModelSerializer):
    """Serializer for per-library email connection health."""

    library_name = serializers.CharField(source='library.name', read_only=True)
    library_code = serializers.CharField(source='library.code', read_only=True)

    class Meta:
        model = EmailConnectionHealth
        fields = [
            'id',
            'library',
            'library_name',
            'library_code',
            'status',
            'last_checked_at',
            'last_success_at',
            'last_error',
            'bounce_rate',
            'updated_at',
        ]
        read_only_fields = fields


class SmtpConfigSerializer(serializers.ModelSerializer):
    """Serializer for library SMTP configuration (masks password on read)."""

    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    has_password = serializers.SerializerMethodField()

    class Meta:
        model = SmtpConfig
        fields = [
            'id',
            'library',
            'host',
            'port',
            'username',
            'password',
            'has_password',
            'from_email',
            'from_name',
            'use_tls',
            'use_ssl',
            'is_verified',
            'last_tested_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'library', 'is_verified', 'last_tested_at', 'updated_at']

    def get_has_password(self, obj):
        return bool(obj.password)


class SmtpTestSerializer(serializers.Serializer):
    """Payload for triggering a test SMTP email."""

    recipient_email = serializers.EmailField(required=False)


class TransactionalEmailLogSerializer(serializers.ModelSerializer):
    """Serializer for library transactional email logs."""

    class Meta:
        model = TransactionalEmailLog
        fields = [
            'id',
            'library',
            'recipient',
            'subject',
            'template_name',
            'status',
            'provider_message_id',
            'error_message',
            'sent_at',
        ]
        read_only_fields = fields
