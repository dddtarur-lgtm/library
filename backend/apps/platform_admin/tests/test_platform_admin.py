"""Automated tests for platform_admin KPIs, reports, support, CMS, and email management."""
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.billing.models import (
    LibrarySubscription,
    PlatformPayment,
    SubscriptionPlan,
)
from apps.libraries.models import Branch, Library, LibraryRequest, LibrarySettings
from apps.platform_admin.models import (
    AppFeatureFlag,
    LibraryPublicPage,
    SupportTicket,
    TransactionalEmailLog,
    WebsiteContentBlock,
)
from apps.seats.models import AttendanceRecord, Seat
from apps.students.models import Student


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def super_admin(db):
    return User.objects.create_superuser(
        email='plat_super@example.com',
        password='StrongPass123',
        first_name='Platform',
        last_name='Admin',
    )


@pytest.fixture
def platform_setup(db):
    owner = User.objects.create_user(
        email='plat_owner@example.com',
        password='StrongPass123',
        first_name='Lib',
        last_name='Owner',
        role='LIBRARY_OWNER',
        email_verified=True,
    )
    library = Library.objects.create(
        code='LIB-PLAT-1',
        name='Zenith Reading Room',
        owner=owner,
        city='Jaipur',
        state='Rajasthan',
        address='5 MI Road',
        phone='9876543210',
        plan_status='Active',
        library_status='Active',
    )
    owner.library = library
    owner.save(update_fields=['library'])
    LibrarySettings.objects.create(library=library)

    branch = Branch.objects.create(
        library=library,
        name='Main Hall',
        address='5 MI Road',
        phone='9876543210',
        is_main=True,
    )
    student = Student.objects.create(
        library=library,
        branch=branch,
        name='Ananya Verma',
        email='ananya@example.com',
        phone='9811122233',
        gender='Female',
        status='Live',
    )
    seat = Seat.objects.create(branch=branch, label='A-01', floor=1, student=student)
    Seat.objects.create(branch=branch, label='A-02', floor=1)

    AttendanceRecord.objects.create(
        student=student,
        branch=branch,
        seat=seat,
        date=timezone.localdate(),
        time_in=timezone.now(),
        status='Present',
        method='QR Scan',
    )

    plan = SubscriptionPlan.objects.create(
        name='Pro',
        tier=3,
        monthly_fee=Decimal('2999.00'),
        quarterly_fee=Decimal('7999.00'),
        annual_fee=Decimal('29999.00'),
        max_branches=5,
        max_seats=500,
    )
    sub = LibrarySubscription.objects.create(
        library=library,
        plan=plan,
        billing_cycle='Monthly',
        start_date=timezone.localdate() - timedelta(days=20),
        end_date=timezone.localdate() + timedelta(days=10),
        status='Active',
        fee_amount=Decimal('2999.00'),
    )
    PlatformPayment.objects.create(
        library=library,
        subscription=sub,
        amount=Decimal('2999.00'),
        method='Razorpay',
        type='Subscription',
        status='Success',
    )
    LibraryRequest.objects.create(
        library_name='Sunrise Study Hub',
        owner_name='Kiran Patel',
        mobile='9988776655',
        email='kiran@example.com',
        city='Surat',
        state='Gujarat',
        status='Pending',
    )
    return owner, library, branch, student, plan, sub


@pytest.mark.django_db
def test_platform_dashboard_kpis_and_widgets(api_client, super_admin, platform_setup):
    owner, *_ = platform_setup
    api_client.force_authenticate(user=owner)
    assert api_client.get('/api/v1/platform/dashboard/kpis/').status_code == 403

    api_client.force_authenticate(user=super_admin)
    kpi_res = api_client.get('/api/v1/platform/dashboard/kpis/')
    assert kpi_res.status_code == 200
    assert kpi_res.data['data']['totalLibraries'] == 1
    assert kpi_res.data['data']['liveStudents'] == 1
    assert kpi_res.data['data']['pendingApprovals'] == 1
    assert Decimal(kpi_res.data['data']['revenueThisMonth']) == Decimal('2999.00')

    expiring_res = api_client.get('/api/v1/platform/dashboard/expiring-plans/')
    assert expiring_res.status_code == 200
    assert len(expiring_res.data['data']) == 1

    payments_res = api_client.get('/api/v1/platform/dashboard/recent-payments/')
    assert payments_res.status_code == 200
    assert len(payments_res.data['data']) == 1

    pending_res = api_client.get('/api/v1/platform/dashboard/pending-requests/')
    assert pending_res.status_code == 200
    assert len(pending_res.data['data']) == 1

    email_health_res = api_client.get('/api/v1/platform/dashboard/email-health/')
    assert email_health_res.status_code == 200
    assert len(email_health_res.data['data']) == 1


