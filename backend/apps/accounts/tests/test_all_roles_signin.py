"""Comprehensive sign-in tests for ALL user roles using both email and phone number."""
import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.libraries.models import Branch, Library
from apps.students.models import Student


@pytest.mark.django_db
class TestAllRolesSignIn:
    """Verify sign-in with email, phone, and identifier across all 5 user roles."""

    def setup_method(self):
        self.client = APIClient()

        # 1. Super Admin
        self.super_admin = User.objects.create_superuser(
            email='superadmin@lmsplatform.com',
            password='StrongPass123',
            first_name='Super',
            last_name='Admin',
            phone='+919800012345',
            email_verified=True,
        )

        # 2. Library Owner + Library + Branch
        self.owner = User.objects.create_user(
            email='owner@libraryhub.com',
            password='StrongPass123',
            first_name='Lib',
            last_name='Owner',
            phone='+919811111111',
            role='LIBRARY_OWNER',
            email_verified=True,
        )
        self.library = Library.objects.create(
            code='LIB-SIGNIN-01',
            name='SignIn Test Library',
            owner=self.owner,
            city='Jaipur',
            state='Rajasthan',
            address='101 Station Road',
            phone='+919811111111',
            plan_status='Active',
            library_status='Active',
        )
        self.owner.library = self.library
        self.owner.save(update_fields=['library'])
        self.branch = Branch.objects.create(
            library=self.library,
            name='Main Branch',
            address='101 Station Road',
            phone='+919811111111',
            is_main=True,
        )

        # 3. Sub-Admin
        self.sub_admin = User.objects.create_user(
            email='subadmin@libraryhub.com',
            password='StrongPass123',
            first_name='Branch',
            last_name='SubAdmin',
            phone='+919822222222',
            role='SUB_ADMIN',
            library=self.library,
            email_verified=True,
        )

        # 4. Staff
        self.staff = User.objects.create_user(
            email='staff@libraryhub.com',
            password='StrongPass123',
            first_name='Desk',
            last_name='Staff',
            phone='+919833333333',
            role='STAFF',
            library=self.library,
            email_verified=True,
        )

        # 5. Student
        self.student_user = User.objects.create_user(
            email='student@libraryhub.com',
            password='StrongPass123',
            first_name='Study',
            last_name='Student',
            phone='+919844444444',
            role='STUDENT',
            library=self.library,
            email_verified=True,
        )
        self.student = Student.objects.create(
            user=self.student_user,
            library=self.library,
            branch=self.branch,
            name='Study Student',
            email='student@libraryhub.com',
            phone='+919844444444',
            gender='Male',
            status='Live',
        )

    @pytest.mark.parametrize(
        'email,phone,expected_role,protected_url',
        [
            ('superadmin@lmsplatform.com', '+919800012345', 'SUPER_ADMIN', '/api/v1/platform/dashboard/kpis/'),
            ('owner@libraryhub.com', '+919811111111', 'LIBRARY_OWNER', '/api/v1/library/dashboard/'),
            ('subadmin@libraryhub.com', '+919822222222', 'SUB_ADMIN', '/api/v1/library/students/'),
            ('staff@libraryhub.com', '+919833333333', 'STAFF', '/api/v1/library/attendance/'),
            ('student@libraryhub.com', '+919844444444', 'STUDENT', '/api/v1/student/profile/'),
        ],
    )
    def test_role_signin_with_email_and_phone_and_access_protected_endpoint(
        self, email, phone, expected_role, protected_url
    ):
        # 1. Sign in with email
        res_email = self.client.post(
            '/api/v1/auth/sign-in/',
            {'email': email, 'password': 'StrongPass123'},
            format='json',
        )
        assert res_email.status_code == 200
        assert res_email.data['role'] == expected_role
        assert res_email.data['email'] == email
        assert res_email.data['phone'] == phone
        assert 'access' in res_email.data

        # 2. Sign in with phone
        res_phone = self.client.post(
            '/api/v1/auth/sign-in/',
            {'phone': phone, 'password': 'StrongPass123'},
            format='json',
        )
        assert res_phone.status_code == 200
        assert res_phone.data['role'] == expected_role
        assert 'access' in res_phone.data

        # 3. Sign in with 10-digit phone (without +91)
        short_phone = phone.replace('+91', '')
        res_short = self.client.post(
            '/api/v1/auth/sign-in/',
            {'identifier': short_phone, 'password': 'StrongPass123'},
            format='json',
        )
        assert res_short.status_code == 200
        assert res_short.data['role'] == expected_role

        # 4. Verify token grants access to role-specific protected endpoint
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res_phone.data['access']}")
        res_me = self.client.get('/api/v1/auth/me/')
        assert res_me.status_code == 200
        assert res_me.data['role'] == expected_role

        res_protected = self.client.get(protected_url)
        assert res_protected.status_code == 200

    def test_signin_failures(self):
        # Wrong password with phone
        res_bad_pw = self.client.post(
            '/api/v1/auth/sign-in/',
            {'phone': '+919811111111', 'password': 'WrongPass123'},
            format='json',
        )
        assert res_bad_pw.status_code == 401

        # Unknown phone
        res_unknown = self.client.post(
            '/api/v1/auth/sign-in/',
            {'phone': '+919999999999', 'password': 'StrongPass123'},
            format='json',
        )
        assert res_unknown.status_code == 401

        # Missing both email and phone
        res_empty = self.client.post(
            '/api/v1/auth/sign-in/',
            {'password': 'StrongPass123'},
            format='json',
        )
        assert res_empty.status_code == 401

    def test_swagger_placeholder_string_ignored(self):
        res = self.client.post(
            '/api/v1/auth/sign-in/',
            {
                'phone': 'string',
                'identifier': 'string',
                'email': 'owner@libraryhub.com',
                'password': 'StrongPass123',
            },
            format='json',
        )
        assert res.status_code == 200
        assert res.data['email'] == 'owner@libraryhub.com'

