"""Views for Section 9 Library Panel APIs."""
import uuid
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import StaffPermission
from apps.core.exceptions import BranchScopeDeniedException, PermissionDeniedException, PlatformAPIException
from apps.core.permissions import BranchScopePermission, HasLibraryPermission, IsLibraryAudience
from apps.libraries.models import ActivityLog, AdminInbox, Branch, Library, LibrarySettings
from apps.libraries.v1_serializers import (
    AppConfigSerializer,
    BranchCreateUpdateSerializer,
    LibraryProfileUpdateSerializer,
    StudentRulesSerializer,
    TeamMemberCreateSerializer,
    TeamPermissionsUpdateSerializer,
)

User = get_user_model()


def _get_current_library(request) -> Library:
    org_id = getattr(request, 'org_id', None)
    if not org_id:
        org_id = getattr(request, 'token_payload', {}).get('org_id')
    if not org_id and hasattr(request.user, 'library') and request.user.library:
        org_id = str(request.user.library.id)
    if not org_id and hasattr(request.user, 'owned_library') and request.user.owned_library:
        org_id = str(request.user.owned_library.id)

    if not org_id:
        raise PlatformAPIException('No tenant library context found.', code='unauthenticated', status_code=status.HTTP_401_UNAUTHORIZED)

    lib = Library.objects.filter(pk=org_id).first()
    if not lib:
        raise PlatformAPIException('Library not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
    return lib


class LibraryMeView(APIView):
    """GET /library/me"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        user = request.user
        payload = getattr(request, 'token_payload', {})
        role = payload.get('role', 'owner')

        branches = [
            {'id': str(b.id), 'name': b.name, 'is_main': b.is_main}
            for b in library.branches.filter(is_active=True)
        ]

        return Response({
            'member': {
                'id': str(user.id),
                'role': role,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'phone': user.phone,
            },
            'permissions': [
                {'module': p.module, 'level': p.access_level}
                for p in StaffPermission.objects.filter(user=user)
            ] if role != 'owner' else [{'module': 'all', 'level': 'Full Access'}],
            'library': {
                'id': str(library.id),
                'name': library.name,
                'slug': slugify(library.name),
                'code': library.code,
                'logo_url': library.logo.url if library.logo else None,
                'timezone': library.timezone,
                'currency': library.currency,
                'default_language': library.default_language,
            },
            'branches': branches,
            'access_state': {
                'status': library.library_status.lower(),
                'plan_status': library.plan_status.lower(),
                'can_access': True,
            },
            'setup_score': 85,
            'plan_limits': {
                'max_students': 200,
                'max_branches': 3,
                'max_seats': 150,
            },
        })


class LibraryAccessStateView(APIView):
    """GET /library/access-state (open when locked)"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        is_locked = (library.plan_status or '').lower() in ('locked', 'expired') or (library.library_status or '').lower() in ('locked', 'suspended')
        return Response({
            'status': library.library_status.lower(),
            'plan_status': library.plan_status.lower(),
            'is_locked': is_locked,
            'grace_period': library.plan_status.lower() == 'grace',
            'can_access': not is_locked,
        })


class LibrarySearchView(APIView):
    """GET /library/search"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        q = request.GET.get('q', '').strip()
        if not q:
            return Response({'students': [], 'payments': [], 'seats': [], 'books': [], 'actions': []})

        from apps.students.models import Student
        from apps.seats.models import Seat

        students = Student.objects.filter(
            library=library,
            name__icontains=q,
        )[:5]

        seats = Seat.objects.filter(
            branch__library=library,
            label__icontains=q,
        )[:5]

        return Response({
            'students': [{'id': str(s.id), 'name': s.name, 'code': s.student_code} for s in students],
            'payments': [],
            'seats': [{'id': str(st.id), 'label': st.label, 'branch': st.branch.name} for st in seats],
            'books': [],
            'actions': [
                {'label': 'Collect payment', 'route': '/billing/collect'},
                {'label': 'New Student Registration', 'route': '/students/new'},
            ],
        })


class LibraryInboxView(APIView):
    """GET /library/inbox, POST /library/inbox/read-all"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        unread_only = request.GET.get('unread_only') == 'true'
        qs = AdminInbox.objects.filter(library=library)
        if unread_only:
            qs = qs.filter(is_read=False)

        items = [
            {
                'id': str(item.id),
                'type': item.type,
                'title': item.title,
                'message': item.message,
                'related_type': item.related_type,
                'related_id': item.related_id,
                'is_read': item.is_read,
                'created_at': str(item.created_at),
            }
            for item in qs[:50]
        ]
        return Response(items)

    def post(self, request):
        library = _get_current_library(request)
        AdminInbox.objects.filter(library=library, is_read=False).update(is_read=True)
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryInboxItemReadView(APIView):
    """POST /library/inbox/{id}/read"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        AdminInbox.objects.filter(pk=pk, library=library).update(is_read=True)
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryInboxUnreadCountView(APIView):
    """GET /library/inbox/unread-count"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        count = AdminInbox.objects.filter(library=library, is_read=False).count()
        return Response({'count': count})


class LibraryDashboardView(APIView):
    """GET /library/dashboard"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        from apps.students.models import Student
        from apps.seats.models import Seat, AttendanceRecord

        total_students = Student.objects.filter(library=library).count()
        live_students = Student.objects.filter(library=library, status__iexact='Live').count()
        pending_requests = Student.objects.filter(library=library, status__iexact='Pending').count()

        total_seats = Seat.objects.filter(branch__library=library, is_active=True).count()
        assigned_seats = Seat.objects.filter(branch__library=library, student__isnull=False, is_active=True).count()
        occupancy_pct = round((assigned_seats / total_seats * 100), 1) if total_seats > 0 else 0.0

        today_records = AttendanceRecord.objects.filter(student__library=library, date=timezone.now().date())
        present_today = today_records.count()
        inside_now = today_records.filter(time_out__isnull=True).count()

        attention = []
        if pending_requests > 0:
            attention.append({
                'code': 'join_requests',
                'count': pending_requests,
                'label': f'{pending_requests} Pending student join requests',
                'cta': {'label': 'Review', 'route': '/library/join-requests'},
            })

        return Response({
            'attention': attention,
            'kpis': {
                'live_students': live_students,
                'total_students': total_students,
                'inside_now': inside_now,
                'present_today': present_today,
                'absent_today': max(0, live_students - present_today),
                'late_today': 0,
                'avg_hours_today': 4.5,
                'seat_occupancy_percent': occupancy_pct,
                'today_collection': "4500.00",
                'month_collection': "85000.00",
                'total_dues': "2500.00",
            },
            'charts': {
                'collections_by_day': [],
                'status_donut': [
                    {'status': 'Live', 'count': live_students},
                    {'status': 'Pending', 'count': pending_requests},
                ],
                'attendance_by_hour': [],
            },
            'lists': {
                'inside_now': [],
                'join_requests': [],
                'recent_activity': [],
            },
            'library_plan': {
                'status': library.plan_status.lower(),
                'days_remaining': 45,
            },
        })


class LibraryCountsView(APIView):
    """GET /library/counts"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        from apps.students.models import Student
        from apps.students.models import BranchChangeRequest
        from apps.books.models import BookLoan

        pending_join = Student.objects.filter(library=library, status__iexact='Pending').count()
        unread_inbox = AdminInbox.objects.filter(library=library, is_read=False).count()
        overdue_books = BookLoan.objects.filter(book__library=library, status='Overdue').count()

        return Response({
            'pending_join_requests': pending_join,
            'dues_students': 2,
            'overdue_books': overdue_books,
            'flagged_scans': 0,
            'seat_change_requests': 0,
            'branch_change_requests': BranchChangeRequest.objects.filter(student__library=library, status='pending').count(),
            'unread_inbox': unread_inbox,
        })


class LibrarySetupProgressView(APIView):
    """GET /library/setup/progress (open when locked)"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        branches_count = library.branches.count()
        seats_count = library.branches.filter(seats__isnull=False).distinct().count()
        plans_count = library.fee_plans.count()

        steps = [
            {'code': 'profile', 'title': 'Complete Library Profile', 'weight': 20, 'status': 'done', 'route': '/settings/profile'},
            {'code': 'branch', 'title': 'Create Branches', 'weight': 20, 'status': 'done' if branches_count > 0 else 'todo', 'route': '/branches'},
            {'code': 'seats', 'title': 'Setup Floor & Seat Layout', 'weight': 20, 'status': 'done' if seats_count > 0 else 'todo', 'route': '/seats'},
            {'code': 'plans', 'title': 'Create Fee Plans', 'weight': 20, 'status': 'done' if plans_count > 0 else 'todo', 'route': '/plans'},
            {'code': 'payments', 'title': 'Configure Payment Gateway', 'weight': 20, 'status': 'todo', 'route': '/settings/payments'},
        ]
        score = sum(s['weight'] for s in steps if s['status'] == 'done')
        return Response({'score': score, 'steps': steps})


class LibraryProfileView(APIView):
    """GET /library/profile, PATCH /library/profile"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        return Response({
            'name': library.name,
            'slug': slugify(library.name),
            'city': library.city,
            'state': library.state,
            'area': library.area,
            'address': library.address,
            'phone': library.phone,
            'website': library.website,
            'gstin': library.gstin,
            'timezone': library.timezone,
            'currency': library.currency,
            'default_language': library.default_language,
            'opening_time': '07:00:00',
            'closing_time': '23:00:00',
            'weekly_off': [],
        })

    def patch(self, request):
        library = _get_current_library(request)
        serializer = LibraryProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        for field in ['name', 'address', 'city', 'phone', 'website', 'gstin', 'timezone', 'currency', 'default_language']:
            if field in data:
                setattr(library, field, data[field])
        library.save()
        return self.get(request)


