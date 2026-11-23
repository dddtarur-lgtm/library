"""Views and ViewSets for Platform library management and Library Owner operations."""
import uuid
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import DeletionRequest
from apps.accounts.permissions import IsLibraryOwner, IsSubAdminOrAbove, IsSuperAdmin
from apps.accounts.serializers import DeletionRequestSerializer
from apps.billing.services import check_plan_quota
from .models import (
    AttendanceQrKioskConfig,
    Branch,
    Library,
    LibraryRequest,
    LibrarySettings,
)
from .serializers import (
    AttendanceQrKioskConfigSerializer,
    BranchSerializer,
    LibraryDetailSerializer,
    LibraryProfileSerializer,
    LibraryRequestApproveSerializer,
    LibraryRequestInfoSerializer,
    LibraryRequestRejectSerializer,
    LibraryRequestSerializer,
    LibrarySerializer,
    LibrarySettingsSerializer,
    LibraryStatusActionSerializer,
)

User = get_user_model()


def _get_user_library(user):
    """Resolve the Library associated with a Library Owner or Sub-Admin."""
    if getattr(user, 'library_id', None):
        return user.library
    return getattr(user, 'owned_library', None)


@extend_schema(tags=['Platform Libraries'])
class PlatformLibraryViewSet(viewsets.ModelViewSet):
    """Super Admin CRUD and status lifecycle management for tenant libraries."""

    permission_classes = [IsSuperAdmin]
    queryset = (
        Library.objects.select_related('owner', 'settings')
        .prefetch_related('branches', 'subscriptions__plan', 'students')
        .order_by('-created_at')
    )
    filterset_fields = ['plan_status', 'library_status', 'city', 'state']
    search_fields = [
        'code',
        'name',
        'city',
        'state',
        'owner__email',
        'owner__first_name',
        'owner__last_name',
    ]
    ordering_fields = ['created_at', 'name', 'joined_date']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LibraryDetailSerializer
        return LibrarySerializer

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_field or 'pk')
        queryset = self.filter_queryset(self.get_queryset())

        import uuid
        # 1. Match by UUID primary key
        try:
            val = uuid.UUID(str(lookup))
            obj = queryset.filter(id=val).first()
            if obj:
                self.check_object_permissions(self.request, obj)
                return obj
        except (ValueError, TypeError, AttributeError):
            pass

        # 2. Match by exact or case-insensitive library code (e.g. LIB-0101, lib-0101)
        obj = queryset.filter(code__iexact=str(lookup)).first()
        if obj:
            self.check_object_permissions(self.request, obj)
            return obj

        # 3. Match demo/UI indices or mock IDs like 'lib-1', 'lib-2'
        lookup_str = str(lookup).lower()
        if lookup_str.startswith('lib-'):
            suffix = lookup_str[4:]
            if suffix.isdigit():
                idx = int(suffix) - 1
                all_libs = list(queryset)
                if 0 <= idx < len(all_libs):
                    obj = all_libs[idx]
                    self.check_object_permissions(self.request, obj)
                    return obj

        from rest_framework.exceptions import NotFound
        raise NotFound(f"Library '{lookup}' not found.")

    def perform_destroy(self, instance):
        """Soft-close library instead of hard-deleting tenant data."""
        instance.library_status = 'Closed'
        instance.save(update_fields=['library_status', 'updated_at'])

    @extend_schema(request=LibraryStatusActionSerializer)
    @action(detail=True, methods=['post'], url_path='lock')
    def lock(self, request, pk=None):
        """Lock a library's access."""
        library = self.get_object()
        serializer = LibraryStatusActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        library.library_status = 'Locked'
        library.plan_status = 'Locked'
        library.status_reason = serializer.validated_data.get('reason', '')
        library.save(
            update_fields=['library_status', 'plan_status', 'status_reason', 'updated_at']
        )
        return Response(
            {
                'message': 'Library locked successfully',
                'library': LibraryDetailSerializer(
                    library, context={'request': request}
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(request=LibraryStatusActionSerializer)
    @action(detail=True, methods=['post'], url_path='unlock')
    def unlock(self, request, pk=None):
        """Unlock a previously locked or suspended library."""
        library = self.get_object()
        serializer = LibraryStatusActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        library.library_status = 'Active'
        if library.plan_status == 'Locked':
            library.plan_status = 'Active'
        library.status_reason = serializer.validated_data.get('reason', '')
        library.save(
            update_fields=['library_status', 'plan_status', 'status_reason', 'updated_at']
        )
        return Response(
            {
                'message': 'Library unlocked successfully',
                'library': LibraryDetailSerializer(
                    library, context={'request': request}
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(request=LibraryStatusActionSerializer)
    @action(detail=True, methods=['post'], url_path='suspend')
    def suspend(self, request, pk=None):
        """Suspend a library with an optional reason."""
        library = self.get_object()
        serializer = LibraryStatusActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        library.library_status = 'Suspended'
        library.status_reason = serializer.validated_data.get('reason', '')
        library.save(update_fields=['library_status', 'status_reason', 'updated_at'])
        return Response(
            {
                'message': 'Library suspended successfully',
                'library': LibraryDetailSerializer(
                    library, context={'request': request}
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(request=LibraryStatusActionSerializer)
    @action(detail=True, methods=['post'], url_path='extend-grace')
    def extend_grace(self, request, pk=None):
        """Extend grace period for a library by specified days."""
        from datetime import timedelta
        library = self.get_object()
        serializer = LibraryStatusActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        days = int(request.data.get('extend_days', 5))
        reason = serializer.validated_data.get('reason', '')
        
        # Extend active or latest subscription grace
        sub = library.subscriptions.order_by('-end_date').first()
        today = timezone.localdate()
        if sub:
            base_date = sub.grace_ends if (sub.grace_ends and sub.grace_ends >= today) else today
            sub.grace_ends = base_date + timedelta(days=days)
            sub.status = 'Grace'
            sub.save(update_fields=['grace_ends', 'status', 'updated_at'])
            
        library.plan_status = 'Grace'
        if library.library_status == 'Locked':
            library.library_status = 'Active'
        if reason:
            library.status_reason = f'Grace extended by {days} days: {reason}'
        library.save(update_fields=['plan_status', 'library_status', 'status_reason', 'updated_at'])
        
        return Response(
            {
                'message': f'Grace period extended by {days} days',
                'library': LibraryDetailSerializer(
                    library, context={'request': request}
                ).data,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Platform Library Requests'])
class PlatformLibraryRequestViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """Super Admin review workflow for incoming library onboarding requests."""

    permission_classes = [IsSuperAdmin]
    serializer_class = LibraryRequestSerializer
    queryset = (
        LibraryRequest.objects.select_related('reviewed_by', 'approved_library')
        .prefetch_related('documents')
        .order_by('-created_at')
    )
    filterset_fields = ['status', 'city', 'state']
    search_fields = [
        'request_number',
        'library_name',
        'owner_name',
        'email',
        'mobile',
        'city',
    ]

    @extend_schema(request=LibraryRequestApproveSerializer)
    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """Approve a library request and auto-create Library, Owner User, Main Branch, and Settings."""
        lib_request = self.get_object()
        if lib_request.status == 'Approved' and lib_request.approved_library_id:
            return Response(
                {'message': 'Library request is already approved'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = LibraryRequestApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            email = lib_request.email.strip().lower()
            name_parts = lib_request.owner_name.strip().split(None, 1)
            first_name = name_parts[0] if name_parts else 'Library'
            last_name = name_parts[1] if len(name_parts) > 1 else 'Owner'

            owner, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first_name[:50],
                    'last_name': last_name[:50],
                    'role': 'LIBRARY_OWNER',
                    'phone': lib_request.mobile,
                    'email_verified': True,
                },
            )
            if not created and hasattr(owner, 'owned_library'):
                return Response(
                    {'message': 'A library already exists for this owner email'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            code = data.get('library_code', '').strip()
            if code and Library.objects.filter(code=code).exists():
                return Response(
                    {'message': 'A library with this code already exists.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not code:
                city_prefix = (lib_request.city or 'LIB')[:3].upper()
                code = f'LIB-{city_prefix}-{uuid.uuid4().hex[:4].upper()}'

            address = lib_request.address.strip() or (
                f'{lib_request.city}, {lib_request.state}'
            )
            library = Library.objects.create(
                code=code,
                name=lib_request.library_name,
                owner=owner,
                city=lib_request.city,
                state=lib_request.state,
                address=address,
                phone=lib_request.mobile,
                plan_status=data.get('plan_status', 'Trial'),
                library_status='Active',
            )

            owner.library = library
            if owner.role != 'LIBRARY_OWNER':
                owner.role = 'LIBRARY_OWNER'
            owner.save(update_fields=['library', 'role'])

            LibrarySettings.objects.get_or_create(library=library)
            main_branch = Branch.objects.create(
                library=library,
                name='Main Branch',
                address=address,
                phone=lib_request.mobile,
                is_main=True,
            )
            AttendanceQrKioskConfig.objects.get_or_create(branch=main_branch)

            lib_request.status = 'Approved'
            lib_request.reviewed_by = request.user
            lib_request.reviewed_at = timezone.now()
            lib_request.approved_library = library
            if data.get('notes'):
                lib_request.notes = data['notes']
            lib_request.save(
                update_fields=[
                    'status',
                    'reviewed_by',
                    'reviewed_at',
                    'approved_library',
                    'notes',
                    'updated_at',
                ]
            )

        return Response(
            {
                'message': 'Library request approved successfully',
                'request': LibraryRequestSerializer(
                    lib_request, context={'request': request}
                ).data,
                'library': LibraryDetailSerializer(
                    library, context={'request': request}
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(request=LibraryRequestRejectSerializer)
    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        """Reject a library request with a mandatory reason."""
        lib_request = self.get_object()
        if lib_request.status == 'Approved':
            return Response(
                {'message': 'Cannot reject an already approved request'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = LibraryRequestRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lib_request.status = 'Rejected'
        lib_request.notes = serializer.validated_data['reason']
        lib_request.reviewed_by = request.user
        lib_request.reviewed_at = timezone.now()
        lib_request.save(
            update_fields=['status', 'notes', 'reviewed_by', 'reviewed_at', 'updated_at']
        )
        return Response(
            {
                'message': 'Library request rejected',
                'request': LibraryRequestSerializer(
                    lib_request, context={'request': request}
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(request=LibraryRequestInfoSerializer)
    @action(detail=True, methods=['post'], url_path='request-info')
    def request_info(self, request, pk=None):
        """Mark a library request as needing additional information."""
        lib_request = self.get_object()
        if lib_request.status == 'Approved':
            return Response(
                {'message': 'Cannot request info on an already approved request'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = LibraryRequestInfoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lib_request.status = 'Info Requested'
        lib_request.notes = serializer.validated_data['message']
        lib_request.reviewed_by = request.user
        lib_request.reviewed_at = timezone.now()
        lib_request.save(
            update_fields=['status', 'notes', 'reviewed_by', 'reviewed_at', 'updated_at']
        )
        return Response(
            {
                'message': 'Additional information requested',
                'request': LibraryRequestSerializer(
                    lib_request, context={'request': request}
                ).data,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Library Profile & Settings'])
class LibraryProfileView(APIView):
    """Get or update the authenticated Library Owner's library profile."""

    permission_classes = [IsLibraryOwner]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    @extend_schema(responses=LibraryProfileSerializer)
    def get(self, request):
        library = _get_user_library(request.user)
        if library is None:
            return Response(
                {'message': 'No library associated with this account'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = LibraryProfileSerializer(library, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=LibraryProfileSerializer, responses=LibraryProfileSerializer
    )
    def patch(self, request):
        library = _get_user_library(request.user)
        if library is None:
            return Response(
                {'message': 'No library associated with this account'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = LibraryProfileSerializer(
            library,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=LibraryProfileSerializer, responses=LibraryProfileSerializer
    )
    def put(self, request):
        library = _get_user_library(request.user)
        if library is None:
            return Response(
                {'message': 'No library associated with this account'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = LibraryProfileSerializer(
            library,
            data=request.data,
            partial=False,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=['Library Profile & Settings'])
class LibrarySettingsView(APIView):
    """Get or update operational settings for the authenticated Library Owner's library."""

    permission_classes = [IsLibraryOwner]

    @extend_schema(responses=LibrarySettingsSerializer)
    def get(self, request):
        library = _get_user_library(request.user)
        if library is None:
            return Response(
                {'message': 'No library associated with this account'},
                status=status.HTTP_404_NOT_FOUND,
            )
        settings_obj, _ = LibrarySettings.objects.get_or_create(library=library)
        return Response(
            LibrarySettingsSerializer(settings_obj).data, status=status.HTTP_200_OK
        )

    @extend_schema(
        request=LibrarySettingsSerializer, responses=LibrarySettingsSerializer
    )
    def patch(self, request):
        library = _get_user_library(request.user)
        if library is None:
            return Response(
                {'message': 'No library associated with this account'},
                status=status.HTTP_404_NOT_FOUND,
            )
        settings_obj, _ = LibrarySettings.objects.get_or_create(library=library)
        serializer = LibrarySettingsSerializer(
            settings_obj, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=['Library Branches'])
class BranchViewSet(viewsets.ModelViewSet):
    """Manage physical branches and QR kiosk configs for a library."""

    serializer_class = BranchSerializer
    filterset_fields = ['is_main', 'is_active']
    search_fields = ['name', 'address', 'phone']

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'qr_kiosk', 'qr_kiosk_regenerate'):
            return [IsSubAdminOrAbove()]
        return [IsLibraryOwner()]

    def get_queryset(self):
        user = self.request.user
        base_qs = Branch.objects.select_related('library').order_by('-is_main', 'name')
        if user.role == 'SUPER_ADMIN':
            return base_qs
        library = _get_user_library(user)
        if library is None:
            return base_qs.none()
        qs = base_qs.filter(library=library)
        if user.role == 'SUB_ADMIN' and user.assigned_branches.exists():
            qs = qs.filter(id__in=user.assigned_branches.values_list('id', flat=True))
        return qs

    def perform_create(self, serializer):
        library = _get_user_library(self.request.user)
        if library is None:
            raise ValidationError('No library associated with this account.')
        check_plan_quota(library, 'branches')
        branch = serializer.save(library=library)
        AttendanceQrKioskConfig.objects.get_or_create(branch=branch)

    def perform_destroy(self, instance):
        """Soft-deactivate branch instead of deleting historical records."""
        instance.is_active = False
        instance.save(update_fields=['is_active'])

    @extend_schema(responses=AttendanceQrKioskConfigSerializer)
    @action(detail=True, methods=['get'], url_path='qr-kiosk')
    def qr_kiosk(self, request, pk=None):
        """Get QR kiosk configuration for a branch."""
        branch = self.get_object()
        config, _ = AttendanceQrKioskConfig.objects.get_or_create(branch=branch)
        return Response(
            AttendanceQrKioskConfigSerializer(config).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(request=None, responses=AttendanceQrKioskConfigSerializer)
    @action(detail=True, methods=['post'], url_path='qr-kiosk/regenerate')
    def qr_kiosk_regenerate(self, request, pk=None):
        """Regenerate the QR kiosk token for a branch."""
        branch = self.get_object()
        config, _ = AttendanceQrKioskConfig.objects.get_or_create(branch=branch)
        config.regenerate_token()
        return Response(
            AttendanceQrKioskConfigSerializer(config).data,
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Library Dashboard'])
class LibraryDashboardView(APIView):
    """Return KPI summary for the authenticated Library Owner's library."""

    permission_classes = [IsLibraryOwner]

    def get(self, request):
        library = _get_user_library(request.user)
        if library is None:
            return Response(
                {'message': 'No library associated with this account'},
                status=status.HTTP_404_NOT_FOUND,
            )

        branches_qs = library.branches.all()
        staff_count = User.objects.filter(
            library=library, role__in=['SUB_ADMIN', 'STAFF'], is_active=True
        ).count()

        data = {
            'library_id': str(library.id),
            'library_name': library.name,
            'library_code': library.code,
            'plan_status': library.plan_status,
            'library_status': library.library_status,
            'email_connection_status': library.email_connection_status,
            'total_branches': branches_qs.count(),
            'active_branches': branches_qs.filter(is_active=True).count(),
            'active_staff_count': staff_count,
        }
        return Response(data, status=status.HTTP_200_OK)


@extend_schema(tags=['Library Profile & Settings'], request=LibraryRequestSerializer)
class LibraryOnboardingRequestView(APIView):
    """Public/Library Owner endpoint to submit a new library onboarding request."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LibraryRequestSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        req_obj = serializer.save()
        return Response(
            LibraryRequestSerializer(req_obj, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Library Profile & Settings'])
class LibraryDeletionRequestView(APIView):
    """Library Owner endpoint to request deletion/closure of their library."""

    permission_classes = [IsLibraryOwner]

    def get(self, request):
        library = _get_user_library(request.user)
        if library is None:
            return Response(
                {'message': 'No library associated with this account'},
                status=status.HTTP_404_NOT_FOUND,
            )
        qs = DeletionRequest.objects.filter(
            library=library, target_type='LIBRARY'
        )
        return Response(DeletionRequestSerializer(qs, many=True).data)

    @extend_schema(request=DeletionRequestSerializer, responses=DeletionRequestSerializer)
    def post(self, request):
        library = _get_user_library(request.user)
        if library is None:
            return Response(
                {'message': 'No library associated with this account'},
                status=status.HTTP_404_NOT_FOUND,
            )
        if DeletionRequest.objects.filter(
            library=library, target_type='LIBRARY', status='Pending'
        ).exists():
            return Response(
                {'message': 'A deletion request is already pending for this library.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = DeletionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(
            requested_by=request.user,
            target_type='LIBRARY',
            library=library,
        )
        return Response(
            DeletionRequestSerializer(obj).data,
            status=status.HTTP_201_CREATED,
        )
