"""Phase 3 Parity Test Suite: Physical Space Management & Smart Operations.
Covers Sections 12 (Seats & Lockers), 13 (Attendance & Study), and 8.6 - 8.8 (Student Space & Study).
"""
import uuid
from decimal import Decimal
import pytest
from django.utils import timezone
from rest_framework import status

from apps.accounts.models import User
from apps.libraries.models import Library, Branch
from apps.students.models import Student
from apps.seats.models import (
    Floor, FloorRow, SeatCategory, Shift, Seat, SeatAllocation,
    SeatReservation, SeatWaitingList, SeatChangeRequest, Locker,
    AttendanceQRCode, AttendanceRecord, ScanAttempt, Holiday, StudySession
)
from apps.core.jwt import generate_access_token, AUDIENCE_LIBRARY, AUDIENCE_STUDENT
from rest_framework.test import APIClient


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def library_tenant(db):
    owner = User.objects.create_user(
        email='owner.phase3@library.com',
        password='Password123!',
        first_name='Vikram',
        last_name='Sarabhai',
        role='LIBRARY_OWNER',
        phone='9876543322',
    )
    lib = Library.objects.create(
        code='LIB-P3-01',
        name='Space Operations Learning Hub',
        owner=owner,
        city='Bengaluru',
        state='Karnataka',
        address='Indiranagar 100ft Rd',
        phone='9876543322',
        plan_status='Active',
        library_status='Active',
    )
    Branch.objects.create(
        library=lib,
        name='Indiranagar Main',
        address='Indiranagar 100ft Rd',
        phone='9876543322',
        is_main=True,
    )
    owner.library = lib
    owner.save(update_fields=['library'])
    return lib


@pytest.fixture
def library_token(library_tenant):
    owner = library_tenant.owner
    return generate_access_token(
        user_id=owner.id,
        audience=AUDIENCE_LIBRARY,
        extra_claims={
            'org_id': str(library_tenant.id),
            'member_id': str(owner.id),
            'role': 'owner',
            'branch_ids': 'all',
            'perm_ver': 1,
        }
    )


@pytest.fixture
def male_student(library_tenant):
    branch = library_tenant.branches.first()
    u = User.objects.create_user(
        email='student.male@example.com',
        password='Password123!',
        first_name='Rohan',
        last_name='Mehra',
        role='LIBRARY_OWNER',
        phone='9811223344',
    )
    return Student.objects.create(
        library=library_tenant,
        branch=branch,
        user=u,
        name='Rohan Mehra',
        email='student.male@example.com',
        phone='9811223344',
        gender='Male',
        status='Live',
    )


@pytest.fixture
def male_student_token(library_tenant, male_student):
    return generate_access_token(
        user_id=male_student.user.id,
        audience=AUDIENCE_STUDENT,
        extra_claims={
            'student_id': str(male_student.id),
            'library_id': str(library_tenant.id),
            'branch_id': str(male_student.branch.id),
            'enrollment_id': str(male_student.id),
        }
    )


@pytest.fixture
def female_student(library_tenant):
    branch = library_tenant.branches.first()
    u = User.objects.create_user(
        email='student.female@example.com',
        password='Password123!',
        first_name='Priya',
        last_name='Sharma',
        role='LIBRARY_OWNER',
        phone='9822334455',
    )
    return Student.objects.create(
        library=library_tenant,
        branch=branch,
        user=u,
        name='Priya Sharma',
        email='student.female@example.com',
        phone='9822334455',
        gender='Female',
        status='Live',
    )


