"""
Tests for Priority 4: Library Panel Team, Permissions, Branches, Settings, Setup (Section 9)
Tests for Priority 5: Students, Plans, Memberships, Join Requests, Coupons (Section 10)
"""
import uuid
from decimal import Decimal
import pytest
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.billing.models import Coupon, FeePlan
from apps.core.jwt import AUDIENCE_LIBRARY, generate_access_token
from apps.libraries.models import AdminInbox, Branch, Library
from apps.seats.models import Seat
from apps.students.models import Student, StudentMembership


@pytest.fixture(autouse=True)
def clear_caches():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def owner_user(db):
    return User.objects.create_user(
        email="lib_owner_s9@example.com",
        password="Password123!",
        first_name="Owner",
        last_name="Shukla",
        role="LIBRARY_OWNER",
        phone="9876511111",
    )


@pytest.fixture
def library_tenant(db, owner_user):
    lib = Library.objects.create(
        code="LIB-SEC9-01",
        name="Shukla Knowledge Centre",
        owner=owner_user,
        city="Vadodara",
        state="Gujarat",
        address="Alkapuri Main Road",
        phone="9876511111",
        plan_status="Active",
        library_status="Active",
    )
    Branch.objects.create(
        library=lib,
        name="Alkapuri Branch",
        address="Alkapuri Main Road",
        phone="9876511111",
        is_main=True,
    )
    owner_user.library = lib
    owner_user.save(update_fields=["library"])
    return lib


@pytest.fixture
def other_library(db):
    owner2 = User.objects.create_user(
        email="other_owner@example.com",
        password="Password123!",
        first_name="Other",
        last_name="Owner",
        role="LIBRARY_OWNER",
        phone="9876522222",
    )
    lib = Library.objects.create(
        code="LIB-OTHER-02",
        name="Other City Library",
        owner=owner2,
        city="Surat",
        state="Gujarat",
        address="Ghod Dod Road",
        phone="9876522222",
        plan_status="Active",
        library_status="Active",
    )
    Branch.objects.create(
        library=lib,
        name="Surat Main",
        address="Ghod Dod Road",
        phone="9876522222",
        is_main=True,
    )
    owner2.library = lib
    owner2.save(update_fields=["library"])
    return lib


@pytest.fixture
def library_token(library_tenant, owner_user):
    return generate_access_token(
        user_id=owner_user.id,
        audience=AUDIENCE_LIBRARY,
        extra_claims={
            "org_id": str(library_tenant.id),
            "member_id": str(owner_user.id),
            "role": "owner",
            "branch_ids": "all",
            "perm_ver": 1,
        },
    )


