"""
JWT Engine conforming to API Design Document Section 4.
Manages Student, Library, and Platform tokens with audience isolation,
rotation tracking, and permission versioning.
"""
import hashlib
import time
import uuid
from datetime import datetime, timedelta, timezone as dt_timezone
from typing import Any, Dict, Optional, Tuple

import jwt
from django.conf import settings
from django.core.cache import cache

from apps.core.models import AuthTokenRevocation


AUDIENCE_STUDENT = 'student'
AUDIENCE_LIBRARY = 'library'
AUDIENCE_PLATFORM = 'platform'
VALID_AUDIENCES = {AUDIENCE_STUDENT, AUDIENCE_LIBRARY, AUDIENCE_PLATFORM}

ACCESS_TOKEN_LIFETIME = timedelta(minutes=15)
REFRESH_TOKEN_LIFETIME = timedelta(days=30)
SIGNUP_TOKEN_LIFETIME = timedelta(minutes=15)
TWO_STEP_TOKEN_LIFETIME = timedelta(minutes=10)
SELECT_ORG_TOKEN_LIFETIME = timedelta(minutes=15)


class JWTError(Exception):
    """Base exception for JWT processing errors."""
    code = 'unauthenticated'
    message = 'Authentication token is invalid or expired.'


class TokenExpiredError(JWTError):
    code = 'token_expired'
    message = 'Authentication token has expired.'


class InvalidAudienceError(JWTError):
    code = 'invalid_audience'
    message = 'Token audience does not match the target area.'


class TokenRevokedError(JWTError):
    code = 'token_revoked'
    message = 'Authentication token has been revoked.'


class PermissionVersionStaleError(JWTError):
    code = 'permission_version_stale'
    message = 'User permissions have changed. Please refresh your session.'


def _get_signing_key() -> str:
    return getattr(settings, 'SECRET_KEY', 'default-secret-key-change-in-prod')


def generate_access_token(
    user_id: Any,
    audience: str,
    extra_claims: Optional[Dict[str, Any]] = None,
    lifetime: timedelta = ACCESS_TOKEN_LIFETIME,
) -> str:
    """Generate a short-lived access token with audience claims."""
    if audience not in VALID_AUDIENCES:
        raise ValueError(f'Invalid token audience: {audience}')

    actual_user_id = getattr(user_id, 'id', user_id)
    now = datetime.now(dt_timezone.utc)
    jti = str(uuid.uuid4())
    payload = {
        'sub': str(actual_user_id),
        'user_id': str(actual_user_id),
        'aud': audience,
        'jti': jti,
        'iat': int(now.timestamp()),
        'exp': int((now + lifetime).timestamp()),
        'type': 'access',
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, _get_signing_key(), algorithm='HS256')


def generate_refresh_token(
    user_id: Any,
    audience: str,
    family_id: Optional[str] = None,
    device_id: Optional[str] = None,
    lifetime: timedelta = REFRESH_TOKEN_LIFETIME,
) -> Tuple[str, str]:
    """
    Generate a rotating refresh token.
    Returns (token_string, family_id).
    """
    if audience not in VALID_AUDIENCES:
        raise ValueError(f'Invalid token audience: {audience}')

    actual_user_id = getattr(user_id, 'id', user_id)
    now = datetime.now(dt_timezone.utc)
    jti = str(uuid.uuid4())
    resolved_family = family_id or str(uuid.uuid4())
    payload = {
        'sub': str(actual_user_id),
        'user_id': str(actual_user_id),
        'aud': audience,
        'jti': jti,
        'family_id': resolved_family,
        'device_id': device_id or '',
        'iat': int(now.timestamp()),
        'exp': int((now + lifetime).timestamp()),
        'type': 'refresh',
    }

    token = jwt.encode(payload, _get_signing_key(), algorithm='HS256')
    return token, resolved_family


def generate_intermediate_token(
    payload_data: Dict[str, Any],
    token_type: str,
    lifetime: timedelta,
) -> str:
    """Generate ephemeral tokens (signup_token, two_step_token, select_token)."""
    now = datetime.now(dt_timezone.utc)
    payload = {
        **payload_data,
        'type': token_type,
        'iat': int(now.timestamp()),
        'exp': int((now + lifetime).timestamp()),
    }
    return jwt.encode(payload, _get_signing_key(), algorithm='HS256')


