"""Automated tests for platform library management and library owner endpoints."""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.libraries.models import (
    AttendanceQrKioskConfig,
    Branch,
    Library,
    LibraryRequest,
    LibrarySettings,
)

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def super_admin(db):
    return User.objects.create_superuser(
        email='superadmin@lmsplatform.com',
        password='StrongPass123',
        first_name='Super',
        last_name='Admin',
    )


@pytest.fixture
def library_with_owner(db):
    owner = User.objects.create_user(
        email='owner@studyhub.com',
        password='StrongPass123',
        first_name='Aarav',
        last_name='Patel',
        role='LIBRARY_OWNER',
        email_verified=True,
    )
    library = Library.objects.create(
        code='LIB-AHM-001',
        name='StudyHub Ahmedabad',
        owner=owner,
        city='Ahmedabad',
        state='Gujarat',
        address='SG Highway, Ahmedabad',
        phone='+919876543210',
    )
    owner.library = library
    owner.save(update_fields=['library'])
    branch = Branch.objects.create(
        library=library,
        name='Main Branch',
        address=library.address,
        phone=library.phone,
        is_main=True,
    )
    LibrarySettings.objects.create(library=library)
    return library, owner, branch


@pytest.mark.django_db
def test_platform_libraries_requires_super_admin(api_client, library_with_owner):
    _, owner, _ = library_with_owner
    api_client.force_authenticate(user=owner)
    res = api_client.get('/api/v1/platform/libraries/')
    assert res.status_code == 403


@pytest.mark.django_db
def test_platform_libraries_crud_and_soft_close(api_client, super_admin):
    api_client.force_authenticate(user=super_admin)

    create_res = api_client.post(
        '/api/v1/platform/libraries/',
        {
            'code': 'LIB-SUR-002',
            'name': 'Focus Point Surat',
            'owner_email': 'owner@focuspoint.com',
            'owner_first_name': 'Rohan',
            'owner_last_name': 'Shah',
            'city': 'Surat',
            'state': 'Gujarat',
            'address': 'Ring Road, Surat',
            'phone': '+919876500001',
        },
        format='json',
    )
    assert create_res.status_code == 201
    library_id = create_res.data['id']

    list_res = api_client.get('/api/v1/platform/libraries/')
    assert list_res.status_code == 200
    assert list_res.data['count'] >= 1

    detail_res = api_client.get(f'/api/v1/platform/libraries/{library_id}/')
    assert detail_res.status_code == 200
    assert len(detail_res.data['branches']) == 1

    patch_res = api_client.patch(
        f'/api/v1/platform/libraries/{library_id}/',
        {'name': 'Focus Point Central'},
        format='json',
    )
    assert patch_res.status_code == 200
    assert patch_res.data['name'] == 'Focus Point Central'

    delete_res = api_client.delete(f'/api/v1/platform/libraries/{library_id}/')
    assert delete_res.status_code == 204
    assert Library.objects.get(id=library_id).library_status == 'Closed'


@pytest.mark.django_db
def test_platform_library_lock_unlock_suspend(
    api_client, super_admin, library_with_owner
):
    library, _, _ = library_with_owner
    api_client.force_authenticate(user=super_admin)

    lock_res = api_client.post(
        f'/api/v1/platform/libraries/{library.id}/lock/',
        {'reason': 'Payment overdue'},
        format='json',
    )
    assert lock_res.status_code == 200
    library.refresh_from_db()
    assert library.library_status == 'Locked'
    assert library.plan_status == 'Locked'
    assert library.status_reason == 'Payment overdue'

    unlock_res = api_client.post(
        f'/api/v1/platform/libraries/{library.id}/unlock/',
        {'reason': 'Payment cleared'},
        format='json',
    )
    assert unlock_res.status_code == 200
    library.refresh_from_db()
    assert library.library_status == 'Active'
    assert library.plan_status == 'Active'

    suspend_res = api_client.post(
        f'/api/v1/platform/libraries/{library.id}/suspend/',
        {'reason': 'Policy violation'},
        format='json',
    )
    assert suspend_res.status_code == 200
    library.refresh_from_db()
    assert library.library_status == 'Suspended'
    assert library.status_reason == 'Policy violation'


