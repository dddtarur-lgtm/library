"""Views for Section 15.2 Public Page Editor (Library Admin Panel)."""
import uuid
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import PlatformAPIException
from apps.libraries.models import Library, LibrarySettings
from apps.public.models import (
    LibraryAchiever,
    LibraryBanner,
    LibraryEnquiry,
    LibraryFacility,
    LibraryGalleryItem,
    LibraryNotice,
    LibraryPageVisit,
)


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


def _get_or_create_settings(library):
    settings, _ = LibrarySettings.objects.get_or_create(library=library)
    return settings


DEFAULT_SECTIONS = [
    {'section_key': 'about', 'is_visible': True, 'sort_order': 1},
    {'section_key': 'facilities', 'is_visible': True, 'sort_order': 2},
    {'section_key': 'plans', 'is_visible': True, 'sort_order': 3},
    {'section_key': 'timings', 'is_visible': True, 'sort_order': 4},
    {'section_key': 'gallery', 'is_visible': True, 'sort_order': 5},
    {'section_key': 'achievers', 'is_visible': True, 'sort_order': 6},
    {'section_key': 'notices', 'is_visible': True, 'sort_order': 7},
    {'section_key': 'reviews', 'is_visible': True, 'sort_order': 8},
    {'section_key': 'faq', 'is_visible': True, 'sort_order': 9},
    {'section_key': 'contact', 'is_visible': True, 'sort_order': 10},
]


class LibraryPageView(APIView):
    """GET /v1/library/page"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        library = _get_request_library(request)
        settings = _get_or_create_settings(library)

        now = timezone.now()
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        views_today = LibraryPageVisit.objects.filter(library=library, visited_at__gte=start_of_today).count()
        views_total = LibraryPageVisit.objects.filter(library=library).count()
        enquiries_count = LibraryEnquiry.objects.filter(library=library).count()

        # Completeness calculation
        has_logo = bool(library.logo)
        has_contact = bool(library.phone and library.address)
        has_facilities = LibraryFacility.objects.filter(library=library, is_active=True).exists()
        from apps.billing.models import FeePlan
        has_plans = FeePlan.objects.filter(library=library, is_active=True).exists()

        checklist = [
            {'code': 'logo', 'label': 'Add library logo', 'done': has_logo, 'route': '/settings/profile'},
            {'code': 'contact', 'label': 'Add contact details', 'done': has_contact, 'route': '/settings/profile'},
            {'code': 'facilities', 'label': 'Add at least 3 facilities', 'done': has_facilities, 'route': '/page/facilities'},
            {'code': 'plans', 'label': 'Add subscription plans', 'done': has_plans, 'route': '/plans'},
        ]
        done_count = sum(1 for c in checklist if c['done'])
        score = int((done_count / len(checklist)) * 100)

        sections = settings.public_page_sections if settings.public_page_sections else DEFAULT_SECTIONS

        return Response({
            'status': settings.public_page_status,
            'last_published_at': settings.public_page_published_at.isoformat() if settings.public_page_published_at else None,
            'completeness': {
                'score': score,
                'checklist': checklist,
            },
            'sections': sections,
            'analytics_summary': {
                'views_today': views_today,
                'views_total': views_total,
                'enquiries_count': enquiries_count,
            },
        })


class LibraryPageSectionsView(APIView):
    """PUT /v1/library/page/sections"""
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        library = _get_request_library(request)
        settings = _get_or_create_settings(library)
        sections = request.data.get('sections', [])

        valid_keys = {'about', 'facilities', 'plans', 'timings', 'gallery', 'achievers', 'notices', 'reviews', 'faq', 'contact'}
        cleaned_sections = []
        for s in sections:
            k = s.get('section_key')
            if k in valid_keys:
                cleaned_sections.append({
                    'section_key': k,
                    'is_visible': bool(s.get('is_visible', True)),
                    'sort_order': int(s.get('sort_order', 1)),
                    'content': s.get('content', {}),
                })

        settings.public_page_sections = cleaned_sections
        settings.save(update_fields=['public_page_sections', 'updated_at'])
        return Response(settings.public_page_sections)


class LibraryPagePublishView(APIView):
    """POST /v1/library/page/publish"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        library = _get_request_library(request)
        settings = _get_or_create_settings(library)

        blockers = []
        if not (library.phone and library.address):
            blockers.append('Missing contact phone or address.')

        if blockers:
            raise PlatformAPIException('Page is incomplete. Please resolve blockers before publishing.', code='page_incomplete', status_code=status.HTTP_400_BAD_REQUEST, extra={'blockers': blockers})

        now = timezone.now()
        settings.public_page_status = 'published'
        settings.public_page_published_at = now
        settings.public_page_enabled = True
        if not settings.public_page_slug:
            from django.utils.text import slugify
            settings.public_page_slug = slugify(library.name)
        settings.save(update_fields=['public_page_status', 'public_page_published_at', 'public_page_enabled', 'public_page_slug', 'updated_at'])

        url = f"https://shelfspace.in/l/{settings.public_page_slug}"
        return Response({
            'published_at': now.isoformat(),
            'url': url,
        })


