"""
Custom DRF exception handler generating standard specification error envelopes:
{
  "error": {
    "code": "...",
    "message": "...",
    "details": [...],
    "request_id": "req_..."
  }
}
"""
import uuid
from django.core.exceptions import ObjectDoesNotExist, ValidationError as DjangoValidationError
from django.db import IntegrityError
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler


class PlatformAPIException(exceptions.APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = 'bad_request'
    default_detail = 'An error occurred.'

    def __init__(self, detail=None, code=None, status_code=None, details=None):
        if status_code:
            self.status_code = status_code
        if code:
            self.default_code = code
        self.details = details or []
        super().__init__(detail=detail or self.default_detail, code=code or self.default_code)


class PlanRequiredException(PlatformAPIException):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_code = 'plan_required'
    default_detail = 'An active subscription plan is required for this action.'


class PermissionDeniedException(PlatformAPIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = 'permission_denied'
    default_detail = 'You do not have permission to perform this action.'


class BranchScopeDeniedException(PlatformAPIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = 'branch_scope_denied'
    default_detail = 'You do not have access to this branch.'


class LibraryLockedException(PlatformAPIException):
    status_code = status.HTTP_423_LOCKED
    default_code = 'library_locked'
    default_detail = 'The library account is currently locked or suspended.'


class ConflictException(PlatformAPIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = 'conflict'
    default_detail = 'Resource state conflict.'


def custom_standard_exception_handler(exc, context):
    """Formats all standard and custom exceptions into the design document error envelope."""
    request = context.get('request') if context else None
    request_id = getattr(request, 'request_id', f'req_{uuid.uuid4().hex[:8]}') if request else f'req_{uuid.uuid4().hex[:8]}'

    # Django Model/Database level conversions
    if isinstance(exc, DjangoValidationError):
        messages = exc.messages if hasattr(exc, 'messages') else [str(exc)]
        return Response(
            {
                'error': {
                    'code': 'validation_error',
                    'message': '; '.join(messages),
                    'details': [{'field': 'non_field_errors', 'issue': m} for m in messages],
                    'request_id': request_id,
                }
            },
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    if isinstance(exc, IntegrityError):
        err_msg = str(exc)
        code = 'conflict'
        status_code = status.HTTP_409_CONFLICT
        if 'one_live_library' in err_msg or 'unique' in err_msg.lower():
            code = 'student_already_live_elsewhere'
        return Response(
            {
                'error': {
                    'code': code,
                    'message': 'Database integrity constraint violated.',
                    'details': [{'issue': err_msg}],
                    'request_id': request_id,
                }
            },
            status=status_code,
        )

    if isinstance(exc, ObjectDoesNotExist):
        return Response(
            {
                'error': {
                    'code': 'not_found',
                    'message': 'Requested resource was not found.',
                    'details': [],
                    'request_id': request_id,
                }
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    # Let DRF handle standard exceptions
    response = exception_handler(exc, context)
    if response is not None:
        data = response.data
        error_code = 'bad_request'
        error_message = 'Request failed.'
        details = []

        if isinstance(data, dict):
            # Custom dict raised by authentication
            if 'code' in data and 'message' in data:
                error_code = data.get('code')
                error_message = data.get('message')
            elif 'detail' in data:
                detail_val = data['detail']
                if hasattr(detail_val, 'code'):
                    error_code = detail_val.code
                error_message = str(detail_val)
                details = [{'issue': error_message}]
            else:
                error_code = 'validation_error'
                error_message = 'Validation failed.'
                for field, issues in data.items():
                    if isinstance(issues, list):
                        for issue in issues:
                            issue_code = getattr(issue, 'code', 'invalid')
                            details.append({'field': field, 'issue': str(issue), 'code': issue_code})
                    else:
                        details.append({'field': field, 'issue': str(issues)})
        elif isinstance(data, list):
            error_code = 'validation_error'
            error_message = 'Validation failed.'
            details = [{'issue': str(item)} for item in data]

        # Map HTTP status codes to standard error codes if still default
        if response.status_code == 401 and error_code in ('bad_request', 'invalid'):
            error_code = 'unauthenticated'
        elif response.status_code == 403 and error_code in ('bad_request', 'invalid'):
            error_code = 'permission_denied'
        elif response.status_code == 404 and error_code in ('bad_request', 'invalid'):
            error_code = 'not_found'
        elif response.status_code == 422:
            error_code = 'validation_error'
        elif response.status_code == 423:
            error_code = 'library_locked'
        elif response.status_code == 429:
            error_code = 'rate_limit_exceeded'

        envelope = {
            'error': {
                'code': error_code,
                'message': error_message,
                'details': details,
                'request_id': request_id,
            }
        }
        return Response(envelope, status=response.status_code)

    return None

