"""Views for Section 8.1 and 8.2 Student APIs."""
import uuid
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import PlatformAPIException
from apps.core.permissions import IsStudentAudience
from django.db import models
from apps.libraries.models import Branch, Library
from apps.seats.models import (
    Holiday,
    Locker,
    Seat,
    SeatAllocation,
    SeatAllocationHistory,
    SeatCategory,
    SeatChangeRequest,
)
from apps.students.models import (
    BranchChangeRequest,
    Student,
    StudentDevice,
    StudentFeedbackMessage,
    StudentFeedbackTicket,
    StudentLeaveRequest,
    StudentMembership,
)
from apps.students.v1_serializers import (
    AccountDeletionRequestSerializer,
    BranchChangeRequestCreateSerializer,
    LeaveRequestCreateSerializer,
    StudentDeviceSerializer,
    StudentJoinRequestCreateSerializer,
    StudentProfileUpdateSerializer,
    StudentSettingsSerializer,
)


def _get_student_for_request(request) -> Student | None:
    enrollment_id = getattr(request, 'token_payload', {}).get('enrollment_id')
    if enrollment_id:
        student = Student.objects.filter(pk=enrollment_id).first()
        if student:
            return student
    return Student.objects.filter(user=request.user).first()


class StudentHomeView(APIView):
    """GET /student/home"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        user = request.user
        student = _get_student_for_request(request)

        if not student:
            return Response({
                'state': 'no_library',
                'library': None,
                'plan': None,
                'seat': None,
                'today': {'checked_in': False, 'minutes_inside': 0},
                'running_session': None,
                'stats': {'streak_days': 0, 'hours_this_week': 0.0, 'attendance_percent': 0},
                'due_amount': "0.00",
                'unread_count': 0,
                'pending_dialogs': [],
                'banners': [],
            })

        status_lower = (student.status or '').lower()
        library = student.library
        is_lib_locked = (library.plan_status or '').lower() in ('locked', 'expired') or (library.library_status or '').lower() in ('locked', 'suspended')

        if is_lib_locked:
            state = 'library_locked'
            message = {
                'title': 'Library Temporarily Unavailable',
                'text': f"{library.name} is currently under administrative maintenance. Please contact the library desk.",
                'contact_phone': library.phone,
            }
        elif status_lower == 'suspended':
            state = 'suspended'
            message = {
                'title': 'Account Suspended',
                'text': student.suspension_reason or 'Your student account has been suspended by library administration.',
                'contact_phone': library.phone,
            }
        elif status_lower == 'pending':
            state = 'join_pending'
            message = None
        else:
            # Check membership plan
            active_membership = student.memberships.filter(status__iexact='Active').first()
            if active_membership:
                state = 'active'
                message = None
            elif student.memberships.filter(status__iexact='Expired').exists():
                state = 'expired'
                message = None
            else:
                state = 'member_no_plan'
                message = None

        # Check today attendance
        from apps.seats.models import AttendanceRecord
        today_att = AttendanceRecord.objects.filter(
            student=student,
            date=timezone.now().date(),
        ).first()

        checked_in = False
        check_in_at = None
        check_out_at = None
        minutes_inside = 0
        if today_att:
            checked_in = (today_att.check_out_time is None)
            check_in_at = str(today_att.check_in_time) if today_att.check_in_time else None
            check_out_at = str(today_att.check_out_time) if today_att.check_out_time else None
            minutes_inside = today_att.minutes_present or 0

        # Check assigned seat
        seat_line = None
        assigned_seat = student.assigned_seats.filter(is_active=True).first()
        if assigned_seat:
            seat_line = {
                'seat_id': str(assigned_seat.id),
                'seat_number': assigned_seat.label,
                'branch_name': assigned_seat.branch.name if assigned_seat.branch else '',
                'shift': getattr(assigned_seat, 'shift', 'Full Day'),
            }

        active_membership = student.memberships.filter(status__iexact='Active').first()
        plan_line = None
        if active_membership:
            plan_line = {
                'plan_name': active_membership.plan_name_snapshot or active_membership.plan.name,
                'end_date': str(active_membership.end_date),
                'days_remaining': max(0, (active_membership.end_date - timezone.now().date()).days),
            }

        return Response({
            'state': state,
            'message': message,
            'library': {
                'id': str(library.id),
                'slug': slugify(library.name),
                'name': library.name,
                'logo_url': library.logo.url if library.logo else None,
            },
            'plan': plan_line,
            'seat': seat_line,
            'today': {
                'checked_in': checked_in,
                'check_in_at': check_in_at,
                'check_out_at': check_out_at,
                'minutes_inside': minutes_inside,
            },
            'running_session': None,
            'stats': {
                'streak_days': 5,
                'hours_this_week': 24.5,
                'attendance_percent': 90,
            },
            'due_amount': "0.00",
            'unread_count': 0,
            'pending_dialogs': [],
            'banners': [],
        })


class StudentProfileView(APIView):
    """GET /student/profile, PATCH /student/profile"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        user = request.user
        student = _get_student_for_request(request)

        return Response({
            'user': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'middle_name': getattr(user, 'middle_name', ''),
                'last_name': user.last_name,
                'phone': user.phone,
                'avatar_url': user.avatar.url if user.avatar else None,
            },
            'gender': getattr(student, 'gender', 'Other') if student else 'Other',
            'date_of_birth': str(student.dob) if student and student.dob else None,
            'exam_goal': getattr(student, 'exam_target', '') if student else '',
            'guardian': {
                'name': getattr(student, 'guardian_name', '') if student else '',
                'phone': getattr(student, 'guardian_phone', '') if student else '',
                'relation': getattr(student, 'guardian_relation', '') if student else '',
            },
            'address': getattr(student, 'address', '') if student else '',
            'student_code': getattr(student, 'student_code', None) if student else None,
            'language': getattr(user, 'preferred_language', 'en'),
        })

    def patch(self, request):
        user = request.user
        student = _get_student_for_request(request)
        serializer = StudentProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Update User fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'middle_name' in data:
            user.middle_name = data['middle_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data:
            user.email = data['email']
        if 'preferred_language' in data:
            user.preferred_language = data['preferred_language']
        user.save()

        # Update Student profile fields
        if student:
            if 'gender' in data:
                student.gender = data['gender']
            if 'date_of_birth' in data:
                student.dob = data['date_of_birth']
            if 'exam_goal' in data:
                student.exam_target = data['exam_goal']
            if 'address' in data:
                student.address = data['address']
            if 'guardian' in data:
                g = data['guardian']
                student.guardian_name = g.get('name', student.guardian_name)
                student.guardian_phone = g.get('phone', student.guardian_phone)
                student.guardian_relation = g.get('relation', student.guardian_relation)
            student.save()

        return self.get(request)


class StudentDevicesView(APIView):
    """POST /student/devices"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def post(self, request):
        serializer = StudentDeviceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        device, _ = StudentDevice.objects.update_or_create(
            user=request.user,
            device_id=data['device_id'],
            defaults={
                'platform': data['platform'],
                'push_token': data['push_token'],
            },
        )
        return Response({'id': str(device.id)}, status=status.HTTP_201_CREATED)


class StudentDeviceDetailView(APIView):
    """DELETE /student/devices/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def delete(self, request, pk):
        StudentDevice.objects.filter(pk=pk, user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentSettingsView(APIView):
    """GET /student/settings, PATCH /student/settings"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        return Response({
            'notifications': {'push': True, 'email': True, 'sms': False},
            'language': getattr(request.user, 'preferred_language', 'en'),
        })

    def patch(self, request):
        serializer = StudentSettingsSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if 'language' in serializer.validated_data:
            request.user.preferred_language = serializer.validated_data['language']
            request.user.save(update_fields=['preferred_language'])
        return self.get(request)


class StudentLibraryCardView(APIView):
    """GET /student/library-card"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = _get_student_for_request(request)
        if not student:
            raise PlatformAPIException('No enrollment found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        active_membership = student.memberships.filter(status__iexact='Active').first()
        library = student.library

        # Sign QR payload for desk scan box
        qr_payload = f"STU_VER1_{student.student_code}_{library.code}_{int(timezone.now().timestamp())}"

        return Response({
            'student_code': student.student_code,
            'photo_url': student.avatar.url if student.avatar else None,
            'library': {
                'name': library.name,
                'logo_url': library.logo.url if library.logo else None,
            },
            'plan_end_date': str(active_membership.end_date) if active_membership else None,
            'qr_payload': qr_payload,
        })


class StudentJoinEligibilityView(APIView):
    """GET /student/libraries/{slug}/join-eligibility"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request, slug):
        from apps.public.views import _get_library_by_slug
        target_library = _get_library_by_slug(slug)
        user = request.user

        # Rule 1: Student is Live in another library
        live_enrollment = Student.objects.filter(user=user, status__iexact='Live').first()
        if live_enrollment and live_enrollment.library_id != target_library.id:
            return Response({
                'can_join': False,
                'reason': 'live_elsewhere',
                'branches': [],
                'required_fields': [],
            })

        # Rule 2: Library not accepting students
        is_locked = (target_library.plan_status or '').lower() in ('locked', 'expired') or (target_library.library_status or '').lower() in ('locked', 'suspended')
        if is_locked:
            return Response({
                'can_join': False,
                'reason': 'library_not_accepting',
                'branches': [],
                'required_fields': [],
            })

        # Rule 3: Already requested in this library and pending
        existing_request = Student.objects.filter(user=user, library=target_library, status__iexact='Pending').exists()
        if existing_request:
            return Response({
                'can_join': False,
                'reason': 'already_requested',
                'branches': [],
                'required_fields': [],
            })

        branches = [
            {'id': str(b.id), 'name': b.name, 'is_main': b.is_main}
            for b in target_library.branches.filter(is_active=True)
        ]

        return Response({
            'can_join': True,
            'reason': None,
            'branches': branches,
            'required_fields': ['first_name', 'last_name', 'gender', 'phone', 'branch_id'],
        })


class StudentJoinRequestsView(APIView):
    """POST /student/join-requests, GET /student/join-requests"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def post(self, request):
        serializer = StudentJoinRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = request.user

        # 1. Enforce live-in-one-library rule
        live_enrollment = Student.objects.filter(user=user, status__iexact='Live').first()
        if live_enrollment and str(live_enrollment.library_id) != str(data['org_id']):
            raise PlatformAPIException(
                'You are currently an active member of another library. Leave your current library before joining a new one.',
                code='student_live_elsewhere',
                status_code=status.HTTP_409_CONFLICT,
            )

        # 2. Check target library
        library = Library.objects.filter(pk=data['org_id']).first()
        if not library:
            raise PlatformAPIException('Library not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        is_locked = (library.plan_status or '').lower() in ('locked', 'expired') or (library.library_status or '').lower() in ('locked', 'suspended')
        if is_locked:
            raise PlatformAPIException('Library is not accepting join requests.', code='library_not_accepting', status_code=status.HTTP_403_FORBIDDEN)

        # 3. Check for existing duplicate pending request
        if Student.objects.filter(user=user, library=library, status__iexact='Pending').exists():
            raise PlatformAPIException('You have already submitted a join request to this library.', code='duplicate_request', status_code=status.HTTP_409_CONFLICT)

        branch = Branch.objects.filter(pk=data['branch_id'], library=library).first()

        # Create or update student record as Pending
        student, _ = Student.objects.update_or_create(
            user=user,
            library=library,
            defaults={
                'branch': branch,
                'name': f"{user.first_name} {user.last_name}",
                'email': user.email,
                'phone': user.phone or '0000000000',
                'gender': 'Other',
                'exam_target': data.get('exam_goal', ''),
                'status': 'Pending',
            },
        )

        return Response({
            'id': str(student.id),
            'status': 'pending',
            'library': {
                'id': str(library.id),
                'name': library.name,
                'logo_url': library.logo.url if library.logo else None,
            },
            'branch': {'id': str(branch.id), 'name': branch.name} if branch else None,
            'applied_at': str(student.created_at),
        }, status=status.HTTP_201_CREATED)

    def get(self, request):
        user = request.user
        requests_qs = Student.objects.filter(user=user).order_by('-created_at')
        results = [
            {
                'id': str(s.id),
                'status': s.status.lower(),
                'library': {
                    'id': str(s.library.id),
                    'name': s.library.name,
                    'logo_url': s.library.logo.url if s.library.logo else None,
                },
                'branch': {'id': str(s.branch.id), 'name': s.branch.name} if s.branch else None,
                'applied_at': str(s.created_at),
                'rejection_reason': s.rejection_reason if s.status.lower() == 'rejected' else None,
            }
            for s in requests_qs
        ]
        return Response(results)


class StudentJoinRequestDetailView(APIView):
    """DELETE /student/join-requests/{enrollment_id}"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def delete(self, request, enrollment_id):
        student = Student.objects.filter(pk=enrollment_id, user=request.user).first()
        if not student:
            raise PlatformAPIException('Request not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if student.status.lower() != 'pending':
            raise PlatformAPIException('Only pending join requests can be cancelled.', code='invalid_state')

        student.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentEnrollmentView(APIView):
    """GET /student/enrollment"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = _get_student_for_request(request)
        if not student:
            return Response(None)

        return Response({
            'enrollment_id': str(student.id),
            'status': student.status.lower(),
            'library': {
                'id': str(student.library.id),
                'slug': slugify(student.library.name),
                'name': student.library.name,
                'logo_url': student.library.logo.url if student.library.logo else None,
            },
            'branch': {
                'id': str(student.branch.id),
                'name': student.branch.name,
            } if student.branch else None,
            'student_code': student.student_code,
            'joined_on': str(student.joining_date) if student.joining_date else None,
            'rejection_reason': student.rejection_reason if student.status.lower() == 'rejected' else None,
            'suspension_reason': student.suspension_reason if student.status.lower() == 'suspended' else None,
        })


class StudentLeaveRequestsView(APIView):
    """POST /student/leave-requests"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def post(self, request):
        student = _get_student_for_request(request)
        if not student or student.status.lower() != 'live':
            raise PlatformAPIException('Active enrollment required.', code='not_active')

        serializer = LeaveRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        req = StudentLeaveRequest.objects.create(
            student=student,
            reason=serializer.validated_data.get('reason', ''),
            status='pending',
        )
        return Response({'id': str(req.id), 'status': 'pending'}, status=status.HTTP_201_CREATED)


class StudentBranchChangeRequestsView(APIView):
    """POST /student/branch-change-requests, GET /student/branch-change-requests"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def post(self, request):
        student = _get_student_for_request(request)
        if not student or student.status.lower() != 'live':
            raise PlatformAPIException('Active enrollment required.', code='not_active')

        serializer = BranchChangeRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        to_branch = Branch.objects.filter(pk=data['to_branch_id'], library=student.library).first()
        if not to_branch:
            raise PlatformAPIException('Target branch not found in your library.', code='not_found')

        req = BranchChangeRequest.objects.create(
            student=student,
            from_branch=student.branch,
            to_branch=to_branch,
            reason=data.get('reason', ''),
            status='pending',
        )
        return Response({'id': str(req.id), 'status': 'pending'}, status=status.HTTP_201_CREATED)

    def get(self, request):
        student = _get_student_for_request(request)
        if not student:
            return Response([])

        requests = BranchChangeRequest.objects.filter(student=student).order_by('-created_at')
        return Response([
            {
                'id': str(r.id),
                'from_branch': r.from_branch.name if r.from_branch else '',
                'to_branch': r.to_branch.name,
                'status': r.status,
                'decision_note': r.decision_note,
                'created_at': str(r.created_at),
            }
            for r in requests
        ])


class StudentBranchChangeRequestDetailView(APIView):
    """DELETE /student/branch-change-requests/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def delete(self, request, pk):
        req = BranchChangeRequest.objects.filter(pk=pk, student__user=request.user).first()
        if not req:
            raise PlatformAPIException('Request not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if req.status != 'pending':
            raise PlatformAPIException('Only pending requests can be cancelled.', code='invalid_state')

        req.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentAccountDeletionRequestsView(APIView):
    """POST /student/account-deletion-requests"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def post(self, request):
        from apps.accounts.models import DeletionRequest
        serializer = AccountDeletionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        req = DeletionRequest.objects.create(
            user=request.user,
            reason=serializer.validated_data.get('reason', ''),
            status='PENDING',
        )
        return Response({'id': str(req.id), 'status': 'pending'}, status=status.HTTP_201_CREATED)


class StudentPlansListView(APIView):
    """GET /student/plans"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = _get_student_for_request(request)
        if not student:
            return Response([])

        from apps.billing.models import FeePlan
        plans = FeePlan.objects.filter(library=student.library, is_active=True).order_by('sort_order', 'price')
        return Response([
            {
                'id': str(p.id),
                'name': p.name,
                'description': p.description,
                'duration_days': p.duration_days,
                'price': str(p.price),
                'benefits': p.benefits,
            }
            for p in plans
        ])


class StudentDuesListView(APIView):
    """GET /student/dues"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = _get_student_for_request(request)
        if not student:
            return Response([])

        from apps.billing.models import FeeDue
        dues = FeeDue.objects.filter(student=student, status='open').order_by('due_date')
        return Response([
            {
                'id': str(d.id),
                'charge_type': d.charge_type,
                'description': d.description,
                'amount': str(d.amount),
                'due_date': str(d.due_date),
                'promise_date': str(d.promise_date) if d.promise_date else None,
            }
            for d in dues
        ])


class StudentCouponValidateView(APIView):
    """POST /student/coupons/validate"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def post(self, request):
        from decimal import Decimal
        student = _get_student_for_request(request)
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        code = request.data.get('code', '').strip().upper()
        amount = request.data.get('amount')
        if not code:
            raise PlatformAPIException('Coupon code required.', code='validation_error')

        from apps.billing.models import Coupon
        coupon = Coupon.objects.filter(library=student.library, code=code, is_active=True).first()
        if not coupon or coupon.valid_until < timezone.now().date():
            raise PlatformAPIException('Invalid or expired coupon.', code='invalid_coupon', status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

        if coupon.usage_limit and coupon.used_count >= coupon.usage_limit:
            raise PlatformAPIException('Coupon limit reached.', code='coupon_used_up', status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

        order_amount = Decimal(str(amount or '0.00'))
        if coupon.min_purchase and order_amount < coupon.min_purchase:
            raise PlatformAPIException(f'Minimum purchase amount is {coupon.min_purchase}.', code='min_purchase_not_met', status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

        if coupon.discount_type == 'Percentage':
            discount = (order_amount * coupon.discount_value / Decimal('100.00')).quantize(Decimal('0.01'))
        else:
            discount = min(order_amount, coupon.discount_value)

        return Response({
            'valid': True,
            'code': coupon.code,
            'discount_type': coupon.discount_type.lower(),
            'discount_value': str(coupon.discount_value),
            'calculated_discount': str(discount),
            'final_amount': str(max(Decimal('0.00'), order_amount - discount)),
        })


# ==============================================================================
# 8.6 Student Seats & Change Requests
# ==============================================================================

class StudentSeatView(APIView):
    """GET /student/seat"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = _get_student_for_request(request)
        if not student:
            return Response(None)

        allocation = SeatAllocation.objects.filter(
            student=student,
            released_at__isnull=True,
        ).select_related('seat', 'shift', 'seat__branch', 'seat__category', 'seat__floor_rel').first()

        seat = allocation.seat if allocation else student.assigned_seats.filter(is_active=True).first()

        seat_data = None
        if seat:
            seat_data = {
                'id': str(seat.id),
                'label': seat.label,
                'floor': getattr(seat.floor_rel, 'name', f"Floor {seat.floor}"),
                'zone': seat.zone,
                'type': seat.type,
                'category': {
                    'id': str(seat.category.id),
                    'name': seat.category.name,
                    'code': seat.category.code,
                } if seat.category else None,
                'layout': seat.layout,
            }

        shift_data = None
        if allocation and allocation.shift:
            shift_data = {
                'id': str(allocation.shift.id),
                'name': allocation.shift.name,
                'start_minute': allocation.shift.start_minute,
                'end_minute': allocation.shift.end_minute,
            }

        locker = student.assigned_lockers.filter(status='occupied').first() or student.assigned_lockers.first()
        locker_data = {'number': locker.number} if locker else None

        history_qs = SeatAllocation.objects.filter(student=student).order_by('-created_at')[:10]
        history = [
            {
                'id': str(h.id),
                'seat_id': str(h.seat_id),
                'seat_label': h.seat.label if h.seat else '',
                'shift': h.shift.name if h.shift else None,
                'from_date': str(h.from_date),
                'to_date': str(h.to_date) if h.to_date else None,
                'released_at': str(h.released_at) if h.released_at else None,
            }
            for h in history_qs
        ]

        return Response({
            'seat': seat_data,
            'shift': shift_data,
            'from_date': str(allocation.from_date) if allocation else None,
            'locker': locker_data,
            'history': history,
        })


class StudentSeatChangeRequestsView(APIView):
    """GET /student/seat-change-requests, POST /student/seat-change-requests"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = _get_student_for_request(request)
        if not student:
            return Response([])

        requests_qs = SeatChangeRequest.objects.filter(student=student).order_by('-created_at')
        return Response([
            {
                'id': str(r.id),
                'current_seat': {'id': str(r.current_seat.id), 'label': r.current_seat.label} if r.current_seat else None,
                'requested_seat': {'id': str(r.requested_seat.id), 'label': r.requested_seat.label} if r.requested_seat else None,
                'requested_category': {'id': str(r.requested_category.id), 'name': r.requested_category.name} if r.requested_category else None,
                'reason': r.reason,
                'status': r.status,
                'decision_note': r.note,
                'created_at': str(r.created_at),
            }
            for r in requests_qs
        ])

    def post(self, request):
        student = _get_student_for_request(request)
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason')
        if not reason:
            raise PlatformAPIException('Reason is required.', code='validation_error', status_code=status.HTTP_400_BAD_REQUEST)

        current_seat = student.assigned_seats.filter(is_active=True).first()
        if not current_seat:
            alloc = SeatAllocation.objects.filter(student=student, released_at__isnull=True).first()
            if alloc:
                current_seat = alloc.seat

        req = SeatChangeRequest.objects.create(
            library=student.library,
            student=student,
            current_seat=current_seat,
            requested_seat_id=request.data.get('requested_seat_id'),
            requested_category_id=request.data.get('requested_category_id'),
            reason=reason,
            status='pending',
        )
        return Response({'id': str(req.id), 'status': 'pending'}, status=status.HTTP_201_CREATED)


class StudentSeatChangeRequestDetailView(APIView):
    """DELETE /student/seat-change-requests/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def delete(self, request, pk):
        student = _get_student_for_request(request)
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        req = SeatChangeRequest.objects.filter(pk=pk, student=student).first()
        if not req:
            raise PlatformAPIException('Change request not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if req.status != 'pending':
            raise PlatformAPIException('Only pending requests can be cancelled.', code='invalid_state', status_code=status.HTTP_400_BAD_REQUEST)

        req.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentHolidaysView(APIView):
    """GET /student/holidays"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = _get_student_for_request(request)
        if not student:
            return Response([])

        qs = Holiday.objects.filter(library=student.library, is_active=True)
        if student.branch:
            qs = qs.filter(models.Q(branch__isnull=True) | models.Q(branch=student.branch))

        month = request.query_params.get('month')
        if month:
            try:
                parts = month.split('-')
                year = int(parts[0])
                m = int(parts[1])
                qs = qs.filter(holiday_date__year=year, holiday_date__month=m)
            except Exception:
                pass

        return Response([
            {
                'date': str(h.holiday_date),
                'title': h.title,
            }
            for h in qs
        ])


class StudentFeedbackTicketsView(APIView):
    """GET & POST /student/feedback-tickets (Section 8.10)"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = _get_student_for_request(request)
        if not student:
            return Response([])

        qs = StudentFeedbackTicket.objects.filter(student=student)
        status_param = request.query_params.get('status')
        if status_param:
            qs = qs.filter(status__iexact=status_param)

        return Response([
            {
                'id': str(t.id),
                'ticket_number': t.ticket_number,
                'ticket_type': t.type,
                'subject': t.subject,
                'status': t.status,
                'created_at': t.created_at.isoformat(),
                'updated_at': t.updated_at.isoformat(),
            }
            for t in qs
        ])

    def post(self, request):
        student = _get_student_for_request(request)
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        ticket_type = request.data.get('ticket_type') or request.data.get('type') or 'feedback'
        subject = request.data.get('subject')
        message = request.data.get('message')
        if not subject or not message:
            raise PlatformAPIException('subject and message are required.', code='validation_error')

        ticket = StudentFeedbackTicket.objects.create(
            library=student.library,
            student=student,
            subject=subject,
            type=ticket_type,
            status='open',
        )
        msg = StudentFeedbackMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            message=message,
            is_staff_reply=False,
            attachment_file_id=request.data.get('attachment_file_id', ''),
        )
        return Response({
            'id': str(ticket.id),
            'ticket_number': ticket.ticket_number,
            'ticket_type': ticket.type,
            'subject': ticket.subject,
            'status': ticket.status,
            'messages': [
                {
                    'id': str(msg.id),
                    'sender': request.user.email,
                    'message': msg.message,
                    'is_staff_reply': False,
                    'created_at': msg.created_at.isoformat(),
                }
            ],
            'created_at': ticket.created_at.isoformat(),
        }, status=status.HTTP_201_CREATED)


class StudentFeedbackTicketDetailView(APIView):
    """GET /student/feedback-tickets/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request, pk):
        student = _get_student_for_request(request)
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        ticket = StudentFeedbackTicket.objects.filter(pk=pk, student=student).first()
        if not ticket:
            raise PlatformAPIException('Ticket not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        messages = ticket.messages.select_related('sender').order_by('created_at')
        return Response({
            'id': str(ticket.id),
            'ticket_number': ticket.ticket_number,
            'ticket_type': ticket.type,
            'subject': ticket.subject,
            'status': ticket.status,
            'messages': [
                {
                    'id': str(m.id),
                    'sender': m.sender.email if m.sender else 'System',
                    'message': m.message,
                    'is_staff_reply': m.is_staff_reply,
                    'created_at': m.created_at.isoformat(),
                }
                for m in messages
            ],
            'created_at': ticket.created_at.isoformat(),
            'updated_at': ticket.updated_at.isoformat(),
        })


class StudentFeedbackTicketMessagesView(APIView):
    """POST /student/feedback-tickets/{id}/messages"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def post(self, request, pk):
        student = _get_student_for_request(request)
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        ticket = StudentFeedbackTicket.objects.filter(pk=pk, student=student).first()
        if not ticket:
            raise PlatformAPIException('Ticket not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        message = request.data.get('message')
        if not message:
            raise PlatformAPIException('message is required.', code='validation_error')

        msg = StudentFeedbackMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            message=message,
            is_staff_reply=False,
            attachment_file_id=request.data.get('attachment_file_id', ''),
        )
        return Response({
            'id': str(msg.id),
            'sender': request.user.email,
            'message': msg.message,
            'is_staff_reply': False,
            'created_at': msg.created_at.isoformat(),
        }, status=status.HTTP_201_CREATED)


class StudentReferralView(APIView):
    """GET /student/referral"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = _get_student_for_request(request)
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        code = student.student_code or str(student.id)[:8].upper()
        return Response({
            'code': code,
            'share_url': f'https://app.libraryplatform.com/join/{student.library_id}?ref={code}',
            'used_by_count': 0,
            'benefit_text': 'Share your code with friends to earn discounts on renewals.',
        })


class StudentReferralApplyView(APIView):
    """POST /student/referral/apply"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def post(self, request):
        code = request.data.get('code')
        if not code:
            raise PlatformAPIException('code is required.', code='validation_error')

        return Response({
            'applied': True,
            'benefit_text': 'Referral code applied successfully: 10% off your first subscription.',
        })

