"""Automated tests for audit middleware, automatic model signals, and audit log APIs."""
from decimal import Decimal
import pytest
from django.http import HttpResponse
from django.test import RequestFactory
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.audit.middleware import (
    AuditRequestMiddleware,
    clear_current_request_context,
    get_current_request_context,
    set_current_request_context,
)
from apps.audit.models import AuditLog
from apps.billing.models import PlatformPayment, SubscriptionPlan
from apps.libraries.models import Library
from apps.students.models import Student


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def super_admin(db):
    return User.objects.create_superuser(
        email='audit_super@example.com',
        password='StrongPass123',
        first_name='Audit',
        last_name='Super',
    )


@pytest.fixture
def two_libraries(db):
    owner1 = User.objects.create_user(
        email='audit_owner1@example.com',
        password='StrongPass123',
        first_name='Owner',
        last_name='One',
        role='LIBRARY_OWNER',
        email_verified=True,
    )
    lib1 = Library.objects.create(
        code='LIB-AUD-1',
        name='Alpha Study Center',
        owner=owner1,
        city='Pune',
        state='Maharashtra',
        address='1 MG Road',
        phone='9876543210',
    )
    owner1.library = lib1
    owner1.save(update_fields=['library'])

    owner2 = User.objects.create_user(
        email='audit_owner2@example.com',
        password='StrongPass123',
        first_name='Owner',
        last_name='Two',
        role='LIBRARY_OWNER',
        email_verified=True,
    )
    lib2 = Library.objects.create(
        code='LIB-AUD-2',
        name='Beta Study Center',
        owner=owner2,
        city='Delhi',
        state='Delhi',
        address='2 CP Road',
        phone='9876543211',
    )
    owner2.library = lib2
    owner2.save(update_fields=['library'])

    staff1 = User.objects.create_user(
        email='audit_staff1@example.com',
        password='StrongPass123',
        first_name='Staff',
        last_name='One',
        role='STAFF',
        library=lib1,
        email_verified=True,
    )

    return owner1, lib1, owner2, lib2, staff1


@pytest.mark.django_db
def test_signals_record_create_update_delete_without_request_context(two_libraries):
    clear_current_request_context()
    _, lib1, *_ = two_libraries

    student = Student.objects.create(
        library=lib1,
        name='Rohan Sharma',
        email='rohan@example.com',
        phone='9999988888',
        gender='Male',
    )
    create_log = AuditLog.objects.filter(
        target_entity='Student',
        entity_id=str(student.id),
        action='Created Student',
    ).first()
    assert create_log is not None
    assert create_log.library_id == lib1.id
    assert create_log.actor is None
    assert create_log.diff['before'] is None
    assert create_log.diff['after']['name'] == 'Rohan Sharma'
    assert create_log.is_risky is False

    student.name = 'Rohan K. Sharma'
    student.save()
    update_log = AuditLog.objects.filter(
        target_entity='Student',
        entity_id=str(student.id),
        action='Updated Student',
    ).first()
    assert update_log is not None
    assert update_log.diff['before']['name'] == 'Rohan Sharma'
    assert update_log.diff['after']['name'] == 'Rohan K. Sharma'

    student_id = str(student.id)
    student.delete()
    delete_log = AuditLog.objects.filter(
        target_entity='Student',
        entity_id=student_id,
        action='Deleted Student',
    ).first()
    assert delete_log is not None
    assert delete_log.is_risky is True
    assert delete_log.diff['after'] is None


