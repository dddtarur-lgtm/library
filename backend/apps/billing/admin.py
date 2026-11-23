"""Django Admin registrations for billing models."""
from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from .models import (
    CashDayBookEntry,
    Coupon,
    FeePlan,
    LibrarySubscription,
    PlatformPayment,
    SubscriptionPlan,
)


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(ModelAdmin):
    list_display = (
        'name',
        'tier',
        'monthly_fee',
        'quarterly_fee',
        'annual_fee',
        'max_branches',
        'max_seats',
        'is_active',
    )
    list_filter = ('is_active',)
    ordering = ('tier',)


@admin.register(LibrarySubscription)
class LibrarySubscriptionAdmin(ModelAdmin):
    list_display = (
        'library',
        'plan',
        'billing_cycle',
        'status',
        'start_date',
        'end_date',
        'grace_ends',
        'fee_amount',
    )
    list_filter = ('status', 'billing_cycle', 'plan')
    search_fields = ('library__name', 'library__code')


@admin.register(PlatformPayment)
class PlatformPaymentAdmin(ModelAdmin):
    list_display = (
        'transaction_id',
        'library',
        'amount',
        'method',
        'type',
        'status',
        'created_at',
    )
    list_filter = ('status', 'method', 'type')
    search_fields = ('transaction_id', 'reference_number', 'library__name')


@admin.register(FeePlan)
class FeePlanAdmin(ModelAdmin):
    list_display = ('name', 'library', 'duration_days', 'price', 'is_active', 'sort_order')
    list_filter = ('is_active',)
    search_fields = ('name', 'library__name')


@admin.register(Coupon)
class CouponAdmin(ModelAdmin):
    list_display = (
        'code',
        'library',
        'discount_type',
        'discount_value',
        'valid_until',
        'used_count',
        'usage_limit',
        'is_active',
    )
    list_filter = ('discount_type', 'is_active')
    search_fields = ('code', 'library__name')


@admin.register(CashDayBookEntry)
class CashDayBookEntryAdmin(ModelAdmin):
    list_display = (
        'receipt_no',
        'library',
        'branch',
        'date',
        'shift',
        'amount',
        'payment_mode',
        'purpose',
    )
    list_filter = ('payment_mode', 'shift', 'date')
    search_fields = ('receipt_no', 'student__name', 'purpose')
