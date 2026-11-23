"""
Tests for Priority 2: Public APIs (Section 6)
Tests for Priority 3: Student Home + Profile + Join Flow (Section 8.1 - 8.2)
"""
import uuid
import pytest
from django.core.cache import cache
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.billing.models import FeePlan
from apps.core.jwt import AUDIENCE_STUDENT, generate_access_token
from apps.libraries.models import Branch, Library
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
        email="public_owner@example.com",
        password="Password123!",
        first_name="PubOwner",
        last_name="Test",
        role="LIBRARY_OWNER",
        phone="9876500010",
    )


@pytest.fixture
def published_library(db, owner_user):
    lib = Library.objects.create(
        code="LIB-PUB-001",
        name="Pragya Study Hub",
        owner=owner_user,
        city="Ahmedabad",
        state="Gujarat",
        address="Navrangpura Cross Roads",
        phone="9876500010",
        plan_status="Active",
        library_status="Active",
    )
    Branch.objects.create(
        library=lib,
        name="Navrangpura Main",
        address="Navrangpura Cross Roads",
        phone="9876500010",
        is_main=True,
    )
    Branch.objects.create(
        library=lib,
        name="Vastrapur Branch",
        address="Near Vastrapur Lake",
        phone="9876500011",
        is_main=False,
    )
    FeePlan.objects.create(
        library=lib,
        name="Monthly Pro Plan",
        duration_days=30,
        price="1500.00",
        description="Full day AC seat with high-speed internet",
        is_active=True,
    )
    return lib


@pytest.fixture
def locked_published_library(db):
    owner = User.objects.create_user(
        email="locked_pub_owner@example.com",
        password="Password123!",
        first_name="LockedPub",
        last_name="Owner",
        role="LIBRARY_OWNER",
        phone="9876500020",
    )
    lib = Library.objects.create(
        code="LIB-PUB-LCK",
        name="Locked Central Library",
        owner=owner,
        city="Rajkot",
        state="Gujarat",
        address="Kalawad Road",
        phone="9876500020",
        plan_status="Locked",
        library_status="Locked",
    )
    Branch.objects.create(
        library=lib,
        name="Kalawad Main",
        address="Kalawad Road",
        phone="9876500020",
        is_main=True,
    )
    return lib


@pytest.fixture
def student_user(db):
    return User.objects.create_user(
        email="student_public_test@example.com",
        password="Password123!",
        first_name="Aarav",
        last_name="Mehta",
        role="STUDENT",
        phone="9876500030",
    )


