"""Views for library-scoped student management and platform student listing."""
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Avg, Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import DeletionRequest
from apps.accounts.permissions import (
    IsSameLibrary,
    IsStaffOrAbove,
    IsStudent,
    IsSubAdminOrAbove,
    IsSuperAdmin,
)
from apps.accounts.serializers import (
    DeletionRequestActionSerializer,
    DeletionRequestSerializer,
)
from apps.billing.services import check_plan_quota
from apps.books.models import BookLoan
from apps.books.serializers import BookLoanSerializer
from apps.seats.models import AttendanceRecord, SeatAllocationHistory
from apps.seats.serializers import (
    AttendanceRecordSerializer,
    SeatAllocationHistorySerializer,
)
from utils.responses import success

from .models import Student
from .serializers import (
    PlatformStudentSerializer,
    StudentMembershipSerializer,
    StudentSerializer,
    SuspendStudentSerializer,
)


@extend_schema(tags=['Students'])
class LibraryStudentViewSet(viewsets.ModelViewSet):
    """CRUD and nested profile actions for library students."""

    serializer_class = StudentSerializer
    permission_classes = [IsStaffOrAbove, IsSameLibrary]
    filterset_fields = ['status', 'branch']
    search_fields = ['name', 'email', 'phone', 'student_code', 'qr_card_id']
    ordering_fields = ['created_at', 'name', 'student_code', 'status']

    def get_queryset(self):
        user = self.request.user
        qs = Student.objects.filter(is_deleted=False).select_related('library', 'branch')
        if user.role == 'SUPER_ADMIN':
            library_id = self.request.query_params.get('library')
            if library_id:
                qs = qs.filter(library_id=library_id)
        else:
            if not user.library_id:
                return qs.none()
            qs = qs.filter(library_id=user.library_id)

        plan_id = self.request.query_params.get('plan')
        if plan_id:
            qs = qs.filter(memberships__plan_id=plan_id).distinct()
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        library = None
        if user.role == 'SUPER_ADMIN' and self.request.data.get('library'):
            from apps.libraries.models import Library
            library = Library.objects.filter(id=self.request.data['library']).first()
        elif user.library_id:
            library = user.library
        else:
            raise ValidationError({'library': 'User is not associated with a library.'})

        check_plan_quota(library, 'students')
        serializer.save(library=library)

    def perform_destroy(self, instance):
        """Soft-delete student instead of hard deletion."""
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.status = 'Suspended'
        instance.save(update_fields=['is_deleted', 'deleted_at', 'status', 'updated_at'])

    @action(detail=True, methods=['get', 'post'], url_path='memberships')
    def memberships(self, request, pk=None):
        """List or create memberships for a student."""
        student = self.get_object()
        if request.method == 'GET':
            qs = student.memberships.select_related('seat', 'plan').all()
            serializer = StudentMembershipSerializer(qs, many=True)
            return success(data=serializer.data)

        serializer = StudentMembershipSerializer(
            data=request.data,
            context={'request': request, 'student': student},
        )
        serializer.is_valid(raise_exception=True)
        membership = serializer.save(student=student)
        if membership.status == 'Active' and student.status != 'Live':
            student.status = 'Live'
            student.save(update_fields=['status', 'updated_at'])
        return success(
            data=StudentMembershipSerializer(membership).data,
            message='Membership created successfully',
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['get'], url_path='attendance')
    def attendance(self, request, pk=None):
        """Return attendance history for a student."""
        student = self.get_object()
        qs = AttendanceRecord.objects.filter(student=student).select_related('branch', 'seat')
        serializer = AttendanceRecordSerializer(qs, many=True)
        return success(data=serializer.data)

    @action(detail=True, methods=['get'], url_path='payments')
    def payments(self, request, pk=None):
        """Return payment & membership fee history for a student."""
        student = self.get_object()
        memberships = student.memberships.select_related('plan').order_by('-created_at')
        payment_records = [
            {
                'id': str(m.id),
                'type': 'Membership',
                'plan_id': str(m.plan_id) if m.plan_id else None,
                'shift': m.shift,
                'amount_paid': str(m.amount_paid),
                'payment_mode': m.payment_mode,
                'status': m.status,
                'start_date': m.start_date.isoformat(),
                'end_date': m.end_date.isoformat(),
                'created_at': m.created_at.isoformat(),
            }
            for m in memberships
        ]
        return success(data=payment_records)

    @action(detail=True, methods=['get'], url_path='books')
    def books(self, request, pk=None):
        """Return book lending history for a student."""
        student = self.get_object()
        qs = BookLoan.objects.filter(student=student).select_related('book')
        serializer = BookLoanSerializer(qs, many=True)
        return success(data=serializer.data)

    @action(detail=True, methods=['get'], url_path='seat-history')
    def seat_history(self, request, pk=None):
        """Return seat allocation history for a student."""
        student = self.get_object()
        qs = SeatAllocationHistory.objects.filter(student=student).select_related(
            'seat', 'allocated_by'
        )
        serializer = SeatAllocationHistorySerializer(qs, many=True)
        return success(data=serializer.data)

    @action(detail=True, methods=['get'], url_path='analytics')
    def analytics(self, request, pk=None):
        """Return study hours analytics for a student."""
        student = self.get_object()
        records = AttendanceRecord.objects.filter(student=student, total_minutes__isnull=False)
        agg = records.aggregate(
            total_sum=Sum('total_minutes'),
            avg_minutes=Avg('total_minutes'),
            sessions_count=Count('id'),
        )
        total_minutes = agg['total_sum'] or 0
        daily = (
            records.annotate(day=TruncDate('time_in'))
            .values('day')
            .annotate(minutes=Sum('total_minutes'), sessions=Count('id'))
            .order_by('-day')[:30]
        )
        return success(
            data={
                'student_id': str(student.id),
                'total_minutes': total_minutes,
                'total_hours': round(total_minutes / 60, 2),
                'average_session_minutes': round(agg['avg_minutes'] or 0, 1),
                'sessions_count': agg['sessions_count'] or 0,
                'daily_breakdown': [
                    {
                        'date': item['day'].isoformat() if item['day'] else None,
                        'minutes': item['minutes'] or 0,
                        'sessions': item['sessions'],
                    }
                    for item in daily
                ],
            }
        )

    @action(detail=True, methods=['post'], url_path='suspend')
    def suspend(self, request, pk=None):
        """Suspend a student account."""
        student = self.get_object()
        serializer = SuspendStudentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student.status = 'Suspended'
        student.suspended_at = timezone.now()
        student.suspension_reason = serializer.validated_data.get('reason', '')
        student.save(update_fields=['status', 'suspended_at', 'suspension_reason', 'updated_at'])
        return success(
            data=StudentSerializer(student).data,
            message='Student suspended successfully',
        )

    @action(detail=True, methods=['post'], url_path='send-reminder')
    def send_reminder(self, request, pk=None):
        """Send a fee due reminder email to the student."""
        student = self.get_object()
        latest_membership = student.memberships.order_by('-end_date').first()
        due_info = (
            f'Your membership ends on {latest_membership.end_date}.'
            if latest_membership
            else 'Please renew your library membership.'
        )
        send_mail(
            subject=f'Fee Due Reminder - {student.library.name}',
            message=f'Hello {student.name},\n\n{due_info}\n\nThank you,\n{student.library.name}',
            from_email=None,
            recipient_list=[student.email],
            fail_silently=True,
        )
        return success(
            data={
                'student_id': str(student.id),
                'sent_to': student.email,
                'sent_at': timezone.now().isoformat(),
            },
            message='Fee due reminder sent successfully',
        )