class LibraryPageUnpublishView(APIView):
    """POST /v1/library/page/unpublish"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        library = _get_request_library(request)
        settings = _get_or_create_settings(library)
        settings.public_page_status = 'draft'
        settings.save(update_fields=['public_page_status', 'updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryPagePreviewTokenView(APIView):
    """POST /v1/library/page/preview-token"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        library = _get_request_library(request)
        settings = _get_or_create_settings(library)
        token = uuid.uuid4().hex
        slug = settings.public_page_slug or library.code.lower()
        return Response({
            'token': token,
            'url': f"https://shelfspace.in/l/{slug}?preview={token}",
        })


# --- Facilities ---

class LibraryPageFacilitiesView(APIView):
    """GET & POST /v1/library/page/facilities"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        library = _get_request_library(request)
        facilities = LibraryFacility.objects.filter(library=library)
        return Response([
            {
                'id': str(f.id),
                'name': f.name,
                'icon_key': f.icon_key,
                'description': f.description,
                'image_url': f.image_url,
                'sort_order': f.sort_order,
                'is_active': f.is_active,
            }
            for f in facilities
        ])

    def post(self, request):
        library = _get_request_library(request)
        name = request.data.get('name')
        icon_key = request.data.get('icon_key', 'wifi')
        if not name:
            raise PlatformAPIException('name is required.', code='validation_error')

        facility = LibraryFacility.objects.create(
            library=library,
            name=name,
            icon_key=icon_key,
            description=request.data.get('description', ''),
            image_url=request.data.get('image_url') or request.data.get('image_file_id', ''),
            sort_order=request.data.get('sort_order', 0),
        )
        return Response({
            'id': str(facility.id),
            'name': facility.name,
            'icon_key': facility.icon_key,
            'description': facility.description,
            'image_url': facility.image_url,
            'sort_order': facility.sort_order,
            'is_active': facility.is_active,
        }, status=status.HTTP_201_CREATED)


class LibraryPageFacilityDetailView(APIView):
    """PATCH & DELETE /v1/library/page/facilities/{id}"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, id):
        library = _get_request_library(request)
        facility = LibraryFacility.objects.filter(pk=id, library=library).first()
        if not facility:
            raise PlatformAPIException('Facility not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        for field in ['name', 'icon_key', 'description', 'image_url', 'sort_order', 'is_active']:
            if field in request.data:
                setattr(facility, field, request.data[field])
        facility.save()

        return Response({
            'id': str(facility.id),
            'name': facility.name,
            'icon_key': facility.icon_key,
            'description': facility.description,
            'image_url': facility.image_url,
            'sort_order': facility.sort_order,
            'is_active': facility.is_active,
        })

    def delete(self, request, id):
        library = _get_request_library(request)
        facility = LibraryFacility.objects.filter(pk=id, library=library).first()
        if not facility:
            raise PlatformAPIException('Facility not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        facility.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- Banners ---

class LibraryPageBannersView(APIView):
    """GET & POST /v1/library/page/banners"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        library = _get_request_library(request)
        banners = LibraryBanner.objects.filter(library=library)
        return Response([
            {
                'id': str(b.id),
                'title': b.title,
                'subtitle': b.subtitle,
                'image_url': b.image_url,
                'link_url': b.link_url,
                'sort_order': b.sort_order,
                'is_active': b.is_active,
            }
            for b in banners
        ])

    def post(self, request):
        library = _get_request_library(request)
        title = request.data.get('title')
        if not title:
            raise PlatformAPIException('title is required.', code='validation_error')

        image_url = request.data.get('image_url') or request.data.get('image_file_id', '')
        banner = LibraryBanner.objects.create(
            library=library,
            title=title,
            subtitle=request.data.get('subtitle', ''),
            image_url=image_url,
            link_url=request.data.get('link_url', ''),
            sort_order=request.data.get('sort_order', 0),
            is_active=request.data.get('is_active', True),
        )
        return Response({
            'id': str(banner.id),
            'title': banner.title,
            'subtitle': banner.subtitle,
            'image_url': banner.image_url,
            'link_url': banner.link_url,
            'sort_order': banner.sort_order,
            'is_active': banner.is_active,
        }, status=status.HTTP_201_CREATED)


class LibraryPageBannerDetailView(APIView):
    """PATCH & DELETE /v1/library/page/banners/{id}"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, id):
        library = _get_request_library(request)
        banner = LibraryBanner.objects.filter(pk=id, library=library).first()
        if not banner:
            raise PlatformAPIException('Banner not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        for field in ['title', 'subtitle', 'image_url', 'link_url', 'sort_order', 'is_active']:
            if field in request.data:
                setattr(banner, field, request.data[field])
        banner.save()

        return Response({
            'id': str(banner.id),
            'title': banner.title,
            'subtitle': banner.subtitle,
            'image_url': banner.image_url,
            'link_url': banner.link_url,
            'sort_order': banner.sort_order,
            'is_active': banner.is_active,
        })

    def delete(self, request, id):
        library = _get_request_library(request)
        banner = LibraryBanner.objects.filter(pk=id, library=library).first()
        if not banner:
            raise PlatformAPIException('Banner not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        banner.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- Gallery ---

class LibraryPageGalleryView(APIView):
    """GET & POST /v1/library/page/gallery"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        library = _get_request_library(request)
        items = LibraryGalleryItem.objects.filter(library=library)
        return Response([
            {
                'id': str(g.id),
                'media_type': g.media_type,
                'url': g.url,
                'caption': g.caption,
                'sort_order': g.sort_order,
                'is_active': g.is_active,
            }
            for g in items
        ])

    def post(self, request):
        library = _get_request_library(request)
        media_type = request.data.get('media_type', 'image')
        url = request.data.get('url') or request.data.get('file_id', '')
        if not url:
            raise PlatformAPIException('url or file_id is required.', code='validation_error')

        item = LibraryGalleryItem.objects.create(
            library=library,
            media_type=media_type,
            url=url,
            caption=request.data.get('caption', ''),
            sort_order=request.data.get('sort_order', 0),
        )
        return Response({
            'id': str(item.id),
            'media_type': item.media_type,
            'url': item.url,
            'caption': item.caption,
            'sort_order': item.sort_order,
            'is_active': item.is_active,
        }, status=status.HTTP_201_CREATED)


class LibraryPageGalleryDetailView(APIView):
    """PATCH & DELETE /v1/library/page/gallery/{id}"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, id):
        library = _get_request_library(request)
        item = LibraryGalleryItem.objects.filter(pk=id, library=library).first()
        if not item:
            raise PlatformAPIException('Gallery item not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        for field in ['caption', 'sort_order', 'is_active', 'media_type', 'url']:
            if field in request.data:
                setattr(item, field, request.data[field])
        item.save()

        return Response({
            'id': str(item.id),
            'media_type': item.media_type,
            'url': item.url,
            'caption': item.caption,
            'sort_order': item.sort_order,
            'is_active': item.is_active,
        })

    def delete(self, request, id):
        library = _get_request_library(request)
        item = LibraryGalleryItem.objects.filter(pk=id, library=library).first()
        if not item:
            raise PlatformAPIException('Gallery item not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- Achievers ---

class LibraryPageAchieversView(APIView):
    """GET & POST /v1/library/page/achievers"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        library = _get_request_library(request)
        achievers = LibraryAchiever.objects.filter(library=library)
        return Response([
            {
                'id': str(a.id),
                'name': a.name,
                'achievement': a.achievement,
                'year': a.year,
                'photo_url': a.photo_url,
                'goal': a.goal,
                'is_featured': a.is_featured,
                'is_active': a.is_active,
                'sort_order': a.sort_order,
            }
            for a in achievers
        ])

    def post(self, request):
        library = _get_request_library(request)
        name = request.data.get('name')
        achievement = request.data.get('achievement')
        year = request.data.get('year', 2024)
        if not name or not achievement:
            raise PlatformAPIException('name and achievement are required.', code='validation_error')

        achiever = LibraryAchiever.objects.create(
            library=library,
            name=name,
            achievement=achievement,
            year=int(year),
            photo_url=request.data.get('photo_url') or request.data.get('photo_file_id', ''),
            goal=request.data.get('goal') or request.data.get('exam_goal', ''),
            is_featured=bool(request.data.get('is_featured', False)),
            is_active=bool(request.data.get('is_active', True)),
            sort_order=int(request.data.get('sort_order', 0)),
        )
        return Response({
            'id': str(achiever.id),
            'name': achiever.name,
            'achievement': achiever.achievement,
            'year': achiever.year,
            'photo_url': achiever.photo_url,
            'goal': achiever.goal,
            'is_featured': achiever.is_featured,
            'is_active': achiever.is_active,
            'sort_order': achiever.sort_order,
        }, status=status.HTTP_201_CREATED)


class LibraryPageAchieverDetailView(APIView):
    """PATCH & DELETE /v1/library/page/achievers/{id}"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, id):
        library = _get_request_library(request)
        achiever = LibraryAchiever.objects.filter(pk=id, library=library).first()
        if not achiever:
            raise PlatformAPIException('Achiever not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        for field in ['name', 'achievement', 'year', 'photo_url', 'goal', 'is_featured', 'is_active', 'sort_order']:
            if field in request.data:
                setattr(achiever, field, request.data[field])
        if 'photo_file_id' in request.data:
            achiever.photo_url = request.data['photo_file_id']
        if 'exam_goal' in request.data:
            achiever.goal = request.data['exam_goal']

        achiever.save()
        return Response({
            'id': str(achiever.id),
            'name': achiever.name,
            'achievement': achiever.achievement,
            'year': achiever.year,
            'photo_url': achiever.photo_url,
            'goal': achiever.goal,
            'is_featured': achiever.is_featured,
            'is_active': achiever.is_active,
            'sort_order': achiever.sort_order,
        })

    def delete(self, request, id):
        library = _get_request_library(request)
        achiever = LibraryAchiever.objects.filter(pk=id, library=library).first()
        if not achiever:
            raise PlatformAPIException('Achiever not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        achiever.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- Notices ---

class LibraryPageNoticesView(APIView):
    """GET & POST /v1/library/page/notices"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        library = _get_request_library(request)
        notices = LibraryNotice.objects.filter(library=library)
        return Response([
            {
                'id': str(n.id),
                'title': n.title,
                'body': n.body,
                'visible_to': n.visible_to,
                'starts_at': n.starts_at.isoformat() if n.starts_at else None,
                'ends_at': n.ends_at.isoformat() if n.ends_at else None,
            }
            for n in notices
        ])

    def post(self, request):
        library = _get_request_library(request)
        title = request.data.get('title')
        body = request.data.get('body')
        visible_to = request.data.get('visible_to', 'public')
        if not title or not body:
            raise PlatformAPIException('title and body are required.', code='validation_error')

        notice = LibraryNotice.objects.create(
            library=library,
            title=title,
            body=body,
            visible_to=visible_to,
            starts_at=request.data.get('starts_at'),
            ends_at=request.data.get('ends_at'),
        )
        return Response({
            'id': str(notice.id),
            'title': notice.title,
            'body': notice.body,
            'visible_to': notice.visible_to,
            'starts_at': notice.starts_at.isoformat() if notice.starts_at else None,
            'ends_at': notice.ends_at.isoformat() if notice.ends_at else None,
        }, status=status.HTTP_201_CREATED)


class LibraryPageNoticeDetailView(APIView):
    """PATCH & DELETE /v1/library/page/notices/{id}"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, id):
        library = _get_request_library(request)
        notice = LibraryNotice.objects.filter(pk=id, library=library).first()
        if not notice:
            raise PlatformAPIException('Notice not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        for field in ['title', 'body', 'visible_to', 'starts_at', 'ends_at']:
            if field in request.data:
                setattr(notice, field, request.data[field])
        notice.save()

        return Response({
            'id': str(notice.id),
            'title': notice.title,
            'body': notice.body,
            'visible_to': notice.visible_to,
            'starts_at': notice.starts_at.isoformat() if notice.starts_at else None,
            'ends_at': notice.ends_at.isoformat() if notice.ends_at else None,
        })

    def delete(self, request, id):
        library = _get_request_library(request)
        notice = LibraryNotice.objects.filter(pk=id, library=library).first()
        if not notice:
            raise PlatformAPIException('Notice not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        notice.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