@pytest.mark.django_db
class TestPriority4LibraryPanelAPIs:
    """Verification for Section 9 Library Panel APIs."""

    def test_library_me_and_access_state(self, api_client, library_token, library_tenant):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")

        # GET /v1/library/me
        me_resp = api_client.get("/v1/library/me")
        assert me_resp.status_code == status.HTTP_200_OK
        data = me_resp.json()["data"]
        assert data["library"]["name"] == library_tenant.name
        assert data["member"]["role"] == "owner"
        assert len(data["branches"]) >= 1

        # GET /v1/library/access-state
        acc_resp = api_client.get("/v1/library/access-state")
        assert acc_resp.status_code == status.HTTP_200_OK
        assert acc_resp.json()["data"]["can_access"] is True

    def test_library_dashboard_and_inbox(self, api_client, library_token, library_tenant):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")

        # Seed inbox item
        AdminInbox.objects.create(
            library=library_tenant,
            type="join_request",
            title="New Student Application",
            message="Student Priya has applied to join.",
        )

        # GET /v1/library/inbox
        inbox_resp = api_client.get("/v1/library/inbox")
        assert inbox_resp.status_code == status.HTTP_200_OK
        items = inbox_resp.json()["data"]
        assert len(items) == 1
        assert items[0]["title"] == "New Student Application"

        # GET /v1/library/inbox/unread-count
        cnt_resp = api_client.get("/v1/library/inbox/unread-count")
        assert cnt_resp.status_code == status.HTTP_200_OK
        assert cnt_resp.json()["data"]["count"] == 1

        # Mark all read
        read_all = api_client.post("/v1/library/inbox/read-all")
        assert read_all.status_code == status.HTTP_204_NO_CONTENT

        # Dashboard
        dash_resp = api_client.get("/v1/library/dashboard")
        assert dash_resp.status_code == status.HTTP_200_OK
        dash_data = dash_resp.json()["data"]
        assert "kpis" in dash_data
        assert "attention" in dash_data

    def test_library_branches_crud(self, api_client, library_token, library_tenant):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")

        # List existing branches
        b_list = api_client.get("/v1/library/branches")
        assert b_list.status_code == status.HTTP_200_OK
        assert len(b_list.json()["data"]) == 1

        # Create secondary branch
        create_resp = api_client.post(
            "/v1/library/branches",
            data={
                "name": "Manjalpur Branch",
                "address": "Opposite Manjalpur Sports Complex",
                "phone": "9876599991",
                "floors_count": 2,
                "allowed_qr_radius_meters": 120,
            },
            format="json",
        )
        assert create_resp.status_code == status.HTTP_201_CREATED
        b_id = create_resp.json()["data"]["id"]

        # Retrieve detail
        detail_resp = api_client.get(f"/v1/library/branches/{b_id}")
        assert detail_resp.status_code == status.HTTP_200_OK
        assert detail_resp.json()["data"]["name"] == "Manjalpur Branch"

        # Delete secondary branch
        del_resp = api_client.delete(f"/v1/library/branches/{b_id}")
        assert del_resp.status_code == status.HTTP_204_NO_CONTENT

    def test_library_team_members_and_permission_bumping(self, api_client, library_token, library_tenant):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")

        # Check slots
        slots_resp = api_client.get("/v1/library/team/slots")
        assert slots_resp.status_code == status.HTTP_200_OK
        assert "sub_admin_by_branch" in slots_resp.json()["data"]

        # Create staff member
        staff_resp = api_client.post(
            "/v1/library/team/members",
            data={
                "first_name": "Suresh",
                "last_name": "Dave",
                "mobile": "9876588888",
                "email": "suresh.staff@example.com",
                "role": "staff",
                "branch_ids": [str(library_tenant.branches.first().id)],
            },
            format="json",
        )
        assert staff_resp.status_code == status.HTTP_201_CREATED
        staff_id = staff_resp.json()["data"]["id"]

        # Update staff permissions (must increment perm_ver)
        perm_resp = api_client.put(
            f"/v1/library/team/members/{staff_id}/permissions",
            data={
                "grants": [
                    {"module": "students", "level": "View Only"},
                    {"module": "attendance", "level": "Full Access"},
                ],
                "reason": "Assigned front-desk duties",
            },
            format="json",
        )
        assert perm_resp.status_code == status.HTTP_200_OK
        assert perm_resp.json()["data"]["perm_ver"] == 2


