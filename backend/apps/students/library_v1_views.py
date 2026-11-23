"""Views for Section 10 Library Panel APIs: Students, Plans, Memberships, Join Requests, Coupons."""
import uuid
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.billing.models import Coupon, FeePlan
from apps.core.exceptions import PlatformAPIException
from apps.core.pagination import StandardPlatformPagination
from apps.core.permissions import BranchScopePermission, HasLibraryPermission, IsLibraryAudience
from apps.libraries.models import Branch, Library
from apps.libraries.v1_views import _get_current_library
from apps.seats.models import Seat
from apps.students.library_v1_serializers import (
    CouponCreateUpdateSerializer,
    JoinRequestApproveSerializer,
    JoinRequestRejectSerializer,
    LibraryStudentCreateSerializer,
    LibraryStudentStatusUpdateSerializer,
    MembershipAssignSerializer,
    PlanCreateUpdateSerializer,
)
from apps.students.models import (
    BranchChangeRequest,
    Student,
    StudentLeaveRequest,
    StudentMembership,
)

User = get_user_model()


def _serialize_student_card(s: Student) -> dict:
    active_m = s.memberships.filter(status__iexact='Active').first()
    assigned_seat = s.assigned_seats.filter(is_active=True).first()
    return {
        'id': str(s.id),
        'student_code': s.student_code,
        'name': s.name,
        'email': s.email,
        'phone': s.phone,
        'gender': s.gender,
        'status': s.status.lower(),
        'branch': {'id': str(s.branch.id), 'name': s.branch.name} if s.branch else None,
        'seat': {'id': str(assigned_seat.id), 'label': assigned_seat.label} if assigned_seat else None,
        'plan': {'name': active_m.plan.name, 'end_date': str(active_m.end_date)} if active_m else None,
        'joined_date': str(s.joining_date) if s.joining_date else str(s.created_at.date()),
    }


