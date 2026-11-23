"""Serializers for NotificationBroadcast."""
from rest_framework import serializers

from .models import NotificationBroadcast

ALLOWED_CHANNELS = {'Push', 'In-App', 'Email', 'SMS'}


class NotificationBroadcastSerializer(serializers.ModelSerializer):
    """Serializer for library notification broadcasts."""

    library_name = serializers.CharField(source='library.name', read_only=True)
    library_code = serializers.CharField(source='library.code', read_only=True)
    created_by_email = serializers.EmailField(
        source='created_by.email', read_only=True, default=None
    )

    class Meta:
        model = NotificationBroadcast
        fields = [
            'id',
            'library',
            'library_name',
            'library_code',
            'created_by',
            'created_by_email',
            'title',
            'subtitle',
            'body',
            'audience',
            'channels',
            'display_mode',
            'dialog_type',
            'image_banner',
            'cta_text',
            'cta_link',
            'priority',
            'status',
            'sent_at',
            'recipients_count',
            'delivered_count',
            'seen_count',
            'click_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'library',
            'created_by',
            'status',
            'sent_at',
            'recipients_count',
            'delivered_count',
            'seen_count',
            'click_count',
            'created_at',
            'updated_at',
        ]

    def validate_channels(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('Channels must be a list.')
        invalid = [ch for ch in value if ch not in ALLOWED_CHANNELS]
        if invalid:
            raise serializers.ValidationError(
                f'Unsupported channels: {", ".join(invalid)}.'
            )
        return value


class SendNotificationSerializer(serializers.Serializer):
    """Optional schedule payload for sending or scheduling a broadcast."""

    scheduled_at = serializers.DateTimeField(required=False, allow_null=True)
