"""Serializers for platform and library billing, plans, coupons, and cashbook."""
from decimal import Decimal
from django.utils import timezone
from rest_framework import serializers

from apps.libraries.models import BILLING_CYCLE_CHOICES
from apps.students.models import StudentMembership

from .models import (
    PLATFORM_PAYMENT_METHOD_CHOICES,
    PLATFORM_PAYMENT_STATUS_CHOICES,
    PLATFORM_PAYMENT_TYPE_CHOICES,
    CashDayBookEntry,
    Coupon,
    FeePlan,
    LibrarySubscription,
    PlatformPayment,
    SubscriptionPlan,
)


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer for platform SaaS subscription plans."""

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id',
            'name',
            'description',
            'tier',
            'monthly_fee',
            'quarterly_fee',
            'annual_fee',
            'max_branches',
            'max_seats',
            'max_students',
            'max_staff',
            'features',
            'sort_order',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        for field in ('monthly_fee', 'quarterly_fee', 'annual_fee'):
            val = attrs.get(field)
            if val is not None and val < Decimal('0.00'):
                raise serializers.ValidationError({field: 'Fee cannot be negative.'})
        return attrs


class LibrarySubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for tenant library subscriptions."""

    library_name = serializers.CharField(source='library.name', read_only=True)
    library_code = serializers.CharField(source='library.code', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)

    class Meta:
        model = LibrarySubscription
        fields = [
            'id',
            'library',
            'library_name',
            'library_code',
            'plan',
            'plan_name',
            'billing_cycle',
            'start_date',
            'end_date',
            'status',
            'grace_ends',
            'fee_amount',
            'auto_renew',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'library', 'created_at', 'updated_at']

    def validate(self, attrs):
        start_date = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end_date = attrs.get('end_date', getattr(self.instance, 'end_date', None))
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                {'end_date': 'End date must be on or after start date.'}
            )
        return attrs


class ExtendGraceSerializer(serializers.Serializer):
    """Input serializer for extending a library subscription's grace period."""

    days = serializers.IntegerField(min_value=1, max_value=90, required=False)
    grace_ends = serializers.DateField(required=False)

    def validate(self, attrs):
        if 'days' not in attrs and 'grace_ends' not in attrs:
            raise serializers.ValidationError(
                'Provide either "days" or "grace_ends" to extend the grace period.'
            )
        return attrs


class PlatformPaymentSerializer(serializers.ModelSerializer):
    """Serializer for platform-level payments and invoices."""

    library_name = serializers.CharField(source='library.name', read_only=True)
    library_code = serializers.CharField(source='library.code', read_only=True)
    recorded_by_email = serializers.EmailField(
        source='recorded_by.email', read_only=True, default=None
    )

    class Meta:
        model = PlatformPayment
        fields = [
            'id',
            'library',
            'library_name',
            'library_code',
            'subscription',
            'transaction_id',
            'invoice_no',
            'library_name_snapshot',
            'amount',
            'tax_amount',
            'method',
            'type',
            'status',
            'reference_number',
            'notes',
            'paid_at',
            'recorded_by',
            'recorded_by_email',
            'created_at',
        ]
        read_only_fields = ['id', 'recorded_by', 'created_at']


class ManualPlatformPaymentSerializer(serializers.ModelSerializer):
    """Serializer for recording a manual platform payment by Super Admin."""

    method = serializers.ChoiceField(choices=PLATFORM_PAYMENT_METHOD_CHOICES)
    type = serializers.ChoiceField(
        choices=PLATFORM_PAYMENT_TYPE_CHOICES, default='Manual Adjust'
    )
    status = serializers.ChoiceField(
        choices=PLATFORM_PAYMENT_STATUS_CHOICES, default='Success'
    )

    class Meta:
        model = PlatformPayment
        fields = [
            'library',
            'subscription',
            'transaction_id',
            'amount',
            'method',
            'type',
            'status',
            'reference_number',
        ]
        extra_kwargs = {
            'transaction_id': {'required': False, 'allow_blank': True},
            'subscription': {'required': False, 'allow_null': True},
        }

    def validate_amount(self, value):
        if value <= Decimal('0.00'):
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value

    def validate(self, attrs):
        library = attrs.get('library')
        subscription = attrs.get('subscription')
        if subscription and library and subscription.library_id != library.id:
            raise serializers.ValidationError(
                {'subscription': 'Subscription does not belong to the selected library.'}
            )
        return attrs


