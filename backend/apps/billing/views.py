"""Views and ViewSets for platform billing, library billing, fee plans, coupons, and cashbook."""
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from apps.accounts.permissions import (
    IsLibraryOwner,
    IsSameLibrary,
    IsStaffOrAbove,
    IsSubAdminOrAbove,
    IsSuperAdmin,
)
from apps.libraries.models import Library
from apps.students.models import StudentMembership
from utils.responses import error, success

from .models import (
    CashDayBookEntry,
    Coupon,
    FeePlan,
    LibrarySubscription,
    PlatformPayment,
    SubscriptionPlan,
)
from .serializers import (
    CashDayBookEntrySerializer,
    CouponSerializer,
    CouponValidateSerializer,
    ExtendGraceSerializer,
    FeeDueSerializer,
    FeePlanSerializer,
    LibraryRenewSerializer,
    LibrarySelectPlanSerializer,
    LibrarySubscriptionSerializer,
    ManualPlatformPaymentSerializer,
    PaymentVerifySerializer,
    PlatformPaymentFailActionSerializer,
    PlatformPaymentSerializer,
    PlatformPaymentVerifyActionSerializer,
    SubscriptionPlanSerializer,
)
from .services import (
    calculate_plan_pricing,
    get_library_plan_usage,
    initiate_or_complete_plan_payment,
    verify_platform_payment,
)

BILLING_CYCLE_CONFIG = {
    'Monthly': ('monthly_fee', 30),
    'Quarterly': ('quarterly_fee', 90),
    'Annual': ('annual_fee', 365),
}


def _resolve_user_library(request):
    """Resolve the active Library for a request user (or via ?library= for SUPER_ADMIN)."""
    user = request.user
    if user.role == 'SUPER_ADMIN':
        library_id = request.query_params.get('library') or request.data.get('library')
        if library_id:
            try:
                return Library.objects.get(id=library_id)
            except (Library.DoesNotExist, DjangoValidationError, ValueError) as exc:
                raise ValidationError({'library': 'Library not found.'}) from exc
    if getattr(user, 'library_id', None):
        return user.library
    owned = getattr(user, 'owned_library', None)
    if owned:
        return owned
    raise ValidationError({'library': 'User is not associated with a library.'})


def _scope_queryset_to_library(qs, request):
    """Filter a library-owned queryset to the caller's tenant library."""
    user = request.user
    if user.role == 'SUPER_ADMIN':
        library_id = request.query_params.get('library')
        return qs.filter(library_id=library_id) if library_id else qs
    if not user.library_id:
        return qs.none()
    return qs.filter(library_id=user.library_id)


# ---------------------------------------------------------------------------
# Platform Billing (Super Admin)
# ---------------------------------------------------------------------------


@extend_schema(tags=['Platform Billing'])
class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """Publicly listable subscription plans; SUPER_ADMIN can create/edit/deactivate."""

    queryset = SubscriptionPlan.objects.all().order_by('tier')
    serializer_class = SubscriptionPlanSerializer
    filterset_fields = ['is_active']
    ordering_fields = ['tier', 'monthly_fee', 'quarterly_fee', 'annual_fee']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsSuperAdmin()]

    def perform_destroy(self, instance):
        """Soft-deactivate plan instead of deleting referenced plans."""
        instance.is_active = False
        instance.save(update_fields=['is_active', 'updated_at'])


