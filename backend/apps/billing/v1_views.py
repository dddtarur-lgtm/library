"""Views for Section 11 (Library fees & payments) and Section 8.3 (Student payments)."""
import uuid
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum, Q, Count
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsLibraryAudience, IsStudentAudience
from apps.core.exceptions import PlatformAPIException
from apps.core.context import get_current_org_id
from apps.libraries.models import Library, Branch, ActivityLog
from apps.students.models import Student, StudentMembership
from apps.billing.models import (
    Payment, FeeDue, Refund, Invoice, CashDayBookRecord, Coupon, FeePlan
)
from apps.billing.v1_serializers import (
    PaymentItemSerializer, PaymentDetailSerializer, PaymentCollectSerializer,
    PaymentUpdateSerializer, PaymentCancelSerializer, PaymentRefundSerializer,
    RefundItemSerializer, FeeDueItemSerializer, ChargeCreateSerializer,
    DueUpdateSerializer, DueWaiveSerializer, DueRemindSerializer,
    DayBookOpeningSerializer, DayBookCloseSerializer, DayBookUnlockSerializer,
    InvoiceItemSerializer, StudentOrderCreateSerializer, StudentPaymentVerifySerializer
)


def _get_current_library(request):
    org_id = get_current_org_id() or getattr(request, 'org_id', None)
    if not org_id:
        raise PlatformAPIException('Tenant organization context missing.', code='unauthorized', status_code=status.HTTP_401_UNAUTHORIZED)
    library = Library.objects.filter(pk=org_id).first()
    if not library:
        raise PlatformAPIException('Library tenant not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
    return library


# ==============================================================================
# 11.1 Fees Overview & Charts
# ==============================================================================

class LibraryFeesSummaryView(APIView):
    """GET /library/fees/summary"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        today = timezone.now().date()
        first_day_of_month = today.replace(day=1)

        branch_id = request.query_params.get('branch_id')
        payments_qs = Payment.objects.filter(library=library, status='paid')
        refunds_qs = Refund.objects.filter(library=library, status='completed')
        dues_qs = FeeDue.objects.filter(library=library, status='open')

        if branch_id:
            payments_qs = payments_qs.filter(branch_id=branch_id)
            dues_qs = dues_qs.filter(student__branch_id=branch_id)

        today_col = payments_qs.filter(payment_date=today).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
        month_col = payments_qs.filter(payment_date__gte=first_day_of_month, payment_date__lte=today).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
        refunds_month = refunds_qs.filter(created_at__date__gte=first_day_of_month).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')

        total_dues = dues_qs.aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
        due_students = dues_qs.values('student_id').distinct().count()

        day_book_locked = CashDayBookRecord.objects.filter(library=library, date=today, is_locked=True).exists()
        day_book_status = 'closed' if day_book_locked else 'open'

        return Response({
            'today_collection': f"{today_col:.2f}",
            'month_collection': f"{month_col:.2f}",
            'month_target': "100000.00",
            'total_dues': f"{total_dues:.2f}",
            'due_students': due_students,
            'refunds_month': f"{refunds_month:.2f}",
            'day_book_status': day_book_status,
        })


class LibraryFeesChartsView(APIView):
    """GET /library/fees/charts"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        today = timezone.now().date()

        collections_by_day = []
        for i in range(6, -1, -1):
            d = today - timezone.timedelta(days=i)
            day_payments = Payment.objects.filter(library=library, payment_date=d, status='paid')
            by_mode = {}
            for mode_key, _ in Payment._meta.get_field('mode').choices:
                by_mode[mode_key] = f"{(day_payments.filter(mode=mode_key).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')):.2f}"
            collections_by_day.append({
                'date': str(d),
                **by_mode,
            })

        dues_aging = [
            {'bucket': '0-7', 'amount': '0.00', 'students': 0},
            {'bucket': '8-15', 'amount': '0.00', 'students': 0},
            {'bucket': '16-30', 'amount': '0.00', 'students': 0},
            {'bucket': '30+', 'amount': '0.00', 'students': 0},
        ]

        return Response({
            'collections_by_day': collections_by_day,
            'revenue_by_plan': [],
            'dues_aging': dues_aging,
        })


# ==============================================================================
# 11.2 Payments
# ==============================================================================

class LibraryPaymentsView(APIView):
    """GET /library/payments, POST /library/payments"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = Payment.objects.filter(library=library)

        q = request.query_params.get('q')
        if q:
            qs = qs.filter(
                Q(receipt_no__icontains=q) |
                Q(student__first_name__icontains=q) |
                Q(student__last_name__icontains=q) |
                Q(transaction_ref__icontains=q)
            )

        mode = request.query_params.get('mode')
        if mode:
            qs = qs.filter(mode=mode)

        status_param = request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        branch_id = request.query_params.get('branch_id')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)

        date_from = request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(payment_date__gte=date_from)
        date_to = request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(payment_date__lte=date_to)

        # Meta totals
        total_amount = qs.aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
        by_mode = {}
        for m, _ in Payment._meta.get_field('mode').choices:
            s = qs.filter(mode=m).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
            by_mode[m] = f"{s:.2f}"

        count = qs.count()
        page = max(1, int(request.query_params.get('page', 1)))
        limit = min(100, max(1, int(request.query_params.get('limit', 25))))
        start = (page - 1) * limit
        items = qs[start:start + limit]

        serializer = PaymentItemSerializer(items, many=True)
        return Response(serializer.data, headers={
            'X-Total-Count': str(count),
        })

    def post(self, request):
        library = _get_current_library(request)
        serializer = PaymentCollectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        student = Student.objects.filter(pk=data['enrollment_id'], library=library).first()
        if not student:
            raise PlatformAPIException('Student not found in library.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        payment_date = data.get('payment_date') or timezone.now().date()
        branch = student.branch

        # Check day book lock
        if branch and CashDayBookRecord.objects.filter(library=library, branch=branch, date=payment_date, is_locked=True).exists():
            raise PlatformAPIException('Day book for this date is closed.', code='day_book_locked', status_code=status.HTTP_409_CONFLICT)

        # Live in one library enforcement rule:
        # If student is becoming Live, check if active elsewhere!
        other_live = Student.objects.filter(
            user=student.user,
            status__iexact='Live'
        ).exclude(pk=student.pk).exists()

        if other_live:
            raise PlatformAPIException(
                'Student is already active/Live in another library.',
                code='live_in_another_library',
                status_code=status.HTTP_409_CONFLICT
            )

        with transaction.atomic():
            # If student was not Live, activate them now
            if student.status != 'Live':
                student.status = 'Live'
                student.save()

            # Create payment record
            payment = Payment.objects.create(
                library=library,
                student=student,
                branch=branch,
                membership_id=data.get('membership_id'),
                amount=data['amount'],
                discount_amount=data.get('discount_amount', Decimal('0.00')),
                mode=data['mode'],
                status='paid',
                payment_date=payment_date,
                paid_at=timezone.now(),
                transaction_ref=data.get('reference', ''),
                notes=data.get('notes', ''),
                recorded_by=request.user if request.user.is_authenticated else None,
            )

            # Auto-generate Invoice
            taxable = (payment.amount / Decimal('1.18')).quantize(Decimal('0.01'))
            tax = (payment.amount - taxable).quantize(Decimal('0.01'))
            invoice = Invoice.objects.create(
                library=library,
                student=student,
                payment=payment,
                invoice_date=payment_date,
                taxable_amount=taxable,
                tax_amount=tax,
                gst_rate=Decimal('18.00'),
                total_amount=payment.amount,
            )

            # Settle dues
            charge_ids = data.get('charge_ids', [])
            if charge_ids:
                FeeDue.objects.filter(pk__in=charge_ids, library=library, student=student).update(status='paid')
            else:
                oldest_due = FeeDue.objects.filter(library=library, student=student, status='open').first()
                if oldest_due and oldest_due.amount <= payment.amount:
                    oldest_due.status = 'paid'
                    oldest_due.save()

            # Audit log
            ActivityLog.objects.create(
                library=library,
                user=request.user if request.user.is_authenticated else None,
                action='PAYMENT_COLLECTED',
                entity_type='Payment',
                entity_id=str(payment.id),
                details={'amount': str(payment.amount), 'mode': payment.mode, 'receipt_no': payment.receipt_no},
                ip_address=request.META.get('REMOTE_ADDR'),
            )

        remaining_due = FeeDue.objects.filter(library=library, student=student, status='open').aggregate(s=Sum('amount'))['s'] or Decimal('0.00')

        return Response({
            'payment': PaymentItemSerializer(payment).data,
            'receipt_url': f"/v1/library/payments/{payment.id}/receipt",
            'invoice': InvoiceItemSerializer(invoice).data,
            'remaining_due': f"{remaining_due:.2f}",
        }, status=status.HTTP_201_CREATED)


class LibraryPaymentDetailView(APIView):
    """GET /library/payments/{id}, PATCH /library/payments/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request, pk):
        library = _get_current_library(request)
        payment = Payment.objects.filter(pk=pk, library=library).first()
        if not payment:
            raise PlatformAPIException('Payment not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        serializer = PaymentDetailSerializer(payment)
        return Response(serializer.data)

    def patch(self, request, pk):
        library = _get_current_library(request)
        payment = Payment.objects.filter(pk=pk, library=library).first()
        if not payment:
            raise PlatformAPIException('Payment not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        serializer = PaymentUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        target_date = data.get('payment_date', payment.payment_date)
        if payment.branch and CashDayBookRecord.objects.filter(library=library, branch=payment.branch, date=target_date, is_locked=True).exists():
            raise PlatformAPIException('Day book for this date is closed.', code='day_book_locked', status_code=status.HTTP_409_CONFLICT)

        if 'amount' in data:
            payment.amount = data['amount']
        if 'mode' in data:
            payment.mode = data['mode']
        if 'reference' in data:
            payment.transaction_ref = data['reference']
        if 'notes' in data:
            payment.notes = data['notes']
        if 'payment_date' in data:
            payment.payment_date = data['payment_date']
        payment.save()

        # Risky audit log
        ActivityLog.objects.create(
            library=library,
            user=request.user if request.user.is_authenticated else None,
            action='PAYMENT_EDITED',
            entity_type='Payment',
            entity_id=str(payment.id),
            details={'reason': data['reason'], 'is_risky': True},
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response(PaymentDetailSerializer(payment).data)


class LibraryPaymentCancelView(APIView):
    """POST /library/payments/{id}/cancel"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        payment = Payment.objects.filter(pk=pk, library=library).first()
        if not payment:
            raise PlatformAPIException('Payment not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        serializer = PaymentCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data['reason']

        payment.status = 'cancelled'
        payment.save()

        ActivityLog.objects.create(
            library=library,
            user=request.user if request.user.is_authenticated else None,
            action='PAYMENT_CANCELLED',
            entity_type='Payment',
            entity_id=str(payment.id),
            details={'reason': reason, 'is_risky': True},
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response(PaymentDetailSerializer(payment).data)


class LibraryPaymentRefundsView(APIView):
    """POST /library/payments/{id}/refunds"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        payment = Payment.objects.filter(pk=pk, library=library).first()
        if not payment:
            raise PlatformAPIException('Payment not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        serializer = PaymentRefundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        refund_amt = data['amount']
        max_refundable = payment.amount - payment.refund_amount
        if refund_amt > max_refundable:
            raise PlatformAPIException(
                f'Refund amount exceeds max refundable balance ({max_refundable}).',
                code='refund_exceeds_payment',
                status_code=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            refund = Refund.objects.create(
                library=library,
                payment=payment,
                amount=refund_amt,
                mode=data['mode'],
                reason=data['reason'],
                status='completed',
                recorded_by=request.user if request.user.is_authenticated else None,
            )

            payment.refund_amount += refund_amt
            payment.refund_reason = data['reason']
            if payment.refund_amount >= payment.amount:
                payment.status = 'refunded'
            else:
                payment.status = 'partially_refunded'
            payment.save()

            ActivityLog.objects.create(
                library=library,
                user=request.user if request.user.is_authenticated else None,
                action='PAYMENT_REFUNDED',
                entity_type='Payment',
                entity_id=str(payment.id),
                details={'amount': str(refund_amt), 'reason': data['reason'], 'is_risky': True},
                ip_address=request.META.get('REMOTE_ADDR'),
            )

        return Response(RefundItemSerializer(refund).data, status=status.HTTP_201_CREATED)


class LibraryPaymentReceiptView(APIView):
    """GET /library/payments/{id}/receipt"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request, pk):
        library = _get_current_library(request)
        payment = Payment.objects.filter(pk=pk, library=library).first()
        if not payment:
            raise PlatformAPIException('Payment not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        return Response({'receipt_url': f"https://cdn.platform.library.in/receipts/{payment.receipt_no}.pdf"})


class LibraryPaymentReceiptSendView(APIView):
    """POST /library/payments/{id}/receipt/send"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        payment = Payment.objects.filter(pk=pk, library=library).first()
        if not payment:
            raise PlatformAPIException('Payment not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryPaymentLinksView(APIView):
    """POST /library/payments/links"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request):
        library = _get_current_library(request)
        enrollment_id = request.data.get('enrollment_id')
        amount = request.data.get('amount')
        student = Student.objects.filter(pk=enrollment_id, library=library).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        link_id = uuid.uuid4().hex[:12]
        return Response({
            'link_url': f"https://pay.platform.library.in/plink/{link_id}",
            'expires_at': str(timezone.now() + timezone.timedelta(hours=24)),
        }, status=status.HTTP_201_CREATED)


class LibraryRefundsView(APIView):
    """GET /library/refunds"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = Refund.objects.filter(library=library)
        serializer = RefundItemSerializer(qs, many=True)
        return Response(serializer.data)


class LibraryPaymentsExportView(APIView):
    """POST /library/payments/export"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request):
        return Response({'export_id': str(uuid.uuid4())}, status=status.HTTP_202_ACCEPTED)


# ==============================================================================
# 11.3 Dues & Charges
# ==============================================================================

class LibraryDuesView(APIView):
    """GET /library/dues"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = FeeDue.objects.filter(library=library, status='open')

        q = request.query_params.get('q')
        if q:
            qs = qs.filter(
                Q(student__first_name__icontains=q) |
                Q(student__last_name__icontains=q) |
                Q(description__icontains=q)
            )

        branch_id = request.query_params.get('branch_id')
        if branch_id:
            qs = qs.filter(student__branch_id=branch_id)

        total_due = qs.aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
        serializer = FeeDueItemSerializer(qs, many=True)
        return Response(serializer.data, headers={
            'X-Total-Due': f"{total_due:.2f}",
        })


class LibraryChargesView(APIView):
    """POST /library/charges"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request):
        library = _get_current_library(request)
        serializer = ChargeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        student = Student.objects.filter(pk=data['enrollment_id'], library=library).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        due = FeeDue.objects.create(
            library=library,
            student=student,
            charge_type=data['charge_type'],
            description=data['description'],
            amount=data['amount'],
            due_date=data.get('due_on') or timezone.now().date(),
            status='open',
        )

        return Response(FeeDueItemSerializer(due).data, status=status.HTTP_201_CREATED)


class LibraryDueDetailView(APIView):
    """PATCH /library/dues/{charge_id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def patch(self, request, pk):
        library = _get_current_library(request)
        due = FeeDue.objects.filter(pk=pk, library=library).first()
        if not due:
            raise PlatformAPIException('Due not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        serializer = DueUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if 'promise_date' in data:
            due.promise_date = data['promise_date']
        if 'due_on' in data:
            due.due_date = data['due_on']
        due.save()

        return Response(FeeDueItemSerializer(due).data)


class LibraryDueWaiveView(APIView):
    """POST /library/dues/{charge_id}/waive"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        due = FeeDue.objects.filter(pk=pk, library=library).first()
        if not due:
            raise PlatformAPIException('Due not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        serializer = DueWaiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data['reason']

        due.status = 'waived'
        due.waived_reason = reason
        due.save()

        ActivityLog.objects.create(
            library=library,
            user=request.user if request.user.is_authenticated else None,
            action='DUE_WAIVED',
            entity_type='FeeDue',
            entity_id=str(due.id),
            details={'reason': reason, 'is_risky': True},
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response(FeeDueItemSerializer(due).data)


class LibraryDuesRemindPreviewView(APIView):
    """POST /library/dues/remind/preview"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request):
        library = _get_current_library(request)
        charge_ids = request.data.get('charge_ids', [])
        qs = FeeDue.objects.filter(library=library, status='open')
        if charge_ids:
            qs = qs.filter(pk__in=charge_ids)
        cnt = qs.values('student_id').distinct().count()
        return Response({
            'recipient_count': cnt,
            'message_preview': 'Dear student, kindly clear your overdue library fees of INR {amount}.',
        })


class LibraryDuesRemindView(APIView):
    """POST /library/dues/remind"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request):
        library = _get_current_library(request)
        serializer = DueRemindSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        charge_ids = serializer.validated_data.get('charge_ids', [])

        qs = FeeDue.objects.filter(library=library, status='open')
        if charge_ids:
            qs = qs.filter(pk__in=charge_ids)

        cnt = qs.values('student_id').distinct().count()
        qs.update(last_reminder_at=timezone.now())

        return Response({
            'notification_id': str(uuid.uuid4()),
            'recipient_count': cnt,
        }, status=status.HTTP_202_ACCEPTED)


# ==============================================================================
# 11.4 Day Book (Daily Cash)
# ==============================================================================

class LibraryDayBookView(APIView):
    """GET /library/day-book"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        target_date = request.query_params.get('date') or timezone.now().date()
        branch_id = request.query_params.get('branch_id')

        records_qs = CashDayBookRecord.objects.filter(library=library, date=target_date)
        if branch_id:
            records_qs = records_qs.filter(branch_id=branch_id)

        rows = []
        for r in records_qs:
            cash_col = Payment.objects.filter(
                library=library,
                branch=r.branch,
                payment_date=target_date,
                mode='cash',
                status='paid'
            ).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')

            expected = r.opening_cash + cash_col
            diff = (r.counted_cash - expected) if r.counted_cash is not None else None

            rows.append({
                'id': str(r.id),
                'member': {'id': str(r.member.id), 'name': r.member.name or r.member.first_name},
                'opening_cash': f"{r.opening_cash:.2f}",
                'collected': {'cash': f"{cash_col:.2f}"},
                'expected_cash': f"{expected:.2f}",
                'counted_cash': f"{r.counted_cash:.2f}" if r.counted_cash is not None else None,
                'difference': f"{diff:.2f}" if diff is not None else None,
                'closed_at': str(r.closed_at) if r.closed_at else None,
                'is_locked': r.is_locked,
            })

        return Response({
            'date': str(target_date),
            'rows': rows,
            'totals': {'rows_count': len(rows)},
        })


class LibraryDayBookOpeningView(APIView):
    """PUT /library/day-book/opening"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def put(self, request):
        library = _get_current_library(request)
        serializer = DayBookOpeningSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        branch = Branch.objects.filter(pk=data['branch_id'], library=library).first()
        if not branch:
            raise PlatformAPIException('Branch not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        member = request.user

        record, _ = CashDayBookRecord.objects.get_or_create(
            library=library,
            branch=branch,
            member=member,
            date=data['date'],
            defaults={'opening_cash': data['opening_cash']}
        )
        record.opening_cash = data['opening_cash']
        record.save()

        return Response({
            'id': str(record.id),
            'date': str(record.date),
            'branch_id': str(branch.id),
            'opening_cash': f"{record.opening_cash:.2f}",
            'is_locked': record.is_locked,
        })


class LibraryDayBookCloseView(APIView):
    """POST /library/day-book/close"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request):
        library = _get_current_library(request)
        serializer = DayBookCloseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        branch = Branch.objects.filter(pk=data['branch_id'], library=library).first()
        if not branch:
            raise PlatformAPIException('Branch not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        record = CashDayBookRecord.objects.filter(
            library=library,
            branch=branch,
            member=request.user,
            date=data['date']
        ).first()

        if not record:
            record = CashDayBookRecord.objects.create(
                library=library,
                branch=branch,
                member=request.user,
                date=data['date'],
                opening_cash=Decimal('0.00'),
            )

        if record.is_locked:
            raise PlatformAPIException('Day book already closed for this date.', code='already_closed', status_code=status.HTTP_409_CONFLICT)

        cash_col = Payment.objects.filter(
            library=library,
            branch=branch,
            payment_date=data['date'],
            mode='cash',
            status='paid'
        ).aggregate(s=Sum('amount'))['s'] or Decimal('0.00')

        expected = record.opening_cash + cash_col
        counted = data['counted_cash']
        diff = counted - expected

        record.counted_cash = counted
        record.difference = diff
        record.note = data.get('note', '')
        record.is_locked = True
        record.closed_at = timezone.now()
        record.save()

        return Response({
            'id': str(record.id),
            'difference': f"{diff:.2f}",
            'closed_at': str(record.closed_at),
            'is_locked': record.is_locked,
        })


class LibraryDayBookUnlockView(APIView):
    """POST /library/day-book/{id}/unlock"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        record = CashDayBookRecord.objects.filter(pk=pk, library=library).first()
        if not record:
            raise PlatformAPIException('Day book record not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        serializer = DayBookUnlockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data['reason']

        record.is_locked = False
        record.save()

        ActivityLog.objects.create(
            library=library,
            user=request.user if request.user.is_authenticated else None,
            action='DAY_BOOK_UNLOCKED',
            entity_type='CashDayBookRecord',
            entity_id=str(record.id),
            details={'reason': reason, 'is_risky': True},
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response({
            'id': str(record.id),
            'is_locked': record.is_locked,
        })


class LibraryDayBookHistoryView(APIView):
    """GET /library/day-book/history"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        qs = CashDayBookRecord.objects.filter(library=library, is_locked=True)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)

        rows = [
            {
                'date': str(r.date),
                'member': r.member.first_name,
                'difference': f"{(r.difference or Decimal('0.00')):.2f}",
                'closed_at': str(r.closed_at),
            }
            for r in qs
        ]

        return Response({'history': rows})


# ==============================================================================
# 11.5 Invoices and GST
# ==============================================================================

class LibraryInvoicesView(APIView):
    """GET /library/invoices"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = Invoice.objects.filter(library=library)

        q = request.query_params.get('q')
        if q:
            qs = qs.filter(
                Q(invoice_no__icontains=q) |
                Q(student__first_name__icontains=q) |
                Q(student__last_name__icontains=q)
            )

        date_from = request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(invoice_date__gte=date_from)
        date_to = request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(invoice_date__lte=date_to)

        serializer = InvoiceItemSerializer(qs, many=True)
        return Response(serializer.data)


class LibraryInvoiceDetailView(APIView):
    """GET /library/invoices/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request, pk):
        library = _get_current_library(request)
        invoice = Invoice.objects.filter(pk=pk, library=library).first()
        if not invoice:
            raise PlatformAPIException('Invoice not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        serializer = InvoiceItemSerializer(invoice)
        return Response(serializer.data)


class LibraryInvoiceResendView(APIView):
    """POST /library/invoices/{id}/resend"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        invoice = Invoice.objects.filter(pk=pk, library=library).first()
        if not invoice:
            raise PlatformAPIException('Invoice not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryInvoicesExportView(APIView):
    """POST /library/invoices/export"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request):
        month = request.data.get('month')
        if not month:
            raise PlatformAPIException('Month parameter is required (YYYY-MM).', code='invalid_parameters', status_code=status.HTTP_400_BAD_REQUEST)
        return Response({'export_id': str(uuid.uuid4())}, status=status.HTTP_202_ACCEPTED)


class LibraryInvoicesGSTSummaryView(APIView):
    """GET /library/invoices/gst-summary"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        month = request.query_params.get('month')
        if not month:
            raise PlatformAPIException('Month parameter required (YYYY-MM).', code='invalid_parameters', status_code=status.HTTP_400_BAD_REQUEST)

        parts = month.split('-')
        year, m = int(parts[0]), int(parts[1])
        qs = Invoice.objects.filter(library=library, invoice_date__year=year, invoice_date__month=m)

        taxable = qs.aggregate(s=Sum('taxable_amount'))['s'] or Decimal('0.00')
        tax = qs.aggregate(s=Sum('tax_amount'))['s'] or Decimal('0.00')
        total = qs.aggregate(s=Sum('total_amount'))['s'] or Decimal('0.00')

        return Response({
            'taxable_amount': f"{taxable:.2f}",
            'tax_amount': f"{tax:.2f}",
            'total_amount': f"{total:.2f}",
            'count': qs.count(),
            'by_rate': [
                {'gst_rate': '18.00', 'taxable': f"{taxable:.2f}", 'tax': f"{tax:.2f}"}
            ]
        })


# ==============================================================================
# 8.3 Student Payment APIs
# ==============================================================================

class StudentPaymentOrdersView(APIView):
    """POST /student/payments/orders"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def post(self, request):
        serializer = StudentOrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        student = Student.objects.filter(user=request.user).first()
        if not student:
            raise PlatformAPIException('Student profile not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        plan = FeePlan.objects.filter(pk=data['plan_id'], library=student.library).first()
        if not plan:
            raise PlatformAPIException('Plan not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        amount = plan.price
        discount = Decimal('0.00')
        coupon_code = data.get('coupon_code', '').strip().upper()
        if coupon_code:
            coupon = Coupon.objects.filter(library=student.library, code=coupon_code, is_active=True).first()
            if not coupon:
                raise PlatformAPIException('Invalid coupon code.', code='invalid_coupon', status_code=status.HTTP_400_BAD_REQUEST)
            if coupon.discount_type == 'Percentage':
                discount = (amount * coupon.discount_value / Decimal('100.00')).quantize(Decimal('0.01'))
            else:
                discount = min(amount, coupon.discount_value)

        final_amount = max(Decimal('0.00'), amount - discount)
        start_date = data.get('start_date') or timezone.now().date()
        end_date = start_date + timezone.timedelta(days=plan.duration_days)

        # Create pending payment
        payment = Payment.objects.create(
            library=student.library,
            student=student,
            branch=student.branch,
            amount=final_amount,
            discount_amount=discount,
            mode='razorpay',
            status='pending',
            payment_date=timezone.now().date(),
        )

        return Response({
            'payment_id': str(payment.id),
            'amount': f"{amount:.2f}",
            'discount_amount': f"{discount:.2f}",
            'final_amount': f"{final_amount:.2f}",
            'start_date': str(start_date),
            'end_date': str(end_date),
            'razorpay': {
                'key_id': 'rzp_test_placeholder',
                'order_id': f"order_{uuid.uuid4().hex[:14]}",
                'amount_paise': int(final_amount * 100),
                'currency': 'INR',
                'name': student.library.name,
                'description': plan.name,
                'prefill': {
                    'name': student.name,
                    'contact': student.phone,
                    'email': student.email,
                }
            }
        }, status=status.HTTP_201_CREATED)


class StudentPaymentVerifyView(APIView):
    """POST /student/payments/verify"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def post(self, request):
        serializer = StudentPaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        student = Student.objects.filter(user=request.user).first()
        if not student:
            raise PlatformAPIException('Student profile not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        payment = Payment.objects.filter(pk=data['payment_id'], student=student).first()
        if not payment:
            raise PlatformAPIException('Payment not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        # Check Live in one library
        other_live = Student.objects.filter(user=student.user, status__iexact='Live').exclude(pk=student.pk).exists()
        if other_live:
            # Payment fails and triggers auto refund
            payment.status = 'refunded'
            payment.refund_amount = payment.amount
            payment.refund_reason = 'Student active in another library'
            payment.save()
            raise PlatformAPIException('Student active in another library. Payment marked for refund.', code='live_in_another_library', status_code=status.HTTP_409_CONFLICT)

        with transaction.atomic():
            payment.status = 'paid'
            payment.paid_at = timezone.now()
            payment.transaction_ref = data['razorpay_payment_id']
            payment.save()

            if student.status != 'Live':
                student.status = 'Live'
                student.save()

            # Create membership
            membership = StudentMembership.objects.create(
                student=student,
                shift='Full Day',
                start_date=timezone.now().date(),
                end_date=timezone.now().date() + timezone.timedelta(days=30),
                status='Active',
                amount_paid=payment.amount,
                payment_mode='Razorpay',
            )
            payment.membership = membership
            payment.save()

            # Create invoice
            taxable = (payment.amount / Decimal('1.18')).quantize(Decimal('0.01'))
            tax = (payment.amount - taxable).quantize(Decimal('0.01'))
            Invoice.objects.create(
                library=student.library,
                student=student,
                payment=payment,
                invoice_date=timezone.now().date(),
                taxable_amount=taxable,
                tax_amount=tax,
                gst_rate=Decimal('18.00'),
                total_amount=payment.amount,
            )

        return Response({
            'status': 'paid',
            'payment': PaymentItemSerializer(payment).data,
            'membership': {
                'id': str(membership.id),
                'status': membership.status,
                'start_date': str(membership.start_date),
                'end_date': str(membership.end_date),
            }
        })


class StudentPaymentsListView(APIView):
    """GET /student/payments, GET /student/payments/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request, pk=None):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            raise PlatformAPIException('Student profile not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if pk:
            payment = Payment.objects.filter(pk=pk, student=student).first()
            if not payment:
                raise PlatformAPIException('Payment not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
            return Response(PaymentDetailSerializer(payment).data)

        qs = Payment.objects.filter(student=student)
        status_param = request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        serializer = PaymentItemSerializer(qs, many=True)
        return Response(serializer.data)


class StudentPaymentReceiptView(APIView):
    """GET /student/payments/{id}/receipt"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request, pk):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            raise PlatformAPIException('Student profile not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        payment = Payment.objects.filter(pk=pk, student=student).first()
        if not payment:
            raise PlatformAPIException('Payment not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        return Response({
            'receipt_url': f"https://cdn.platform.library.in/receipts/{payment.receipt_no}.pdf",
            'invoice': InvoiceItemSerializer(payment.invoice).data if hasattr(payment, 'invoice') else None,
        })

