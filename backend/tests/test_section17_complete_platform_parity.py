"""Comprehensive E2E Verification Tests for Section 17 Platform (Super Admin) APIs.
Validates parity against library_platform_api_design.md Section 17.
"""
import uuid
from decimal import Decimal
import pytest
from django.utils import timezone
from apps.accounts.models import User
from apps.billing.models import LibrarySubscription, PlatformPayment, SubscriptionPlan
from apps.core.jwt import AUDIENCE_PLATFORM, generate_access_token
from apps.libraries.models import ActivityLog, Branch, Library, LibraryRequest
from apps.platform_admin.models import GlobalSetting, SupportTicket


@pytest.fixture
def platform_super_admin(db):
    """Create a platform super admin user with valid token audience."""
    admin = User.objects.create_superuser(
        email="superadmin.audit@shelfspace.in",
        phone="9998887771",
        password="PlatformAdmin123!",
        first_name="Super",
        last_name="Admin",
        role="SUPER_ADMIN",
    )
    admin.email_verified = True
    admin.save()
    return admin


@pytest.fixture
def platform_auth_client(api_client, platform_super_admin):
    """APIClient authenticated as platform super admin with platform audience."""
    token = generate_access_token(platform_super_admin, audience=AUDIENCE_PLATFORM)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return api_client


@pytest.fixture
def sample_library(db, platform_super_admin):
    """Create a sample library for testing detail/action endpoints."""
    owner = User.objects.create_user(
        email="testowner.lib@example.com",
        phone="9988776655",
        password="TestOwner123!",
        first_name="Test",
        last_name="Owner",
        role="LIBRARY_OWNER",
    )
    lib = Library.objects.create(
        name="Apex Central Library",
        code="APEX01",
        city="Pune",
        state="MH",
        address="FC Road",
        library_status="Active",
        plan_status="Active",
        owner=owner,
    )
    Branch.objects.create(library=lib, name="Main Branch", address="FC Road", phone="9988776655", is_main=True)
    plan = SubscriptionPlan.objects.create(
        name="Pro Standard",
        tier=1,
        monthly_fee=Decimal("1999.00"),
        quarterly_fee=Decimal("5499.00"),
        annual_fee=Decimal("19990.00"),
        max_branches=3,
        max_seats=200,
        max_staff=5,
        is_active=True,
    )
    LibrarySubscription.objects.create(
        library=lib,
        plan=plan,
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + timezone.timedelta(days=30),
        status="Active",
        fee_amount=plan.monthly_fee,
    )
    return lib


