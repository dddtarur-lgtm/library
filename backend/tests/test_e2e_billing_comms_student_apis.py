"""0-to-end tests for Library billing, notifications, audit, reports, email, support, and Student Portal APIs."""
from datetime import date, timedelta
import uuid
import pytest


@pytest.mark.django_db
class TestLibraryBillingCommsAndStudentE2E:
    def test_billing_fee_plans_coupons_cashbook(self, auth_client, tenant_a, tenant_b, subscription_plan):
        owner_c = auth_client(tenant_a["owner"])

        assert owner_c.get("/api/v1/library/billing/").status_code == 200
        assert owner_c.get("/api/v1/library/billing/invoices/").status_code == 200
        assert owner_c.get("/api/v1/library/fee-dues/").status_code == 200

        ren = owner_c.post(
            "/api/v1/library/billing/renew/",
            {"plan_id": str(subscription_plan.id), "billing_cycle": "MONTHLY"},
            format="json",
        )
        assert ren.status_code in (200, 201), ren.data

        # Fee Plan CRUD
        fp = owner_c.post(
            "/api/v1/library/fee-plans/",
            {"name": "Monthly Desk", "duration_days": 30, "price": "800.00"},
            format="json",
        )
        assert fp.status_code == 201, fp.data
        assert owner_c.get("/api/v1/library/fee-plans/").status_code == 200

        # Coupon create, update, validate, negative min_purchase rejected (400)
        bad_c = owner_c.post(
            "/api/v1/library/coupons/",
            {
                "code": "BADMIN",
                "discount_type": "FLAT",
                "discount_value": "50.00",
                "min_purchase": "-10.00",
                "valid_until": str(date.today() + timedelta(days=30)),
            },
            format="json",
        )
        assert bad_c.status_code == 400

        cp = owner_c.post(
            "/api/v1/library/coupons/",
            {
                "code": "E2ESAVE50",
                "discount_type": "FLAT",
                "discount_value": "50.00",
                "min_purchase": "200.00",
                "valid_until": str(date.today() + timedelta(days=30)),
            },
            format="json",
        )
        assert cp.status_code == 201, cp.data

        val = owner_c.post(
            "/api/v1/library/coupons/validate/",
            {"code": "E2ESAVE50", "amount": "500.00"},
            format="json",
        )
        assert val.status_code == 200, val.data

        # Tenant isolation on coupon
        assert auth_client(tenant_b["owner"]).get(f"/api/v1/library/coupons/{cp.data['id']}/").status_code == 404

        # Cashbook entry
        cb = owner_c.post(
            "/api/v1/library/cashbook/",
            {
                "branch": str(tenant_a["branch"].id),
                "date": str(date.today()),
                "student": str(tenant_a["student"].id),
                "amount": "800.00",
                "payment_mode": "CASH",
                "receipt_no": f"RCP-{uuid.uuid4().hex[:5].upper()}",
                "purpose": "Monthly Fee",
            },
            format="json",
        )
        assert cb.status_code == 201, cb.data
        assert owner_c.get("/api/v1/library/cashbook/").status_code == 200

    def test_notifications_activity_logs_reports_email_and_support(self, auth_client, tenant_a):
        owner_c = auth_client(tenant_a["owner"])

        # Notifications create + send
        notif = owner_c.post(
            "/api/v1/library/notifications/",
            {"title": "Holiday Notice", "body": "Closed Sunday", "audience": "ALL"},
            format="json",
        )
        assert notif.status_code == 201, notif.data
        assert owner_c.post(f"/api/v1/library/notifications/{notif.data['id']}/send/", {}, format="json").status_code == 200

        # Activity logs & Reports
        assert owner_c.get("/api/v1/library/activity-logs/").status_code == 200
        assert owner_c.get("/api/v1/library/reports/").status_code == 200
        assert owner_c.get("/api/v1/library/reports/revenue/").status_code == 200
        assert owner_c.get("/api/v1/library/reports/attendance/").status_code == 200

        # Email management
        assert owner_c.get("/api/v1/library/email-management/smtp/").status_code == 200
        assert owner_c.get("/api/v1/library/email-management/logs/").status_code == 200

        # Support ticket create + reply
        tkt = owner_c.post(
            "/api/v1/library/support/",
            {"subject": "Seat issue", "description": "Need help"},
            format="json",
        )
        assert tkt.status_code == 201, tkt.data
        rep = owner_c.post(
            f"/api/v1/library/support/{tkt.data['id']}/reply/",
            {"message": "Following up"},
            format="json",
        )
        assert rep.status_code in (200, 201), rep.data

    def test_student_portal_endpoints_and_isolation(self, api_client, auth_client, tenant_a):
        # Unauthenticated -> 401
        assert api_client.get("/api/v1/student/profile/").status_code == 401

        # Library owner cannot access student-only endpoints -> 401/403
        assert auth_client(tenant_a["owner"]).get("/api/v1/student/profile/").status_code in (401, 403)

        stu_c = auth_client(tenant_a["student_user"])
        assert stu_c.get("/api/v1/student/profile/").status_code == 200
        assert stu_c.patch("/api/v1/student/profile/", {"college": "COEP"}, format="json").status_code == 200
        assert stu_c.get("/api/v1/student/memberships/").status_code == 200
        assert stu_c.get("/api/v1/student/attendance/").status_code == 200
        assert stu_c.get("/api/v1/student/books/").status_code == 200

        dr = stu_c.post(
            "/api/v1/student/request-delete/",
            {"reason": "Completed course"},
            format="json",
        )
        assert dr.status_code == 201, dr.data

