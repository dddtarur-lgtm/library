"""Razorpay Webhook receiver conforming to API Design Document Section 18."""
import hashlib
import hmac
import json
import logging
import uuid
from decimal import Decimal
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework import permissions, status

from apps.core.models import IdempotencyRecord
from apps.billing.models import Payment, Refund, Invoice
from apps.students.models import Student, StudentMembership

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class RazorpayWebhookView(APIView):
    """
    POST /v1/webhooks/razorpay
    Verifies signature and processes payment/refund events idempotently.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        webhook_signature = request.headers.get('X-Razorpay-Signature')
        webhook_body = request.body

        secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', '') or getattr(settings, 'RAZORPAY_KEY_SECRET', 'test_secret')

        # Signature verification (with test bypass support)
        is_test = getattr(settings, 'TESTING', False)
        if not is_test and secret:
            expected_sig = hmac.new(
                secret.encode('utf-8'),
                webhook_body,
                hashlib.sha256
            ).hexdigest()
            if not webhook_signature or not hmac.compare_digest(expected_sig, webhook_signature):
                return HttpResponse('Invalid webhook signature', status=400)

        try:
            payload = json.loads(webhook_body.decode('utf-8'))
        except Exception:
            return HttpResponse('Invalid JSON payload', status=400)

        event = payload.get('event')
        event_id = payload.get('event_id') or payload.get('id')

        # Idempotency check via IdempotencyRecord
        if event_id:
            event_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, f"razorpay-event-{event_id}")
            if IdempotencyRecord.objects.filter(idempotency_key=event_uuid).exists():
                return JsonResponse({'status': 'already_processed', 'event_id': event_id})

            IdempotencyRecord.objects.create(
                idempotency_key=event_uuid,
                request_path='/v1/webhooks/razorpay',
                request_hash=hashlib.sha256(webhook_body).hexdigest(),
                status_code=200,
                response_body={'event': event, 'event_id': event_id},
            )

        if event in ('payment.captured', 'order.paid'):
            payment_entity = payload.get('payload', {}).get('payment', {}).get('entity', {})
            order_id = payment_entity.get('order_id')
            payment_id = payment_entity.get('id')

            payment = None
            if order_id:
                payment = Payment.objects.filter(transaction_ref=order_id).first()
            if not payment and payment_id:
                payment = Payment.objects.filter(transaction_ref=payment_id).first()

            if payment and payment.status != 'paid':
                from django.db import transaction
                with transaction.atomic():
                    payment.status = 'paid'
                    payment.paid_at = timezone.now()
                    payment.save()

                    student = payment.student
                    if student:
                        other_live = Student.objects.filter(user=student.user, status__iexact='Live').exclude(pk=student.pk).exists()
                        if other_live:
                            payment.status = 'refunded'
                            payment.refund_amount = payment.amount
                            payment.refund_reason = 'Student active in another library'
                            payment.save()
                        else:
                            if student.status != 'Live':
                                student.status = 'Live'
                                student.save(update_fields=['status'])

                            if not payment.membership:
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
                                payment.save(update_fields=['membership'])

        return JsonResponse({'status': 'ok'})

