"""Views for Section 15.1 Notifications (Library Admin Panel)."""
import uuid
from django.db.models import Avg, Count, Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import PlatformAPIException
from apps.core.pagination import StandardPlatformPagination
from apps.libraries.models import Library
from apps.notifications.models import NotificationBroadcast, StudentNotification
from apps.students.models import Student


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


def _filter_audience(library, audience):
    """Resolve student queryset based on audience filter criteria."""
    qs = Student.objects.filter(library=library, is_deleted=False)
    if not audience or not isinstance(audience, dict):
        return qs

    statuses = audience.get('statuses')
    if statuses:
        # Match case-insensitively
        status_q = Q()
        for s in statuses:
            status_q |= Q(status__iexact=s)
        qs = qs.filter(status_q)

    genders = audience.get('genders')
    if genders:
        gender_q = Q()
        for g in genders:
            gender_q |= Q(gender__iexact=g)
        qs = qs.filter(gender_q)

    branch_ids = audience.get('branch_ids')
    if branch_ids:
        qs = qs.filter(branch_id__in=branch_ids)

    plan_ids = audience.get('plan_ids')
    if plan_ids:
        qs = qs.filter(memberships__plan_id__in=plan_ids)

    shift_ids = audience.get('shift_ids')
    if shift_ids:
        qs = qs.filter(seat_allocations__shift_id__in=shift_ids)

    seat_category_ids = audience.get('seat_category_ids')
    if seat_category_ids:
        qs = qs.filter(seat_allocations__seat__category_id__in=seat_category_ids)

    if audience.get('due_only'):
        qs = qs.filter(
            Q(dues__status='pending') | Q(dues__status='overdue')
        )

    enrollment_ids = audience.get('enrollment_ids')
    if enrollment_ids:
        qs = qs.filter(id__in=enrollment_ids)

    return qs.distinct()


def _dispatch_broadcast_to_students(broadcast, students_qs):
    """Materialize StudentNotification records for recipients."""
    student_records = []
    now = timezone.now()
    for s in students_qs:
        student_records.append(
            StudentNotification(
                student=s,
                library=broadcast.library,
                broadcast=broadcast,
                title=broadcast.title,
                subtitle=broadcast.subtitle,
                body=broadcast.body,
                details=broadcast.details,
                translations=broadcast.translations,
                show_on_screen=broadcast.show_on_screen,
                dialog_layout=broadcast.dialog_layout,
                priority=broadcast.priority,
                is_dismissible=broadcast.is_dismissible,
                image_url=broadcast.image_url,
                cta=broadcast.cta,
                max_shows=broadcast.max_shows,
            )
        )
    if student_records:
        StudentNotification.objects.bulk_create(student_records)


def _serialize_notification(item):
    return {
        'id': str(item.id),
        'title': item.title,
        'subtitle': item.subtitle,
        'body': item.body,
        'details': item.details,
        'translations': item.translations,
        'show_on_screen': item.show_on_screen,
        'dialog_layout': item.dialog_layout,
        'priority': item.priority.lower() if item.priority else 'normal',
        'is_dismissible': item.is_dismissible,
        'image_url': item.image_url or (item.image_banner.url if item.image_banner else None),
        'background_image_file_id': item.background_image_file_id,
        'cta': item.cta,
        'audience': item.filters,
        'frequency': item.frequency,
        'schedule': item.schedule,
        'scheduled_at': item.scheduled_at.isoformat() if item.scheduled_at else None,
        'starts_at': item.starts_at.isoformat() if item.starts_at else None,
        'ends_at': item.ends_at.isoformat() if item.ends_at else None,
        'max_shows': item.max_shows,
        'respect_quiet_hours': item.respect_quiet_hours,
        'channels': item.channels,
        'status': item.status.lower(),
        'created_at': item.created_at.isoformat(),
        'sent_at': item.sent_at.isoformat() if item.sent_at else None,
        'stats': {
            'recipients_count': item.recipients_count,
            'delivered_count': item.delivered_count,
            'seen_count': item.seen_count,
            'clicked_count': item.click_count,
            'dismissed_count': item.dismissed_count,
            'failure_count': item.failure_count,
        },
    }


