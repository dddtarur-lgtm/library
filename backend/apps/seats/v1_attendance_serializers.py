"""Serializers for Section 13 (Attendance & Study) and Student Attendance/Study (Section 8.7 & 8.8)."""
from decimal import Decimal
from rest_framework import serializers
from apps.seats.models import (
    AttendanceQRCode, AttendanceRecord, ScanAttempt, Holiday, StudySession, Seat
)
from apps.students.models import Student


class AttendanceQRCodeSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    qr_image_url = serializers.SerializerMethodField()
    poster_url = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceQRCode
        fields = [
            'id',
            'token',
            'name',
            'branch_id',
            'branch_name',
            'expiry_option',
            'allowed_radius_m',
            'latitude',
            'longitude',
            'auto_renew',
            'status',
            'is_active',
            'expires_at',
            'qr_image_url',
            'poster_url',
            'created_at',
        ]

    def get_qr_image_url(self, obj):
        return f"https://cdn.platform.library.in/qr/{obj.token}.png"

    def get_poster_url(self, obj):
        return f"https://cdn.platform.library.in/posters/{obj.token}.pdf"


class AttendanceQRCodeCreateSerializer(serializers.Serializer):
    branch_id = serializers.UUIDField(required=True)
    name = serializers.CharField(max_length=100, required=False, default='Front Door QR')
    expiry_option = serializers.ChoiceField(choices=['day', 'week', 'month', 'custom'], default='day')
    expires_at = serializers.DateTimeField(required=False, allow_null=True)
    auto_renew = serializers.BooleanField(required=False, default=True)
    allowed_radius_m = serializers.IntegerField(required=False, default=100, min_value=10, max_value=5000)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_id = serializers.UUIDField(source='student.id', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    seat_label = serializers.CharField(source='seat.label', read_only=True, default=None)

    class Meta:
        model = AttendanceRecord
        fields = [
            'id',
            'student_id',
            'student_name',
            'branch_id',
            'branch_name',
            'seat_label',
            'shift',
            'date',
            'time_in',
            'time_out',
            'total_minutes',
            'method',
            'status',
            'late_mark',
            'under_time',
            'location_ok',
            'note',
            'created_at',
        ]


class ManualAttendanceCreateSerializer(serializers.Serializer):
    enrollment_id = serializers.UUIDField(required=True)
    date = serializers.DateField(required=True)
    check_in_time = serializers.DateTimeField(required=False)
    check_out_time = serializers.DateTimeField(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=['Present', 'Late Entry', 'Under-time', 'Absent'], default='Present')
    reason = serializers.CharField(required=True, min_length=3)


class ScanAttemptSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True, default=None)

    class Meta:
        model = ScanAttempt
        fields = [
            'id',
            'student_id',
            'student_name',
            'qr_code_id',
            'latitude',
            'longitude',
            'accuracy_m',
            'device_id',
            'is_mock_location',
            'result',
            'reason',
            'reviewed',
            'created_at',
        ]


class HolidaySerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True, default='All Branches')

    class Meta:
        model = Holiday
        fields = [
            'id',
            'branch_id',
            'branch_name',
            'holiday_date',
            'title',
            'description',
            'is_active',
            'created_at',
        ]


class HolidayCreateSerializer(serializers.Serializer):
    branch_id = serializers.UUIDField(required=False, allow_null=True)
    holiday_date = serializers.DateField(required=True)
    title = serializers.CharField(max_length=120, required=True)
    description = serializers.CharField(required=False, allow_blank=True, default='')


class StudySessionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)

    class Meta:
        model = StudySession
        fields = [
            'id',
            'student_id',
            'student_name',
            'subject_tag',
            'start_time',
            'end_time',
            'duration_minutes',
            'paused_minutes',
            'breaks_count',
            'status',
            'created_at',
        ]


class StudentAttendanceScanSerializer(serializers.Serializer):
    qr_token = serializers.UUIDField(required=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=True)
    accuracy_m = serializers.FloatField(required=False, default=10.0)
    device_id = serializers.CharField(max_length=120, required=True)
    is_mock_location = serializers.BooleanField(required=False, default=False)
    client_time = serializers.DateTimeField(required=False)


class StudySessionStartSerializer(serializers.Serializer):
    subject_tag = serializers.CharField(max_length=100, required=False, default='General')

