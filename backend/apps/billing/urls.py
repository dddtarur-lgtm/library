"""URL routing for platform-scoped and library-scoped billing endpoints."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CashDayBookViewSet,
    CouponViewSet,
    FeeDuesListView,
    FeePlanViewSet,
    LibraryBillingPlansView,
    LibraryBillingRenewView,
    LibraryBillingSelectPlanView,
    LibraryBillingVerifyPaymentView,
    LibraryBillingView,
    LibraryInvoicesView,
    LibrarySubscriptionViewSet,
    PlatformPaymentViewSet,
    SubscriptionPlanViewSet,
)

# /api/v1/platform/
platform_router = DefaultRouter()
platform_router.register('plans', SubscriptionPlanViewSet, basename='platform-plans')
platform_router.register('payments', PlatformPaymentViewSet, basename='platform-payments')
platform_router.register(
    'subscriptions', LibrarySubscriptionViewSet, basename='platform-subscriptions'
)

platform_urlpatterns = [
    path('', include(platform_router.urls)),
]

# /api/v1/library/
library_router = DefaultRouter()
library_router.register('fee-plans', FeePlanViewSet, basename='library-fee-plans')
library_router.register('coupons', CouponViewSet, basename='library-coupons')
library_router.register('cashbook', CashDayBookViewSet, basename='library-cashbook')

library_urlpatterns = [
    path('billing/', LibraryBillingView.as_view(), name='library-billing'),
    path('billing/plans/', LibraryBillingPlansView.as_view(), name='library-billing-plans'),
    path('billing/select-plan/', LibraryBillingSelectPlanView.as_view(), name='library-billing-select-plan'),
    path('billing/payments/verify/', LibraryBillingVerifyPaymentView.as_view(), name='library-billing-verify-payment'),
    path('billing/renew/', LibraryBillingRenewView.as_view(), name='library-billing-renew'),
    path('billing/invoices/', LibraryInvoicesView.as_view(), name='library-billing-invoices'),
    path('fee-dues/', FeeDuesListView.as_view(), name='library-fee-dues'),
    path('', include(library_router.urls)),
]
