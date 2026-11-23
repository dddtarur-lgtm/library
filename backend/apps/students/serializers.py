"""Serializers for Student and StudentMembership models."""
from rest_framework import serializers

from .models import Student, StudentMembership


class StudentMembershipSerializer(serializers.ModelSerializer):
    """Serializer for student fee-plan memberships."""

    seat_label = serializers.CharField(source='seat.label', read_only=True, default=None)

    class Meta:
        model = StudentMembership
        fields = [
            'id',
            'student',
            'plan',
            'seat',
            'seat_label',
            'shift',
            'start_date',
            'end_date',
            'status',
            'amount_paid',
            'payment_mode',
            'auto_renewal',
            'plan_name_snapshot',
            'price_snapshot',
            'renewal_count',
            'notes',
            'created_at',
        ]
        read_only_fields = ['id', 'student', 'plan_name_snapshot', 'price_snapshot', 'created_at']

    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                {'end_date': 'End date must be on or after start date.'}
            )
        seat = attrs.get('seat')
        plan = attrs.get('plan')
        student = self.context.get('student')
        if seat and student and seat.branch.library_id != student.library_id:
            raise serializers.ValidationError(
                {'seat': 'Seat does not belong to this student\'s library.'}
            )
        if plan and student and plan.library_id != student.library_id:
            raise serializers.ValidationError(
                {'plan': 'Fee plan does not belong to this student\'s library.'}
            )
        amount_paid = attrs.get('amount_paid')
        if amount_paid is not None and amount_paid < 0:
            raise serializers.ValidationError(
                {'amount_paid': 'Amount paid cannot be negative.'}
            )
        return attrs


class StudentSerializer(serializers.ModelSerializer):
    """Serializer for library-scoped Student CRUD and profile details."""

    branch_name = serializers.CharField(source='branch.name', read_only=True, default=None)
    library_name = serializers.CharField(source='library.name', read_only=True)
    current_seat = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id',
            'student_code',
            'library',
            'library_name',
            'branch',
            'branch_name',
            'name',
            'email',
            'phone',
            'avatar',
            'gender',
            'dob',
            'blood_group',
            'address',
            'guardian_name',
            'guardian_phone',
            'guardian_relation',
            'exam_target',
            'college',
            'target_year',
            'status',
            'qr_card_id',
            'joining_date',
            'allowed_study_minutes',
            'suspended_at',
            'suspension_reason',
            'rejection_reason',
            'left_at',
            'notes',
            'deleted_at',
            'current_seat',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'library', 'suspended_at', 'deleted_at', 'created_at', 'updated_at']
        extra_kwargs = {
            'student_code': {'required': False},
            'qr_card_id': {'required': False},
        }

    def get_current_seat(self, obj):
        seat = obj.assigned_seats.filter(is_active=True).first()
        if not seat:
            return None
        return {'id': str(seat.id), 'label': seat.label, 'floor': seat.floor}

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


class PlatformStudentSerializer(serializers.ModelSerializer):
    """Read-only serializer for Super Admin cross-library student listing."""

    library_name = serializers.CharField(source='library.name', read_only=True)
    library_code = serializers.CharField(source='library.code', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True, default=None)

    class Meta:
        model = Student
        fields = [
            'id',
            'student_code',
            'library',
            'library_name',
            'library_code',
            'branch',
            'branch_name',
            'name',
            'email',
            'phone',
            'gender',
            'exam_target',
            'status',
            'qr_card_id',
            'created_at',
        ]
        read_only_fields = fields


class SuspendStudentSerializer(serializers.Serializer):
    """Optional reason payload when suspending a student."""

    reason = serializers.CharField(required=False, allow_blank=True, max_length=255)
