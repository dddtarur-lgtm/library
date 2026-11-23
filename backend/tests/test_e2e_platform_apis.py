"""0-to-end tests for all /api/v1/platform/ endpoints (RBAC, CRUD, actions, dashboards, reports)."""
import uuid
from decimal import Decimal
import pytest

from apps.accounts.models import DeletionRequest, User
from apps.billing.models import PlatformPayment
from apps.libraries.models import LibraryRequest
from apps.platform_admin.models import (
    AppFeatureFlag,
    LibraryPublicPage,
    SupportTicket,
    WebsiteContentBlock,
)


@pytest.mark.django_db
class TestPlatformRBACAndEndpointsE2E:
    @pytest.mark.parametrize(
        "endpoint",
        [
            "/api/v1/platform/users/",
            "/api/v1/platform/deletion-requests/",
            "/api/v1/platform/libraries/",
            "/api/v1/platform/library-requests/",
            "/api/v1/platform/students/",
            "/api/v1/platform/plans/",
            "/api/v1/platform/payments/",
            "/api/v1/platform/subscriptions/",
            "/api/v1/platform/notifications/",
            "/api/v1/platform/audit-logs/",
            "/api/v1/platform/dashboard/kpis/",
            "/api/v1/platform/dashboard/expiring-plans/",
            "/api/v1/platform/dashboard/grace-locked/",
            "/api/v1/platform/dashboard/recent-payments/",
            "/api/v1/platform/dashboard/pending-requests/",
            "/api/v1/platform/dashboard/email-health/",
            "/api/v1/platform/reports/revenue/",
            "/api/v1/platform/reports/growth/",
            "/api/v1/platform/reports/plan-distribution/",
            "/api/v1/platform/reports/student-status/",
            "/api/v1/platform/reports/expiry-forecast/",
            "/api/v1/platform/reports/occupancy/",
            "/api/v1/platform/reports/usage/",
            "/api/v1/platform/website-content/",
            "/api/v1/platform/website-content/media/",
            "/api/v1/platform/app-management/",
            "/api/v1/platform/library-pages/",
            "/api/v1/platform/email-health/",
            "/api/v1/platform/support/",
        ],
    )
    def test_platform_endpoints_require_super_admin(self, api_client, auth_client, tenant_a, super_admin, endpoint):
        # Unauthenticated check (platform plans catalog is publicly readable for onboarding pricing)
        if endpoint == "/api/v1/platform/plans/":
            assert api_client.get(endpoint).status_code == 200
        else:
            assert api_client.get(endpoint).status_code == 401

            # Library owner / Staff / Student -> 401 or 403 (Audience rejection or Permission denied)
            for non_admin in (tenant_a["owner"], tenant_a["staff"], tenant_a["student_user"]):
                resp = auth_client(non_admin).get(endpoint)
                assert resp.status_code in (401, 403), f"Expected 401/403 for {non_admin.role} on {endpoint}, got {resp.status_code}"

        # Super Admin -> 200
        resp_admin = auth_client(super_admin).get(endpoint)
        assert resp_admin.status_code == 200, f"Expected 200 for SUPER_ADMIN on {endpoint}, got {resp_admin.status_code}: {resp_admin.data}"

    def test_platform_users_and_deletion_requests_actions(self, auth_client, super_admin, tenant_a):
        admin_client = auth_client(super_admin)

        # Reset password on a platform team member
        platform_member = User.objects.create(
            email="platform-member@example.com",
            role="SUPER_ADMIN",
            first_name="Platform",
            last_name="Member",
        )
        rp = admin_client.post(f"/api/v1/platform/users/{platform_member.id}/reset-password/", {}, format="json")
        assert rp.status_code == 200

        # Create a deletion request and test reject + approve
        dr_reject = DeletionRequest.objects.create(
            target_type="ACCOUNT",
            requested_by=tenant_a["staff"],
            reason="Test reject",
        )
        r1 = admin_client.post(
            f"/api/v1/platform/deletion-requests/{dr_reject.id}/reject/",
            {"review_notes": "Keep active"},
            format="json",
        )
        assert r1.status_code == 200
        dr_reject.refresh_from_db()
        assert dr_reject.status == "Rejected"

        dr_approve = DeletionRequest.objects.create(
            target_type="ACCOUNT",
            requested_by=tenant_a["staff"],
            reason="Test approve",
        )
        r2 = admin_client.post(
            f"/api/v1/platform/deletion-requests/{dr_approve.id}/approve/",
            {"review_notes": "Approved"},
            format="json",
        )
        assert r2.status_code == 200
        dr_approve.refresh_from_db()
        assert dr_approve.status == "Approved"

    def test_platform_libraries_lock_suspend_unlock_and_onboarding_requests(
        self, auth_client, super_admin, tenant_a, subscription_plan
    ):
        admin_client = auth_client(super_admin)
        lib_id = tenant_a["library"].id

        assert admin_client.post(f"/api/v1/platform/libraries/{lib_id}/lock/", {"reason": "Audit"}, format="json").status_code == 200
        assert admin_client.post(f"/api/v1/platform/libraries/{lib_id}/suspend/", {"reason": "Overdue"}, format="json").status_code == 200
        assert admin_client.post(f"/api/v1/platform/libraries/{lib_id}/unlock/", {}, format="json").status_code == 200

        # Non-existent library -> 404
        assert admin_client.get(f"/api/v1/platform/libraries/{uuid.uuid4()}/").status_code == 404

        # Onboarding LibraryRequest approve / reject / request-info
        req_info = LibraryRequest.objects.create(
            library_name="Info Needed Lib",
            owner_name="Info Owner",
            mobile="9800011122",
            email="info-lib@example.com",
            city="Delhi",
            state="DL",
            address="123 Main",
        )
        assert admin_client.post(
            f"/api/v1/platform/library-requests/{req_info.id}/request-info/",
            {"notes": "Need GSTIN"},
            format="json",
        ).status_code == 200

        req_rej = LibraryRequest.objects.create(
            library_name="Reject Lib",
            owner_name="Reject Owner",
            mobile="9800011123",
            email="reject-lib@example.com",
            city="Delhi",
            state="DL",
            address="123 Main",
        )
        assert admin_client.post(
            f"/api/v1/platform/library-requests/{req_rej.id}/reject/",
            {"notes": "Incomplete"},
            format="json",
        ).status_code == 200

        req_app = LibraryRequest.objects.create(
            library_name="Approved New Lib",
            owner_name="Approved Owner",
            mobile="9800011124",
            email="approved-lib@example.com",
            city="Mumbai",
            state="MH",
            address="456 Sea Rd",
        )
        r_app = admin_client.post(
            f"/api/v1/platform/library-requests/{req_app.id}/approve/",
            {},
            format="json",
        )
        assert r_app.status_code == 200, r_app.data

    def test_platform_plans_payments_subscriptions_content_features_pages_support(
        self, auth_client, super_admin, tenant_a
    ):
        admin_client = auth_client(super_admin)

        # Create Plan
        p_resp = admin_client.post(
            "/api/v1/platform/plans/",
            {
                "name": "Enterprise E2E",
                "tier": 3,
                "monthly_fee": "1999.00",
                "quarterly_fee": "5499.00",
                "annual_fee": "19999.00",
                "max_branches": 10,
                "max_seats": 500,
            },
            format="json",
        )
        assert p_resp.status_code == 201, p_resp.data

        # Manual Payment
        pay_resp = admin_client.post(
            "/api/v1/platform/payments/manual/",
            {
                "library": str(tenant_a["library"].id),
                "subscription": str(tenant_a["subscription"].id),
                "amount": "999.00",
                "method": "UPI",
                "type": "Subscription",
                "reference_number": "UPI-E2E-001",
            },
            format="json",
        )
        assert pay_resp.status_code == 201, pay_resp.data
        assert PlatformPayment.objects.filter(reference_number="UPI-E2E-001").exists()

        # Extend Grace
        eg = admin_client.post(
            f"/api/v1/platform/subscriptions/{tenant_a['subscription'].id}/extend-grace/",
            {"days": 7},
            format="json",
        )
        assert eg.status_code == 200

        # Website content section update
        WebsiteContentBlock.objects.create(section="hero", title="Old", content={})
        wc = admin_client.patch(
            "/api/v1/platform/website-content/hero/",
            {"title": "Updated Hero", "is_published": True},
            format="json",
        )
        assert wc.status_code == 200

        # App feature toggle
        AppFeatureFlag.objects.create(feature="qr_kiosk", name="QR Kiosk", is_enabled=True)
        ff = admin_client.patch(
            "/api/v1/platform/app-management/qr_kiosk/",
            {"is_enabled": False},
            format="json",
        )
        assert ff.status_code == 200

        # Library public page approve / reject
        page = LibraryPublicPage.objects.create(
            library=tenant_a["library"],
            slug=f"alpha-page-{uuid.uuid4().hex[:5]}",
            headline="Welcome",
            status="PENDING",
        )
        assert admin_client.post(f"/api/v1/platform/library-pages/{page.id}/approve/", {}, format="json").status_code == 200

        page.status = "PENDING"
        page.save(update_fields=["status"])
        assert admin_client.post(
            f"/api/v1/platform/library-pages/{page.id}/reject/",
            {"rejection_reason": "Policy"},
            format="json",
        ).status_code == 200

        # Support ticket reply
        ticket = SupportTicket.objects.create(
            ticket_number=f"TKT-{uuid.uuid4().hex[:6].upper()}",
            library=tenant_a["library"],
            created_by=tenant_a["owner"],
            subject="Need help",
            description="Details",
        )
        rep = admin_client.post(
            f"/api/v1/platform/support/{ticket.id}/reply/",
            {"message": "Working on it"},
            format="json",
        )
        assert rep.status_code in (200, 201), rep.data

