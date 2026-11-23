"""Automated tests for library and platform notification broadcast endpoints."""
from datetime import timedelta
import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.libraries.models import Library
from apps.notifications.models import NotificationBroadcast
from apps.students.models import Student


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def notif_setup(db):
    super_admin = User.objects.create_superuser(
        email='admin@example.com',
        password='StrongPass123',
        first_name='Super',
        last_name='Admin',
    )
    owner = User.objects.create_user(
        email='owner@example.com',
        password='StrongPass123',
        first_name='Lib',
        last_name='Owner',
        role='LIBRARY_OWNER',
        email_verified=True,
    )
    library = Library.objects.create(
        code='LIB-NTF-1',
        name='Scholar Hub',
        owner=owner,
        city='Jaipur',
        state='Rajasthan',
        address='5 MI Road',
        phone='9988776655',
    )
    owner.library = library
    owner.save(update_fields=['library'])

    Student.objects.create(
        library=library,
        name='Neha Verma',
        email='neha@example.com',
        phone='9000000001',
        gender='Female',
        status='Live',
    )
    Student.objects.create(
        library=library,
        name='Kabir Rao',
        email='kabir@example.com',
        phone='9000000002',
        gender='Male',
        status='Expired',
    )
    return super_admin, owner, library


@pytest.mark.django_db
def test_notification_crud_send_and_platform_list(api_client, notif_setup):
    super_admin, owner, library = notif_setup
    api_client.force_authenticate(user=owner)

    create_res = api_client.post(
        '/api/v1/library/notifications/',
        {
            'title': 'Holiday Notice',
            'subtitle': 'Diwali Schedule',
            'body': 'Library remains open 8 AM - 2 PM.',
            'audience': 'Live Members Only',
            'channels': ['Push', 'In-App'],
            'display_mode': 'Banner',
            'priority': 'High',
        },
        format='json',
    )
    assert create_res.status_code == 201
    notif_id = create_res.data['id']

    send_res = api_client.post(
        f'/api/v1/library/notifications/{notif_id}/send/',
        {},
        format='json',
    )
    assert send_res.status_code == 200
    assert send_res.data['data']['status'] == 'Sent'
    assert send_res.data['data']['recipients_count'] == 1
    assert send_res.data['data']['delivered_count'] == 1

    # Sent notification cannot be deleted
    del_sent = api_client.delete(f'/api/v1/library/notifications/{notif_id}/')
    assert del_sent.status_code == 400

    # Schedule another draft
    draft_res = api_client.post(
        '/api/v1/library/notifications/',
        {
            'title': 'Fee Reminder',
            'body': 'Please renew on time.',
            'audience': 'All Students',
            'channels': ['Email'],
        },
        format='json',
    )
    draft_id = draft_res.data['id']
    sched_res = api_client.post(
        f'/api/v1/library/notifications/{draft_id}/send/',
        {'scheduled_at': (timezone.now() + timedelta(days=1)).isoformat()},
        format='json',
    )
    assert sched_res.status_code == 200
    assert sched_res.data['data']['status'] == 'Scheduled'

    # Platform admin sees all notifications across libraries
    api_client.force_authenticate(user=super_admin)
    plat_res = api_client.get('/api/v1/platform/notifications/')
    assert plat_res.status_code == 200
    assert plat_res.data['count'] == 2
    assert NotificationBroadcast.objects.filter(library=library).count() == 2
