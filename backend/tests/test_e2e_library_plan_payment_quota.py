"""0-to-end tests for Library Plan Selection, Payment Verification, and Quota Enforcement."""
from decimal import Decimal
import uuid
import pytest

from apps.billing.models import LibrarySubscription, PlatformPayment, SubscriptionPlan
from apps.libraries.models import Branch


@pytest.mark.django_db
class TestLibraryPlanPaymentAndQuotaE2E:
    def test_browse_plans_and_initiate_pending_payment(self, auth_client, tenant_a, subscription_plan):
        owner_c = auth_client(tenant_a["owner"])

        # 1. Browse active plans
        res_plans = owner_c.get("/api/v1/library/billing/plans/")
        assert res_plans.status_code == 200
        plan_list = res_plans.data.get("data", res_plans.data)
        assert len(plan_list) >= 1
        assert any(p["id"] == str(subscription_plan.id) for p in plan_list)

        # 2. Select plan with initiate_only=True (Pending checkout flow)
        res_init = owner_c.post(
            "/api/v1/library/billing/select-plan/",
            {
                "plan_id": str(subscription_plan.id),
                "billing_cycle": "Monthly",
                "method": "UPI",
                "reference_number": "UPI-INIT-001",
                "initiate_only": True,
            },
            format="json",
        )
        assert res_init.status_code == 201, res_init.data
        data = res_init.data.get("data", res_init.data)
        sub_data = data["subscription"]
        pay_data = data["payment"]

        assert sub_data["status"] == "Pending"
        assert pay_data["status"] == "Pending"
        assert pay_data["transaction_id"].startswith("TXN-")
        txn_id = pay_data["transaction_id"]

        # 3. Confirm / verify payment via library endpoint
        res_ver = owner_c.post(
            "/api/v1/library/billing/payments/verify/",
            {
                "transaction_id": txn_id,
                "reference_number": "UTR-12345678",
                "notes": "Verified via UPI gateway webhook",
            },
            format="json",
        )
        assert res_ver.status_code == 200, res_ver.data

        # Verify DB state
        pay_obj = PlatformPayment.objects.get(transaction_id=txn_id)
        assert pay_obj.status == "Success"
        assert pay_obj.paid_at is not None
        assert pay_obj.reference_number == "UTR-12345678"

        sub_obj = pay_obj.subscription
        assert sub_obj.status == "Active"

        tenant_a["library"].refresh_from_db()
        assert tenant_a["library"].plan_status == "Active"

    def test_super_admin_verify_and_fail_platform_payment_actions(
        self, auth_client, super_admin, tenant_a, subscription_plan
    ):
        admin_c = auth_client(super_admin)
        owner_c = auth_client(tenant_a["owner"])

        # Create two pending payments
        init1 = owner_c.post(
            "/api/v1/library/billing/select-plan/",
            {
                "plan_id": str(subscription_plan.id),
                "billing_cycle": "Monthly",
                "method": "Bank Transfer",
                "initiate_only": True,
            },
            format="json",
        ).data.get("data")
        pay1_id = init1["payment"]["id"]

        init2 = owner_c.post(
            "/api/v1/library/billing/select-plan/",
            {
                "plan_id": str(subscription_plan.id),
                "billing_cycle": "Monthly",
                "method": "Cheque",
                "initiate_only": True,
            },
            format="json",
        ).data.get("data")
        pay2_id = init2["payment"]["id"]

        # Super Admin verifies pay1
        ver_resp = admin_c.post(
            f"/api/v1/platform/payments/{pay1_id}/verify/",
            {"reference_number": "NEFT-CONFIRMED-99", "notes": "Bank credited"},
            format="json",
        )
        assert ver_resp.status_code == 200
        p1 = PlatformPayment.objects.get(id=pay1_id)
        assert p1.status == "Success"
        assert p1.subscription.status == "Active"

        # Super Admin fails pay2
        fail_resp = admin_c.post(
            f"/api/v1/platform/payments/{pay2_id}/fail/",
            {"notes": "Cheque bounced"},
            format="json",
        )
        assert fail_resp.status_code == 200
        p2 = PlatformPayment.objects.get(id=pay2_id)
        assert p2.status == "Failed"
        assert p2.subscription.status == "Cancelled"

    def test_library_billing_dashboard_includes_entitlements_and_usage(
        self, auth_client, tenant_a
    ):
        owner_c = auth_client(tenant_a["owner"])
        res = owner_c.get("/api/v1/library/billing/")
        assert res.status_code == 200, res.data
        data = res.data.get("data", res.data)

        assert "library" in data
        assert "subscription" in data
        assert "entitlements" in data
        assert "usage" in data
        assert "invoices" in data

        usage = data["usage"]
        assert "branches_used" in usage
        assert "seats_used" in usage
        assert "students_used" in usage
        assert "staff_used" in usage
        assert usage["branches_used"] >= 1

    def test_plan_quota_enforcement(self, auth_client, tenant_a):
        """Enforce max_branches, max_seats, max_students, and max_staff quotas."""
        owner_c = auth_client(tenant_a["owner"])

        # Create a restricted plan: max 1 branch, 1 seat, 1 student, 1 staff
        tight_plan = SubscriptionPlan.objects.create(
            name="Strict Quota Plan",
            tier=10,
            monthly_fee=Decimal("499.00"),
            quarterly_fee=Decimal("1399.00"),
            annual_fee=Decimal("4999.00"),
            max_branches=1,
            max_seats=1,
            max_students=1,
            max_staff=1,
            is_active=True,
        )

        # Switch tenant_a to this tight plan
        owner_c.post(
            "/api/v1/library/billing/select-plan/",
            {
                "plan_id": str(tight_plan.id),
                "billing_cycle": "Monthly",
                "method": "UPI",
                "initiate_only": False,
            },
            format="json",
        )

        # tenant_a already has 1 branch (Alpha Main Branch). Creating 2nd branch must fail with 400.
        res_b = owner_c.post(
            "/api/v1/library/branches/",
            {"name": "Overflow Branch", "address": "999 St", "phone": "9810000000"},
            format="json",
        )
        assert res_b.status_code == 400
        assert "limit" in str(res_b.data).lower()

        # tenant_a currently has 0 seats in Alpha Main Branch.
        # Create 1st seat -> 201
        res_s1 = owner_c.post(
            "/api/v1/library/seats/",
            {"branch": str(tenant_a["branch"].id), "label": "Q-01", "floor": "1"},
            format="json",
        )
        assert res_s1.status_code == 201

        # Create 2nd seat -> 400 (quota is 1)
        res_s2 = owner_c.post(
            "/api/v1/library/seats/",
            {"branch": str(tenant_a["branch"].id), "label": "Q-02", "floor": "1"},
            format="json",
        )
        assert res_s2.status_code == 400
        assert "limit" in str(res_s2.data).lower()

        # tenant_a already has 1 student (Student Alpha).
        # Creating 2nd student must fail with 400.
        res_stu = owner_c.post(
            "/api/v1/library/students/",
            {
                "name": "Second Student",
                "email": "second.stu@example.com",
                "phone": "9988776655",
                "gender": "Male",
                "branch": str(tenant_a["branch"].id),
            },
            format="json",
        )
        assert res_stu.status_code == 400
        assert "limit" in str(res_stu.data).lower()

        # tenant_a already has 2 staff members (sub_admin + staff).
        # Inviting another staff must fail with 400.
        res_staff = owner_c.post(
            "/api/v1/library/staff/invite/",
            {
                "email": "overflow.staff@example.com",
                "first_name": "Overflow",
                "last_name": "Staff",
                "role": "STAFF",
            },
            format="json",
        )
        assert res_staff.status_code == 400
        assert "limit" in str(res_staff.data).lower()

    def test_cross_tenant_payment_verification_blocked(self, auth_client, tenant_a, tenant_b, subscription_plan):
        # Tenant A initiates pending payment
        owner_a = auth_client(tenant_a["owner"])
        init_a = owner_a.post(
            "/api/v1/library/billing/select-plan/",
            {
                "plan_id": str(subscription_plan.id),
                "billing_cycle": "Monthly",
                "method": "UPI",
                "initiate_only": True,
            },
            format="json",
        ).data.get("data")
        txn_id = init_a["payment"]["transaction_id"]

        # Tenant B attempts to verify Tenant A's payment -> 400
        owner_b = auth_client(tenant_b["owner"])
        res_bad = owner_b.post(
            "/api/v1/library/billing/payments/verify/",
            {"transaction_id": txn_id, "reference_number": "ATTACK"},
            format="json",
        )
        assert res_bad.status_code == 400

