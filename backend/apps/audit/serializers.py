"""Serializers for AuditLog entries."""
from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """Read-only serializer for platform audit logs and library activity logs."""

    library_name = serializers.CharField(source='library.name', read_only=True, default=None)
    library_code = serializers.CharField(source='library.code', read_only=True, default=None)
    actor_name = serializers.CharField(source='actor.name', read_only=True, default=None)
    actor_email = serializers.EmailField(source='actor.email', read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'library',
            'library_name',
            'library_code',
            'actor',
            'actor_name',
            'actor_email',
            'module',
            'action',
            'target_entity',
            'entity_id',
            'ip_address',
            'device',
            'is_risky',
            'diff',
            'created_at',
        ]
        read_only_fields = fields
