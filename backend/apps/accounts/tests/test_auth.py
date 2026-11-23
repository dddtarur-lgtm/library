"""Automated tests for all 12 authentication endpoints."""
from datetime import timedelta
import pytest
from django.core import mail
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.accounts.tokens import set_email_otp, set_password_reset_token


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def verified_user(db):
    return User.objects.create_user(
        email='owner@example.com',
        password='StrongPass123',
        first_name='Alice',
        last_name='Owner',
        username='aliceowner',
        role='LIBRARY_OWNER',
        email_verified=True,
    )


@pytest.mark.django_db
def test_sign_in_success(api_client, verified_user):
    res = api_client.post(
        '/api/v1/auth/sign-in/',
        {'email': 'owner@example.com', 'password': 'StrongPass123'},
        format='json',
    )
    assert res.status_code == 200
    assert res.data['id'] == str(verified_user.id)
    assert res.data['name'] == 'Alice Owner'
    assert res.data['email'] == 'owner@example.com'
    assert res.data['role'] == 'LIBRARY_OWNER'
    assert res.data['status'] == 'ONLINE'
    assert 'access' in res.data
    assert 'refresh' in res.data


@pytest.mark.django_db
def test_sign_in_wrong_password(api_client, verified_user):
    res = api_client.post(
        '/api/v1/auth/sign-in/',
        {'email': 'owner@example.com', 'password': 'WrongPass123'},
        format='json',
    )
    assert res.status_code == 401


@pytest.mark.django_db
def test_sign_in_unverified_email(api_client):
    User.objects.create_user(
        email='unverified@example.com',
        password='StrongPass123',
        first_name='Bob',
        last_name='Unverified',
        email_verified=False,
    )
    res = api_client.post(
        '/api/v1/auth/sign-in/',
        {'email': 'unverified@example.com', 'password': 'StrongPass123'},
        format='json',
    )
    assert res.status_code == 403


@pytest.mark.django_db
def test_register_creates_user(api_client):
    res = api_client.post(
        '/api/v1/auth/register/',
        {
            'firstName': 'Jane',
            'lastName': 'Doe',
            'username': 'janedoe',
            'email': 'jane@example.com',
            'password': 'StrongPass123',
        },
        format='json',
    )
    assert res.status_code == 201
    user = User.objects.get(email='jane@example.com')
    assert user.role == 'LIBRARY_OWNER'
    assert user.email_verified is False
    assert user.email_otp is not None
    assert len(mail.outbox) == 1


@pytest.mark.django_db
def test_register_duplicate_email(api_client, verified_user):
    res = api_client.post(
        '/api/v1/auth/register/',
        {
            'firstName': 'Dup',
            'lastName': 'User',
            'username': 'dupuser',
            'email': verified_user.email,
            'password': 'StrongPass123',
        },
        format='json',
    )
    assert res.status_code == 400


@pytest.mark.django_db
def test_forgot_password_sends_otp(api_client, verified_user):
    res = api_client.post(
        '/api/v1/auth/forgot-password/',
        {'email': verified_user.email},
        format='json',
    )
    assert res.status_code == 200
    verified_user.refresh_from_db()
    assert verified_user.password_reset_token is not None
    assert len(mail.outbox) == 1


@pytest.mark.django_db
def test_otp_verify_success(api_client):
    user = User.objects.create_user(
        email='verify@example.com',
        password='StrongPass123',
        first_name='Ver',
        last_name='Ify',
        email_verified=False,
    )
    otp = set_email_otp(user)
    res = api_client.post(
        '/api/v1/auth/verify-email/',
        {'email': user.email, 'otp': otp},
        format='json',
    )
    assert res.status_code == 200
    assert res.data['verified'] is True
    user.refresh_from_db()
    assert user.email_verified is True
    assert user.email_otp is None


@pytest.mark.django_db
def test_otp_expired(api_client):
    user = User.objects.create_user(
        email='expired@example.com',
        password='StrongPass123',
        first_name='Exp',
        last_name='Ired',
        email_verified=False,
    )
    otp = set_email_otp(user)
    user.email_otp_expires = timezone.now() - timedelta(minutes=1)
    user.save(update_fields=['email_otp_expires'])

    res = api_client.post(
        '/api/v1/auth/verify-email/',
        {'email': user.email, 'otp': otp},
        format='json',
    )
    assert res.status_code == 400