@pytest.mark.django_db
class TestPhase3SeatsAndLayouts:
    """Covers Section 12.1 and 12.2 Floor Canvas, Optimistic Concurrency, and Seats."""

    def test_floor_layout_optimistic_concurrency(self, client, library_tenant, library_token):
        branch = library_tenant.branches.first()
        auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {library_token}'}

        # 1. Create Floor
        res = client.post(
            '/v1/library/floors',
            {'branch_id': str(branch.id), 'name': 'First Floor', 'sort_order': 1},
            format='json',
            **auth_headers
        )
        assert res.status_code == status.HTTP_201_CREATED
        floor_id = res.data['id']
        assert res.data['version'] == 1

        # 2. Update Layout with matching If-Match header
        layout_payload = {
            'seats': [{'id': str(uuid.uuid4()), 'layout': {'x': 100, 'y': 200, 'w': 40, 'h': 40}}],
            'elements': [{'type': 'wall', 'x': 0, 'y': 0, 'w': 500, 'h': 10}],
        }
        res_update = client.put(
            f'/v1/library/floors/{floor_id}/layout',
            layout_payload,
            format='json',
            HTTP_IF_MATCH='1',
            **auth_headers
        )
        assert res_update.status_code == status.HTTP_200_OK
        assert res_update.data['version'] == 2

        # 3. Conflict on stale If-Match version
        res_conflict = client.put(
            f'/v1/library/floors/{floor_id}/layout',
            layout_payload,
            format='json',
            HTTP_IF_MATCH='1',  # Stale, current is 2
            **auth_headers
        )
        assert res_conflict.status_code == status.HTTP_409_CONFLICT
        assert res_conflict.data['error']['code'] == 'version_conflict'

    def test_seats_bulk_block_unblock_and_restrictions(self, client, library_tenant, library_token, male_student):
        branch = library_tenant.branches.first()
        auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {library_token}'}

        floor = Floor.objects.create(branch=branch, name='Reading Hall', sort_order=1)
        row = FloorRow.objects.create(floor=floor, label='Row A')
        girls_category = SeatCategory.objects.create(
            library=library_tenant,
            code='GIRLS_ONLY',
            name='Girls Only',
            allowed_gender='female',
        )

        # 1. Bulk preview and create
        preview_res = client.post(
            '/v1/library/seats/bulk',
            {
                'floor_id': str(floor.id),
                'row_id': str(row.id),
                'prefix': 'S-',
                'from_number': 1,
                'to_number': 5,
                'category_id': str(girls_category.id),
                'preview': True,
            },
            format='json',
            **auth_headers
        )
        assert preview_res.status_code == status.HTTP_200_OK
        assert len(preview_res.data['planned']) == 5

        create_res = client.post(
            '/v1/library/seats/bulk',
            {
                'floor_id': str(floor.id),
                'row_id': str(row.id),
                'prefix': 'S-',
                'from_number': 1,
                'to_number': 5,
                'category_id': str(girls_category.id),
            },
            format='json',
            **auth_headers
        )
        assert create_res.status_code == status.HTTP_201_CREATED
        assert len(create_res.data['created']) == 5
        seat_id = create_res.data['created'][0]['id']

        # 2. Block and Unblock seat
        block_res = client.post(
            f'/v1/library/seats/{seat_id}/block',
            {'reason': 'Broken electrical socket'},
            format='json',
            **auth_headers
        )
        assert block_res.status_code == status.HTTP_200_OK
        assert block_res.data['physical_status'] == 'maintenance'

        unblock_res = client.post(
            f'/v1/library/seats/{seat_id}/unblock',
            {},
            format='json',
            **auth_headers
        )
        assert unblock_res.status_code == status.HTTP_200_OK
        assert unblock_res.data['physical_status'] == 'available'

        # 3. Gender restriction validation
        shift = Shift.objects.create(
            library=library_tenant,
            branch=branch,
            name='Morning Shift',
            start_minute=360,
            end_minute=720,
        )
        alloc_res = client.post(
            '/v1/library/seat-allocations',
            {
                'enrollment_id': str(male_student.id),
                'seat_id': str(seat_id),
                'shift_id': str(shift.id),
                'from_date': str(timezone.now().date()),
            },
            format='json',
            **auth_headers
        )
        assert alloc_res.status_code == status.HTTP_409_CONFLICT
        assert alloc_res.data['error']['code'] == 'seat_gender_mismatch'


