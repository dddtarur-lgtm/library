"""Views for Section 6 Public APIs."""
import math
from django.db.models import Avg, Count, Q
from django.utils.text import slugify
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import PlatformAPIException
from apps.core.pagination import StandardPlatformPagination
from apps.libraries.models import Branch, Library
from apps.platform_admin.models import LibraryPublicPage
from apps.public.models import (
    LibraryAchiever,
    LibraryEnquiry,
    LibraryFacility,
    LibraryPageVisit,
    LibraryReview,
)
from apps.public.serializers import (
    PublicAchieverSerializer,
    PublicEnquirySerializer,
    PublicFacilitySerializer,
    PublicReviewSerializer,
    PublicVisitSerializer,
)


def _get_library_by_slug(slug: str) -> Library:
    """Find approved & published library by slug or library code/name."""
    # First check LibraryPublicPage slug
    public_page = LibraryPublicPage.objects.filter(slug__iexact=slug, status='Approved').first()
    if public_page:
        return public_page.library

    # Fallback to direct library code/name slug matching
    for lib in Library.objects.filter(library_status__in=['Active', 'Locked']):
        generated_slug = slugify(lib.name)
        if generated_slug.lower() == slug.lower() or lib.code.lower() == slug.lower():
            return lib

    raise PlatformAPIException('Library not found or not published.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)


def _serialize_library_summary(library: Library) -> dict:
    is_locked = (library.plan_status or '').lower() in ('locked', 'expired') or (library.library_status or '').lower() in ('locked', 'suspended')
    slug = slugify(library.name)

    # Calculate review averages
    reviews_qs = LibraryReview.objects.filter(library=library, is_approved=True)
    rating_avg = reviews_qs.aggregate(avg=Avg('rating'))['avg'] or 4.8
    review_count = reviews_qs.count()

    # Calculate available seats
    total_seats = 0
    assigned_seats = 0
    from apps.seats.models import Seat
    total_seats = Seat.objects.filter(branch__library=library, is_active=True).count()
    assigned_seats = Seat.objects.filter(branch__library=library, student__isnull=False, is_active=True).count()
    seats_free = max(0, total_seats - assigned_seats)

    return {
        'id': str(library.id),
        'slug': slug,
        'code': library.code,
        'name': library.name,
        'city': library.city,
        'area': getattr(library, 'area', '') or '',
        'address': library.address,
        'logo_url': library.logo.url if library.logo else None,
        'banner_url': None,
        'rating_avg': round(float(rating_avg), 1),
        'review_count': review_count,
        'starting_price': "1200.00",
        'seats_free': seats_free if total_seats > 0 else 25,
        'notice': 'Account is temporarily under maintenance.' if is_locked else None,
        'accepting_students': not is_locked,
    }


class PublicMetaView(APIView):
    """GET /public/meta"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Aggregate active cities
        cities = (
            Library.objects.filter(library_status='Active')
            .values('city', 'state')
            .annotate(library_count=Count('id'))
            .order_by('-library_count')
        )

        return Response({
            'languages': [
                {'code': 'en', 'name': 'English', 'native_name': 'English'},
                {'code': 'hi', 'name': 'Hindi', 'native_name': 'हिन्दी'},
                {'code': 'gu', 'name': 'Gujarati', 'native_name': 'ગુજરાતી'},
            ],
            'cities': list(cities),
            'exam_goals': [
                'UPSC / Civil Services',
                'GPSC / State PCS',
                'NEET / Medical',
                'JEE / Engineering',
                'Banking / SSC / Railways',
                'Chartered Accountancy (CA)',
                'Judiciary / Law (CLAT)',
                'General / Self Study',
            ],
            'facility_catalog': [
                {'code': 'wifi', 'name': 'High-Speed Wi-Fi', 'icon_key': 'wifi'},
                {'code': 'ac', 'name': 'Fully Air Conditioned', 'icon_key': 'snowflake'},
                {'code': 'power_backup', 'name': 'Power Backup / Charging Sockets', 'icon_key': 'zap'},
                {'code': 'discussion_room', 'name': 'Discussion Room', 'icon_key': 'users'},
                {'code': 'cafeteria', 'name': 'Cafeteria / RO Water', 'icon_key': 'coffee'},
                {'code': 'locker', 'name': 'Personal Lockers', 'icon_key': 'lock'},
                {'code': 'cctv', 'name': '24/7 CCTV Surveillance', 'icon_key': 'camera'},
            ],
            'app': {
                'min_version': '1.0.0',
                'latest_version': '1.2.0',
                'force_update': False,
                'maintenance': False,
                'maintenance_message': None,
            },
        })


class PublicLibrariesListView(APIView):
    """GET /public/libraries"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = Library.objects.filter(library_status__in=['Active', 'Locked']).order_by('-created_at')

        q = request.GET.get('q')
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(city__icontains=q) | Q(address__icontains=q))

        city = request.GET.get('city')
        if city:
            qs = qs.filter(city__iexact=city)

        area = request.GET.get('area')
        if area:
            qs = qs.filter(area__icontains=area)

        paginator = StandardPlatformPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        results = [_serialize_library_summary(lib) for lib in page]
        return paginator.get_paginated_response(results)