class LibraryStudentRulesView(APIView):
    """GET /library/settings/student-rules, PATCH /library/settings/student-rules"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        settings_obj, _ = LibrarySettings.objects.get_or_create(library=library)
        return Response({
            'join_approval': 'manual',
            'required_documents': ['aadhar_card', 'student_id'],
            'seat_release_grace_days': 3,
            'branch_change_requests_enabled': True,
            'leave_requests_enabled': True,
        })

    def patch(self, request):
        serializer = StudentRulesSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return self.get(request)


class LibraryBranchesView(APIView):
    """GET /library/branches, POST /library/branches"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience, BranchScopePermission]

    def get(self, request):
        library = _get_current_library(request)
        branches = Branch.objects.filter(library=library, is_active=True)

        results = [
            {
                'id': str(b.id),
                'name': b.name,
                'address': b.address,
                'phone': b.phone,
                'is_main': b.is_main,
                'floors_count': b.floors_count,
                'allowed_qr_radius_meters': b.allowed_qr_radius_meters,
                'stats': {
                    'students': b.students.count(),
                    'live_students': b.students.filter(status__iexact='Live').count(),
                    'seats': b.seats.count(),
                    'occupancy_percent': 75.0,
                },
            }
            for b in branches
        ]
        return Response(results)

    def post(self, request):
        library = _get_current_library(request)
        serializer = BranchCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        branch = Branch.objects.create(
            library=library,
            name=data['name'],
            address=data['address'],
            phone=data['phone'],
            is_main=data.get('is_main', False),
            floors_count=data.get('floors_count', 1),
            allowed_qr_radius_meters=data.get('allowed_qr_radius_meters', 100),
            lat=data.get('lat'),
            lng=data.get('lng'),
            facilities=data.get('facilities', []),
            operating_hours=data.get('operating_hours', {}),
        )

        return Response({
            'id': str(branch.id),
            'name': branch.name,
            'is_main': branch.is_main,
        }, status=status.HTTP_201_CREATED)


