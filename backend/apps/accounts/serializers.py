"""Serializers for authentication, user profiles, platform team, and library staff."""
import re
from django.contrib.auth.models import update_last_login
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.settings import api_settings

from utils.validators import validate_password_strength
from .models import DeletionRequest, StaffPermission, User


def _find_user_by_phone(raw_phone: str):
    """Look up a user by exact phone or normalized digits (handles spaces/dashes/+country)."""
    cleaned = raw_phone.strip()
    if not cleaned:
        return None
    user = User.objects.filter(phone=cleaned).first()
    if user:
        return user
    normalized = re.sub(r'[\s\-()]', '', cleaned)
    user = User.objects.filter(phone=normalized).first()
    if user:
        return user
    digits = re.sub(r'\D', '', normalized)
    if len(digits) >= 10:
        for candidate in User.objects.exclude(phone='').only('id', 'phone'):
            cand_digits = re.sub(r'\D', '', candidate.phone)
            if cand_digits == digits or cand_digits.endswith(digits[-10:]):
                return User.objects.get(id=candidate.id)
    return None


class CustomTokenObtainSerializer(TokenObtainPairSerializer):
    """
    Supports sign-in with email, phone number, or generic identifier + password.
    Returns the JWT pair PLUS flat user fields required by NextAuth's authorize():
      {id, name, email, phone, avatar, status, role, library_id, access, refresh}
    """

    phone = serializers.CharField(required=False, allow_blank=True, write_only=True)
    identifier = serializers.CharField(required=False, allow_blank=True, write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Allow email field to be omitted (when using phone/identifier) or hold a phone number
        self.fields[self.username_field] = serializers.CharField(
            required=False, allow_blank=True, write_only=True
        )

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['sub'] = str(user.id)
        token['role'] = user.role
        token['library_id'] = str(user.library_id) if user.library_id else None

        # Audience isolation matching MultiAudienceJWTAuthentication
        if user.role == 'SUPER_ADMIN':
            token['aud'] = 'platform'
        elif user.role == 'STUDENT':
            token['aud'] = 'student'
        else:
            token['aud'] = 'library'

        return token

    def validate(self, attrs):
        raw_email = (attrs.get(self.username_field) or '').strip()
        raw_phone = (attrs.get('phone') or '').strip()
        raw_identifier = (attrs.get('identifier') or '').strip()
        password = attrs.get('password', '')

        # Ignore Swagger UI default placeholder "string" when another field is provided
        if raw_email.lower() == 'string':
            raw_email = ''
        if raw_phone.lower() == 'string':
            raw_phone = ''
        if raw_identifier.lower() == 'string':
            raw_identifier = ''

        lookup_value = raw_email or raw_phone or raw_identifier
        if not lookup_value:
            raise AuthenticationFailed('Email or phone number is required')

        if raw_phone and not raw_identifier and not raw_email:
            user = _find_user_by_phone(raw_phone)
        elif '@' in lookup_value:
            user = User.objects.filter(email=lookup_value.lower()).first()
        else:
            user = (
                _find_user_by_phone(lookup_value)
                or User.objects.filter(email=lookup_value.lower()).first()
            )

        if user is None or not user.check_password(password):
            raise AuthenticationFailed('Invalid email/phone or password')

        if not user.is_active:
            raise PermissionDenied('Your account has been suspended')

        if not user.email_verified:
            raise PermissionDenied('Please verify your email first')

        self.user = user
        refresh = self.get_token(user)

        if api_settings.UPDATE_LAST_LOGIN:
            update_last_login(None, user)

        request = self.context.get('request')
        avatar_url = None
        if user.avatar:
            avatar_url = (
                request.build_absolute_uri(user.avatar.url)
                if request
                else user.avatar.url
            )

        return {
            'id': str(user.id),
            'name': user.name,
            'email': user.email,
            'phone': user.phone,
            'avatar': avatar_url,
            'status': user.status,
            'role': user.role,
            'library_id': str(user.library_id) if user.library_id else None,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }


class RegisterSerializer(serializers.Serializer):
    """Self-registration serializer for Library Owners matching frontend RegisterSchema."""

    firstName = serializers.CharField(min_length=2, max_length=50)
    lastName = serializers.CharField(min_length=2, max_length=50)
    username = serializers.CharField(min_length=3, max_length=50)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password_strength],
    )

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return email

    def validate_username(self, value):
        username = value.strip().lower()
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError('This username is already taken.')
        return username

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['firstName'].strip(),
            last_name=validated_data['lastName'].strip(),
            username=validated_data['username'],
            phone=validated_data.get('phone', '').strip(),
            role='LIBRARY_OWNER',
            email_verified=False,
        )


