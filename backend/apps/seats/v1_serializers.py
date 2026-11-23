"""Serializers for Section 12 (Library panel APIs: seats and lockers)."""
from rest_framework import serializers
from apps.seats.models import (
    Floor, FloorRow, SeatCategory, Shift, Seat, SeatAllocation,
    SeatReservation, SeatWaitingList, SeatChangeRequest, Locker
)
from apps.students.models import Student


class FloorRowSerializer(serializers.ModelSerializer):
    class Meta:
        model = FloorRow
        fields = ['id', 'label', 'sort_order', 'created_at']


class FloorSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    rows_count = serializers.SerializerMethodField()
    seats_count = serializers.SerializerMethodField()

    class Meta:
        model = Floor
        fields = [
            'id',
            'branch_id',
            'branch_name',
            'name',
            'description',
            'sort_order',
            'is_active',
            'version',
            'rows_count',
            'seats_count',
            'created_at',
            'updated_at',
        ]

    def get_rows_count(self, obj):
        return obj.rows.count()

    def get_seats_count(self, obj):
        return obj.seats.count()


class FloorCreateUpdateSerializer(serializers.Serializer):
    branch_id = serializers.UUIDField(required=False)
    name = serializers.CharField(max_length=50, required=True)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    sort_order = serializers.IntegerField(required=False, default=0)
    is_active = serializers.BooleanField(required=False, default=True)


class SeatCategorySerializer(serializers.ModelSerializer):
    seats_count = serializers.SerializerMethodField()

    class Meta:
        model = SeatCategory
        fields = [
            'id',
            'code',
            'name',
            'allowed_gender',
            'color',
            'is_system',
            'seats_count',
            'created_at',
        ]

    def get_seats_count(self, obj):
        return obj.seats.count()


class SeatCategoryCreateUpdateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50, required=True)
    name = serializers.CharField(max_length=100, required=True)
    allowed_gender = serializers.ChoiceField(choices=['any', 'female', 'male'], default='any')
    color = serializers.CharField(max_length=30, required=False, default='#4F46E5')


class ShiftSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True, default=None)

    class Meta:
        model = Shift
        fields = [
            'id',
            'branch_id',
            'branch_name',
            'name',
            'start_minute',
            'end_minute',
            'is_full_day',
            'is_active',
            'created_at',
        ]


class ShiftCreateUpdateSerializer(serializers.Serializer):
    branch_id = serializers.UUIDField(required=False, allow_null=True)
    name = serializers.CharField(max_length=100, required=True)
    start_minute = serializers.IntegerField(required=True, min_value=0, max_value=1440)
    end_minute = serializers.IntegerField(required=True, min_value=0, max_value=1440)
    is_full_day = serializers.BooleanField(required=False, default=False)
    is_active = serializers.BooleanField(required=False, default=True)


class SeatItemSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    floor_name = serializers.CharField(source='floor_rel.name', read_only=True, default=None)
    row_label = serializers.CharField(source='row.label', read_only=True, default=None)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    category_color = serializers.CharField(source='category.color', read_only=True, default='#4F46E5')
    student_name = serializers.CharField(source='student.name', read_only=True, default=None)
    is_occupied = serializers.BooleanField(read_only=True)

    class Meta:
        model = Seat
        fields = [
            'id',
            'label',
            'branch_id',
            'branch_name',
            'floor_rel_id',
            'floor_name',
            'row_id',
            'row_label',
            'category_id',
            'category_name',
            'category_color',
            'type',
            'physical_status',
            'maintenance_reason',
            'layout',
            'is_active',
            'is_reserved_for_girls',
            'notes',
            'student_id',
            'student_name',
            'is_occupied',
        ]


class SeatDetailSerializer(SeatItemSerializer):
    occupants = serializers.SerializerMethodField()
    reservations = serializers.SerializerMethodField()

    class Meta(SeatItemSerializer.Meta):
        fields = SeatItemSerializer.Meta.fields + ['occupants', 'reservations']

    def get_occupants(self, obj):
        active_allocs = obj.allocations.filter(released_at__isnull=True)
        return [
            {
                'allocation_id': str(a.id),
                'shift': a.shift.name if a.shift else 'Full Day',
                'student': {'id': str(a.student.id), 'name': a.student.name, 'gender': a.student.gender},
                'from_date': str(a.from_date),
                'to_date': str(a.to_date) if a.to_date else None,
            }
            for a in active_allocs
        ]

    def get_reservations(self, obj):
        return [
            {
                'id': str(r.id),
                'reserved_for': r.reserved_for or (r.student.name if r.student else 'Guest'),
                'reserved_until': str(r.reserved_until),
                'status': r.status,
            }
            for r in obj.reservations.filter(status='active')
        ]


