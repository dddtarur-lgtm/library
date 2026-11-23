"""
Comprehensive Test Suite for Priority 1:
- Live-in-one-library rule
- Token audience boundary enforcement (student != library != platform)
- Tenant isolation (org_id rejected from query/body, accepted only from token)
- Refresh token rotation & family revocation on replay
- Library state gate (423 library_locked vs open routes)
- Dynamic perm_ver check (stale permission rejection)
- Idempotency-Key handling (success replay & conflict on payload mismatch)
"""
import uuid
import pytest
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.core.jwt import (
    AUDIENCE_LIBRARY,
    AUDIENCE_PLATFORM,
    AUDIENCE_STUDENT,
    generate_access_token,
    generate_refresh_token,
    rotate_refresh_token,
)
from apps.core.models import AuthTokenRevocation, OTPChallenge
from apps.libraries.models import Library
from apps.students.models import Student


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
    user = User.objects.create_user(
        email="owner_test@example.com",
        password="Password123!",
        first_name="Owner",
        last_name="Test",
        role="LIBRARY_OWNER",
        phone="9876543210",
    )
    return user


@pytest.fixture
def student_user(db):
    user = User.objects.create_user(
        email="student_test@example.com",
        password="Password123!",
        first_name="Student",
        last_name="Test",
        role="STUDENT",
        phone="9876543211",
    )
    return user


@pytest.fixture
def superadmin_user(db):
    user = User.objects.create_superuser(
        email="superadmin_test@example.com",
        password="Password123!",
        first_name="Super",
        last_name="Admin",
    )
    return user


@pytest.fixture
def active_library(db, owner_user):
    lib = Library.objects.create(
        code="LIB-TST-001",
        name="Active Test Library",
        owner=owner_user,
        city="Mumbai",
        state="Maharashtra",
        address="Test Road",
        phone="9876543210",
        plan_status="Active",
        library_status="Active",
    )
    owner_user.library = lib
    owner_user.save(update_fields=["library"])
    return lib


@pytest.fixture
def locked_library(db):
    owner2 = User.objects.create_user(
        email="locked_owner@example.com",
        password="Password123!",
        first_name="Locked",
        last_name="Owner",
        role="LIBRARY_OWNER",
    )
    lib = Library.objects.create(
        code="LIB-TST-LCK",
        name="Locked Test Library",
        owner=owner2,
        city="Delhi",
        state="Delhi",
        address="Locked Road",
        phone="9876543212",
        plan_status="Locked",
        library_status="Locked",
    )
    owner2.library = lib
    owner2.save(update_fields=["library"])
    return lib


@pytest.mark.django_db
class TestLiveInOneLibraryRule:
    """Core Principle 1: Student can be Live in only one library at a time."""

    def test_student_cannot_be_live_in_two_libraries(self, db, student_user, active_library, locked_library):
        # Create first live enrollment in active_library
        s1 = Student.objects.create(
            user=student_user,
            library=active_library,
            name="Student Test",
            phone="9876543211",
            gender="Male",
            status="Live",
        )
        assert s1.status == "Live"

        # Attempt to create second live enrollment in another library must fail validation
        s2 = Student(
            user=student_user,
            library=locked_library,
            name="Student Test",
            phone="9876543211",
            gender="Male",
            status="Live",
        )
        with pytest.raises(ValidationError) as exc_info:
            s2.save()

        assert "Student can be Live in only one library at a time" in str(exc_info.value)

    def test_student_can_be_pending_in_multiple_libraries(self, db, student_user, active_library, locked_library):
        # Multiple non-live (e.g. pending) enrollments are permitted
        s1 = Student.objects.create(
            user=student_user,
            library=active_library,
            name="Student Test",
            phone="9876543211",
            gender="Male",
            status="Pending",
        )
        s2 = Student.objects.create(
            user=student_user,
            library=locked_library,
            name="Student Test",
            phone="9876543211",
            gender="Male",
            status="Pending",
        )
        assert s1.status == "Pending"
        assert s2.status == "Pending"


