"""Automated tests for seats and attendance endpoints."""
import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.libraries.models import Branch, Library
from apps.seats.models import AttendanceRecord, Seat, SeatAllocationHistory
from apps.students.models import Student


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def seat_setup(db):
    owner = User.objects.create_user(
        email='seatowner@example.com',
        password='StrongPass123',
        first_name='Seat',
        last_name='Owner',
        role='LIBRARY_OWNER',
        email_verified=True,
    )
    library = Library.objects.create(
        code='LIB-SEAT',
        name='Seat Library',
        owner=owner,
        city='Pune',
        state='Maharashtra',
        address='45 FC Road',
        phone='8888888888',
    )
    owner.library = library
    owner.save(update_fields=['library'])
    branch = Branch.objects.create(
        library=library,
        name='Main Hall',
        address='45 FC Road',
        phone='8888888888',
        is_main=True,
    )
    student = Student.objects.create(
        library=library,
        branch=branch,
        name='Karan Mehta',
        email='karan@example.com',
        phone='9888877777',
        gender='Male',
        status='Live',
    )
    seat = Seat.objects.create(branch=branch, label='A-01', floor=1, type='Desk')
    return owner, library, branch, student, seat


@pytest.mark.django_db
def test_seat_assign_release_and_templates(api_client, seat_setup):
    owner, library, branch, student, seat = seat_setup
    api_client.force_authenticate(user=owner)

    assign_res = api_client.post(
        f'/api/v1/library/seats/{seat.id}/assign/',
        {'student_id': str(student.id), 'reason': 'Monthly plan'},
        format='json',
    )
    assert assign_res.status_code == 200
    seat.refresh_from_db()
    assert seat.student_id == student.id
    assert SeatAllocationHistory.objects.filter(seat=seat, released_at__isnull=True).count() == 1

    release_res = api_client.post(
        f'/api/v1/library/seats/{seat.id}/release/',
        {'reason': 'Plan ended'},
        format='json',
    )
    assert release_res.status_code == 200
    seat.refresh_from_db()
    assert seat.student_id is None
    assert SeatAllocationHistory.objects.filter(seat=seat, released_at__isnull=False).count() == 1

    tpl_res = api_client.get('/api/v1/library/seats/templates/')
    assert tpl_res.status_code == 200
    assert len(tpl_res.data['data']) >= 1


@pytest.mark.django_db
def test_attendance_checkin_live_checkout_and_leaderboard(api_client, seat_setup):
    owner, library, branch, student, seat = seat_setup
    api_client.force_authenticate(user=owner)

    in_res = api_client.post(
        '/api/v1/library/attendance/check-in/',
        {'qr_card_id': student.qr_card_id, 'seat_id': str(seat.id), 'method': 'QR Scan'},
        format='json',
    )
    assert in_res.status_code == 201

    live_res = api_client.get('/api/v1/library/attendance/live/')
    assert live_res.status_code == 200
    assert len(live_res.data['data']) == 1

    out_res = api_client.post(
        '/api/v1/library/attendance/check-out/',
        {'student_id': str(student.id)},
        format='json',
    )
    assert out_res.status_code == 200
    assert AttendanceRecord.objects.filter(student=student, time_out__isnull=False).count() == 1

    lb_res = api_client.get('/api/v1/library/attendance/study-hours/leaderboard/')
    assert lb_res.status_code == 200
    assert len(lb_res.data['data']) == 1


@pytest.mark.django_db
def test_attendance_auto_checkout(api_client, seat_setup):
    owner, library, branch, student, seat = seat_setup
    api_client.force_authenticate(user=owner)

    api_client.post(
        '/api/v1/library/attendance/check-in/',
        {'student_id': str(student.id)},
        format='json',
    )
    auto_res = api_client.post('/api/v1/library/attendance/auto-checkout/')
    assert auto_res.status_code == 200
    assert auto_res.data['data']['closed_count'] == 1
