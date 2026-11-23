"""URL routing for seats and attendance endpoints."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AttendanceViewSet, SeatViewSet

router = DefaultRouter()
router.register('seats', SeatViewSet, basename='library-seats')
router.register('attendance', AttendanceViewSet, basename='library-attendance')

urlpatterns = [
    path('', include(router.urls)),
]