@pytest.mark.django_db
def test_sensitive_fields_redacted_and_risky_library_status(super_admin, two_libraries):
    _, lib1, *_ = two_libraries
    user_log = AuditLog.objects.filter(
        target_entity='User',
        entity_id=str(super_admin.id),
        action='Created User',
    ).first()
    assert user_log is not None
    assert user_log.is_risky is True
    assert user_log.diff['after']['password'] == '[REDACTED]'

    set_current_request_context(user=super_admin, ip_address='10.0.0.5', device='PytestAgent/1.0')
    try:
        lib1.library_status = 'Suspended'
        lib1.save()
    finally:
        clear_current_request_context()

    suspend_log = AuditLog.objects.filter(
        target_entity='Library',
        entity_id=str(lib1.id),
        action='Updated Library',
    ).first()
    assert suspend_log is not None
    assert suspend_log.is_risky is True
    assert suspend_log.actor_id == super_admin.id
    assert suspend_log.ip_address == '10.0.0.5'
    assert suspend_log.device == 'PytestAgent/1.0'


@pytest.mark.django_db
def test_audit_request_middleware_captures_and_clears_context(super_admin):
    factory = RequestFactory()
    request = factory.post(
        '/api/v1/platform/plans/',
        HTTP_X_FORWARDED_FOR='203.0.113.42, 10.0.0.1',
        HTTP_USER_AGENT='Mozilla/5.0 TestBrowser',
    )
    request.user = super_admin

    captured = {}

    def dummy_get_response(req):
        ctx = get_current_request_context()
        captured.update(ctx)
        SubscriptionPlan.objects.create(
            name='Enterprise',
            tier=4,
            monthly_fee=Decimal('4999.00'),
            quarterly_fee=Decimal('13999.00'),
            annual_fee=Decimal('49999.00'),
            max_branches=20,
            max_seats=2000,
        )
        return HttpResponse('ok')

    middleware = AuditRequestMiddleware(dummy_get_response)
    middleware(request)

    assert captured['user'] == super_admin
    assert captured['ip_address'] == '203.0.113.42'
    assert captured['device'] == 'Mozilla/5.0 TestBrowser'

    # Thread-local must be cleared after response
    after_ctx = get_current_request_context()
    assert after_ctx['user'] is None
    assert after_ctx['ip_address'] is None
    assert after_ctx['device'] == ''

    plan_log = AuditLog.objects.filter(target_entity='SubscriptionPlan').first()
    assert plan_log is not None
    assert plan_log.actor_id == super_admin.id
    assert plan_log.ip_address == '203.0.113.42'


@pytest.mark.django_db
def test_platform_audit_logs_endpoint_permissions_and_filtering(
    api_client, super_admin, two_libraries
):
    owner1, lib1, _, lib2, _ = two_libraries
    PlatformPayment.objects.create(
        library=lib1,
        amount=Decimal('1999.00'),
        method='UPI',
        type='Subscription',
        status='Success',
    )

    api_client.force_authenticate(user=owner1)
    forbidden = api_client.get('/api/v1/platform/audit-logs/')
    assert forbidden.status_code == 403

    api_client.force_authenticate(user=super_admin)
    res = api_client.get('/api/v1/platform/audit-logs/?module=Billing')
    assert res.status_code == 200
    assert res.data['count'] >= 1
    assert all(row['module'] == 'Billing' for row in res.data['results'])


@pytest.mark.django_db
def test_library_activity_logs_endpoint_tenant_isolation(api_client, two_libraries):
    owner1, lib1, _, lib2, staff1 = two_libraries
    Student.objects.create(
        library=lib1,
        name='Lib1 Student',
        email='s1@example.com',
        phone='9111111111',
        gender='Female',
    )
    Student.objects.create(
        library=lib2,
        name='Lib2 Student',
        email='s2@example.com',
        phone='9222222222',
        gender='Male',
    )

    api_client.force_authenticate(user=staff1)
    staff_res = api_client.get('/api/v1/library/activity-logs/')
    assert staff_res.status_code == 403

    api_client.force_authenticate(user=owner1)
    res = api_client.get('/api/v1/library/activity-logs/')
    assert res.status_code == 200
    assert res.data['count'] >= 1
    assert all(str(row['library']) == str(lib1.id) for row in res.data['results'])
