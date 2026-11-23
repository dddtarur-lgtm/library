"""App configuration for billing."""
from django.apps import AppConfig


class BillingConfig(AppConfig):
    """Django AppConfig for the billing module."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.billing'