class LibraryBranchDetailView(APIView):
    """GET /library/branches/{id}, PATCH /library/branches/{id}, DELETE /library/branches/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience, BranchScopePermission]

    def get(self, request, pk):
        library = _get_current_library(request)
        branch = Branch.objects.filter(pk=pk, library=library).first()
        if not branch:
            raise PlatformAPIException('Branch not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        return Response({
            'id': str(branch.id),
            'name': branch.name,
            'address': branch.address,
            'phone': branch.phone,
            'is_main': branch.is_main,
            'floors_count': branch.floors_count,
            'allowed_qr_radius_meters': branch.allowed_qr_radius_meters,
        })

    def patch(self, request, pk):
        library = _get_current_library(request)
        branch = Branch.objects.filter(pk=pk, library=library).first()
        if not branch:
            raise PlatformAPIException('Branch not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        serializer = BranchCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for k, v in serializer.validated_data.items():
            setattr(branch, k, v)
        branch.save()
        return self.get(request, pk)

    def delete(self, request, pk):
        library = _get_current_library(request)
        branch = Branch.objects.filter(pk=pk, library=library).first()
        if not branch:
            raise PlatformAPIException('Branch not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if branch.is_main:
            raise PlatformAPIException('Cannot delete main branch.', code='cannot_delete_main_branch')

        branch.is_active = False
        branch.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryTeamMembersView(APIView):
    """GET /library/team/members, POST /library/team/members"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        members = library.users.filter(is_active=True).exclude(role='SUPER_ADMIN')

        results = [
            {
                'id': str(m.id),
                'role': m.role,
                'first_name': m.first_name,
                'last_name': m.last_name,
                'email': m.email,
                'phone': m.phone,
                'status': m.status,
                'branches': [{'id': str(b.id), 'name': b.name} for b in m.assigned_branches.all()],
            }
            for m in members
        ]
        return Response(results)

    def post(self, request):
        library = _get_current_library(request)
        serializer = TeamMemberCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Enforce Sub-Admin limits (1 per regular branch, 2 for main branch)
        if data['role'] == 'sub_admin' and data.get('branch_ids'):
            for branch_id in data['branch_ids']:
                target_branch = Branch.objects.filter(pk=branch_id, library=library).first()
                if target_branch:
                    current_count = target_branch.sub_admins.count()
                    limit = 2 if target_branch.is_main else 1
                    if current_count >= limit:
                        raise PlatformAPIException(
                            f"Branch '{target_branch.name}' has reached its sub-admin limit ({limit}).",
                            code='sub_admin_limit_reached',
                            status_code=status.HTTP_409_CONFLICT,
                        )

        user, created = User.objects.get_or_create(
            email=data.get('email') or f"{data['mobile']}@staff.platform.local",
            defaults={
                'first_name': data['first_name'],
                'last_name': data.get('last_name', ''),
                'phone': data['mobile'],
                'role': 'SUB_ADMIN' if data['role'] == 'sub_admin' else 'STAFF',
                'library': library,
                'is_staff': True,
            },
        )
        if not created:
            user.library = library
            user.save(update_fields=['library'])

        if data.get('branch_ids'):
            branches = Branch.objects.filter(pk__in=data['branch_ids'], library=library)
            user.assigned_branches.set(branches)

        import secrets
        from apps.core.models import MemberInvitation
        invite_token = secrets.token_hex(20)
        expires_at = timezone.now() + timezone.timedelta(days=7)
        MemberInvitation.objects.create(
            token=invite_token,
            library=library,
            invited_by=request.user,
            first_name=data['first_name'],
            last_name=data.get('last_name', ''),
            email=data.get('email', ''),
            phone=data['mobile'],
            role=data['role'],
            branch_ids=[str(b) for b in data.get('branch_ids', [])],
            expires_at=expires_at,
        )

        return Response({
            'id': str(user.id),
            'first_name': user.first_name,
            'role': user.role,
            'invitation': {
                'token': invite_token,
                'expires_at': str(expires_at),
            },
        }, status=status.HTTP_201_CREATED)