class LibraryNotificationsListView(APIView):
    """GET & POST /v1/library/notifications"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        library = _get_request_library(request)
        qs = NotificationBroadcast.objects.filter(library=library)

        tab = request.GET.get('tab')
        if tab == 'sent':
            qs = qs.filter(status='Sent')
        elif tab == 'scheduled':
            qs = qs.filter(status='Scheduled')
        elif tab == 'recurring':
            qs = qs.filter(frequency__in=['daily', 'weekly', 'monthly'])
        elif tab == 'drafts':
            qs = qs.filter(status='Draft')

        status_param = request.GET.get('status')
        if status_param:
            qs = qs.filter(status__iexact=status_param)

        q = request.GET.get('q')
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(body__icontains=q) | Q(subtitle__icontains=q))

        paginator = StandardPlatformPagination()
        page = paginator.paginate_queryset(qs.order_by('-created_at'), request, view=self)
        items = [_serialize_notification(n) for n in page]
        return paginator.get_paginated_response(items)

    def post(self, request):
        library = _get_request_library(request)
        data = request.data

        title = data.get('title')
        body = data.get('body')
        if not title or not body:
            raise PlatformAPIException('title and body are required.', code='validation_error')

        dialog_layout = data.get('dialog_layout', 'text_only')
        image_url = data.get('image_url', '')
        image_file_id = data.get('image_file_id', '')
        if dialog_layout in ['half_image', 'full_image'] and not (image_url or image_file_id):
            raise PlatformAPIException('Image is required for half_image or full_image layouts.', code='image_required', status_code=status.HTTP_400_BAD_REQUEST)

        action_type = data.get('action', 'save_draft')
        audience_dict = data.get('audience', {})
        recipients_qs = _filter_audience(library, audience_dict)
        recipients_count = recipients_qs.count()

        if action_type == 'send_now' and recipients_count == 0:
            raise PlatformAPIException('No recipients matched the target audience.', code='no_recipients', status_code=status.HTTP_400_BAD_REQUEST)

        priority_str = data.get('priority', 'Normal')
        if priority_str:
            priority_str = priority_str.capitalize()

        broadcast = NotificationBroadcast.objects.create(
            library=library,
            created_by=request.user,
            title=title,
            subtitle=data.get('subtitle', ''),
            body=body,
            details=data.get('details', ''),
            translations=data.get('translations', {}),
            show_on_screen=bool(data.get('show_on_screen', False)),
            dialog_layout=dialog_layout,
            priority=priority_str if priority_str in ['Low', 'Normal', 'High', 'Urgent'] else 'Normal',
            is_dismissible=bool(data.get('is_dismissible', True)),
            image_url=image_url or image_file_id,
            background_image_file_id=data.get('background_image_file_id', ''),
            cta=data.get('cta', {}),
            frequency=data.get('frequency', 'one_time'),
            schedule=data.get('schedule', {}),
            filters=audience_dict,
            scheduled_at=data.get('scheduled_at'),
            starts_at=data.get('starts_at'),
            ends_at=data.get('ends_at'),
            max_shows=data.get('max_shows', 3),
            respect_quiet_hours=bool(data.get('respect_quiet_hours', True)),
            channels=data.get('channels', {'in_app': True}),
            status='Sent' if action_type == 'send_now' else ('Scheduled' if action_type == 'schedule' else 'Draft'),
            sent_at=timezone.now() if action_type == 'send_now' else None,
            recipients_count=recipients_count if action_type == 'send_now' else 0,
            delivered_count=recipients_count if action_type == 'send_now' else 0,
        )

        if action_type == 'send_now':
            _dispatch_broadcast_to_students(broadcast, recipients_qs)

        return Response(_serialize_notification(broadcast), status=status.HTTP_201_CREATED)


class LibraryNotificationsKpisView(APIView):
    """GET /v1/library/notifications/kpis"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        library = _get_request_library(request)
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        month_qs = NotificationBroadcast.objects.filter(library=library, sent_at__gte=start_of_month, status='Sent')
        sent_this_month = month_qs.count()

        total_recipients = sum(n.recipients_count for n in month_qs)
        total_seen = sum(n.seen_count for n in month_qs)
        avg_seen_rate = round((total_seen / total_recipients) * 100, 1) if total_recipients > 0 else 0.0

        scheduled = NotificationBroadcast.objects.filter(library=library, status='Scheduled').count()
        failed_emails = NotificationBroadcast.objects.filter(library=library).aggregate(failed=Count('id', filter=Q(failure_count__gt=0)))['failed'] or 0

        return Response({
            'sent_this_month': sent_this_month,
            'avg_seen_rate': avg_seen_rate,
            'scheduled': scheduled,
            'failed_emails': failed_emails,
        })


