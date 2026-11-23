"""API views for platform audit logs and library activity logs."""
from drf_spectacular.utils import extend_schema
from rest_framework import generics
from rest_framework.exceptions import ValidationError

from apps.accounts.permissions import IsLibraryOwner, IsSuperAdmin

from .models import AuditLog
from .serializers import AuditLogSerializer


@extend_schema(tags=['Platform Audit'])
class PlatformAuditLogListView(generics.ListAPIView):
    """Super Admin list view for all audit logs across the platform."""

    permission_classes = [IsSuperAdmin]
    serializer_class = AuditLogSerializer
    queryset = AuditLog.objects.select_related('library', 'actor').order_by('-created_at')
    filterset_fields = ['module', 'is_risky', 'library', 'actor', 'target_entity']
    search_fields = [
        'action',
        'target_entity',
        'entity_id',
        'actor__email',
        'actor__first_name',
        'actor__last_name',
        'library__name',
        'library__code',
    ]
    ordering_fields = ['created_at', 'module', 'is_risky']


@extend_schema(tags=['Library Activity'])
class LibraryActivityLogListView(generics.ListAPIView):
    """Library Owner list view for their own library's activity logs."""

    permission_classes = [IsLibraryOwner]
    serializer_class = AuditLogSerializer
    filterset_fields = ['module', 'is_risky', 'target_entity', 'actor']
    search_fields = [
        'action',
        'target_entity',
        'entity_id',
        'actor__email',
        'actor__first_name',
        'actor__last_name',
    ]
    ordering_fields = ['created_at', 'module', 'is_risky']

    def get_queryset(self):
        user = self.request.user
        library_id = getattr(user, 'library_id', None)
        if not library_id and hasattr(user, 'owned_library'):
            library_id = user.owned_library.id
        if not library_id:
            raise ValidationError({'library': 'User is not associated with a library.'})
        return (
            AuditLog.objects.select_related('library', 'actor')
            .filter(library_id=library_id)
            .order_by('-created_at')
        )
