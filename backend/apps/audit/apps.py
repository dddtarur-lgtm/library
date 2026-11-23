"""App configuration for audit logging."""
from django.apps import AppConfig


class AuditConfig(AppConfig):
    """Register audit signals when the app is ready."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.audit'

    def ready(self):
        from . import signals  # noqa: F401
