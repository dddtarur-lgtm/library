"""Phase 6 Parity Test Suite: Super Admin Platform Operations, Webhooks, Files & Realtime.
Covers Section 16 (Leads, Student Feedback, Reports, Platform Billing, Files, Support),
Section 17 (Platform Super Admin Dashboard, Lifecycle, Plans, Announcements, Settings, Jobs),
and Section 18 (Razorpay Webhooks, Realtime SSE).
"""
import uuid
from decimal import Decimal
import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.billing.models import (
    LibrarySubscription,
    Payment,
    PaymentWebhookEvent,
    PlatformPayment,
    SubscriptionPlan,
)
from apps.core.jwt import (
    AUDIENCE_LIBRARY,
    AUDIENCE_PLATFORM,
    AUDIENCE_STUDENT,
    generate_access_token,
)
from apps.core.models import FileAsset
from apps.libraries.models import Branch, Library, LibrarySettings
from apps.public.models import LibraryEnquiry
from apps.platform_admin.models import GlobalSetting, PlatformAnnouncement, SupportTicket
from apps.students.models import Student, StudentFeedbackTicket, StudentMembership


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def superadmin_user(db):
    user = User.objects.create_user(
        email='superadmin@platform.com',
        password='Password123!',
        first_name='Platform',
        last_name='Admin',
        role='SUPER_ADMIN',
        is_staff=True,
        is_superuser=True,
    )
    return user


@pytest.fixture
def superadmin_auth_header(superadmin_user):
    token = generate_access_token(
        superadmin_user.id,
        audience=AUDIENCE_PLATFORM,
        extra_claims={'role': 'super_admin'},
    )
    return {'HTTP_AUTHORIZATION': f'Bearer {token}'}


@pytest.fixture
def library_tenant(db):
    owner = User.objects.create_user(
        email='owner.phase6@library.com',
        password='Password123!',
        first_name='Vikram',
        last_name='Mehta',
        role='LIBRARY_OWNER',
        phone='9811223344',
    )
    lib = Library.objects.create(
        code='LIB-P6-01',
        name='Vikram Reading Space',
        owner=owner,
        city='Jaipur',
        state='Rajasthan',
        address='Tonk Road, Jaipur',
        phone='9811223344',
        plan_status='Active',
        library_status='Active',
    )
    Branch.objects.create(
        library=lib,
        name='Main Center',
        address='Tonk Road, Jaipur',
        phone='9811223344',
        is_main=True,
    )
    owner.library = lib
    owner.save()
    return lib


@pytest.fixture
def library_auth_header(library_tenant):
    token = generate_access_token(
        library_tenant.owner.id,
        audience=AUDIENCE_LIBRARY,
        extra_claims={'org_id': str(library_tenant.id)},
    )
    return {'HTTP_AUTHORIZATION': f'Bearer {token}'}


@pytest.fixture
def student_user(db, library_tenant):
    user = User.objects.create_user(
        email='student.p6@hub.com',
        password='Password123!',
        first_name='Rohan',
        last_name='Joshi',
        role='STUDENT',
        phone='9871122334',
    )
    student = Student.objects.create(
        user=user,
        library=library_tenant,
        branch=library_tenant.branches.first(),
        name='Rohan Joshi',
        phone='9871122334',
        gender='male',
        status='Live',
    )
    StudentMembership.objects.create(
        student=student,
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + timezone.timedelta(days=30),
        status='Active',
        amount_paid=Decimal('1200.00'),
        payment_mode='Cash',
    )
    return user


@pytest.fixture
def student_auth_header(student_user, library_tenant):
    token = generate_access_token(
        student_user.id,
        audience=AUDIENCE_STUDENT,
        extra_claims={'org_id': str(library_tenant.id)},
    )
    return {'HTTP_AUTHORIZATION': f'Bearer {token}'}


