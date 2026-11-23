"""Views for Section 8.4 Student Notifications & Dialogs."""
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import PlatformAPIException
from apps.core.pagination import StandardPlatformPagination
from apps.notifications.models import StudentNotification
from apps.students.models import Student


def _get_request_student(request):
    """Retrieve authenticated Student model."""
    user = request.user
    student = getattr(user, 'student_profile', None) or Student.objects.filter(user=user, is_deleted=False).first()
    if not student:
        raise PlatformAPIException('Student profile not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
    return student


def _serialize_student_notification(item):
    return {
        'id': str(item.id),
        'title': item.title,
        'subtitle': item.subtitle,
        'body': item.body,
        'details': item.details,
        'translations': item.translations,
        'show_on_screen': item.show_on_screen,
        'dialog_layout': item.dialog_layout,
        'priority': item.priority.lower(),
        'is_dismissible': item.is_dismissible,
        'image_url': item.image_url,
        'cta': item.cta,
        'is_read': item.is_read,
        'seen_at': item.seen_at.isoformat() if item.seen_at else None,
        'clicked_at': item.clicked_at.isoformat() if item.clicked_at else None,
        'dismissed_at': item.dismissed_at.isoformat() if item.dismissed_at else None,
        'show_count': item.show_count,
        'max_shows': item.max_shows,
        'created_at': item.created_at.isoformat(),
    }


class StudentNotificationsListView(APIView):
    """GET /v1/student/notifications"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = _get_request_student(request)
        qs = StudentNotification.objects.filter(student=student)

        unread_only = request.GET.get('unread_only')
        if unread_only in ['true', 'True', '1']:
            qs = qs.filter(is_read=False)

        paginator = StandardPlatformPagination()
        page = paginator.paginate_queryset(qs.order_by('-created_at'), request, view=self)
        items = [_serialize_student_notification(n) for n in page]
        return paginator.get_paginated_response(items)


class StudentNotificationsUnreadCountView(APIView):
    """GET /v1/student/notifications/unread-count"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = _get_request_student(request)
        count = StudentNotification.objects.filter(student=student, is_read=False).count()
        return Response({'count': count})


class StudentNotificationSeenView(APIView):
    """POST /v1/student/notifications/{id}/seen"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        student = _get_request_student(request)
        item = StudentNotification.objects.filter(pk=id, student=student).first()
        if not item:
            raise PlatformAPIException('Notification not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if not item.is_read:
            item.is_read = True
            item.seen_at = timezone.now()
            item.save(update_fields=['is_read', 'seen_at', 'updated_at'])

            if item.broadcast:
                from django.db.models import F
                item.broadcast.__class__.objects.filter(pk=item.broadcast_id).update(seen_count=F('seen_count') + 1)

        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentNotificationSeenAllView(APIView):
    """POST /v1/student/notifications/seen-all"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        student = _get_request_student(request)
        StudentNotification.objects.filter(student=student, is_read=False).update(
            is_read=True,
            seen_at=timezone.now(),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentNotificationClickedView(APIView):
    """POST /v1/student/notifications/{id}/clicked"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        student = _get_request_student(request)
        item = StudentNotification.objects.filter(pk=id, student=student).first()
        if not item:
            raise PlatformAPIException('Notification not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        item.clicked_at = timezone.now()
        item.save(update_fields=['clicked_at', 'updated_at'])

        if item.broadcast:
            from django.db.models import F
            item.broadcast.__class__.objects.filter(pk=item.broadcast_id).update(click_count=F('click_count') + 1)

        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentNotificationDismissedView(APIView):
    """POST /v1/student/notifications/{id}/dismissed"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        student = _get_request_student(request)
        item = StudentNotification.objects.filter(pk=id, student=student).first()
        if not item:
            raise PlatformAPIException('Notification not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        item.dismissed_at = timezone.now()
        item.save(update_fields=['dismissed_at', 'updated_at'])

        if item.broadcast:
            from django.db.models import F
            item.broadcast.__class__.objects.filter(pk=item.broadcast_id).update(dismissed_count=F('dismissed_count') + 1)

        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentDialogsPendingView(APIView):
    """GET /v1/student/dialogs/pending"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = _get_request_student(request)
        in_study = request.GET.get('in_study_session') in ['true', 'True', '1']

        qs = StudentNotification.objects.filter(
            student=student,
            show_on_screen=True,
            dismissed_at__isnull=True,
        )

        # Skip normal dialogs during study session - only urgent pass
        if in_study:
            qs = qs.filter(priority__iexact='urgent')

        # Filter out max shows exceeded
        pending_dialogs = [d for d in qs if d.show_count < d.max_shows]

        # Sort by priority
        priority_rank = {'urgent': 0, 'high': 1, 'normal': 2, 'low': 3}
        pending_dialogs.sort(key=lambda x: priority_rank.get(x.priority.lower(), 2))

        return Response([_serialize_student_notification(d) for d in pending_dialogs])


class StudentDialogShownView(APIView):
    """POST /v1/student/dialogs/{id}/shown"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        student = _get_request_student(request)
        item = StudentNotification.objects.filter(pk=id, student=student).first()
        if not item:
            raise PlatformAPIException('Dialog not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        item.show_count += 1
        item.save(update_fields=['show_count', 'updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)