@pytest.mark.django_db
class TestPriority2PublicAPIs:
    """Verification for Section 6 Public APIs."""

    def test_public_meta(self, api_client, published_library):
        resp = api_client.get("/v1/public/meta")
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()["data"]
        assert "languages" in data
        assert "cities" in data
        assert "exam_goals" in data
        assert "facility_catalog" in data
        assert "app" in data

    def test_public_libraries_list_and_nearby(self, api_client, published_library, locked_published_library):
        resp = api_client.get("/v1/public/libraries")
        assert resp.status_code == status.HTTP_200_OK
        libs = resp.json()["data"]
        assert len(libs) >= 2

        # Nearby map markers
        nearby_resp = api_client.get("/v1/public/libraries/nearby?lat=23.0225&lng=72.5714")
        assert nearby_resp.status_code == status.HTTP_200_OK
        markers = nearby_resp.json()["data"]
        assert len(markers) >= 2

    def test_public_library_detail_and_subresources(self, api_client, published_library):
        slug = slugify(published_library.name)

        # Profile detail
        detail_resp = api_client.get(f"/v1/public/libraries/{slug}")
        assert detail_resp.status_code == status.HTTP_200_OK
        assert detail_resp.json()["data"]["library"]["name"] == published_library.name
        assert detail_resp.json()["data"]["accepting_students"] is True

        # Plans
        plans_resp = api_client.get(f"/v1/public/libraries/{slug}/plans")
        assert plans_resp.status_code == status.HTTP_200_OK
        plans = plans_resp.json()["data"]
        assert len(plans) >= 1
        assert plans[0]["name"] == "Monthly Pro Plan"

        # Facilities
        fac_resp = api_client.get(f"/v1/public/libraries/{slug}/facilities")
        assert fac_resp.status_code == status.HTTP_200_OK

        # Branches
        branches_resp = api_client.get(f"/v1/public/libraries/{slug}/branches")
        assert branches_resp.status_code == status.HTTP_200_OK
        branches = branches_resp.json()["data"]
        assert len(branches) == 2

        # Share link & QR
        share_resp = api_client.get(f"/v1/public/libraries/{slug}/share")
        assert share_resp.status_code == status.HTTP_200_OK
        assert "short_url" in share_resp.json()["data"]

    def test_public_enquiry_and_visit(self, api_client, published_library):
        slug = slugify(published_library.name)

        # Submit visitor enquiry
        enq_resp = api_client.post(
            f"/v1/public/libraries/{slug}/enquiries",
            data={
                "name": "Kavita Shah",
                "mobile": "9876599999",
                "email": "kavita@example.com",
                "message": "Looking for morning shift AC desk.",
            },
            format="json",
        )
        assert enq_resp.status_code == status.HTTP_201_CREATED
        assert "id" in enq_resp.json()["data"]

        # Track anonymous page visit
        visit_resp = api_client.post(
            f"/v1/public/libraries/{slug}/visits",
            data={
                "session_id": str(uuid.uuid4()),
                "referrer": "google.com",
            },
            format="json",
        )
        assert visit_resp.status_code == status.HTTP_204_NO_CONTENT

    def test_locked_library_shows_page_with_notice_but_blocks_accepting_students(self, api_client, locked_published_library):
        slug = slugify(locked_published_library.name)
        detail_resp = api_client.get(f"/v1/public/libraries/{slug}")
        assert detail_resp.status_code == status.HTTP_200_OK
        data = detail_resp.json()["data"]
        assert data["accepting_students"] is False
        assert data["notice"] is not None