@extend_schema(tags=['Platform Students'])
class PlatformStudentListView(generics.ListAPIView):
    """Super Admin read-only list of students across all libraries."""

    serializer_class = PlatformStudentSerializer
    permission_classes = [IsSuperAdmin]
    filterset_fields = ['library', 'status', 'branch']
    search_fields = ['name', 'email', 'phone', 'student_code', 'library__name']
    ordering_fields = ['created_at', 'name', 'student_code']

    def get_queryset(self):
        return Student.objects.filter(is_deleted=False).select_related('library', 'branch')


def _get_student_for_user(user):
    """Resolve the Student profile linked to an authenticated STUDENT user."""
    student = getattr(user, 'student_profile', None)
    if student and not student.is_deleted:
        return student
    return Student.objects.filter(
        email=user.email, is_deleted=False
    ).select_related('library', 'branch').first()


@extend_schema(tags=['Student Self-Service'])
class StudentSelfProfileView(APIView):
    """Authenticated Student endpoint to view, edit, or update their own profile."""

    permission_classes = [IsStudent]

    def get(self, request):
        student = _get_student_for_user(request.user)
        if not student:
            return Response(
                {'message': 'No student profile linked to this account'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(StudentSerializer(student).data, status=status.HTTP_200_OK)

    @extend_schema(request=StudentSerializer, responses=StudentSerializer)
    def patch(self, request):
        student = _get_student_for_user(request.user)
        if not student:
            return Response(
                {'message': 'No student profile linked to this account'},
                status=status.HTTP_404_NOT_FOUND,
            )
        allowed_data = {
            k: v
            for k, v in request.data.items()
            if k in {
                'name', 'phone', 'avatar', 'gender', 'dob', 'blood_group',
                'address', 'guardian_name', 'guardian_phone', 'guardian_relation',
                'exam_target', 'college', 'target_year',
            }
        }
        serializer = StudentSerializer(student, data=allowed_data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(request=StudentSerializer, responses=StudentSerializer)
    def put(self, request):
        return self.patch(request)


@extend_schema(tags=['Student Self-Service'])
class StudentSelfMembershipsView(APIView):
    """Authenticated Student endpoint to view their own memberships."""

    permission_classes = [IsStudent]

    def get(self, request):
        student = _get_student_for_user(request.user)
        if not student:
            return Response(
                {'message': 'No student profile linked to this account'},
                status=status.HTTP_404_NOT_FOUND,
            )
        qs = student.memberships.select_related('seat', 'plan').all()
        return success(data=StudentMembershipSerializer(qs, many=True).data)


@extend_schema(tags=['Student Self-Service'])
class StudentSelfAttendanceView(APIView):
    """Authenticated Student endpoint to view their own attendance history."""

    permission_classes = [IsStudent]

    def get(self, request):
        student = _get_student_for_user(request.user)
        if not student:
            return Response(
                {'message': 'No student profile linked to this account'},
                status=status.HTTP_404_NOT_FOUND,
            )
        qs = AttendanceRecord.objects.filter(student=student).select_related('branch', 'seat')
        return success(data=AttendanceRecordSerializer(qs, many=True).data)


@extend_schema(tags=['Student Self-Service'])
class StudentSelfBooksView(APIView):
    """Authenticated Student endpoint to view their own book loan history."""

    permission_classes = [IsStudent]

    def get(self, request):
        student = _get_student_for_user(request.user)
        if not student:
            return Response(
                {'message': 'No student profile linked to this account'},
                status=status.HTTP_404_NOT_FOUND,
            )
        qs = BookLoan.objects.filter(student=student).select_related('book')
        return success(data=BookLoanSerializer(qs, many=True).data)


@extend_schema(tags=['Student Self-Service'])
class StudentSelfDeletionRequestView(APIView):
    """Authenticated Student endpoint to submit or view their deletion request."""

    permission_classes = [IsStudent]

    def get(self, request):
        student = _get_student_for_user(request.user)
        if not student:
            return Response(
                {'message': 'No student profile linked to this account'},
                status=status.HTTP_404_NOT_FOUND,
            )
        qs = DeletionRequest.objects.filter(
            student=student, target_type='STUDENT'
        )
        return Response(DeletionRequestSerializer(qs, many=True).data)

    @extend_schema(request=DeletionRequestSerializer, responses=DeletionRequestSerializer)
    def post(self, request):
        student = _get_student_for_user(request.user)
        if not student:
            return Response(
                {'message': 'No student profile linked to this account'},
                status=status.HTTP_404_NOT_FOUND,
            )
        if DeletionRequest.objects.filter(
            student=student, target_type='STUDENT', status='Pending'
        ).exists():
            return Response(
                {'message': 'A deletion request is already pending for your student profile.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = DeletionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(
            requested_by=request.user,
            target_type='STUDENT',
            library=student.library,
            student=student,
        )
        return Response(
            DeletionRequestSerializer(obj).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Students'])
class LibraryStudentDeletionRequestViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Library Owner / Sub-Admin review workflow for student deletion requests."""

    permission_classes = [IsSubAdminOrAbove]
    serializer_class = DeletionRequestSerializer
    filterset_fields = ['status']

    def get_queryset(self):
        user = self.request.user
        qs = DeletionRequest.objects.filter(target_type='STUDENT').select_related(
            'requested_by', 'library', 'student', 'reviewed_by'
        )
        if user.role == 'SUPER_ADMIN':
            return qs
        if not user.library_id:
            return qs.none()
        return qs.filter(library_id=user.library_id)

    @extend_schema(request=DeletionRequestActionSerializer)
    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """Approve student deletion request and soft-delete the student profile."""
        del_req = self.get_object()
        if del_req.status != 'Pending':
            return Response(
                {'message': 'Deletion request has already been processed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = DeletionRequestActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            if del_req.student:
                del_req.student.is_deleted = True
                del_req.student.status = 'Suspended'
                del_req.student.save(update_fields=['is_deleted', 'status', 'updated_at'])
                if del_req.student.user:
                    del_req.student.user.is_active = False
                    del_req.student.user.save(update_fields=['is_active', 'updated_at'])

            del_req.status = 'Approved'
            del_req.review_notes = serializer.validated_data.get('review_notes', '')
            del_req.reviewed_by = request.user
            del_req.reviewed_at = timezone.now()
            del_req.save(
                update_fields=[
                    'status',
                    'review_notes',
                    'reviewed_by',
                    'reviewed_at',
                    'updated_at',
                ]
            )

        return Response(
            {
                'message': 'Student deletion request approved.',
                'deletion_request': DeletionRequestSerializer(del_req).data,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(request=DeletionRequestActionSerializer)
    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        """Reject a pending student deletion request."""
        del_req = self.get_object()
        if del_req.status != 'Pending':
            return Response(
                {'message': 'Deletion request has already been processed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = DeletionRequestActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        del_req.status = 'Rejected'
        del_req.review_notes = serializer.validated_data.get('review_notes', '')
        del_req.reviewed_by = request.user
        del_req.reviewed_at = timezone.now()
        del_req.save(
            update_fields=[
                'status',
                'review_notes',
                'reviewed_by',
                'reviewed_at',
                'updated_at',
            ]
        )
        return Response(
            {
                'message': 'Student deletion request rejected.',
                'deletion_request': DeletionRequestSerializer(del_req).data,
            },
            status=status.HTTP_200_OK,
        )