@pytest.mark.django_db
class TestAudienceBoundaryAndAreaIsolation:
    """Core Principle 2: Strict Audience Boundaries."""

    def test_student_token_rejected_on_library_endpoints(self, api_client, student_user, active_library):
        token = generate_access_token(
            user_id=student_user.id,
            audience=AUDIENCE_STUDENT,
            extra_claims={"org_id": str(active_library.id)},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/library/branches/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.data["error"]["code"] == "invalid_audience"

    def test_library_token_rejected_on_student_endpoints(self, api_client, owner_user, active_library):
        token = generate_access_token(
            user_id=owner_user.id,
            audience=AUDIENCE_LIBRARY,
            extra_claims={"org_id": str(active_library.id), "member_id": str(owner_user.id)},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/student/profile/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.data["error"]["code"] == "invalid_audience"

    def test_library_token_rejected_on_platform_endpoints(self, api_client, owner_user, active_library):
        token = generate_access_token(
            user_id=owner_user.id,
            audience=AUDIENCE_LIBRARY,
            extra_claims={"org_id": str(active_library.id)},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get("/api/v1/platform/libraries/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.data["error"]["code"] == "invalid_audience"


@pytest.mark.django_db
class TestTenantIsolation:
    """Core Principle 1 & 3: org_id strictly from token, never from body or query."""

    def test_reject_org_id_in_query_param(self, api_client, owner_user, active_library):
        token = generate_access_token(
            user_id=owner_user.id,
            audience=AUDIENCE_LIBRARY,
            extra_claims={"org_id": str(active_library.id), "member_id": str(owner_user.id), "role": "owner"},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.get(f"/api/v1/library/branches/?org_id={active_library.id}")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["error"]["code"] == "org_id_override_forbidden"

    def test_reject_org_id_in_request_body(self, api_client, owner_user, active_library):
        token = generate_access_token(
            user_id=owner_user.id,
            audience=AUDIENCE_LIBRARY,
            extra_claims={"org_id": str(active_library.id), "member_id": str(owner_user.id), "role": "owner"},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = api_client.post(
            "/api/v1/library/branches/",
            data={"name": "New Branch", "org_id": str(active_library.id)},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["error"]["code"] == "org_id_override_forbidden"


@pytest.mark.django_db
class TestRefreshTokenRotationAndFamilyRevocation:
    """Core Principle 2: Refresh token rotation and instant replay revocation."""

    def test_refresh_token_rotation_and_replay_attack_revocation(self, api_client, owner_user):
        refresh_token, family_id = generate_refresh_token(
            user_id=owner_user.id,
            audience=AUDIENCE_LIBRARY,
        )

        # 1. First refresh rotates cleanly
        resp = api_client.post(
            "/v1/auth/token/refresh",
            data={"refresh_token": refresh_token},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        new_refresh = resp.json()["data"]["refresh_token"]
        assert new_refresh != refresh_token

        # 2. Re-submitting the old refresh token triggers replay detection
        replay_resp = api_client.post(
            "/v1/auth/token/refresh",
            data={"refresh_token": refresh_token},
            format="json",
        )
        assert replay_resp.status_code == status.HTTP_401_UNAUTHORIZED
        assert replay_resp.data["error"]["code"] == "invalid_refresh_token"

        # Verify all tokens in the family were revoked
        revoked_records = AuthTokenRevocation.objects.filter(family_id=family_id)
        assert revoked_records.exists()


@pytest.mark.django_db
class TestLibraryStateGate:
    """Core Principle 3: Locked library blocks normal calls with 423, opens billing & support."""

    def test_locked_library_returns_423_on_business_routes(self, api_client, locked_library):
        owner = locked_library.owner
        token = generate_access_token(
            user_id=owner.id,
            audience=AUDIENCE_LIBRARY,
            extra_claims={
                "org_id": str(locked_library.id),
                "member_id": str(owner.id),
                "role": "owner",
            },
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        # Normal business route blocked
        resp = api_client.get("/api/v1/library/branches/")
        assert resp.status_code == status.HTTP_423_LOCKED
        assert resp.json()["error"]["code"] == "library_locked"

    def test_locked_library_allows_open_routes(self, api_client, locked_library):
        owner = locked_library.owner
        token = generate_access_token(
            user_id=owner.id,
            audience=AUDIENCE_LIBRARY,
            extra_claims={
                "org_id": str(locked_library.id),
                "member_id": str(owner.id),
                "role": "owner",
            },
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        # Route containing /billing is open
        resp = api_client.get("/api/v1/library/billing/summary/")
        # May be 200 or 404 depending on data, but must NOT be 423
        assert resp.status_code != status.HTTP_423_LOCKED


@pytest.mark.django_db
class TestPermVerStaleness:
    """Core Principle 2: Dynamic perm_ver rejection."""

    def test_stale_perm_ver_rejected(self, api_client, owner_user, active_library):
        # Set member perm_ver in cache to 2
        cache.set(f"lib:member:{owner_user.id}:perm_ver", 2, timeout=300)

        # Token with older perm_ver 1
        stale_token = generate_access_token(
            user_id=owner_user.id,
            audience=AUDIENCE_LIBRARY,
            extra_claims={
                "org_id": str(active_library.id),
                "member_id": str(owner_user.id),
                "role": "owner",
                "perm_ver": 1,
            },
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {stale_token}")

        resp = api_client.get("/api/v1/library/branches/")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
        assert resp.data["error"]["code"] == "permission_version_stale"


@pytest.mark.django_db
class TestIdempotency:
    """Core Principle 5: Idempotency-Key support."""

    def test_idempotent_replay_and_conflict(self, api_client):
        idem_key = str(uuid.uuid4())
        headers = {"HTTP_IDEMPOTENCY_KEY": idem_key}

        # First call: OTP request
        payload = {"mobile": "9876543210", "purpose": "login"}
        resp1 = api_client.post("/v1/auth/otp/request", data=payload, format="json", **headers)
        assert resp1.status_code == status.HTTP_200_OK

        # Replay with same key and same body returns identical result
        resp2 = api_client.post("/v1/auth/otp/request", data=payload, format="json", **headers)
        assert resp2.status_code == status.HTTP_200_OK
        assert resp2.json()["data"]["request_id"] == resp1.json()["data"]["request_id"]

        # Call with same key but DIFFERENT body returns 409 conflict
        diff_payload = {"mobile": "9876543211", "purpose": "signup"}
        resp3 = api_client.post("/v1/auth/otp/request", data=diff_payload, format="json", **headers)
        assert resp3.status_code == status.HTTP_409_CONFLICT
        assert resp3.json()["error"]["code"] == "idempotency_conflict"


@pytest.mark.django_db
class TestAuthAPIsSection7:
    """Full lifecycle tests for Section 7 Auth Endpoints."""

    def test_student_otp_request_verify_and_signup(self, api_client):
        # 1. Request OTP
        req_resp = api_client.post(
            "/v1/auth/otp/request",
            data={"mobile": "9876500001", "purpose": "signup"},
            format="json",
        )
        assert req_resp.status_code == status.HTTP_200_OK
        assert req_resp.json()["data"]["is_new_user"] is True

        # Retrieve the challenge
        challenge = OTPChallenge.objects.filter(phone="9876500001", purpose="signup").latest("created_at")
        # In test environment, let's bypass with mock code by setting hash or static OTP
        import hashlib
        raw_code = "123456"
        challenge.code_hash = hashlib.sha256(raw_code.encode("utf-8")).hexdigest()
        challenge.save()

        # 2. Verify OTP (new user -> returns signup_token)
        ver_resp = api_client.post(
            "/v1/auth/otp/verify",
            data={"mobile": "9876500001", "code": raw_code, "purpose": "signup"},
            format="json",
        )
        assert ver_resp.status_code == status.HTTP_200_OK
        signup_token = ver_resp.json()["data"]["signup_token"]
        assert signup_token is not None

        # 3. Complete student signup
        signup_resp = api_client.post(
            "/v1/auth/student/signup",
            data={
                "signup_token": signup_token,
                "first_name": "Rohan",
                "last_name": "Sharma",
                "gender": "Male",
                "email": "rohan@example.com",
            },
            format="json",
        )
        assert signup_resp.status_code == status.HTTP_201_CREATED
        student_data = signup_resp.json()["data"]
        assert student_data["access_token"] is not None
        assert student_data["user"]["first_name"] == "Rohan"

    def test_library_register_and_login(self, api_client):
        # Generate signup token for library registration
        from apps.core.jwt import generate_intermediate_token, SIGNUP_TOKEN_LIFETIME
        signup_token = generate_intermediate_token(
            {"mobile": "9876500002", "purpose": "library_signup"},
            token_type="signup",
            lifetime=SIGNUP_TOKEN_LIFETIME,
        )

        reg_resp = api_client.post(
            "/v1/auth/library/register",
            data={
                "signup_token": signup_token,
                "owner": {
                    "first_name": "Vikram",
                    "last_name": "Patel",
                    "email": "vikram@mylibrary.com",
                    "password": "SecurePassword123!",
                },
                "library": {
                    "name": "Vikram Study Library",
                    "city": "Surat",
                    "address_line1": "Ring Road",
                    "pin_code": "395002",
                    "contact_number": "9876500002",
                },
                "accept_terms": True,
            },
            format="json",
        )
        assert reg_resp.status_code == status.HTTP_201_CREATED
        reg_data = reg_resp.json()["data"]
        assert reg_data["library"]["name"] == "Vikram Study Library"
        assert reg_data["access_token"] is not None

        # Login with newly registered library credentials
        login_resp = api_client.post(
            "/v1/auth/library/login",
            data={
                "identifier": "vikram@mylibrary.com",
                "password": "SecurePassword123!",
            },
            format="json",
        )
        assert login_resp.status_code == status.HTTP_200_OK
        login_data = login_resp.json()["data"]
        assert login_data["access_token"] is not None
        assert login_data["member"]["role"] == "owner"

    def test_platform_login_and_auth_me(self, api_client, superadmin_user):
        login_resp = api_client.post(
            "/v1/auth/platform/login",
            data={
                "email": "superadmin_test@example.com",
                "password": "Password123!",
            },
            format="json",
        )
        assert login_resp.status_code == status.HTTP_200_OK
        access_token = login_resp.json()["data"]["access_token"]

        # Call GET /v1/auth/me
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        me_resp = api_client.get("/v1/auth/me")
        assert me_resp.status_code == status.HTTP_200_OK
        assert me_resp.json()["data"]["audience"] == AUDIENCE_PLATFORM
        assert me_resp.json()["data"]["user"]["email"] == "superadmin_test@example.com"

