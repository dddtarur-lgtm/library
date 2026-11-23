"""Shared pytest fixtures for 0-to-end API testing across all 9 backend apps."""
from datetime import date, timedelta
from decimal import Decimal
import uuid

import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.jwt import (
    AUDIENCE_LIBRARY,
    AUDIENCE_PLATFORM,
    AUDIENCE_STUDENT,
    generate_access_token,
)
from apps.accounts.models import StaffPermission, User
from apps.billing.models import LibrarySubscription, SubscriptionPlan
from apps.libraries.models import Branch, Library
from apps.students.models import Student


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def auth_client():
    """Return a factory that produces an authenticated APIClient for a given user."""
    def _make(user: User, branch_id: str = None) -> APIClient:
        client = APIClient()
        if user.is_superuser or getattr(user, 'role', '') == 'SUPER_ADMIN':
            aud = AUDIENCE_PLATFORM
        elif getattr(user, 'role', '') in ['LIBRARY_OWNER', 'STAFF']:
            aud = AUDIENCE_LIBRARY
        else:
            aud = AUDIENCE_STUDENT
        token = generate_access_token(user.id, audience=aud)
        creds = {"HTTP_AUTHORIZATION": f"Bearer {token}"}
        if branch_id:
            creds["HTTP_X_BRANCH_ID"] = str(branch_id)
        elif getattr(user, 'library_id', None):
            try:
                b = Branch.objects.filter(library_id=user.library_id).first()
                if b:
                    creds["HTTP_X_BRANCH_ID"] = str(b.id)
            except Exception:
                pass
        client.credentials(**creds)
        return client
    return _make


@pytest.fixture
def super_admin(db) -> User:
    return User.objects.create_superuser(
        email="e2e-superadmin@example.com",
        password="Password123!",
        first_name="Super",
        last_name="Admin",
        phone="9990000001",
    )


@pytest.fixture
def subscription_plan(db) -> SubscriptionPlan:
    return SubscriptionPlan.objects.create(
        name="E2E Pro Plan",
        tier=99,
        monthly_fee=Decimal("999.00"),
        quarterly_fee=Decimal("2799.00"),
        annual_fee=Decimal("9999.00"),
        max_branches=5,
        max_seats=200,
        is_active=True,
    )


@pytest.fixture
def tenant_a(db, subscription_plan):
    """Create Library A with Owner, Sub-Admin, Staff (full perms), Branch, Subscription, and Student."""
    uid = uuid.uuid4().hex[:6]
    owner = User.objects.create_user(
        email=f"owner-a-{uid}@example.com",
        password="Password123!",
        first_name="Owner",
        last_name="Alpha",
        role="LIBRARY_OWNER",
        phone=f"91000{uid[:5]}",
        email_verified=True,
    )
    library = Library.objects.create(
        code=f"LIB-A-{uid.upper()}",
        name="Alpha Study Library",
        owner=owner,
        city="Pune",
        state="MH",
        address="100 Alpha Rd",
        phone=f"91001{uid[:5]}",
        plan_status="ACTIVE",
        library_status="ACTIVE",
    )
    owner.library = library
    owner.save(update_fields=["library"])

    branch = Branch.objects.create(
        library=library,
        name="Alpha Main Branch",
        address="100 Alpha Rd",
        phone=f"91002{uid[:5]}",
        is_main=True,
    )

    sub_admin = User.objects.create_user(
        email=f"subadmin-a-{uid}@example.com",
        password="Password123!",
        first_name="Sub",
        last_name="Alpha",
        role="SUB_ADMIN",
        library=library,
        phone=f"91003{uid[:5]}",
        email_verified=True,
    )

    staff = User.objects.create_user(
        email=f"staff-a-{uid}@example.com",
        password="Password123!",
        first_name="Staff",
        last_name="Alpha",
        role="STAFF",
        library=library,
        phone=f"91004{uid[:5]}",
        email_verified=True,
    )
    StaffPermission.objects.create(
        staff=staff,
        students=True,
        fees_plans=True,
        seats=True,
        attendance=True,
        books=True,
        settings=True,
        security=True,
        can_view_revenue=True,
    )

    student_user = User.objects.create_user(
        email=f"student-a-{uid}@example.com",
        password="Password123!",
        first_name="Student",
        last_name="Alpha",
        role="STUDENT",
        library=library,
        phone=f"91005{uid[:5]}",
        email_verified=True,
    )
    student = Student.objects.create(
        student_code=f"STU-A-{uid.upper()}",
        user=student_user,
        library=library,
        branch=branch,
        name="Student Alpha",
        email=student_user.email,
        phone=student_user.phone,
        status="ACTIVE",
    )

    subscription = LibrarySubscription.objects.create(
        library=library,
        plan=subscription_plan,
        billing_cycle="MONTHLY",
        start_date=date.today(),
        end_date=date.today() + timedelta(days=30),
        status="ACTIVE",
        fee_amount=subscription_plan.monthly_fee,
    )

    return {
        "library": library,
        "branch": branch,
        "owner": owner,
        "sub_admin": sub_admin,
        "staff": staff,
        "student_user": student_user,
        "student": student,
        "subscription": subscription,
    }


@pytest.fixture
def tenant_b(db, subscription_plan):
    """Create an isolated Library B for cross-tenant security & isolation tests."""
    uid = uuid.uuid4().hex[:6]
    owner = User.objects.create_user(
        email=f"owner-b-{uid}@example.com",
        password="Password123!",
        first_name="Owner",
        last_name="Beta",
        role="LIBRARY_OWNER",
        phone=f"92000{uid[:5]}",
        email_verified=True,
    )
    library = Library.objects.create(
        code=f"LIB-B-{uid.upper()}",
        name="Beta Study Library",
        owner=owner,
        city="Jaipur",
        state="RJ",
        address="200 Beta Rd",
        phone=f"92001{uid[:5]}",
        plan_status="ACTIVE",
        library_status="ACTIVE",
    )
    owner.library = library
    owner.save(update_fields=["library"])

    branch = Branch.objects.create(
        library=library,
        name="Beta Main Branch",
        address="200 Beta Rd",
        phone=f"92002{uid[:5]}",
        is_main=True,
    )

    student_user = User.objects.create_user(
        email=f"student-b-{uid}@example.com",
        password="Password123!",
        first_name="Student",
        last_name="Beta",
        role="STUDENT",
        library=library,
        phone=f"92005{uid[:5]}",
        email_verified=True,
    )
    student = Student.objects.create(
        student_code=f"STU-B-{uid.upper()}",
        user=student_user,
        library=library,
        branch=branch,
        name="Student Beta",
        email=student_user.email,
        phone=student_user.phone,
        status="ACTIVE",
    )

    return {
        "library": library,
        "branch": branch,
        "owner": owner,
        "student_user": student_user,
        "student": student,
    }

