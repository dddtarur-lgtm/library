"""Views for authentication, user profiles, platform team, and library staff."""
from django.db import transaction
from django.utils import timezone
from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .emails import (
    send_password_reset_email,
    send_staff_invite_email,
    send_verification_otp_email,
)
from .models import DeletionRequest, StaffPermission, User
from .permissions import IsLibraryOwner, IsSubAdminOrAbove, IsSuperAdmin
from apps.billing.services import check_plan_quota
from .serializers import (
    AvatarUploadSerializer,
    ChangePasswordSerializer,
    CustomTokenObtainSerializer,
    DeletionRequestActionSerializer,
    DeletionRequestSerializer,
    ForgotPasswordSerializer,
    LibraryStaffSerializer,
    LogoutSerializer,
    PlatformUserSerializer,
    RegisterSerializer,
    ResendOTPSerializer,
    ResetPasswordSerializer,
    StaffPermissionSerializer,
    StudentRegisterSerializer,
    UserProfileSerializer,
    VerifyEmailSerializer,
)
from .tokens import (
    can_resend_otp,
    clear_email_otp,
    clear_password_reset_token,
    set_email_otp,
    set_password_reset_token,
    verify_email_otp,
    verify_password_reset_token,
)


@extend_schema(
    tags=['Auth'],
    examples=[
        OpenApiExample(
            'Sign in with Email',
            value={'email': 'admin@lmsplatform.com', 'password': 'StrongPass123'},
            request_only=True,
        ),
        OpenApiExample(
            'Sign in with Phone',
            value={'phone': '+919876543210', 'password': 'StrongPass123'},
            request_only=True,
        ),
    ],
)
class SignInView(TokenObtainPairView):
    """Authenticate user with email & password and return NextAuth-compatible JWT payload."""

    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainSerializer


