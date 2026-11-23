"""Custom DRF exception handler for consistent 4xx responses on Django/DB errors."""
from django.core.exceptions import ObjectDoesNotExist
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """
    Delegate to DRF's default handler first so all standard DRF exceptions
    preserve their exact payload/status; convert unhandled Django ValidationError,
    IntegrityError, and ObjectDoesNotExist into clean 400/404 JSON responses.
    """
    response = exception_handler(exc, context)
    if response is not None:
        return response

    if isinstance(exc, DjangoValidationError):
        messages = exc.messages if hasattr(exc, 'messages') else [str(exc)]
        return Response(
            {
                'detail': messages[0] if len(messages) == 1 else messages,
                'message': '; '.join(messages),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if isinstance(exc, IntegrityError):
        return Response(
            {
                'detail': 'A record with these details already exists or violates a data constraint.',
                'message': 'Database integrity error.',
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if isinstance(exc, ObjectDoesNotExist):
        return Response(
            {
                'detail': 'Requested resource was not found.',
                'message': 'Not found.',
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    return None
