"""Views for Section 16.2 Student Feedback and Complaints (Library Admin Panel)."""
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import PlatformAPIException
from apps.core.pagination import StandardPlatformPagination
from apps.libraries.models import Library
from apps.platform_admin.models import SupportMessage, SupportTicket
from apps.students.models import StudentFeedbackMessage, StudentFeedbackTicket


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


def _serialize_ticket(ticket, include_messages=False):
    res = {
        'id': str(ticket.id),
        'ticket_number': ticket.ticket_number,
        'student_id': str(ticket.student_id),
        'student_name': ticket.student.name if ticket.student else 'Unknown',
        'subject': ticket.subject,
        'type': ticket.type,
        'status': ticket.status,
        'assigned_to': str(ticket.assigned_to_id) if ticket.assigned_to_id else None,
        'created_at': ticket.created_at.isoformat(),
        'updated_at': ticket.updated_at.isoformat(),
    }
    if include_messages:
        messages = ticket.messages.all().order_by('created_at')
        res['messages'] = [
            {
                'id': str(m.id),
                'sender_name': m.sender.get_full_name() or m.sender.email if m.sender else 'System',
                'is_staff_reply': m.is_staff_reply,
                'message': m.message,
                'attachment_file_id': m.attachment_file_id,
                'created_at': m.created_at.isoformat(),
            }
            for m in messages
        ]
    return res


class LibraryFeedbackTicketsListView(APIView):
    """GET /v1/library/feedback-tickets"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        library = _get_request_library(request)
        qs = StudentFeedbackTicket.objects.filter(library=library)

        status_param = request.GET.get('status')
        if status_param:
            qs = qs.filter(status__iexact=status_param)

        type_param = request.GET.get('type')
        if type_param:
            qs = qs.filter(type__iexact=type_param)

        assigned_to = request.GET.get('assigned_to')
        if assigned_to:
            qs = qs.filter(assigned_to_id=assigned_to)

        q = request.GET.get('q')
        if q:
            qs = qs.filter(subject__icontains=q)

        paginator = StandardPlatformPagination()
        page = paginator.paginate_queryset(qs.order_by('-created_at'), request, view=self)
        items = [_serialize_ticket(t) for t in page]
        return paginator.get_paginated_response(items)


class LibraryFeedbackTicketDetailView(APIView):
    """GET & PATCH /v1/library/feedback-tickets/{id}"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        library = _get_request_library(request)
        ticket = StudentFeedbackTicket.objects.filter(pk=id, library=library).first()
        if not ticket:
            raise PlatformAPIException('Feedback ticket not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        return Response(_serialize_ticket(ticket, include_messages=True))

    def patch(self, request, id):
        library = _get_request_library(request)
        ticket = StudentFeedbackTicket.objects.filter(pk=id, library=library).first()
        if not ticket:
            raise PlatformAPIException('Feedback ticket not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if 'status' in request.data:
            ticket.status = request.data['status'].lower()
        if 'assigned_to' in request.data:
            ticket.assigned_to_id = request.data['assigned_to']

        ticket.save()
        return Response(_serialize_ticket(ticket))


class LibraryFeedbackTicketMessagesView(APIView):
    """POST /v1/library/feedback-tickets/{id}/messages"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        library = _get_request_library(request)
        ticket = StudentFeedbackTicket.objects.filter(pk=id, library=library).first()
        if not ticket:
            raise PlatformAPIException('Feedback ticket not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        msg_text = request.data.get('message')
        if not msg_text:
            raise PlatformAPIException('message is required.', code='validation_error')

        msg = StudentFeedbackMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            message=msg_text,
            is_staff_reply=True,
            attachment_file_id=request.data.get('attachment_file_id', ''),
        )
        return Response({
            'id': str(msg.id),
            'sender_name': request.user.get_full_name() or request.user.email,
            'is_staff_reply': msg.is_staff_reply,
            'message': msg.message,
            'attachment_file_id': msg.attachment_file_id,
            'created_at': msg.created_at.isoformat(),
        }, status=status.HTTP_201_CREATED)


class LibrarySupportTicketsView(APIView):
    """GET & POST /v1/library/support/tickets (Section 16.6)"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        library = _get_request_library(request)
        tickets = SupportTicket.objects.filter(library=library).order_by('-created_at')
        return Response([
            {
                'id': str(t.id),
                'ticket_number': t.ticket_number,
                'subject': t.subject,
                'status': t.status,
                'priority': t.priority,
                'updated_at': t.updated_at.isoformat(),
                'created_at': t.created_at.isoformat(),
            }
            for t in tickets
        ])

    def post(self, request):
        library = _get_request_library(request)
        subject = request.data.get('subject')
        message = request.data.get('message')
        if not subject or not message:
            raise PlatformAPIException('subject and message are required.', code='validation_error')

        ticket = SupportTicket.objects.create(
            library=library,
            created_by=request.user,
            subject=subject,
            description=message,
            priority=request.data.get('priority', 'medium'),
        )
        return Response({
            'id': str(ticket.id),
            'ticket_number': ticket.ticket_number,
            'subject': ticket.subject,
            'status': ticket.status,
            'priority': ticket.priority,
            'created_at': ticket.created_at.isoformat(),
        }, status=status.HTTP_201_CREATED)


class LibrarySupportTicketDetailView(APIView):
    """GET /v1/library/support/tickets/{id}"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        library = _get_request_library(request)
        ticket = SupportTicket.objects.filter(pk=id, library=library).first()
        if not ticket:
            raise PlatformAPIException('Support ticket not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        messages = ticket.messages.select_related('sender').order_by('created_at')
        return Response({
            'id': str(ticket.id),
            'ticket_number': ticket.ticket_number,
            'subject': ticket.subject,
            'description': ticket.description,
            'status': ticket.status,
            'priority': ticket.priority,
            'messages': [
                {
                    'id': str(m.id),
                    'sender': m.sender.email if m.sender else 'Support',
                    'message': m.message,
                    'created_at': m.created_at.isoformat(),
                }
                for m in messages
            ],
            'created_at': ticket.created_at.isoformat(),
        })


class LibrarySupportTicketMessagesView(APIView):
    """POST /v1/library/support/tickets/{id}/messages"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        library = _get_request_library(request)
        ticket = SupportTicket.objects.filter(pk=id, library=library).first()
        if not ticket:
            raise PlatformAPIException('Support ticket not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        msg_text = request.data.get('message')
        if not msg_text:
            raise PlatformAPIException('message is required.', code='validation_error')

        msg = SupportMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            message=msg_text,
        )
        return Response({
            'id': str(msg.id),
            'sender': request.user.email,
            'message': msg.message,
            'created_at': msg.created_at.isoformat(),
        }, status=status.HTTP_201_CREATED)
