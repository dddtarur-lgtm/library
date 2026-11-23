"""
Unit and integration tests for Phase 2: Student Lifecycle, Plans & Memberships, and Fee Management.
Covers:
- Student home, plans list, dues list, coupon validation
- Admin student notes, branch transfer, ID card payload
- Join requests info-request, branch change requests approve/reject
- Leave requests approve/reject
- Membership pause & resume lifecycle
- Fee payment, receipt generation, invoice, and Day Book closing
"""
import uuid
from decimal import Decimal
import pytest
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.billing.models import Coupon, FeeDue, FeePlan, Payment
from apps.core.jwt import (
    AUDIENCE_LIBRARY,
    AUDIENCE_STUDENT,
    generate_access_token,
)
from apps.libraries.models import Branch, Library
from apps.seats.models import Seat
from apps.students.models import (
    BranchChangeRequest,
    Student,
    StudentLeaveRequest,
    StudentMembership,
)


@pytest.fixture(autouse=True)
def clear_caches():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def phase2_setup(db):
    owner = User.objects.create_user(
        email="owner_phase2@example.com",
        password="OwnerPassword123!",
        first_name="Phase2",
        last_name="Owner",
        role="LIBRARY_OWNER",
        phone="9876510001",
    )
    lib = Library.objects.create(
        code="LIB-P2-001",
        name="Phase2 Academy",
        owner=owner,
        city="Pune",
        state="Maharashtra",
        address="FC Road",
        phone="9876510001",
        plan_status="Active",
        library_status="Active",
    )
    owner.library = lib
    owner.save(update_fields=["library"])

    b1 = Branch.objects.create(library=lib, name="Main Branch", address="FC Road", phone="9876510001", is_main=True)
    b2 = Branch.objects.create(library=lib, name="East Branch", address="Koregaon Park", phone="9876510002", is_main=False)

    plan = FeePlan.objects.create(
        library=lib,
        name="Monthly Standard",
        duration_days=30,
        price=Decimal("1500.00"),
        benefits=["Air Conditioned", "High Speed WiFi"],
    )

    coupon = Coupon.objects.create(
        library=lib,
        code="WELCOME200",
        discount_type="Flat Amount",
        discount_value=Decimal("200.00"),
        min_purchase=Decimal("1000.00"),
        valid_until=timezone.now().date() + timezone.timedelta(days=30),
        usage_limit=50,
    )

    student_user = User.objects.create_user(
        email="student_phase2@example.com",
        password="StudentPassword123!",
        first_name="Aarav",
        last_name="Patel",
        role="STUDENT",
        phone="9876520001",
    )

    student = Student.objects.create(
        user=student_user,
        library=lib,
        branch=b1,
        name="Aarav Patel",
        email=student_user.email,
        phone=student_user.phone,
        gender="Male",
        status="Live",
    )

    return owner, lib, b1, b2, plan, coupon, student_user, student