@extend_schema(tags=['Auth'], request=RegisterSerializer)
class RegisterView(APIView):
    """Self-register a new Library Owner account and send a 6-digit verification OTP."""

    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        otp = set_email_otp(user)
        send_verification_otp_email(user, otp)
        return Response(
            {
                'id': str(user.id),
                'name': user.name,
                'email': user.email,
                'phone': user.phone,
                'message': 'Registration successful. Please verify your email.',
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Auth'])
class CustomTokenRefreshView(TokenRefreshView):
    """Rotate refresh token and return a new access/refresh pair."""

    permission_classes = [AllowAny]


@extend_schema(tags=['Auth'], request=ForgotPasswordSerializer)
class ForgotPasswordView(APIView):
    """Generate and email a password reset token & OTP to the user."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.filter(email=email, is_active=True).first()
        if user:
            reset_token = set_password_reset_token(user)
            otp = set_email_otp(user)
            send_password_reset_email(user, reset_token, otp=otp)
        return Response(
            {
                'message': (
                    'If an account with that email exists, '
                    'a password reset email has been sent.'
                )
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Auth'], request=VerifyEmailSerializer)
class VerifyEmailView(APIView):
    """Verify user email/phone using the 6-digit OTP (or static 123456 in dev mode)."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data.get('email')
        phone = serializer.validated_data.get('phone', '').strip()
        otp = serializer.validated_data['otp']

        if email:
            user = User.objects.filter(email=email).first()
        else:
            user = User.objects.filter(phone=phone).first()
        if not user:
            return Response(
                {'message': 'Invalid OTP'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_valid, error_code = verify_email_otp(user, otp)
        if not is_valid:
            message = (
                'OTP has expired. Please request a new one'
                if error_code == 'expired'
                else 'Invalid OTP'
            )
            return Response({'message': message}, status=status.HTTP_400_BAD_REQUEST)

        user.email_verified = True
        user.save(update_fields=['email_verified'])
        clear_email_otp(user)
        return Response(
            {'message': 'Email verified', 'verified': True},
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Auth'], request=ResendOTPSerializer)
class ResendOTPView(APIView):
    """Resend verification OTP, rate-limited to once every 60 seconds."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data.get('email')
        phone = serializer.validated_data.get('phone', '').strip()

        if email:
            user = User.objects.filter(email=email).first()
        else:
            user = User.objects.filter(phone=phone).first()
        if user:
            if not can_resend_otp(user):
                return Response(
                    {'message': 'Please wait 60 seconds before requesting another OTP'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            otp = set_email_otp(user)
            send_verification_otp_email(user, otp)

        return Response(
            {'message': 'Verification OTP sent'},
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Auth'], request=ResetPasswordSerializer)
class ResetPasswordView(APIView):
    """Reset user password using a valid password reset token."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        raw_token = serializer.validated_data.get('token', '')
        new_password = serializer.validated_data['password']
        email = serializer.validated_data.get('email')

        user = None
        error_code = 'invalid'
        if email and raw_token:
            u = User.objects.filter(email=email, is_active=True).first()
            if u and verify_email_otp(u, raw_token):
                user = u
        if not user:
            user, error_code = verify_password_reset_token(User, raw_token)
        if not user:
            message = (
                'Token has expired'
                if error_code == 'expired'
                else 'Token is invalid or has been used'
            )
            return Response({'message': message}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=['password'])
        clear_password_reset_token(user)
        return Response(
            {'message': 'Password reset successfully'},
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Auth'], request=LogoutSerializer)
class LogoutView(APIView):
    """Blacklist the provided refresh token on logout."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            token = RefreshToken(serializer.validated_data['refresh'])
            token.blacklist()
        except TokenError:
            return Response(
                {'message': 'Token is invalid or has been used'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['Auth'], responses=UserProfileSerializer)
class MeView(APIView):
    """Retrieve or partially update the authenticated user's profile."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(request=UserProfileSerializer, responses=UserProfileSerializer)
    def patch(self, request):
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(request=UserProfileSerializer, responses=UserProfileSerializer)
    def put(self, request):
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=False,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request):
        """Soft-deactivate the authenticated user's own account."""
        user = request.user
        user.is_active = False
        user.status = 'OFFLINE'
        user.deleted_at = timezone.now()
        user.save(update_fields=['is_active', 'status', 'deleted_at', 'updated_at'])
        return Response(
            {'message': 'Account deactivated successfully'},
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Auth'], request=ChangePasswordSerializer)
class ChangePasswordView(APIView):
    """Change password for the currently authenticated user."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data['oldPassword']):
            return Response(
                {'message': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.user.set_password(serializer.validated_data['newPassword'])
        request.user.save(update_fields=['password'])
        return Response(
            {'message': 'Password changed successfully'},
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Auth'], request=AvatarUploadSerializer)
class AvatarUploadView(APIView):
    """Upload or replace the authenticated user's avatar image."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = AvatarUploadSerializer(request.user, data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        avatar_url = (
            request.build_absolute_uri(user.avatar.url) if user.avatar else None
        )
        return Response({'avatar_url': avatar_url}, status=status.HTTP_200_OK)


@extend_schema(tags=['Platform Users'])
class PlatformUserViewSet(viewsets.ModelViewSet):
    """CRUD and password reset for Super Admin platform team members."""

    permission_classes = [IsSuperAdmin]
    serializer_class = PlatformUserSerializer
    queryset = User.objects.filter(role='SUPER_ADMIN').order_by('-created_at')
    filterset_fields = ['role', 'status', 'is_active']
    search_fields = ['first_name', 'last_name', 'email', 'username']

    def perform_create(self, serializer):
        user = serializer.save()
        if not user.has_usable_password():
            reset_token = set_password_reset_token(user)
            send_staff_invite_email(user, self.request.user, reset_token=reset_token)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=['is_active'])

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        """Force-send a password reset email to a platform user."""
        user = self.get_object()
        reset_token = set_password_reset_token(user)
        send_password_reset_email(user, reset_token)
        return Response(
            {'message': 'Password reset email sent'},
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=['Library Staff'])
class LibraryStaffViewSet(viewsets.ModelViewSet):
    """Manage library-scoped staff and sub-admins with granular permissions."""

    serializer_class = LibraryStaffSerializer
    filterset_fields = ['role', 'status', 'is_active']
    search_fields = ['first_name', 'last_name', 'email', 'username']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsSubAdminOrAbove()]
        return [IsLibraryOwner()]

    def get_queryset(self):
        user = self.request.user
        base_qs = User.objects.filter(role__in=['SUB_ADMIN', 'STAFF']).select_related(
            'staff_permission', 'library'
        )
        if user.role == 'SUPER_ADMIN':
            return base_qs
        if user.library_id is None:
            return base_qs.none()
        return base_qs.filter(library_id=user.library_id)

    def perform_create(self, serializer):
        library = self.request.user.library or getattr(
            self.request.user, 'owned_library', None
        )
        if library is None:
            raise ValidationError({'library': 'No library associated with this account.'})
        check_plan_quota(library, 'staff')
        staff = serializer.save(library=library)
        if not staff.has_usable_password():
            reset_token = set_password_reset_token(staff)
            send_staff_invite_email(staff, self.request.user, reset_token=reset_token)

    @action(detail=False, methods=['post'], url_path='invite')
    def invite_new(self, request):
        """Create and invite a new staff member."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=['is_active'])

    @action(detail=True, methods=['post'])
    def invite(self, request, pk=None):
        """Re-send invitation email to a library staff member."""
        staff = self.get_object()
        reset_token = set_password_reset_token(staff)
        send_staff_invite_email(staff, request.user, reset_token=reset_token)
        return Response(
            {'message': 'Invitation email sent'},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get', 'patch'])
    def permissions(self, request, pk=None):
        """Get or update granular module permissions for a staff member."""
        staff = self.get_object()
        perm_obj, _ = StaffPermission.objects.get_or_create(staff=staff)
        if request.method == 'GET':
            return Response(StaffPermissionSerializer(perm_obj).data)

        serializer = StaffPermissionSerializer(
            perm_obj, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=['Auth'], request=StudentRegisterSerializer)
class StudentRegisterView(APIView):
    """Self-register a new Student account linked to a Library and send a 6-digit OTP."""

    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = StudentRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        otp = set_email_otp(user)
        send_verification_otp_email(user, otp)
        return Response(
            {
                'id': str(user.id),
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'student_id': str(user.student_profile.id),
                'student_code': user.student_profile.student_code,
                'message': 'Student registration successful. Please verify your email.',
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Auth'])
class AccountDeletionRequestView(APIView):
    """Submit or view account deletion requests for the authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = DeletionRequest.objects.filter(
            requested_by=request.user, target_type='ACCOUNT'
        )
        return Response(DeletionRequestSerializer(qs, many=True).data)

    @extend_schema(request=DeletionRequestSerializer, responses=DeletionRequestSerializer)
    def post(self, request):
        if DeletionRequest.objects.filter(
            requested_by=request.user, target_type='ACCOUNT', status='Pending'
        ).exists():
            return Response(
                {'message': 'You already have a pending account deletion request.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = DeletionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(
            requested_by=request.user,
            target_type='ACCOUNT',
            library=request.user.library,
        )
        return Response(
            DeletionRequestSerializer(obj).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Platform Users'])
class PlatformDeletionRequestViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Super Admin review workflow for account, library, and student deletion requests."""

    permission_classes = [IsSuperAdmin]
    serializer_class = DeletionRequestSerializer
    queryset = DeletionRequest.objects.select_related(
        'requested_by', 'library', 'student', 'reviewed_by'
    ).all()
    filterset_fields = ['target_type', 'status']
    search_fields = ['requested_by__email', 'library__name', 'reason']

    @extend_schema(request=DeletionRequestActionSerializer)
    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """Approve deletion request and deactivate/close the target entity."""
        del_req = self.get_object()
        if del_req.status != 'Pending':
            return Response(
                {'message': 'Deletion request has already been processed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = DeletionRequestActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            now = timezone.now()
            if del_req.target_type == 'ACCOUNT':
                del_req.requested_by.is_active = False
                del_req.requested_by.deleted_at = now
                del_req.requested_by.save(update_fields=['is_active', 'deleted_at', 'updated_at'])
            elif del_req.target_type == 'LIBRARY' and del_req.library:
                del_req.library.library_status = 'Closed'
                del_req.library.status_reason = del_req.reason
                del_req.library.closed_at = now
                del_req.library.deleted_at = now
                del_req.library.save(
                    update_fields=['library_status', 'status_reason', 'closed_at', 'deleted_at', 'updated_at']
                )
            elif del_req.target_type == 'STUDENT' and del_req.student:
                del_req.student.is_deleted = True
                del_req.student.deleted_at = now
                del_req.student.status = 'Suspended'
                del_req.student.save(update_fields=['is_deleted', 'deleted_at', 'status', 'updated_at'])
                if del_req.student.user:
                    del_req.student.user.is_active = False
                    del_req.student.user.deleted_at = now
                    del_req.student.user.save(update_fields=['is_active', 'deleted_at', 'updated_at'])

            del_req.status = 'Approved'
            del_req.review_notes = serializer.validated_data.get('review_notes', '')
            del_req.reviewed_by = request.user
            del_req.reviewed_at = timezone.now()
            del_req.save(
                update_fields=[
                    'status',
                    'review_notes',
                    'reviewed_by',
                    'reviewed_at',
                    'updated_at',
                ]
            )

        return Response(
            {
                'message': 'Deletion request approved.',
                'deletion_request': DeletionRequestSerializer(del_req).data,
            },
            status=status.HTTP_200_OK,
        )

    @extend_schema(request=DeletionRequestActionSerializer)
    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        """Reject a pending deletion request."""
        del_req = self.get_object()
        if del_req.status != 'Pending':
            return Response(
                {'message': 'Deletion request has already been processed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = DeletionRequestActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        del_req.status = 'Rejected'
        del_req.review_notes = serializer.validated_data.get('review_notes', '')
        del_req.reviewed_by = request.user
        del_req.reviewed_at = timezone.now()
        del_req.save(
            update_fields=[
                'status',
                'review_notes',
                'reviewed_by',
                'reviewed_at',
                'updated_at',
            ]
        )
        return Response(
            {
                'message': 'Deletion request rejected.',
                'deletion_request': DeletionRequestSerializer(del_req).data,
            },
            status=status.HTTP_200_OK,
        )

