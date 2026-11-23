"""App configuration for students."""
from django.apps import AppConfig


class StudentsConfig(AppConfig):
    """Students app config."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.students'
    verbose_name = 'Students & Memberships'
