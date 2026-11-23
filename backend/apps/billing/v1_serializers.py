"""Serializers for Section 11 (Library fees & payments) and Section 8.3 (Student payments)."""
from decimal import Decimal
from rest_framework import serializers
from apps.billing.models import (
    Payment, FeeDue, Refund, Invoice, CashDayBookRecord, Coupon, FeePlan,
    STUDENT_PAYMENT_MODE_CHOICES, CHARGE_TYPE_CHOICES
)


class PaymentItemSerializer(serializers.ModelSerializer):
    amount = serializers.SerializerMethodField()
    discount_amount = serializers.SerializerMethodField()
    refund_amount = serializers.SerializerMethodField()
    student_id = serializers.UUIDField(source='student.id', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True, default=None)

    class Meta:
        model = Payment
        fields = [
            'id',
            'receipt_no',
            'student_id',
            'student_name',
            'branch_name',
            'amount',
            'discount_amount',
            'refund_amount',
            'mode',
            'status',
            'payment_date',
            'paid_at',
            'transaction_ref',
            'notes',
            'created_at',
        ]

    def get_amount(self, obj):
        return f"{obj.amount:.2f}"

    def get_discount_amount(self, obj):
        return f"{obj.discount_amount:.2f}"

    def get_refund_amount(self, obj):
        return f"{obj.refund_amount:.2f}"


class RefundItemSerializer(serializers.ModelSerializer):
    amount = serializers.SerializerMethodField()
    receipt_no = serializers.CharField(source='payment.receipt_no', read_only=True)
    student_name = serializers.CharField(source='payment.student.name', read_only=True)

    class Meta:
        model = Refund
        fields = [
            'id',
            'payment_id',
            'receipt_no',
            'student_name',
            'amount',
            'mode',
            'reason',
            'status',
            'created_at',
        ]

    def get_amount(self, obj):
        return f"{obj.amount:.2f}"


class PaymentDetailSerializer(PaymentItemSerializer):
    refunds = RefundItemSerializer(many=True, read_only=True)
    invoice_id = serializers.SerializerMethodField()
    invoice_no = serializers.SerializerMethodField()

    class Meta(PaymentItemSerializer.Meta):
        fields = PaymentItemSerializer.Meta.fields + ['refunds', 'invoice_id', 'invoice_no']

    def get_invoice_id(self, obj):
        inv = getattr(obj, 'invoice', None)
        return str(inv.id) if inv else None

    def get_invoice_no(self, obj):
        inv = getattr(obj, 'invoice', None)
        return inv.invoice_no if inv else None


class PaymentCollectSerializer(serializers.Serializer):
    enrollment_id = serializers.UUIDField(required=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'), required=True)
    mode = serializers.ChoiceField(choices=[c[0] for c in STUDENT_PAYMENT_MODE_CHOICES], required=True)
    payment_date = serializers.DateField(required=False)
    reference = serializers.CharField(max_length=120, required=False, allow_blank=True, default='')
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    membership_id = serializers.UUIDField(required=False, allow_null=True)
    charge_ids = serializers.ListField(child=serializers.UUIDField(), required=False, default=list)
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=Decimal('0.00'))
    coupon_code = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    send_receipt = serializers.JSONField(required=False, default=dict)


class PaymentUpdateSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    mode = serializers.ChoiceField(choices=[c[0] for c in STUDENT_PAYMENT_MODE_CHOICES], required=False)
    reference = serializers.CharField(max_length=120, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    payment_date = serializers.DateField(required=False)
    reason = serializers.CharField(required=True, min_length=3)


class PaymentCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, min_length=3)


class PaymentRefundSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'), required=True)
    mode = serializers.ChoiceField(choices=[c[0] for c in STUDENT_PAYMENT_MODE_CHOICES], required=True)
    reason = serializers.CharField(required=True, min_length=3)


class FeeDueItemSerializer(serializers.ModelSerializer):
    amount = serializers.SerializerMethodField()
    student_id = serializers.UUIDField(source='student.id', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_mobile = serializers.CharField(source='student.phone', read_only=True)

    class Meta:
        model = FeeDue
        fields = [
            'id',
            'student_id',
            'student_name',
            'student_mobile',
            'charge_type',
            'description',
            'amount',
            'due_date',
            'promise_date',
            'status',
            'waived_reason',
            'last_reminder_at',
            'created_at',
        ]

    def get_amount(self, obj):
        return f"{obj.amount:.2f}"


class ChargeCreateSerializer(serializers.Serializer):
    enrollment_id = serializers.UUIDField(required=True)
    charge_type = serializers.ChoiceField(choices=[c[0] for c in CHARGE_TYPE_CHOICES], required=True)
    description = serializers.CharField(max_length=255, required=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'), required=True)
    due_on = serializers.DateField(required=False)


class DueUpdateSerializer(serializers.Serializer):
    promise_date = serializers.DateField(required=False, allow_null=True)
    due_on = serializers.DateField(required=False)


class DueWaiveSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, min_length=3)


class DueRemindSerializer(serializers.Serializer):
    charge_ids = serializers.ListField(child=serializers.UUIDField(), required=False, default=list)
    channels = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    template_id = serializers.CharField(required=False, allow_blank=True, default='')


class DayBookOpeningSerializer(serializers.Serializer):
    date = serializers.DateField(required=True)
    branch_id = serializers.UUIDField(required=True)
    opening_cash = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.00'), required=True)
    member_id = serializers.UUIDField(required=False, allow_null=True)


class DayBookCloseSerializer(serializers.Serializer):
    date = serializers.DateField(required=True)
    branch_id = serializers.UUIDField(required=True)
    counted_cash = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.00'), required=True)
    note = serializers.CharField(required=False, allow_blank=True, default='')


class DayBookUnlockSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, min_length=3)


class InvoiceItemSerializer(serializers.ModelSerializer):
    taxable_amount = serializers.SerializerMethodField()
    tax_amount = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    gst_rate = serializers.SerializerMethodField()
    student_name = serializers.CharField(source='student.name', read_only=True)
    receipt_no = serializers.CharField(source='payment.receipt_no', read_only=True, default='')

    class Meta:
        model = Invoice
        fields = [
            'id',
            'invoice_no',
            'receipt_no',
            'student_name',
            'invoice_date',
            'taxable_amount',
            'tax_amount',
            'gst_rate',
            'total_amount',
            'created_at',
        ]

    def get_taxable_amount(self, obj):
        return f"{obj.taxable_amount:.2f}"

    def get_tax_amount(self, obj):
        return f"{obj.tax_amount:.2f}"

    def get_total_amount(self, obj):
        return f"{obj.total_amount:.2f}"

    def get_gst_rate(self, obj):
        return f"{obj.gst_rate:.2f}"


class StudentOrderCreateSerializer(serializers.Serializer):
    plan_id = serializers.UUIDField(required=True)
    coupon_code = serializers.CharField(required=False, allow_blank=True, default='')
    start_date = serializers.DateField(required=False)


class StudentPaymentVerifySerializer(serializers.Serializer):
    payment_id = serializers.UUIDField(required=True)
    razorpay_order_id = serializers.CharField(required=True)
    razorpay_payment_id = serializers.CharField(required=True)
    razorpay_signature = serializers.CharField(required=True)

