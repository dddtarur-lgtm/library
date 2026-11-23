"""Serializers for Section 10 Library Panel APIs: Students, Join Requests, Plans, Memberships, Coupons."""
from decimal import Decimal
from rest_framework import serializers

from apps.billing.models import Coupon, FeePlan
from apps.students.models import Student, StudentMembership


class LibraryStudentCreateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100)
    middle_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=100)
    mobile = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True)
    gender = serializers.ChoiceField(choices=['Male', 'Female', 'Other'])
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    branch_id = serializers.CharField()
    exam_goal = serializers.CharField(required=False, allow_blank=True)
    guardian = serializers.DictField(required=False)
    address = serializers.CharField(required=False, allow_blank=True)
    photo_file_id = serializers.CharField(required=False, allow_blank=True)
    shift_id = serializers.CharField(required=False, allow_blank=True)
    seat_id = serializers.CharField(required=False, allow_blank=True)
    plan_id = serializers.CharField(required=False, allow_blank=True)
    start_date = serializers.DateField(required=False, allow_null=True)
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    payment = serializers.DictField(required=False)
    send_invite = serializers.BooleanField(default=True, required=False)


class LibraryStudentStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['live', 'suspended', 'on_hold', 'left', 'expired'])
    reason = serializers.CharField()
    effective_date = serializers.DateField(required=False, allow_null=True)


class JoinRequestApproveSerializer(serializers.Serializer):
    branch_id = serializers.CharField(required=False, allow_blank=True)
    student_code = serializers.CharField(required=False, allow_blank=True)
    shift_id = serializers.CharField(required=False, allow_blank=True)
    seat_id = serializers.CharField(required=False, allow_blank=True)
    plan_id = serializers.CharField(required=False, allow_blank=True)
    start_date = serializers.DateField(required=False, allow_null=True)
    note = serializers.CharField(required=False, allow_blank=True)


class JoinRequestRejectSerializer(serializers.Serializer):
    reason = serializers.CharField()


class PlanCreateUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    duration_days = serializers.IntegerField(min_value=1)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0'))
    offer_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True)
    highlights = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    show_on_public_page = serializers.BooleanField(default=True)
    is_active = serializers.BooleanField(default=True)
    sort_order = serializers.IntegerField(default=0)


class MembershipAssignSerializer(serializers.Serializer):
    plan_id = serializers.CharField()
    start_date = serializers.DateField(required=False, allow_null=True)
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    shift_id = serializers.CharField(required=False, allow_blank=True)
    seat_id = serializers.CharField(required=False, allow_blank=True)
    payment = serializers.DictField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class CouponCreateUpdateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    discount_type = serializers.ChoiceField(choices=['percentage', 'fixed'])
    discount_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    max_redemptions = serializers.IntegerField(required=False, default=100)
    valid_from = serializers.DateField(required=False, allow_null=True)
    valid_to = serializers.DateField(required=False, allow_null=True)
    is_active = serializers.BooleanField(default=True)
