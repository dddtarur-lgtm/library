"""App configuration for notifications."""
from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    """Django AppConfig for the notifications module."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notifications'
