"""Shared pagination classes for DRF views."""
from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """Default pagination: 20 items per page, configurable up to 100 via ?page_size=."""

    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