class ForgotPasswordSerializer(serializers.Serializer):
    """Request body for forgot-password endpoint."""

    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()

    def validate_username(self, value):
        cleaned = (value or '').strip().lower()
        return cleaned or None


class VerifyEmailSerializer(serializers.Serializer):
    """Request body for OTP verification via email or phone."""

    email = serializers.EmailField(required=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_username(self, value):
        cleaned = (value or '').strip().lower()
        return cleaned or None

    def validate(self, attrs):
        if not attrs.get('email') and not attrs.get('phone', '').strip():
            raise serializers.ValidationError('Either email or phone is required.')
        return attrs


class ResendOTPSerializer(serializers.Serializer):
    """Request body for resending verification OTP via email or phone."""

    email = serializers.EmailField(required=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_username(self, value):
        cleaned = (value or '').strip().lower()
        return cleaned or None

    def validate(self, attrs):
        if not attrs.get('email') and not attrs.get('phone', '').strip():
            raise serializers.ValidationError('Either email or phone is required.')
        return attrs


class ResetPasswordSerializer(serializers.Serializer):
    """Request body for resetting password with a valid reset token or OTP."""

    email = serializers.EmailField(required=False)
    token = serializers.CharField(required=False, default='')
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password_strength],
    )
    confirmPassword = serializers.CharField(write_only=True, required=False)

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'otp' in data and not data.get('token'):
            data['token'] = data['otp']
        if 'new_password' in data and 'password' not in data:
            data['password'] = data['new_password']
        if 'newPassword' in data and 'password' not in data:
            data['password'] = data['newPassword']
        if 'confirm_password' in data and 'confirmPassword' not in data:
            data['confirmPassword'] = data['confirm_password']
        if 'confirmPassword' not in data and 'password' in data:
            data['confirmPassword'] = data['password']
        return super().to_internal_value(data)

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirmPassword'):
            raise serializers.ValidationError(
                {'confirmPassword': 'Passwords do not match.'}
            )
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    """Request body for authenticated password change."""

    oldPassword = serializers.CharField(write_only=True)
    newPassword = serializers.CharField(
        write_only=True,
        validators=[validate_password_strength],
    )
    confirmPassword = serializers.CharField(write_only=True, required=False)

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'old_password' in data and 'oldPassword' not in data:
            data['oldPassword'] = data['old_password']
        if 'new_password' in data and 'newPassword' not in data:
            data['newPassword'] = data['new_password']
        if 'confirm_password' in data and 'confirmPassword' not in data:
            data['confirmPassword'] = data['confirm_password']
        if 'confirmPassword' not in data and 'newPassword' in data:
            data['confirmPassword'] = data['newPassword']
        return super().to_internal_value(data)

    def validate(self, attrs):
        if attrs.get('newPassword') != attrs.get('confirmPassword'):
            raise serializers.ValidationError(
                {'confirmPassword': 'New passwords do not match.'}
            )
        return attrs


class LogoutSerializer(serializers.Serializer):
    """Request body for blacklisting a refresh token on logout."""

    refresh = serializers.CharField()


class UserProfileSerializer(serializers.ModelSerializer):
    """Authenticated user's own profile serializer (GET/PATCH /me/)."""

    name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id',
            'name',
            'first_name',
            'middle_name',
            'last_name',
            'username',
            'email',
            'avatar',
            'preferred_language',
            'status',
            'role',
            'phone',
            'library',
            'email_verified',
            'deleted_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'name',
            'email',
            'avatar',
            'role',
            'library',
            'email_verified',
            'deleted_at',
            'created_at',
            'updated_at',
        ]


