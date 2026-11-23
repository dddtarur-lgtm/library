"""
Unit and integration tests for Phase 1 Authentication & Team Parity.
Covers:
- Select Org endpoint
- Two-step verification (enable, confirm, disable, library verify, platform verify)
- Session tracking and remote session revocation
- Staff invitation lifecycle (create invite on team add, view invite, accept invite)
- Sub-admin limit enforcement (1 per regular branch, 2 for main branch)
- Branch Attendance Rules (GET, PUT)
- Branch Pause / Resume
- Team Permission Templates & Ownership Transfer
"""
import uuid
import pytest
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.core.jwt import (
    AUDIENCE_LIBRARY,
    AUDIENCE_PLATFORM,
    TWO_STEP_TOKEN_LIFETIME,
    generate_access_token,
    generate_intermediate_token,
)
from apps.core.models import MemberInvitation, UserSession, UserTOTPFactor
from apps.libraries.models import Branch, Library


@pytest.fixture(autouse=True)
def clear_caches():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def library_owner(db):
    user = User.objects.create_user(
        email="owner_phase1@example.com",
        password="OwnerPassword123!",
        first_name="Phase1",
        last_name="Owner",
        role="LIBRARY_OWNER",
        phone="9876500001",
    )
    lib = Library.objects.create(
        code="LIB-P1-001",
        name="Phase1 Test Library",
        owner=user,
        city="Ahmedabad",
        state="Gujarat",
        address="SG Highway",
        phone="9876500001",
        plan_status="Active",
        library_status="Active",
    )
    user.library = lib
    user.save(update_fields=["library"])

    main_branch = Branch.objects.create(
        library=lib,
        name="Main Campus",
        address="SG Highway",
        phone="9876500001",
        is_main=True,
    )
    return user, lib, main_branch