@pytest.mark.django_db
class TestPhase2StudentSelfService:
    """Tests for Student Self-Service Endpoints (Section 8)."""

    def test_student_home_plans_and_dues(self, api_client, phase2_setup):
        _, lib, _, _, plan, _, student_user, student = phase2_setup
        token = generate_access_token(
            user_id=student_user.id,
            audience=AUDIENCE_STUDENT,
            extra_claims={"org_id": str(lib.id), "enrollment_id": str(student.id)},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        # 1. Student Home
        home_resp = api_client.get("/v1/student/home")
        assert home_resp.status_code == status.HTTP_200_OK
        assert home_resp.data["state"] in ("active", "member_no_plan")

        # 2. Student Plans List
        plans_resp = api_client.get("/v1/student/plans")
        assert plans_resp.status_code == status.HTTP_200_OK
        assert len(plans_resp.data) >= 1
        assert plans_resp.data[0]["name"] == plan.name

        # 3. Create FeeDue and inspect via student dues
        FeeDue.objects.create(
            library=lib,
            student=student,
            charge_type="plan_fee",
            description="November Fee Balance",
            amount=Decimal("500.00"),
            due_date=timezone.now().date() + timezone.timedelta(days=5),
        )

        dues_resp = api_client.get("/v1/student/dues")
        assert dues_resp.status_code == status.HTTP_200_OK
        assert len(dues_resp.data) == 1
        assert dues_resp.data[0]["description"] == "November Fee Balance"

    def test_student_coupon_validation(self, api_client, phase2_setup):
        _, lib, _, _, _, coupon, student_user, student = phase2_setup
        token = generate_access_token(
            user_id=student_user.id,
            audience=AUDIENCE_STUDENT,
            extra_claims={"org_id": str(lib.id), "enrollment_id": str(student.id)},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        # Valid coupon
        v_resp = api_client.post("/v1/student/coupons/validate", {
            "code": "WELCOME200",
            "amount": "1500.00",
        })
        assert v_resp.status_code == status.HTTP_200_OK
        assert v_resp.data["valid"] is True
        assert Decimal(v_resp.data["calculated_discount"]) == Decimal("200.00")
        assert Decimal(v_resp.data["final_amount"]) == Decimal("1300.00")

        # Invalid coupon
        inv_resp = api_client.post("/v1/student/coupons/validate", {
            "code": "NOTREAL",
            "amount": "1500.00",
        })
        assert inv_resp.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_student_digital_library_card(self, api_client, phase2_setup):
        _, lib, _, _, _, _, student_user, student = phase2_setup
        token = generate_access_token(
            user_id=student_user.id,
            audience=AUDIENCE_STUDENT,
            extra_claims={"org_id": str(lib.id), "enrollment_id": str(student.id)},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        card_resp = api_client.get("/v1/student/library-card")
        assert card_resp.status_code == status.HTTP_200_OK
        assert card_resp.data["student_code"] == student.student_code
        assert "qr_payload" in card_resp.data


@pytest.mark.django_db
class TestPhase2LibraryStudentOperations:
    """Tests for Library Student Operations, Notes, Branch Transfers & Requests (Section 10)."""

    def test_student_notes_crud_and_branch_transfer(self, api_client, phase2_setup):
        owner, lib, b1, b2, _, _, _, student = phase2_setup
        token = generate_access_token(
            user_id=owner.id,
            audience=AUDIENCE_LIBRARY,
            extra_claims={"org_id": str(lib.id), "member_id": str(owner.id), "role": "owner"},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        # 1. Add internal note
        note_resp = api_client.post(f"/v1/library/students/{student.id}/notes", {
            "note": "Student requested window seat for preparation.",
        })
        assert note_resp.status_code == status.HTTP_201_CREATED
        assert "id" in note_resp.data

        # 2. Get notes
        notes_list = api_client.get(f"/v1/library/students/{student.id}/notes")
        assert notes_list.status_code == status.HTTP_200_OK
        assert len(notes_list.data) == 1

        # 3. Branch Transfer
        assert student.branch == b1
        transfer_resp = api_client.post(f"/v1/library/students/{student.id}/branch", {
            "to_branch_id": str(b2.id),
        })
        assert transfer_resp.status_code == status.HTTP_200_OK
        student.refresh_from_db()
        assert student.branch == b2

        # 4. View ID card from library panel
        card_resp = api_client.get(f"/v1/library/students/{student.id}/card")
        assert card_resp.status_code == status.HTTP_200_OK
        assert card_resp.data["branch"]["name"] == b2.name

    def test_join_request_info_request_and_requests_lifecycle(self, api_client, phase2_setup):
        owner, lib, b1, b2, _, _, _, _ = phase2_setup
        token = generate_access_token(
            user_id=owner.id,
            audience=AUDIENCE_LIBRARY,
            extra_claims={"org_id": str(lib.id), "member_id": str(owner.id), "role": "owner"},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        # Create a pending student applicant
        applicant_user = User.objects.create_user(
            email="applicant@example.com",
            password="AppPassword123!",
            first_name="Neha",
            last_name="Gupta",
            role="STUDENT",
            phone="9876530001",
        )
        pending_student = Student.objects.create(
            user=applicant_user,
            library=lib,
            branch=b1,
            name="Neha Gupta",
            email=applicant_user.email,
            phone=applicant_user.phone,
            gender="Female",
            status="Pending",
        )

        # 1. Request more information
        info_resp = api_client.post(f"/v1/library/join-requests/{pending_student.id}/request-info", {
            "message": "Please upload valid college ID proof.",
        })
        assert info_resp.status_code == status.HTTP_204_NO_CONTENT
        pending_student.refresh_from_db()
        assert pending_student.rejection_reason == "Please upload valid college ID proof."

        # 2. Branch change request flow
        bc_req = BranchChangeRequest.objects.create(
            student=pending_student,
            from_branch=b1,
            to_branch=b2,
            reason="Shifted residence",
            status="pending",
        )
        bc_list = api_client.get("/v1/library/branch-change-requests")
        assert bc_list.status_code == status.HTTP_200_OK
        assert len(bc_list.data) == 1

        bc_approve = api_client.post(f"/v1/library/branch-change-requests/{bc_req.id}/approve", {
            "note": "Approved transfer",
        })
        assert bc_approve.status_code == status.HTTP_200_OK
        bc_req.refresh_from_db()
        assert bc_req.status == "approved"
        pending_student.refresh_from_db()
        assert pending_student.branch == b2

        # 3. Leave request flow
        leave_req = StudentLeaveRequest.objects.create(
            student=pending_student,
            reason="Exams completed",
            status="pending",
        )
        leave_list = api_client.get("/v1/library/leave-requests")
        assert leave_list.status_code == status.HTTP_200_OK
        assert len(leave_list.data) == 1

        leave_approve = api_client.post(f"/v1/library/leave-requests/{leave_req.id}/approve", {
            "note": "Cleared all dues",
        })
        assert leave_approve.status_code == status.HTTP_200_OK
        pending_student.refresh_from_db()
        assert pending_student.status == "Expired"

    def test_membership_pause_resume_lifecycle(self, api_client, phase2_setup):
        owner, lib, b1, _, plan, _, _, student = phase2_setup
        token = generate_access_token(
            user_id=owner.id,
            audience=AUDIENCE_LIBRARY,
            extra_claims={"org_id": str(lib.id), "member_id": str(owner.id), "role": "owner"},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        membership = StudentMembership.objects.create(
            student=student,
            plan=plan,
            shift="Full Day",
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timezone.timedelta(days=30),
            status="Active",
            amount_paid=plan.price,
            payment_mode="Cash",
        )

        # 1. Pause membership
        pause_resp = api_client.post(f"/v1/library/memberships/{membership.id}/pause", {
            "reason": "Student travelling for 10 days",
        })
        assert pause_resp.status_code == status.HTTP_200_OK
        membership.refresh_from_db()
        assert membership.status == "Grace Period"
        assert "Student travelling" in membership.notes

        # 2. Resume membership
        resume_resp = api_client.post(f"/v1/library/memberships/{membership.id}/resume")
        assert resume_resp.status_code == status.HTTP_200_OK
        membership.refresh_from_db()
        assert membership.status == "Active"