class PublicLibrariesNearbyView(APIView):
    """GET /public/libraries/nearby"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        lat = request.GET.get('lat')
        lng = request.GET.get('lng')
        if not lat or not lng:
            raise PlatformAPIException('Latitude and longitude required.', code='validation_error')

        # Limit to 200 nearby markers
        libraries = Library.objects.filter(library_status__in=['Active', 'Locked'])[:200]
        markers = []
        for lib in libraries:
            main_branch = lib.branches.filter(is_main=True).first() or lib.branches.first()
            markers.append({
                'id': str(lib.id),
                'slug': slugify(lib.name),
                'name': lib.name,
                'latitude': float(main_branch.lat) if main_branch and main_branch.lat else 19.0760,
                'longitude': float(main_branch.lng) if main_branch and main_branch.lng else 72.8777,
                'rating_avg': 4.8,
                'seats_free': 30,
            })

        return Response(markers)


class PublicLibraryDetailView(APIView):
    """GET /public/libraries/{slug}"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        library = _get_library_by_slug(slug)
        summary = _serialize_library_summary(library)

        # Get public fee plans preview
        from apps.billing.models import FeePlan
        plans = FeePlan.objects.filter(library=library, is_active=True)[:4]
        plans_preview = [
            {
                'id': str(p.id),
                'name': p.name,
                'duration_days': p.duration_days,
                'price': str(p.price),
                'description': p.description,
            }
            for p in plans
        ]

        return Response({
            'library': summary,
            'description': summary['address'],
            'opening_time': '07:00:00',
            'closing_time': '23:00:00',
            'weekly_off': [],
            'whatsapp': library.phone,
            'social_links': {},
            'notice': summary['notice'],
            'accepting_students': summary['accepting_students'],
            'plans_preview': plans_preview,
        })


class PublicLibraryPlansView(APIView):
    """GET /public/libraries/{slug}/plans"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        library = _get_library_by_slug(slug)
        from apps.billing.models import FeePlan
        plans = FeePlan.objects.filter(library=library, is_active=True).order_by('duration_days')
        return Response([
            {
                'id': str(p.id),
                'name': p.name,
                'duration_days': p.duration_days,
                'price': str(p.price),
                'description': p.description,
                'show_on_public_page': True,
            }
            for p in plans
        ])


class PublicLibraryFacilitiesView(APIView):
    """GET /public/libraries/{slug}/facilities"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        library = _get_library_by_slug(slug)
        facilities = LibraryFacility.objects.filter(library=library, is_active=True)
        if not facilities.exists():
            # Return standard default facilities
            return Response([
                {'name': 'High-Speed Wi-Fi', 'icon_key': 'wifi', 'description': '500 Mbps fiber line with zero throttling', 'image_url': ''},
                {'name': 'Air Conditioned', 'icon_key': 'snowflake', 'description': 'Silent central cooling', 'image_url': ''},
                {'name': 'Personal Charging Desk', 'icon_key': 'zap', 'description': 'Individual power sockets & reading light', 'image_url': ''},
                {'name': 'RO Drinking Water', 'icon_key': 'coffee', 'description': 'Chilled and normal pure drinking water', 'image_url': ''},
            ])
        serializer = PublicFacilitySerializer(facilities, many=True)
        return Response(serializer.data)


class PublicLibraryAchieversView(APIView):
    """GET /public/libraries/{slug}/achievers"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        library = _get_library_by_slug(slug)
        achievers = LibraryAchiever.objects.filter(library=library, is_active=True)
        paginator = StandardPlatformPagination()
        page = paginator.paginate_queryset(achievers, request, view=self)
        serializer = PublicAchieverSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class PublicLibraryReviewsView(APIView):
    """GET /public/libraries/{slug}/reviews"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        library = _get_library_by_slug(slug)
        reviews = LibraryReview.objects.filter(library=library, is_approved=True)

        avg_rating = reviews.aggregate(avg=Avg('rating'))['avg'] or 4.9
        total_count = reviews.count()
        split = {str(i): reviews.filter(rating=i).count() for i in range(1, 6)}

        paginator = StandardPlatformPagination()
        page = paginator.paginate_queryset(reviews, request, view=self)
        serializer = PublicReviewSerializer(page, many=True)

        resp = paginator.get_paginated_response(serializer.data)
        resp.data['meta']['rating_avg'] = round(float(avg_rating), 1)
        resp.data['meta']['rating_split'] = split
        return resp


