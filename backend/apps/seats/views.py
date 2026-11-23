"""Views for Seat matrix management and Attendance / Study Hours tracking."""
from datetime import timedelta

from django.db import transaction
from django.db.models import Count, Sum
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from apps.accounts.permissions import IsSameLibrary, IsStaffOrAbove, IsSubAdminOrAbove
from apps.billing.services import check_plan_quota
from apps.libraries.models import Branch
from apps.students.models import Student
from utils.responses import error, success

from .models import AttendanceRecord, Seat, SeatAllocationHistory
from .serializers import (
    AttendanceRecordSerializer,
    CheckInSerializer,
    CheckOutSerializer,
    SeatAssignSerializer,
    SeatReleaseSerializer,
    SeatSerializer,
)

SEATING_TEMPLATES = [
    {
        'id': 'standard-hall',
        'name': 'Standard Reading Hall',
        'description': '40 open study desks arranged in 4 rows of 10.',
        'total_seats': 40,
        'type': 'Desk',
        'prefix': 'A',
    },
    {
        'id': 'quiet-cabins',
        'name': 'Quiet Cabin Zone',
        'description': '20 private partitioned study cabins with power outlets.',
        'total_seats': 20,
        'type': 'Cabin',
        'prefix': 'C',
    },
    {
        'id': 'mixed-floor',
        'name': 'Mixed Desk & Locker Floor',
        'description': '30 desks + 15 storage lockers.',
        'total_seats': 45,
        'type': 'Desk',
        'prefix': 'M',
    },
]


@extend_schema(tags=['Seats'])
class SeatViewSet(viewsets.ModelViewSet):
    """CRUD and assignment/release actions for library seats."""

    serializer_class = SeatSerializer
    filterset_fields = ['branch', 'floor', 'type', 'is_active']
    search_fields = ['label', 'zone', 'student__name', 'student__student_code']
    ordering_fields = ['floor', 'label']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsSubAdminOrAbove(), IsSameLibrary()]
        return [IsStaffOrAbove(), IsSameLibrary()]

    def get_queryset(self):
        user = self.request.user
        qs = Seat.objects.select_related('branch', 'student')
        if user.role == 'SUPER_ADMIN':
            library_id = self.request.query_params.get('library')
            if library_id:
                qs = qs.filter(branch__library_id=library_id)
        else:
            if not user.library_id:
                return qs.none()
            qs = qs.filter(branch__library_id=user.library_id)

        seat_status = self.request.query_params.get('status')
        if seat_status == 'occupied':
            qs = qs.filter(student__isnull=False)
        elif seat_status == 'available':
            qs = qs.filter(student__isnull=True, is_active=True)
        return qs

    @action(detail=True, methods=['post'], url_path='assign')
    @transaction.atomic
    def assign(self, request, pk=None):
        """Assign a seat to a student and log allocation history."""
        seat = self.get_object()
        if not seat.is_active:
            return error('Cannot assign an inactive seat.', status=status.HTTP_400_BAD_REQUEST)
        if seat.student_id is not None:
            return error('Seat is already occupied.', status=status.HTTP_400_BAD_REQUEST)

        serializer = SeatAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student = Student.objects.filter(
            id=serializer.validated_data['student_id'],
            library_id=seat.branch.library_id,
            is_deleted=False,
        ).first()
        if not student:
            return error(
                'Student not found in this library.',
                status=status.HTTP_404_NOT_FOUND,
            )

        seat.student = student
        seat.save(update_fields=['student'])
        SeatAllocationHistory.objects.create(
            seat=seat,
            student=student,
            allocated_at=timezone.now(),
            allocated_by=request.user,
            reason=serializer.validated_data.get('reason', ''),
        )
        return success(
            data=SeatSerializer(seat).data,
            message=f'Seat {seat.label} assigned to {student.name}',
        )

    @action(detail=True, methods=['post'], url_path='release')
    @transaction.atomic
    def release(self, request, pk=None):
        """Release an occupied seat and close its active allocation history."""
        seat = self.get_object()
        if seat.student_id is None:
            return error('Seat is already available.', status=status.HTTP_400_BAD_REQUEST)

        serializer = SeatReleaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        now = timezone.now()
        open_history = SeatAllocationHistory.objects.filter(
            seat=seat,
            student=seat.student,
            released_at__isnull=True,
        ).first()
        if open_history:
            open_history.released_at = now
            if serializer.validated_data.get('reason'):
                open_history.reason = serializer.validated_data['reason']
            open_history.save(update_fields=['released_at', 'reason'])

        seat.student = None
        seat.save(update_fields=['student'])
        return success(
            data=SeatSerializer(seat).data,
            message=f'Seat {seat.label} released',
        )

    @action(detail=False, methods=['get'], url_path='templates')
    def templates(self, request):
        """Return predefined seating layout templates."""
        return success(data=SEATING_TEMPLATES)

    def perform_create(self, serializer):
        branch = serializer.validated_data.get('branch')
        library = getattr(branch, 'library', None) or getattr(self.request.user, 'library', None)
        check_plan_quota(library, 'seats')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.student_id is not None:
            raise ValidationError(
                {'detail': 'Release the seat before deleting it.'}
            )
        instance.delete()