def decode_token(
    token: str,
    expected_audience: Optional[str] = None,
    expected_type: str = 'access',
) -> Dict[str, Any]:
    """
    Validate signature, expiration, audience, revocation, and token type.
    """
    try:
        payload = jwt.decode(
            token,
            _get_signing_key(),
            algorithms=['HS256'],
            options={'verify_aud': False},
        )
    except jwt.ExpiredSignatureError:
        raise TokenExpiredError('Token has expired.')
    except jwt.PyJWTError as e:
        raise JWTError(f'Invalid token: {str(e)}')

    # Validate token type (support both standard 'type' and simplejwt 'token_type')
    token_type = payload.get('type') or payload.get('token_type')
    if token_type and token_type != expected_type:
        raise JWTError(f"Expected token type '{expected_type}', got '{token_type}'")

    # Validate audience
    if expected_audience:
        token_aud = payload.get('aud')
        if token_aud != expected_audience:
            # Super Admin bypass: superadmin tokens are always authorized for platform endpoints
            is_superadmin = payload.get('role') == 'SUPER_ADMIN'
            if expected_audience == 'platform' and (is_superadmin or not token_aud):
                pass
            else:
                raise InvalidAudienceError(
                    f"Area '{expected_audience}' does not accept '{token_aud}' token."
                )

    # Check revocation table
    jti = payload.get('jti')
    if jti:
        if AuthTokenRevocation.objects.filter(jti=jti).exists():
            # If a refresh token replay occurs, revoke entire family
            family_id = payload.get('family_id')
            if family_id and expected_type == 'refresh':
                AuthTokenRevocation.objects.filter(family_id=family_id).update(
                    reason='family_compromise_revoked'
                )
            raise TokenRevokedError('Token has been revoked.')

    return payload


def rotate_refresh_token(
    raw_refresh_token: str,
    expected_audience: Optional[str] = None,
    device_id: Optional[str] = None,
) -> Tuple[str, str, Dict[str, Any]]:
    """
    Rotate refresh token:
    1. Validates existing refresh token.
    2. Revokes existing refresh token (records JTI in AuthTokenRevocation).
    3. Issues new access token and new refresh token within the same family_id.
    """
    payload = decode_token(
        raw_refresh_token,
        expected_audience=expected_audience,
        expected_type='refresh',
    )
    user_id = payload['sub']
    audience = payload['aud']
    family_id = payload.get('family_id') or str(uuid.uuid4())
    jti = payload['jti']
    exp = payload.get('exp')

    # Hash the token string
    token_hash = hashlib.sha256(raw_refresh_token.encode('utf-8')).hexdigest()
    expires_at = datetime.fromtimestamp(exp, dt_timezone.utc) if exp else None

    # Resolve user and context claims
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.filter(pk=user_id, is_active=True).first()
    if not user:
        raise TokenRevokedError('User not found or inactive.')

    user_uuid = None
    try:
        user_uuid = uuid.UUID(str(user_id))
    except (ValueError, TypeError):
        pass

    # Revoke old refresh token
    AuthTokenRevocation.objects.create(
        user=user,
        jti=jti,
        token_hash=token_hash,
        family_id=family_id,
        expires_at=expires_at,
        reason='rotated',
    )

    extra_claims = {}
    if audience == AUDIENCE_LIBRARY:
        library = getattr(user, 'owned_library', None) or user.library
        role = 'owner' if user.role == 'LIBRARY_OWNER' else 'staff'
        branch_ids = 'all' if role == 'owner' else list(user.assigned_branches.values_list('id', flat=True))
        extra_claims = {
            'org_id': str(library.id) if library else None,
            'member_id': str(user.id),
            'role': role,
            'branch_ids': branch_ids,
            'perm_ver': getattr(user, 'perm_ver', 1),
        }
    elif audience == AUDIENCE_STUDENT:
        from apps.students.models import Student
        student = Student.objects.filter(user=user, status__iexact='Live').first() or Student.objects.filter(user=user).first()
        extra_claims = {
            'org_id': str(student.library_id) if student else None,
            'enrollment_id': str(student.id) if student else None,
            'lang': getattr(user, 'preferred_language', 'en'),
        }
    elif audience == AUDIENCE_PLATFORM:
        extra_claims = {
            'staff_role': user.role,
        }

    # Issue new pair
    new_access = generate_access_token(user_id=user_id, audience=audience, extra_claims=extra_claims)
    new_refresh, _ = generate_refresh_token(
        user_id=user_id,
        audience=audience,
        family_id=family_id,
        device_id=device_id or payload.get('device_id'),
    )
    return new_access, new_refresh, payload


def revoke_token(token: str, reason: str = 'logout') -> None:
    """Revoke a single token by its JTI."""
    try:
        payload = jwt.decode(
            token,
            _get_signing_key(),
            algorithms=['HS256'],
            options={'verify_exp': False, 'verify_aud': False},
        )
        jti = payload.get('jti')
        user_id = payload.get('sub')
        exp = payload.get('exp')
        if jti:
            token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
            expires_at = datetime.fromtimestamp(exp, dt_timezone.utc) if exp else None
            AuthTokenRevocation.objects.get_or_create(
                jti=jti,
                defaults={
                    'user_id': user_id if str(user_id).isdigit() else None,
                    'token_hash': token_hash,
                    'family_id': payload.get('family_id', ''),
                    'expires_at': expires_at,
                    'reason': reason,
                },
            )
    except Exception:
        pass

