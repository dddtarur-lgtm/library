"""Serializers for Section 6 Public APIs."""
import re
from rest_framework import serializers

from apps.public.models import (
    LibraryAchiever,
    LibraryEnquiry,
    LibraryFacility,
    LibraryPageVisit,
    LibraryReview,
)


class PublicFacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = LibraryFacility
        fields = ['id', 'name', 'icon_key', 'description', 'image_url']


class PublicAchieverSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibraryAchiever
        fields = ['id', 'name', 'photo_url', 'achievement', 'goal', 'year', 'is_featured']


class PublicReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibraryReview
        fields = ['id', 'student_name', 'rating', 'comment', 'created_at']


class PublicEnquirySerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    mobile = serializers.CharField(max_length=15)
    email = serializers.EmailField(required=False, allow_blank=True)
    branch_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    message = serializers.CharField(required=False, allow_blank=True)
    captcha_token = serializers.CharField(required=False, allow_blank=True)

    def validate_mobile(self, value):
        digits = re.sub(r'\D', '', value)
        if len(digits) == 12 and digits.startswith('91'):
            digits = digits[2:]
        if len(digits) != 10:
            raise serializers.ValidationError('Mobile number must be a valid 10-digit Indian number.')
        return digits


class PublicVisitSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    referrer = serializers.CharField(required=False, allow_blank=True)