class LibraryRenewSerializer(serializers.Serializer):
    """Input serializer for library owner subscription renewal."""

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'billing_cycle' in data and isinstance(data['billing_cycle'], str):
            data['billing_cycle'] = data['billing_cycle'].strip().title()
        return super().to_internal_value(data)

    plan_id = serializers.UUIDField(required=False)
    billing_cycle = serializers.ChoiceField(
        choices=BILLING_CYCLE_CHOICES, required=False
    )
    method = serializers.ChoiceField(
        choices=PLATFORM_PAYMENT_METHOD_CHOICES, default='Razorpay'
    )
    reference_number = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default=''
    )


class LibrarySelectPlanSerializer(serializers.Serializer):
    """Input serializer for library owner selecting and checking out a SaaS plan."""

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'billing_cycle' in data and isinstance(data['billing_cycle'], str):
            data['billing_cycle'] = data['billing_cycle'].strip().title()
        return super().to_internal_value(data)

    plan_id = serializers.UUIDField()
    billing_cycle = serializers.ChoiceField(
        choices=BILLING_CYCLE_CHOICES, default='Monthly'
    )
    method = serializers.ChoiceField(
        choices=PLATFORM_PAYMENT_METHOD_CHOICES, default='UPI'
    )
    reference_number = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default=''
    )
    initiate_only = serializers.BooleanField(
        default=False,
        help_text='If True, creates Pending payment/subscription for gateway redirect or manual verification.'
    )
    auto_renew = serializers.BooleanField(default=True)


class PaymentVerifySerializer(serializers.Serializer):
    """Library owner verifying or confirming their pending payment."""

    transaction_id = serializers.CharField(max_length=100)
    reference_number = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default=''
    )
    notes = serializers.CharField(
        required=False, allow_blank=True, default=''
    )


class PlatformPaymentVerifyActionSerializer(serializers.Serializer):
    """Platform Super Admin verifying a pending payment."""

    reference_number = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default=''
    )
    notes = serializers.CharField(
        required=False, allow_blank=True, default=''
    )


class PlatformPaymentFailActionSerializer(serializers.Serializer):
    """Platform Super Admin marking a pending payment as failed."""

    notes = serializers.CharField(
        required=False, allow_blank=True, default=''
    )


class FeePlanSerializer(serializers.ModelSerializer):
    """Serializer for library-level student fee plans."""

    class Meta:
        model = FeePlan
        fields = [
            'id',
            'library',
            'name',
            'description',
            'duration_days',
            'price',
            'benefits',
            'is_active',
            'sort_order',
            'badge_text',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'library', 'created_at', 'updated_at']

    def validate_duration_days(self, value):
        if value < 1:
            raise serializers.ValidationError('Duration must be at least 1 day.')
        return value

    def validate_price(self, value):
        if value < Decimal('0.00'):
            raise serializers.ValidationError('Price cannot be negative.')
        return value


class CouponSerializer(serializers.ModelSerializer):
    """Serializer for library discount coupons."""

    usage_limit = serializers.IntegerField(required=False, default=100)

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        raw_dt = str(data.get('discount_type', '')).strip().upper()
        if raw_dt in ('FLAT', 'FLAT AMOUNT', 'FLAT_AMOUNT'):
            data['discount_type'] = 'Flat Amount'
        elif raw_dt in ('PERCENTAGE', 'PERCENT'):
            data['discount_type'] = 'Percentage'
        return super().to_internal_value(data)

    class Meta:
        model = Coupon
        fields = [
            'id',
            'library',
            'code',
            'discount_type',
            'discount_value',
            'min_purchase',
            'valid_until',
            'usage_limit',
            'used_count',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'library', 'used_count', 'created_at']

    def validate(self, attrs):
        discount_type = attrs.get(
            'discount_type', getattr(self.instance, 'discount_type', None)
        )
        discount_value = attrs.get(
            'discount_value', getattr(self.instance, 'discount_value', None)
        )
        if discount_value is not None and discount_value <= Decimal('0.00'):
            raise serializers.ValidationError(
                {'discount_value': 'Discount value must be greater than zero.'}
            )
        if (
            discount_type == 'Percentage'
            and discount_value is not None
            and discount_value > Decimal('100.00')
        ):
            raise serializers.ValidationError(
                {'discount_value': 'Percentage discount cannot exceed 100.'}
            )
        usage_limit = attrs.get('usage_limit', getattr(self.instance, 'usage_limit', 1))
        if usage_limit < 1:
            raise serializers.ValidationError(
                {'usage_limit': 'Usage limit must be at least 1.'}
            )
        min_purchase = attrs.get(
            'min_purchase', getattr(self.instance, 'min_purchase', Decimal('0.00'))
        )
        if min_purchase is not None and min_purchase < Decimal('0.00'):
            raise serializers.ValidationError(
                {'min_purchase': 'Minimum purchase cannot be negative.'}
            )
        return attrs


