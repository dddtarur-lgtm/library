"""0-to-end tests for Schema, Swagger UI, and all /api/v1/auth/ endpoints."""
import io
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image

from apps.accounts.models import DeletionRequest, User
from apps.students.models import Student


@pytest.mark.django_db
class TestSchemaAndSwagger:
    def test_schema_and_swagger_ui_load(self, api_client):
        r_schema = api_client.get("/api/schema/")
        assert r_schema.status_code == 200

        r_ui = api_client.get("/api/schema/swagger-ui/")
        assert r_ui.status_code == 200
        assert b"swagger" in r_ui.content.lower()


@pytest.mark.django_db
class TestAuthLifecycleE2E:
    def test_owner_register_verify_resend_signin_refresh_logout(self, api_client):
        # 1. Register library owner (both email and phone)
        reg = api_client.post(
            "/api/v1/auth/register/",
            {
                "email": "newowner@example.com",
                "phone": "+91 9876543210",
                "password": "Password123!",
                "firstName": "New",
                "lastName": "Owner",
                "username": "newowner_e2e",
            },
            format="json",
        )
        assert reg.status_code == 201, reg.data

        # Duplicate email fails cleanly with 400
        dup = api_client.post(
            "/api/v1/auth/register/",
            {
                "email": "newowner@example.com",
                "phone": "9876500000",
                "password": "Password123!",
                "firstName": "Dup",
                "lastName": "Owner",
                "username": "dupowner_e2e",
            },
            format="json",
        )
        assert dup.status_code == 400

        # 2. Immediate Resend OTP hits cooldown (429), then succeeds after cooldown
        resend_429 = api_client.post(
            "/api/v1/auth/resend-otp/",
            {"email": "newowner@example.com"},
            format="json",
        )
        assert resend_429.status_code == 429

        from datetime import timedelta
        from django.utils import timezone
        u = User.objects.get(email="newowner@example.com")
        u.email_otp_sent_at = timezone.now() - timedelta(minutes=2)
        u.save(update_fields=["email_otp_sent_at"])

        resend = api_client.post(
            "/api/v1/auth/resend-otp/",
            {"email": "newowner@example.com"},
            format="json",
        )
        assert resend.status_code == 200

        bad_otp = api_client.post(
            "/api/v1/auth/verify-email/",
            {"email": "newowner@example.com", "otp": "000000"},
            format="json",
        )
        assert bad_otp.status_code == 400

        verify = api_client.post(
            "/api/v1/auth/verify-email/",
            {"email": "newowner@example.com", "otp": "123456"},
            format="json",
        )
        assert verify.status_code == 200
        assert User.objects.get(email="newowner@example.com").email_verified is True

        # 3. Sign in via email, phone, and Swagger placeholder payload
        for payload in [
            {"email": "newowner@example.com", "password": "Password123!"},
            {"phone": "+91 9876543210", "password": "Password123!"},
            {
                "phone": "string",
                "identifier": "string",
                "email": "newowner@example.com",
                "password": "Password123!",
            },
        ]:
            login = api_client.post("/api/v1/auth/sign-in/", payload, format="json")
            assert login.status_code == 200, login.data
            assert "access" in login.data and "refresh" in login.data

        # Wrong password -> 401
        bad_login = api_client.post(
            "/api/v1/auth/sign-in/",
            {"email": "newowner@example.com", "password": "WrongPassword!"},
            format="json",
        )
        assert bad_login.status_code == 401

        # 4. Token refresh
        tokens = api_client.post(
            "/api/v1/auth/sign-in/",
            {"email": "newowner@example.com", "password": "Password123!"},
            format="json",
        ).data
        ref = api_client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": tokens["refresh"]},
            format="json",
        )
        assert ref.status_code == 200
        assert "access" in ref.data

        # 5. Logout blacklists refresh token
        active_access = ref.data.get("access") or tokens["access"]
        active_refresh = ref.data.get("refresh") or tokens["refresh"]
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {active_access}")
        out = api_client.post(
            "/api/v1/auth/logout/",
            {"refresh": active_refresh},
            format="json",
        )
        assert out.status_code in (200, 204)

    def test_student_register_and_verify(self, api_client, tenant_a):
        reg = api_client.post(
            "/api/v1/auth/student/register/",
            {
                "email": "selfstudent@example.com",
                "phone": "9811122233",
                "password": "Password123!",
                "first_name": "Self",
                "last_name": "Student",
                "library_code": tenant_a["library"].code,
            },
            format="json",
        )
        assert reg.status_code == 201, reg.data
        assert Student.objects.filter(email="selfstudent@example.com", library=tenant_a["library"]).exists()

        verify = api_client.post(
            "/api/v1/auth/verify-email/",
            {"email": "selfstudent@example.com", "otp": "123456"},
            format="json",
        )
        assert verify.status_code == 200

    def test_all_roles_signin_email_and_phone(self, api_client, super_admin, tenant_a):
        users = [
            super_admin,
            tenant_a["owner"],
            tenant_a["sub_admin"],
            tenant_a["staff"],
            tenant_a["student_user"],
        ]
        for u in users:
            r_email = api_client.post(
                "/api/v1/auth/sign-in/",
                {"email": u.email, "password": "Password123!"},
                format="json",
            )
            assert r_email.status_code == 200, f"Email login failed for {u.role}: {r_email.data}"
            r_phone = api_client.post(
                "/api/v1/auth/sign-in/",
                {"phone": u.phone, "password": "Password123!"},
                format="json",
            )
            assert r_phone.status_code == 200, f"Phone login failed for {u.role}: {r_phone.data}"

    def test_profile_me_change_password_avatar_forgot_reset_delete(self, api_client, auth_client, tenant_a):
        # Unauthenticated -> 401
        assert api_client.get("/api/v1/auth/me/").status_code == 401

        client = auth_client(tenant_a["staff"])
        # Method not allowed -> 405
        assert client.post("/api/v1/auth/me/", {}).status_code == 405

        # GET / PATCH / PUT /me/
        assert client.get("/api/v1/auth/me/").status_code == 200
        upd = client.patch(
            "/api/v1/auth/me/",
            {"first_name": "UpdatedStaff", "last_name": "Alpha"},
            format="json",
        )
        assert upd.status_code == 200
        assert upd.data["first_name"] == "UpdatedStaff"

        # Avatar upload
        img_buf = io.BytesIO()
        Image.new("RGB", (10, 10), color="red").save(img_buf, format="PNG")
        img_buf.seek(0)
        avatar_file = SimpleUploadedFile("avatar.png", img_buf.read(), content_type="image/png")
        av = client.post("/api/v1/auth/avatar/", {"avatar": avatar_file}, format="multipart")
        assert av.status_code == 200

        # Change password (bad old -> 400, good -> 200)
        bad_cp = client.post(
            "/api/v1/auth/change-password/",
            {"old_password": "Wrong", "new_password": "NewPassword123!"},
            format="json",
        )
        assert bad_cp.status_code == 400

        good_cp = client.post(
            "/api/v1/auth/change-password/",
            {"old_password": "Password123!", "new_password": "NewPassword123!"},
            format="json",
        )
        assert good_cp.status_code == 200

        # Forgot & reset password
        fp = api_client.post(
            "/api/v1/auth/forgot-password/",
            {"email": tenant_a["staff"].email},
            format="json",
        )
        assert fp.status_code == 200
        rp = api_client.post(
            "/api/v1/auth/reset-password/",
            {
                "email": tenant_a["staff"].email,
                "otp": "123456",
                "new_password": "ResetPassword123!",
            },
            format="json",
        )
        assert rp.status_code == 200

        # Request deletion
        rd = client.post(
            "/api/v1/auth/request-delete/",
            {"reason": "Leaving organization"},
            format="json",
        )
        assert rd.status_code == 201
        assert DeletionRequest.objects.filter(requested_by=tenant_a["staff"]).exists()

        # DELETE /me/ deactivates account
        del_me = client.delete("/api/v1/auth/me/")
        assert del_me.status_code in (200, 204)
        tenant_a["staff"].refresh_from_db()
        assert tenant_a["staff"].is_active is False