@pytest.mark.django_db
class TestPhase3ReservationsAndLockers:
    """Covers Section 12.3 and 12.4 Reservations, Conversion, and Lockers."""

    def test_seat_reservation_and_conversion_to_allocation(self, client, library_tenant, library_token, male_student):
        branch = library_tenant.branches.first()
        auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {library_token}'}

        floor = Floor.objects.create(branch=branch, name='Quiet Zone')
        seat = Seat.objects.create(branch=branch, floor_rel=floor, label='Q-101', physical_status='available')
        shift = Shift.objects.create(library=library_tenant, branch=branch, name='Evening Shift')

        # 1. Create reservation
        res = client.post(
            '/v1/library/seat-reservations',
            {
                'seat_id': str(seat.id),
                'reserved_for': 'Prospective Aspirant',
                'reserved_until': str(timezone.now() + timezone.timedelta(days=2)),
            },
            format='json',
            **auth_headers
        )
        assert res.status_code == status.HTTP_201_CREATED
        res_id = res.data['id']

        # 2. Convert reservation to allocation
        conv_res = client.post(
            f'/v1/library/seat-reservations/{res_id}/convert',
            {'enrollment_id': str(male_student.id)},
            format='json',
            **auth_headers
        )
        assert conv_res.status_code == status.HTTP_201_CREATED
        assert str(conv_res.data['seat_id']) == str(seat.id)
        assert str(conv_res.data['student_id']) == str(male_student.id)

        # Seat reservation is now converted
        reservation = SeatReservation.objects.get(pk=res_id)
        assert reservation.status == 'converted'

    def test_locker_management(self, client, library_tenant, library_token, male_student):
        branch = library_tenant.branches.first()
        auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {library_token}'}

        # 1. Create locker
        create_res = client.post(
            '/v1/library/lockers',
            {'branch_id': str(branch.id), 'number': 'L-42'},
            format='json',
            **auth_headers
        )
        assert create_res.status_code == status.HTTP_201_CREATED
        locker_id = create_res.data[0]['id']

        # 2. Assign locker
        assign_res = client.post(
            f'/v1/library/lockers/{locker_id}/assign',
            {'enrollment_id': str(male_student.id), 'from_date': str(timezone.now().date())},
            format='json',
            **auth_headers
        )
        assert assign_res.status_code == status.HTTP_200_OK
        assert assign_res.data['status'] == 'occupied'

        # 3. Release locker
        rel_res = client.post(
            f'/v1/library/lockers/{locker_id}/release',
            {'reason': 'Course finished'},
            format='json',
            **auth_headers
        )
        assert rel_res.status_code == status.HTTP_200_OK
        assert rel_res.data['status'] == 'available'


@pytest.mark.django_db
class TestPhase3AttendanceInsightsAndBulkReview:
    """Covers Section 13.2, 13.4 Attendance Insights and Bulk Scan Reviews."""

    def test_attendance_insights_and_bulk_review(self, client, library_tenant, library_token, male_student):
        branch = library_tenant.branches.first()
        auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {library_token}'}

        # Create attendance records for insights
        today = timezone.now().date()
        AttendanceRecord.objects.create(
            student=male_student,
            branch=branch,
            date=today,
            time_in=timezone.now(),
            status='Present',
        )

        # 1. Check Attendance Insights
        insights_res = client.get('/v1/library/attendance/insights', **auth_headers)
        assert insights_res.status_code == status.HTTP_200_OK
        assert 'best_students' in insights_res.data
        assert 'chronic_absentees' in insights_res.data
        assert 'weekday_trend' in insights_res.data

        # 2. Bulk review scan attempts
        qr = AttendanceQRCode.objects.create(
            library=library_tenant,
            branch=branch,
            token=uuid.uuid4(),
            expires_at=timezone.now() + timezone.timedelta(days=1),
        )
        scan1 = ScanAttempt.objects.create(
            library=library_tenant,
            student=male_student,
            qr_code=qr,
            latitude=Decimal('12.971600'),
            longitude=Decimal('77.594600'),
            device_id='dev-bulk-1',
            result='flagged',
            reason='Outside radius',
        )
        scan2 = ScanAttempt.objects.create(
            library=library_tenant,
            student=male_student,
            qr_code=qr,
            latitude=Decimal('12.971600'),
            longitude=Decimal('77.594600'),
            device_id='dev-bulk-2',
            result='flagged',
            reason='Manual check',
        )

        bulk_res = client.post(
            '/v1/library/scan-attempts/bulk-review',
            {'ids': [str(scan1.id), str(scan2.id)], 'decision': 'accepted'},
            format='json',
            **auth_headers
        )
        assert bulk_res.status_code == status.HTTP_200_OK
        assert bulk_res.data['updated'] == 2

        # 3. Scan attempt detail
        detail_res = client.get(f'/v1/library/scan-attempts/{scan1.id}', **auth_headers)
        assert detail_res.status_code == status.HTTP_200_OK
        assert 'scan' in detail_res.data
        assert 'device' in detail_res.data
        assert 'map' in detail_res.data


