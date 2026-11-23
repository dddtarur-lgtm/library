"""Standardized JSON response helpers matching the API contract."""
from rest_framework.response import Response


def success(data=None, message=None, status=200):
    """Return a standardized success response."""
    payload = {
        'success': True,
        'message': message,
        'data': data,
    }
    return Response(payload, status=status)


def error(message, errors=None, status=400):
    """Return a standardized error response."""
    payload = {
        'success': False,
        'message': message,
        'errors': errors,
    }
    return Response(payload, status=status)