# ============================================================================
# 1. Section 16.1 Leads (Enquiries) Lifecycle & Conversion
# ============================================================================

@pytest.mark.django_db
def test_library_leads_lifecycle(client, library_tenant, library_auth_header):
    """Test lead capture, notes, status changes, funnel stats, and conversion to student."""
    # 1. Create a lead
    create_resp = client.post(
        '/v1/library/leads',
        {
            'name': 'Pooja Agarwal',
            'mobile': '9899112233',
            'email': 'pooja.agarwal@gmail.com',
            'source': 'walk_in',
            'notes': 'Interested in AC reading room morning shift.',
        },
        format='json',
        **library_auth_header,
    )
    assert create_resp.status_code == status.HTTP_201_CREATED
    lead_id = create_resp.data['id']
    assert create_resp.data['status'] == 'new'
    assert create_resp.data['name'] == 'Pooja Agarwal'

    # 2. Get lead detail
    detail_resp = client.get(f'/v1/library/leads/{lead_id}', **library_auth_header)
    assert detail_resp.status_code == status.HTTP_200_OK
    assert detail_resp.data['mobile'] == '9899112233'

    # 3. Add follow-up note
    note_resp = client.post(
        f'/v1/library/leads/{lead_id}/notes',
        {'note': 'Called candidate. Offered 10% demo discount.'},
        format='json',
        **library_auth_header,
    )
    assert note_resp.status_code == status.HTTP_201_CREATED
    assert 'demo discount' in note_resp.data['text']

    # 4. Patch lead status
    patch_resp = client.patch(
        f'/v1/library/leads/{lead_id}',
        {'status': 'contacted'},
        format='json',
        **library_auth_header,
    )
    assert patch_resp.status_code == status.HTTP_200_OK
    assert patch_resp.data['status'] == 'contacted'

    # 5. Leads stats / funnel
    stats_resp = client.get('/v1/library/leads/stats', **library_auth_header)
    assert stats_resp.status_code == status.HTTP_200_OK
    assert 'funnel' in stats_resp.data

    # 6. Convert lead to Student
    convert_resp = client.post(
        f'/v1/library/leads/{lead_id}/convert',
        {},
        format='json',
        **library_auth_header,
    )
    assert convert_resp.status_code == status.HTTP_200_OK
    assert 'enrollment_id' in convert_resp.data

    # Verify student exists in DB
    student = Student.objects.filter(pk=convert_resp.data['enrollment_id']).first()
    assert student is not None
    assert student.name == 'Pooja Agarwal'


# ============================================================================
# 2. Section 16.2 & 8.10 Student Feedback and Complaints
# ============================================================================

