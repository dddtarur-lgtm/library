"""Tests for Priority 6: Fees & Payments, Dues, Day Book, Invoices, and Student Payments (Section 11 & Section 8.3)."""
import uuid
from decimal import Decimal
import pytest
from django.utils import timezone
from rest_framework import status

from apps.accounts.models import User
from apps.libraries.models import Library, Branch
from apps.students.models import Student, StudentMembership
from apps.billing.models import Payment, FeeDue, Refund, Invoice, CashDayBookRecord, FeePlan, Coupon
from apps.core.jwt import generate_access_token, AUDIENCE_LIBRARY, AUDIENCE_STUDENT


@pytest.fixture
def library_tenant(db):
    owner = User.objects.create_user(
        email='owner.fee@library.com',
        password='Password123!',
        first_name='Sunil',
        last_name='Tiwari',
        role='LIBRARY_OWNER',
        phone='9876543210',
    )
    lib = Library.objects.create(
        code='LIB-FEE-01',
        name='Aryabhata Knowledge Centre',
        owner=owner,
        city='Pune',
        state='Maharashtra',
        address='FC Road, Shivajinagar',
        phone='9876543210',
        plan_status='Active',
        library_status='Active',
    )
    Branch.objects.create(
        library=lib,
        name='Main Campus',
        address='FC Road',
        phone='9876543210',
        is_main=True,
    )
    owner.library = lib
    owner.save(update_fields=['library'])
    return lib


@pytest.fixture
def other_library_tenant(db):
    owner = User.objects.create_user(
        email='other.fee.owner@library.com',
        password='Password123!',
        first_name='Vikram',
        last_name='Seth',
        role='LIBRARY_OWNER',
        phone='9876543211',
    )
    lib = Library.objects.create(
        code='LIB-FEE-02',
        name='Takshashila Study Hub',
        owner=owner,
        city='Nashik',
        state='Maharashtra',
        address='College Road',
        phone='9876543211',
        plan_status='Active',
        library_status='Active',
    )
    Branch.objects.create(
        library=lib,
        name='Branch A',
        address='College Road',
        phone='9876543211',
        is_main=True,
    )
    owner.library = lib
    owner.save(update_fields=['library'])
    return lib


@pytest.fixture
def library_admin_user(library_tenant):
    return library_tenant.owner


@pytest.fixture
def library_token(library_tenant, library_admin_user):
    return generate_access_token(
        user_id=library_admin_user.id,
        audience=AUDIENCE_LIBRARY,
        extra_claims={
            'org_id': str(library_tenant.id),
            'member_id': str(library_admin_user.id),
            'role': 'owner',
            'branch_ids': 'all',
            'perm_ver': 1,
        }
    )


@pytest.fixture
def student_user(db):
    return User.objects.create_user(
        email='rohan.mehra@example.com',
        password='Password123!',
        first_name='Rohan',
        last_name='Mehra',
        role='LIBRARY_OWNER',
        phone='9911223344',
    )


@pytest.fixture
def student_enrollment(library_tenant, student_user):
    branch = library_tenant.branches.first()
    return Student.objects.create(
        library=library_tenant,
        branch=branch,
        user=student_user,
        name='Rohan Mehra',
        email='rohan.mehra@example.com',
        phone='9911223344',
        gender='Male',
        status='Pending',
    )


@pytest.fixture
def student_token(library_tenant, student_enrollment, student_user):
    return generate_access_token(
        user_id=student_user.id,
        audience=AUDIENCE_STUDENT,
        extra_claims={
            'org_id': str(library_tenant.id),
            'enrollment_id': str(student_enrollment.id),
            'lang': 'en',
        }
    )

