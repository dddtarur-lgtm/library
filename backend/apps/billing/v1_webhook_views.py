"""Views for Section 18.1 Webhooks & Callbacks."""
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.billing.models import (
    LibrarySubscription,
    Payment,
    PaymentWebhookEvent,
    PlatformPayment,
)
from apps.libraries.models import Library
from apps.students.models import Student, StudentMembership


class RazorpayLibraryWebhookView(APIView):
    """POST /v1/webhooks/razorpay/library/{webhook_key}"""
    permission_classes = [permissions.AllowAny]

    def post(self, request, webhook_key):
        event_data = request.data
        event_id = event_data.get('id') or request.headers.get('X-Razorpay-Event-Id', '')
        event_type = event_data.get('event', 'payment.captured')

        # Idempotency check
        if event_id and PaymentWebhookEvent.objects.filter(provider='razorpay_library', event_id=event_id).exists():
            return Response({'status': 'already_processed'}, status=status.HTTP_200_OK)

        if event_id:
            PaymentWebhookEvent.objects.create(
                provider='razorpay_library',
                event_id=event_id,
                event_type=event_type,
                payload=event_data,
                is_processed=True,
                processed_at=timezone.now(),
            )

        # Process payment.captured or order.paid
        payload = event_data.get('payload', {}).get('payment', {}).get('entity', {})
        order_id = payload.get('order_id')
        if order_id:
            payment = Payment.objects.filter(transaction_ref=order_id).first()
            if payment:
                payment.status = 'paid'
                payment.save(update_fields=['status', 'updated_at'])
                if payment.student:
                    payment.student.status = 'Live'
                    payment.student.save(update_fields=['status'])

        return Response({'status': 'processed'}, status=status.HTTP_200_OK)


class RazorpayPlatformWebhookView(APIView):
    """POST /v1/webhooks/razorpay/platform"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        event_data = request.data
        event_id = event_data.get('id') or request.headers.get('X-Razorpay-Event-Id', '')
        event_type = event_data.get('event', 'payment.captured')

        if event_id and PaymentWebhookEvent.objects.filter(provider='razorpay_platform', event_id=event_id).exists():
            return Response({'status': 'already_processed'}, status=status.HTTP_200_OK)

        if event_id:
            PaymentWebhookEvent.objects.create(
                provider='razorpay_platform',
                event_id=event_id,
                event_type=event_type,
                payload=event_data,
                is_processed=True,
                processed_at=timezone.now(),
            )

        payload = event_data.get('payload', {}).get('payment', {}).get('entity', {})
        order_id = payload.get('order_id')
        if order_id:
            payment = PlatformPayment.objects.filter(payment_id=order_id).first()
            if payment:
                payment.status = 'Success'
                payment.paid_at = timezone.now()
                payment.save(update_fields=['status', 'paid_at'])
                if payment.library:
                    payment.library.plan_status = 'Active'
                    payment.library.library_status = 'Active'
                    payment.library.save(update_fields=['plan_status', 'library_status'])

        return Response({'status': 'processed'}, status=status.HTTP_200_OK)


class OAuthCallbackView(APIView):
    """GET /v1/oauth/callback/{provider}"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, provider):
        code = request.GET.get('code', 'sample_code')
        state = request.GET.get('state', '')
        return Response({
            'provider': provider,
            'status': 'connected',
            'code': code,
            'state': state,
        })


class EmailWebhookView(APIView):
    """POST /v1/webhooks/email/{provider}"""
    permission_classes = [permissions.AllowAny]

    def post(self, request, provider):
        return Response({'status': 'received'})


class MessagingWebhookView(APIView):
    """POST /v1/webhooks/sms/{provider} and /v1/webhooks/whatsapp/{provider}"""
    permission_classes = [permissions.AllowAny]

    def post(self, request, provider):
        return Response({'status': 'received'})
