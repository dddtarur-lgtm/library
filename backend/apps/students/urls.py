"""URL routing for library-scoped, platform-scoped, and student self-service endpoints."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    LibraryStudentDeletionRequestViewSet,
    LibraryStudentViewSet,
    PlatformStudentListView,
    StudentSelfAttendanceView,
    StudentSelfBooksView,
    StudentSelfDeletionRequestView,
    StudentSelfMembershipsView,
    StudentSelfProfileView,
)

# /api/v1/library/students/ & /api/v1/library/student-deletion-requests/
library_router = DefaultRouter()
library_router.register('students', LibraryStudentViewSet, basename='library-students')
library_router.register(
    'student-deletion-requests',
    LibraryStudentDeletionRequestViewSet,
    basename='library-student-deletion-requests',
)
library_urlpatterns = [
    path('', include(library_router.urls)),
]

# /api/v1/platform/students/
platform_urlpatterns = [
    path('students/', PlatformStudentListView.as_view(), name='platform-students-list'),
]

# /api/v1/student/
student_urlpatterns = [
    path('profile/', StudentSelfProfileView.as_view(), name='student-self-profile'),
    path('memberships/', StudentSelfMembershipsView.as_view(), name='student-self-memberships'),
    path('attendance/', StudentSelfAttendanceView.as_view(), name='student-self-attendance'),
    path('books/', StudentSelfBooksView.as_view(), name='student-self-books'),
    path('request-delete/', StudentSelfDeletionRequestView.as_view(), name='student-self-request-delete'),
]