@pytest.mark.django_db
def test_platform_and_library_reports(api_client, super_admin, platform_setup):
    owner, *_ = platform_setup

    api_client.force_authenticate(user=super_admin)
    for endpoint in (
        '/api/v1/platform/reports/revenue/',
        '/api/v1/platform/reports/growth/',
        '/api/v1/platform/reports/plan-distribution/',
        '/api/v1/platform/reports/student-status/',
        '/api/v1/platform/reports/expiry-forecast/',
        '/api/v1/platform/reports/occupancy/',
        '/api/v1/platform/reports/usage/',
    ):
        res = api_client.get(endpoint)
        assert res.status_code == 200
        assert res.data['success'] is True

    occ = api_client.get('/api/v1/platform/reports/occupancy/')
    assert occ.data['data']['totalSeats'] == 2
    assert occ.data['data']['occupiedSeats'] == 1
    assert occ.data['data']['occupancyRate'] == 50.0

    api_client.force_authenticate(user=owner)
    lib_overview = api_client.get('/api/v1/library/reports/')
    assert lib_overview.status_code == 200
    assert lib_overview.data['data']['totalStudents'] == 1

    lib_rev = api_client.get('/api/v1/library/reports/revenue/')
    assert lib_rev.status_code == 200
    assert len(lib_rev.data['data']) == 12

    lib_att = api_client.get('/api/v1/library/reports/attendance/')
    assert lib_att.status_code == 200
    assert lib_att.data['data']['todayCount'] == 1


@pytest.mark.django_db
def test_support_ticket_lifecycle(api_client, super_admin, platform_setup):
    owner, *_ = platform_setup

    api_client.force_authenticate(user=owner)
    create_res = api_client.post(
        '/api/v1/library/support/',
        {
            'subject': 'QR Kiosk not scanning',
            'description': 'Scanner returns timeout on Floor 1',
            'category': 'Technical',
            'priority': 'High',
        },
        format='json',
    )
    assert create_res.status_code == 201
    ticket_id = create_res.data['id']

    api_client.force_authenticate(user=super_admin)
    list_res = api_client.get('/api/v1/platform/support/?priority=High')
    assert list_res.status_code == 200
    assert list_res.data['count'] == 1

    staff_reply = api_client.post(
        f'/api/v1/platform/support/{ticket_id}/reply/',
        {'message': 'Please refresh the kiosk token and retry.'},
        format='json',
    )
    assert staff_reply.status_code == 201
    assert staff_reply.data['data']['is_staff_reply'] is True

    patch_res = api_client.patch(
        f'/api/v1/platform/support/{ticket_id}/',
        {'status': 'Resolved'},
        format='json',
    )
    assert patch_res.status_code == 200
    ticket = SupportTicket.objects.get(id=ticket_id)
    assert ticket.resolved_at is not None

    api_client.force_authenticate(user=owner)
    thread_res = api_client.get(f'/api/v1/library/support/{ticket_id}/')
    assert thread_res.status_code == 200
    assert len(thread_res.data['messages']) == 1


@pytest.mark.django_db
def test_cms_feature_flags_and_public_page_review(api_client, super_admin, platform_setup):
    _, library, *_ = platform_setup
    WebsiteContentBlock.objects.create(section='hero', title='Old Hero')
    AppFeatureFlag.objects.create(feature='qr_kiosk', name='QR Kiosk', is_enabled=True)
    page = LibraryPublicPage.objects.create(
        library=library, slug='zenith-reading-room', headline='Study in Peace'
    )

    api_client.force_authenticate(user=super_admin)
    patch_cms = api_client.patch(
        '/api/v1/platform/website-content/hero/',
        {'title': 'New Hero Title', 'content': {'cta': 'Get Started'}},
        format='json',
    )
    assert patch_cms.status_code == 200
    assert patch_cms.data['data']['title'] == 'New Hero Title'

    media_file = SimpleUploadedFile('banner.png', b'pngbytes', content_type='image/png')
    upload_res = api_client.post(
        '/api/v1/platform/website-content/media/',
        {'title': 'Hero Banner', 'file': media_file, 'media_type': 'Image'},
        format='multipart',
    )
    assert upload_res.status_code == 201
    media_id = upload_res.data['id']
    assert api_client.delete(f'/api/v1/platform/website-content/media/{media_id}/').status_code == 204

    flag_res = api_client.patch(
        '/api/v1/platform/app-management/qr_kiosk/',
        {'is_enabled': False},
        format='json',
    )
    assert flag_res.status_code == 200
    assert flag_res.data['data']['is_enabled'] is False

    approve_res = api_client.post(f'/api/v1/platform/library-pages/{page.id}/approve/')
    assert approve_res.status_code == 200
    assert approve_res.data['data']['status'] == 'Approved'
    library.settings.refresh_from_db()
    assert library.settings.public_page_enabled is True


@pytest.mark.django_db
def test_library_smtp_config_test_and_logs(api_client, platform_setup):
    owner, library, *_ = platform_setup
    api_client.force_authenticate(user=owner)

    put_res = api_client.put(
        '/api/v1/library/email-management/smtp/',
        {
            'host': 'smtp.example.com',
            'port': 587,
            'username': 'mailer@example.com',
            'password': 'secret-password',
            'from_email': 'noreply@zenith.example.com',
            'from_name': 'Zenith Library',
            'use_tls': True,
        },
        format='json',
    )
    assert put_res.status_code == 200
    assert 'password' not in put_res.data['data']
    assert put_res.data['data']['has_password'] is True

    with patch('apps.platform_admin.views_email.EmailMessage.send', return_value=1):
        test_res = api_client.post(
            '/api/v1/library/email-management/smtp/test/',
            {'recipient_email': 'verify@example.com'},
            format='json',
        )
    assert test_res.status_code == 200
    library.refresh_from_db()
    assert library.email_connection_status == 'Connected'
    assert TransactionalEmailLog.objects.filter(library=library, status='Sent').count() == 1

    logs_res = api_client.get('/api/v1/library/email-management/logs/')
    assert logs_res.status_code == 200
    assert logs_res.data['count'] == 1