class LibraryNotificationDetailView(APIView):
    """GET & PATCH /v1/library/notifications/{id}"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        library = _get_request_library(request)
        item = NotificationBroadcast.objects.filter(pk=id, library=library).first()
        if not item:
            raise PlatformAPIException('Notification not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        return Response(_serialize_notification(item))

    def patch(self, request, id):
        library = _get_request_library(request)
        item = NotificationBroadcast.objects.filter(pk=id, library=library).first()
        if not item:
            raise PlatformAPIException('Notification not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if item.status not in ['Draft', 'Scheduled', 'Paused']:
            raise PlatformAPIException('Cannot edit a notification that has already been sent.', code='invalid_state', status_code=status.HTTP_400_BAD_REQUEST)

        data = request.data
        if 'title' in data:
            item.title = data['title']
        if 'body' in data:
            item.body = data['body']
        if 'subtitle' in data:
            item.subtitle = data['subtitle']
        if 'details' in data:
            item.details = data['details']
        if 'translations' in data:
            item.translations = data['translations']
        if 'dialog_layout' in data:
            item.dialog_layout = data['dialog_layout']
        if 'priority' in data:
            item.priority = data['priority'].capitalize()
        if 'is_dismissible' in data:
            item.is_dismissible = bool(data['is_dismissible'])
        if 'show_on_screen' in data:
            item.show_on_screen = bool(data['show_on_screen'])
        if 'image_url' in data:
            item.image_url = data['image_url']
        if 'cta' in data:
            item.cta = data['cta']
        if 'audience' in data:
            item.filters = data['audience']
        if 'schedule' in data:
            item.schedule = data['schedule']
        if 'scheduled_at' in data:
            item.scheduled_at = data['scheduled_at']
        if 'max_shows' in data:
            item.max_shows = data['max_shows']

        item.save()
        return Response(_serialize_notification(item))


class LibraryNotificationAudiencePreviewView(APIView):
    """POST /v1/library/notifications/audience-preview"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        library = _get_request_library(request)
        audience_dict = request.data.get('audience', {})
        qs = _filter_audience(library, audience_dict)

        count = qs.count()
        sample_names = list(qs.values_list('name', flat=True)[:5])

        by_status = {}
        for s in ['Live', 'Expired', 'Expiring Soon', 'Registered', 'Paused']:
            s_count = qs.filter(status=s).count()
            if s_count > 0:
                by_status[s.lower().replace(' ', '_')] = s_count

        sms_reach = qs.exclude(phone='').count()
        email_reach = qs.exclude(email='').count()
        push_reach = qs.filter(user__student_devices__isnull=False).distinct().count() or count

        return Response({
            'count': count,
            'sample': sample_names,
            'by_status': by_status,
            'channel_reach': {
                'push': push_reach,
                'email': email_reach,
                'sms': sms_reach,
            },
        })


class LibraryNotificationSendView(APIView):
    """POST /v1/library/notifications/{id}/send"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        library = _get_request_library(request)
        item = NotificationBroadcast.objects.filter(pk=id, library=library).first()
        if not item:
            raise PlatformAPIException('Notification not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if item.status == 'Sent':
            raise PlatformAPIException('Notification already sent.', code='already_sent', status_code=status.HTTP_400_BAD_REQUEST)

        recipients_qs = _filter_audience(library, item.filters)
        recipients_count = recipients_qs.count()
        if recipients_count == 0:
            raise PlatformAPIException('No recipients matched the target audience.', code='no_recipients', status_code=status.HTTP_400_BAD_REQUEST)

        item.status = 'Sent'
        item.sent_at = timezone.now()
        item.recipients_count = recipients_count
        item.delivered_count = recipients_count
        item.save()

        _dispatch_broadcast_to_students(item, recipients_qs)

        return Response(_serialize_notification(item), status=status.HTTP_202_ACCEPTED)


class LibraryNotificationPauseView(APIView):
    """POST /v1/library/notifications/{id}/pause"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        library = _get_request_library(request)
        item = NotificationBroadcast.objects.filter(pk=id, library=library).first()
        if not item:
            raise PlatformAPIException('Notification not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        item.status = 'Paused'
        item.save(update_fields=['status', 'updated_at'])
        return Response(_serialize_notification(item))


class LibraryNotificationResumeView(APIView):
    """POST /v1/library/notifications/{id}/resume"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        library = _get_request_library(request)
        item = NotificationBroadcast.objects.filter(pk=id, library=library).first()
        if not item:
            raise PlatformAPIException('Notification not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        item.status = 'Scheduled' if item.scheduled_at else 'Draft'
        item.save(update_fields=['status', 'updated_at'])
        return Response(_serialize_notification(item))


class LibraryNotificationCancelView(APIView):
    """POST /v1/library/notifications/{id}/cancel"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        library = _get_request_library(request)
        item = NotificationBroadcast.objects.filter(pk=id, library=library).first()
        if not item:
            raise PlatformAPIException('Notification not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        item.status = 'Cancelled'
        item.cancel_reason = request.data.get('reason', '')
        item.save(update_fields=['status', 'cancel_reason', 'updated_at'])
        return Response(_serialize_notification(item))
