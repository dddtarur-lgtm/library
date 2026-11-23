"""Automated tests for platform and library billing endpoints."""
from datetime import date, timedelta
from decimal import Decimal
import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.billing.models import (
    CashDayBookEntry,
    Coupon,
    FeePlan,
    LibrarySubscription,
    PlatformPayment,
    SubscriptionPlan,
)
from apps.libraries.models import Branch, Library
from apps.students.models import Student, StudentMembership


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def super_admin(db):
    return User.objects.create_superuser(
        email='superadmin@example.com',
        password='StrongPass123',
        first_name='Super',
        last_name='Admin',
    )


@pytest.fixture
def billing_setup(db):
    owner = User.objects.create_user(
        email='owner@example.com',
        password='StrongPass123',
        first_name='Lib',
        last_name='Owner',
        role='LIBRARY_OWNER',
        email_verified=True,
    )
    library = Library.objects.create(
        code='LIB-BILL-1',
        name='Apex Study Hall',
        owner=owner,
        city='Pune',
        state='Maharashtra',
        address='10 FC Road',
        phone='9876543210',
    )
    owner.library = library
    owner.save(update_fields=['library'])

    branch = Branch.objects.create(
        library=library,
        name='Main Branch',
        address='10 FC Road',
        phone='9876543210',
        is_main=True,
    )
    plan = SubscriptionPlan.objects.create(
        name='Growth',
        tier=2,
        monthly_fee=Decimal('1999.00'),
        quarterly_fee=Decimal('5499.00'),
        annual_fee=Decimal('19999.00'),
        max_branches=3,
        max_seats=200,
    )
    sub = LibrarySubscription.objects.create(
        library=library,
        plan=plan,
        billing_cycle='Monthly',
        start_date=timezone.localdate() - timedelta(days=25),
        end_date=timezone.localdate() + timedelta(days=5),
        status='Active',
        fee_amount=Decimal('1999.00'),
    )
    return owner, library, branch, plan, sub


@pytest.mark.django_db
def test_subscription_plans_public_list_and_superadmin_create(
    api_client, super_admin, billing_setup
):
    list_res = api_client.get('/api/v1/platform/plans/')
    assert list_res.status_code == 200
    assert list_res.data['count'] == 1

    owner, *_ = billing_setup
    api_client.force_authenticate(user=owner)
    forbidden = api_client.post(
        '/api/v1/platform/plans/',
        {
            'name': 'Pro',
            'tier': 3,
            'monthly_fee': '3999.00',
            'quarterly_fee': '10999.00',
            'annual_fee': '39999.00',
            'max_branches': 10,
            'max_seats': 500,
        },
        format='json',
    )
    assert forbidden.status_code == 403

    api_client.force_authenticate(user=super_admin)
    created = api_client.post(
        '/api/v1/platform/plans/',
        {
            'name': 'Pro',
            'tier': 3,
            'monthly_fee': '3999.00',
            'quarterly_fee': '10999.00',
            'annual_fee': '39999.00',
            'max_branches': 10,
            'max_seats': 500,
        },
        format='json',
    )
    assert created.status_code == 201
    assert SubscriptionPlan.objects.count() == 2


@pytest.mark.django_db
def test_platform_manual_payment_and_extend_grace(
    api_client, super_admin, billing_setup
):
    _, library, _, _, sub = billing_setup
    api_client.force_authenticate(user=super_admin)

    manual_res = api_client.post(
        '/api/v1/platform/payments/manual/',
        {
            'library': str(library.id),
            'subscription': str(sub.id),
            'amount': '1999.00',
            'method': 'Bank Transfer',
            'type': 'Manual Adjust',
            'reference_number': 'UTR-998877',
        },
        format='json',
    )
    assert manual_res.status_code == 201
    assert manual_res.data['success'] is True
    assert PlatformPayment.objects.filter(library=library).count() == 1

    grace_res = api_client.post(
        f'/api/v1/platform/subscriptions/{sub.id}/extend-grace/',
        {'days': 7},
        format='json',
    )
    assert grace_res.status_code == 200
    sub.refresh_from_db()
    library.refresh_from_db()
    assert sub.status == 'Grace'
    assert library.plan_status == 'Grace'
    assert sub.grace_ends is not None