@extend_schema(tags=['Platform Billing'])
class PlatformPaymentViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Platform-wide payment ledger and manual payment recording for Super Admin."""

    permission_classes = [IsSuperAdmin]
    queryset = PlatformPayment.objects.select_related(
        'library', 'subscription', 'recorded_by'
    ).order_by('-created_at')
    serializer_class = PlatformPaymentSerializer
    filterset_fields = ['status', 'method', 'type', 'library']
    search_fields = [
        'transaction_id',
        'reference_number',
        'library__name',
        'library__code',
    ]
    ordering_fields = ['created_at', 'amount', 'status']

    @extend_schema(request=ManualPlatformPaymentSerializer)
    @action(detail=False, methods=['post'], url_path='manual')
    def manual(self, request):
        """Record a manual platform payment (Cash/Cheque/Bank Transfer/Manual Adjust)."""
        serializer = ManualPlatformPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save(recorded_by=request.user)
        return success(
            data=PlatformPaymentSerializer(payment).data,
            message='Manual payment recorded successfully',
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(request=PlatformPaymentVerifyActionSerializer)
    @action(detail=True, methods=['post'], url_path='verify')
    def verify_payment(self, request, pk=None):
        """Super Admin marks a pending platform payment as verified and activates subscription."""
        payment = self.get_object()
        serializer = PlatformPaymentVerifyActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        verified = verify_platform_payment(
            payment,
            verified_by=request.user,
            reference_number=serializer.validated_data.get('reference_number', ''),
            notes=serializer.validated_data.get('notes', ''),
        )
        return success(
            data=PlatformPaymentSerializer(verified).data,
            message='Payment verified and subscription activated successfully',
        )

    @extend_schema(request=PlatformPaymentFailActionSerializer)
    @action(detail=True, methods=['post'], url_path='fail')
    def fail_payment(self, request, pk=None):
        """Super Admin marks a pending platform payment as failed."""
        payment = self.get_object()
        serializer = PlatformPaymentFailActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        failed = verify_platform_payment(
            payment,
            verified_by=request.user,
            mark_failed=True,
            notes=serializer.validated_data.get('notes', ''),
        )
        return success(
            data=PlatformPaymentSerializer(failed).data,
            message='Payment marked as failed',
        )

    @extend_schema(request=PlatformPaymentFailActionSerializer)
    @action(detail=True, methods=['post'], url_path='refund')
    def refund_payment(self, request, pk=None):
        """Super Admin marks a platform payment as refunded with required reason."""
        payment = self.get_object()
        reason = request.data.get('reason', '') or request.data.get('notes', '')
        if not reason:
            return Response(
                {'error': 'Refund reason is mandatory'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        payment.status = 'Refunded'
        if reason:
            payment.notes = f"{payment.notes} | Refund: {reason}".strip(' |')
        payment.save(update_fields=['status', 'notes', 'updated_at'])
        return success(
            data=PlatformPaymentSerializer(payment).data,
            message='Payment refunded successfully',
        )


@extend_schema(tags=['Platform Billing'])
class LibrarySubscriptionViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Super Admin management of tenant library subscriptions and grace extensions."""

    permission_classes = [IsSuperAdmin]
    queryset = LibrarySubscription.objects.select_related('library', 'plan').order_by(
        '-created_at'
    )
    serializer_class = LibrarySubscriptionSerializer
    filterset_fields = ['status', 'billing_cycle', 'plan', 'library']
    search_fields = ['library__name', 'library__code', 'plan__name']
    ordering_fields = ['created_at', 'start_date', 'end_date', 'fee_amount']

    @extend_schema(request=ExtendGraceSerializer)
    @action(detail=True, methods=['post'], url_path='extend-grace')
    def extend_grace(self, request, pk=None):
        """Extend the grace period for a library subscription."""
        subscription = self.get_object()
        serializer = ExtendGraceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        today = timezone.localdate()
        if 'grace_ends' in serializer.validated_data:
            new_grace_ends = serializer.validated_data['grace_ends']
        else:
            days = serializer.validated_data['days']
            anchor = max(today, subscription.grace_ends or subscription.end_date)
            new_grace_ends = anchor + timedelta(days=days)

        with transaction.atomic():
            subscription.grace_ends = new_grace_ends
            subscription.status = 'Grace'
            subscription.save(update_fields=['grace_ends', 'status', 'updated_at'])

            library = subscription.library
            library.plan_status = 'Grace'
            if library.library_status == 'Locked':
                library.library_status = 'Active'
                library.save(
                    update_fields=['plan_status', 'library_status', 'updated_at']
                )
            else:
                library.save(update_fields=['plan_status', 'updated_at'])

        return success(
            data=LibrarySubscriptionSerializer(subscription).data,
            message='Grace period extended successfully',
        )