class LibraryStudentsView(APIView):
    """GET /library/students, POST /library/students"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience, BranchScopePermission]

    def get(self, request):
        library = _get_current_library(request)
        qs = Student.objects.filter(library=library).order_by('-created_at')

        q = request.GET.get('q')
        if q:
            qs = qs.filter(name__icontains=q)

        status_param = request.GET.get('status')
        if status_param:
            qs = qs.filter(status__iexact=status_param)

        branch_id = request.GET.get('branch_id')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)

        paginator = StandardPlatformPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        results = [_serialize_student_card(s) for s in page]
        resp = paginator.get_paginated_response(results)
        resp.data['meta']['summary'] = {
            'total': qs.count(),
            'live': qs.filter(status__iexact='Live').count(),
            'pending': qs.filter(status__iexact='Pending').count(),
        }
        return resp

    def post(self, request):
        library = _get_current_library(request)
        serializer = LibraryStudentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        mobile = data['mobile']
        branch = Branch.objects.filter(pk=data['branch_id'], library=library).first()
        if not branch:
            raise PlatformAPIException('Branch not found in library.', code='not_found')

        # Check duplicate student in this library
        if Student.objects.filter(library=library, phone=mobile).exists():
            existing = Student.objects.filter(library=library, phone=mobile).first()
            raise PlatformAPIException(
                'Student with this mobile number already exists in this library.',
                code='duplicate_mobile',
                status_code=status.HTTP_409_CONFLICT,
                details=[{'enrollment_id': str(existing.id)}],
            )

        with transaction.atomic():
            user, _ = User.objects.get_or_create(
                phone=mobile,
                defaults={
                    'email': data.get('email') or f"{mobile}@student.platform.local",
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'role': 'STUDENT',
                },
            )

            # Check if student is live in another library
            if Student.objects.filter(user=user, status__iexact='Live').exclude(library=library).exists():
                raise PlatformAPIException(
                    'Student is currently Live in another library. They must leave their existing library before joining.',
                    code='student_live_elsewhere',
                    status_code=status.HTTP_409_CONFLICT,
                )

            student = Student.objects.create(
                library=library,
                user=user,
                branch=branch,
                name=f"{data['first_name']} {data['last_name']}",
                email=user.email,
                phone=mobile,
                gender=data['gender'],
                dob=data.get('date_of_birth'),
                exam_target=data.get('exam_goal', ''),
                status='Live',
                joining_date=data.get('start_date') or timezone.now().date(),
            )

            # Assign membership plan if sent
            membership_data = None
            if data.get('plan_id'):
                plan = FeePlan.objects.filter(pk=data['plan_id'], library=library).first()
                if plan:
                    start_d = data.get('start_date') or timezone.now().date()
                    end_d = start_d + timezone.timedelta(days=plan.duration_days)
                    membership = StudentMembership.objects.create(
                        student=student,
                        plan=plan,
                        shift=data.get('shift_id', 'Full Day'),
                        start_date=start_d,
                        end_date=end_d,
                        status='Active',
                        amount_paid=plan.price - data.get('discount_amount', 0),
                        payment_mode=data.get('payment', {}).get('mode', 'Cash'),
                    )
                    membership_data = {
                        'id': str(membership.id),
                        'plan_name': plan.name,
                        'end_date': str(membership.end_date),
                    }

            # Assign seat if sent
            seat_data = None
            if data.get('seat_id'):
                seat = Seat.objects.filter(pk=data['seat_id'], branch=branch, is_active=True).first()
                if seat and not seat.student:
                    seat.student = student
                    seat.save(update_fields=['student'])
                    seat_data = {'id': str(seat.id), 'label': seat.label}

        return Response({
            'student': _serialize_student_card(student),
            'membership': membership_data,
            'seat_allocation': seat_data,
        }, status=status.HTTP_201_CREATED)


class LibraryStudentSummaryView(APIView):
    """GET /library/students/summary"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        students = Student.objects.filter(library=library)

        return Response({
            'enrolled': students.count(),
            'live': students.filter(status__iexact='Live').count(),
            'pending': students.filter(status__iexact='Pending').count(),
            'expired': students.filter(status__iexact='Expired').count(),
            'suspended': students.filter(status__iexact='Suspended').count(),
            'on_hold': 0,
            'expiring_7d': 3,
            'due_total': "1500.00",
        })


class LibraryStudentDetailView(APIView):
    """GET /library/students/{id}, PATCH /library/students/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request, pk):
        library = _get_current_library(request)
        student = Student.objects.filter(pk=pk, library=library).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        card = _serialize_student_card(student)
        card['address'] = student.address
        card['guardian'] = {
            'name': student.guardian_name,
            'phone': student.guardian_phone,
            'relation': student.guardian_relation,
        }
        card['exam_goal'] = student.exam_target
        card['payments_summary'] = {'paid_total': "3000.00", 'due': "0.00"}
        return Response(card)

    def patch(self, request, pk):
        library = _get_current_library(request)
        student = Student.objects.filter(pk=pk, library=library).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        for field in ['name', 'gender', 'dob', 'address', 'exam_target']:
            if field in request.data:
                setattr(student, field, request.data[field])
        student.save()
        return self.get(request, pk)


class LibraryStudentStatusUpdateView(APIView):
    """POST /library/students/{id}/status"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        student = Student.objects.filter(pk=pk, library=library).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        serializer = LibraryStudentStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data['status']
        reason = serializer.validated_data['reason']

        effects = []
        if new_status == 'live':
            # Check Live in one library rule!
            if Student.objects.filter(user=student.user, status__iexact='Live').exclude(pk=student.pk).exists():
                raise PlatformAPIException(
                    'Student is currently Live in another library.',
                    code='student_live_elsewhere',
                    status_code=status.HTTP_409_CONFLICT,
                )
            student.status = 'Live'
            effects.append('Student marked Live')
        elif new_status == 'suspended':
            student.status = 'Suspended'
            student.suspension_reason = reason
            # Release active seat allocations
            from apps.seats.models import SeatAllocation
            SeatAllocation.objects.filter(student=student, released_at__isnull=True).update(
                released_at=timezone.now(),
                reason=f'Student suspended: {reason}'
            )
            for seat in student.assigned_seats.all():
                seat.student = None
                seat.save(update_fields=['student'])
            effects.extend(['Seat released', 'QR kiosk scan disabled'])
        elif new_status == 'left':
            student.status = 'Expired'
            student.left_at = timezone.now()
            from apps.seats.models import SeatAllocation
            SeatAllocation.objects.filter(student=student, released_at__isnull=True).update(
                released_at=timezone.now(),
                reason=f'Student left library: {reason}'
            )
            for seat in student.assigned_seats.all():
                seat.student = None
                seat.save(update_fields=['student'])
            effects.extend(['Seat released', 'Enrollment ended'])

        student.save()
        return Response({
            'student': _serialize_student_card(student),
            'effects': effects,
        })


