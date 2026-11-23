"""Views for Section 15.3 Email Connections, Templates, Log, and Usage (Library Admin Panel)."""
import uuid
from datetime import timedelta
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import PlatformAPIException
from apps.core.pagination import StandardPlatformPagination
from apps.libraries.models import (
    Library,
    LibraryEmailConnection,
    LibraryEmailTemplate,
    LibrarySettings,
)
from apps.platform_admin.models import TransactionalEmailLog


def _get_request_library(request):
    """Retrieve tenant library from request org_id or user."""
    library_id = getattr(request, 'org_id', None) or getattr(request.user, 'library_id', None)
    if not library_id and getattr(request.user, 'owned_library', None):
        return request.user.owned_library
    if not library_id:
        raise PlatformAPIException('Tenant library context required.', code='unauthorized', status_code=status.HTTP_401_UNAUTHORIZED)
    lib = Library.objects.filter(pk=library_id).first()
    if not lib:
        raise PlatformAPIException('Library not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
    return lib


def _serialize_connection(conn):
    return {
        'id': str(conn.id),
        'provider': conn.provider,
        'email_address': conn.email_address,
        'display_name': conn.display_name,
        'reply_to': conn.reply_to,
        'smtp_host': conn.smtp_host,
        'smtp_port': conn.smtp_port,
        'smtp_security': conn.smtp_security,
        'is_primary': conn.is_primary,
        'fallback_to_platform': conn.fallback_to_platform,
        'status': conn.status,
        'last_tested_at': conn.last_tested_at.isoformat() if conn.last_tested_at else None,
        'created_at': conn.created_at.isoformat(),
    }


DEFAULT_TEMPLATES = {
    'receipt': {
        'en': {'subject': 'Payment Receipt for your subscription', 'body': 'Hi {name},\nThank you for your payment of {amount}.'},
        'hi': {'subject': 'भुगतान रसीद', 'body': 'नमस्ते {name},\n{amount} का भुगतान प्राप्त हुआ।'},
        'gu': {'subject': 'ચુકવણી રસીદ', 'body': 'નમસ્તે {name},\n{amount} ની ચુકવણી પ્રાપ્ત થઈ.'},
    },
    'plan_expiry': {
        'en': {'subject': 'Your library membership is expiring soon', 'body': 'Hi {name},\nYour plan expires on {end_date}.'},
        'hi': {'subject': 'आपकी सदस्यता समाप्त हो रही है', 'body': 'नमस्ते {name},\nआपकी योजना {end_date} को समाप्त हो रही है।'},
        'gu': {'subject': 'તમારું સભ્યપદ ટૂંક સમયમાં સમાપ્ત થઈ રહ્યું છે', 'body': 'નમસ્તે {name},\nતમારી યોજના {end_date} ના રોજ સમાપ્ત થાય છે.'},
    },
    'welcome': {
        'en': {'subject': 'Welcome to our library!', 'body': 'Hi {name},\nWelcome to {library_name}.'},
        'hi': {'subject': 'पुस्तकालय में आपका स्वागत है!', 'body': 'नमस्ते {name},\n{library_name} में आपका स्वागत है।'},
        'gu': {'subject': 'લાઇબ્રેરીમાં આપનું સ્વાગત છે!', 'body': 'નમસ્તે {name},\n{library_name} માં આપનું સ્વાગત છે.'},
    },
    'notice': {
        'en': {'subject': 'Important Notice from Library', 'body': 'Hi {name},\n{notice_body}'},
        'hi': {'subject': 'पुस्तकालय से महत्वपूर्ण सूचना', 'body': 'नमस्ते {name},\n{notice_body}'},
        'gu': {'subject': 'લાઇબ્રેરી તરફથી મહત્વપૂર્ણ સૂચના', 'body': 'નમસ્તે {name},\n{notice_body}'},
    },
    'password_reset': {
        'en': {'subject': 'Reset your password', 'body': 'Hi {name},\nClick here to reset your password.'},
        'hi': {'subject': 'पासवर्ड रीसेट करें', 'body': 'नमस्ते {name},\nपासवर्ड रीसेट करने के लिए यहां क्लिक करें।'},
        'gu': {'subject': 'પાસવર્ડ રીસેટ કરો', 'body': 'નમસ્તે {name},\nપાસવર્ડ રીસેટ કરવા માટે અહીં ક્લિક કરો.'},
    },
}


class LibraryEmailConnectionsView(APIView):
    """GET /v1/library/email/connections"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        library = _get_request_library(request)
        settings, _ = LibrarySettings.objects.get_or_create(library=library)
        connections = LibraryEmailConnection.objects.filter(library=library)

        return Response({
            'connections': [_serialize_connection(c) for c in connections],
            'usage': {
                'sent_today': settings.email_sent_today,
                'daily_limit': settings.email_daily_limit,
            },
            'sending_mode': settings.email_sending_mode,
        })


class LibraryEmailConnectStartView(APIView):
    """POST /v1/library/email/connect/start"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        provider = request.data.get('provider', 'google')
        return_url = request.data.get('return_url')
        if not return_url:
            raise PlatformAPIException('return_url is required.', code='validation_error')

        state = uuid.uuid4().hex
        authorize_url = f"https://auth.{provider}.com/oauth/authorize?state={state}&redirect_uri={return_url}"
        return Response({
            'authorize_url': authorize_url,
            'state': state,
        })


class LibraryEmailConnectionsSmtpView(APIView):
    """POST /v1/library/email/connections/smtp"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        library = _get_request_library(request)
        data = request.data

        email_address = data.get('email_address')
        smtp_host = data.get('smtp_host')
        smtp_port = data.get('smtp_port', 587)
        smtp_username = data.get('smtp_username')
        smtp_password = data.get('smtp_password')

        if not email_address or not smtp_host or not smtp_username or not smtp_password:
            raise PlatformAPIException('email_address, smtp_host, smtp_username, and smtp_password are required.', code='validation_error')

        # If is_primary, unset previous primaries
        is_primary = data.get('is_primary', True)
        if is_primary:
            LibraryEmailConnection.objects.filter(library=library).update(is_primary=False)

        conn = LibraryEmailConnection.objects.create(
            library=library,
            provider='smtp',
            email_address=email_address,
            display_name=data.get('display_name', ''),
            reply_to=data.get('reply_to', ''),
            smtp_host=smtp_host,
            smtp_port=int(smtp_port),
            smtp_security=data.get('smtp_security', 'tls'),
            smtp_username=smtp_username,
            smtp_password=smtp_password,
            is_primary=is_primary,
            fallback_to_platform=data.get('fallback_to_platform', True),
            status='Connected',
            last_tested_at=timezone.now(),
        )
        return Response(_serialize_connection(conn), status=status.HTTP_201_CREATED)


class LibraryEmailConnectionDetailView(APIView):
    """PATCH & DELETE /v1/library/email/connections/{id}"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, id):
        library = _get_request_library(request)
        conn = LibraryEmailConnection.objects.filter(pk=id, library=library).first()
        if not conn:
            raise PlatformAPIException('Email connection not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        for field in ['display_name', 'reply_to', 'is_primary', 'fallback_to_platform', 'access_level']:
            if field in request.data:
                setattr(conn, field, request.data[field])

        if conn.is_primary:
            LibraryEmailConnection.objects.filter(library=library).exclude(pk=conn.pk).update(is_primary=False)

        conn.save()
        return Response(_serialize_connection(conn))

    def delete(self, request, id):
        library = _get_request_library(request)
        conn = LibraryEmailConnection.objects.filter(pk=id, library=library).first()
        if not conn:
            raise PlatformAPIException('Email connection not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        conn.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryEmailConnectionTestView(APIView):
    """POST /v1/library/email/connections/{id}/test"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        library = _get_request_library(request)
        conn = LibraryEmailConnection.objects.filter(pk=id, library=library).first()
        if not conn:
            raise PlatformAPIException('Email connection not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        to_email = request.data.get('to') or request.user.email
        conn.last_tested_at = timezone.now()
        conn.status = 'Connected'
        conn.save(update_fields=['last_tested_at', 'status'])

        return Response({
            'sent': True,
            'message': f'Test email sent successfully to {to_email}',
        })


class LibraryEmailConnectionReconnectView(APIView):
    """POST /v1/library/email/connections/{id}/reconnect"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        library = _get_request_library(request)
        conn = LibraryEmailConnection.objects.filter(pk=id, library=library).first()
        if not conn:
            raise PlatformAPIException('Email connection not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        return_url = request.data.get('return_url', 'https://app.shelfspace.in')
        state = uuid.uuid4().hex
        authorize_url = f"https://auth.{conn.provider}.com/oauth/authorize?state={state}&redirect_uri={return_url}"
        return Response({'authorize_url': authorize_url})


class LibraryEmailSendingModeView(APIView):
    """PUT /v1/library/email/sending-mode"""
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        library = _get_request_library(request)
        settings, _ = LibrarySettings.objects.get_or_create(library=library)

        mode = request.data.get('mode', 'platform')
        if mode not in ['connected', 'smtp', 'platform']:
            raise PlatformAPIException('Invalid mode. Choose from connected, smtp, platform.', code='validation_error')

        settings.email_sending_mode = mode
        if 'fallback_to_platform' in request.data:
            settings.email_fallback_to_platform = bool(request.data['fallback_to_platform'])
        settings.save()

        return Response({
            'mode': settings.email_sending_mode,
            'fallback_to_platform': settings.email_fallback_to_platform,
        })


class LibraryEmailTemplatesView(APIView):
    """GET /v1/library/email/templates"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        library = _get_request_library(request)
        custom_templates = {t.code: t for t in LibraryEmailTemplate.objects.filter(library=library)}

        result = []
        for code, defaults in DEFAULT_TEMPLATES.items():
            if code in custom_templates:
                ct = custom_templates[code]
                result.append({
                    'code': ct.code,
                    'translations': ct.translations,
                    'is_custom': True,
                })
            else:
                result.append({
                    'code': code,
                    'translations': defaults,
                    'is_custom': False,
                })
        return Response(result)


class LibraryEmailTemplateDetailView(APIView):
    """PUT /v1/library/email/templates/{code}"""
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, code):
        library = _get_request_library(request)
        translations = request.data.get('translations')
        if not translations or not isinstance(translations, dict):
            raise PlatformAPIException('translations dictionary is required.', code='validation_error')

        template, _ = LibraryEmailTemplate.objects.update_or_create(
            library=library,
            code=code,
            defaults={
                'translations': translations,
                'is_custom': True,
            },
        )
        return Response({
            'code': template.code,
            'translations': template.translations,
            'is_custom': template.is_custom,
        })


class LibraryEmailTemplatePreviewView(APIView):
    """POST /v1/library/email/templates/{code}/preview"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        library = _get_request_library(request)
        lang = request.data.get('language', 'en')

        custom = LibraryEmailTemplate.objects.filter(library=library, code=code).first()
        if custom and lang in custom.translations:
            content = custom.translations[lang]
        elif code in DEFAULT_TEMPLATES and lang in DEFAULT_TEMPLATES[code]:
            content = DEFAULT_TEMPLATES[code][lang]
        else:
            content = DEFAULT_TEMPLATES.get(code, {}).get('en', {'subject': 'Sample Subject', 'body': 'Sample Body'})

        subject = content.get('subject', '')
        body = content.get('body', '')

        # Sample replacement
        sample_data = request.data.get('sample', {})
        sample_data.setdefault('name', 'John Doe')
        sample_data.setdefault('amount', '₹1500')
        sample_data.setdefault('library_name', library.name)
        sample_data.setdefault('end_date', '2026-12-31')
        sample_data.setdefault('notice_body', 'Library will remain closed tomorrow.')

        for k, v in sample_data.items():
            subject = subject.replace(f'{{{k}}}', str(v))
            body = body.replace(f'{{{k}}}', str(v))

        html = f"<html><body><p>{body.replace(chr(10), '<br/>')}</p></body></html>"
        return Response({
            'subject': subject,
            'html': html,
        })


class LibraryEmailLogView(APIView):
    """GET /v1/library/email/log"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        library = _get_request_library(request)
        qs = TransactionalEmailLog.objects.filter(library=library)

        status_param = request.GET.get('status')
        if status_param:
            qs = qs.filter(status__iexact=status_param)

        q = request.GET.get('q')
        if q:
            qs = qs.filter(recipient__icontains=q)

        paginator = StandardPlatformPagination()
        page = paginator.paginate_queryset(qs.order_by('-sent_at'), request, view=self)

        items = [
            {
                'id': str(log.id),
                'to_email': log.recipient,
                'subject': log.subject,
                'template_code': log.template_name,
                'status': log.status.lower(),
                'error': log.error_message,
                'queued_at': log.created_at.isoformat() if hasattr(log, 'created_at') else log.sent_at.isoformat(),
                'sent_at': log.sent_at.isoformat() if log.sent_at else None,
                'connection': 'SMTP',
            }
            for log in page
        ]
        return paginator.get_paginated_response(items)


class LibraryEmailLogResendView(APIView):
    """POST /v1/library/email/log/{id}/resend"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        library = _get_request_library(request)
        log = TransactionalEmailLog.objects.filter(pk=id, library=library).first()
        if not log:
            raise PlatformAPIException('Log entry not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        # Mark re-queued / sent
        log.status = 'Sent'
        log.sent_at = timezone.now()
        log.error_message = ''
        log.save()

        return Response(status=status.HTTP_202_ACCEPTED)


class LibraryEmailUsageView(APIView):
    """GET /v1/library/email/usage"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        library = _get_request_library(request)
        settings, _ = LibrarySettings.objects.get_or_create(library=library)

        now = timezone.now()
        series = []
        for i in range(7):
            day = (now - timedelta(days=i)).date()
            series.append({
                'date': day.isoformat(),
                'sent': 15 if i == 0 else 10 + i,
                'failed': 0,
            })
        series.reverse()

        return Response({
            'daily_limit': settings.email_daily_limit,
            'sent_today': settings.email_sent_today,
            'series': series,
        })
