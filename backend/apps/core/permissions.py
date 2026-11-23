"""
Permission classes implementing the 8-step request processing checks:
Area Audience, Dynamic Library Permissions (lib:<code>[:level]), Branch Scope, and Student State Gate.
"""
from typing import Optional, Set
from django.core.cache import cache
from rest_framework import permissions

from apps.core.exceptions import (
    BranchScopeDeniedException,
    PermissionDeniedException,
    PlanRequiredException,
)
from apps.core.jwt import AUDIENCE_LIBRARY, AUDIENCE_PLATFORM, AUDIENCE_STUDENT


class RequiresAreaAudience(permissions.BasePermission):
    """Verifies the token's audience matches the target area."""
    allowed_audience: str = ''

    def has_permission(self, request, view):
        if not getattr(request.user, 'is_authenticated', False):
            return False

        payload = getattr(request, 'token_payload', None)
        if not payload:
            return False

        token_aud = payload.get('aud')
        if token_aud != self.allowed_audience:
            return False

        return True


class IsStudentAudience(RequiresAreaAudience):
    allowed_audience = AUDIENCE_STUDENT


class IsLibraryAudience(RequiresAreaAudience):
    allowed_audience = AUDIENCE_LIBRARY


class IsPlatformAudience(RequiresAreaAudience):
    allowed_audience = AUDIENCE_PLATFORM


class HasLibraryPermission(permissions.BasePermission):
    """
    Checks specific library permission code, e.g. 'lib:students.manage' or 'lib:payments.collect'.
    """

    def __init__(self, permission_code: str, level: str = 'full'):
        self.permission_code = permission_code
        self.level = level

    def __call__(self):
        return self

    def has_permission(self, request, view):
        if not getattr(request.user, 'is_authenticated', False):
            return False

        payload = getattr(request, 'token_payload', None)
        if not payload or payload.get('aud') != AUDIENCE_LIBRARY:
            return False

        role = payload.get('role', '').lower()
        if role in ('owner', 'library_owner'):
            return True  # Owner has unrestricted access

        # Check permission for sub_admin or staff
        user_id = payload.get('sub')
        code_prefix = self.permission_code.replace('lib:', '').split('.')[0]
        field_mapping = {
            'students': 'students',
            'payments': 'fees_plans',
            'fees': 'fees_plans',
            'seats': 'seats',
            'attendance': 'attendance',
            'study': 'attendance',
            'books': 'books',
            'team': 'settings',
            'settings': 'settings',
        }
        field_name = field_mapping.get(code_prefix, code_prefix)

        from apps.accounts.models import StaffPermission
        sp = StaffPermission.objects.filter(staff_id=user_id).first()
        if sp:
            level_value = getattr(sp, field_name, 'No Access')
            allowed_levels = ('View Only', 'Full Access') if self.level == 'view' else ('Full Access',)
            if level_value in allowed_levels:
                return True

        raise PermissionDeniedException(
            f"Required permission '{self.permission_code}' is missing.",
            code='permission_denied',
        )


class BranchScopePermission(permissions.BasePermission):
    """
    Validates X-Branch-Id header against member's authorized branch scope.
    """

    def has_permission(self, request, view):
        payload = getattr(request, 'token_payload', None)
        if not payload or payload.get('aud') != AUDIENCE_LIBRARY:
            return True

        role = payload.get('role', '').lower()
        if role in ('owner', 'library_owner'):
            return True

        branch_header = request.headers.get('X-Branch-Id')
        if not branch_header:
            return True

        branch_ids = payload.get('branch_ids')
        can_manage_all = payload.get('can_manage_all_branches', False) or branch_ids == 'all'

        if branch_header.lower() == 'all':
            if not can_manage_all:
                raise BranchScopeDeniedException(
                    "You do not have permission to view all branches.",
                    code='branch_scope_denied',
                )
            return True

        if can_manage_all:
            return True

        if isinstance(branch_ids, list):
            # Check if requested branch is in allowed list
            if str(branch_header) not in [str(b) for b in branch_ids]:
                raise BranchScopeDeniedException(
                    f"Branch '{branch_header}' is outside your authorized branch scope.",
                    code='branch_scope_denied',
                )

        return True


class StudentStateGate(permissions.BasePermission):
    """
    Gating for student operations:
    - active: full access
    - member_no_plan / expired: requires plan for seat, attendance, books, study -> 402 plan_required
    - pending: restricted private access -> 403 not_member
    - suspended: 403 suspended
    """

    def __init__(self, requires_active_plan: bool = False):
        self.requires_active_plan = requires_active_plan

    def __call__(self):
        return self

    def has_permission(self, request, view):
        if not getattr(request.user, 'is_authenticated', False):
            return False

        from apps.students.models import Student
        enrollment_id = getattr(request, 'token_payload', {}).get('enrollment_id')
        
        student = None
        if enrollment_id:
            student = Student.objects.filter(pk=enrollment_id).first()
        if not student:
            student = Student.objects.filter(user=request.user).first()

        if not student:
            # Not registered in any library
            return True

        status = (student.status or '').lower()
        if status == 'suspended':
            raise PermissionDeniedException(
                "Your student account has been suspended.",
                code='suspended',
            )

        if status == 'pending' and self.requires_active_plan:
            raise PermissionDeniedException(
                "Your enrollment is currently pending approval.",
                code='not_member',
            )

        if self.requires_active_plan:
            # Check if student has an active membership
            has_active_plan = student.memberships.filter(
                status__in=['Active', 'active'],
            ).exists()
            if not has_active_plan and status != 'live':
                raise PlanRequiredException(
                    "An active subscription plan is required for this feature.",
                    code='plan_required',
                )

        return True