@pytest.mark.django_db
def test_feedback_tickets_thread(client, library_tenant, library_auth_header, student_auth_header):
    """Test student creates feedback ticket, staff replies, status update, and student referral."""
    # 1. Student creates ticket
    t_resp = client.post(
        '/v1/student/feedback-tickets',
        {
            'ticket_type': 'complaint',
            'subject': 'AC temperature too low in Floor 2',
            'message': 'Floor 2 is freezing since morning. Please adjust temperature to 24C.',
        },
        format='json',
        **student_auth_header,
    )
    assert t_resp.status_code == status.HTTP_201_CREATED
    ticket_id = t_resp.data['id']
    assert t_resp.data['status'] == 'open'

    # 2. Student lists tickets
    st_list = client.get('/v1/student/feedback-tickets', **student_auth_header)
    assert st_list.status_code == status.HTTP_200_OK
    assert len(st_list.data) >= 1

    # 3. Library staff lists feedback tickets
    lib_list = client.get('/v1/library/feedback-tickets', **library_auth_header)
    assert lib_list.status_code == status.HTTP_200_OK
    tickets = lib_list.data.get('data') if isinstance(lib_list.data, dict) else lib_list.data
    assert any(t['id'] == ticket_id for t in tickets)

    # 4. Library staff replies
    reply_resp = client.post(
        f'/v1/library/feedback-tickets/{ticket_id}/messages',
        {'message': 'We have set the AC thermostat to 24C. Thanks for notifying us.'},
        format='json',
        **library_auth_header,
    )
    assert reply_resp.status_code == status.HTTP_201_CREATED
    assert reply_resp.data['is_staff_reply'] is True

    # 5. Library staff resolves ticket
    patch_t = client.patch(
        f'/v1/library/feedback-tickets/{ticket_id}',
        {'status': 'resolved'},
        format='json',
        **library_auth_header,
    )
    assert patch_t.status_code == status.HTTP_200_OK
    assert patch_t.data['status'] == 'resolved'

    # 6. Student gets ticket detail with full conversation
    detail_resp = client.get(f'/v1/student/feedback-tickets/{ticket_id}', **student_auth_header)
    assert detail_resp.status_code == status.HTTP_200_OK
    assert detail_resp.data['status'] == 'resolved'
    assert len(detail_resp.data['messages']) >= 2

    # 7. Student referral info & application
    ref_info = client.get('/v1/student/referral', **student_auth_header)
    assert ref_info.status_code == status.HTTP_200_OK
    assert 'code' in ref_info.data

    ref_apply = client.post(
        '/v1/student/referral/apply',
        {'code': ref_info.data['code']},
        format='json',
        **student_auth_header,
    )
    assert ref_apply.status_code == status.HTTP_200_OK
    assert ref_apply.data['applied'] is True


# ============================================================================
# 3. Section 16.3 Reports, Schedules, Exports & Section 16.4 Activity Log
# ============================================================================

@pytest.mark.django_db
def test_reports_and_activity_lifecycle(client, library_tenant, library_auth_header):
    """Test reports catalog, report rendering, async export, owner summary, and activity logs."""
    # 1. Report Catalog
    cat_resp = client.get('/v1/library/reports/catalog', **library_auth_header)
    assert cat_resp.status_code == status.HTTP_200_OK
    codes = [r['code'] for r in cat_resp.data]
    assert 'overview' in codes

    # 2. Render standard report
    rep_resp = client.get('/v1/library/reports/overview', **library_auth_header)
    assert rep_resp.status_code == status.HTTP_200_OK
    assert 'table' in rep_resp.data
    assert 'columns' in rep_resp.data['table']
    assert 'rows' in rep_resp.data['table']

    # 3. Export report
    exp_resp = client.post(
        '/v1/library/reports/overview/export',
        {'format': 'csv'},
        format='json',
        **library_auth_header,
    )
    assert exp_resp.status_code == status.HTTP_202_ACCEPTED
    export_id = exp_resp.data['export_id']

    # 4. Check exports list
    exports_list = client.get('/v1/library/exports', **library_auth_header)
    assert exports_list.status_code == status.HTTP_200_OK
    exports = exports_list.data.get('data') if isinstance(exports_list.data, dict) else exports_list.data
    assert any(e['id'] == export_id for e in exports)

    # 5. Owner Summary
    summary_resp = client.get('/v1/library/reports/owner-summary', **library_auth_header)
    assert summary_resp.status_code == status.HTTP_200_OK
    assert 'highlights' in summary_resp.data
    assert 'insights' in summary_resp.data

    # 6. Activity log
    act_resp = client.get('/v1/library/activity', **library_auth_header)
    assert act_resp.status_code == status.HTTP_200_OK
    assert 'data' in act_resp.data


# ============================================================================
# 4. Section 16.5 Platform Billing for Libraries & Section 16.6 Support / Files
# ============================================================================