class AvatarUploadSerializer(serializers.ModelSerializer):
    """Multipart avatar upload serializer."""

    class Meta:
        model = User
        fields = ['avatar']


class StaffPermissionSerializer(serializers.ModelSerializer):
    """Granular module permissions for library staff / sub-admins."""

    def to_internal_value(self, data):
        normalized = {}
        for k, v in data.items():
            if isinstance(v, bool) and k != 'can_view_revenue':
                normalized[k] = 'Full Access' if v else 'No Access'
            elif isinstance(v, str):
                v_clean = v.replace('_', ' ').title()
                if v_clean in ('Full Access', 'View Only', 'No Access'):
                    normalized[k] = v_clean
                else:
                    normalized[k] = v
            else:
                normalized[k] = v
        return super().to_internal_value(normalized)

    class Meta:
        model = StaffPermission
        fields = [
            'students',
            'fees_plans',
            'seats',
            'attendance',
            'books',
            'settings',
            'security',
            'can_view_revenue',
        ]


class PlatformUserSerializer(serializers.ModelSerializer):
    """Serializer for Super Admin platform team management."""

    name = serializers.ReadOnlyField()
    password = serializers.CharField(
        write_only=True,
        required=False,
        validators=[validate_password_strength],
    )

    class Meta:
        model = User
        fields = [
            'id',
            'name',
            'first_name',
            'last_name',
            'username',
            'email',
            'role',
            'status',
            'phone',
            'is_active',
            'email_verified',
            'password',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'name', 'email_verified', 'created_at', 'updated_at']

    def validate_email(self, value):
        return value.strip().lower()

    def validate_username(self, value):
        cleaned = (value or '').strip().lower()
        return cleaned or None

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        validated_data.setdefault('role', 'SUPER_ADMIN')
        validated_data.setdefault('email_verified', True)
        if validated_data['role'] == 'SUPER_ADMIN':
            validated_data.setdefault('is_staff', True)
        return User.objects.create_user(password=password, **validated_data)


class LibraryStaffSerializer(serializers.ModelSerializer):
    """Serializer for library-scoped staff and sub-admins."""

    name = serializers.ReadOnlyField()
    permissions = StaffPermissionSerializer(source='staff_permission', required=False)
    password = serializers.CharField(
        write_only=True,
        required=False,
        validators=[validate_password_strength],
    )

    class Meta:
        model = User
        fields = [
            'id',
            'name',
            'first_name',
            'last_name',
            'username',
            'email',
            'role',
            'status',
            'phone',
            'library',
            'assigned_branches',
            'is_active',
            'email_verified',
            'permissions',
            'password',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'name',
            'library',
            'email_verified',
            'created_at',
            'updated_at',
        ]

    def validate_email(self, value):
        return value.strip().lower()

    def validate_username(self, value):
        cleaned = (value or '').strip().lower()
        return cleaned or None

    def validate_role(self, value):
        if value not in ('SUB_ADMIN', 'STAFF'):
            raise serializers.ValidationError(
                'Library staff role must be SUB_ADMIN or STAFF.'
            )
        return value

    def validate_assigned_branches(self, branches):
        request = self.context.get('request')
        if (
            branches
            and request
            and request.user.is_authenticated
            and request.user.role != 'SUPER_ADMIN'
        ):
            user_lib_id = request.user.library_id or getattr(
                getattr(request.user, 'owned_library', None), 'id', None
            )
            for branch in branches:
                if branch.library_id != user_lib_id:
                    raise serializers.ValidationError(
                        'All assigned branches must belong to your library.'
                    )
        return branches

    def create(self, validated_data):
        permissions_data = validated_data.pop('staff_permission', None)
        assigned_branches = validated_data.pop('assigned_branches', [])
        password = validated_data.pop('password', None)
        validated_data.setdefault('email_verified', True)

        user = User.objects.create_user(password=password, **validated_data)
        if assigned_branches:
            user.assigned_branches.set(assigned_branches)
        StaffPermission.objects.create(staff=user, **(permissions_data or {}))
        return user

    def update(self, instance, validated_data):
        permissions_data = validated_data.pop('staff_permission', None)
        assigned_branches = validated_data.pop('assigned_branches', None)
        password = validated_data.pop('password', None)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        if password:
            instance.set_password(password)
        instance.save()

        if assigned_branches is not None:
            instance.assigned_branches.set(assigned_branches)

        if permissions_data is not None:
            perm_obj, _ = StaffPermission.objects.get_or_create(staff=instance)
            for attr, val in permissions_data.items():
                setattr(perm_obj, attr, val)
            perm_obj.save()

        return instance