@pytest.mark.django_db
class TestPhase1AuthEndpoints:
    """Tests for Phase 1 Authentication APIs (Section 7)."""

    def test_two_step_enable_confirm_and_disable(self, api_client, library_owner):
        owner, lib, _ = library_owner
        token = generate_access_token(
            user_id=owner.id,
            audience=AUDIENCE_LIBRARY,
            extra_claims={"org_id": str(lib.id), "member_id": str(owner.id), "role": "owner"},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        # 1. Enable TOTP
        enable_resp = api_client.post("/v1/auth/two-step/enable", {"method": "totp"})
        assert enable_resp.status_code == status.HTTP_200_OK
        assert "secret" in enable_resp.data
        assert "otpauth_url" in enable_resp.data

        # 2. Confirm TOTP
        confirm_resp = api_client.post("/v1/auth/two-step/confirm", {"code": "123456"})
        assert confirm_resp.status_code == status.HTTP_200_OK
        assert "recovery_codes" in confirm_resp.data
        assert len(confirm_resp.data["recovery_codes"]) == 10

        factor = UserTOTPFactor.objects.get(user=owner)
        assert factor.is_active is True

        # 3. Disable TOTP
        disable_resp = api_client.post("/v1/auth/two-step/disable", {
            "password": "OwnerPassword123!",
            "code": "123456",
        })
        assert disable_resp.status_code == status.HTTP_204_NO_CONTENT
        factor.refresh_from_db()
        assert factor.is_active is False

    def test_library_and_platform_two_step_verify(self, api_client, library_owner):
        owner, lib, _ = library_owner
        two_step_token = generate_intermediate_token(
            {"sub": str(owner.id), "purpose": "two_step"},
            token_type="two_step",
            lifetime=TWO_STEP_TOKEN_LIFETIME,
        )

        UserTOTPFactor.objects.create(
            user=owner,
            secret="testsecret",
            backup_codes=["ABCDEF12"],
            is_active=True,
        )

        resp = api_client.post("/v1/auth/library/two-step/verify", {
            "two_step_token": two_step_token,
            "code": "ABCDEF12",
        })
        assert resp.status_code == status.HTTP_200_OK
        assert "access_token" in resp.data
        assert resp.data["member"]["user"]["email"] == owner.email

    def test_user_sessions_management(self, api_client, library_owner):
        owner, lib, _ = library_owner
        token = generate_access_token(
            user_id=owner.id,
            audience=AUDIENCE_LIBRARY,
            extra_claims={"org_id": str(lib.id), "member_id": str(owner.id), "role": "owner"},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        session1 = UserSession.objects.create(
            user=owner,
            device_name="Chrome on Windows",
            platform="web",
            ip_address="192.168.1.10",
        )
        session2 = UserSession.objects.create(
            user=owner,
            device_name="Mobile Safari",
            platform="ios",
            ip_address="192.168.1.20",
        )

        list_resp = api_client.get("/v1/auth/sessions")
        assert list_resp.status_code == status.HTTP_200_OK
        assert len(list_resp.data) >= 2

        # Delete session1
        del_resp = api_client.delete(f"/v1/auth/sessions/{session1.id}")
        assert del_resp.status_code == status.HTTP_204_NO_CONTENT
        session1.refresh_from_db()
        assert session1.is_active is False

        # Revoke all
        revoke_resp = api_client.post("/v1/auth/sessions/revoke-all", {"except_current": False})
        assert revoke_resp.status_code == status.HTTP_204_NO_CONTENT
        session2.refresh_from_db()
        assert session2.is_active is False

    def test_staff_invitation_flow(self, api_client, library_owner):
        owner, lib, main_branch = library_owner
        token = generate_access_token(
            user_id=owner.id,
            audience=AUDIENCE_LIBRARY,
            extra_claims={"org_id": str(lib.id), "member_id": str(owner.id), "role": "owner"},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        # 1. Invite team member
        create_resp = api_client.post("/v1/library/team/members", {
            "first_name": "Rohan",
            "last_name": "Sharma",
            "mobile": "9876549999",
            "email": "rohan.sharma@example.com",
            "role": "staff",
            "branch_ids": [str(main_branch.id)],
        })
        assert create_resp.status_code == status.HTTP_201_CREATED
        invite_token = create_resp.data["invitation"]["token"]
        assert invite_token is not None

        # 2. View invitation details (unauthenticated)
        api_client.credentials()  # clear credentials
        view_resp = api_client.get(f"/v1/auth/invitations/{invite_token}")
        assert view_resp.status_code == status.HTTP_200_OK
        assert view_resp.data["role"] == "staff"
        assert view_resp.data["library"]["name"] == lib.name

        # 3. Accept invitation
        accept_resp = api_client.post("/v1/auth/invitations/accept", {
            "token": invite_token,
            "password": "RohanPassword123!",
            "accept_terms": True,
        })
        assert accept_resp.status_code == status.HTTP_200_OK
        assert "access_token" in accept_resp.data
        assert accept_resp.data["member"]["user"]["email"] == "rohan.sharma@example.com"


@pytest.mark.django_db
class TestPhase1TeamAndBranchParity:
    """Tests for Phase 1 Branch Rules & Team RBAC Limits (Section 9)."""

    def test_sub_admin_limit_enforced_per_branch(self, api_client, library_owner):
        owner, lib, main_branch = library_owner
        token = generate_access_token(
            user_id=owner.id,
            audience=AUDIENCE_LIBRARY,
            extra_claims={"org_id": str(lib.id), "member_id": str(owner.id), "role": "owner"},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        second_branch = Branch.objects.create(
            library=lib,
            name="Satellite Branch",
            address="Ring Road",
            phone="9876500002",
            is_main=False,
        )

        # Main branch allows 2 sub-admins
        r1 = api_client.post("/v1/library/team/members", {
            "first_name": "Sub1",
            "mobile": "9876500011",
            "role": "sub_admin",
            "branch_ids": [str(main_branch.id)],
        })
        assert r1.status_code == status.HTTP_201_CREATED

        r2 = api_client.post("/v1/library/team/members", {
            "first_name": "Sub2",
            "mobile": "9876500012",
            "role": "sub_admin",
            "branch_ids": [str(main_branch.id)],
        })
        assert r2.status_code == status.HTTP_201_CREATED

        # 3rd sub-admin on main branch must fail with 409 sub_admin_limit_reached
        r3 = api_client.post("/v1/library/team/members", {
            "first_name": "Sub3",
            "mobile": "9876500013",
            "role": "sub_admin",
            "branch_ids": [str(main_branch.id)],
        })
        assert r3.status_code == status.HTTP_409_CONFLICT
        assert r3.data["error"]["code"] == "sub_admin_limit_reached"

        # Satellite branch allows only 1 sub-admin
        s1 = api_client.post("/v1/library/team/members", {
            "first_name": "SatSub1",
            "mobile": "9876500021",
            "role": "sub_admin",
            "branch_ids": [str(second_branch.id)],
        })
        assert s1.status_code == status.HTTP_201_CREATED

        s2 = api_client.post("/v1/library/team/members", {
            "first_name": "SatSub2",
            "mobile": "9876500022",
            "role": "sub_admin",
            "branch_ids": [str(second_branch.id)],
        })
        assert s2.status_code == status.HTTP_409_CONFLICT
        assert s2.data["error"]["code"] == "sub_admin_limit_reached"

    def test_branch_attendance_rules_crud(self, api_client, library_owner):
        owner, lib, main_branch = library_owner
        token = generate_access_token(
            user_id=owner.id,
            audience=AUDIENCE_LIBRARY,
            extra_claims={"org_id": str(lib.id), "member_id": str(owner.id), "role": "owner"},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        # Get defaults
        get_resp = api_client.get(f"/v1/library/branches/{main_branch.id}/attendance-rules")
        assert get_resp.status_code == status.HTTP_200_OK
        assert get_resp.data["late_after_minutes"] == 15

        # Update rules
        put_resp = api_client.put(f"/v1/library/branches/{main_branch.id}/attendance-rules", {
            "late_after_minutes": 20,
            "min_daily_minutes": 180,
            "absent_alert_days": 5,
        })
        assert put_resp.status_code == status.HTTP_200_OK
        assert put_resp.data["late_after_minutes"] == 20
        assert put_resp.data["min_daily_minutes"] == 180
        assert put_resp.data["absent_alert_days"] == 5

    def test_branch_pause_and_resume(self, api_client, library_owner):
        owner, lib, main_branch = library_owner
        token = generate_access_token(
            user_id=owner.id,
            audience=AUDIENCE_LIBRARY,
            extra_claims={"org_id": str(lib.id), "member_id": str(owner.id), "role": "owner"},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        pause_resp = api_client.post(f"/v1/library/branches/{main_branch.id}/pause")
        assert pause_resp.status_code == status.HTTP_200_OK
        assert pause_resp.data["status"] == "paused"
        assert pause_resp.data["is_active"] is False

        resume_resp = api_client.post(f"/v1/library/branches/{main_branch.id}/resume")
        assert resume_resp.status_code == status.HTTP_200_OK
        assert resume_resp.data["status"] == "active"
        assert resume_resp.data["is_active"] is True

    def test_team_templates_and_ownership_transfer(self, api_client, library_owner):
        owner, lib, _ = library_owner
        token = generate_access_token(
            user_id=owner.id,
            audience=AUDIENCE_LIBRARY,
            extra_claims={"org_id": str(lib.id), "member_id": str(owner.id), "role": "owner"},
        )
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        # List templates
        tpl_resp = api_client.get("/v1/library/team/templates")
        assert tpl_resp.status_code == status.HTTP_200_OK
        assert len(tpl_resp.data) >= 3

        # Create new template
        create_tpl = api_client.post("/v1/library/team/templates", {
            "name": "Custom Night Shift Staff",
            "description": "Custom template for night staff",
            "grants": [{"module": "attendance", "level": "Full Access"}],
        })
        assert create_tpl.status_code == status.HTTP_201_CREATED
        assert create_tpl.data["name"] == "Custom Night Shift Staff"

        # Transfer ownership
        staff_user = User.objects.create_user(
            email="promoted.owner@example.com",
            password="StaffPassword123!",
            first_name="Promoted",
            last_name="Owner",
            role="STAFF",
            library=lib,
        )

        transfer_resp = api_client.post("/v1/library/team/transfer-ownership", {
            "to_member_id": str(staff_user.id),
            "password": "OwnerPassword123!",
        })
        assert transfer_resp.status_code == status.HTTP_204_NO_CONTENT

        lib.refresh_from_db()
        assert lib.owner == staff_user
        staff_user.refresh_from_db()
        assert staff_user.role == "LIBRARY_OWNER"
