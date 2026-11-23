"""CMS content, media assets, feature flags, and library public page review views."""
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.views import APIView

from apps.accounts.permissions import IsSuperAdmin
from apps.libraries.models import LibrarySettings
from utils.responses import error, success

from .models import (
    AppFeatureFlag,
    LibraryPublicPage,
    WebsiteContentBlock,
    WebsiteMedia,
)
from .serializers import (
    AppFeatureFlagSerializer,
    LibraryPublicPageRejectSerializer,
    LibraryPublicPageSerializer,
    WebsiteContentBlockSerializer,
    WebsiteMediaSerializer,
)


@extend_schema(tags=['Platform CMS'])
class WebsiteContentListView(generics.ListAPIView):
    """List all marketing website CMS content blocks."""

    permission_classes = [IsSuperAdmin]
    serializer_class = WebsiteContentBlockSerializer
    queryset = WebsiteContentBlock.objects.select_related('updated_by').order_by('section')
    filterset_fields = ['is_published']
    search_fields = ['section', 'title', 'subtitle']


@extend_schema(tags=['Platform CMS'])
class WebsiteContentDetailView(APIView):
    """Retrieve or update a specific CMS content section (upsert on PATCH)."""

    permission_classes = [IsSuperAdmin]

    def get(self, request, section):
        block = WebsiteContentBlock.objects.filter(section=section).first()
        if not block:
            return error('CMS section not found', status=status.HTTP_404_NOT_FOUND)
        return success(data=WebsiteContentBlockSerializer(block).data)

    def patch(self, request, section):
        block, _ = WebsiteContentBlock.objects.get_or_create(section=section)
        serializer = WebsiteContentBlockSerializer(block, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return success(data=serializer.data, message='CMS section updated')


@extend_schema(tags=['Platform CMS'])
class WebsiteMediaListCreateView(generics.ListCreateAPIView):
    """List uploaded CMS media assets or upload a new media file."""

    permission_classes = [IsSuperAdmin]
    serializer_class = WebsiteMediaSerializer
    parser_classes = [MultiPartParser, FormParser]
    queryset = WebsiteMedia.objects.select_related('uploaded_by').order_by('-created_at')
    filterset_fields = ['media_type']
    search_fields = ['title', 'alt_text']

    def perform_create(self, serializer):
        uploaded_file = self.request.FILES.get('file')
        file_size = uploaded_file.size if uploaded_file else 0
        serializer.save(uploaded_by=self.request.user, file_size=file_size)


@extend_schema(tags=['Platform CMS'])
class WebsiteMediaDeleteView(generics.DestroyAPIView):
    """Delete an uploaded CMS media asset."""

    permission_classes = [IsSuperAdmin]
    queryset = WebsiteMedia.objects.all()


@extend_schema(tags=['Platform App Management'])
class AppFeatureFlagListView(generics.ListAPIView):
    """List all platform feature flags."""

    permission_classes = [IsSuperAdmin]
    serializer_class = AppFeatureFlagSerializer
    queryset = AppFeatureFlag.objects.select_related('updated_by').order_by('feature')
    filterset_fields = ['is_enabled']
    search_fields = ['feature', 'name', 'description']


@extend_schema(tags=['Platform App Management'])
class AppFeatureFlagUpdateView(APIView):
    """Enable, disable, or configure a platform feature flag by key."""

    permission_classes = [IsSuperAdmin]

    def patch(self, request, feature):
        flag, _ = AppFeatureFlag.objects.get_or_create(
            feature=feature,
            defaults={'name': feature.replace('_', ' ').title()},
        )
        serializer = AppFeatureFlagSerializer(flag, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return success(data=serializer.data, message='Feature flag updated')


@extend_schema(tags=['Platform Library Pages'])
class LibraryPublicPageListView(generics.ListAPIView):
    """List library public pages in the moderation review queue."""

    permission_classes = [IsSuperAdmin]
    serializer_class = LibraryPublicPageSerializer
    queryset = LibraryPublicPage.objects.select_related('library', 'reviewed_by').order_by(
        '-updated_at'
    )
    filterset_fields = ['status', 'library']
    search_fields = ['slug', 'headline', 'library__name', 'library__code']


@extend_schema(tags=['Platform Library Pages'])
class LibraryPublicPageApproveView(APIView):
    """Approve a library's public micro-site page."""

    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        page = LibraryPublicPage.objects.select_related('library').filter(pk=pk).first()
        if not page:
            return error('Library public page not found', status=status.HTTP_404_NOT_FOUND)

        page.status = 'Approved'
        page.rejection_reason = ''
        page.reviewed_by = request.user
        page.reviewed_at = timezone.now()
        page.save(
            update_fields=[
                'status',
                'rejection_reason',
                'reviewed_by',
                'reviewed_at',
                'updated_at',
            ]
        )
        LibrarySettings.objects.filter(library=page.library).update(
            public_page_enabled=True,
            public_page_slug=page.slug,
        )
        return success(
            data=LibraryPublicPageSerializer(page).data,
            message='Public page approved',
        )


@extend_schema(tags=['Platform Library Pages'])
class LibraryPublicPageRejectView(APIView):
    """Reject a library's public micro-site page with a reason."""

    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        page = LibraryPublicPage.objects.select_related('library').filter(pk=pk).first()
        if not page:
            return error('Library public page not found', status=status.HTTP_404_NOT_FOUND)

        serializer = LibraryPublicPageRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        page.status = 'Rejected'
        page.rejection_reason = serializer.validated_data['reason']
        page.reviewed_by = request.user
        page.reviewed_at = timezone.now()
        page.save(
            update_fields=[
                'status',
                'rejection_reason',
                'reviewed_by',
                'reviewed_at',
                'updated_at',
            ]
        )
        LibrarySettings.objects.filter(library=page.library).update(public_page_enabled=False)
        return success(
            data=LibraryPublicPageSerializer(page).data,
            message='Public page rejected',
        )
