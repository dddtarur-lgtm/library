"""Support ticket views for Platform Super Admin and Library Owners."""
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.accounts.permissions import IsLibraryOwner, IsSuperAdmin
from utils.responses import success

from .models import SupportMessage, SupportTicket
from .serializers import (
    SupportMessageSerializer,
    SupportReplySerializer,
    SupportTicketDetailSerializer,
    SupportTicketSerializer,
)


def _resolve_owner_library(user):
    """Resolve the Library associated with a Library Owner."""
    if getattr(user, 'library_id', None):
        return user.library
    owned = getattr(user, 'owned_library', None)
    if owned:
        return owned
    raise ValidationError({'library': 'User is not associated with a library.'})


@extend_schema(tags=['Platform Support'])
class PlatformSupportTicketViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Super Admin support queue: list, inspect, assign/update status, and reply."""

    permission_classes = [IsSuperAdmin]
    queryset = (
        SupportTicket.objects.select_related('library', 'created_by', 'assigned_to')
        .prefetch_related('messages__sender')
        .order_by('-created_at')
    )
    filterset_fields = ['status', 'priority', 'category', 'library', 'assigned_to']
    search_fields = [
        'ticket_number',
        'subject',
        'description',
        'library__name',
        'library__code',
    ]
    ordering_fields = ['created_at', 'updated_at', 'priority', 'status']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SupportTicketDetailSerializer
        if self.action == 'reply':
            return SupportReplySerializer
        return SupportTicketSerializer

    def perform_update(self, serializer):
        new_status = serializer.validated_data.get('status')
        extra = {}
        if new_status in ('Resolved', 'Closed') and not serializer.instance.resolved_at:
            extra['resolved_at'] = timezone.now()
        serializer.save(**extra)

    @extend_schema(request=SupportReplySerializer)
    @action(
        detail=True,
        methods=['post'],
        url_path='reply',
        parser_classes=[JSONParser, MultiPartParser, FormParser],
    )
    def reply(self, request, pk=None):
        """Post a platform staff reply to a support ticket."""
        ticket = self.get_object()
        serializer = SupportReplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        msg = SupportMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            message=serializer.validated_data['message'],
            is_staff_reply=True,
            attachment=serializer.validated_data.get('attachment'),
        )
        if ticket.status == 'Open':
            ticket.status = 'In Progress'
            ticket.save(update_fields=['status', 'updated_at'])

        return success(
            data=SupportMessageSerializer(msg, context={'request': request}).data,
            message='Reply posted successfully',
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Library Support'])
class LibrarySupportTicketViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Library Owner support tickets: list own tickets, raise new ticket, view thread, reply."""

    permission_classes = [IsLibraryOwner]
    filterset_fields = ['status', 'priority', 'category']
    search_fields = ['ticket_number', 'subject', 'description']
    ordering_fields = ['created_at', 'updated_at', 'priority', 'status']

    def get_queryset(self):
        library = _resolve_owner_library(self.request.user)
        return (
            SupportTicket.objects.select_related('library', 'created_by', 'assigned_to')
            .prefetch_related('messages__sender')
            .filter(library=library)
            .order_by('-created_at')
        )

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SupportTicketDetailSerializer
        if self.action == 'reply':
            return SupportReplySerializer
        return SupportTicketSerializer

    def perform_create(self, serializer):
        library = _resolve_owner_library(self.request.user)
        serializer.save(library=library, created_by=self.request.user)

    @extend_schema(request=SupportReplySerializer)
    @action(
        detail=True,
        methods=['post'],
        url_path='reply',
        parser_classes=[JSONParser, MultiPartParser, FormParser],
    )
    def reply(self, request, pk=None):
        """Post a library owner reply to their support ticket."""
        ticket = self.get_object()
        serializer = SupportReplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        msg = SupportMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            message=serializer.validated_data['message'],
            is_staff_reply=False,
            attachment=serializer.validated_data.get('attachment'),
        )
        if ticket.status == 'Waiting on Customer':
            ticket.status = 'Open'
            ticket.save(update_fields=['status', 'updated_at'])

        return Response(
            {
                'success': True,
                'message': 'Reply posted successfully',
                'data': SupportMessageSerializer(msg, context={'request': request}).data,
            },
            status=status.HTTP_201_CREATED,
        )