# ---------------------------------------------------------------------------
# Library Billing (Owner / Sub-Admin / Staff)
# ---------------------------------------------------------------------------


@extend_schema(tags=['Library Billing'])
class LibraryBillingView(APIView):
    """Retrieve the authenticated library owner's current subscription, entitlements, usage, and recent invoices."""

    permission_classes = [IsLibraryOwner]

    def get(self, request):
        library = _resolve_user_library(request)
        subscription = (
            LibrarySubscription.objects.filter(library=library)
            .select_related('plan', 'library')
            .order_by('-created_at')
            .first()
        )
        invoices = PlatformPayment.objects.filter(library=library).order_by(
            '-created_at'
        )[:10]
        usage_data = get_library_plan_usage(library)

        return success(
            data={
                'library': {
                    'id': str(library.id),
                    'code': library.code,
                    'name': library.name,
                    'plan_status': library.plan_status,
                    'library_status': library.library_status,
                },
                'subscription': (
                    LibrarySubscriptionSerializer(subscription).data
                    if subscription
                    else None
                ),
                'entitlements': usage_data['entitlements'],
                'usage': usage_data['usage'],
                'invoices': PlatformPaymentSerializer(invoices, many=True).data,
            }
        )


@extend_schema(tags=['Library Billing'])
class LibraryBillingPlansView(APIView):
    """Browse all active SaaS subscription plans available for library purchase."""

    permission_classes = [IsLibraryOwner]

    def get(self, request):
        plans = SubscriptionPlan.objects.filter(is_active=True).order_by('sort_order', 'tier')
        return success(
            data=SubscriptionPlanSerializer(plans, many=True).data,
            message='Available plans retrieved successfully',
        )