@pytest.mark.django_db
def test_platform_billing_files_and_support(client, library_tenant, library_auth_header):
    """Test platform pricing tiers, subscription order, files presign, and support tickets."""
    # 1. Platform Plans
    plans_resp = client.get('/v1/library/billing/plans', **library_auth_header)
    assert plans_resp.status_code == status.HTTP_200_OK
    assert len(plans_resp.data) >= 1

    # 2. Preview Plan
    prev_resp = client.post(
        '/v1/library/billing/preview',
        {'plan_code': 'standard_monthly'},
        format='json',
        **library_auth_header,
    )
    assert prev_resp.status_code == status.HTTP_200_OK
    assert 'subtotal' in prev_resp.data
    assert 'total_payable' in prev_resp.data

    # 3. Addons
    addons_resp = client.get('/v1/library/billing/addons', **library_auth_header)
    assert addons_resp.status_code == status.HTTP_200_OK
    assert len(addons_resp.data) >= 1

    # 4. Files Presign Validation (Strict MIME & Size)
    invalid_file = client.post(
        '/v1/files/presign',
        {
            'purpose': 'library_logo',
            'file_name': 'script.exe',
            'mime_type': 'application/x-msdownload',
            'file_size_bytes': 1024,
        },
        format='json',
        **library_auth_header,
    )
    assert invalid_file.status_code == status.HTTP_400_BAD_REQUEST

    valid_file = client.post(
        '/v1/files/presign',
        {
            'purpose': 'library_logo',
            'file_name': 'logo.png',
            'mime_type': 'image/png',
            'file_size_bytes': 512000,
        },
        format='json',
        **library_auth_header,
    )
    assert valid_file.status_code == status.HTTP_200_OK
    file_id = valid_file.data['file_id']
    assert 'upload_url' in valid_file.data

    # 5. Complete File Upload
    comp_resp = client.post(f'/v1/files/{file_id}/complete', {}, format='json', **library_auth_header)
    assert comp_resp.status_code == status.HTTP_200_OK
    assert comp_resp.data['status'] == 'ready'

    # 6. Library Support Ticket
    support_resp = client.post(
        '/v1/library/support/tickets',
        {
            'subject': 'Assistance with QR code attendance sync',
            'message': 'Scans taking 2 seconds longer during peak hours.',
            'priority': 'medium',
        },
        format='json',
        **library_auth_header,
    )
    assert support_resp.status_code == status.HTTP_201_CREATED
    ticket_id = support_resp.data['id']
    assert support_resp.data['status'].lower() == 'open'

    # Reply to support ticket
    sup_msg = client.post(
        f'/v1/library/support/tickets/{ticket_id}/messages',
        {'message': 'Attached diagnostic logs from network tab.'},
        format='json',
        **library_auth_header,
    )
    assert sup_msg.status_code == status.HTTP_201_CREATED


# ============================================================================
# 5. Section 17 Platform Super Admin & Section 18 Webhooks / Realtime
# ============================================================================

