"""Domain services for billing, plan subscriptions, payments, and quota enforcement."""
from datetime import timedelta
from decimal import Decimal
from typing import Any, Dict, Optional, Tuple

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.billing.models import (
    LibrarySubscription,
    PlatformPayment,
    SubscriptionPlan,
)
from apps.libraries.models import Library
from apps.seats.models import Seat
from apps.accounts.models import User


BILLING_CYCLE_CONFIG = {
    'Monthly': ('monthly_fee', 30),
    'Quarterly': ('quarterly_fee', 90),
    'Annual': ('annual_fee', 365),
}


def calculate_plan_pricing(
    plan: SubscriptionPlan,
    billing_cycle: str,
    tax_rate: Decimal = Decimal('0.00'),
) -> Dict[str, Any]:
    """Calculate base fee, tax, total, and duration for a given plan and billing cycle."""
    if billing_cycle not in BILLING_CYCLE_CONFIG:
        raise ValidationError({'billing_cycle': f"Invalid billing cycle. Choices are: {list(BILLING_CYCLE_CONFIG.keys())}"})

    fee_field, duration_days = BILLING_CYCLE_CONFIG[billing_cycle]
    fee_amount = getattr(plan, fee_field)
    if fee_amount is None:
        raise ValidationError({'plan': f"Plan {plan.name} does not have {fee_field} configured."})

    tax_amount = (fee_amount * tax_rate).quantize(Decimal('0.01'))
    total_amount = (fee_amount + tax_amount).quantize(Decimal('0.01'))

    return {
        'fee_amount': fee_amount,
        'tax_amount': tax_amount,
        'total_amount': total_amount,
        'duration_days': duration_days,
        'billing_cycle': billing_cycle,
    }


def initiate_or_complete_plan_payment(
    library: Library,
    plan: SubscriptionPlan,
    billing_cycle: str,
    method: str,
    user: Optional[User] = None,
    reference_number: str = '',
    initiate_only: bool = False,
    auto_renew: bool = True,
    tax_rate: Decimal = Decimal('0.00'),
    notes: str = '',
) -> Tuple[LibrarySubscription, PlatformPayment]:
    """
    Create a new LibrarySubscription and PlatformPayment record.
    If initiate_only is True, subscription and payment are created in 'Pending' status.
    If initiate_only is False, subscription is 'Active', payment is 'Success', and library is activated.
    """
    pricing = calculate_plan_pricing(plan, billing_cycle, tax_rate=tax_rate)

    current_sub = (
        LibrarySubscription.objects.filter(library=library, status__iexact='ACTIVE')
        .select_related('plan')
        .order_by('-created_at')
        .first()
    )

    today = timezone.localdate()
    anchor_date = (
        max(today, current_sub.end_date)
        if current_sub and current_sub.end_date
        else today
    )
    new_end_date = anchor_date + timedelta(days=pricing['duration_days'])

    is_renewal = current_sub is not None
    payment_type = 'Renewal' if is_renewal else 'Subscription'
    now = timezone.now()

    sub_status = 'Pending' if initiate_only else 'Active'
    payment_status = 'Pending' if initiate_only else 'Success'
    paid_at = None if initiate_only else now

    with transaction.atomic():
        subscription = LibrarySubscription.objects.create(
            library=library,
            plan=plan,
            billing_cycle=billing_cycle,
            start_date=anchor_date,
            end_date=new_end_date,
            status=sub_status,
            grace_ends=None,
            fee_amount=pricing['fee_amount'],
            auto_renew=auto_renew,
        )

        payment = PlatformPayment.objects.create(
            library=library,
            subscription=subscription,
            library_name_snapshot=library.name,
            amount=pricing['total_amount'],
            tax_amount=pricing['tax_amount'],
            method=method,
            type=payment_type,
            status=payment_status,
            reference_number=reference_number or '',
            recorded_by=user,
            paid_at=paid_at,
            notes=notes or '',
        )

        if not initiate_only:
            LibrarySubscription.objects.filter(library=library, status__iexact='ACTIVE').exclude(id=subscription.id).update(status='Superseded')
            library.plan_status = 'Active'
            if library.library_status in ('Locked', 'Suspended'):
                library.library_status = 'Active'
            library.save(update_fields=['plan_status', 'library_status', 'updated_at'])

    return subscription, payment


