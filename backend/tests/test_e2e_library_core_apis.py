"""0-to-end tests for Library profile, staff, branches, students, seats, attendance, and books APIs."""
from datetime import date, timedelta
from decimal import Decimal
import uuid
import pytest

from apps.accounts.models import DeletionRequest
from apps.books.models import Book, BookLoan, BookRequest
from apps.seats.models import Seat


@pytest.mark.django_db
class TestLibraryCoreAPIsE2E:
    def test_library_profile_settings_dashboard_onboarding_delete_request(
        self, api_client, auth_client, tenant_a, subscription_plan
    ):
        # Unauthenticated -> 401
        assert api_client.get("/api/v1/library/profile/").status_code == 401

        # Student cannot access library admin dashboard -> 401/403
        assert auth_client(tenant_a["student_user"]).get("/api/v1/library/dashboard/").status_code in (401, 403)

        owner_c = auth_client(tenant_a["owner"])
        assert owner_c.get("/api/v1/library/profile/").status_code == 200
        assert owner_c.patch("/api/v1/library/profile/", {"city": "Nagpur"}, format="json").status_code == 200
        assert owner_c.get("/api/v1/library/settings/").status_code == 200
        assert owner_c.patch("/api/v1/library/settings/", {"grace_days": 5}, format="json").status_code == 200
        assert owner_c.get("/api/v1/library/dashboard/").status_code == 200

        # Onboarding request
        ob = owner_c.post(
            "/api/v1/library/onboarding-request/",
            {
                "library_name": "Second Branch Lib",
                "owner_name": "Owner Alpha",
                "mobile": "9876543211",
                "email": "second@example.com",
                "city": "Pune",
                "state": "MH",
                "address": "22 Rd",
            },
            format="json",
        )
        assert ob.status_code == 201, ob.data

        # Library deletion request
        dr = owner_c.post(
            "/api/v1/library/request-delete/",
            {"reason": "Closing branch"},
            format="json",
        )
        assert dr.status_code == 201, dr.data

    def test_staff_invite_permissions_and_branches_qr_kiosk(self, auth_client, tenant_a, tenant_b):
        owner_c = auth_client(tenant_a["owner"])

        assert owner_c.get("/api/v1/library/staff/").status_code == 200
        inv = owner_c.post(
            "/api/v1/library/staff/invite/",
            {
                "email": f"invited-{uuid.uuid4().hex[:5]}@example.com",
                "first_name": "Invited",
                "last_name": "Staff",
                "phone": f"97{uuid.uuid4().hex[:8]}",
                "role": "STAFF",
            },
            format="json",
        )
        assert inv.status_code == 201, inv.data
        staff_id = inv.data["id"]

        perm = owner_c.patch(
            f"/api/v1/library/staff/{staff_id}/permissions/",
            {"students": True, "books": True},
            format="json",
        )
        assert perm.status_code == 200

        # Branches & QR Kiosk
        assert owner_c.get("/api/v1/library/branches/").status_code == 200
        b_create = owner_c.post(
            "/api/v1/library/branches/",
            {"name": "West Wing", "address": "99 West St", "phone": "9812345678"},
            format="json",
        )
        assert b_create.status_code == 201, b_create.data
        branch_id = b_create.data["id"]

        assert owner_c.get(f"/api/v1/library/branches/{branch_id}/qr-kiosk/").status_code == 200
        assert owner_c.post(f"/api/v1/library/branches/{branch_id}/qr-kiosk/regenerate/", {}, format="json").status_code == 200

        # Cross-tenant isolation: Owner B cannot access Owner A's branch
        assert auth_client(tenant_b["owner"]).get(f"/api/v1/library/branches/{branch_id}/").status_code == 404

    def test_students_crud_subresources_and_deletion_requests(self, auth_client, tenant_a, tenant_b):
        owner_c = auth_client(tenant_a["owner"])
        sid = tenant_a["student"].id

        assert owner_c.get("/api/v1/library/students/").status_code == 200
        assert owner_c.get(f"/api/v1/library/students/{sid}/").status_code == 200
        for sub in ("analytics", "attendance", "books", "memberships", "payments", "seat-history"):
            assert owner_c.get(f"/api/v1/library/students/{sid}/{sub}/").status_code == 200

        assert owner_c.post(f"/api/v1/library/students/{sid}/send-reminder/", {}, format="json").status_code == 200
        assert owner_c.post(f"/api/v1/library/students/{sid}/suspend/", {}, format="json").status_code == 200

        # Cross-tenant student isolation
        assert auth_client(tenant_b["owner"]).get(f"/api/v1/library/students/{sid}/").status_code == 404

        # Student deletion request approve/reject
        sdr = DeletionRequest.objects.create(
            target_type="STUDENT",
            requested_by=tenant_a["student_user"],
            library=tenant_a["library"],
            student=tenant_a["student"],
            reason="Graduated",
        )
        assert owner_c.get("/api/v1/library/student-deletion-requests/").status_code == 200
        assert owner_c.post(
            f"/api/v1/library/student-deletion-requests/{sdr.id}/reject/",
            {"review_notes": "Hold"},
            format="json",
        ).status_code == 200

    def test_seats_templates_assign_release_delete_guard_and_attendance(self, auth_client, tenant_a, tenant_b):
        owner_c = auth_client(tenant_a["owner"])
        branch = tenant_a["branch"]
        student = tenant_a["student"]

        assert owner_c.get("/api/v1/library/seats/templates/").status_code == 200
        s_resp = owner_c.post(
            "/api/v1/library/seats/",
            {"branch": str(branch.id), "label": "E2E-01", "floor": "1", "zone": "Quiet"},
            format="json",
        )
        assert s_resp.status_code == 201, s_resp.data
        seat_id = s_resp.data["id"]

        # Assign seat
        asg = owner_c.post(
            f"/api/v1/library/seats/{seat_id}/assign/",
            {"student_id": str(student.id)},
            format="json",
        )
        assert asg.status_code == 200, asg.data

        # Occupied seat cannot be deleted -> 400
        del_occ = owner_c.delete(f"/api/v1/library/seats/{seat_id}/")
        assert del_occ.status_code == 400

        # Release seat, then delete succeeds
        rel = owner_c.post(f"/api/v1/library/seats/{seat_id}/release/", {}, format="json")
        assert rel.status_code == 200
        assert owner_c.delete(f"/api/v1/library/seats/{seat_id}/").status_code == 204

        # Attendance flow
        ci = owner_c.post(
            "/api/v1/library/attendance/check-in/",
            {"student_id": str(student.id), "branch_id": str(branch.id), "method": "MANUAL"},
            format="json",
        )
        assert ci.status_code in (200, 201), ci.data
        assert owner_c.get("/api/v1/library/attendance/").status_code == 200
        assert owner_c.get("/api/v1/library/attendance/live/").status_code == 200
        assert owner_c.get("/api/v1/library/attendance/study-hours/").status_code == 200
        assert owner_c.get("/api/v1/library/attendance/study-hours/leaderboard/").status_code == 200

        co = owner_c.post(
            "/api/v1/library/attendance/check-out/",
            {"student_id": str(student.id)},
            format="json",
        )
        assert co.status_code == 200, co.data
        assert owner_c.post("/api/v1/library/attendance/auto-checkout/", {}, format="json").status_code == 200

    def test_books_loans_return_mark_lost_and_requests(self, auth_client, tenant_a, tenant_b):
        owner_c = auth_client(tenant_a["owner"])

        b_resp = owner_c.post(
            "/api/v1/library/books/",
            {
                "book_number": f"BK-{uuid.uuid4().hex[:5].upper()}",
                "title": "Clean DRF",
                "author": "Expert",
                "total_copies": 2,
                "price": "450.00",
            },
            format="json",
        )
        assert b_resp.status_code == 201, b_resp.data
        book_id = b_resp.data["id"]

        # Issue loan 1 -> return
        l1 = owner_c.post(
            "/api/v1/library/books/loans/",
            {
                "book": book_id,
                "copy_barcode": "BC-001",
                "student": str(tenant_a["student"].id),
                "due_date": str(date.today() + timedelta(days=7)),
            },
            format="json",
        )
        assert l1.status_code == 201, l1.data
        ret = owner_c.post(
            f"/api/v1/library/books/loans/{l1.data['id']}/return/",
            {"fine_amount": "0.00"},
            format="json",
        )
        assert ret.status_code == 200, ret.data

        # Issue loan 2 -> mark lost -> duplicate mark lost blocked (400)
        l2 = owner_c.post(
            "/api/v1/library/books/loans/",
            {
                "book": book_id,
                "copy_barcode": "BC-002",
                "student": str(tenant_a["student"].id),
                "due_date": str(date.today() + timedelta(days=7)),
            },
            format="json",
        )
        assert l2.status_code == 201, l2.data
        lost1 = owner_c.post(
            f"/api/v1/library/books/loans/{l2.data['id']}/mark-lost/",
            {"fine_amount": "200.00"},
            format="json",
        )
        assert lost1.status_code == 200
        lost2 = owner_c.post(
            f"/api/v1/library/books/loans/{l2.data['id']}/mark-lost/",
            {"fine_amount": "200.00"},
            format="json",
        )
        assert lost2.status_code == 400

        # Book requests
        br = owner_c.post(
            "/api/v1/library/books/requests/",
            {"title": "Django Internals", "author": "Author X", "student": str(tenant_a["student"].id)},
            format="json",
        )
        assert br.status_code == 201, br.data
        assert owner_c.get("/api/v1/library/books/requests/").status_code == 200

        # Tenant isolation
        assert auth_client(tenant_b["owner"]).get(f"/api/v1/library/books/{book_id}/").status_code == 404

