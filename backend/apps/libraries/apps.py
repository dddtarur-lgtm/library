"""App configuration for libraries."""
from django.apps import AppConfig


class LibrariesConfig(AppConfig):
    """Libraries app config."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.libraries'
    verbose_name = 'Libraries'

