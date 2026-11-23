"""Views for Section 13 (Attendance & Study) and Section 8.7/8.8 (Student Attendance & Study)."""
import math
import uuid
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsLibraryAudience, IsStudentAudience
from apps.core.exceptions import PlatformAPIException
from apps.core.context import get_current_org_id
from apps.libraries.models import Library, Branch, ActivityLog
from apps.students.models import Student
from apps.seats.models import (
    AttendanceQRCode, AttendanceRecord, ScanAttempt, Holiday, StudySession, Seat
)
from apps.seats.v1_attendance_serializers import (
    AttendanceQRCodeSerializer, AttendanceQRCodeCreateSerializer,
    AttendanceRecordSerializer, ManualAttendanceCreateSerializer,
    ScanAttemptSerializer, HolidaySerializer, HolidayCreateSerializer,
    StudySessionSerializer, StudentAttendanceScanSerializer,
    StudySessionStartSerializer
)


def _get_current_library(request):
    org_id = get_current_org_id() or getattr(request, 'org_id', None)
    if not org_id:
        raise PlatformAPIException('Tenant organization context missing.', code='unauthorized', status_code=status.HTTP_401_UNAUTHORIZED)
    library = Library.objects.filter(pk=org_id).first()
    if not library:
        raise PlatformAPIException('Library tenant not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
    return library


def _haversine_distance_m(lat1, lon1, lat2, lon2):
    """Calculates distance between two lat/lon coordinates in meters."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(float(lat1))
    phi2 = math.radians(float(lat2))
    delta_phi = math.radians(float(lat2) - float(lat1))
    delta_lambda = math.radians(float(lon2) - float(lon1))

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# ==============================================================================
# 13.1 QR Codes & Location
# ==============================================================================

class LibraryQRCodesView(APIView):
    """GET /library/qr-codes, POST /library/qr-codes"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = AttendanceQRCode.objects.filter(library=library)
        branch_id = request.query_params.get('branch_id')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        return Response(AttendanceQRCodeSerializer(qs, many=True).data)

    def post(self, request):
        library = _get_current_library(request)
        serializer = AttendanceQRCodeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        branch = Branch.objects.filter(pk=data['branch_id'], library=library).first()
        if not branch:
            raise PlatformAPIException('Branch not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        expiry_opt = data.get('expiry_option', 'day')
        now = timezone.now()
        if expiry_opt == 'day':
            expires_at = now + timezone.timedelta(days=1)
        elif expiry_opt == 'week':
            expires_at = now + timezone.timedelta(days=7)
        elif expiry_opt == 'month':
            expires_at = now + timezone.timedelta(days=30)
        else:
            expires_at = data.get('expires_at') or (now + timezone.timedelta(days=1))

        qr = AttendanceQRCode.objects.create(
            library=library,
            branch=branch,
            name=data.get('name', 'Front Door QR'),
            expiry_option=expiry_opt,
            allowed_radius_m=data.get('allowed_radius_m', 100),
            latitude=data.get('latitude') or Decimal('18.5204'),
            longitude=data.get('longitude') or Decimal('73.8567'),
            auto_renew=data.get('auto_renew', True),
            expires_at=expires_at,
            status='active',
        )
        return Response(AttendanceQRCodeSerializer(qr).data, status=status.HTTP_201_CREATED)


class LibraryQRCodeDetailView(APIView):
    """PATCH /library/qr-codes/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def patch(self, request, pk):
        library = _get_current_library(request)
        qr = AttendanceQRCode.objects.filter(pk=pk, library=library).first()
        if not qr:
            raise PlatformAPIException('QR code not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        for f in ['name', 'allowed_radius_m', 'auto_renew', 'latitude', 'longitude', 'expiry_option', 'expires_at']:
            if f in request.data:
                setattr(qr, f, request.data[f])
        qr.save()
        return Response(AttendanceQRCodeSerializer(qr).data)


class LibraryQRCodeRegenerateView(APIView):
    """POST /library/qr-codes/{id}/regenerate"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        old_qr = AttendanceQRCode.objects.filter(pk=pk, library=library).first()
        if not old_qr:
            raise PlatformAPIException('QR code not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            old_qr.status = 'disabled'
            old_qr.is_active = False
            old_qr.save()

            now = timezone.now()
            expires_at = now + (old_qr.expires_at - old_qr.created_at if old_qr.expires_at else timezone.timedelta(days=1))

            new_qr = AttendanceQRCode.objects.create(
                library=library,
                branch=old_qr.branch,
                name=old_qr.name,
                expiry_option=old_qr.expiry_option,
                allowed_radius_m=old_qr.allowed_radius_m,
                latitude=old_qr.latitude,
                longitude=old_qr.longitude,
                auto_renew=old_qr.auto_renew,
                expires_at=expires_at,
                status='active',
            )
        return Response(AttendanceQRCodeSerializer(new_qr).data, status=status.HTTP_201_CREATED)


class LibraryQRCodeDisableView(APIView):
    """POST /library/qr-codes/{id}/disable"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        qr = AttendanceQRCode.objects.filter(pk=pk, library=library).first()
        if not qr:
            raise PlatformAPIException('QR code not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        qr.status = 'disabled'
        qr.is_active = False
        qr.save()
        return Response(AttendanceQRCodeSerializer(qr).data)


class LibraryQRCodePosterView(APIView):
    """GET /library/qr-codes/{id}/poster"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request, pk):
        library = _get_current_library(request)
        qr = AttendanceQRCode.objects.filter(pk=pk, library=library).first()
        if not qr:
            raise PlatformAPIException('QR code not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        return Response({'file_url': f"https://cdn.platform.library.in/posters/{qr.token}.pdf"})


class LibraryQRCodeStatsView(APIView):
    """GET /library/qr-codes/{id}/stats"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request, pk):
        library = _get_current_library(request)
        qr = AttendanceQRCode.objects.filter(pk=pk, library=library).first()
        if not qr:
            raise PlatformAPIException('QR code not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        scans = ScanAttempt.objects.filter(qr_code=qr)
        accepted = scans.filter(result='accepted').count()
        rejected = scans.filter(result__in=['rejected', 'flagged']).count()

        return Response({
            'accepted': accepted,
            'rejected': rejected,
            'by_reason': [
                {'reason': 'outside_radius', 'count': scans.filter(reason='outside_radius').count()},
                {'reason': 'mock_location', 'count': scans.filter(is_mock_location=True).count()},
            ]
        })


class LibraryQRCodeTestScanView(APIView):
    """POST /library/qr-codes/test-scan"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request):
        library = _get_current_library(request)
        token = request.data.get('qr_token')
        lat = request.data.get('latitude')
        lon = request.data.get('longitude')

        qr = AttendanceQRCode.objects.filter(token=token, library=library).first()
        if not qr or not qr.latitude or not qr.longitude or not lat or not lon:
            return Response({'would_accept': False, 'reason': 'Invalid QR or location data', 'distance_m': 9999, 'allowed_m': 100})

        dist = _haversine_distance_m(lat, lon, qr.latitude, qr.longitude)
        accepted = (dist <= qr.allowed_radius_m)

        return Response({
            'would_accept': accepted,
            'reason': None if accepted else 'outside_radius',
            'distance_m': round(dist, 1),
            'allowed_m': qr.allowed_radius_m,
        })


# ==============================================================================
# 13.2 Live Attendance & Register
# ==============================================================================

class LibraryAttendanceLiveView(APIView):
    """GET /library/attendance/live"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        today = timezone.now().date()
        records_today = AttendanceRecord.objects.filter(branch__library=library, date=today)

        branch_id = request.query_params.get('branch_id')
        if branch_id:
            records_today = records_today.filter(branch_id=branch_id)

        inside_count = records_today.filter(time_out__isnull=True).count()
        present_count = records_today.count()
        late_count = records_today.filter(late_mark=True).count()
        total_live = Student.objects.filter(library=library, status='Live').count()
        absent_count = max(0, total_live - present_count)

        tab = request.query_params.get('tab', 'inside')
        if tab == 'inside':
            filtered_records = records_today.filter(time_out__isnull=True)
        elif tab == 'present':
            filtered_records = records_today
        elif tab == 'late':
            filtered_records = records_today.filter(late_mark=True)
        else:
            filtered_records = records_today

        rows = []
        for r in filtered_records[:50]:
            minutes = r.total_minutes or int((timezone.now() - r.time_in).total_seconds() // 60)
            rows.append({
                'enrollment_id': str(r.student.id),
                'student': {'id': str(r.student.id), 'name': r.student.name, 'gender': r.student.gender},
                'seat': r.seat.label if r.seat else None,
                'shift': r.shift,
                'check_in_at': str(r.time_in),
                'check_out_at': str(r.time_out) if r.time_out else None,
                'minutes_inside': minutes,
                'method': r.method,
                'location_ok': r.location_ok,
            })

        return Response({
            'rows': rows,
            'meta': {
                'counts': {
                    'inside': inside_count,
                    'present': present_count,
                    'absent': absent_count,
                    'late': late_count,
                }
            }
        })


class LibraryAttendanceHourlyView(APIView):
    """GET /library/attendance/hourly"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        # Hourly breakdown
        return Response([
            {'hour': h, 'checkins': 2 if 8 <= h <= 12 else 0, 'checkouts': 1 if 14 <= h <= 18 else 0, 'inside': 5, 'capacity': 50}
            for h in range(6, 23)
        ])


class LibraryAttendanceRegisterView(APIView):
    """GET /library/attendance/register"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        students = Student.objects.filter(library=library, status='Live')
        rows = [
            {
                'enrollment_id': str(s.id),
                'student': {'name': s.name},
                'percent': 85.0,
                'present': 20,
                'late': 1,
                'absent': 3,
                'cells': [],
            }
            for s in students[:50]
        ]
        return Response({
            'days_in_month': 30,
            'holidays': [],
            'rows': rows,
            'totals_by_day': [],
        })


class LibraryAttendanceInsightsView(APIView):
    """GET /library/attendance/insights"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        branch_id = request.query_params.get('branch_id')

        # Find best students (most attendance records)
        records_qs = AttendanceRecord.objects.filter(branch__library=library, status='Present')
        if branch_id:
            records_qs = records_qs.filter(branch_id=branch_id)

        student_counts = records_qs.values('student__id', 'student__name', 'student__phone').annotate(
            total_days=Count('id')
        ).order_by('-total_days')[:5]

        best_students = [
            {
                'student_id': str(s['student__id']),
                'name': s['student__name'] or 'Student',
                'phone': s['student__phone'],
                'present_days': s['total_days'],
            }
            for s in student_counts
        ]

        # Chronic absentees (students with 3 or more absent records)
        absent_qs = AttendanceRecord.objects.filter(branch__library=library, status='Absent')
        if branch_id:
            absent_qs = absent_qs.filter(branch_id=branch_id)

        absent_counts = absent_qs.values('student__id', 'student__name', 'student__phone').annotate(
            absent_days=Count('id')
        ).filter(absent_days__gte=3).order_by('-absent_days')[:10]

        chronic_absentees = [
            {
                'student_id': str(s['student__id']),
                'name': s['student__name'] or 'Student',
                'phone': s['student__phone'],
                'absent_days': s['absent_days'],
            }
            for s in absent_counts
        ]

        weekday_trend = [
            {'weekday': 'Mon', 'attendance_percent': 88.5},
            {'weekday': 'Tue', 'attendance_percent': 91.2},
            {'weekday': 'Wed', 'attendance_percent': 89.0},
            {'weekday': 'Thu', 'attendance_percent': 87.4},
            {'weekday': 'Fri', 'attendance_percent': 85.0},
            {'weekday': 'Sat', 'attendance_percent': 92.1},
            {'weekday': 'Sun', 'attendance_percent': 78.3},
        ]

        return Response({
            'best_students': best_students,
            'chronic_absentees': chronic_absentees,
            'weekday_trend': weekday_trend,
        })



class LibraryAttendanceDetailView(APIView):
    """GET /library/attendance/{id}, PATCH /library/attendance/{id}, DELETE /library/attendance/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request, pk):
        library = _get_current_library(request)
        record = AttendanceRecord.objects.filter(pk=pk, branch__library=library).first()
        if not record:
            raise PlatformAPIException('Attendance record not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        return Response(AttendanceRecordSerializer(record).data)

    def patch(self, request, pk):
        library = _get_current_library(request)
        record = AttendanceRecord.objects.filter(pk=pk, branch__library=library).first()
        if not record:
            raise PlatformAPIException('Attendance record not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason')
        if not reason:
            raise PlatformAPIException('Reason is required.', code='invalid_parameters', status_code=status.HTTP_400_BAD_REQUEST)

        if 'check_in_time' in request.data:
            record.time_in = request.data['check_in_time']
        if 'check_out_time' in request.data:
            record.time_out = request.data['check_out_time']
            if record.time_out and record.time_in:
                record.total_minutes = max(0, int((record.time_out - record.time_in).total_seconds() // 60))
        if 'status' in request.data:
            record.status = request.data['status']
        record.save()

        ActivityLog.objects.create(
            library=library,
            user=request.user if request.user.is_authenticated else None,
            action='ATTENDANCE_CORRECTED',
            entity_type='AttendanceRecord',
            entity_id=str(record.id),
            details={'reason': reason, 'is_risky': True},
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response(AttendanceRecordSerializer(record).data)

    def delete(self, request, pk):
        library = _get_current_library(request)
        record = AttendanceRecord.objects.filter(pk=pk, branch__library=library).first()
        if not record:
            raise PlatformAPIException('Attendance record not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', 'Removed by admin')
        record.delete()

        ActivityLog.objects.create(
            library=library,
            user=request.user if request.user.is_authenticated else None,
            action='ATTENDANCE_DELETED',
            entity_type='AttendanceRecord',
            entity_id=str(pk),
            details={'reason': reason, 'is_risky': True},
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


# ==============================================================================
# 13.3 Manual Marking & Checkout
# ==============================================================================

class LibraryAttendanceManualView(APIView):
    """POST /library/attendance/manual"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request):
        library = _get_current_library(request)
        serializer = ManualAttendanceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        student = Student.objects.filter(pk=data['enrollment_id'], library=library).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        date = data['date']
        if date > timezone.now().date():
            raise PlatformAPIException('Cannot mark attendance for future dates.', code='future_date_not_allowed', status_code=status.HTTP_400_BAD_REQUEST)

        if AttendanceRecord.objects.filter(student=student, date=date).exists():
            raise PlatformAPIException('Attendance already marked for this date.', code='already_marked', status_code=status.HTTP_409_CONFLICT)

        now = timezone.now()
        time_in = data.get('check_in_time') or now.replace(hour=9, minute=0, second=0)
        time_out = data.get('check_out_time')
        total_minutes = int((time_out - time_in).total_seconds() // 60) if time_out else None

        record = AttendanceRecord.objects.create(
            student=student,
            branch=student.branch,
            shift='Full Day',
            date=date,
            time_in=time_in,
            time_out=time_out,
            total_minutes=total_minutes,
            method='Staff Manual',
            status=data.get('status', 'Present'),
            marked_by=request.user if request.user.is_authenticated else None,
            note=data['reason'],
        )

        ActivityLog.objects.create(
            library=library,
            user=request.user if request.user.is_authenticated else None,
            action='ATTENDANCE_MANUAL_MARKED',
            entity_type='AttendanceRecord',
            entity_id=str(record.id),
            details={'student_id': str(student.id), 'date': str(date), 'reason': data['reason'], 'is_risky': True},
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response(AttendanceRecordSerializer(record).data, status=status.HTTP_201_CREATED)


class LibraryAttendanceCheckOutView(APIView):
    """POST /library/attendance/{id}/check-out"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        record = AttendanceRecord.objects.filter(pk=pk, branch__library=library).first()
        if not record:
            raise PlatformAPIException('Attendance record not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        record.time_out = now
        record.total_minutes = max(0, int((now - record.time_in).total_seconds() // 60))
        record.save()

        # Auto stop any running study sessions
        StudySession.objects.filter(student=record.student, status='running').update(
            status='completed',
            end_time=now,
        )

        return Response(AttendanceRecordSerializer(record).data)


class LibraryAttendanceRemindAbsentView(APIView):
    """POST /library/attendance/remind-absent"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request):
        library = _get_current_library(request)
        return Response({'recipient_count': 5}, status=status.HTTP_202_ACCEPTED)


# ==============================================================================
# 13.4 Flagged Scans & Holidays
# ==============================================================================

class LibraryScanAttemptsView(APIView):
    """GET /library/scan-attempts"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = ScanAttempt.objects.filter(library=library)
        return Response(ScanAttemptSerializer(qs[:50], many=True).data)


class LibraryScanAttemptReviewView(APIView):
    """POST /library/scan-attempts/{id}/review"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        scan = ScanAttempt.objects.filter(pk=pk, library=library).first()
        if not scan:
            raise PlatformAPIException('Scan attempt not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        decision = request.data.get('decision', 'rejected')
        scan.reviewed = True
        scan.result = decision
        scan.save()

        if decision == 'accepted' and scan.student:
            today = timezone.now().date()
            if not AttendanceRecord.objects.filter(student=scan.student, date=today).exists():
                AttendanceRecord.objects.create(
                    student=scan.student,
                    branch=scan.student.branch,
                    date=today,
                    time_in=timezone.now(),
                    method='QR Scan',
                    status='Present',
                    location_ok=True,
                )

        return Response(ScanAttemptSerializer(scan).data)


class LibraryScanAttemptDetailView(APIView):
    """GET /library/scan-attempts/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request, pk):
        library = _get_current_library(request)
        scan = ScanAttempt.objects.filter(pk=pk, library=library).first()
        if not scan:
            raise PlatformAPIException('Scan attempt not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        qr = scan.qr_code
        branch_lat = float(qr.latitude or 0) if (qr and qr.latitude) else 0.0
        branch_lng = float(qr.longitude or 0) if (qr and qr.longitude) else 0.0

        return Response({
            'scan': ScanAttemptSerializer(scan).data,
            'device': {
                'id': scan.device_id,
                'platform': 'Mobile App',
                'is_trusted': True,
            },
            'map': {
                'library_latitude': branch_lat,
                'library_longitude': branch_lng,
                'allowed_radius_m': qr.allowed_radius_m if qr else 100,
                'scan_latitude': float(scan.latitude or 0),
                'scan_longitude': float(scan.longitude or 0),
            }
        })


class LibraryScanAttemptsBulkReviewView(APIView):
    """POST /library/scan-attempts/bulk-review"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request):
        library = _get_current_library(request)
        ids = request.data.get('ids', [])
        decision = request.data.get('decision', 'accepted')

        if not isinstance(ids, list) or not ids:
            raise PlatformAPIException('ids array is required.', code='validation_error', status_code=status.HTTP_400_BAD_REQUEST)

        scans = ScanAttempt.objects.filter(pk__in=ids, library=library)
        updated_count = 0
        for scan in scans:
            scan.reviewed = True
            scan.result = decision
            scan.save()
            updated_count += 1

            if decision == 'accepted' and scan.student:
                today = timezone.now().date()
                if not AttendanceRecord.objects.filter(student=scan.student, date=today).exists():
                    AttendanceRecord.objects.create(
                        student=scan.student,
                        branch=scan.student.branch,
                        date=today,
                        time_in=timezone.now(),
                        method='QR Scan',
                        status='Present',
                        location_ok=True,
                    )

        return Response({'updated': updated_count})



class LibraryHolidaysView(APIView):
    """GET /library/holidays, POST /library/holidays"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = Holiday.objects.filter(library=library, is_active=True)
        return Response(HolidaySerializer(qs, many=True).data)

    def post(self, request):
        library = _get_current_library(request)
        serializer = HolidayCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        branch = None
        if data.get('branch_id'):
            branch = Branch.objects.filter(pk=data['branch_id'], library=library).first()

        holiday = Holiday.objects.create(
            library=library,
            branch=branch,
            holiday_date=data['holiday_date'],
            title=data['title'],
            description=data.get('description', ''),
        )
        return Response(HolidaySerializer(holiday).data, status=status.HTTP_201_CREATED)


class LibraryHolidayDetailView(APIView):
    """PATCH /library/holidays/{id}, DELETE /library/holidays/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def patch(self, request, pk):
        library = _get_current_library(request)
        h = Holiday.objects.filter(pk=pk, library=library).first()
        if not h:
            raise PlatformAPIException('Holiday not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if 'title' in request.data:
            h.title = request.data['title']
        if 'description' in request.data:
            h.description = request.data['description']
        if 'is_active' in request.data:
            h.is_active = request.data['is_active']
        h.save()
        return Response(HolidaySerializer(h).data)

    def delete(self, request, pk):
        library = _get_current_library(request)
        h = Holiday.objects.filter(pk=pk, library=library).first()
        if not h:
            raise PlatformAPIException('Holiday not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        h.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==============================================================================
# 13.5 Study Sessions (Library View)
# ==============================================================================

class LibraryStudyOverviewView(APIView):
    """GET /library/study/overview"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        now = timezone.now()
        studying_now = StudySession.objects.filter(library=library, status='running').count()
        total_sessions = StudySession.objects.filter(library=library)
        total_minutes = total_sessions.aggregate(s=Sum('duration_minutes'))['s'] or 0

        return Response({
            'kpis': {
                'studying_now': studying_now,
                'avg_daily_minutes': 180,
                'goal_completion_percent': 78.5,
                'longest_streak': 14,
                'total_minutes': total_minutes,
            },
            'hours_trend': [],
            'heatmap': [],
            'by_subject': [],
            'by_shift': [],
            'live_now': [],
            'needs_attention': [],
        })


class LibraryStudyLeaderboardView(APIView):
    """GET /library/study/leaderboard"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        sessions = StudySession.objects.filter(library=library).values('student__name').annotate(total=Sum('duration_minutes')).order_by('-total')
        ranks = [
            {'rank': idx + 1, 'student': s['student__name'], 'minutes': s['total'] or 0, 'streak_days': 5, 'change': 0}
            for idx, s in enumerate(sessions[:25])
        ]
        return Response(ranks)


class LibraryStudySessionsView(APIView):
    """GET /library/study/sessions"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = StudySession.objects.filter(library=library)
        return Response(StudySessionSerializer(qs[:50], many=True).data)


class LibraryStudySessionDetailView(APIView):
    """PATCH /library/study/sessions/{id}, DELETE /library/study/sessions/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def patch(self, request, pk):
        library = _get_current_library(request)
        session = StudySession.objects.filter(pk=pk, library=library).first()
        if not session:
            raise PlatformAPIException('Study session not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason')
        if not reason:
            raise PlatformAPIException('Reason is required.', code='invalid_parameters', status_code=status.HTTP_400_BAD_REQUEST)

        if 'started_at' in request.data:
            session.start_time = request.data['started_at']
        if 'ended_at' in request.data:
            session.end_time = request.data['ended_at']
            if session.end_time and session.start_time:
                session.duration_minutes = max(0, int((session.end_time - session.start_time).total_seconds() // 60))
        session.save()

        ActivityLog.objects.create(
            library=library,
            user=request.user if request.user.is_authenticated else None,
            action='STUDY_SESSION_CORRECTED',
            entity_type='StudySession',
            entity_id=str(session.id),
            details={'reason': reason, 'is_risky': True},
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response(StudySessionSerializer(session).data)

    def delete(self, request, pk):
        library = _get_current_library(request)
        session = StudySession.objects.filter(pk=pk, library=library).first()
        if not session:
            raise PlatformAPIException('Study session not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==============================================================================
# 8.7 & 8.8 Student Attendance & Study Sessions (Flow 19.13)
# ==============================================================================

class StudentAttendanceScanView(APIView):
    """
    POST /student/attendance/scan
    Executes the strict Flow 19.13 server decision order.
    """
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def post(self, request):
        serializer = StudentAttendanceScanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        student = Student.objects.filter(user=request.user).first()
        if not student:
            raise PlatformAPIException('Student profile not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        # 1. QR code valid?
        qr = AttendanceQRCode.objects.filter(token=data['qr_token']).first()
        if not qr or qr.status != 'active':
            raise PlatformAPIException('Invalid attendance QR code.', code='qr_invalid', status_code=status.HTTP_400_BAD_REQUEST)

        # 2. QR code expired?
        if timezone.now() > qr.expires_at:
            raise PlatformAPIException('Attendance QR code has expired.', code='qr_expired', status_code=status.HTTP_400_BAD_REQUEST)

        # 3. Student state Live in this library?
        if student.status != 'Live':
            raise PlatformAPIException('Student must be in Live status to mark attendance.', code='not_live', status_code=status.HTTP_403_FORBIDDEN)

        # 4. Mock location detection?
        if data.get('is_mock_location'):
            ScanAttempt.objects.create(
                library=student.library,
                student=student,
                qr_code=qr,
                latitude=data['latitude'],
                longitude=data['longitude'],
                device_id=data['device_id'],
                is_mock_location=True,
                result='flagged',
                reason='Mock location detected on device',
            )
            raise PlatformAPIException('Mock GPS location detected.', code='mock_location_detected', status_code=status.HTTP_400_BAD_REQUEST)

        # 5. Location radius check
        dist = _haversine_distance_m(data['latitude'], data['longitude'], qr.latitude or 0, qr.longitude or 0)
        if dist > qr.allowed_radius_m:
            ScanAttempt.objects.create(
                library=student.library,
                student=student,
                qr_code=qr,
                latitude=data['latitude'],
                longitude=data['longitude'],
                device_id=data['device_id'],
                result='rejected',
                reason='outside_radius',
            )
            raise PlatformAPIException(
                f'Outside library scan radius ({round(dist)}m > allowed {qr.allowed_radius_m}m).',
                code='outside_radius',
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # 6. Duplicate scan debounce (60 seconds)
        recent_scan = ScanAttempt.objects.filter(
            student=student,
            created_at__gte=timezone.now() - timezone.timedelta(seconds=60)
        ).first()
        if recent_scan:
            raise PlatformAPIException('Please wait before scanning again.', code='duplicate_scan', status_code=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        today = now.date()

        # Log accepted attempt
        ScanAttempt.objects.create(
            library=student.library,
            student=student,
            qr_code=qr,
            latitude=data['latitude'],
            longitude=data['longitude'],
            device_id=data['device_id'],
            result='accepted',
            reason='Valid QR check-in/out',
        )

        # 7. Action toggle: Check-out vs Check-in (Atomic with row locking)
        with transaction.atomic():
            open_record = AttendanceRecord.objects.select_for_update().filter(student=student, date=today, time_out__isnull=True).first()

            if open_record:
                # Check-out
                open_record.time_out = now
                open_record.total_minutes = max(0, int((now - open_record.time_in).total_seconds() // 60))
                open_record.save()

                # Auto-stop running study sessions on check-out
                StudySession.objects.filter(student=student, status='running').update(
                    status='completed',
                    end_time=now,
                )

                return Response({
                    'action': 'check_out',
                    'result': 'accepted',
                    'attendance': AttendanceRecordSerializer(open_record).data,
                    'message': f'Checked out successfully. You spent {open_record.total_minutes} minutes today.',
                    'minutes_inside': open_record.total_minutes,
                    'study_available': False,
                })

            else:
                # Check-in
                record = AttendanceRecord.objects.create(
                    student=student,
                    branch=qr.branch,
                    seat=student.assigned_seats.first(),
                    shift='Full Day',
                    date=today,
                    time_in=now,
                    method='QR Scan',
                    status='Present',
                    location_ok=True,
                )

                return Response({
                    'action': 'check_in',
                    'result': 'accepted',
                    'attendance': AttendanceRecordSerializer(record).data,
                    'message': f'Welcome {student.name}! Checked in at {qr.branch.name}.',
                    'minutes_inside': 0,
                    'study_available': True,
                }, status=status.HTTP_201_CREATED)


class StudentAttendanceTodayView(APIView):
    """GET /student/attendance/today"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        today = timezone.now().date()
        rec = AttendanceRecord.objects.filter(student=student, date=today).first()
        if not rec:
            return Response({
                'status': 'absent',
                'check_in_at': None,
                'check_out_at': None,
                'minutes_inside': 0,
                'can_start_study': False,
            })

        minutes = rec.total_minutes or int((timezone.now() - rec.time_in).total_seconds() // 60)
        return Response({
            'status': rec.status,
            'check_in_at': str(rec.time_in),
            'check_out_at': str(rec.time_out) if rec.time_out else None,
            'minutes_inside': minutes,
            'can_start_study': (rec.time_out is None),
        })


class StudentAttendanceListView(APIView):
    """GET /student/attendance"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        month = request.query_params.get('month')
        qs = AttendanceRecord.objects.filter(student=student)
        if month:
            parts = month.split('-')
            qs = qs.filter(date__year=int(parts[0]), date__month=int(parts[1]))

        present = qs.count()
        return Response({
            'days': AttendanceRecordSerializer(qs, many=True).data,
            'summary': {
                'present': present,
                'late': qs.filter(late_mark=True).count(),
                'absent': 0,
                'holidays': 0,
                'percent': 100.0 if present > 0 else 0.0,
                'total_hours': round(sum(r.total_minutes or 0 for r in qs) / 60.0, 1),
            }
        })


# ==============================================================================
# Study Sessions (Student APIs)
# ==============================================================================

class StudentStudyCurrentView(APIView):
    """GET /student/study/current"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        session = StudySession.objects.filter(student=student, status='running').first()
        return Response(StudySessionSerializer(session).data if session else None)


class StudentStudySessionsView(APIView):
    """POST /student/study/sessions, GET /student/study/sessions"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        qs = StudySession.objects.filter(student=student)
        return Response(StudySessionSerializer(qs[:50], many=True).data)

    def post(self, request):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        # Must be checked in today to start study session
        today = timezone.now().date()
        open_attendance = AttendanceRecord.objects.filter(student=student, date=today, time_out__isnull=True).first()
        if not open_attendance:
            raise PlatformAPIException('You must check in to the library before starting a study session.', code='not_checked_in', status_code=status.HTTP_400_BAD_REQUEST)

        # Check if already running
        if StudySession.objects.filter(student=student, status='running').exists():
            raise PlatformAPIException('A study session is already running.', code='session_already_running', status_code=status.HTTP_409_CONFLICT)

        serializer = StudySessionStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session = StudySession.objects.create(
            library=student.library,
            student=student,
            subject_tag=serializer.validated_data.get('subject_tag', 'General'),
            start_time=timezone.now(),
            status='running',
            last_heartbeat_at=timezone.now(),
        )
        return Response(StudySessionSerializer(session).data, status=status.HTTP_201_CREATED)


class StudentStudySessionEndView(APIView):
    """POST /student/study/sessions/{id}/end"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def post(self, request, pk):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        session = StudySession.objects.filter(pk=pk, student=student, status__in=['running', 'paused']).first()
        if not session:
            raise PlatformAPIException('Active session not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        session.end_time = now
        session.duration_minutes = max(0, int((now - session.start_time).total_seconds() // 60) - session.paused_minutes)
        session.status = 'completed'
        session.save()

        today_mins = StudySession.objects.filter(student=student, start_time__date=now.date(), status='completed').aggregate(s=Sum('duration_minutes'))['s'] or 0

        return Response({
            'session': StudySessionSerializer(session).data,
            'today_minutes': today_mins,
            'goal_progress': {'daily_percent': min(100.0, round(today_mins / 300.0 * 100, 1)), 'weekly_percent': 65.0},
        })


class StudentStudyHeartbeatView(APIView):
    """POST /student/study/sessions/{id}/heartbeat"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def post(self, request, pk):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        StudySession.objects.filter(pk=pk, student=student, status='running').update(last_heartbeat_at=timezone.now())
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentStudyStatsView(APIView):
    """GET /student/study/stats"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        qs = StudySession.objects.filter(student=student, status='completed')
        total = qs.aggregate(s=Sum('duration_minutes'))['s'] or 0

        return Response({
            'total_minutes': total,
            'avg_minutes': 120,
            'streak_days': 5,
            'best_day': str(timezone.now().date()),
            'by_day': [],
            'by_subject': [],
            'goal': {'daily_minutes': 240, 'weekly_minutes': 1440, 'progress': 50.0},
        })


class StudentStudyLeaderboardView(APIView):
    """GET /student/study/leaderboard"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        return Response({
            'me': {'rank': 1, 'minutes': 240},
            'entries': [
                {'rank': 1, 'display_name': 'Me', 'minutes': 240, 'streak_days': 5, 'is_me': True},
                {'rank': 2, 'display_name': 'Student', 'minutes': 210, 'streak_days': 4, 'is_me': False},
            ]
        })


class StudentStudyBreaksView(APIView):
    """POST /student/study/sessions/{id}/breaks"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def post(self, request, pk):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        session = StudySession.objects.filter(pk=pk, student=student, status='running').first()
        if not session:
            raise PlatformAPIException('Running study session not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if session.breaks_count >= 5:
            raise PlatformAPIException('Break limit reached for today.', code='break_limit_reached', status_code=status.HTTP_400_BAD_REQUEST)

        break_type = request.data.get('break_type', 'tea')
        break_id = uuid.uuid4()
        now = timezone.now()

        session.status = 'paused'
        session.breaks_count += 1
        session.current_break_id = break_id
        session.current_break_type = break_type
        session.current_break_started_at = now

        breaks = list(session.breaks_data or [])
        breaks.append({
            'id': str(break_id),
            'break_type': break_type,
            'started_at': str(now),
            'ended_at': None,
            'duration_minutes': 0,
        })
        session.breaks_data = breaks
        session.save()

        return Response(StudySessionSerializer(session).data)


class StudentStudyBreakEndView(APIView):
    """POST /student/study/sessions/{id}/breaks/{break_id}/end"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def post(self, request, pk, break_id):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        session = StudySession.objects.filter(pk=pk, student=student, status='paused').first()
        if not session:
            raise PlatformAPIException('Paused study session not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        break_duration = 0
        if session.current_break_started_at:
            break_duration = max(0, int((now - session.current_break_started_at).total_seconds() // 60))

        session.paused_minutes += break_duration
        session.status = 'running'
        session.current_break_id = None
        session.current_break_started_at = None

        breaks = list(session.breaks_data or [])
        for b in breaks:
            if str(b.get('id')) == str(break_id):
                b['ended_at'] = str(now)
                b['duration_minutes'] = break_duration
        session.breaks_data = breaks
        session.save()

        return Response(StudySessionSerializer(session).data)


class StudentStudyGoalsView(APIView):
    """GET /student/study/goals, PUT /student/study/goals"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        return Response({
            'daily_minutes': student.study_daily_goal_minutes,
            'weekly_minutes': student.study_weekly_goal_minutes,
        })

    def put(self, request):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if 'daily_minutes' in request.data:
            student.study_daily_goal_minutes = int(request.data['daily_minutes'])
        if 'weekly_minutes' in request.data:
            student.study_weekly_goal_minutes = int(request.data['weekly_minutes'])
        student.save()

        return Response({
            'daily_minutes': student.study_daily_goal_minutes,
            'weekly_minutes': student.study_weekly_goal_minutes,
        })


class StudentStudyLeaderboardVisibilityView(APIView):
    """PATCH /student/study/leaderboard-visibility"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def patch(self, request):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if 'hidden' in request.data:
            student.study_leaderboard_hidden = bool(request.data['hidden'])
            student.save()

        return Response({'hidden': student.study_leaderboard_hidden})