@pytest.mark.django_db
class TestPriority6FeesAndPayments:
    """Tests covering Section 11 Library Fees & Payments."""

    def test_fees_summary_and_charts(self, api_client, library_token, library_tenant, student_enrollment):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")

        # Seed payment
        Payment.objects.create(
            library=library_tenant,
            student=student_enrollment,
            branch=student_enrollment.branch,
            amount=Decimal('1500.00'),
            mode='cash',
            status='paid',
            payment_date=timezone.now().date(),
        )
        # Seed due
        FeeDue.objects.create(
            library=library_tenant,
            student=student_enrollment,
            charge_type='plan_fee',
            description='Monthly Plan Fee',
            amount=Decimal('500.00'),
            due_date=timezone.now().date(),
            status='open',
        )

        # GET /v1/library/fees/summary
        resp = api_client.get("/v1/library/fees/summary")
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()["data"]
        assert data["today_collection"] == "1500.00"
        assert data["total_dues"] == "500.00"
        assert data["due_students"] == 1
        assert data["day_book_status"] == "open"

        # GET /v1/library/fees/charts
        charts_resp = api_client.get("/v1/library/fees/charts")
        assert charts_resp.status_code == status.HTTP_200_OK
        charts_data = charts_resp.json()["data"]
        assert len(charts_data["collections_by_day"]) == 7

    def test_payment_collection_auto_invoicing_and_idempotency(self, api_client, library_token, library_tenant, student_enrollment):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")

        # Seed an open due
        due = FeeDue.objects.create(
            library=library_tenant,
            student=student_enrollment,
            charge_type='plan_fee',
            description='Enrollment Fee',
            amount=Decimal('2000.00'),
            due_date=timezone.now().date(),
            status='open',
        )

        idempotency_key = str(uuid.uuid4())
        payload = {
            'enrollment_id': str(student_enrollment.id),
            'amount': "2000.00",
            'mode': 'upi',
            'reference': 'UPI-REF-998877',
            'notes': 'Paid via PhonePe at front desk',
            'charge_ids': [str(due.id)],
        }

        # POST /v1/library/payments
        resp = api_client.post(
            "/v1/library/payments",
            payload,
            format="json",
            HTTP_IDEMPOTENCY_KEY=idempotency_key
        )
        assert resp.status_code == status.HTTP_201_CREATED
        res_data = resp.json()["data"]
        assert "payment" in res_data
        assert res_data["payment"]["amount"] == "2000.00"
        assert res_data["payment"]["mode"] == "upi"
        assert "invoice" in res_data
        assert res_data["remaining_due"] == "0.00"

        # Verify due was marked as paid
        due.refresh_from_db()
        assert due.status == "paid"

        # Verify student is now Live
        student_enrollment.refresh_from_db()
        assert student_enrollment.status == "Live"

        # Verify idempotent replay returns cached response
        replay_resp = api_client.post(
            "/v1/library/payments",
            payload,
            format="json",
            HTTP_IDEMPOTENCY_KEY=idempotency_key
        )
        assert replay_resp.status_code == status.HTTP_201_CREATED
        assert replay_resp.json()["data"]["payment"]["id"] == res_data["payment"]["id"]

    def test_payment_collection_blocks_if_student_active_in_another_library(
        self, api_client, library_token, library_tenant, other_library_tenant, student_user
    ):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")

        # Make student active/Live in other_library_tenant
        Student.objects.create(
            library=other_library_tenant,
            branch=other_library_tenant.branches.first(),
            user=student_user,
            name='Rohan Mehra',
            email='rohan.mehra@example.com',
            phone='9911223344',
            gender='Male',
            status='Live',
        )

        # Student is pending in this library
        local_student = Student.objects.create(
            library=library_tenant,
            branch=library_tenant.branches.first(),
            user=student_user,
            name='Rohan Mehra',
            email='rohan.mehra@example.com',
            phone='9911223344',
            gender='Male',
            status='Pending',
        )

        resp = api_client.post(
            "/v1/library/payments",
            {
                'enrollment_id': str(local_student.id),
                'amount': "1000.00",
                'mode': 'cash',
            },
            format="json",
            HTTP_IDEMPOTENCY_KEY=str(uuid.uuid4())
        )
        assert resp.status_code == status.HTTP_409_CONFLICT
        assert resp.json()["error"]["code"] == "live_in_another_library"

    def test_payment_refund_and_cancel_lifecycle(self, api_client, library_token, library_tenant, student_enrollment):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")

        payment = Payment.objects.create(
            library=library_tenant,
            student=student_enrollment,
            branch=student_enrollment.branch,
            amount=Decimal('3000.00'),
            mode='cash',
            status='paid',
            payment_date=timezone.now().date(),
        )

        # Attempt refund exceeding amount -> 400
        bad_refund = api_client.post(
            f"/v1/library/payments/{payment.id}/refunds",
            {
                'amount': "3500.00",
                'mode': 'cash',
                'reason': 'Student leaving city',
            },
            format="json",
            HTTP_IDEMPOTENCY_KEY=str(uuid.uuid4())
        )
        assert bad_refund.status_code == status.HTTP_400_BAD_REQUEST
        assert bad_refund.json()["error"]["code"] == "refund_exceeds_payment"

        # Valid partial refund
        refund_resp = api_client.post(
            f"/v1/library/payments/{payment.id}/refunds",
            {
                'amount': "1000.00",
                'mode': 'cash',
                'reason': 'Partial fee adjustment',
            },
            format="json",
            HTTP_IDEMPOTENCY_KEY=str(uuid.uuid4())
        )
        assert refund_resp.status_code == status.HTTP_201_CREATED
        assert refund_resp.json()["data"]["amount"] == "1000.00"

        payment.refresh_from_db()
        assert payment.status == "partially_refunded"
        assert payment.refund_amount == Decimal("1000.00")

        # GET /v1/library/payments/{id} detail
        detail_resp = api_client.get(f"/v1/library/payments/{payment.id}")
        assert detail_resp.status_code == status.HTTP_200_OK
        assert len(detail_resp.json()["data"]["refunds"]) == 1

        # Cancel payment
        cancel_resp = api_client.post(
            f"/v1/library/payments/{payment.id}/cancel",
            {'reason': 'Erroneous duplicate entry'},
            format="json"
        )
        assert cancel_resp.status_code == status.HTTP_200_OK
        assert cancel_resp.json()["data"]["status"] == "cancelled"

    def test_day_book_lifecycle_and_lock_protection(self, api_client, library_token, library_tenant, student_enrollment):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")
        branch = library_tenant.branches.first()
        today = timezone.now().date()

        # Set opening cash
        open_resp = api_client.put(
            "/v1/library/day-book/opening",
            {
                'date': str(today),
                'branch_id': str(branch.id),
                'opening_cash': "500.00",
            },
            format="json"
        )
        assert open_resp.status_code == status.HTTP_200_OK
        assert open_resp.json()["data"]["opening_cash"] == "500.00"

        # Create cash payment of 1000.00
        Payment.objects.create(
            library=library_tenant,
            student=student_enrollment,
            branch=branch,
            amount=Decimal('1000.00'),
            mode='cash',
            status='paid',
            payment_date=today,
        )

        # GET /v1/library/day-book
        db_resp = api_client.get(f"/v1/library/day-book?date={today}&branch_id={branch.id}")
        assert db_resp.status_code == status.HTTP_200_OK
        rows = db_resp.json()["data"]["rows"]
        assert len(rows) == 1
        assert rows[0]["expected_cash"] == "1500.00"

        # Close day book with counted cash
        close_resp = api_client.post(
            "/v1/library/day-book/close",
            {
                'date': str(today),
                'branch_id': str(branch.id),
                'counted_cash': "1500.00",
                'note': 'Cash counter balanced perfectly',
            },
            format="json"
        )
        assert close_resp.status_code == status.HTTP_200_OK
        assert close_resp.json()["data"]["is_locked"] is True
        assert close_resp.json()["data"]["difference"] == "0.00"

        # Attempt to collect new payment on locked day -> 409 day_book_locked
        locked_pay = api_client.post(
            "/v1/library/payments",
            {
                'enrollment_id': str(student_enrollment.id),
                'amount': "200.00",
                'mode': 'cash',
                'payment_date': str(today),
            },
            format="json",
            HTTP_IDEMPOTENCY_KEY=str(uuid.uuid4())
        )
        assert locked_pay.status_code == status.HTTP_409_CONFLICT
        assert locked_pay.json()["error"]["code"] == "day_book_locked"

        # Owner unlocks day book
        record_id = close_resp.json()["data"]["id"]
        unlock_resp = api_client.post(
            f"/v1/library/day-book/{record_id}/unlock",
            {'reason': 'Need to register late evening student payment'},
            format="json"
        )
        assert unlock_resp.status_code == status.HTTP_200_OK
        assert unlock_resp.json()["data"]["is_locked"] is False

    def test_dues_and_charges_management(self, api_client, library_token, library_tenant, student_enrollment):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")

        # POST /v1/library/charges
        charge_resp = api_client.post(
            "/v1/library/charges",
            {
                'enrollment_id': str(student_enrollment.id),
                'charge_type': 'late_fee',
                'description': 'Late book return fine',
                'amount': "150.00",
            },
            format="json"
        )
        assert charge_resp.status_code == status.HTTP_201_CREATED
        due_id = charge_resp.json()["data"]["id"]

        # PATCH /v1/library/dues/{charge_id} promise date
        patch_resp = api_client.patch(
            f"/v1/library/dues/{due_id}",
            {'promise_date': str(timezone.now().date() + timezone.timedelta(days=3))},
            format="json"
        )
        assert patch_resp.status_code == status.HTTP_200_OK
        assert patch_resp.json()["data"]["promise_date"] is not None

        # POST /v1/library/dues/{charge_id}/waive
        waive_resp = api_client.post(
            f"/v1/library/dues/{due_id}/waive",
            {'reason': 'Medical emergency concession by Director'},
            format="json"
        )
        assert waive_resp.status_code == status.HTTP_200_OK
        assert waive_resp.json()["data"]["status"] == "waived"


