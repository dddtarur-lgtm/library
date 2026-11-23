"""Library SMTP configuration, test-email dispatch, and transactional email log views."""
import uuid

from django.core.mail import EmailMessage, get_connection
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView

from apps.accounts.permissions import IsLibraryOwner
from utils.responses import error, success

from .models import EmailConnectionHealth, SmtpConfig, TransactionalEmailLog
from .serializers import (
    SmtpConfigSerializer,
    SmtpTestSerializer,
    TransactionalEmailLogSerializer,
)


def _resolve_owner_library(user):
    """Resolve the Library associated with a Library Owner."""
    if getattr(user, 'library_id', None):
        return user.library
    owned = getattr(user, 'owned_library', None)
    if owned:
        return owned
    raise ValidationError({'library': 'User is not associated with a library.'})


@extend_schema(tags=['Library Email Management'])
class LibrarySmtpConfigView(APIView):
    """Retrieve or update the library's custom SMTP configuration."""

    permission_classes = [IsLibraryOwner]

    def get(self, request):
        library = _resolve_owner_library(request.user)
        config = SmtpConfig.objects.filter(library=library).first()
        if not config:
            return success(data=None, message='SMTP not configured yet')
        return success(data=SmtpConfigSerializer(config).data)

    def put(self, request):
        library = _resolve_owner_library(request.user)
        config = SmtpConfig.objects.filter(library=library).first()
        serializer = SmtpConfigSerializer(config, data=request.data)
        serializer.is_valid(raise_exception=True)

        # Preserve existing password if omitted on update.
        if config and not serializer.validated_data.get('password'):
            serializer.validated_data['password'] = config.password

        saved = serializer.save(library=library, is_verified=False)
        return success(
            data=SmtpConfigSerializer(saved).data,
            message='SMTP configuration saved',
        )


@extend_schema(tags=['Library Email Management'])
class LibrarySmtpTestView(APIView):
    """Send a test email using the library's SMTP settings and record health/log."""

    permission_classes = [IsLibraryOwner]

    def post(self, request):
        library = _resolve_owner_library(request.user)
        config = SmtpConfig.objects.filter(library=library).first()
        if not config:
            return error(
                'Please configure SMTP settings before sending a test email.',
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SmtpTestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        recipient = serializer.validated_data.get('recipient_email') or request.user.email

        now = timezone.now()
        subject = f'[{library.name}] SMTP Connection Test'
        from_header = (
            f'{config.from_name} <{config.from_email}>'
            if config.from_name
            else config.from_email
        )

        try:
            connection = get_connection(
                host=config.host,
                port=config.port,
                username=config.username,
                password=config.password,
                use_tls=config.use_tls,
                use_ssl=config.use_ssl,
                fail_silently=False,
            )
            email_msg = EmailMessage(
                subject=subject,
                body='This is a test email verifying your library SMTP configuration.',
                from_email=from_header,
                to=[recipient],
                connection=connection,
            )
            email_msg.send(fail_silently=False)
        except Exception as exc:
            err_msg = str(exc)
            config.is_verified = False
            config.last_tested_at = now
            config.save(update_fields=['is_verified', 'last_tested_at', 'updated_at'])

            EmailConnectionHealth.objects.update_or_create(
                library=library,
                defaults={
                    'status': 'Failed',
                    'last_checked_at': now,
                    'last_error': err_msg,
                },
            )
            library.email_connection_status = 'Failed'
            library.save(update_fields=['email_connection_status', 'updated_at'])

            log = TransactionalEmailLog.objects.create(
                library=library,
                recipient=recipient,
                subject=subject,
                template_name='smtp_test',
                status='Failed',
                error_message=err_msg,
            )
            return error(
                'SMTP test email failed',
                errors={'detail': err_msg, 'log_id': str(log.id)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        config.is_verified = True
        config.last_tested_at = now
        config.save(update_fields=['is_verified', 'last_tested_at', 'updated_at'])

        EmailConnectionHealth.objects.update_or_create(
            library=library,
            defaults={
                'status': 'Connected',
                'last_checked_at': now,
                'last_success_at': now,
                'last_error': '',
            },
        )
        library.email_connection_status = 'Connected'
        library.save(update_fields=['email_connection_status', 'updated_at'])

        log = TransactionalEmailLog.objects.create(
            library=library,
            recipient=recipient,
            subject=subject,
            template_name='smtp_test',
            status='Sent',
            provider_message_id=f'msg-{uuid.uuid4().hex[:12]}',
        )
        return success(
            data=TransactionalEmailLogSerializer(log).data,
            message='Test email sent successfully',
        )


@extend_schema(tags=['Library Email Management'])
class LibraryEmailLogListView(generics.ListAPIView):
    """List transactional email send logs for the authenticated library."""

    permission_classes = [IsLibraryOwner]
    serializer_class = TransactionalEmailLogSerializer
    filterset_fields = ['status', 'template_name']
    search_fields = ['recipient', 'subject', 'template_name']
    ordering_fields = ['sent_at', 'status']

    def get_queryset(self):
        library = _resolve_owner_library(self.request.user)
        return TransactionalEmailLog.objects.filter(library=library).order_by('-sent_at')