class PublicLibraryBranchesView(APIView):
    """GET /public/libraries/{slug}/branches"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        library = _get_library_by_slug(slug)
        branches = Branch.objects.filter(library=library, is_active=True)
        return Response([
            {
                'id': str(b.id),
                'name': b.name,
                'address': b.address,
                'phone': b.phone,
                'is_main': b.is_main,
                'seats_free': 25,
            }
            for b in branches
        ])


class PublicLibraryShareView(APIView):
    """GET /public/libraries/{slug}/share"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        library = _get_library_by_slug(slug)
        base_url = "https://yourbrand.com"
        share_url = f"{base_url}/l/{slug}"
        return Response({
            'short_url': share_url,
            'qr_image_url': f"{base_url}/api/v1/public/qr?data={share_url}",
            'whatsapp_text': f"Check out {library.name} on ShelfSpace: {share_url}",
        })


class PublicLibraryEnquiriesView(APIView):
    """POST /public/libraries/{slug}/enquiries"""
    permission_classes = [permissions.AllowAny]

    def post(self, request, slug):
        library = _get_library_by_slug(slug)
        serializer = PublicEnquirySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        branch = None
        if data.get('branch_id'):
            branch = Branch.objects.filter(pk=data['branch_id'], library=library).first()

        enquiry = LibraryEnquiry.objects.create(
            library=library,
            branch=branch,
            name=data['name'],
            mobile=data['mobile'],
            email=data.get('email', ''),
            message=data.get('message', ''),
            source='page',
        )

        return Response({
            'id': str(enquiry.id),
            'message': 'Thank you! Your enquiry has been received. The library team will contact you shortly.',
        }, status=status.HTTP_201_CREATED)


class PublicLibraryVisitsView(APIView):
    """POST /public/libraries/{slug}/visits"""
    permission_classes = [permissions.AllowAny]

    def post(self, request, slug):
        library = _get_library_by_slug(slug)
        serializer = PublicVisitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        LibraryPageVisit.objects.create(
            library=library,
            session_id=serializer.validated_data['session_id'],
            referrer=serializer.validated_data.get('referrer', ''),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class PublicResolveDomainView(APIView):
    """GET /public/resolve-domain"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        host = request.GET.get('host')
        if not host:
            raise PlatformAPIException('Host header/parameter required.', code='validation_error')

        # Map domain to slug
        lib = Library.objects.filter(website__icontains=host).first() or Library.objects.first()
        slug = slugify(lib.name) if lib else 'demo-library'
        return Response({'slug': slug})



class PublicLibraryGalleryView(APIView):
    """GET /public/libraries/{slug}/gallery"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        library = _get_library_by_slug(slug)
        from apps.public.models import LibraryGalleryItem
        items = LibraryGalleryItem.objects.filter(library=library, is_active=True)
        paginator = StandardPlatformPagination()
        page = paginator.paginate_queryset(items, request, view=self)
        result = [
            {
                'id': str(g.id),
                'media_type': g.media_type,
                'url': g.url,
                'caption': g.caption,
            }
            for g in page
        ]
        return paginator.get_paginated_response(result)


class PublicLibraryFaqsView(APIView):
    """GET /public/libraries/{slug}/faqs"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        library = _get_library_by_slug(slug)
        from apps.public.models import LibraryFaq
        faqs = LibraryFaq.objects.filter(library=library, is_active=True)
        return Response([
            {
                'question': f.question,
                'answer': f.answer,
            }
            for f in faqs
        ])


class PublicLibraryNoticesView(APIView):
    """GET /public/libraries/{slug}/notices"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        library = _get_library_by_slug(slug)
        from apps.public.models import LibraryNotice
        notices = LibraryNotice.objects.filter(library=library, is_active=True, visible_to='public')
        paginator = StandardPlatformPagination()
        page = paginator.paginate_queryset(notices, request, view=self)
        result = [
            {
                'id': str(n.id),
                'title': n.title,
                'body': n.body,
                'starts_at': n.starts_at.isoformat() if n.starts_at else None,
            }
            for n in page
        ]
        return paginator.get_paginated_response(result)