@pytest.mark.django_db
class TestPriority6StudentPaymentFlow:
    """Tests covering Section 8.3 Student payment checkout & verification."""

    def test_student_order_creation_with_coupon_and_verify(
        self, api_client, student_token, library_tenant, student_enrollment, student_user
    ):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {student_token}")

        # Seed fee plan
        plan = FeePlan.objects.create(
            library=library_tenant,
            name='UPSC 30-Day Reserved',
            duration_days=30,
            price=Decimal('1000.00'),
        )
        # Seed coupon
        Coupon.objects.create(
            library=library_tenant,
            code='WELCOME20',
            discount_type='Percentage',
            discount_value=Decimal('20.00'),
            usage_limit=50,
            valid_until=timezone.now().date() + timezone.timedelta(days=30),
        )

        # POST /v1/student/payments/orders
        order_resp = api_client.post(
            "/v1/student/payments/orders",
            {
                'plan_id': str(plan.id),
                'coupon_code': 'WELCOME20',
            },
            format="json",
            HTTP_IDEMPOTENCY_KEY=str(uuid.uuid4())
        )
        assert order_resp.status_code == status.HTTP_201_CREATED
        order_data = order_resp.json()["data"]
        assert order_data["amount"] == "1000.00"
        assert order_data["discount_amount"] == "200.00"
        assert order_data["final_amount"] == "800.00"
        payment_id = order_data["payment_id"]

        # POST /v1/student/payments/verify
        verify_resp = api_client.post(
            "/v1/student/payments/verify",
            {
                'payment_id': payment_id,
                'razorpay_order_id': order_data["razorpay"]["order_id"],
                'razorpay_payment_id': 'pay_mock12345678',
                'razorpay_signature': 'sig_mock_valid_signature',
            },
            format="json",
            HTTP_IDEMPOTENCY_KEY=str(uuid.uuid4())
        )
        assert verify_resp.status_code == status.HTTP_200_OK
        verify_data = verify_resp.json()["data"]
        assert verify_data["status"] == "paid"
        assert verify_data["membership"]["status"] == "Active"

        # Verify student enrollment is now Live
        student_enrollment.refresh_from_db()
        assert student_enrollment.status == "Live"

        # GET /v1/student/payments
        history_resp = api_client.get("/v1/student/payments")
        assert history_resp.status_code == status.HTTP_200_OK
        payments = history_resp.json()["data"]
        assert len(payments) == 1
        assert payments[0]["id"] == payment_id

        # GET /v1/student/payments/{id}/receipt
        receipt_resp = api_client.get(f"/v1/student/payments/{payment_id}/receipt")
        assert receipt_resp.status_code == status.HTTP_200_OK
        assert "receipt_url" in receipt_resp.json()["data"]