@pytest.mark.django_db
def test_otp_resend_rate_limit(api_client):
    user = User.objects.create_user(
        email='ratelimit@example.com',
        password='StrongPass123',
        first_name='Rate',
        last_name='Limit',
        email_verified=False,
    )
    res1 = api_client.post(
        '/api/v1/auth/resend-otp/',
        {'email': user.email},
        format='json',
    )
    assert res1.status_code == 200

    res2 = api_client.post(
        '/api/v1/auth/resend-otp/',
        {'email': user.email},
        format='json',
    )
    assert res2.status_code == 429


@pytest.mark.django_db
def test_reset_password_valid_token(api_client, verified_user):
    raw_token = set_password_reset_token(verified_user)
    res = api_client.post(
        '/api/v1/auth/reset-password/',
        {
            'token': raw_token,
            'password': 'NewStrongPass456',
            'confirmPassword': 'NewStrongPass456',
        },
        format='json',
    )
    assert res.status_code == 200

    login_res = api_client.post(
        '/api/v1/auth/sign-in/',
        {'email': verified_user.email, 'password': 'NewStrongPass456'},
        format='json',
    )
    assert login_res.status_code == 200


@pytest.mark.django_db
def test_reset_password_expired_token(api_client, verified_user):
    raw_token = set_password_reset_token(verified_user)
    verified_user.password_reset_expires = timezone.now() - timedelta(minutes=1)
    verified_user.save(update_fields=['password_reset_expires'])

    res = api_client.post(
        '/api/v1/auth/reset-password/',
        {
            'token': raw_token,
            'password': 'NewStrongPass456',
            'confirmPassword': 'NewStrongPass456',
        },
        format='json',
    )
    assert res.status_code == 400


@pytest.mark.django_db
def test_logout_blacklists_token(api_client, verified_user):
    login_res = api_client.post(
        '/api/v1/auth/sign-in/',
        {'email': verified_user.email, 'password': 'StrongPass123'},
        format='json',
    )
    access = login_res.data['access']
    refresh = login_res.data['refresh']

    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
    logout_res = api_client.post(
        '/api/v1/auth/logout/',
        {'refresh': refresh},
        format='json',
    )
    assert logout_res.status_code == 204

    refresh_res = api_client.post(
        '/api/v1/auth/token/refresh/',
        {'refresh': refresh},
        format='json',
    )
    assert refresh_res.status_code == 401


@pytest.mark.django_db
def test_token_refresh(api_client, verified_user):
    login_res = api_client.post(
        '/api/v1/auth/sign-in/',
        {'email': verified_user.email, 'password': 'StrongPass123'},
        format='json',
    )
    refresh = login_res.data['refresh']

    res = api_client.post(
        '/api/v1/auth/token/refresh/',
        {'refresh': refresh},
        format='json',
    )
    assert res.status_code == 200
    assert 'access' in res.data
    assert 'refresh' in res.data


@pytest.mark.django_db
def test_me_returns_profile(api_client, verified_user):
    api_client.force_authenticate(user=verified_user)
    res = api_client.get('/api/v1/auth/me/')
    assert res.status_code == 200
    assert res.data['email'] == verified_user.email
    assert res.data['name'] == 'Alice Owner'
    assert res.data['role'] == 'LIBRARY_OWNER'


@pytest.mark.django_db
def test_change_password(api_client, verified_user):
    api_client.force_authenticate(user=verified_user)
    res = api_client.post(
        '/api/v1/auth/change-password/',
        {
            'oldPassword': 'StrongPass123',
            'newPassword': 'UpdatedPass789',
            'confirmPassword': 'UpdatedPass789',
        },
        format='json',
    )
    assert res.status_code == 200

    api_client.force_authenticate(user=None)
    login_res = api_client.post(
        '/api/v1/auth/sign-in/',
        {'email': verified_user.email, 'password': 'UpdatedPass789'},
        format='json',
    )
    assert login_res.status_code == 200


@pytest.mark.django_db
def test_change_password_wrong_old(api_client, verified_user):
    api_client.force_authenticate(user=verified_user)
    res = api_client.post(
        '/api/v1/auth/change-password/',
        {
            'oldPassword': 'WrongOldPassword1',
            'newPassword': 'UpdatedPass789',
            'confirmPassword': 'UpdatedPass789',
        },
        format='json',
    )
    assert res.status_code == 400