@pytest.mark.django_db
class TestPriority5StudentsPlansAndMemberships:
    """Verification for Section 10 Students, Plans, Memberships, Join Requests, Coupons."""

    def test_plans_crud(self, api_client, library_token, library_tenant):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")

        # Create plan
        p_resp = api_client.post(
            "/v1/library/plans",
            data={
                "name": "Quarterly Focused Study",
                "duration_days": 90,
                "price": "3900.00",
                "description": "3 months full-day library seat with all amenities",
                "is_active": True,
            },
            format="json",
        )
        assert p_resp.status_code == status.HTTP_201_CREATED
        plan_id = p_resp.json()["data"]["id"]

        # List plans
        plans_list = api_client.get("/v1/library/plans")
        assert plans_list.status_code == status.HTTP_200_OK
        assert len(plans_list.json()["data"]) >= 1

        # Delete unused plan
        del_resp = api_client.delete(f"/v1/library/plans/{plan_id}")
        assert del_resp.status_code == status.HTTP_204_NO_CONTENT

    def test_student_creation_enforces_live_in_one_library_rule(
        self, api_client, library_token, library_tenant, other_library
    ):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")
        main_branch = library_tenant.branches.first()

        # 1. Create a student in other_library and mark them LIVE
        existing_user = User.objects.create_user(
            email="shared_student@example.com",
            password="Password123!",
            first_name="Pooja",
            last_name="Joshi",
            role="STUDENT",
            phone="9876577777",
        )
        Student.objects.create(
            user=existing_user,
            library=other_library,
            name="Pooja Joshi",
            phone="9876577777",
            gender="Female",
            status="Live",
        )

        # 2. Attempting to create this student as LIVE in library_tenant must return 409 student_live_elsewhere
        conflict_resp = api_client.post(
            "/v1/library/students",
            data={
                "first_name": "Pooja",
                "last_name": "Joshi",
                "mobile": "9876577777",
                "email": "pooja@example.com",
                "gender": "Female",
                "branch_id": str(main_branch.id),
            },
            format="json",
        )
        assert conflict_resp.status_code == status.HTTP_409_CONFLICT
        assert conflict_resp.json()["error"]["code"] == "student_live_elsewhere"

    def test_student_creation_and_membership_assignment(self, api_client, library_token, library_tenant):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")
        main_branch = library_tenant.branches.first()

        # Create Seat & Plan
        seat = Seat.objects.create(branch=main_branch, label="D-01", type="Desk")
        plan = FeePlan.objects.create(
            library=library_tenant,
            name="Monthly AC Desk",
            duration_days=30,
            price=Decimal("1500.00"),
        )

        # Create student with atomic seat & plan assignment
        create_resp = api_client.post(
            "/v1/library/students",
            data={
                "first_name": "Manan",
                "last_name": "Vora",
                "mobile": "9876566666",
                "gender": "Male",
                "branch_id": str(main_branch.id),
                "seat_id": str(seat.id),
                "plan_id": str(plan.id),
            },
            format="json",
        )
        assert create_resp.status_code == status.HTTP_201_CREATED
        student_data = create_resp.json()["data"]["student"]
        student_id = student_data["id"]
        assert student_data["status"] == "live"
        assert student_data["seat"]["label"] == "D-01"

        # Check duplicate mobile detection
        dup_resp = api_client.post(
            "/v1/library/students",
            data={
                "first_name": "Manan",
                "last_name": "Vora",
                "mobile": "9876566666",
                "gender": "Male",
                "branch_id": str(main_branch.id),
            },
            format="json",
        )
        assert dup_resp.status_code == status.HTTP_409_CONFLICT
        assert dup_resp.json()["error"]["code"] == "duplicate_mobile"

        # Suspend student -> Releases seat automatically
        susp_resp = api_client.post(
            f"/v1/library/students/{student_id}/status",
            data={"status": "suspended", "reason": "Violated silence policy in cabin"},
            format="json",
        )
        assert susp_resp.status_code == status.HTTP_200_OK
        assert "Seat released" in susp_resp.json()["data"]["effects"]
        seat.refresh_from_db()
        assert seat.student is None

    def test_join_request_approval_enforces_live_in_one_library(
        self, api_client, library_token, library_tenant, other_library
    ):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")

        applicant_user = User.objects.create_user(
            email="applicant@example.com",
            password="Password123!",
            first_name="Hardik",
            last_name="Raval",
            role="STUDENT",
            phone="9876555555",
        )

        # Applicant submitted pending join request in library_tenant
        join_req = Student.objects.create(
            user=applicant_user,
            library=library_tenant,
            branch=library_tenant.branches.first(),
            name="Hardik Raval",
            phone="9876555555",
            gender="Male",
            status="Pending",
        )

        # Meanwhile, applicant became Live in other_library
        Student.objects.create(
            user=applicant_user,
            library=other_library,
            name="Hardik Raval",
            phone="9876555555",
            gender="Male",
            status="Live",
        )

        # Owner tries to approve the join request -> Must block with 409 student_live_elsewhere
        appr_resp = api_client.post(f"/v1/library/join-requests/{join_req.id}/approve")
        assert appr_resp.status_code == status.HTTP_409_CONFLICT
        assert appr_resp.json()["error"]["code"] == "student_live_elsewhere"

    def test_coupons_management(self, api_client, library_token, library_tenant):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")

        create_coupon = api_client.post(
            "/v1/library/coupons",
            data={
                "code": "DIWALI50",
                "discount_type": "percentage",
                "discount_value": "50.00",
                "max_redemptions": 50,
            },
            format="json",
        )
        assert create_coupon.status_code == status.HTTP_201_CREATED
        coupon_id = create_coupon.json()["data"]["id"]

        coupons_list = api_client.get("/v1/library/coupons")
        assert coupons_list.status_code == status.HTTP_200_OK
        assert len(coupons_list.json()["data"]) >= 1

