"""AuditLog model for recording system-wide and tenant-scoped write events."""
import uuid
from django.db import models


class AuditLog(models.Model):
    """Immutable audit trail entry for model creates, updates, and deletes."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(
        'libraries.Library',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='audit_logs',
    )
    actor = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='audit_logs',
    )
    module = models.CharField(max_length=50)
    action = models.CharField(max_length=255)
    target_entity = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device = models.CharField(max_length=255, blank=True)
    is_risky = models.BooleanField(default=False)
    diff = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['library', '-created_at']),
            models.Index(fields=['module', '-created_at']),
            models.Index(fields=['is_risky', '-created_at']),
        ]

    def __str__(self):
        return f'[{self.module}] {self.action} ({self.target_entity}:{self.entity_id})'