@pytest.mark.django_db
def test_library_billing_overview_and_renew(api_client, billing_setup):
    owner, library, _, plan, _ = billing_setup
    api_client.force_authenticate(user=owner)

    overview = api_client.get('/api/v1/library/billing/')
    assert overview.status_code == 200
    assert overview.data['data']['library']['code'] == 'LIB-BILL-1'
    assert overview.data['data']['subscription']['plan_name'] == 'Growth'

    renew = api_client.post(
        '/api/v1/library/billing/renew/',
        {'plan_id': str(plan.id), 'billing_cycle': 'Quarterly', 'method': 'Razorpay'},
        format='json',
    )
    assert renew.status_code == 201
    assert renew.data['data']['payment']['amount'] == '5499.00'

    invoices = api_client.get('/api/v1/library/billing/invoices/')
    assert invoices.status_code == 200
    assert invoices.data['count'] == 1


@pytest.mark.django_db
def test_fee_plans_coupons_cashbook_and_fee_dues(api_client, billing_setup):
    owner, library, branch, _, _ = billing_setup
    api_client.force_authenticate(user=owner)

    # Fee plan CRUD + soft deactivate
    fp_res = api_client.post(
        '/api/v1/library/fee-plans/',
        {
            'name': 'Full Day Monthly',
            'description': '24x7 desk access',
            'duration_days': 30,
            'price': '1500.00',
            'benefits': ['AC', 'WiFi'],
        },
        format='json',
    )
    assert fp_res.status_code == 201
    fp_id = fp_res.data['id']

    del_fp = api_client.delete(f'/api/v1/library/fee-plans/{fp_id}/')
    assert del_fp.status_code == 204
    assert FeePlan.objects.get(id=fp_id).is_active is False

    # Coupon CRUD + validate
    c_res = api_client.post(
        '/api/v1/library/coupons/',
        {
            'code': 'save20',
            'discount_type': 'Percentage',
            'discount_value': '20.00',
            'min_purchase': '1000.00',
            'valid_until': (timezone.localdate() + timedelta(days=10)).isoformat(),
            'usage_limit': 50,
        },
        format='json',
    )
    assert c_res.status_code == 201
    assert c_res.data['code'] == 'SAVE20'

    val_res = api_client.post(
        '/api/v1/library/coupons/validate/',
        {'code': 'SAVE20', 'amount': '1500.00'},
        format='json',
    )
    assert val_res.status_code == 200
    assert val_res.data['data']['discount_amount'] == '300.00'
    assert val_res.data['data']['final_amount'] == '1200.00'

    # Cashbook + Fee Dues
    student = Student.objects.create(
        library=library,
        branch=branch,
        name='Aarav Mehta',
        email='aarav@example.com',
        phone='9123456789',
        gender='Male',
        status='Expired',
    )
    StudentMembership.objects.create(
        student=student,
        plan=FeePlan.objects.get(id=fp_id),
        shift='Morning',
        start_date=date.today() - timedelta(days=35),
        end_date=date.today() - timedelta(days=5),
        status='Expired',
        amount_paid=Decimal('1500.00'),
        payment_mode='Cash',
    )

    cb_res = api_client.post(
        '/api/v1/library/cashbook/',
        {
            'branch': str(branch.id),
            'date': date.today().isoformat(),
            'shift': 'Morning',
            'student': str(student.id),
            'amount': '1500.00',
            'payment_mode': 'Cash',
            'purpose': 'Plan Renewal',
        },
        format='json',
    )
    assert cb_res.status_code == 201
    assert CashDayBookEntry.objects.filter(library=library).count() == 1

    dues_res = api_client.get('/api/v1/library/fee-dues/')
    assert dues_res.status_code == 200
    assert dues_res.data['count'] == 1
    assert dues_res.data['results'][0]['days_overdue'] == 5
