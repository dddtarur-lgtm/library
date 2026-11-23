"""Thread-local request context middleware for audit signal enrichment."""
import ipaddress
import threading

_audit_local = threading.local()


def _extract_client_ip(request):
    """Extract and validate client IP address from WSGI/ASGI request headers."""
    forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '')
    raw_ip = forwarded_for.split(',')[0].strip() if forwarded_for else request.META.get('REMOTE_ADDR', '')
    if not raw_ip:
        return None
    try:
        ipaddress.ip_address(raw_ip)
        return raw_ip
    except ValueError:
        return None


def _resolve_request_user(request):
    """Resolve authenticated user from Django request, DRF force_authenticate, or JWT."""
    if request is None:
        return None

    for attr in ('_force_auth_user', 'user'):
        candidate = getattr(request, attr, None)
        if candidate is not None and getattr(candidate, 'is_authenticated', False):
            return candidate

    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        try:
            from rest_framework_simplejwt.authentication import JWTAuthentication

            auth_result = JWTAuthentication().authenticate(request)
            if auth_result is not None:
                user, _ = auth_result
                if getattr(user, 'is_authenticated', False):
                    return user
        except Exception:
            return None

    return None


def set_current_request_context(user=None, ip_address=None, device='', request=None):
    """Set thread-local audit context for the current execution thread."""
    _audit_local.request = request
    _audit_local.user = user
    _audit_local.ip_address = ip_address
    _audit_local.device = (device or '')[:255]


def clear_current_request_context():
    """Clear thread-local audit context after request completion."""
    for attr in ('request', 'user', 'ip_address', 'device'):
        if hasattr(_audit_local, attr):
            delattr(_audit_local, attr)


def get_current_request_context():
    """Return current thread-local audit context (safe when called outside requests)."""
    request = getattr(_audit_local, 'request', None)
    user = getattr(_audit_local, 'user', None)
    if user is None and request is not None:
        user = _resolve_request_user(request)

    return {
        'user': user,
        'ip_address': getattr(_audit_local, 'ip_address', None),
        'device': getattr(_audit_local, 'device', ''),
    }


class AuditRequestMiddleware:
    """Capture current request user, IP address, and User-Agent into thread-local storage."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        ip_address = _extract_client_ip(request)
        device = (request.META.get('HTTP_USER_AGENT') or '')[:255]
        set_current_request_context(
            user=None,
            ip_address=ip_address,
            device=device,
            request=request,
        )
        try:
            return self.get_response(request)
        finally:
            clear_current_request_context()