@pytest.mark.django_db
class TestPhase3StudentSpaceAndStudySessions:
    """Covers Section 8.6, 8.7, and 8.8 Student Seat, Attendance, and Study APIs."""

    def test_student_seat_and_change_requests(self, client, library_tenant, male_student, male_student_token):
        branch = library_tenant.branches.first()
        student_headers = {'HTTP_AUTHORIZATION': f'Bearer {male_student_token}'}

        floor = Floor.objects.create(branch=branch, name='Main Floor')
        seat = Seat.objects.create(branch=branch, floor_rel=floor, label='S-10', physical_status='occupied')
        shift = Shift.objects.create(library=library_tenant, branch=branch, name='Full Day')
        SeatAllocation.objects.create(
            seat=seat,
            student=male_student,
            shift=shift,
            from_date=timezone.now().date(),
        )

        # 1. GET /v1/student/seat
        seat_res = client.get('/v1/student/seat', **student_headers)
        assert seat_res.status_code == status.HTTP_200_OK
        assert seat_res.data['seat']['label'] == 'S-10'
        assert seat_res.data['shift']['name'] == 'Full Day'

        # 2. POST /v1/student/seat-change-requests
        target_seat = Seat.objects.create(branch=branch, floor_rel=floor, label='S-11')
        req_res = client.post(
            '/v1/student/seat-change-requests',
            {'requested_seat_id': str(target_seat.id), 'reason': 'Closer to AC and charging point'},
            format='json',
            **student_headers
        )
        assert req_res.status_code == status.HTTP_201_CREATED
        req_id = req_res.data['id']

        # 3. GET /v1/student/seat-change-requests
        list_res = client.get('/v1/student/seat-change-requests', **student_headers)
        assert list_res.status_code == status.HTTP_200_OK
        assert len(list_res.data) >= 1
        assert list_res.data[0]['id'] == req_id

        # 4. DELETE /v1/student/seat-change-requests/{id}
        del_res = client.delete(f'/v1/student/seat-change-requests/{req_id}', **student_headers)
        assert del_res.status_code == status.HTTP_204_NO_CONTENT

        # 5. GET /v1/student/holidays
        Holiday.objects.create(
            library=library_tenant,
            branch=branch,
            holiday_date=timezone.now().date(),
            title='Independence Day',
        )
        holidays_res = client.get('/v1/student/holidays', **student_headers)
        assert holidays_res.status_code == status.HTTP_200_OK
        assert any(h['title'] == 'Independence Day' for h in holidays_res.data)

    def test_student_study_breaks_goals_and_visibility(self, client, library_tenant, male_student, male_student_token):
        branch = library_tenant.branches.first()
        student_headers = {'HTTP_AUTHORIZATION': f'Bearer {male_student_token}'}

        # Must be checked in today to study
        AttendanceRecord.objects.create(
            student=male_student,
            branch=branch,
            date=timezone.now().date(),
            time_in=timezone.now(),
            status='Present',
        )

        # 1. Start Study Session
        start_res = client.post(
            '/v1/student/study/sessions',
            {'subject_tag': 'Physics - Mechanics'},
            format='json',
            **student_headers
        )
        assert start_res.status_code == status.HTTP_201_CREATED
        session_id = start_res.data['id']
        assert start_res.data['status'] == 'running'

        # 2. Take a Break
        break_res = client.post(
            f'/v1/student/study/sessions/{session_id}/breaks',
            {'break_type': 'tea'},
            format='json',
            **student_headers
        )
        assert break_res.status_code == status.HTTP_200_OK
        assert break_res.data['status'] == 'paused'
        session = StudySession.objects.get(pk=session_id)
        break_id = session.current_break_id

        # 3. End Break
        end_break_res = client.post(
            f'/v1/student/study/sessions/{session_id}/breaks/{break_id}/end',
            {},
            format='json',
            **student_headers
        )
        assert end_break_res.status_code == status.HTTP_200_OK
        assert end_break_res.data['status'] == 'running'

        # 4. Heartbeat
        hb_res = client.post(f'/v1/student/study/sessions/{session_id}/heartbeat', {}, **student_headers)
        assert hb_res.status_code == status.HTTP_204_NO_CONTENT

        # 5. End Study Session
        end_res = client.post(f'/v1/student/study/sessions/{session_id}/end', {}, **student_headers)
        assert end_res.status_code == status.HTTP_200_OK
        assert end_res.data['session']['status'] == 'completed'

        # 6. Study Goals GET & PUT
        goals_get = client.get('/v1/student/study/goals', **student_headers)
        assert goals_get.status_code == status.HTTP_200_OK
        assert 'daily_minutes' in goals_get.data

        goals_put = client.put(
            '/v1/student/study/goals',
            {'daily_minutes': 360, 'weekly_minutes': 2160},
            format='json',
            **student_headers
        )
        assert goals_put.status_code == status.HTTP_200_OK
        assert goals_put.data['daily_minutes'] == 360
        assert goals_put.data['weekly_minutes'] == 2160

        # 7. Leaderboard Visibility PATCH
        vis_res = client.patch(
            '/v1/student/study/leaderboard-visibility',
            {'hidden': True},
            format='json',
            **student_headers
        )
        assert vis_res.status_code == status.HTTP_200_OK
        assert vis_res.data['hidden'] is True
