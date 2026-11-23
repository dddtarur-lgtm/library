"""Serializers for Section 9 Library Panel APIs."""
from rest_framework import serializers

from apps.libraries.models import AdminInbox, Branch, Library, LibrarySettings


class LibraryProfileUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, max_length=255)
    legal_name = serializers.CharField(required=False, max_length=255, allow_blank=True)
    tagline = serializers.CharField(required=False, max_length=255, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    established_year = serializers.IntegerField(required=False, allow_null=True)
    owner_name = serializers.CharField(required=False, max_length=255, allow_blank=True)
    contact_number = serializers.CharField(required=False, max_length=20)
    whatsapp_number = serializers.CharField(required=False, max_length=20, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    website = serializers.CharField(required=False, allow_blank=True)
    opening_time = serializers.CharField(required=False, allow_blank=True)
    closing_time = serializers.CharField(required=False, allow_blank=True)
    weekly_off = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    social_links = serializers.DictField(required=False, default=dict)
    gstin = serializers.CharField(required=False, max_length=20, allow_blank=True)
    default_language = serializers.CharField(required=False, max_length=10)


class StudentRulesSerializer(serializers.Serializer):
    join_approval = serializers.ChoiceField(choices=['manual', 'auto'], default='manual')
    required_documents = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    seat_release_grace_days = serializers.IntegerField(default=3)
    branch_change_requests_enabled = serializers.BooleanField(default=True)
    leave_requests_enabled = serializers.BooleanField(default=True)


class AppConfigSerializer(serializers.Serializer):
    access_gating_enabled = serializers.BooleanField(default=True)
    expiry_dialog_title = serializers.CharField(default='Plan Expired')
    expiry_dialog_message = serializers.CharField(default='Your plan has expired. Please renew to keep your seat.')
    locked_dialog_title = serializers.CharField(default='Library Maintenance')
    locked_dialog_message = serializers.CharField(default='Library is under maintenance.')
    study_enabled = serializers.BooleanField(default=True)
    max_break_minutes = serializers.IntegerField(default=45)
    leaderboard_enabled = serializers.BooleanField(default=True)


class BranchCreateUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    address = serializers.CharField()
    phone = serializers.CharField(max_length=20)
    is_main = serializers.BooleanField(default=False)
    floors_count = serializers.IntegerField(default=1)
    allowed_qr_radius_meters = serializers.IntegerField(default=100)
    lat = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    lng = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    facilities = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    operating_hours = serializers.DictField(required=False, default=dict)


class TeamMemberCreateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    mobile = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=['admin', 'sub_admin', 'staff'])
    branch_ids = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    can_manage_all_branches = serializers.BooleanField(default=False)
    can_view_revenue = serializers.BooleanField(default=False)
    max_discount_percent = serializers.IntegerField(default=10)


class TeamPermissionsUpdateSerializer(serializers.Serializer):
    grants = serializers.ListField(child=serializers.DictField())
    template_id = serializers.CharField(required=False, allow_blank=True)
    reason = serializers.CharField(required=False, allow_blank=True)