class StudentRegisterSerializer(serializers.Serializer):
    """Self-registration serializer for Students linked to a Library."""

    firstName = serializers.CharField(min_length=2, max_length=50)
    lastName = serializers.CharField(min_length=2, max_length=50)
    username = serializers.CharField(min_length=3, max_length=50, required=False, allow_blank=True)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    gender = serializers.ChoiceField(
        choices=['Male', 'Female', 'Other'], default='Male'
    )
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password_strength],
    )
    library_code = serializers.CharField(required=False, allow_blank=True)
    library_id = serializers.UUIDField(required=False)
    branch_id = serializers.UUIDField(required=False)

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'first_name' in data and 'firstName' not in data:
            data['firstName'] = data['first_name']
        if 'last_name' in data and 'lastName' not in data:
            data['lastName'] = data['last_name']
        return super().to_internal_value(data)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return email

    def validate_username(self, value):
        username = value.strip().lower()
        if username and User.objects.filter(username=username).exists():
            raise serializers.ValidationError('This username is already taken.')
        return username or None

    def validate(self, attrs):
        from apps.libraries.models import Branch, Library

        library = None
        if attrs.get('library_id'):
            library = Library.objects.filter(id=attrs['library_id']).first()
        elif attrs.get('library_code'):
            library = Library.objects.filter(
                code=attrs['library_code'].strip().upper()
            ).first()
        if library is None:
            raise serializers.ValidationError(
                {'library_code': 'Valid library_code or library_id is required.'}
            )
        attrs['library'] = library

        branch = None
        if attrs.get('branch_id'):
            branch = Branch.objects.filter(
                id=attrs['branch_id'], library=library
            ).first()
            if branch is None:
                raise serializers.ValidationError(
                    {'branch_id': 'Branch does not belong to the specified library.'}
                )
        else:
            branch = Branch.objects.filter(library=library, is_main=True).first()
        attrs['branch'] = branch
        return attrs

    def create(self, validated_data):
        from apps.students.models import Student

        library = validated_data['library']
        branch = validated_data['branch']
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['firstName'].strip(),
            last_name=validated_data['lastName'].strip(),
            username=validated_data.get('username'),
            phone=validated_data['phone'].strip(),
            role='STUDENT',
            library=library,
            email_verified=False,
        )
        Student.objects.create(
            user=user,
            library=library,
            branch=branch,
            name=user.name,
            email=user.email,
            phone=validated_data['phone'].strip(),
            gender=validated_data.get('gender', 'Male'),
            status='Pending',
        )
        return user


class DeletionRequestSerializer(serializers.ModelSerializer):
    """Serializer for account, library, and student deletion requests."""

    requested_by_email = serializers.ReadOnlyField(source='requested_by.email')
    library_name = serializers.ReadOnlyField(source='library.name')
    student_code = serializers.ReadOnlyField(source='student.student_code')

    class Meta:
        model = DeletionRequest
        fields = [
            'id',
            'target_type',
            'requested_by',
            'requested_by_email',
            'library',
            'library_name',
            'student',
            'student_code',
            'reason',
            'status',
            'review_notes',
            'reviewed_by',
            'reviewed_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'target_type',
            'requested_by',
            'library',
            'student',
            'status',
            'review_notes',
            'reviewed_by',
            'reviewed_at',
            'created_at',
            'updated_at',
        ]


class DeletionRequestActionSerializer(serializers.Serializer):
    """Optional review notes for approving or rejecting a deletion request."""

    review_notes = serializers.CharField(required=False, allow_blank=True, default='')

