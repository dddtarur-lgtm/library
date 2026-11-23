"""Automated tests for platform users and library staff endpoints."""
import pytest
from rest_framework.test import APIClient

from apps.accounts.models import StaffPermission, User
from apps.libraries.models import Library


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def super_admin(db):
    return User.objects.create_superuser(
        email='admin@lmsplatform.com',
        password='StrongPass123',
        first_name='Super',
        last_name='Admin',
    )


@pytest.fixture
def library_with_owner(db):
    owner = User.objects.create_user(
        email='owner@lib.com',
        password='StrongPass123',
        first_name='Lib',
        last_name='Owner',
        role='LIBRARY_OWNER',
        email_verified=True,
    )
    library = Library.objects.create(
        code='LIB-TEST-001',
        name='Test Library',
        owner=owner,
        city='Ahmedabad',
        state='Gujarat',
        address='123 Test St',
        phone='+919999999999',
    )
    owner.library = library
    owner.save(update_fields=['library'])
    return library, owner


@pytest.mark.django_db
def test_platform_users_requires_super_admin(api_client, library_with_owner):
    _, owner = library_with_owner
    api_client.force_authenticate(user=owner)
    res = api_client.get('/api/v1/platform/users/')
    assert res.status_code == 403


@pytest.mark.django_db
def test_platform_users_crud(api_client, super_admin):
    api_client.force_authenticate(user=super_admin)

    create_res = api_client.post(
        '/api/v1/platform/users/',
        {
            'first_name': 'Ops',
            'last_name': 'Admin',
            'username': 'opsadmin',
            'email': 'ops@lmsplatform.com',
            'role': 'SUPER_ADMIN',
        },
        format='json',
    )
    assert create_res.status_code == 201
    user_id = create_res.data['id']

    list_res = api_client.get('/api/v1/platform/users/')
    assert list_res.status_code == 200
    assert list_res.data['count'] >= 2

    delete_res = api_client.delete(f'/api/v1/platform/users/{user_id}/')
    assert delete_res.status_code == 204
    assert User.objects.get(id=user_id).is_active is False


@pytest.mark.django_db
def test_library_staff_crud_and_permissions(api_client, library_with_owner):
    library, owner = library_with_owner
    api_client.force_authenticate(user=owner)

    create_res = api_client.post(
        '/api/v1/library/staff/',
        {
            'first_name': 'Front',
            'last_name': 'Desk',
            'username': 'frontdesk',
            'email': 'staff@lib.com',
            'role': 'STAFF',
            'permissions': {
                'students': 'Full Access',
                'fees_plans': 'View Only',
                'can_view_revenue': False,
            },
        },
        format='json',
    )
    assert create_res.status_code == 201
    staff_id = create_res.data['id']

    staff = User.objects.get(id=staff_id)
    assert staff.library_id == library.id
    assert StaffPermission.objects.filter(staff=staff).exists()

    perm_res = api_client.patch(
        f'/api/v1/library/staff/{staff_id}/permissions/',
        {'books': 'Full Access', 'can_view_revenue': True},
        format='json',
    )
    assert perm_res.status_code == 200
    assert perm_res.data['books'] == 'Full Access'
    assert perm_res.data['can_view_revenue'] is True