@extend_schema(tags=['Attendance'])
class AttendanceViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Attendance tracking, QR/manual check-in/out, live sessions, and study leaderboard."""

    serializer_class = AttendanceRecordSerializer
    filterset_fields = ['date', 'branch', 'student', 'status', 'method']
    search_fields = ['student__name', 'student__student_code', 'note']
    ordering_fields = ['date', 'time_in', 'total_minutes']
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_permissions(self):
        if self.action in ('check_in', 'check_out'):
            return [IsAuthenticated()]
        return [IsStaffOrAbove(), IsSameLibrary()]

    def get_queryset(self):
        user = self.request.user
        qs = AttendanceRecord.objects.select_related('student', 'branch', 'seat')
        if user.role == 'SUPER_ADMIN':
            library_id = self.request.query_params.get('library')
            if library_id:
                qs = qs.filter(branch__library_id=library_id)
            return qs
        if not user.library_id:
            return qs.none()
        return qs.filter(branch__library_id=user.library_id)

    def _resolve_student(self, user, student_id=None, qr_card_id=None):
        if user.role == 'STUDENT':
            profile = getattr(user, 'student_profile', None)
            if not profile or profile.is_deleted:
                return None
            if student_id and str(profile.id) != str(student_id):
                return None
            if qr_card_id and profile.qr_card_id != qr_card_id:
                return None
            return profile
        qs = Student.objects.filter(is_deleted=False)
        if user.role != 'SUPER_ADMIN':
            if not user.library_id:
                return None
            qs = qs.filter(library_id=user.library_id)
        if student_id:
            return qs.filter(id=student_id).first()
        if qr_card_id:
            return qs.filter(qr_card_id=qr_card_id).first()
        return None

    @action(detail=False, methods=['post'], url_path='check-in')
    def check_in(self, request):
        """Check in a student via QR scan or staff manual entry."""
        serializer = CheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        student = self._resolve_student(
            request.user,
            student_id=data.get('student_id'),
            qr_card_id=data.get('qr_card_id'),
        )
        if not student:
            return error('Student not found.', status=status.HTTP_404_NOT_FOUND)

        if AttendanceRecord.objects.filter(student=student, time_out__isnull=True).exists():
            return error(
                'Student is already checked in.',
                status=status.HTTP_400_BAD_REQUEST,
            )

        branch = None
        if data.get('branch_id'):
            branch = Branch.objects.filter(
                id=data['branch_id'], library_id=student.library_id
            ).first()
        elif student.branch_id:
            branch = student.branch
        else:
            branch = Branch.objects.filter(library_id=student.library_id, is_active=True).first()

        if not branch:
            return error('No valid branch found for check-in.', status=status.HTTP_400_BAD_REQUEST)

        seat = None
        if data.get('seat_id'):
            seat = Seat.objects.filter(id=data['seat_id'], branch=branch).first()
            if not seat:
                return error('Seat not found in this branch.', status=status.HTTP_400_BAD_REQUEST)
        else:
            seat = student.assigned_seats.filter(branch=branch, is_active=True).first()

        now = timezone.now()
        lib_settings = getattr(branch.library, 'settings', None)
        is_late = bool(
            lib_settings
            and lib_settings.late_after_time
            and timezone.localtime(now).time() > lib_settings.late_after_time
        )
        record = AttendanceRecord.objects.create(
            student=student,
            branch=branch,
            seat=seat,
            shift=data.get('shift', 'Morning'),
            date=now.date(),
            time_in=now,
            method=data.get('method', 'Staff Manual'),
            status=data.get('status', 'Present'),
            late_mark=is_late,
            marked_by=request.user,
            note=data.get('note', ''),
        )
        return success(
            data=AttendanceRecordSerializer(record).data,
            message=f'{student.name} checked in',
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['post'], url_path='check-out')
    def check_out(self, request):
        """Check out an active student attendance session."""
        serializer = CheckOutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        open_qs = self.get_queryset().filter(time_out__isnull=True)
        record = None
        if data.get('record_id'):
            record = open_qs.filter(id=data['record_id']).first()
        else:
            student = self._resolve_student(
                request.user,
                student_id=data.get('student_id'),
                qr_card_id=data.get('qr_card_id'),
            )
            if student:
                record = open_qs.filter(student=student).first()

        if not record:
            return error('No active check-in session found.', status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        record.time_out = now
        record.total_minutes = max(0, int((now - record.time_in).total_seconds() // 60))
        if data.get('note'):
            record.note = data['note']
        record.save(update_fields=['time_out', 'total_minutes', 'note'])

        return success(
            data=AttendanceRecordSerializer(record).data,
            message=f'{record.student.name} checked out',
        )

    @action(detail=False, methods=['post'], url_path='auto-checkout')
    def auto_checkout(self, request):
        """Close all open attendance sessions for the library."""
        now = timezone.now()
        open_records = list(self.get_queryset().filter(time_out__isnull=True))
        for record in open_records:
            record.time_out = now
            record.total_minutes = max(0, int((now - record.time_in).total_seconds() // 60))
            record.status = 'Auto-Checkout'
            record.save(update_fields=['time_out', 'total_minutes', 'status'])
        return success(
            data={'closed_count': len(open_records)},
            message=f'Auto-checked out {len(open_records)} open session(s)',
        )

    @action(detail=False, methods=['get'], url_path='live')
    def live(self, request):
        """Return currently checked-in students."""
        qs = self.get_queryset().filter(time_out__isnull=True)
        serializer = AttendanceRecordSerializer(qs, many=True)
        return success(data=serializer.data)

    @action(detail=False, methods=['get'], url_path='study-hours')
    def study_hours(self, request):
        """Return live study sessions and top study-hours summary."""
        qs = self.get_queryset()
        live_sessions = AttendanceRecordSerializer(
            qs.filter(time_out__isnull=True), many=True
        ).data
        leaderboard = self._build_leaderboard(qs)
        return success(
            data={
                'live_count': len(live_sessions),
                'live_sessions': live_sessions,
                'leaderboard': leaderboard,
            }
        )

    @action(detail=False, methods=['get'], url_path='study-hours/leaderboard')
    def study_hours_leaderboard(self, request):
        """Return weekly study hours leaderboard."""
        qs = self.get_queryset()
        return success(data=self._build_leaderboard(qs))

    @staticmethod
    def _build_leaderboard(queryset):
        week_ago = timezone.now().date() - timedelta(days=7)
        rows = (
            queryset.filter(date__gte=week_ago, total_minutes__isnull=False)
            .values('student_id', 'student__name', 'student__student_code')
            .annotate(total_minutes=Sum('total_minutes'), sessions=Count('id'))
            .order_by('-total_minutes')[:20]
        )
        return [
            {
                'rank': idx + 1,
                'student_id': str(row['student_id']),
                'student_name': row['student__name'],
                'student_code': row['student__student_code'],
                'total_minutes': row['total_minutes'] or 0,
                'total_hours': round((row['total_minutes'] or 0) / 60, 2),
                'sessions': row['sessions'],
            }
            for idx, row in enumerate(rows)
        ]
