"""Serializers for Seat, SeatAllocationHistory, and AttendanceRecord."""
from rest_framework import serializers

from .models import AttendanceRecord, Seat, SeatAllocationHistory


class SeatSerializer(serializers.ModelSerializer):
    """Serializer for physical library seats, cabins, and lockers."""

    branch_name = serializers.CharField(source='branch.name', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True, default=None)
    student_code = serializers.CharField(
        source='student.student_code', read_only=True, default=None
    )
    status = serializers.SerializerMethodField()

    class Meta:
        model = Seat
        fields = [
            'id',
            'branch',
            'branch_name',
            'label',
            'floor',
            'zone',
            'type',
            'is_active',
            'is_reserved_for_girls',
            'notes',
            'student',
            'student_name',
            'student_code',
            'status',
        ]
        read_only_fields = ['id', 'student']

    def get_status(self, obj):
        if not obj.is_active:
            return 'Inactive'
        return 'Occupied' if obj.student_id else 'Available'

    def validate_branch(self, branch):
        request = self.context.get('request')
        if (
            branch
            and request
            and request.user.is_authenticated
            and request.user.role != 'SUPER_ADMIN'
            and branch.library_id != request.user.library_id
        ):
            raise serializers.ValidationError('Branch does not belong to your library.')
        return branch


class SeatAssignSerializer(serializers.Serializer):
    """Payload for assigning a seat to a student."""

    student_id = serializers.UUIDField()
    reason = serializers.CharField(required=False, allow_blank=True, max_length=255)


class SeatReleaseSerializer(serializers.Serializer):
    """Payload for releasing an occupied seat."""

    reason = serializers.CharField(required=False, allow_blank=True, max_length=255)


class SeatAllocationHistorySerializer(serializers.ModelSerializer):
    """Serializer for seat allocation audit records."""

    seat_label = serializers.CharField(source='seat.label', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    allocated_by_name = serializers.CharField(
        source='allocated_by.name', read_only=True, default=None
    )

    class Meta:
        model = SeatAllocationHistory
        fields = [
            'id',
            'seat',
            'seat_label',
            'student',
            'student_name',
            'allocated_at',
            'released_at',
            'allocated_by',
            'allocated_by_name',
            'reason',
        ]
        read_only_fields = fields


class AttendanceRecordSerializer(serializers.ModelSerializer):
    """Serializer for student attendance records."""

    student_name = serializers.CharField(source='student.name', read_only=True)
    student_code = serializers.CharField(source='student.student_code', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    seat_label = serializers.CharField(source='seat.label', read_only=True, default=None)

    class Meta:
        model = AttendanceRecord
        fields = [
            'id',
            'student',
            'student_name',
            'student_code',
            'branch',
            'branch_name',
            'seat',
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
            'marked_by',
            'note',
            'created_at',
        ]
        read_only_fields = ['id', 'student', 'branch', 'date', 'time_in', 'marked_by', 'created_at']


class CheckInSerializer(serializers.Serializer):
    """Payload for student check-in via student_id or qr_card_id."""

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        method_raw = str(data.get('method', '')).strip().upper()
        if method_raw in ('MANUAL', 'STAFF_MANUAL', 'STAFF MANUAL'):
            data['method'] = 'Staff Manual'
        elif method_raw in ('QR', 'QR_SCAN', 'QR SCAN'):
            data['method'] = 'QR Scan'
        elif method_raw in ('AUTO', 'AUTO_CHECKOUT', 'AUTO-CHECKOUT'):
            data['method'] = 'Auto-Checkout'
        return super().to_internal_value(data)

    student_id = serializers.UUIDField(required=False)
    qr_card_id = serializers.CharField(required=False, max_length=50)
    branch_id = serializers.UUIDField(required=False)
    seat_id = serializers.UUIDField(required=False)
    shift = serializers.CharField(required=False, default='Morning', max_length=50)
    method = serializers.ChoiceField(
        choices=['QR Scan', 'Staff Manual', 'Auto-Checkout'],
        default='Staff Manual',
    )
    status = serializers.ChoiceField(
        choices=['Present', 'Late Entry', 'Under-time', 'Auto-Checkout', 'Absent'],
        default='Present',
    )
    note = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        if not attrs.get('student_id') and not attrs.get('qr_card_id'):
            raise serializers.ValidationError('Either student_id or qr_card_id is required.')
        return attrs


class CheckOutSerializer(serializers.Serializer):
    """Payload for student check-out."""

    record_id = serializers.UUIDField(required=False)
    student_id = serializers.UUIDField(required=False)
    qr_card_id = serializers.CharField(required=False, max_length=50)
    note = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if not any([attrs.get('record_id'), attrs.get('student_id'), attrs.get('qr_card_id')]):
            raise serializers.ValidationError(
                'Provide record_id, student_id, or qr_card_id to check out.'
            )
        return attrs