@extend_schema(tags=['Library Billing'], request=LibrarySelectPlanSerializer)
class LibraryBillingSelectPlanView(APIView):
    """Select a subscription plan and initiate or complete checkout/payment."""

    permission_classes = [IsLibraryOwner]

    def post(self, request):
        library = _resolve_user_library(request)
        serializer = LibrarySelectPlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            plan = SubscriptionPlan.objects.get(id=data['plan_id'], is_active=True)
        except SubscriptionPlan.DoesNotExist as exc:
            raise ValidationError({'plan_id': 'Active subscription plan not found.'}) from exc

        sub, payment = initiate_or_complete_plan_payment(
            library=library,
            plan=plan,
            billing_cycle=data['billing_cycle'],
            method=data['method'],
            user=request.user,
            reference_number=data.get('reference_number', ''),
            initiate_only=data.get('initiate_only', False),
            auto_renew=data.get('auto_renew', True),
        )

        msg = (
            'Payment initiated successfully. Please complete payment to activate plan.'
            if data.get('initiate_only')
            else 'Subscription activated successfully'
        )

        return success(
            data={
                'subscription': LibrarySubscriptionSerializer(sub).data,
                'payment': PlatformPaymentSerializer(payment).data,
            },
            message=msg,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Library Billing'], request=PaymentVerifySerializer)
class LibraryBillingVerifyPaymentView(APIView):
    """Confirm/verify a pending platform payment for this library."""

    permission_classes = [IsLibraryOwner]

    def post(self, request):
        library = _resolve_user_library(request)
        serializer = PaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            payment = PlatformPayment.objects.get(
                transaction_id=data['transaction_id'],
                library=library,
            )
        except PlatformPayment.DoesNotExist as exc:
            raise ValidationError({'transaction_id': 'Payment not found for this library.'}) from exc

        verified = verify_platform_payment(
            payment,
            verified_by=request.user,
            reference_number=data.get('reference_number', ''),
            notes=data.get('notes', ''),
        )

        return success(
            data=PlatformPaymentSerializer(verified).data,
            message='Payment verified and plan activated successfully',
        )


@extend_schema(tags=['Library Billing'], request=LibraryRenewSerializer)
class LibraryBillingRenewView(APIView):
    """Renew or upgrade the authenticated library owner's subscription."""

    permission_classes = [IsLibraryOwner]

    def post(self, request):
        library = _resolve_user_library(request)
        serializer = LibraryRenewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        current_sub = (
            LibrarySubscription.objects.filter(library=library)
            .select_related('plan')
            .order_by('-created_at')
            .first()
        )

        plan_id = data.get('plan_id')
        if plan_id:
            try:
                plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
            except SubscriptionPlan.DoesNotExist as exc:
                raise ValidationError({'plan_id': 'Active subscription plan not found.'}) from exc
        elif current_sub:
            plan = current_sub.plan
        else:
            plan = SubscriptionPlan.objects.filter(is_active=True).order_by('tier').first()
            if not plan:
                raise ValidationError({'plan_id': 'No active subscription plans available.'})

        billing_cycle = data.get('billing_cycle') or (
            current_sub.billing_cycle if current_sub else 'Monthly'
        )

        new_sub, payment = initiate_or_complete_plan_payment(
            library=library,
            plan=plan,
            billing_cycle=billing_cycle,
            method=data['method'],
            user=request.user,
            reference_number=data.get('reference_number', ''),
            initiate_only=False,
            auto_renew=current_sub.auto_renew if current_sub else True,
        )

        return success(
            data={
                'subscription': LibrarySubscriptionSerializer(new_sub).data,
                'payment': PlatformPaymentSerializer(payment).data,
            },
            message='Subscription renewed successfully',
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Library Billing'])
class LibraryInvoicesView(generics.ListAPIView):
    """List platform invoices/payments for the authenticated library owner."""

    permission_classes = [IsLibraryOwner]
    serializer_class = PlatformPaymentSerializer
    filterset_fields = ['status', 'method', 'type']
    search_fields = ['transaction_id', 'reference_number']
    ordering_fields = ['created_at', 'amount']

    def get_queryset(self):
        library = _resolve_user_library(self.request)
        return PlatformPayment.objects.filter(library=library).select_related(
            'library', 'subscription', 'recorded_by'
        )


@extend_schema(tags=['Library Billing'])
class FeePlanViewSet(viewsets.ModelViewSet):
    """CRUD for library-level student fee plans."""

    serializer_class = FeePlanSerializer
    filterset_fields = ['is_active']
    search_fields = ['name', 'description', 'badge_text']
    ordering_fields = ['sort_order', 'price', 'duration_days', 'created_at']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsSubAdminOrAbove(), IsSameLibrary()]
        return [IsLibraryOwner(), IsSameLibrary()]

    def get_queryset(self):
        return _scope_queryset_to_library(FeePlan.objects.all(), self.request)

    def perform_create(self, serializer):
        library = _resolve_user_library(self.request)
        serializer.save(library=library)

    def perform_destroy(self, instance):
        """Deactivate fee plan instead of deleting referenced plans."""
        instance.is_active = False
        instance.save(update_fields=['is_active', 'updated_at'])


@extend_schema(tags=['Library Billing'])
class CouponViewSet(viewsets.ModelViewSet):
    """CRUD and validation for library-level discount coupons."""

    serializer_class = CouponSerializer
    filterset_fields = ['discount_type', 'is_active']
    search_fields = ['code']
    ordering_fields = ['created_at', 'valid_until', 'discount_value']

    def get_permissions(self):
        if self.action == 'validate':
            return [IsSubAdminOrAbove(), IsSameLibrary()]
        return [IsLibraryOwner(), IsSameLibrary()]

    def get_queryset(self):
        return _scope_queryset_to_library(Coupon.objects.all(), self.request)

    def perform_create(self, serializer):
        library = _resolve_user_library(self.request)
        code = serializer.validated_data['code'].strip().upper()
        if Coupon.objects.filter(library=library, code=code).exists():
            raise ValidationError({'code': 'A coupon with this code already exists.'})
        serializer.save(library=library, code=code)

    def perform_update(self, serializer):
        if 'code' in serializer.validated_data:
            code = serializer.validated_data['code'].strip().upper()
            if (
                Coupon.objects.filter(library=serializer.instance.library, code=code)
                .exclude(pk=serializer.instance.pk)
                .exists()
            ):
                raise ValidationError({'code': 'A coupon with this code already exists.'})
            serializer.save(code=code)
        else:
            serializer.save()

    @extend_schema(request=CouponValidateSerializer)
    @action(detail=False, methods=['post'], url_path='validate')
    def validate(self, request):
        """Validate a coupon code against a purchase amount for the caller's library."""
        library = _resolve_user_library(request)
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data['code'].strip().upper()
        amount = serializer.validated_data['amount']
        today = timezone.localdate()

        coupon = Coupon.objects.filter(library=library, code=code).first()
        if not coupon:
            return error('Coupon code not found.', status=status.HTTP_404_NOT_FOUND)
        if not coupon.is_active:
            return error('Coupon is inactive.', status=status.HTTP_400_BAD_REQUEST)
        if coupon.valid_until < today:
            return error('Coupon has expired.', status=status.HTTP_400_BAD_REQUEST)
        if coupon.used_count >= coupon.usage_limit:
            return error('Coupon usage limit reached.', status=status.HTTP_400_BAD_REQUEST)
        if amount < coupon.min_purchase:
            return error(
                f'Minimum purchase amount of {coupon.min_purchase} is required.',
                status=status.HTTP_400_BAD_REQUEST,
            )

        if coupon.discount_type == 'Percentage':
            discount_amount = (amount * coupon.discount_value / Decimal('100')).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
        else:
            discount_amount = min(amount, coupon.discount_value)

        final_amount = max(Decimal('0.00'), amount - discount_amount)
        return success(
            data={
                'valid': True,
                'coupon_id': str(coupon.id),
                'code': coupon.code,
                'discount_type': coupon.discount_type,
                'discount_value': str(coupon.discount_value),
                'discount_amount': str(discount_amount),
                'final_amount': str(final_amount),
            },
            message='Coupon is valid',
        )


@extend_schema(tags=['Library Billing'])
class CashDayBookViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Cash daybook ledger entries for library counter collections."""

    serializer_class = CashDayBookEntrySerializer
    filterset_fields = ['date', 'branch', 'shift', 'payment_mode']
    search_fields = ['receipt_no', 'student__name', 'purpose', 'notes']
    ordering_fields = ['date', 'amount', 'created_at']

    def get_permissions(self):
        if self.action == 'create':
            return [IsStaffOrAbove(), IsSameLibrary()]
        return [IsSubAdminOrAbove(), IsSameLibrary()]

    def get_queryset(self):
        qs = CashDayBookEntry.objects.select_related(
            'branch', 'student', 'recorded_by'
        )
        return _scope_queryset_to_library(qs, self.request)

    def perform_create(self, serializer):
        library = _resolve_user_library(self.request)
        serializer.save(library=library, recorded_by=self.request.user)


@extend_schema(tags=['Library Billing'])
class FeeDuesListView(generics.ListAPIView):
    """List students with expiring, grace-period, or expired fee memberships."""

    permission_classes = [IsSubAdminOrAbove]
    serializer_class = FeeDueSerializer
    filterset_fields = ['status']
    search_fields = ['student__name', 'student__student_code', 'student__phone']
    ordering_fields = ['end_date', 'created_at']

    def get_queryset(self):
        qs = StudentMembership.objects.filter(
            student__is_deleted=False,
            status__in=['Expiring Soon', 'Grace Period', 'Expired'],
        ).select_related('student', 'student__branch', 'plan')

        user = self.request.user
        if user.role == 'SUPER_ADMIN':
            library_id = self.request.query_params.get('library')
            if library_id:
                qs = qs.filter(student__library_id=library_id)
        elif user.library_id:
            qs = qs.filter(student__library_id=user.library_id)
        else:
            return qs.none()

        return qs.order_by('end_date')
