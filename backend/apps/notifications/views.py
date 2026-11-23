"""Views for library notification broadcasts and platform notification history."""
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError

from apps.accounts.permissions import (
    IsLibraryOwner,
    IsSameLibrary,
    IsSubAdminOrAbove,
    IsSuperAdmin,
)
from apps.libraries.models import Library
from apps.students.models import Student
from utils.responses import error, success

from .models import NotificationBroadcast
from .serializers import NotificationBroadcastSerializer, SendNotificationSerializer


def _resolve_audience_count(library, audience):
    """Count non-deleted students in a library matching the broadcast audience."""
    qs = Student.objects.filter(library=library, is_deleted=False)
    if audience == 'Live Members Only':
        return qs.filter(status='Live').count()
    if audience == 'Expiring Soon':
        return qs.filter(memberships__status='Expiring Soon').distinct().count()
    if audience == 'Expired':
        return qs.filter(status='Expired').count()
    return qs.count()


@extend_schema(tags=['Notifications'])
class LibraryNotificationViewSet(viewsets.ModelViewSet):
    """CRUD and send/schedule actions for library notification broadcasts."""

    serializer_class = NotificationBroadcastSerializer
    filterset_fields = ['status', 'priority', 'audience', 'display_mode']
    search_fields = ['title', 'subtitle', 'body']
    ordering_fields = ['created_at', 'sent_at', 'priority']

    def get_permissions(self):
        if self.action == 'list':
            return [IsSubAdminOrAbove(), IsSameLibrary()]
        return [IsLibraryOwner(), IsSameLibrary()]

    def get_queryset(self):
        user = self.request.user
        qs = NotificationBroadcast.objects.select_related('library', 'created_by')
        if user.role == 'SUPER_ADMIN':
            library_id = self.request.query_params.get('library')
            return qs.filter(library_id=library_id) if library_id else qs
        if not user.library_id:
            return qs.none()
        return qs.filter(library_id=user.library_id)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'SUPER_ADMIN' and self.request.data.get('library'):
            try:
                library = Library.objects.get(id=self.request.data['library'])
            except Library.DoesNotExist as exc:
                raise ValidationError({'library': 'Library not found.'}) from exc
        elif getattr(user, 'library_id', None):
            library = user.library
        elif getattr(user, 'owned_library', None):
            library = user.owned_library
        else:
            raise ValidationError({'library': 'User is not associated with a library.'})
        serializer.save(library=library, created_by=user)

    def perform_destroy(self, instance):
        if instance.status != 'Draft':
            raise ValidationError(
                {'detail': 'Only draft notifications can be deleted.'}
            )
        instance.delete()

    @extend_schema(request=SendNotificationSerializer)
    @action(detail=True, methods=['post'], url_path='send')
    def send(self, request, pk=None):
        """Send immediately or schedule a draft notification broadcast."""
        notification = self.get_object()
        if notification.status == 'Sent':
            return error(
                'Notification has already been sent.',
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SendNotificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        scheduled_at = serializer.validated_data.get('scheduled_at')

        recipients_count = _resolve_audience_count(
            notification.library, notification.audience
        )
        notification.recipients_count = recipients_count

        if scheduled_at and scheduled_at > timezone.now():
            notification.status = 'Scheduled'
            notification.sent_at = scheduled_at
            notification.save(
                update_fields=[
                    'status',
                    'sent_at',
                    'recipients_count',
                    'updated_at',
                ]
            )
            message = 'Notification scheduled successfully'
        else:
            notification.status = 'Sent'
            notification.sent_at = timezone.now()
            notification.delivered_count = recipients_count
            notification.save(
                update_fields=[
                    'status',
                    'sent_at',
                    'recipients_count',
                    'delivered_count',
                    'updated_at',
                ]
            )
            message = 'Notification sent successfully'

        return success(
            data=NotificationBroadcastSerializer(notification).data,
            message=message,
        )


@extend_schema(tags=['Platform Notifications'])
class PlatformNotificationListView(generics.ListCreateAPIView):
    """Super Admin list and broadcast view for notifications across all libraries."""

    permission_classes = [IsSuperAdmin]
    queryset = NotificationBroadcast.objects.select_related(
        'library', 'created_by'
    ).order_by('-created_at')
    serializer_class = NotificationBroadcastSerializer
    filterset_fields = ['library', 'status', 'priority', 'audience']
    search_fields = ['title', 'subtitle', 'body', 'library__name', 'library__code']
    ordering_fields = ['created_at', 'sent_at', 'recipients_count']

    def perform_create(self, serializer):
        user = self.request.user
        library = None
        library_id = self.request.data.get('library') or self.request.data.get('library_id')
        if library_id:
            try:
                library = Library.objects.get(id=library_id)
            except Library.DoesNotExist:
                pass
        serializer.save(library=library, created_by=user, status='Sent', sent_at=timezone.now())