class CouponValidateSerializer(serializers.Serializer):
    """Input serializer for validating a coupon code against a purchase amount."""

    code = serializers.CharField(max_length=50)
    amount = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal('0.00')
    )


class CashDayBookEntrySerializer(serializers.ModelSerializer):
    """Serializer for daily cash daybook entries."""

    shift = serializers.CharField(required=False, default='Morning', max_length=20)

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if not data.get('shift'):
            data['shift'] = 'Morning'
        pm = str(data.get('payment_mode', '')).strip().upper()
        if pm in ('CASH',):
            data['payment_mode'] = 'Cash'
        elif pm in ('UPI', 'UPI_QR', 'UPI QR'):
            data['payment_mode'] = 'UPI QR'
        elif pm in ('CARD',):
            data['payment_mode'] = 'Card'
        return super().to_internal_value(data)

    branch_name = serializers.CharField(source='branch.name', read_only=True)
    student_name = serializers.CharField(
        source='student.name', read_only=True, default=None
    )
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CashDayBookEntry
        fields = [
            'id',
            'library',
            'branch',
            'branch_name',
            'date',
            'recorded_by',
            'recorded_by_name',
            'shift',
            'student',
            'student_name',
            'amount',
            'payment_mode',
            'receipt_no',
            'purpose',
            'notes',
            'created_at',
        ]
        read_only_fields = ['id', 'library', 'recorded_by', 'created_at']
        extra_kwargs = {
            'receipt_no': {'required': False, 'allow_blank': True},
        }

    def get_recorded_by_name(self, obj):
        if not obj.recorded_by:
            return None
        return obj.recorded_by.name

    def validate_amount(self, value):
        if value <= Decimal('0.00'):
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        library_id = getattr(user, 'library_id', None)
        if user and user.role == 'SUPER_ADMIN' and request.data.get('library'):
            library_id = request.data.get('library')

        branch = attrs.get('branch')
        if branch and library_id and str(branch.library_id) != str(library_id):
            raise serializers.ValidationError(
                {'branch': 'Branch does not belong to your library.'}
            )
        student = attrs.get('student')
        if student and library_id and str(student.library_id) != str(library_id):
            raise serializers.ValidationError(
                {'student': 'Student does not belong to your library.'}
            )
        return attrs


class FeeDueSerializer(serializers.ModelSerializer):
    """Serializer for students with expiring, grace, or expired fee memberships."""

    student_id = serializers.UUIDField(source='student.id', read_only=True)
    student_code = serializers.CharField(source='student.student_code', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_phone = serializers.CharField(source='student.phone', read_only=True)
    student_email = serializers.EmailField(source='student.email', read_only=True)
    branch_name = serializers.CharField(
        source='student.branch.name', read_only=True, default=None
    )
    plan_name = serializers.CharField(source='plan.name', read_only=True, default=None)
    plan_price = serializers.DecimalField(
        source='plan.price',
        max_digits=10,
        decimal_places=2,
        read_only=True,
        default=None,
    )
    days_overdue = serializers.SerializerMethodField()

    class Meta:
        model = StudentMembership
        fields = [
            'id',
            'student_id',
            'student_code',
            'student_name',
            'student_phone',
            'student_email',
            'branch_name',
            'plan',
            'plan_name',
            'plan_price',
            'shift',
            'start_date',
            'end_date',
            'status',
            'days_overdue',
        ]

    def get_days_overdue(self, obj):
        today = timezone.localdate()
        if obj.end_date >= today:
            return 0
        return (today - obj.end_date).days