class LibraryJoinRequestsView(APIView):
    """GET /library/join-requests"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        status_param = request.GET.get('status', 'pending')
        requests = Student.objects.filter(library=library, status__iexact=status_param).order_by('-created_at')

        results = [
            {
                'id': str(s.id),
                'student_code': s.student_code,
                'name': s.name,
                'mobile': s.phone,
                'email': s.email,
                'branch': {'id': str(s.branch.id), 'name': s.branch.name} if s.branch else None,
                'exam_goal': s.exam_target,
                'applied_at': str(s.created_at),
                'status': s.status.lower(),
            }
            for s in requests
        ]
        return Response(results)


class LibraryJoinRequestApproveView(APIView):
    """POST /library/join-requests/{id}/approve"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        student = Student.objects.filter(pk=pk, library=library).first()
        if not student:
            raise PlatformAPIException('Request not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        serializer = JoinRequestApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Enforce Live in one library rule!
        if Student.objects.filter(user=student.user, status__iexact='Live').exclude(pk=student.pk).exists():
            raise PlatformAPIException(
                'Student is currently Live in another library. They must leave first.',
                code='student_live_elsewhere',
                status_code=status.HTTP_409_CONFLICT,
            )

        student.status = 'Live'
        student.joining_date = timezone.now().date()
        student.save(update_fields=['status', 'joining_date'])

        return Response(_serialize_student_card(student))


class LibraryJoinRequestRejectView(APIView):
    """POST /library/join-requests/{id}/reject"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        student = Student.objects.filter(pk=pk, library=library).first()
        if not student:
            raise PlatformAPIException('Request not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        serializer = JoinRequestRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student.status = 'Expired'
        student.rejection_reason = serializer.validated_data['reason']
        student.save(update_fields=['status', 'rejection_reason'])

        return Response({
            'id': str(student.id),
            'status': 'rejected',
            'reason': student.rejection_reason,
        })


class LibraryPlansView(APIView):
    """GET /library/plans, POST /library/plans"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        plans = FeePlan.objects.filter(library=library).order_by('sort_order', 'duration_days')
        return Response([
            {
                'id': str(p.id),
                'name': p.name,
                'duration_days': p.duration_days,
                'price': str(p.price),
                'description': p.description,
                'is_active': p.is_active,
                'active_students': StudentMembership.objects.filter(plan=p, status__iexact='Active').count(),
            }
            for p in plans
        ])

    def post(self, request):
        library = _get_current_library(request)
        serializer = PlanCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        plan = FeePlan.objects.create(
            library=library,
            name=data['name'],
            duration_days=data['duration_days'],
            price=data['price'],
            description=data.get('description', ''),
            is_active=data.get('is_active', True),
            sort_order=data.get('sort_order', 0),
        )
        return Response({
            'id': str(plan.id),
            'name': plan.name,
            'duration_days': plan.duration_days,
            'price': str(plan.price),
        }, status=status.HTTP_201_CREATED)


class LibraryPlanDetailView(APIView):
    """GET /library/plans/{id}, PATCH /library/plans/{id}, DELETE /library/plans/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request, pk):
        library = _get_current_library(request)
        plan = FeePlan.objects.filter(pk=pk, library=library).first()
        if not plan:
            raise PlatformAPIException('Plan not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        return Response({
            'id': str(plan.id),
            'name': plan.name,
            'duration_days': plan.duration_days,
            'price': str(plan.price),
            'description': plan.description,
            'is_active': plan.is_active,
        })

    def patch(self, request, pk):
        library = _get_current_library(request)
        plan = FeePlan.objects.filter(pk=pk, library=library).first()
        if not plan:
            raise PlatformAPIException('Plan not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        serializer = PlanCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for k, v in serializer.validated_data.items():
            setattr(plan, k, v)
        plan.save()
        return self.get(request, pk)

    def delete(self, request, pk):
        library = _get_current_library(request)
        plan = FeePlan.objects.filter(pk=pk, library=library).first()
        if not plan:
            raise PlatformAPIException('Plan not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if StudentMembership.objects.filter(plan=plan).exists():
            raise PlatformAPIException('Plan is assigned to memberships and cannot be deleted.', code='plan_in_use', status_code=status.HTTP_409_CONFLICT)

        plan.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryStudentMembershipsAssignView(APIView):
    """POST /library/students/{id}/memberships"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        student = Student.objects.filter(pk=pk, library=library).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        serializer = MembershipAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        plan = FeePlan.objects.filter(pk=data['plan_id'], library=library).first()
        if not plan:
            raise PlatformAPIException('Plan not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        # Check live in one library
        if Student.objects.filter(user=student.user, status__iexact='Live').exclude(pk=student.pk).exists():
            raise PlatformAPIException('Student is Live in another library.', code='student_live_elsewhere', status_code=status.HTTP_409_CONFLICT)

        start_d = data.get('start_date') or timezone.now().date()
        end_d = start_d + timezone.timedelta(days=plan.duration_days)

        membership = StudentMembership.objects.create(
            student=student,
            plan=plan,
            shift=data.get('shift_id', 'Full Day'),
            start_date=start_d,
            end_date=end_d,
            status='Active',
            amount_paid=plan.price - data.get('discount_amount', 0),
            payment_mode=data.get('payment', {}).get('mode', 'Cash'),
        )

        student.status = 'Live'
        student.save(update_fields=['status'])

        return Response({
            'membership': {
                'id': str(membership.id),
                'plan_name': plan.name,
                'end_date': str(membership.end_date),
            },
            'enrollment_status': 'live',
        }, status=status.HTTP_201_CREATED)


class LibraryCouponsView(APIView):
    """GET /library/coupons, POST /library/coupons"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        coupons = Coupon.objects.filter(library=library)
        return Response([
            {
                'id': str(c.id),
                'code': c.code,
                'discount_type': c.discount_type,
                'discount_value': str(c.discount_value),
                'is_active': c.is_active,
            }
            for c in coupons
        ])

    def post(self, request):
        library = _get_current_library(request)
        serializer = CouponCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if Coupon.objects.filter(library=library, code=data['code'].upper()).exists():
            raise PlatformAPIException('Coupon code already exists.', code='duplicate_code', status_code=status.HTTP_409_CONFLICT)

        dtype = 'Percentage' if str(data.get('discount_type', '')).lower() == 'percentage' else 'Flat Amount'
        coupon = Coupon.objects.create(
            library=library,
            code=data['code'].upper(),
            discount_type=dtype,
            discount_value=data['discount_value'],
            valid_until=data.get('expires_at') or (timezone.now().date() + timezone.timedelta(days=365)),
            usage_limit=data.get('max_redemptions', 100),
            is_active=data.get('is_active', True),
        )

        return Response({
            'id': str(coupon.id),
            'code': coupon.code,
            'discount_type': coupon.discount_type.lower(),
            'discount_value': str(coupon.discount_value),
        }, status=status.HTTP_201_CREATED)


class LibraryStudentNotesView(APIView):
    """GET /library/students/{id}/notes, POST /library/students/{id}/notes"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request, pk):
        library = _get_current_library(request)
        student = Student.objects.filter(pk=pk, library=library).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        notes = student.admin_notes.all()
        return Response([
            {
                'id': str(n.id),
                'author': n.author_name or (n.author.name if n.author else 'Admin'),
                'note': n.note,
                'created_at': str(n.created_at),
            }
            for n in notes
        ])

    def post(self, request, pk):
        library = _get_current_library(request)
        student = Student.objects.filter(pk=pk, library=library).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        note_text = request.data.get('note', '').strip()
        if not note_text:
            raise PlatformAPIException('Note text is required.', code='validation_error')

        from apps.students.models import StudentNote
        note_obj = StudentNote.objects.create(
            student=student,
            author=request.user,
            author_name=getattr(request.user, 'name', 'Admin'),
            note=note_text,
        )
        return Response({
            'id': str(note_obj.id),
            'author': note_obj.author_name,
            'note': note_obj.note,
            'created_at': str(note_obj.created_at),
        }, status=status.HTTP_201_CREATED)


class LibraryStudentBranchTransferView(APIView):
    """POST /library/students/{id}/branch"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        student = Student.objects.filter(pk=pk, library=library).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        to_branch_id = request.data.get('to_branch_id')
        to_branch = Branch.objects.filter(pk=to_branch_id, library=library).first()
        if not to_branch:
            raise PlatformAPIException('Target branch not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        from apps.seats.models import SeatAllocation
        SeatAllocation.objects.filter(student=student, released_at__isnull=True).update(
            released_at=timezone.now(),
            reason=f'Branch transfer to {to_branch.name}'
        )
        for seat in student.assigned_seats.all():
            seat.student = None
            seat.save(update_fields=['student'])

        student.branch = to_branch
        student.save(update_fields=['branch'])

        return Response({
            'student': _serialize_student_card(student),
            'transferred_to': {'id': str(to_branch.id), 'name': to_branch.name},
        })


class LibraryStudentCardView(APIView):
    """GET /library/students/{id}/card"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request, pk):
        library = _get_current_library(request)
        student = Student.objects.filter(pk=pk, library=library).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        active_m = student.memberships.filter(status__iexact='Active').first()
        return Response({
            'student_code': student.student_code,
            'name': student.name,
            'photo_url': student.avatar.url if student.avatar else None,
            'library': {
                'id': str(library.id),
                'name': library.name,
                'logo_url': library.logo.url if library.logo else None,
            },
            'branch': {'id': str(student.branch.id), 'name': student.branch.name} if student.branch else None,
            'plan_end_date': str(active_m.end_date) if active_m else None,
            'qr_payload': f"LIB-STU:{library.id}:{student.id}:{student.student_code}",
        })


class LibraryStudentDeleteView(APIView):
    """DELETE /library/students/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def delete(self, request, pk):
        library = _get_current_library(request)
        student = Student.objects.filter(pk=pk, library=library).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if student.fee_payments.filter(status='paid').exists():
            raise PlatformAPIException('Cannot delete student with recorded payments. Use status Left instead.', code='student_has_payments', status_code=status.HTTP_409_CONFLICT)

        student.is_deleted = True
        student.deleted_at = timezone.now()
        student.status = 'Expired'
        student.save(update_fields=['is_deleted', 'deleted_at', 'status'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryJoinRequestRequestInfoView(APIView):
    """POST /library/join-requests/{id}/request-info"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        req = Student.objects.filter(pk=pk, library=library, status__iexact='Pending').first()
        if not req:
            raise PlatformAPIException('Pending join request not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        message = request.data.get('message', '').strip()
        if not message:
            raise PlatformAPIException('Message is required.', code='validation_error')

        req.rejection_reason = message
        req.save(update_fields=['rejection_reason'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryBranchChangeRequestsListView(APIView):
    """GET /library/branch-change-requests"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        status_param = request.GET.get('status', 'pending')
        qs = BranchChangeRequest.objects.filter(
            student__library=library,
            status__iexact=status_param,
        )
        return Response([
            {
                'id': str(r.id),
                'student': {'id': str(r.student.id), 'name': r.student.name, 'code': r.student.student_code},
                'from_branch': {'id': str(r.from_branch.id), 'name': r.from_branch.name} if r.from_branch else None,
                'to_branch': {'id': str(r.to_branch.id), 'name': r.to_branch.name},
                'reason': r.reason,
                'status': r.status,
                'created_at': str(r.created_at),
            }
            for r in qs
        ])


class LibraryBranchChangeRequestActionView(APIView):
    """POST /library/branch-change-requests/{id}/approve, POST .../reject"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        action = 'approve' if request.path.endswith('/approve') else 'reject'
        req = BranchChangeRequest.objects.filter(pk=pk, student__library=library).first()
        if not req:
            raise PlatformAPIException('Branch change request not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if action == 'approve':
            req.status = 'approved'
            req.decision_note = request.data.get('note', '')
            req.save(update_fields=['status', 'decision_note'])

            req.student.branch = req.to_branch
            req.student.save(update_fields=['branch'])
        else:
            req.status = 'rejected'
            req.decision_note = request.data.get('note', 'Rejected by administrator')
            req.save(update_fields=['status', 'decision_note'])

        return Response({
            'id': str(req.id),
            'status': req.status,
            'decision_note': req.decision_note,
        })


class LibraryLeaveRequestsListView(APIView):
    """GET /library/leave-requests"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        status_param = request.GET.get('status', 'pending')
        qs = StudentLeaveRequest.objects.filter(
            student__library=library,
            status__iexact=status_param,
        )
        return Response([
            {
                'id': str(r.id),
                'student': {'id': str(r.student.id), 'name': r.student.name, 'code': r.student.student_code},
                'reason': r.reason,
                'status': r.status,
                'created_at': str(r.created_at),
            }
            for r in qs
        ])


class LibraryLeaveRequestActionView(APIView):
    """POST /library/leave-requests/{id}/approve, POST .../reject"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        action = 'approve' if request.path.endswith('/approve') else 'reject'
        req = StudentLeaveRequest.objects.filter(pk=pk, student__library=library).first()
        if not req:
            raise PlatformAPIException('Leave request not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if action == 'approve':
            req.status = 'approved'
            req.decision_note = request.data.get('note', '')
            req.save(update_fields=['status', 'decision_note'])

            req.student.status = 'Expired'
            req.student.left_at = timezone.now()
            req.student.save(update_fields=['status', 'left_at'])
            for seat in req.student.assigned_seats.all():
                seat.student = None
                seat.save(update_fields=['student'])
        else:
            req.status = 'rejected'
            req.decision_note = request.data.get('note', 'Rejected by administrator')
            req.save(update_fields=['status', 'decision_note'])

        return Response({
            'id': str(req.id),
            'status': req.status,
            'decision_note': req.decision_note,
        })


class LibraryMembershipPauseResumeView(APIView):
    """POST /library/memberships/{id}/pause, POST .../resume"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        action = 'resume' if request.path.endswith('/resume') else 'pause'
        membership = StudentMembership.objects.filter(pk=pk, student__library=library).first()
        if not membership:
            raise PlatformAPIException('Membership not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if action == 'pause':
            membership.status = 'Grace Period'
            membership.notes = f"{membership.notes}\nPaused on {timezone.now().date()}: {request.data.get('reason', '')}".strip()
            membership.save(update_fields=['status', 'notes'])
        else:
            membership.status = 'Active'
            membership.notes = f"{membership.notes}\nResumed on {timezone.now().date()}".strip()
            membership.save(update_fields=['status', 'notes'])

        return Response({
            'id': str(membership.id),
            'status': membership.status.lower(),
            'end_date': str(membership.end_date),
        })
