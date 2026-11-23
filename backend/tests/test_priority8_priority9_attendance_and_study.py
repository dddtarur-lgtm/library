"""Tests for Priority 8 & 9: Attendance QR, Live Register, Scan Decision Flow 19.13, and Study Sessions."""
import uuid
from decimal import Decimal
import pytest
from django.utils import timezone
from rest_framework import status

from apps.accounts.models import User
from apps.libraries.models import Library, Branch
from apps.students.models import Student
from apps.seats.models import (
    AttendanceQRCode, AttendanceRecord, ScanAttempt, Holiday, StudySession
)
from apps.core.jwt import generate_access_token, AUDIENCE_LIBRARY, AUDIENCE_STUDENT


@pytest.fixture
def library_tenant(db):
    owner = User.objects.create_user(
        email='owner.attend@library.com',
        password='Password123!',
        first_name='Manoj',
        last_name='Bajpayee',
        role='LIBRARY_OWNER',
        phone='9876543111',
    )
    lib = Library.objects.create(
        code='LIB-ATT-01',
        name='Gyan Ganga Study Hub',
        owner=owner,
        city='Prayagraj',
        state='Uttar Pradesh',
        address='Civil Lines',
        phone='9876543111',
        plan_status='Active',
        library_status='Active',
    )
    Branch.objects.create(
        library=lib,
        name='Civil Lines Branch',
        address='Civil Lines',
        phone='9876543111',
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
def live_student(library_tenant):
    branch = library_tenant.branches.first()
    user = User.objects.create_user(
        email='student.attend@example.com',
        password='Password123!',
        first_name='Abhishek',
        last_name='Tripathi',
        role='LIBRARY_OWNER',
        phone='9922334455',
    )
    return Student.objects.create(
        library=library_tenant,
        branch=branch,
        user=user,
        name='Abhishek Tripathi',
        email='student.attend@example.com',
        phone='9922334455',
        gender='Male',
        status='Live',
    )


@pytest.fixture
def live_student_token(library_tenant, live_student):
    return generate_access_token(
        user_id=live_student.user.id,
        audience=AUDIENCE_STUDENT,
        extra_claims={
            'org_id': str(library_tenant.id),
            'enrollment_id': str(live_student.id),
            'lang': 'en',
        }
    )


@pytest.mark.django_db
class TestPriority8AttendanceQRAndLiveRegister:
    """Tests covering Section 13 Library Attendance APIs."""

    def test_qr_code_lifecycle_and_test_scan(self, api_client, library_token, library_tenant):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")
        branch = library_tenant.branches.first()

        # POST /v1/library/qr-codes
        create_resp = api_client.post(
            "/v1/library/qr-codes",
            {
                'branch_id': str(branch.id),
                'name': 'Main Gate QR',
                'allowed_radius_m': 100,
                'latitude': "25.435800",
                'longitude': "81.846300",
                'expiry_option': 'month',
            },
            format="json"
        )
        assert create_resp.status_code == status.HTTP_201_CREATED
        qr_data = create_resp.json()["data"]
        qr_id = qr_data["id"]
        qr_token = qr_data["token"]
        assert qr_data["allowed_radius_m"] == 100

        # POST /v1/library/qr-codes/test-scan within radius
        scan_ok = api_client.post(
            "/v1/library/qr-codes/test-scan",
            {
                'qr_token': qr_token,
                'latitude': "25.435820",
                'longitude': "81.846310",
            },
            format="json"
        )
        assert scan_ok.status_code == status.HTTP_200_OK
        assert scan_ok.json()["data"]["would_accept"] is True

        # Test scan far away -> rejected
        scan_far = api_client.post(
            "/v1/library/qr-codes/test-scan",
            {
                'qr_token': qr_token,
                'latitude': "25.500000",
                'longitude': "81.900000",
            },
            format="json"
        )
        assert scan_far.status_code == status.HTTP_200_OK
        assert scan_far.json()["data"]["would_accept"] is False
        assert scan_far.json()["data"]["reason"] == "outside_radius"

        # Regenerate QR code
        regen_resp = api_client.post(f"/v1/library/qr-codes/{qr_id}/regenerate")
        assert regen_resp.status_code == status.HTTP_201_CREATED
        new_token = regen_resp.json()["data"]["token"]
        assert new_token != qr_token

        # Old QR is now disabled
        old_qr = AttendanceQRCode.objects.get(pk=qr_id)
        assert old_qr.status == "disabled"

    def test_manual_attendance_and_live_register(self, api_client, library_token, library_tenant, live_student):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")
        today = timezone.now().date()

        # POST /v1/library/attendance/manual
        man_resp = api_client.post(
            "/v1/library/attendance/manual",
            {
                'enrollment_id': str(live_student.id),
                'date': str(today),
                'status': 'Present',
                'reason': 'QR scanner camera malfunctioned on device',
            },
            format="json"
        )
        assert man_resp.status_code == status.HTTP_201_CREATED
        rec_id = man_resp.json()["data"]["id"]

        # Duplicate manual attendance for same date -> 409
        dup_resp = api_client.post(
            "/v1/library/attendance/manual",
            {
                'enrollment_id': str(live_student.id),
                'date': str(today),
                'reason': 'Forgot to punch in',
            },
            format="json"
        )
        assert dup_resp.status_code == status.HTTP_409_CONFLICT
        assert dup_resp.json()["error"]["code"] == "already_marked"

        # GET /v1/library/attendance/live
        live_resp = api_client.get("/v1/library/attendance/live")
        assert live_resp.status_code == status.HTTP_200_OK
        counts = live_resp.json()["data"]["meta"]["counts"]
        assert counts["present"] == 1
        assert counts["inside"] == 1

        # Check-out via admin
        checkout_resp = api_client.post(f"/v1/library/attendance/{rec_id}/check-out")
        assert checkout_resp.status_code == status.HTTP_200_OK
        assert checkout_resp.json()["data"]["time_out"] is not None

        # Verify live counts inside is now 0
        live_resp2 = api_client.get("/v1/library/attendance/live")
        assert live_resp2.json()["data"]["meta"]["counts"]["inside"] == 0


@pytest.mark.django_db
class TestPriority8Flow1913StudentAttendanceScan:
    """Tests covering Flow 19.13: Strict decision order for student QR scan."""

    def test_flow_19_13_scan_decision_order(self, api_client, library_tenant, live_student, live_student_token):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {live_student_token}")
        branch = library_tenant.branches.first()

        qr = AttendanceQRCode.objects.create(
            library=library_tenant,
            branch=branch,
            name='Entry Gate',
            allowed_radius_m=100,
            latitude=Decimal('25.435800'),
            longitude=Decimal('81.846300'),
            expires_at=timezone.now() + timezone.timedelta(days=1),
            status='active',
        )

        # 1. Invalid QR token -> 400 qr_invalid
        inv_resp = api_client.post(
            "/v1/student/attendance/scan",
            {
                'qr_token': str(uuid.uuid4()),
                'latitude': "25.435800",
                'longitude': "81.846300",
                'device_id': 'dev_test_01',
            },
            format="json"
        )
        assert inv_resp.status_code == status.HTTP_400_BAD_REQUEST
        assert inv_resp.json()["error"]["code"] == "qr_invalid"

        # 2. Expired QR token -> 400 qr_expired
        qr.expires_at = timezone.now() - timezone.timedelta(minutes=5)
        qr.save()
        exp_resp = api_client.post(
            "/v1/student/attendance/scan",
            {
                'qr_token': str(qr.token),
                'latitude': "25.435800",
                'longitude': "81.846300",
                'device_id': 'dev_test_01',
            },
            format="json"
        )
        assert exp_resp.status_code == status.HTTP_400_BAD_REQUEST
        assert exp_resp.json()["error"]["code"] == "qr_expired"

        # Restore valid expiry
        qr.expires_at = timezone.now() + timezone.timedelta(days=1)
        qr.save()

        # 3. Student not live -> 403 not_live
        live_student.status = 'Pending'
        live_student.save()
        pending_resp = api_client.post(
            "/v1/student/attendance/scan",
            {
                'qr_token': str(qr.token),
                'latitude': "25.435800",
                'longitude': "81.846300",
                'device_id': 'dev_test_01',
            },
            format="json"
        )
        assert pending_resp.status_code == status.HTTP_403_FORBIDDEN
        assert pending_resp.json()["error"]["code"] == "not_live"

        live_student.status = 'Live'
        live_student.save()

        # 4. Mock location detection -> 400 mock_location_detected
        mock_resp = api_client.post(
            "/v1/student/attendance/scan",
            {
                'qr_token': str(qr.token),
                'latitude': "25.435800",
                'longitude': "81.846300",
                'device_id': 'dev_test_01',
                'is_mock_location': True,
            },
            format="json"
        )
        assert mock_resp.status_code == status.HTTP_400_BAD_REQUEST
        assert mock_resp.json()["error"]["code"] == "mock_location_detected"

        # 5. Outside radius -> 400 outside_radius
        outside_resp = api_client.post(
            "/v1/student/attendance/scan",
            {
                'qr_token': str(qr.token),
                'latitude': "25.500000",
                'longitude': "81.900000",
                'device_id': 'dev_test_01',
            },
            format="json"
        )
        assert outside_resp.status_code == status.HTTP_400_BAD_REQUEST
        assert outside_resp.json()["error"]["code"] == "outside_radius"

        # Clear any failed scan attempts so debounce doesn't block valid test
        ScanAttempt.objects.all().delete()

        # 6. Valid Check-in
        checkin_resp = api_client.post(
            "/v1/student/attendance/scan",
            {
                'qr_token': str(qr.token),
                'latitude': "25.435810",
                'longitude': "81.846305",
                'device_id': 'dev_test_01',
            },
            format="json"
        )
        assert checkin_resp.status_code == status.HTTP_201_CREATED
        checkin_data = checkin_resp.json()["data"]
        assert checkin_data["action"] == "check_in"
        assert checkin_data["study_available"] is True

        # Clear debounce for immediate second scan test
        ScanAttempt.objects.all().delete()

        # 7. Valid Check-out toggle
        checkout_resp = api_client.post(
            "/v1/student/attendance/scan",
            {
                'qr_token': str(qr.token),
                'latitude': "25.435810",
                'longitude': "81.846305",
                'device_id': 'dev_test_01',
            },
            format="json"
        )
        assert checkout_resp.status_code == status.HTTP_200_OK
        checkout_data = checkout_resp.json()["data"]
        assert checkout_data["action"] == "check_out"
        assert checkout_data["study_available"] is False


@pytest.mark.django_db
class TestPriority9StudentStudySessions:
    """Tests covering Section 8.8 and 13.5 Study Sessions."""

    def test_study_session_lifecycle(self, api_client, library_tenant, live_student, live_student_token):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {live_student_token}")

        # 1. Attempt to start study session before checking in -> 400 not_checked_in
        no_checkin_resp = api_client.post(
            "/v1/student/study/sessions",
            {'subject_tag': 'General Studies'},
            format="json"
        )
        assert no_checkin_resp.status_code == status.HTTP_400_BAD_REQUEST
        assert no_checkin_resp.json()["error"]["code"] == "not_checked_in"

        # Check in student
        AttendanceRecord.objects.create(
            student=live_student,
            branch=live_student.branch,
            date=timezone.now().date(),
            time_in=timezone.now(),
            method='QR Scan',
            status='Present',
        )

        # 2. Start session -> 201 Created
        start_resp = api_client.post(
            "/v1/student/study/sessions",
            {'subject_tag': 'History & Polity'},
            format="json"
        )
        assert start_resp.status_code == status.HTTP_201_CREATED
        sess_data = start_resp.json()["data"]
        sess_id = sess_data["id"]
        assert sess_data["status"] == "running"

        # 3. Attempt concurrent session -> 409 session_already_running
        dup_resp = api_client.post(
            "/v1/student/study/sessions",
            {'subject_tag': 'Economics'},
            format="json"
        )
        assert dup_resp.status_code == status.HTTP_409_CONFLICT
        assert dup_resp.json()["error"]["code"] == "session_already_running"

        # 4. Heartbeat -> 204
        hb_resp = api_client.post(f"/v1/student/study/sessions/{sess_id}/heartbeat")
        assert hb_resp.status_code == status.HTTP_204_NO_CONTENT

        # 5. GET current session
        cur_resp = api_client.get("/v1/student/study/current")
        assert cur_resp.status_code == status.HTTP_200_OK
        assert cur_resp.json()["data"]["id"] == sess_id

        # 6. End session
        end_resp = api_client.post(f"/v1/student/study/sessions/{sess_id}/end")
        assert end_resp.status_code == status.HTTP_200_OK
        assert end_resp.json()["data"]["session"]["status"] == "completed"

        # 7. GET stats
        stats_resp = api_client.get("/v1/student/study/stats?range=day")
        assert stats_resp.status_code == status.HTTP_200_OK
        assert "total_minutes" in stats_resp.json()["data"]

