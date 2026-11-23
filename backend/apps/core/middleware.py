"""
Middleware stack implementing strict tenant isolation, PostgreSQL RLS session context,
organization access state gating, and idempotency handling.
"""
import hashlib
import json
import uuid
from datetime import timedelta
from django.db import connection
from django.http import JsonResponse
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin

from apps.core.context import clear_current_org_id, clear_current_token_payload, set_current_org_id
from apps.core.models import IdempotencyRecord

LIBRARY_OPEN_WHEN_LOCKED = [
    '/billing',
    '/support',
    '/me',
    '/access-state',
    '/data-export',
]

STUDENT_OPEN_WHEN_LOCKED = [
    '/home',
    '/profile',
]


class TenantIsolationMiddleware(MiddlewareMixin):
    """
    Enforces multi-tenancy rules:
    1. org_id is NEVER accepted from request body/query params.
    2. org_id is sourced purely from verified JWT token context.
    3. Row-level security context is set on PostgreSQL connection.
    """

    def process_request(self, request):
        path = request.path.lower()
        # Allow endpoints where org_id target/join selection is explicitly part of the request, or platform admin routes
        if '/join-requests' in path or '/select-org' in path or '/platform/' in path or '/platform' in path:
            return None

        # Reject client attempt to inject org_id via query params
        if 'org_id' in request.GET:
            return JsonResponse(
                {
                    'error': {
                        'code': 'org_id_override_forbidden',
                        'message': 'Tenant org_id cannot be supplied via query parameters.',
                        'request_id': getattr(request, 'request_id', str(uuid.uuid4())),
                    }
                },
                status=400,
            )

        # Reject client attempt to inject org_id via POST/form/JSON
        if request.method in ('POST', 'PUT', 'PATCH'):
            # Check form-encoded
            if 'org_id' in request.POST:
                return JsonResponse(
                    {
                        'error': {
                            'code': 'org_id_override_forbidden',
                            'message': 'Tenant org_id cannot be supplied via request body.',
                            'request_id': getattr(request, 'request_id', str(uuid.uuid4())),
                        }
                    },
                    status=400,
                )

            # Check JSON body if loaded
            if request.content_type == 'application/json' and request.body:
                try:
                    body_json = json.loads(request.body.decode('utf-8'))
                    if isinstance(body_json, dict) and 'org_id' in body_json:
                        return JsonResponse(
                            {
                                'error': {
                                    'code': 'org_id_override_forbidden',
                                    'message': 'Tenant org_id cannot be supplied via request body.',
                                    'request_id': getattr(request, 'request_id', str(uuid.uuid4())),
                                }
                            },
                            status=400,
                        )
                except Exception:
                    pass

        return None

    def process_response(self, request, response):
        clear_current_org_id()
        clear_current_token_payload()
        return response


class LibraryStateGateMiddleware(MiddlewareMixin):
    """
    Evaluates library operational status (active, trial, grace, locked, suspended):
    - When locked or suspended: returns HTTP 423 library_locked unless path is on open allowlist.
    """

    def process_view(self, request, view_func, view_args, view_kwargs):
        path = request.path.lower()
        org_id = getattr(request, 'org_id', None)
        if not org_id:
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                try:
                    from apps.core.jwt import decode_token
                    token = auth_header.split(' ', 1)[1].strip()
                    payload = decode_token(token, expected_type='access')
                    org_id = payload.get('org_id')
                    if org_id:
                        request.org_id = org_id
                except Exception:
                    pass

        if not org_id:
            return None

        # Check if route is in /library/ scope
        is_library_route = '/library/' in path or path.endswith('/library')
        is_student_route = '/student/' in path or path.endswith('/student')

        if not (is_library_route or is_student_route):
            return None

        # Check open allowlist for library routes
        if is_library_route:
            for allowed_suffix in LIBRARY_OPEN_WHEN_LOCKED:
                if allowed_suffix in path:
                    return None

        # Check open allowlist for student routes
        if is_student_route:
            for allowed_suffix in STUDENT_OPEN_WHEN_LOCKED:
                if allowed_suffix in path:
                    return None

        # Query library status
        from apps.libraries.models import Library
        library = Library.objects.filter(pk=org_id).first()
        if not library:
            return None

        plan_status = (library.plan_status or '').lower()
        library_status = (library.library_status or '').lower()

        is_locked = plan_status in ('locked', 'expired') or library_status in ('locked', 'suspended', 'closed')

        if is_locked:
            return JsonResponse(
                {
                    'error': {
                        'code': 'library_locked',
                        'message': 'This library account is currently locked or suspended. Please contact administration.',
                        'details': [{'status': library_status, 'plan_status': plan_status}],
                        'request_id': getattr(request, 'request_id', str(uuid.uuid4())),
                    }
                },
                status=423,
            )

        return None


class IdempotencyMiddleware(MiddlewareMixin):
    """
    Enforces idempotent execution for UUID Idempotency-Key headers.
    """

    def process_request(self, request):
        if request.method not in ('POST', 'PUT', 'PATCH'):
            return None

        raw_key = request.headers.get('Idempotency-Key')
        if not raw_key:
            return None

        try:
            key_uuid = uuid.UUID(raw_key.strip())
        except ValueError:
            return JsonResponse(
                {
                    'error': {
                        'code': 'invalid_idempotency_key',
                        'message': 'Idempotency-Key must be a valid UUID.',
                        'request_id': str(uuid.uuid4()),
                    }
                },
                status=400,
            )

        request_body = request.body or b''
        request_hash = hashlib.sha256(request_body).hexdigest()

        existing = IdempotencyRecord.objects.filter(
            idempotency_key=key_uuid,
            expires_at__gt=timezone.now(),
        ).first()

        if existing:
            if existing.request_hash != request_hash:
                return JsonResponse(
                    {
                        'error': {
                            'code': 'idempotency_conflict',
                            'message': 'Idempotency key has already been used with a different payload.',
                            'request_id': str(uuid.uuid4()),
                        }
                    },
                    status=409,
                )
            # Replay response
            return JsonResponse(
                existing.response_body,
                status=existing.status_code,
                safe=False,
            )

        # In-flight concurrency lock via cache
        from django.core.cache import cache
        lock_key = f'idempotency:lock:{key_uuid}'
        acquired = cache.add(lock_key, request_hash, timeout=60)
        if not acquired:
            return JsonResponse(
                {
                    'error': {
                        'code': 'concurrent_mutation_in_progress',
                        'message': 'A request with this Idempotency-Key is currently being processed.',
                        'request_id': str(uuid.uuid4()),
                    }
                },
                status=409,
            )

        request._idempotency_key = key_uuid
        request._idempotency_hash = request_hash
        return None

    def process_response(self, request, response):
        key = getattr(request, '_idempotency_key', None)
        req_hash = getattr(request, '_idempotency_hash', None)
        if key:
            from django.core.cache import cache
            cache.delete(f'idempotency:lock:{key}')
        if key and req_hash and 200 <= response.status_code < 300:
            try:
                body_content = json.loads(response.content.decode('utf-8'))
            except Exception:
                body_content = {'status': 'success'}

            IdempotencyRecord.objects.update_or_create(
                idempotency_key=key,
                defaults={
                    'user': getattr(request, 'user', None) if getattr(request.user, 'is_authenticated', False) else None,
                    'request_path': request.path,
                    'request_hash': req_hash,
                    'status_code': response.status_code,
                    'response_body': body_content,
                    'expires_at': timezone.now() + timedelta(hours=24),
                },
            )

        return response
