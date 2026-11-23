"""Role-based and tenant-scoped DRF permission classes."""
from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """Allow access only to SUPER_ADMIN users, superusers, or platform tokens."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.role == 'SUPER_ADMIN'
                or request.user.is_superuser
                or getattr(request, 'token_audience', '') == 'platform'
            )
        )


class IsLibraryOwner(BasePermission):
    """Allow access only to LIBRARY_OWNER users."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'LIBRARY_OWNER'
        )


class IsSubAdminOrAbove(BasePermission):
    """Allow access to SUPER_ADMIN, LIBRARY_OWNER, and SUB_ADMIN."""

    allowed_roles = ('SUPER_ADMIN', 'LIBRARY_OWNER', 'SUB_ADMIN')

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in self.allowed_roles
        )


class IsStaffOrAbove(BasePermission):
    """Allow access to SUPER_ADMIN, LIBRARY_OWNER, SUB_ADMIN, and STAFF."""

    allowed_roles = ('SUPER_ADMIN', 'LIBRARY_OWNER', 'SUB_ADMIN', 'STAFF')

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in self.allowed_roles
        )


class IsSameLibrary(BasePermission):
    """Object-level check ensuring user belongs to the same library (SUPER_ADMIN bypasses)."""

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'SUPER_ADMIN':
            return True
        obj_library_id = getattr(obj, 'library_id', None)
        return (
            request.user.library_id is not None
            and obj_library_id == request.user.library_id
        )


class IsStudent(BasePermission):
    """Allow access only to STUDENT users."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'STUDENT'
        )

