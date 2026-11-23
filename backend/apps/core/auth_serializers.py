"""Serializers for Section 7 Authentication APIs."""
import re
from rest_framework import serializers


class OTPRequestSerializer(serializers.Serializer):
    mobile = serializers.CharField(max_length=15)
    purpose = serializers.ChoiceField(
        choices=['login', 'signup', 'library_signup', 'reset_password', 'two_step']
    )
    channel = serializers.ChoiceField(
        choices=['sms', 'whatsapp'],
        default='sms',
        required=False,
    )
    captcha_token = serializers.CharField(required=False, allow_blank=True)

    def validate_mobile(self, value):
        digits = re.sub(r'\D', '', value)
        if len(digits) == 12 and digits.startswith('91'):
            digits = digits[2:]
        if len(digits) != 10:
            raise serializers.ValidationError('Mobile number must be a valid 10-digit Indian number.')
        return digits


class OTPVerifySerializer(serializers.Serializer):
    mobile = serializers.CharField(max_length=15)
    code = serializers.CharField(max_length=6, min_length=4)
    purpose = serializers.ChoiceField(
        choices=['login', 'signup', 'library_signup', 'reset_password', 'two_step']
    )
    device = serializers.DictField(required=False, default=dict)

    def validate_mobile(self, value):
        digits = re.sub(r'\D', '', value)
        if len(digits) == 12 and digits.startswith('91'):
            digits = digits[2:]
        if len(digits) != 10:
            raise serializers.ValidationError('Mobile number must be a valid 10-digit Indian number.')
        return digits


class GuardianSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    mobile = serializers.CharField(max_length=20, required=False, allow_blank=True)
    relation = serializers.CharField(max_length=50, required=False, allow_blank=True)


class StudentSignupSerializer(serializers.Serializer):
    signup_token = serializers.CharField()
    first_name = serializers.CharField(max_length=100)
    middle_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=100)
    gender = serializers.ChoiceField(choices=['Male', 'Female', 'Other'])
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    preferred_language = serializers.CharField(max_length=10, default='en')
    exam_goal = serializers.CharField(max_length=255, required=False, allow_blank=True)
    guardian = GuardianSerializer(required=False)
    referral_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    photo_file_id = serializers.CharField(required=False, allow_blank=True)


class TokenRefreshSerializer(serializers.Serializer):
    refresh_token = serializers.CharField()
    device_id = serializers.CharField(required=False, allow_blank=True)


class LogoutSerializer(serializers.Serializer):
    refresh_token = serializers.CharField(required=False, allow_blank=True)
    all_devices = serializers.BooleanField(default=False, required=False)


class LibraryOwnerDataSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)


class LibraryEntityDataSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=100)
    area = serializers.CharField(max_length=100, required=False, allow_blank=True)
    address_line1 = serializers.CharField(max_length=255)
    pin_code = serializers.CharField(max_length=20)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    contact_number = serializers.CharField(max_length=20)
    owner_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    logo_file_id = serializers.CharField(required=False, allow_blank=True)
    photo_file_ids = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )


class LibraryRegisterSerializer(serializers.Serializer):
    signup_token = serializers.CharField()
    owner = LibraryOwnerDataSerializer()
    library = LibraryEntityDataSerializer()
    accept_terms = serializers.BooleanField()

    def validate_accept_terms(self, value):
        if not value:
            raise serializers.ValidationError('You must accept the terms of service to register.')
        return value


class LibraryLoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(write_only=True)
    device = serializers.DictField(required=False, default=dict)


class LibrarySelectOrgSerializer(serializers.Serializer):
    select_token = serializers.CharField()
    org_id = serializers.CharField()


class PlatformLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class TwoStepVerifySerializer(serializers.Serializer):
    two_step_token = serializers.CharField()
    code = serializers.CharField(max_length=16, min_length=4)
    trust_device = serializers.BooleanField(default=False, required=False)


class PasswordForgotSerializer(serializers.Serializer):
    identifier = serializers.CharField()


class PasswordResetSerializer(serializers.Serializer):
    token = serializers.CharField(required=False, allow_blank=True)
    identifier = serializers.CharField(required=False, allow_blank=True)
    otp = serializers.CharField(required=False, allow_blank=True)
    new_password = serializers.CharField(min_length=8)

    def validate(self, attrs):
        if not attrs.get('token') and not (attrs.get('identifier') and attrs.get('otp')):
            raise serializers.ValidationError('Provide either reset token or identifier and OTP.')
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)


class TwoStepEnableSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=['totp', 'sms'], default='totp')


class TwoStepConfirmSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6, min_length=4)


class TwoStepDisableSerializer(serializers.Serializer):
    password = serializers.CharField()
    code = serializers.CharField(max_length=6, min_length=4)


class InvitationAcceptSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(min_length=8)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    accept_terms = serializers.BooleanField(default=True)

