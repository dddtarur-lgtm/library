"""
Multi-audience JWT Authentication class for Django REST Framework.
Validates audience boundary, token validity, and perm_ver staleness.
"""
import uuid
from typing import Optional, Tuple
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework import authentication, exceptions

from apps.core.context import (
    clear_current_org_id,
    clear_current_token_payload,
    set_current_org_id,
    set_current_token_payload,
)
from apps.core.jwt import (
    AUDIENCE_LIBRARY,
    AUDIENCE_PLATFORM,
    AUDIENCE_STUDENT,
    InvalidAudienceError,
    PermissionVersionStaleError,
    TokenExpiredError,
    TokenRevokedError,
    decode_token,
)

User = get_user_model()


def get_expected_audience_for_path(path: str) -> Optional[str]:
    """Map URL path prefix to expected JWT audience."""
    clean_path = path.lower()
    if '/student/' in clean_path or clean_path.endswith('/student'):
        return AUDIENCE_STUDENT
    if '/library/' in clean_path or clean_path.endswith('/library'):
        return AUDIENCE_LIBRARY
    if '/platform/' in clean_path or clean_path.endswith('/platform'):
        return AUDIENCE_PLATFORM
    return None


class MultiAudienceJWTAuthentication(authentication.BaseAuthentication):
    """
    DRF Authentication enforcing:
    1. Area-audience isolation (student != library != platform)
    2. Dynamic perm_ver validation against cache/DB
    3. Row-level tenant context injection
    """

    def authenticate(self, request) -> Optional[Tuple[User, dict]]:
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        raw_token = auth_header.split(' ', 1)[1].strip()
        expected_aud = get_expected_audience_for_path(request.path)

        try:
            payload = decode_token(raw_token, expected_audience=expected_aud)
        except TokenExpiredError as e:
            raise exceptions.AuthenticationFailed({'code': 'token_expired', 'message': str(e)})
        except InvalidAudienceError as e:
            raise exceptions.AuthenticationFailed({'code': 'invalid_audience', 'message': str(e)})
        except TokenRevokedError as e:
            raise exceptions.AuthenticationFailed({'code': 'token_revoked', 'message': str(e)})
        except Exception as e:
            raise exceptions.AuthenticationFailed({'code': 'unauthenticated', 'message': str(e)})

        user_id = payload.get('sub') or payload.get('user_id')
        user = None
        try:
            uuid.UUID(str(user_id))
            user = User.objects.filter(pk=user_id, is_active=True).first()
        except (ValueError, TypeError):
            user = User.objects.filter(email=user_id, is_active=True).first()
        if not user:
            raise exceptions.AuthenticationFailed({
                'code': 'unauthenticated',
                'message': 'User not found or inactive.',
            })

        # Library audience: perm_ver verification
        if payload.get('aud') == AUDIENCE_LIBRARY:
            member_id = payload.get('member_id')
            token_perm_ver = payload.get('perm_ver')
            if member_id and token_perm_ver is not None:
                cache_key = f'lib:member:{member_id}:perm_ver'
                current_perm_ver = cache.get(cache_key)
                
                if current_perm_ver is None:
                    current_perm_ver = getattr(user, 'perm_ver', 1)
                    cache.set(cache_key, current_perm_ver, timeout=3600)

                if int(token_perm_ver) < int(current_perm_ver):
                    raise exceptions.AuthenticationFailed({
                        'code': 'permission_version_stale',
                        'message': 'Permissions have been updated. Please refresh session.',
                    })

        # Inject context onto request
        org_id = payload.get('org_id')
        request.token_payload = payload
        request.org_id = org_id
        set_current_org_id(org_id)
        set_current_token_payload(payload)

        return (user, payload)

    def authenticate_header(self, request):
        return 'Bearer realm="api"'

