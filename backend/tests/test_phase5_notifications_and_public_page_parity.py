"""Phase 5 Parity Test Suite: Notifications, Student Public Pages, Engagement & Broadcasts.
Covers Section 15 (Library Notifications, Public Page Editor, Email), Section 8.4 (Student Notifications & Dialogs),
and Section 6 (Public Gallery, FAQs, Notices).
"""
import uuid
from decimal import Decimal
import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.libraries.models import Library, Branch, LibrarySettings, LibraryEmailConnection
from apps.notifications.models import NotificationBroadcast, StudentNotification
from apps.public.models import (
    LibraryFacility,
    LibraryBanner,
    LibraryGalleryItem,
    LibraryAchiever,
    LibraryNotice,
    LibraryFaq,
)
from apps.students.models import Student, StudentMembership
from apps.core.jwt import generate_access_token, AUDIENCE_LIBRARY, AUDIENCE_STUDENT


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def library_tenant(db):
    owner = User.objects.create_user(
        email='owner.notify@library.com',
        password='Password123!',
        first_name='Kavita',
        last_name='Sharma',
        role='LIBRARY_OWNER',
        phone='9876541122',
    )
    lib = Library.objects.create(
        code='LIB-NOTIFY-01',
        name='Saraswati Knowledge Hub',
        owner=owner,
        city='Ahmedabad',
        state='Gujarat',
        address='Navrangpura, Ahmedabad',
        phone='9876541122',
        plan_status='Active',
        library_status='Active',
    )
    Branch.objects.create(
        library=lib,
        name='Main Branch',
        address='Navrangpura, Ahmedabad',
        phone='9876541122',
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
        email='student.notify@hub.com',
        password='Password123!',
        first_name='Ananya',
        last_name='Patel',
        role='STUDENT',
        phone='9123456789',
    )
    student = Student.objects.create(
        user=user,
        library=library_tenant,
        branch=library_tenant.branches.first(),
        name='Ananya Patel',
        phone='9123456789',
        gender='female',
        status='Live',
    )
    StudentMembership.objects.create(
        student=student,
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + timezone.timedelta(days=30),
        status='Active',
        amount_paid=Decimal('1500.00'),
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
# 1. Section 15.1 Notifications (Library Admin Panel)
# ============================================================================

@pytest.mark.django_db
def test_library_notifications_lifecycle(client, library_tenant, library_auth_header, student_user):
    """Test audience preview, draft creation, patch, send, pause, resume, cancel, and KPI tracking."""
    # 1. Audience preview
    prev_resp = client.post(
        '/v1/library/notifications/audience-preview',
        {'audience': {'statuses': ['live'], 'genders': ['female']}},
        format='json',
        **library_auth_header,
    )
    assert prev_resp.status_code == status.HTTP_200_OK
    assert prev_resp.data['count'] >= 1
    assert 'Ananya Patel' in prev_resp.data['sample']

    # 2. Validation: Image required for half_image layout
    err_resp = client.post(
        '/v1/library/notifications',
        {
            'action': 'save_draft',
            'title': 'Grand Seminar',
            'body': 'Join our UPSC seminar',
            'dialog_layout': 'half_image',
        },
        format='json',
        **library_auth_header,
    )
    assert err_resp.status_code == status.HTTP_400_BAD_REQUEST

    # 3. Create Draft Notification
    draft_resp = client.post(
        '/v1/library/notifications',
        {
            'action': 'save_draft',
            'title': 'Weekly Mock Test',
            'subtitle': 'Paper 1 & 2',
            'body': 'Mock test scheduled this Sunday at 10 AM.',
            'dialog_layout': 'text_only',
            'priority': 'normal',
            'show_on_screen': True,
            'audience': {'statuses': ['live']},
        },
        format='json',
        **library_auth_header,
    )
    assert draft_resp.status_code == status.HTTP_201_CREATED
    notif_id = draft_resp.data['id']
    assert draft_resp.data['status'] == 'draft'

    # 4. Patch draft
    patch_resp = client.patch(
        f'/v1/library/notifications/{notif_id}',
        {'title': 'Revised Weekly Mock Test', 'priority': 'high'},
        format='json',
        **library_auth_header,
    )
    assert patch_resp.status_code == status.HTTP_200_OK
    assert patch_resp.data['title'] == 'Revised Weekly Mock Test'

    # 5. Send notification
    send_resp = client.post(
        f'/v1/library/notifications/{notif_id}/send',
        {},
        format='json',
        HTTP_IDEMPOTENCY_KEY=str(uuid.uuid4()),
        **library_auth_header,
    )
    assert send_resp.status_code == status.HTTP_202_ACCEPTED
    assert send_resp.data['status'] == 'sent'
    assert send_resp.data['stats']['recipients_count'] >= 1

    # Verify recipient received it in StudentNotification inbox
    student_notifs = StudentNotification.objects.filter(student__user=student_user)
    assert student_notifs.exists()
    assert student_notifs.first().title == 'Revised Weekly Mock Test'

    # 6. Test pause & resume on another notification
    notif2_resp = client.post(
        '/v1/library/notifications',
        {
            'action': 'schedule',
            'title': 'Daily Morning Meditation',
            'body': 'Starts at 6:30 AM',
            'frequency': 'daily',
            'audience': {},
        },
        format='json',
        **library_auth_header,
    )
    n2_id = notif2_resp.data['id']

    pause_resp = client.post(f'/v1/library/notifications/{n2_id}/pause', {}, **library_auth_header)
    assert pause_resp.status_code == status.HTTP_200_OK
    assert pause_resp.data['status'] == 'paused'

    resume_resp = client.post(f'/v1/library/notifications/{n2_id}/resume', {}, **library_auth_header)
    assert resume_resp.status_code == status.HTTP_200_OK

    cancel_resp = client.post(f'/v1/library/notifications/{n2_id}/cancel', {'reason': 'Cancelled by manager'}, format='json', **library_auth_header)
    assert cancel_resp.status_code == status.HTTP_200_OK
    assert cancel_resp.data['status'] == 'cancelled'

    # 7. List notifications & KPIs
    list_resp = client.get('/v1/library/notifications?tab=sent', **library_auth_header)
    assert list_resp.status_code == status.HTTP_200_OK
    assert len(list_resp.data['data']) >= 1

    kpis_resp = client.get('/v1/library/notifications/kpis', **library_auth_header)
    assert kpis_resp.status_code == status.HTTP_200_OK
    assert kpis_resp.data['sent_this_month'] >= 1


# ============================================================================
# 2. Section 8.4 Student Notifications & Dialogs
# ============================================================================

@pytest.mark.django_db
def test_student_notifications_and_dialogs_flow(client, library_tenant, student_user, student_auth_header):
    """Test student reading notifications, unread count, seen, click, dismiss, and dialogs pending."""
    student = student_user.student_profile

    # Create two notifications for student: one normal dialog, one urgent dialog
    n_normal = StudentNotification.objects.create(
        student=student,
        library=library_tenant,
        title='Welcome to Saraswati Library',
        body='Your enrollment is confirmed.',
        show_on_screen=True,
        dialog_layout='text_only',
        priority='Normal',
        max_shows=3,
        show_count=0,
    )
    n_urgent = StudentNotification.objects.create(
        student=student,
        library=library_tenant,
        title='Urgent Fire Drill',
        body='Please assemble at gate 2.',
        show_on_screen=True,
        dialog_layout='text_only',
        priority='Urgent',
        max_shows=3,
        show_count=0,
    )

    # 1. Unread count
    cnt_resp = client.get('/v1/student/notifications/unread-count', **student_auth_header)
    assert cnt_resp.status_code == status.HTTP_200_OK
    assert cnt_resp.data['count'] == 2

    # 2. List notifications
    list_resp = client.get('/v1/student/notifications', **student_auth_header)
    assert list_resp.status_code == status.HTTP_200_OK
    assert len(list_resp.data['data']) == 2

    # 3. Seen single notification
    seen_resp = client.post(f'/v1/student/notifications/{n_normal.id}/seen', **student_auth_header)
    assert seen_resp.status_code == status.HTTP_204_NO_CONTENT
    n_normal.refresh_from_db()
    assert n_normal.is_read is True

    # 4. Clicked notification
    click_resp = client.post(f'/v1/student/notifications/{n_normal.id}/clicked', **student_auth_header)
    assert click_resp.status_code == status.HTTP_204_NO_CONTENT
    n_normal.refresh_from_db()
    assert n_normal.clicked_at is not None

    # 5. Pending dialogs when NOT in study session -> both return, urgent first
    dialogs_resp = client.get('/v1/student/dialogs/pending', **student_auth_header)
    assert dialogs_resp.status_code == status.HTTP_200_OK
    assert len(dialogs_resp.data) == 2
    assert dialogs_resp.data[0]['id'] == str(n_urgent.id)

    # 6. Pending dialogs when IN study session -> only urgent dialog passes
    in_study_resp = client.get('/v1/student/dialogs/pending?in_study_session=true', **student_auth_header)
    assert in_study_resp.status_code == status.HTTP_200_OK
    assert len(in_study_resp.data) == 1
    assert in_study_resp.data[0]['id'] == str(n_urgent.id)

    # 7. Dialog shown increment
    shown_resp = client.post(f'/v1/student/dialogs/{n_urgent.id}/shown', **student_auth_header)
    assert shown_resp.status_code == status.HTTP_204_NO_CONTENT
    n_urgent.refresh_from_db()
    assert n_urgent.show_count == 1

    # 8. Dismiss dialog
    dismiss_resp = client.post(f'/v1/student/notifications/{n_urgent.id}/dismissed', **student_auth_header)
    assert dismiss_resp.status_code == status.HTTP_204_NO_CONTENT
    n_urgent.refresh_from_db()
    assert n_urgent.dismissed_at is not None

    # After dismissing, it should not appear in pending dialogs
    pending_after = client.get('/v1/student/dialogs/pending', **student_auth_header)
    assert len(pending_after.data) == 1

    # 9. Seen-all
    all_seen_resp = client.post('/v1/student/notifications/seen-all', **student_auth_header)
    assert all_seen_resp.status_code == status.HTTP_204_NO_CONTENT
    assert StudentNotification.objects.filter(student=student, is_read=False).count() == 0


# ============================================================================
# 3. Section 15.2 Public Page Editor (Library Admin Panel)
# ============================================================================

@pytest.mark.django_db
def test_library_public_page_editor(client, library_tenant, library_auth_header):
    """Test public page status, completeness, sections update, facilities, banners, gallery, achievers, notices CRUD, publish & unpublish."""
    # 1. Get page info
    page_resp = client.get('/v1/library/page', **library_auth_header)
    assert page_resp.status_code == status.HTTP_200_OK
    assert 'completeness' in page_resp.data
    assert 'sections' in page_resp.data

    # 2. Update sections
    sections_payload = [
        {'section_key': 'about', 'is_visible': True, 'sort_order': 1},
        {'section_key': 'facilities', 'is_visible': True, 'sort_order': 2},
        {'section_key': 'reviews', 'is_visible': False, 'sort_order': 3},
    ]
    sec_resp = client.put('/v1/library/page/sections', {'sections': sections_payload}, format='json', **library_auth_header)
    assert sec_resp.status_code == status.HTTP_200_OK
    assert len(sec_resp.data) == 3

    # 3. Facilities CRUD
    fac_resp = client.post(
        '/v1/library/page/facilities',
        {'name': 'Gigabit Fiber Wi-Fi', 'icon_key': 'wifi', 'description': '500 Mbps redundant link'},
        format='json',
        **library_auth_header,
    )
    assert fac_resp.status_code == status.HTTP_201_CREATED
    fac_id = fac_resp.data['id']

    patch_fac = client.patch(f'/v1/library/page/facilities/{fac_id}', {'description': '1 Gbps Ultra Wi-Fi'}, format='json', **library_auth_header)
    assert patch_fac.status_code == status.HTTP_200_OK
    assert patch_fac.data['description'] == '1 Gbps Ultra Wi-Fi'

    # 4. Banners CRUD
    ban_resp = client.post(
        '/v1/library/page/banners',
        {'title': 'Diwali Offer 20% Off', 'image_url': 'https://img.cdn/diwali.png', 'sort_order': 1},
        format='json',
        **library_auth_header,
    )
    assert ban_resp.status_code == status.HTTP_201_CREATED
    ban_id = ban_resp.data['id']

    # 5. Gallery CRUD
    gal_resp = client.post(
        '/v1/library/page/gallery',
        {'media_type': 'image', 'url': 'https://img.cdn/reading-hall.jpg', 'caption': 'Silent Study Hall'},
        format='json',
        **library_auth_header,
    )
    assert gal_resp.status_code == status.HTTP_201_CREATED
    gal_id = gal_resp.data['id']

    # 6. Achievers CRUD
    ach_resp = client.post(
        '/v1/library/page/achievers',
        {'name': 'Pooja Mehta', 'achievement': 'AIR 45 UPSC CSE', 'year': 2024, 'is_featured': True},
        format='json',
        **library_auth_header,
    )
    assert ach_resp.status_code == status.HTTP_201_CREATED
    ach_id = ach_resp.data['id']

    # 7. Notices CRUD
    not_resp = client.post(
        '/v1/library/page/notices',
        {'title': 'Holiday on Makar Sankranti', 'body': 'Library closed on 14th Jan.', 'visible_to': 'public'},
        format='json',
        **library_auth_header,
    )
    assert not_resp.status_code == status.HTTP_201_CREATED
    not_id = not_resp.data['id']

    # 8. Preview token
    prev_tok_resp = client.post('/v1/library/page/preview-token', {}, **library_auth_header)
    assert prev_tok_resp.status_code == status.HTTP_200_OK
    assert 'token' in prev_tok_resp.data

    # 9. Publish & unpublish
    pub_resp = client.post('/v1/library/page/publish', {}, **library_auth_header)
    assert pub_resp.status_code == status.HTTP_200_OK
    assert 'published_at' in pub_resp.data

    unpub_resp = client.post('/v1/library/page/unpublish', {}, **library_auth_header)
    assert unpub_resp.status_code == status.HTTP_204_NO_CONTENT

    # Cleanups via DELETE
    assert client.delete(f'/v1/library/page/facilities/{fac_id}', **library_auth_header).status_code == status.HTTP_204_NO_CONTENT
    assert client.delete(f'/v1/library/page/banners/{ban_id}', **library_auth_header).status_code == status.HTTP_204_NO_CONTENT
    assert client.delete(f'/v1/library/page/gallery/{gal_id}', **library_auth_header).status_code == status.HTTP_204_NO_CONTENT
    assert client.delete(f'/v1/library/page/achievers/{ach_id}', **library_auth_header).status_code == status.HTTP_204_NO_CONTENT
    assert client.delete(f'/v1/library/page/notices/{not_id}', **library_auth_header).status_code == status.HTTP_204_NO_CONTENT


# ============================================================================
# 4. Section 15.3 Email Connections, Templates, Log & Usage
# ============================================================================

@pytest.mark.django_db
def test_library_email_management(client, library_tenant, library_auth_header):
    """Test SMTP connection setup, OAuth connect start, sending mode toggle, templates customization, and email logs."""
    # 1. Start OAuth connect
    start_resp = client.post(
        '/v1/library/email/connect/start',
        {'provider': 'google', 'return_url': 'https://app.shelfspace.in/settings/email'},
        format='json',
        **library_auth_header,
    )
    assert start_resp.status_code == status.HTTP_200_OK
    assert 'authorize_url' in start_resp.data

    # 2. Configure SMTP Connection
    smtp_resp = client.post(
        '/v1/library/email/connections/smtp',
        {
            'email_address': 'notifications@saraswatihub.com',
            'display_name': 'Saraswati Hub Desk',
            'smtp_host': 'smtp.sendgrid.net',
            'smtp_port': 587,
            'smtp_security': 'tls',
            'smtp_username': 'apikey',
            'smtp_password': 'SG.secret_key_123',
            'is_primary': True,
        },
        format='json',
        **library_auth_header,
    )
    assert smtp_resp.status_code == status.HTTP_201_CREATED
    conn_id = smtp_resp.data['id']

    # 3. List connections
    list_resp = client.get('/v1/library/email/connections', **library_auth_header)
    assert list_resp.status_code == status.HTTP_200_OK
    assert len(list_resp.data['connections']) == 1

    # 4. Test connection
    test_resp = client.post(f'/v1/library/email/connections/{conn_id}/test', {'to': 'test@saraswatihub.com'}, format='json', **library_auth_header)
    assert test_resp.status_code == status.HTTP_200_OK
    assert test_resp.data['sent'] is True

    # 5. Sending mode
    mode_resp = client.put(
        '/v1/library/email/sending-mode',
        {'mode': 'smtp', 'fallback_to_platform': True},
        format='json',
        **library_auth_header,
    )
    assert mode_resp.status_code == status.HTTP_200_OK
    assert mode_resp.data['mode'] == 'smtp'

    # 6. Templates list & customize
    tpl_list = client.get('/v1/library/email/templates', **library_auth_header)
    assert tpl_list.status_code == status.HTTP_200_OK
    assert any(t['code'] == 'receipt' for t in tpl_list.data)

    tpl_put = client.put(
        '/v1/library/email/templates/receipt',
        {
            'translations': {
                'en': {'subject': 'Payment Receipt - {library_name}', 'body': 'Dear {name}, received {amount}. Thank you!'},
            }
        },
        format='json',
        **library_auth_header,
    )
    assert tpl_put.status_code == status.HTTP_200_OK
    assert tpl_put.data['is_custom'] is True

    # 7. Template preview
    prev_resp = client.post(
        '/v1/library/email/templates/receipt/preview',
        {'language': 'en', 'sample': {'name': 'Rohan', 'amount': '₹1800'}},
        format='json',
        **library_auth_header,
    )
    assert prev_resp.status_code == status.HTTP_200_OK
    assert 'Payment Receipt - Saraswati Knowledge Hub' in prev_resp.data['subject']
    assert 'Dear Rohan, received ₹1800' in prev_resp.data['html']

    # 8. Usage stats
    usage_resp = client.get('/v1/library/email/usage', **library_auth_header)
    assert usage_resp.status_code == status.HTTP_200_OK
    assert 'daily_limit' in usage_resp.data
    assert 'series' in usage_resp.data


# ============================================================================
# 5. Section 6 Public APIs (Gallery, FAQs, Notices)
# ============================================================================

@pytest.mark.django_db
def test_public_page_gallery_faqs_notices(client, library_tenant):
    """Test public website visitors retrieving gallery, faqs, and notices."""
    from django.utils.text import slugify
    slug = slugify(library_tenant.name)

    # Populate sample public records
    LibraryGalleryItem.objects.create(
        library=library_tenant,
        media_type='image',
        url='https://img.cdn/reading.jpg',
        caption='AC Silent Zone',
        is_active=True,
    )
    LibraryFaq.objects.create(
        library=library_tenant,
        question='What are library timings?',
        answer='Open 24/7 with biometric access.',
        is_active=True,
    )
    LibraryNotice.objects.create(
        library=library_tenant,
        title='Power Maintenance Notice',
        body='Generators will be active from 2 PM to 4 PM.',
        visible_to='public',
        is_active=True,
    )

    # 1. Gallery
    gal_resp = client.get(f'/v1/public/libraries/{slug}/gallery')
    assert gal_resp.status_code == status.HTTP_200_OK
    assert len(gal_resp.data['data']) >= 1

    # 2. FAQs
    faq_resp = client.get(f'/v1/public/libraries/{slug}/faqs')
    assert faq_resp.status_code == status.HTTP_200_OK
    assert len(faq_resp.data) >= 1
    assert faq_resp.data[0]['question'] == 'What are library timings?'

    # 3. Notices
    not_resp = client.get(f'/v1/public/libraries/{slug}/notices')
    assert not_resp.status_code == status.HTTP_200_OK
    assert len(not_resp.data['data']) >= 1
    assert not_resp.data['data'][0]['title'] == 'Power Maintenance Notice'