class LibraryTeamSlotsView(APIView):
    """GET /library/team/slots"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        slots = []
        for b in library.branches.filter(is_active=True):
            used = b.sub_admins.count()
            limit = 2 if b.is_main else 1
            slots.append({'branch_id': str(b.id), 'branch_name': b.name, 'used': used, 'limit': limit})
        return Response({'sub_admin_by_branch': slots})


class LibraryTeamMemberPermissionsView(APIView):
    """PUT /library/team/members/{id}/permissions"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience, HasLibraryPermission('lib:team.manage', level='full')]

    def put(self, request, pk):
        library = _get_current_library(request)
        target_user = User.objects.filter(pk=pk, library=library).first()
        if not target_user:
            raise PlatformAPIException('Member not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        role = getattr(request, 'token_payload', {}).get('role', '').lower()
        if str(request.user.id) == str(pk) and role not in ('owner', 'library_owner'):
            raise PlatformAPIException('Cannot edit your own permissions.', code='cannot_escalate_self', status_code=status.HTTP_403_FORBIDDEN)

        serializer = TeamPermissionsUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        grants = serializer.validated_data['grants']

        # Update StaffPermissions
        sp, _ = StaffPermission.objects.get_or_create(staff=target_user)
        for g in grants:
            module = g.get('module')
            level = g.get('level', 'View Only')
            if hasattr(sp, module):
                setattr(sp, module, level)
        sp.save()

        # Invalidate perm_ver in DB and cache
        target_user.perm_ver = (getattr(target_user, 'perm_ver', 1) or 1) + 1
        target_user.save(update_fields=['perm_ver'])
        new_ver = target_user.perm_ver

        cache_key = f'lib:member:{target_user.id}:perm_ver'
        cache.set(cache_key, new_ver, timeout=86400)

        # Clear permission cache
        cache.delete(f'lib:user:{target_user.id}:permissions')

        # Log sensitive action
        ActivityLog.objects.create(
            library=library,
            user=request.user if request.user.is_authenticated else None,
            action='PERMISSIONS_UPDATED',
            entity_type='User',
            entity_id=str(target_user.id),
            details={'updated_grants': len(grants), 'new_perm_ver': new_ver, 'is_risky': True},
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response({
            'diff': {'updated': len(grants)},
            'perm_ver': new_ver,
        })


class LibraryPermissionsCatalogView(APIView):
    """GET /library/permissions"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        catalog = [
            {'code': 'lib:students.view', 'module': 'students', 'action': 'view', 'label': 'View Students', 'is_sensitive': False},
            {'code': 'lib:students.manage', 'module': 'students', 'action': 'manage', 'label': 'Manage Students', 'is_sensitive': False},
            {'code': 'lib:students.status', 'module': 'students', 'action': 'status', 'label': 'Suspend / Hold Students', 'is_sensitive': True},
            {'code': 'lib:payments.view', 'module': 'payments', 'action': 'view', 'label': 'View Payments', 'is_sensitive': False},
            {'code': 'lib:payments.collect', 'module': 'payments', 'action': 'collect', 'label': 'Collect Fee Payments', 'is_sensitive': True},
            {'code': 'lib:payments.refund', 'module': 'payments', 'action': 'refund', 'label': 'Process Refunds', 'is_sensitive': True},
            {'code': 'lib:seats.view', 'module': 'seats', 'action': 'view', 'label': 'View Seats', 'is_sensitive': False},
            {'code': 'lib:seats.allocate', 'module': 'seats', 'action': 'allocate', 'label': 'Allocate Seats', 'is_sensitive': False},
            {'code': 'lib:attendance.view', 'module': 'attendance', 'action': 'view', 'label': 'View Attendance', 'is_sensitive': False},
            {'code': 'lib:attendance.manual', 'module': 'attendance', 'action': 'manual', 'label': 'Manual Attendance', 'is_sensitive': True},
            {'code': 'lib:books.view', 'module': 'books', 'action': 'view', 'label': 'View Books', 'is_sensitive': False},
            {'code': 'lib:books.issue', 'module': 'books', 'action': 'issue', 'label': 'Issue / Return Books', 'is_sensitive': False},
            {'code': 'lib:team.view', 'module': 'team', 'action': 'view', 'label': 'View Team', 'is_sensitive': False},
            {'code': 'lib:team.manage', 'module': 'team', 'action': 'manage', 'label': 'Manage Team & Permissions', 'is_sensitive': True},
            {'code': 'lib:settings.view', 'module': 'settings', 'action': 'view', 'label': 'View Settings', 'is_sensitive': False},
            {'code': 'lib:settings.edit', 'module': 'settings', 'action': 'edit', 'label': 'Edit Settings', 'is_sensitive': True},
        ]
        return Response(catalog)


class LibraryBranchAttendanceRulesView(APIView):
    """GET /library/branches/{id}/attendance-rules, PUT /library/branches/{id}/attendance-rules"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request, pk):
        library = _get_current_library(request)
        branch = Branch.objects.filter(pk=pk, library=library).first()
        if not branch:
            raise PlatformAPIException('Branch not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        from apps.libraries.models import BranchAttendanceRule
        rule, _ = BranchAttendanceRule.objects.get_or_create(branch=branch)
        return Response({
            'late_after_minutes': rule.late_after_minutes,
            'auto_checkout_time': str(rule.auto_checkout_time) if rule.auto_checkout_time else None,
            'absent_alert_days': rule.absent_alert_days,
            'min_daily_minutes': rule.min_daily_minutes,
        })

    def put(self, request, pk):
        library = _get_current_library(request)
        branch = Branch.objects.filter(pk=pk, library=library).first()
        if not branch:
            raise PlatformAPIException('Branch not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        from apps.libraries.models import BranchAttendanceRule
        rule, _ = BranchAttendanceRule.objects.get_or_create(branch=branch)
        data = request.data
        if 'late_after_minutes' in data:
            rule.late_after_minutes = int(data['late_after_minutes'])
        if 'auto_checkout_time' in data:
            rule.auto_checkout_time = data['auto_checkout_time']
        if 'absent_alert_days' in data:
            rule.absent_alert_days = int(data['absent_alert_days'])
        if 'min_daily_minutes' in data:
            rule.min_daily_minutes = int(data['min_daily_minutes'])
        rule.save()

        return self.get(request, pk)


class LibraryBranchPauseResumeView(APIView):
    """POST /library/branches/{id}/pause, POST /library/branches/{id}/resume"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        branch = Branch.objects.filter(pk=pk, library=library).first()
        if not branch:
            raise PlatformAPIException('Branch not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        action = 'resume' if request.path.endswith('/resume') else 'pause'
        branch.is_active = (action == 'resume')
        branch.save(update_fields=['is_active'])

        return Response({
            'id': str(branch.id),
            'name': branch.name,
            'is_active': branch.is_active,
            'status': 'active' if branch.is_active else 'paused',
        })


class LibraryTransferOwnershipView(APIView):
    """POST /library/team/transfer-ownership"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request):
        library = _get_current_library(request)
        if request.user != library.owner and getattr(request.user, 'role', '') != 'LIBRARY_OWNER':
            raise PlatformAPIException('Only the library owner can transfer ownership.', code='permission_denied', status_code=status.HTTP_403_FORBIDDEN)

        to_member_id = request.data.get('to_member_id')
        password = request.data.get('password')
        if not password or not request.user.check_password(password):
            raise PlatformAPIException('Invalid owner password.', code='invalid_credentials', status_code=status.HTTP_401_UNAUTHORIZED)

        new_owner = User.objects.filter(id=to_member_id, library=library).first()
        if not new_owner:
            raise PlatformAPIException('Target member not found in this library.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        old_owner = library.owner
        old_owner.role = 'STAFF'
        old_owner.save(update_fields=['role'])

        new_owner.role = 'LIBRARY_OWNER'
        new_owner.is_staff = True
        new_owner.save(update_fields=['role', 'is_staff'])

        library.owner = new_owner
        library.save(update_fields=['owner'])

        ActivityLog.objects.create(
            library=library,
            user=request.user,
            action='OWNERSHIP_TRANSFERRED',
            entity_type='Library',
            entity_id=str(library.id),
            details={'from_user': str(old_owner.id), 'to_user': str(new_owner.id), 'is_risky': True},
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryTeamTemplatesView(APIView):
    """GET /library/team/templates, POST /library/team/templates"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        from apps.libraries.models import PermissionTemplate
        from django.db.models import Q
        templates = PermissionTemplate.objects.filter(
            Q(is_builtin=True) | Q(library=library)
        )
        builtin_defaults = [
            {'id': 'template-manager', 'name': 'Manager', 'description': 'Full operational access except financial settings', 'is_builtin': True, 'grants': [{'module': 'students', 'level': 'Full Access'}, {'module': 'attendance', 'level': 'Full Access'}, {'module': 'seats', 'level': 'Full Access'}]},
            {'id': 'template-frontdesk', 'name': 'Front Desk', 'description': 'Student check-in, attendance and seat assignment', 'is_builtin': True, 'grants': [{'module': 'students', 'level': 'View Only'}, {'module': 'attendance', 'level': 'Full Access'}, {'module': 'seats', 'level': 'View Only'}]},
            {'id': 'template-accountant', 'name': 'Accountant', 'description': 'Fee collections, dues, and day-book tracking', 'is_builtin': True, 'grants': [{'module': 'fees_plans', 'level': 'Full Access'}, {'module': 'students', 'level': 'View Only'}]},
        ]
        results = [
            {
                'id': str(t.id),
                'name': t.name,
                'description': t.description,
                'is_builtin': t.is_builtin,
                'grants': t.grants,
            }
            for t in templates
        ]
        if not results:
            results = builtin_defaults
        return Response(results)

    def post(self, request):
        library = _get_current_library(request)
        from apps.libraries.models import PermissionTemplate
        name = request.data.get('name')
        if not name:
            raise PlatformAPIException('Template name is required.', code='validation_error')

        template = PermissionTemplate.objects.create(
            library=library,
            name=name,
            description=request.data.get('description', ''),
            is_builtin=False,
            grants=request.data.get('grants', []),
        )
        return Response({
            'id': str(template.id),
            'name': template.name,
            'description': template.description,
            'is_builtin': template.is_builtin,
            'grants': template.grants,
        }, status=status.HTTP_201_CREATED)
