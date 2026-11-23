"""Tests for complete user, library, and student lifecycle flows (register, login, profile, edit/update, logout, request-delete)."""
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import DeletionRequest, User
from apps.libraries.models import Branch, Library, LibraryRequest
from apps.students.models import Student


@pytest.mark.django_db
class TestLifecycleFlows:
    """End-to-end verification of auth, library, and student lifecycle APIs."""

    def setup_method(self):
        self.client = APIClient()
        self.super_admin = User.objects.create_superuser(
            email='sa@lmsplatform.com',
            password='StrongPass123',
            first_name='Super',
            last_name='Admin',
            email_verified=True,
        )
        self.owner = User.objects.create_user(
            email='owner@testlib.com',
            password='StrongPass123',
            first_name='Lib',
            last_name='Owner',
            role='LIBRARY_OWNER',
            email_verified=True,
        )
        self.library = Library.objects.create(
            code='LIB-TST-001',
            name='Test Central Library',
            owner=self.owner,
            city='Jaipur',
            state='Rajasthan',
            address='123 Main Rd',
            phone='+919800000001',
            plan_status='Active',
            library_status='Active',
        )
        self.owner.library = self.library
        self.owner.save(update_fields=['library'])
        self.branch = Branch.objects.create(
            library=self.library,
            name='Main Branch',
            address='123 Main Rd',
            phone='+919800000001',
            is_main=True,
        )

    def test_account_me_put_and_delete_and_request_delete(self):
        self.client.force_authenticate(user=self.owner)

        # GET /api/v1/auth/me/
        res = self.client.get('/api/v1/auth/me/')
        assert res.status_code == 200
        assert res.data['email'] == 'owner@testlib.com'

        # PUT /api/v1/auth/me/
        res = self.client.put(
            '/api/v1/auth/me/',
            {
                'first_name': 'Updated',
                'last_name': 'Owner',
                'username': 'updatedowner',
                'phone': '+919800000099',
                'status': 'ONLINE',
            },
            format='json',
        )
        assert res.status_code == 200
        assert res.data['first_name'] == 'Updated'

        # POST /api/v1/auth/request-delete/
        res = self.client.post(
            '/api/v1/auth/request-delete/',
            {'reason': 'Closing my personal account'},
            format='json',
        )
        assert res.status_code == 201
        assert res.data['target_type'] == 'ACCOUNT'
        assert res.data['status'] == 'Pending'

        # Duplicate pending request blocked
        res_dup = self.client.post(
            '/api/v1/auth/request-delete/',
            {'reason': 'Again'},
            format='json',
        )
        assert res_dup.status_code == 400

        # DELETE /api/v1/auth/me/ soft-deactivates
        res_del = self.client.delete('/api/v1/auth/me/')
        assert res_del.status_code == 200
        self.owner.refresh_from_db()
        assert self.owner.is_active is False

    def test_library_onboarding_profile_put_and_request_delete(self):
        # Public onboarding request
        res_onboard = self.client.post(
            '/api/v1/library/onboarding-request/',
            {
                'library_name': 'New Horizon Library',
                'owner_name': 'Amit Shah',
                'mobile': '+919876500000',
                'email': 'amit.horizon@example.com',
                'city': 'Surat',
                'state': 'Gujarat',
                'branches_planned': 1,
                'planned_seats': 100,
            },
            format='json',
        )
        assert res_onboard.status_code == 201
        assert LibraryRequest.objects.filter(email='amit.horizon@example.com').exists()

        # Library Owner PUT /api/v1/library/profile/
        self.client.force_authenticate(user=self.owner)
        res_put = self.client.put(
            '/api/v1/library/profile/',
            {
                'name': 'Test Central Library Updated',
                'city': 'Jaipur',
                'state': 'Rajasthan',
                'address': '456 New Rd',
                'phone': '+919800000002',
                'gstin': '08AAAAA0000A1Z5',
            },
            format='json',
        )
        assert res_put.status_code == 200
        assert res_put.data['name'] == 'Test Central Library Updated'

        # Library Owner POST /api/v1/library/request-delete/
        res_del_req = self.client.post(
            '/api/v1/library/request-delete/',
            {'reason': 'Shutting down operations'},
            format='json',
        )
        assert res_del_req.status_code == 201
        req_id = res_del_req.data['id']

        # Super Admin approves deletion request
        self.client.force_authenticate(user=self.super_admin)
        res_approve = self.client.post(
            f'/api/v1/platform/deletion-requests/{req_id}/approve/',
            {'review_notes': 'Approved closure'},
            format='json',
        )
        assert res_approve.status_code == 200
        self.library.refresh_from_db()
        assert self.library.library_status == 'Closed'

    def test_student_register_login_profile_edit_request_delete_logout(self):
        # 1. Student self-registers
        res_reg = self.client.post(
            '/api/v1/auth/student/register/',
            {
                'firstName': 'Aarav',
                'lastName': 'Patel',
                'username': 'aarav.patel',
                'email': 'aarav.student@example.com',
                'phone': '+919811112222',
                'gender': 'Male',
                'password': 'StrongPass123',
                'library_code': 'LIB-TST-001',
            },
            format='json',
        )
        assert res_reg.status_code == 201
        assert res_reg.data['role'] == 'STUDENT'

        student_user = User.objects.get(email='aarav.student@example.com')
        student_user.email_verified = True
        student_user.save(update_fields=['email_verified'])

        # 2. Student signs in
        res_login = self.client.post(
            '/api/v1/auth/sign-in/',
            {'email': 'aarav.student@example.com', 'password': 'StrongPass123'},
            format='json',
        )
        assert res_login.status_code == 200
        access = res_login.data['access']
        refresh = res_login.data['refresh']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

        # 3. Student views and edits own profile
        res_prof = self.client.get('/api/v1/student/profile/')
        assert res_prof.status_code == 200
        assert res_prof.data['email'] == 'aarav.student@example.com'

        res_patch = self.client.patch(
            '/api/v1/student/profile/',
            {'exam_target': 'UPSC CSE', 'college': 'Delhi University'},
            format='json',
        )
        assert res_patch.status_code == 200
        assert res_patch.data['exam_target'] == 'UPSC CSE'

        # 4. Student views memberships / attendance / books
        assert self.client.get('/api/v1/student/memberships/').status_code == 200
        assert self.client.get('/api/v1/student/attendance/').status_code == 200
        assert self.client.get('/api/v1/student/books/').status_code == 200

        # 5. Student requests deletion
        res_del = self.client.post(
            '/api/v1/student/request-delete/',
            {'reason': 'Completed my exam'},
            format='json',
        )
        assert res_del.status_code == 201
        del_id = res_del.data['id']

        # 6. Student logs out (blacklists refresh token)
        res_logout = self.client.post(
            '/api/v1/auth/logout/',
            {'refresh': refresh},
            format='json',
        )
        assert res_logout.status_code == 204

        # 7. Library Owner approves student deletion request
        self.client.credentials()
        self.client.force_authenticate(user=self.owner)
        res_lib_approve = self.client.post(
            f'/api/v1/library/student-deletion-requests/{del_id}/approve/',
            {'review_notes': 'Cleared all dues'},
            format='json',
        )
        assert res_lib_approve.status_code == 200
        student = Student.objects.get(email='aarav.student@example.com')
        assert student.is_deleted is True
        student_user.refresh_from_db()
        assert student_user.is_active is False

    def test_register_with_email_and_phone_and_verify_with_static_otp_123456(self):
        # Register Library Owner with both email and phone
        res = self.client.post(
            '/api/v1/auth/register/',
            {
                'firstName': 'Karan',
                'lastName': 'Mehta',
                'username': 'karan.mehta',
                'email': 'karan.mehta@example.com',
                'phone': '+919898989898',
                'password': 'StrongPass123',
            },
            format='json',
        )
        assert res.status_code == 201
        assert res.data['email'] == 'karan.mehta@example.com'
        assert res.data['phone'] == '+919898989898'

        # Verify using static test OTP 123456 via phone number
        res_verify = self.client.post(
            '/api/v1/auth/verify-email/',
            {'phone': '+919898989898', 'otp': '123456'},
            format='json',
        )
        assert res_verify.status_code == 200
        assert res_verify.data['verified'] is True

        user = User.objects.get(email='karan.mehta@example.com')
        assert user.email_verified is True
        assert user.phone == '+919898989898'

        # Sign in with phone number directly
        res_phone_login = self.client.post(
            '/api/v1/auth/sign-in/',
            {'phone': '+919898989898', 'password': 'StrongPass123'},
            format='json',
        )
        assert res_phone_login.status_code == 200
        assert res_phone_login.data['email'] == 'karan.mehta@example.com'
        assert res_phone_login.data['phone'] == '+919898989898'
        assert 'access' in res_phone_login.data

        # Sign in with identifier (phone)
        res_id_login = self.client.post(
            '/api/v1/auth/sign-in/',
            {'identifier': '+919898989898', 'password': 'StrongPass123'},
            format='json',
        )
        assert res_id_login.status_code == 200
        assert 'access' in res_id_login.data

        # Sign in with email
        res_email_login = self.client.post(
            '/api/v1/auth/sign-in/',
            {'email': 'karan.mehta@example.com', 'password': 'StrongPass123'},
            format='json',
        )
        assert res_email_login.status_code == 200
        assert 'access' in res_email_login.data