class SeatCreateSerializer(serializers.Serializer):
    floor_id = serializers.UUIDField(required=True)
    row_id = serializers.UUIDField(required=False, allow_null=True)
    seat_number = serializers.CharField(max_length=30, required=True)
    seat_type = serializers.ChoiceField(choices=['Desk', 'Cabin', 'PC', 'Locker'], default='Desk')
    category_id = serializers.UUIDField(required=False, allow_null=True)
    layout = serializers.JSONField(required=False, default=dict)
    notes = serializers.CharField(required=False, allow_blank=True, default='')


class SeatBulkCreateSerializer(serializers.Serializer):
    floor_id = serializers.UUIDField(required=True)
    row_id = serializers.UUIDField(required=False, allow_null=True)
    row_label = serializers.CharField(required=False, allow_blank=True, default='')
    prefix = serializers.CharField(max_length=10, required=False, allow_blank=True, default='')
    from_number = serializers.IntegerField(min_value=1, required=True)
    to_number = serializers.IntegerField(min_value=1, required=True)
    seat_type = serializers.ChoiceField(choices=['Desk', 'Cabin', 'PC', 'Locker'], default='Desk')
    category_id = serializers.UUIDField(required=False, allow_null=True)
    preview = serializers.BooleanField(required=False, default=False)


class SeatAllocationSerializer(serializers.ModelSerializer):
    seat_label = serializers.CharField(source='seat.label', read_only=True)
    branch_name = serializers.CharField(source='seat.branch.name', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    shift_name = serializers.CharField(source='shift.name', read_only=True, default='Full Day')
    allocated_by_name = serializers.CharField(source='allocated_by.name', read_only=True, default=None)

    class Meta:
        model = SeatAllocation
        fields = [
            'id',
            'seat_id',
            'seat_label',
            'branch_name',
            'student_id',
            'student_name',
            'shift_id',
            'shift_name',
            'from_date',
            'to_date',
            'released_at',
            'allocated_by_name',
            'reason',
            'is_active',
            'created_at',
        ]


class SeatAllocationCreateSerializer(serializers.Serializer):
    enrollment_id = serializers.UUIDField(required=True)
    seat_id = serializers.UUIDField(required=True)
    shift_id = serializers.UUIDField(required=False, allow_null=True)
    from_date = serializers.DateField(required=False)
    to_date = serializers.DateField(required=False, allow_null=True)
    membership_id = serializers.UUIDField(required=False, allow_null=True)
    reason = serializers.CharField(required=False, allow_blank=True, default='')


class SeatAllocationChangeSerializer(serializers.Serializer):
    new_seat_id = serializers.UUIDField(required=True)
    shift_id = serializers.UUIDField(required=False, allow_null=True)
    effective_date = serializers.DateField(required=False)
    reason = serializers.CharField(required=True, min_length=3)


class SeatAllocationReleaseSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, min_length=3)
    effective_date = serializers.DateField(required=False)


class SeatReservationSerializer(serializers.ModelSerializer):
    seat_label = serializers.CharField(source='seat.label', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True, default=None)
    shift_name = serializers.CharField(source='shift.name', read_only=True, default=None)

    class Meta:
        model = SeatReservation
        fields = [
            'id',
            'seat_id',
            'seat_label',
            'shift_id',
            'shift_name',
            'student_id',
            'student_name',
            'reserved_for',
            'reserved_until',
            'status',
            'created_at',
        ]


class SeatWaitingListSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    shift_name = serializers.CharField(source='shift.name', read_only=True, default=None)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)

    class Meta:
        model = SeatWaitingList
        fields = [
            'id',
            'student_id',
            'student_name',
            'shift_id',
            'shift_name',
            'category_id',
            'category_name',
            'status',
            'offered_seat_id',
            'created_at',
        ]


class SeatChangeRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    current_seat_label = serializers.CharField(source='current_seat.label', read_only=True, default=None)
    requested_seat_label = serializers.CharField(source='requested_seat.label', read_only=True, default=None)
    requested_category_name = serializers.CharField(source='requested_category.name', read_only=True, default=None)

    class Meta:
        model = SeatChangeRequest
        fields = [
            'id',
            'student_id',
            'student_name',
            'current_seat_id',
            'current_seat_label',
            'requested_seat_id',
            'requested_seat_label',
            'requested_category_id',
            'requested_category_name',
            'reason',
            'status',
            'note',
            'created_at',
        ]


class LockerSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True, default=None)

    class Meta:
        model = Locker
        fields = [
            'id',
            'branch_id',
            'branch_name',
            'number',
            'status',
            'student_id',
            'student_name',
            'from_date',
            'to_date',
            'notes',
            'created_at',
        ]