@pytest.mark.django_db
class TestSection17PlatformAPIsParity:
    """Tests covering all 17.1 to 17.4 endpoints from library_platform_api_design.md."""

    # ------------------------------------------------------------------------
    # 17.1 Dashboard and Analytics
    # ------------------------------------------------------------------------
    def test_17_1_dashboard(self, platform_auth_client, sample_library):
        resp = platform_auth_client.get("/v1/platform/dashboard")
        assert resp.status_code == 200
        assert "libraries" in resp.data
        assert "students_total" in resp.data
        assert "mrr" in resp.data
        assert "kpis" in resp.data

    def test_17_1_analytics(self, platform_auth_client):
        resp = platform_auth_client.get("/v1/platform/analytics?metric=signups&range=7d")
        assert resp.status_code == 200
        assert resp.data.get("metric") == "signups"
        assert "series" in resp.data
        assert "summary" in resp.data

    def test_17_1_activity(self, platform_auth_client, sample_library):
        ActivityLog.objects.create(
            library=sample_library,
            action="library.approved",
            entity_type="Library",
            entity_id=str(sample_library.id),
        )
        resp = platform_auth_client.get("/v1/platform/activity?limit=10")
        assert resp.status_code == 200
        results = resp.data.get("results", resp.data)
        assert len(results) >= 1

    # ------------------------------------------------------------------------
    # 17.2 Library Approval & Lifecycle Management
    # ------------------------------------------------------------------------
    def test_17_2_libraries_list_and_create(self, platform_auth_client, sample_library):
        # GET /v1/platform/libraries
        resp = platform_auth_client.get("/v1/platform/libraries?status=active")
        assert resp.status_code == 200
        results = resp.data.get("data") or resp.data.get("results") or resp.data
        assert any(l["id"] == str(sample_library.id) for l in results)

        # POST /v1/platform/libraries (Manual onboarding)
        post_resp = platform_auth_client.post(
            "/v1/platform/libraries",
            {
                "name": "Onboarded Direct Library",
                "owner_name": "Direct Owner",
                "owner_email": "direct.owner@example.com",
                "owner_phone": "9123456789",
                "city": "Bengaluru",
                "state": "KA",
                "address": "Indiranagar",
            },
            format="json",
        )
        assert post_resp.status_code == 201
        assert "id" in post_resp.data

    def test_17_2_library_detail_and_patch(self, platform_auth_client, sample_library):
        # GET /v1/platform/libraries/{id}
        resp = platform_auth_client.get(f"/v1/platform/libraries/{sample_library.id}")
        assert resp.status_code == 200
        assert resp.data["library"]["id"] == str(sample_library.id)
        assert "subscription" in resp.data
        assert "usage" in resp.data
        assert "commission" in resp.data

        # PATCH /v1/platform/libraries/{id}
        patch_resp = platform_auth_client.patch(
            f"/v1/platform/libraries/{sample_library.id}",
            {
                "commission_enabled": True,
                "commission_percent": 7.5,
                "internal_notes": "Premium enterprise partner",
            },
            format="json",
        )
        assert patch_resp.status_code == 200
        assert patch_resp.data["commission"]["enabled"] is True
        assert patch_resp.data["commission"]["percent"] == 7.5

    def test_17_2_library_lifecycle_actions(self, platform_auth_client, sample_library):
        lib_id = sample_library.id

        # POST /v1/platform/libraries/{id}/suspend
        susp_resp = platform_auth_client.post(
            f"/v1/platform/libraries/{lib_id}/suspend",
            {"reason": "Non-compliance with KYC"},
            format="json",
        )
        assert susp_resp.status_code == 200
        assert susp_resp.data["status"] == "suspended"

        # POST /v1/platform/libraries/{id}/reactivate
        react_resp = platform_auth_client.post(
            f"/v1/platform/libraries/{lib_id}/reactivate",
            {"note": "Compliance verified"},
            format="json",
        )
        assert react_resp.status_code == 200
        assert react_resp.data["status"] == "active"

        # POST /v1/platform/libraries/{id}/impersonate
        imp_resp = platform_auth_client.post(
            f"/v1/platform/libraries/{lib_id}/impersonate",
            {"reason": "Troubleshooting catalog issue"},
            format="json",
        )
        assert imp_resp.status_code == 200
        assert "view_as_token" in imp_resp.data or "token" in imp_resp.data

        # POST /v1/platform/libraries/{id}/archive
        arch_resp = platform_auth_client.post(
            f"/v1/platform/libraries/{lib_id}/archive",
            {"reason": "Account closure"},
            format="json",
        )
        assert arch_resp.status_code in (200, 204)

    def test_17_2_library_request_approval_workflow(self, platform_auth_client):
        req = LibraryRequest.objects.create(
            library_name="Pinnacle Hub",
            owner_name="Pinnacle Admin",
            email="pinnacle.admin@example.com",
            mobile="9876543210",
            city="Mumbai",
            state="MH",
            address="BKC",
            status="Pending",
        )

        # POST /v1/platform/libraries/{id}/request-info
        info_resp = platform_auth_client.post(
            f"/v1/platform/libraries/{req.id}/request-info",
            {"message": "Please attach Electricity bill", "fields": ["utility_bill"]},
            format="json",
        )
        assert info_resp.status_code in (200, 204)

        # POST /v1/platform/libraries/{id}/reject
        rej_req = LibraryRequest.objects.create(
            library_name="Reject Me Lib",
            owner_name="Rej Admin",
            email="rej@example.com",
            mobile="9876543219",
            city="Mumbai",
            state="MH",
            address="Andheri",
            status="Pending",
        )
        rej_resp = platform_auth_client.post(
            f"/v1/platform/libraries/{rej_req.id}/reject",
            {"reason": "Duplicate application"},
            format="json",
        )
        assert rej_resp.status_code == 200
        assert rej_resp.data.get("status") == "rejected"

        # POST /v1/platform/libraries/{id}/approve
        appr_resp = platform_auth_client.post(
            f"/v1/platform/libraries/{req.id}/approve",
            {"note": "Application verified and approved"},
            format="json",
        )
        assert appr_resp.status_code == 200
        assert appr_resp.data.get("status") in ("approved", "active")

    # ------------------------------------------------------------------------
    # 17.3 Platform Plans, Subscriptions, Payments & Invoices
    # ------------------------------------------------------------------------
    def test_17_3_plans_management(self, platform_auth_client):
        # GET /v1/platform/plans
        get_resp = platform_auth_client.get("/v1/platform/plans")
        assert get_resp.status_code == 200

        # POST /v1/platform/plans
        create_resp = platform_auth_client.post(
            "/v1/platform/plans",
            {
                "code": "GROWTH_2026",
                "name": "Growth Pro Tier",
                "monthly_fee": "2499.00",
                "annual_fee": "24990.00",
                "max_branches": 5,
                "max_seats": 500,
                "max_staff": 10,
                "features": ["sms", "biometric", "custom_domain"],
            },
            format="json",
        )
        assert create_resp.status_code == 201
        plan_id = create_resp.data["id"]

        # PATCH /v1/platform/plans/{id}
        patch_resp = platform_auth_client.patch(
            f"/v1/platform/plans/{plan_id}",
            {"name": "Growth Pro Tier Plus", "max_seats": 600},
            format="json",
        )
        assert patch_resp.status_code == 200
        assert patch_resp.data["max_seats"] == 600

        # POST /v1/platform/plans/{id}/archive
        arch_resp = platform_auth_client.post(f"/v1/platform/plans/{plan_id}/archive")
        assert arch_resp.status_code == 200
        assert arch_resp.data.get("is_active") is False

    def test_17_3_subscriptions_management(self, platform_auth_client, sample_library):
        plan = SubscriptionPlan.objects.first()

        # GET /v1/platform/subscriptions
        sub_list_resp = platform_auth_client.get("/v1/platform/subscriptions")
        assert sub_list_resp.status_code == 200

        # POST /v1/platform/libraries/{id}/subscription
        assign_resp = platform_auth_client.post(
            f"/v1/platform/libraries/{sample_library.id}/subscription",
            {
                "platform_plan_id": str(plan.id),
                "status": "active",
                "reason": "Promotional upgrade",
            },
            format="json",
        )
        assert assign_resp.status_code == 200

        # POST /v1/platform/libraries/{id}/subscription/extend
        ext_resp = platform_auth_client.post(
            f"/v1/platform/libraries/{sample_library.id}/subscription/extend",
            {"days": 15, "reason": "Goodwill bonus"},
            format="json",
        )
        assert ext_resp.status_code == 200

    def test_17_3_payments_and_invoices(self, platform_auth_client, sample_library):
        # GET /v1/platform/payments
        get_pay = platform_auth_client.get("/v1/platform/payments")
        assert get_pay.status_code == 200

        # POST /v1/platform/payments/manual
        post_pay = platform_auth_client.post(
            "/v1/platform/payments/manual",
            {
                "org_id": str(sample_library.id),
                "amount": "1999.00",
                "mode": "NEFT",
                "payment_date": timezone.now().date().isoformat(),
                "note": "Quarterly NEFT settlement",
            },
            format="json",
        )
        assert post_pay.status_code in (200, 201)
        payment_id = post_pay.data["id"]

        # POST /v1/platform/payments/{id}/approve
        appr_pay = platform_auth_client.post(
            f"/v1/platform/payments/{payment_id}/approve",
            {"note": "NEFT verified against bank statement"},
            format="json",
        )
        assert appr_pay.status_code == 200
        assert appr_pay.data.get("status") in ("Success", "paid")

        # POST /v1/platform/payments/{id}/refund
        refund_pay = platform_auth_client.post(
            f"/v1/platform/payments/{payment_id}/refund",
            {"amount": "500.00", "reason": "Prorated discount adjustment"},
            format="json",
        )
        assert refund_pay.status_code == 200

        # GET /v1/platform/invoices
        get_inv = platform_auth_client.get("/v1/platform/invoices")
        assert get_inv.status_code == 200
        results = get_inv.data if isinstance(get_inv.data, list) else (get_inv.data.get("data") or get_inv.data.get("results") or [])
        if len(results) > 0:
            inv_id = results[0]["id"]
            # POST /v1/platform/invoices/{id}/resend
            resend_resp = platform_auth_client.post(f"/v1/platform/invoices/{inv_id}/resend")
            assert resend_resp.status_code in (200, 204)

        # GET /v1/platform/revenue
        rev_resp = platform_auth_client.get("/v1/platform/revenue")
        assert rev_resp.status_code == 200
        assert "series" in rev_resp.data

        # GET & PUT /v1/platform/commission
        comm_get = platform_auth_client.get("/v1/platform/commission")
        assert comm_get.status_code == 200

        comm_put = platform_auth_client.put(
            "/v1/platform/commission",
            {"default_enabled": True, "default_percent": 5.0},
            format="json",
        )
        assert comm_put.status_code == 200
        assert comm_put.data.get("default_percent") == 5.0

    # ------------------------------------------------------------------------
    # 17.4 Announcements, Support, Staff, Settings, Jobs
    # ------------------------------------------------------------------------
    def test_17_4_announcements_and_notifications(self, platform_auth_client):
        # GET /v1/platform/announcements
        ann_get = platform_auth_client.get("/v1/platform/announcements")
        assert ann_get.status_code == 200

        # POST /v1/platform/announcements/audience-preview
        prev_resp = platform_auth_client.post(
            "/v1/platform/announcements/audience-preview",
            {"audience": {"cities": ["Pune", "Mumbai"]}},
            format="json",
        )
        assert prev_resp.status_code == 200
        assert "count" in prev_resp.data

        # POST /v1/platform/announcements
        create_ann = platform_auth_client.post(
            "/v1/platform/announcements",
            {
                "title": "Scheduled Platform Upgrade",
                "body": "System will be in maintenance on Sunday midnight.",
                "channels": ["inbox", "email"],
                "audience": {"cities": []},
            },
            format="json",
        )
        assert create_ann.status_code == 201
        ann_id = create_ann.data["id"]

        # PATCH /v1/platform/announcements/{id}
        patch_ann = platform_auth_client.patch(
            f"/v1/platform/announcements/{ann_id}",
            {"title": "Scheduled Upgrade Notice - Revised"},
            format="json",
        )
        assert patch_ann.status_code == 200

        # DELETE /v1/platform/announcements/{id}
        del_ann = platform_auth_client.delete(f"/v1/platform/announcements/{ann_id}")
        assert del_ann.status_code in (200, 204)

    def test_17_4_support_tickets_workflow(self, platform_auth_client, sample_library):
        ticket = SupportTicket.objects.create(
            library=sample_library,
            subject="Invoice generation issue",
            description="GST number not showing on invoice PDF",
            status="Open",
            priority="Medium",
        )

        # GET /v1/platform/support/tickets
        tickets_list = platform_auth_client.get("/v1/platform/support/tickets")
        assert tickets_list.status_code == 200

        # GET /v1/platform/support/tickets/{id}
        ticket_detail = platform_auth_client.get(f"/v1/platform/support/tickets/{ticket.id}")
        assert ticket_detail.status_code == 200

        # POST /v1/platform/support/tickets/{id}/messages
        msg_resp = platform_auth_client.post(
            f"/v1/platform/support/tickets/{ticket.id}/messages",
            {"message": "We have updated your GST profile. Please check again."},
            format="json",
        )
        assert msg_resp.status_code in (200, 201)

        # PATCH /v1/platform/support/tickets/{id}
        patch_ticket = platform_auth_client.patch(
            f"/v1/platform/support/tickets/{ticket.id}",
            {"status": "Resolved"},
            format="json",
        )
        assert patch_ticket.status_code == 200

    def test_17_4_staff_management(self, platform_auth_client):
        # GET /v1/platform/staff
        staff_list = platform_auth_client.get("/v1/platform/staff")
        assert staff_list.status_code == 200

        # POST /v1/platform/staff
        create_staff = platform_auth_client.post(
            "/v1/platform/staff",
            {
                "first_name": "Rohan",
                "last_name": "Sharma",
                "email": "rohan.support@shelfspace.in",
                "mobile": "9812345678",
                "role": "SUPPORT",
            },
            format="json",
        )
        assert create_staff.status_code == 201
        staff_id = create_staff.data["id"]

        # PATCH /v1/platform/staff/{id}
        patch_staff = platform_auth_client.patch(
            f"/v1/platform/staff/{staff_id}",
            {"role": "FINANCE"},
            format="json",
        )
        assert patch_staff.status_code == 200

        # POST /v1/platform/staff/{id}/reset-two-step
        reset_resp = platform_auth_client.post(
            f"/v1/platform/staff/{staff_id}/reset-two-step",
            {"reason": "New phone device"},
            format="json",
        )
        assert reset_resp.status_code in (200, 204)

        # DELETE /v1/platform/staff/{id}
        del_staff = platform_auth_client.delete(
            f"/v1/platform/staff/{staff_id}",
            {"reason": "Offboarding"},
            format="json",
        )
        assert del_staff.status_code in (200, 204)

    def test_17_4_settings_versions_maintenance_and_jobs(self, platform_auth_client):
        # GET & PUT /v1/platform/settings
        set_put = platform_auth_client.put(
            "/v1/platform/settings/manual_payment_approval_limit",
            {"value": 50000},
            format="json",
        )
        assert set_put.status_code == 200

        set_get = platform_auth_client.get("/v1/platform/settings/manual_payment_approval_limit")
        assert set_get.status_code == 200
        assert set_get.data.get("value") == 50000

        # GET & PUT /v1/platform/app-versions
        ver_get = platform_auth_client.get("/v1/platform/app-versions")
        assert ver_get.status_code == 200

        ver_put = platform_auth_client.put(
            "/v1/platform/app-versions/android",
            {"min_version": "1.0.1", "latest_version": "1.3.0", "force_update": False},
            format="json",
        )
        assert ver_put.status_code == 200
        assert ver_put.data.get("latest_version") == "1.3.0"

        # PUT /v1/platform/maintenance
        maint_put = platform_auth_client.put(
            "/v1/platform/maintenance",
            {"enabled": False, "message": "System operational"},
            format="json",
        )
        assert maint_put.status_code == 200

        # GET & PUT & POST /v1/platform/email
        email_get = platform_auth_client.get("/v1/platform/email")
        assert email_get.status_code == 200

        email_test = platform_auth_client.post(
            "/v1/platform/email/test",
            {"to": "admin@shelfspace.in"},
            format="json",
        )
        assert email_test.status_code == 200
        assert email_test.data.get("sent") is True

        # GET & POST /v1/platform/custom-domains
        dom_get = platform_auth_client.get("/v1/platform/custom-domains")
        assert dom_get.status_code == 200

        dom_verify = platform_auth_client.post(f"/v1/platform/custom-domains/{uuid.uuid4()}/verify")
        assert dom_verify.status_code == 200

        # GET & POST /v1/platform/data-requests
        data_get = platform_auth_client.get("/v1/platform/data-requests")
        assert data_get.status_code == 200

        data_post = platform_auth_client.post(
            f"/v1/platform/data-requests/{uuid.uuid4()}/complete",
            {"note": "Completed successfully"},
            format="json",
        )
        assert data_post.status_code == 200

        # GET & POST /v1/platform/jobs
        jobs_get = platform_auth_client.get("/v1/platform/jobs")
        assert jobs_get.status_code == 200

        job_run = platform_auth_client.post(
            "/v1/platform/jobs/refresh_subscription_states/run",
            {"dry_run": False},
            format="json",
        )
        assert job_run.status_code == 202
        assert "run_id" in job_run.data