@pytest.mark.django_db
class TestPriority3StudentHomeProfileAndJoinFlow:
    """Verification for Section 8.1 and 8.2 Student APIs."""

    def test_student_home_states(self, api_client, student_user, published_library, locked_published_library):
        token = generate_access_token(user_id=student_user.id, audience=AUDIENCE_STUDENT)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        # 1. No library
        h1 = api_client.get("/v1/student/home")
        assert h1.status_code == status.HTTP_200_OK
        assert h1.json()["data"]["state"] == "no_library"

        # 2. Join pending
        student = Student.objects.create(
            user=student_user,
            library=published_library,
            name="Aarav Mehta",
            phone=student_user.phone,
            gender="Male",
            status="Pending",
        )
        h2 = api_client.get("/v1/student/home")
        assert h2.status_code == status.HTTP_200_OK
        assert h2.json()["data"]["state"] == "join_pending"

        # 3. Active with membership plan
        student.status = "Live"
        student.save()
        plan = published_library.fee_plans.first()
        StudentMembership.objects.create(
            student=student,
            plan=plan,
            shift="Full Day",
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timezone.timedelta(days=30),
            status="Active",
            amount_paid=plan.price,
            payment_mode="Cash",
        )
        h3 = api_client.get("/v1/student/home")
        assert h3.status_code == status.HTTP_200_OK
        assert h3.json()["data"]["state"] == "active"
        assert h3.json()["data"]["plan"]["plan_name"] == plan.name

        # 4. Library locked state returns friendly message
        student.library = locked_published_library
        student.save()
        h4 = api_client.get("/v1/student/home")
        assert h4.status_code == status.HTTP_200_OK
        assert h4.json()["data"]["state"] == "library_locked"
        assert h4.json()["data"]["message"]["contact_phone"] == locked_published_library.phone

    def test_student_profile_and_settings(self, api_client, student_user, published_library):
        student = Student.objects.create(
            user=student_user,
            library=published_library,
            name="Aarav Mehta",
            phone=student_user.phone,
            gender="Male",
            status="Live",
        )
        token = generate_access_token(
            user_id=student_user.id,
            audience=AUDIENCE_STUDENT,
            extra_claims={"enrollment_id": str(student.id), "org_id": str(published_library.id)},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        # GET Profile
        p_resp = api_client.get("/v1/student/profile")
        assert p_resp.status_code == status.HTTP_200_OK
        assert p_resp.json()["data"]["user"]["first_name"] == "Aarav"

        # PATCH Profile
        patch_resp = api_client.patch(
            "/v1/student/profile",
            data={
                "exam_goal": "UPSC Civil Services",
                "address": "101, Shivalik Residency, Ahmedabad",
                "guardian": {
                    "name": "Rajesh Mehta",
                    "phone": "9876540000",
                    "relation": "Father",
                },
            },
            format="json",
        )
        assert patch_resp.status_code == status.HTTP_200_OK
        assert patch_resp.json()["data"]["exam_goal"] == "UPSC Civil Services"
        assert patch_resp.json()["data"]["guardian"]["name"] == "Rajesh Mehta"

        # Device registration
        dev_resp = api_client.post(
            "/v1/student/devices",
            data={
                "platform": "android",
                "device_id": "pixel8-device-uuid-1234",
                "push_token": "fcm_token_xyz",
            },
            format="json",
        )
        assert dev_resp.status_code == status.HTTP_201_CREATED

        # Settings
        set_resp = api_client.get("/v1/student/settings")
        assert set_resp.status_code == status.HTTP_200_OK

    def test_student_join_eligibility_and_request_flow(self, api_client, student_user, published_library, locked_published_library):
        token = generate_access_token(user_id=student_user.id, audience=AUDIENCE_STUDENT)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        pub_slug = slugify(published_library.name)

        # 1. Eligibility check when free
        elig_resp = api_client.get(f"/v1/student/libraries/{pub_slug}/join-eligibility")
        assert elig_resp.status_code == status.HTTP_200_OK
        assert elig_resp.json()["data"]["can_join"] is True

        # 2. Submit join request
        main_branch = published_library.branches.first()
        join_resp = api_client.post(
            "/v1/student/join-requests",
            data={
                "org_id": str(published_library.id),
                "branch_id": str(main_branch.id),
                "exam_goal": "GPSC Class 1-2",
            },
            format="json",
        )
        assert join_resp.status_code == status.HTTP_201_CREATED
        req_id = join_resp.json()["data"]["id"]
        assert join_resp.json()["data"]["status"] == "pending"

        # 3. Duplicate request blocked
        dup_resp = api_client.post(
            "/v1/student/join-requests",
            data={
                "org_id": str(published_library.id),
                "branch_id": str(main_branch.id),
            },
            format="json",
        )
        assert dup_resp.status_code == status.HTTP_409_CONFLICT
        assert dup_resp.json()["error"]["code"] == "duplicate_request"

        # 4. View own join requests
        list_resp = api_client.get("/v1/student/join-requests")
        assert list_resp.status_code == status.HTTP_200_OK
        assert len(list_resp.json()["data"]) == 1

        # 5. Live elsewhere rule: Once student is Live in published_library, join-eligibility for another library returns False
        student = Student.objects.get(pk=req_id)
        student.status = "Live"
        student.save()

        locked_slug = slugify(locked_published_library.name)
        elig_elsewhere = api_client.get(f"/v1/student/libraries/{locked_slug}/join-eligibility")
        assert elig_elsewhere.status_code == status.HTTP_200_OK
        assert elig_elsewhere.json()["data"]["can_join"] is False
        assert elig_elsewhere.json()["data"]["reason"] == "live_elsewhere"

        # 6. Attempting to post join request to another library while Live returns 409 student_live_elsewhere
        conflict_resp = api_client.post(
            "/v1/student/join-requests",
            data={
                "org_id": str(locked_published_library.id),
                "branch_id": str(locked_published_library.branches.first().id),
            },
            format="json",
        )
        assert conflict_resp.status_code == status.HTTP_409_CONFLICT
        assert conflict_resp.json()["error"]["code"] == "student_live_elsewhere"