@pytest.mark.django_db
def test_library_request_approve_workflow(api_client, super_admin):
    req = LibraryRequest.objects.create(
        library_name='Scholar Zone',
        owner_name='Meera Joshi',
        mobile='+919898989898',
        email='meera@scholarzone.com',
        city='Vadodara',
        state='Gujarat',
        address='Alkapuri, Vadodara',
        branches_planned=2,
        planned_seats=120,
    )

    api_client.force_authenticate(user=super_admin)
    approve_res = api_client.post(
        f'/api/v1/platform/library-requests/{req.id}/approve/',
        {'plan_status': 'Active', 'notes': 'Verified GST and docs'},
        format='json',
    )
    assert approve_res.status_code == 200

    req.refresh_from_db()
    assert req.status == 'Approved'
    assert req.approved_library is not None
    assert req.reviewed_by == super_admin

    owner = User.objects.get(email='meera@scholarzone.com')
    assert owner.role == 'LIBRARY_OWNER'
    assert owner.library_id == req.approved_library_id
    assert Branch.objects.filter(library=req.approved_library, is_main=True).exists()
    assert LibrarySettings.objects.filter(library=req.approved_library).exists()
    assert AttendanceQrKioskConfig.objects.filter(
        branch__library=req.approved_library
    ).exists()


@pytest.mark.django_db
def test_library_request_reject_and_request_info(api_client, super_admin):
    req = LibraryRequest.objects.create(
        library_name='Pending Lib',
        owner_name='Test Owner',
        mobile='+919111111111',
        email='pending@lib.com',
        city='Rajkot',
        state='Gujarat',
        branches_planned=1,
        planned_seats=40,
    )

    api_client.force_authenticate(user=super_admin)

    info_res = api_client.post(
        f'/api/v1/platform/library-requests/{req.id}/request-info/',
        {'message': 'Please upload valid address proof'},
        format='json',
    )
    assert info_res.status_code == 200
    req.refresh_from_db()
    assert req.status == 'Info Requested'

    reject_res = api_client.post(
        f'/api/v1/platform/library-requests/{req.id}/reject/',
        {'reason': 'Incomplete verification documents'},
        format='json',
    )
    assert reject_res.status_code == 200
    req.refresh_from_db()
    assert req.status == 'Rejected'
    assert req.notes == 'Incomplete verification documents'


@pytest.mark.django_db
def test_library_owner_profile_settings_and_dashboard(api_client, library_with_owner):
    library, owner, _ = library_with_owner
    api_client.force_authenticate(user=owner)

    profile_res = api_client.get('/api/v1/library/profile/')
    assert profile_res.status_code == 200
    assert profile_res.data['code'] == library.code

    patch_profile_res = api_client.patch(
        '/api/v1/library/profile/',
        {'name': 'StudyHub Pro', 'phone': '+919900001111'},
        format='json',
    )
    assert patch_profile_res.status_code == 200
    assert patch_profile_res.data['name'] == 'StudyHub Pro'

    settings_res = api_client.patch(
        '/api/v1/library/settings/',
        {'grace_days': 7, 'allow_student_self_register': True},
        format='json',
    )
    assert settings_res.status_code == 200
    assert settings_res.data['grace_days'] == 7
    assert settings_res.data['allow_student_self_register'] is True

    dash_res = api_client.get('/api/v1/library/dashboard/')
    assert dash_res.status_code == 200
    assert dash_res.data['library_code'] == library.code
    assert dash_res.data['total_branches'] == 1


@pytest.mark.django_db
def test_branch_crud_and_qr_kiosk_regenerate(api_client, library_with_owner):
    library, owner, _ = library_with_owner
    api_client.force_authenticate(user=owner)

    create_res = api_client.post(
        '/api/v1/library/branches/',
        {
            'name': 'Navrangpura Branch',
            'address': 'Navrangpura, Ahmedabad',
            'phone': '+919876543211',
            'floors_count': 2,
            'allowed_qr_radius_meters': 150,
        },
        format='json',
    )
    assert create_res.status_code == 201
    branch_id = create_res.data['id']

    qr_res = api_client.get(f'/api/v1/library/branches/{branch_id}/qr-kiosk/')
    assert qr_res.status_code == 200
    initial_token = qr_res.data['qr_token']
    assert initial_token

    regen_res = api_client.post(
        f'/api/v1/library/branches/{branch_id}/qr-kiosk/regenerate/'
    )
    assert regen_res.status_code == 200
    assert regen_res.data['qr_token'] != initial_token

    del_res = api_client.delete(f'/api/v1/library/branches/{branch_id}/')
    assert del_res.status_code == 204
    assert Branch.objects.get(id=branch_id).is_active is False