@pytest.mark.django_db
def test_super_admin_operations_webhooks_and_realtime(
    client, library_tenant, superadmin_auth_header, library_auth_header
):
    """Test super admin dashboard, library lifecycle, announcements, settings, jobs, webhooks, and SSE."""
    # 1. Super Admin Dashboard KPIs
    dash_resp = client.get('/v1/platform/dashboard', **superadmin_auth_header)
    assert dash_resp.status_code == status.HTTP_200_OK
    assert 'libraries' in dash_resp.data
    assert dash_resp.data['libraries']['total'] >= 1

    # 2. Super Admin Analytics & Activity
    analytics = client.get('/v1/platform/analytics', **superadmin_auth_header)
    assert analytics.status_code == status.HTTP_200_OK

    activity = client.get('/v1/platform/activity', **superadmin_auth_header)
    assert activity.status_code == status.HTTP_200_OK

    # 3. Library Lifecycle: Suspend & Reactivate
    suspend_resp = client.post(
        f'/v1/platform/libraries/{library_tenant.id}/suspend',
        {'reason': 'Audit review required.'},
        format='json',
        **superadmin_auth_header,
    )
    assert suspend_resp.status_code == status.HTTP_200_OK
    assert suspend_resp.data['status'] == 'suspended'

    reactivate_resp = client.post(
        f'/v1/platform/libraries/{library_tenant.id}/reactivate',
        {'note': 'Audit cleared.'},
        format='json',
        **superadmin_auth_header,
    )
    assert reactivate_resp.status_code == status.HTTP_200_OK
    assert reactivate_resp.data['status'] == 'active'

    # 4. Impersonate Library
    imp_resp = client.post(
        f'/v1/platform/libraries/{library_tenant.id}/impersonate',
        {'reason': 'Diagnosing attendance rule issue.'},
        format='json',
        **superadmin_auth_header,
    )
    assert imp_resp.status_code == status.HTTP_200_OK
    assert 'view_as_token' in imp_resp.data
    assert imp_resp.data['is_impersonation'] is True

    # 5. Announcements Audience Preview & Create
    prev_ann = client.post(
        '/v1/platform/announcements/audience-preview',
        {'audience': {'cities': ['Jaipur']}},
        format='json',
        **superadmin_auth_header,
    )
    assert prev_ann.status_code == status.HTTP_200_OK
    assert prev_ann.data['count'] >= 1

    ann_resp = client.post(
        '/v1/platform/announcements',
        {
            'title': 'Platform Scheduled Maintenance',
            'body': 'Maintenance window on Sunday 2 AM to 4 AM.',
            'channels': ['inbox', 'email'],
            'audience': {'cities': ['Jaipur']},
        },
        format='json',
        **superadmin_auth_header,
    )
    assert ann_resp.status_code == status.HTTP_201_CREATED

    # 6. Global Platform Settings
    settings_resp = client.patch(
        '/v1/platform/settings',
        {'settings': {'grace_period_days': 5, 'lock_threshold_days': 5}},
        format='json',
        **superadmin_auth_header,
    )
    assert settings_resp.status_code == status.HTTP_200_OK

    # 7. Platform Background Jobs Trigger
    jobs_resp = client.post(
        '/v1/platform/jobs/run',
        {'job_name': 'check_expiries'},
        format='json',
        **superadmin_auth_header,
    )
    assert jobs_resp.status_code in [status.HTTP_200_OK, status.HTTP_202_ACCEPTED]
    assert jobs_resp.data['status'] in ['completed', 'queued']

    # 8. Webhook Idempotency & Processing: Razorpay Library Webhook
    event_id = f'evt_{uuid.uuid4().hex[:12]}'
    webhook_payload = {
        'id': event_id,
        'event': 'payment.captured',
        'payload': {
            'payment': {
                'entity': {
                    'id': f'pay_{uuid.uuid4().hex[:10]}',
                    'order_id': f'order_{uuid.uuid4().hex[:10]}',
                    'amount': 150000,
                    'currency': 'INR',
                    'status': 'captured',
                }
            }
        },
    }
    # First delivery
    wh_resp1 = client.post(
        '/v1/webhooks/razorpay/library/test_key',
        webhook_payload,
        format='json',
    )
    assert wh_resp1.status_code == status.HTTP_200_OK
    assert wh_resp1.data['status'] == 'processed'

    # Second delivery (idempotency check)
    wh_resp2 = client.post(
        '/v1/webhooks/razorpay/library/test_key',
        webhook_payload,
        format='json',
    )
    assert wh_resp2.status_code == status.HTTP_200_OK
    assert wh_resp2.data['status'] == 'already_processed'

    # 9. Realtime SSE Stream Handshake
    sse_resp = client.get('/v1/realtime/stream', **library_auth_header)
    assert sse_resp.status_code == status.HTTP_200_OK
    assert sse_resp.headers['Content-Type'].startswith('text/event-stream')
    stream_content = b''.join(sse_resp.streaming_content)
    assert b'event: connect' in stream_content
    assert b': heartbeat' in stream_content