def verify_platform_payment(
    payment: PlatformPayment,
    verified_by: Optional[User] = None,
    reference_number: str = '',
    mark_failed: bool = False,
    notes: str = '',
) -> PlatformPayment:
    """
    Verify or fail a pending platform payment.
    When marked Success, transitions linked LibrarySubscription to 'Active' and Library to 'Active'.
    When marked Failed, transitions linked LibrarySubscription to 'Cancelled'.
    """
    if payment.status != 'Pending':
        raise ValidationError({'payment': f"Payment is already in '{payment.status}' status."})

    with transaction.atomic():
        if mark_failed:
            payment.status = 'Failed'
            if reference_number:
                payment.reference_number = reference_number
            if notes:
                payment.notes = f"{payment.notes}\nFailure Note: {notes}".strip()
            payment.save(update_fields=['status', 'reference_number', 'notes'])

            if payment.subscription and payment.subscription.status == 'Pending':
                payment.subscription.status = 'Cancelled'
                payment.subscription.save(update_fields=['status', 'updated_at'])

            return payment

        # Success path
        now = timezone.now()
        payment.status = 'Success'
        payment.paid_at = now
        if reference_number:
            payment.reference_number = reference_number
        if notes:
            payment.notes = f"{payment.notes}\nVerification Note: {notes}".strip()
        payment.save(update_fields=['status', 'paid_at', 'reference_number', 'notes'])

        if payment.subscription:
            payment.subscription.status = 'Active'
            payment.subscription.save(update_fields=['status', 'updated_at'])

        library = payment.library
        if library:
            library.plan_status = 'Active'
            if library.library_status in ('Locked', 'Suspended'):
                library.library_status = 'Active'
            library.save(update_fields=['plan_status', 'library_status', 'updated_at'])

    return payment


def get_library_plan_usage(library: Library) -> Dict[str, Any]:
    """Retrieve active plan entitlements and current resource utilization for a library."""
    active_sub = (
        LibrarySubscription.objects.filter(library=library, status__iexact='ACTIVE')
        .select_related('plan')
        .order_by('-created_at')
        .first()
    )

    plan = active_sub.plan if active_sub else None

    entitlements = {
        'has_active_plan': plan is not None,
        'plan_id': str(plan.id) if plan else None,
        'plan_name': plan.name if plan else 'No Active Plan',
        'tier': plan.tier if plan else None,
        'max_branches': plan.max_branches if plan else 1,
        'max_seats': plan.max_seats if plan else 0,
        'max_students': plan.max_students if plan else None,
        'max_staff': plan.max_staff if plan else None,
        'features': plan.features if plan else {},
    }

    usage = {
        'branches_used': library.branches.filter(is_active=True).count(),
        'seats_used': Seat.objects.filter(branch__library=library, is_active=True).count(),
        'students_used': library.students.filter(is_deleted=False).count(),
        'staff_used': User.objects.filter(library=library, role__in=['SUB_ADMIN', 'STAFF'], is_active=True).count(),
    }

    return {
        'entitlements': entitlements,
        'usage': usage,
        'subscription_id': str(active_sub.id) if active_sub else None,
        'billing_cycle': active_sub.billing_cycle if active_sub else None,
        'end_date': active_sub.end_date.isoformat() if active_sub and active_sub.end_date else None,
    }


def check_plan_quota(library: Optional[Library], resource: str) -> None:
    """
    Check if a library is allowed to create more of the given resource ('branches', 'seats', 'students', 'staff').
    Raises DRF ValidationError if the active plan's quota is reached or exceeded.
    """
    if not library:
        return

    usage_data = get_library_plan_usage(library)
    entitlements = usage_data['entitlements']
    usage = usage_data['usage']

    quota_map = {
        'branches': ('max_branches', 'branches_used'),
        'seats': ('max_seats', 'seats_used'),
        'students': ('max_students', 'students_used'),
        'staff': ('max_staff', 'staff_used'),
    }

    if resource not in quota_map:
        return

    max_key, used_key = quota_map[resource]
    limit = entitlements.get(max_key)

    if limit is not None and limit > 0:
        current_count = usage.get(used_key, 0)
        if current_count >= limit:
            raise ValidationError(
                {resource: f"Plan limit reached: {limit} {resource}. Current usage: {current_count}. Please upgrade your plan."}
            )

