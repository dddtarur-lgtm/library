"""Serializers for Section 8.1 and 8.2 Student APIs."""
from rest_framework import serializers

from apps.students.models import BranchChangeRequest, Student, StudentDevice, StudentLeaveRequest


class StudentProfileUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, max_length=100)
    middle_name = serializers.CharField(required=False, max_length=100, allow_blank=True)
    last_name = serializers.CharField(required=False, max_length=100)
    gender = serializers.ChoiceField(choices=['Male', 'Female', 'Other'], required=False)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    preferred_language = serializers.CharField(required=False, max_length=10)
    exam_goal = serializers.CharField(required=False, max_length=255, allow_blank=True)
    guardian = serializers.DictField(required=False)
    address = serializers.CharField(required=False, allow_blank=True)
    photo_file_id = serializers.CharField(required=False, allow_blank=True)


class StudentDeviceSerializer(serializers.Serializer):
    platform = serializers.ChoiceField(choices=['android', 'ios', 'web'])
    device_id = serializers.CharField(max_length=255)
    push_token = serializers.CharField(max_length=500)


class StudentSettingsSerializer(serializers.Serializer):
    notifications = serializers.DictField(required=False)
    language = serializers.CharField(required=False, max_length=10)


class StudentJoinRequestCreateSerializer(serializers.Serializer):
    org_id = serializers.CharField()
    branch_id = serializers.CharField()
    exam_goal = serializers.CharField(required=False, allow_blank=True)
    guardian = serializers.DictField(required=False)
    message = serializers.CharField(required=False, allow_blank=True)
    document_file_ids = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )


class BranchChangeRequestCreateSerializer(serializers.Serializer):
    to_branch_id = serializers.CharField()
    reason = serializers.CharField(required=False, allow_blank=True)


class LeaveRequestCreateSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)


class AccountDeletionRequestSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)

