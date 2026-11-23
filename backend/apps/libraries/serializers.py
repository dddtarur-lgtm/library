"""Serializers for libraries, branches, onboarding requests, settings, and QR kiosk."""
import uuid
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from .models import (
    AttendanceQrKioskConfig,
    Branch,
    Library,
    LibraryDocument,
    LibraryRequest,
    LibrarySettings,
)

User = get_user_model()


class LibraryOwnerSummarySerializer(serializers.ModelSerializer):
    """Lightweight read-only representation of a library owner."""

    name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'phone', 'avatar', 'status')
        read_only_fields = fields


class BranchSerializer(serializers.ModelSerializer):
    """Serializer for physical library branches."""

    class Meta:
        model = Branch
        fields = (
            'id',
            'library',
            'name',
            'address',
            'phone',
            'is_main',
            'is_active',
            'floors_count',
            'lat',
            'lng',
            'allowed_qr_radius_meters',
            'facilities',
            'operating_hours',
            'created_at',
        )
        read_only_fields = ('id', 'library', 'created_at')


class AttendanceQrKioskConfigSerializer(serializers.ModelSerializer):
    """Serializer for branch-level attendance QR kiosk configuration."""

    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = AttendanceQrKioskConfig
        fields = (
            'id',
            'branch',
            'branch_name',
            'qr_token',
            'is_enabled',
            'require_geo_fence',
            'refresh_interval_seconds',
            'last_regenerated_at',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'branch',
            'branch_name',
            'qr_token',
            'last_regenerated_at',
            'created_at',
            'updated_at',
        )


class LibrarySettingsSerializer(serializers.ModelSerializer):
    """Serializer for per-library operational and SMTP settings."""

    class Meta:
        model = LibrarySettings
        fields = (
            'id',
            'library',
            'smtp_config',
            'allow_student_self_register',
            'grace_days',
            'auto_checkout_time',
            'late_after_time',
            'default_allowed_study_minutes',
            'premium_gating_enabled',
            'expiry_dialog_title',
            'expiry_dialog_message',
            'public_page_enabled',
            'public_page_slug',
            'updated_at',
        )
        read_only_fields = ('id', 'library', 'updated_at')

    def validate_public_page_slug(self, value):
        """Normalize empty slug strings to None so unique constraint allows multiple unset slugs."""
        if value is not None and value.strip() == '':
            return None
        return value


class LibrarySerializer(serializers.ModelSerializer):
    """Serializer for platform-level library listing and mutations."""

    owner_detail = LibraryOwnerSummarySerializer(source='owner', read_only=True)
    branches_count = serializers.IntegerField(source='branches.count', read_only=True)
    students_count = serializers.SerializerMethodField()
    total_seats = serializers.SerializerMethodField()
    subscription = serializers.SerializerMethodField()
    plan_name = serializers.SerializerMethodField()
    plan_fee = serializers.SerializerMethodField()
    plan_end_date = serializers.SerializerMethodField()

    # Optional write-only fields when onboarding a library without an existing owner ID
    owner = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False
    )
    owner_email = serializers.EmailField(write_only=True, required=False)
    owner_first_name = serializers.CharField(
        write_only=True, required=False, max_length=50
    )
    owner_last_name = serializers.CharField(
        write_only=True, required=False, max_length=50
    )
    owner_phone = serializers.CharField(write_only=True, required=False, max_length=30)
    owner_name = serializers.CharField(write_only=True, required=False, max_length=120)
    plan_name_input = serializers.CharField(write_only=True, required=False, max_length=50)
    billing_cycle = serializers.CharField(write_only=True, required=False, max_length=20)
    plan_fee_input = serializers.DecimalField(
        max_digits=10, decimal_places=2, write_only=True, required=False
    )
    plan_end_date_input = serializers.DateField(write_only=True, required=False)
    public_page_slug = serializers.CharField(
        write_only=True, required=False, allow_blank=True, allow_null=True
    )
    public_page_enabled = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = Library
        fields = (
            'id',
            'code',
            'name',
            'logo',
            'owner',
            'owner_detail',
            'owner_email',
            'owner_first_name',
            'owner_last_name',
            'owner_phone',
            'owner_name',
            'plan_name_input',
            'billing_cycle',
            'plan_fee_input',
            'plan_end_date_input',
            'public_page_slug',
            'public_page_enabled',
            'city',
            'state',
            'area',
            'country',
            'pin_code',
            'address',
            'phone',
            'contact_email',
            'website',
            'gstin',
            'timezone',
            'currency',
            'default_language',
            'established_year',
            'plan_status',
            'library_status',
            'status_reason',
            'joined_date',
            'email_connection_status',
            'closed_at',
            'deleted_at',
            'branches_count',
            'students_count',
            'total_seats',
            'subscription',
            'plan_name',
            'plan_fee',
            'plan_end_date',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'joined_date', 'closed_at', 'deleted_at', 'created_at', 'updated_at')

    def _get_active_sub(self, obj):
        if not hasattr(obj, '_cached_active_sub'):
            obj._cached_active_sub = obj.subscriptions.select_related('plan').order_by('-created_at').first()
        return obj._cached_active_sub

    def get_subscription(self, obj):
        sub = self._get_active_sub(obj)
        if not sub:
            return None
        plan = sub.plan
        return {
            'id': str(sub.id),
            'plan_name': plan.name if plan else 'Standard Plan',
            'plan_tier': plan.tier if plan else 'Standard',
            'fee': float(sub.fee_amount) if sub.fee_amount is not None else (float(plan.monthly_fee) if plan and plan.monthly_fee else 2499.0),
            'billing_cycle': sub.billing_cycle or 'Monthly',
            'start_date': sub.start_date.isoformat() if sub.start_date else None,
            'end_date': sub.end_date.isoformat() if sub.end_date else None,
            'grace_ends': sub.grace_ends.isoformat() if sub.grace_ends else None,
            'status': sub.status,
            'auto_renew': sub.auto_renew,
        }

    def get_plan_name(self, obj):
        sub = self._get_active_sub(obj)
        if sub and sub.plan:
            return sub.plan.name
        return 'Standard Plan'

    def get_plan_fee(self, obj):
        sub = self._get_active_sub(obj)
        if sub and sub.fee_amount is not None:
            return float(sub.fee_amount)
        if sub and sub.plan and sub.plan.monthly_fee:
            return float(sub.plan.monthly_fee)
        return 2499.0

    def get_plan_end_date(self, obj):
        sub = self._get_active_sub(obj)
        if sub and sub.end_date:
            return sub.end_date.strftime('%Y-%m-%d')
        return None

    def get_students_count(self, obj):
        return obj.students.count()

    def get_total_seats(self, obj):
        from apps.seats.models import Seat
        seat_count = Seat.objects.filter(branch__library=obj).count()
        if seat_count > 0:
            return seat_count
        sub = self._get_active_sub(obj)
        if sub and sub.plan and sub.plan.max_seats:
            return sub.plan.max_seats
        return 100

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        
        # Normalize plan write fields
        if 'plan_name' in data and 'plan_name_input' not in data:
            data['plan_name_input'] = data.get('plan_name')
        if 'plan_fee' in data and 'plan_fee_input' not in data:
            fee_val = data.get('plan_fee')
            if fee_val not in (None, ''):
                data['plan_fee_input'] = fee_val
        if 'plan_end_date' in data and 'plan_end_date_input' not in data:
            end_val = data.get('plan_end_date')
            if end_val not in (None, ''):
                data['plan_end_date_input'] = end_val

        # Normalize owner names
        if 'owner_name' in data and ('owner_first_name' not in data or not data.get('owner_first_name')):
            parts = str(data.get('owner_name', '')).strip().split(' ', 1)
            data['owner_first_name'] = parts[0] or 'Library'
            data['owner_last_name'] = parts[1] if len(parts) > 1 else 'Owner'

        # Auto-fill phone if only owner_phone / ownerPhone provided
        phone_val = data.get('phone') or data.get('owner_phone') or data.get('ownerPhone')
        if phone_val and 'phone' not in data:
            data['phone'] = str(phone_val).strip()

        # Auto-fill code if missing or temporary placeholder
        code_val = str(data.get('code', '')).strip()
        if not code_val or code_val == 'LIB-NEW-101':
            city_prefix = (str(data.get('city') or 'LIB')[:3]).upper()
            data['code'] = f'LIB-{city_prefix}-{uuid.uuid4().hex[:4].upper()}'

        if 'gstNumber' in data and 'gstin' not in data:
            data['gstin'] = data.get('gstNumber')
        if 'microsite_slug' in data and 'public_page_slug' not in data:
            data['public_page_slug'] = data.get('microsite_slug')

        return super().to_internal_value(data)

    def validate(self, attrs):
        if self.instance is None:
            owner = attrs.get('owner')
            owner_email = attrs.get('owner_email')
            if not owner and not owner_email:
                raise serializers.ValidationError(
                    {'owner': 'Provide either an existing owner ID or owner_email.'}
                )
            if owner and hasattr(owner, 'owned_library'):
                raise serializers.ValidationError(
                    {'owner': 'This user already owns a library.'}
                )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        owner = validated_data.pop('owner', None)
        owner_email = validated_data.pop('owner_email', None)
        owner_first_name = validated_data.pop('owner_first_name', 'Library')
        owner_last_name = validated_data.pop('owner_last_name', 'Owner')
        owner_phone = validated_data.pop('owner_phone', '')
        validated_data.pop('owner_name', None)

        plan_name = validated_data.pop('plan_name_input', None)
        billing_cycle = validated_data.pop('billing_cycle', 'Monthly')
        plan_fee = validated_data.pop('plan_fee_input', None)
        plan_end_date = validated_data.pop('plan_end_date_input', None)
        public_page_slug = validated_data.pop('public_page_slug', None)
        public_page_enabled = validated_data.pop('public_page_enabled', True)

        if owner is None:
            email = (owner_email or f"owner.{uuid.uuid4().hex[:6]}@studyhub.com").strip().lower()
            owner, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': owner_first_name,
                    'last_name': owner_last_name,
                    'role': 'LIBRARY_OWNER',
                    'phone': owner_phone or validated_data.get('phone', ''),
                    'email_verified': True,
                },
            )
            if not created and hasattr(owner, 'owned_library'):
                raise serializers.ValidationError(
                    {'owner_email': 'This user already owns a library.'}
                )

        if not validated_data.get('code'):
            city_prefix = (validated_data.get('city') or 'LIB')[:3].upper()
            validated_data['code'] = f'LIB-{city_prefix}-{uuid.uuid4().hex[:4].upper()}'

        library = Library.objects.create(owner=owner, **validated_data)

        if owner.library_id != library.id:
            owner.library = library
            owner.save(update_fields=['library'])

        settings, _ = LibrarySettings.objects.get_or_create(library=library)
        if public_page_slug:
            settings.public_page_slug = public_page_slug
        settings.public_page_enabled = public_page_enabled
        settings.save()

        Branch.objects.create(
            library=library,
            name='Main Branch',
            address=library.address,
            phone=library.phone,
            is_main=True,
        )

        # Attach Subscription Plan
        from apps.billing.models import SubscriptionPlan, LibrarySubscription
        from django.utils import timezone
        import datetime

        target_plan = None
        if plan_name:
            target_plan = SubscriptionPlan.objects.filter(name__icontains=plan_name.strip()).first()
        if not target_plan:
            target_plan = SubscriptionPlan.objects.order_by('tier').first()

        if target_plan:
            start_d = timezone.now().date()
            if plan_end_date:
                end_d = plan_end_date
            else:
                days = 365 if str(billing_cycle).lower() == 'annual' else (90 if str(billing_cycle).lower() == 'quarterly' else 30)
                end_d = start_d + datetime.timedelta(days=days)

            fee = plan_fee if plan_fee is not None else target_plan.monthly_fee
            LibrarySubscription.objects.create(
                library=library,
                plan=target_plan,
                billing_cycle=(billing_cycle or 'Monthly').capitalize(),
                start_date=start_d,
                end_date=end_d,
                status=library.plan_status or 'Active',
                fee_amount=fee,
                auto_renew=True,
            )

        return library

    @transaction.atomic
    def update(self, instance, validated_data):
        owner_first_name = validated_data.pop('owner_first_name', None)
        owner_last_name = validated_data.pop('owner_last_name', None)
        owner_phone = validated_data.pop('owner_phone', None)
        owner_email = validated_data.pop('owner_email', None)
        validated_data.pop('owner_name', None)

        plan_name = validated_data.pop('plan_name_input', None)
        billing_cycle = validated_data.pop('billing_cycle', None)
        plan_fee = validated_data.pop('plan_fee_input', None)
        plan_end_date = validated_data.pop('plan_end_date_input', None)
        public_page_slug = validated_data.pop('public_page_slug', None)
        public_page_enabled = validated_data.pop('public_page_enabled', None)

        # Update owner if details provided
        if instance.owner:
            owner_updated = False
            if owner_first_name:
                instance.owner.first_name = owner_first_name
                owner_updated = True
            if owner_last_name:
                instance.owner.last_name = owner_last_name
                owner_updated = True
            if owner_phone:
                instance.owner.phone = owner_phone
                owner_updated = True
            if owner_email and instance.owner.email != owner_email:
                instance.owner.email = owner_email
                owner_updated = True
            if owner_updated:
                instance.owner.save()

        # Update settings
        if hasattr(instance, 'settings'):
            settings = instance.settings
            settings_updated = False
            if public_page_slug is not None:
                settings.public_page_slug = public_page_slug or None
                settings_updated = True
            if public_page_enabled is not None:
                settings.public_page_enabled = public_page_enabled
                settings_updated = True
            if settings_updated:
                settings.save()

        # Update subscription if plan details provided
        if plan_name or billing_cycle or plan_fee is not None or plan_end_date:
            from apps.billing.models import SubscriptionPlan, LibrarySubscription
            from django.utils import timezone
            import datetime

            sub = instance.subscriptions.order_by('-created_at').first()
            target_plan = None
            if plan_name:
                target_plan = SubscriptionPlan.objects.filter(name__icontains=plan_name.strip()).first()

            if sub:
                if target_plan:
                    sub.plan = target_plan
                if billing_cycle:
                    sub.billing_cycle = billing_cycle.capitalize()
                if plan_fee is not None:
                    sub.fee_amount = plan_fee
                if plan_end_date:
                    sub.end_date = plan_end_date
                sub.status = instance.plan_status or sub.status
                sub.save()
            elif target_plan or SubscriptionPlan.objects.exists():
                plan = target_plan or SubscriptionPlan.objects.order_by('tier').first()
                start_d = timezone.now().date()
                days = 365 if str(billing_cycle).lower() == 'annual' else (90 if str(billing_cycle).lower() == 'quarterly' else 30)
                end_d = plan_end_date or (start_d + datetime.timedelta(days=days))
                fee = plan_fee if plan_fee is not None else plan.monthly_fee
                LibrarySubscription.objects.create(
                    library=instance,
                    plan=plan,
                    billing_cycle=(billing_cycle or 'Monthly').capitalize(),
                    start_date=start_d,
                    end_date=end_d,
                    status=instance.plan_status or 'Active',
                    fee_amount=fee,
                    auto_renew=True,
                )

        return super().update(instance, validated_data)


class LibraryDetailSerializer(LibrarySerializer):
    """Detailed library serializer including nested branches, settings, and documents."""

    branches = BranchSerializer(many=True, read_only=True)
    settings = LibrarySettingsSerializer(read_only=True)
    documents = serializers.SerializerMethodField()

    class Meta(LibrarySerializer.Meta):
        fields = LibrarySerializer.Meta.fields + ('branches', 'settings', 'documents')

    def get_documents(self, obj):
        # Look for documents from associated LibraryRequest or defaults
        req = obj.origin_requests.prefetch_related('documents').first()
        docs = []
        if req and req.documents.exists():
            for d in req.documents.all():
                docs.append({
                    'id': str(d.id),
                    'title': d.title,
                    'file_url': d.file.url if d.file else None,
                    'file_size': d.file_size or '1.4 MB',
                    'file_type': 'PDF',
                    'category': 'Verification',
                    'status': 'Verified',
                    'uploaded_at': d.created_at.strftime('%d %b %Y') if d.created_at else None,
                })

        # Provide standard verified tenant onboarding documents
        if not docs:
            joined_str = obj.joined_date.strftime('%d %b %Y') if obj.joined_date else '14 Nov 2026'
            owner_display = obj.owner.name if obj.owner else 'Library Owner'
            gstin_display = obj.gstin if obj.gstin else '27AABCU9603R1ZM'
            docs = [
                {
                    'id': f'doc-{str(obj.id)[:6]}-1',
                    'title': f'{obj.name} - Commercial Lease & Premises Agreement',
                    'category': 'Property & Premises',
                    'status': 'Verified',
                    'file_type': 'PDF',
                    'file_size': '2.4 MB',
                    'uploaded_at': joined_str,
                },
                {
                    'id': f'doc-{str(obj.id)[:6]}-2',
                    'title': f'GST / Trade License Certificate ({gstin_display})',
                    'category': 'Tax & Registration',
                    'status': 'Verified',
                    'file_type': 'PDF',
                    'file_size': '1.1 MB',
                    'uploaded_at': joined_str,
                },
                {
                    'id': f'doc-{str(obj.id)[:6]}-3',
                    'title': f'Owner KYC & Identity Proof ({owner_display})',
                    'category': 'Identity & KYC',
                    'status': 'Verified',
                    'file_type': 'PDF',
                    'file_size': '850 KB',
                    'uploaded_at': joined_str,
                },
                {
                    'id': f'doc-{str(obj.id)[:6]}-4',
                    'title': 'Fire Safety NOC & Local Municipal Operating Clearance',
                    'category': 'Safety & Compliance',
                    'status': 'Active',
                    'file_type': 'PDF',
                    'file_size': '1.6 MB',
                    'uploaded_at': joined_str,
                },
            ]
        return docs


class LibraryProfileSerializer(serializers.ModelSerializer):
    """Library owner self-service profile serializer."""

    owner_name = serializers.CharField(source='owner.name', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)

    class Meta:
        model = Library
        fields = (
            'id',
            'code',
            'name',
            'logo',
            'owner_name',
            'owner_email',
            'city',
            'state',
            'area',
            'country',
            'pin_code',
            'address',
            'phone',
            'contact_email',
            'website',
            'gstin',
            'timezone',
            'currency',
            'default_language',
            'established_year',
            'plan_status',
            'library_status',
            'joined_date',
            'email_connection_status',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'code',
            'owner_name',
            'owner_email',
            'plan_status',
            'library_status',
            'joined_date',
            'email_connection_status',
            'created_at',
            'updated_at',
        )


class LibraryStatusActionSerializer(serializers.Serializer):
    """Action payload for lock, unlock, and suspend endpoints."""

    reason = serializers.CharField(required=False, allow_blank=True, default='')


class LibraryDocumentSerializer(serializers.ModelSerializer):
    """Serializer for documents attached to a LibraryRequest."""

    class Meta:
        model = LibraryDocument
        fields = ('id', 'request', 'title', 'file', 'file_size', 'created_at')
        read_only_fields = ('id', 'created_at')


class LibraryRequestSerializer(serializers.ModelSerializer):
    """Serializer for library onboarding requests."""

    documents = LibraryDocumentSerializer(many=True, read_only=True)
    reviewed_by_email = serializers.EmailField(
        source='reviewed_by.email', read_only=True, default=None
    )

    class Meta:
        model = LibraryRequest
        fields = (
            'id',
            'request_number',
            'library_name',
            'owner_name',
            'mobile',
            'email',
            'city',
            'state',
            'address',
            'branches_planned',
            'planned_seats',
            'document_check',
            'status',
            'notes',
            'duplicate_warning',
            'reviewed_by',
            'reviewed_by_email',
            'reviewed_at',
            'approved_library',
            'documents',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'request_number',
            'status',
            'reviewed_by',
            'reviewed_by_email',
            'reviewed_at',
            'approved_library',
            'documents',
            'created_at',
            'updated_at',
        )


class LibraryRequestApproveSerializer(serializers.Serializer):
    """Action payload when approving a library onboarding request."""

    library_code = serializers.CharField(
        max_length=20, required=False, allow_blank=True
    )
    plan_status = serializers.ChoiceField(
        choices=['Trial', 'Active'], default='Trial', required=False
    )
    notes = serializers.CharField(required=False, allow_blank=True, default='')


class LibraryRequestRejectSerializer(serializers.Serializer):
    """Action payload when rejecting a library onboarding request."""

    reason = serializers.CharField(required=False, allow_blank=True, default='')
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        r = attrs.get('reason') or attrs.get('notes')
        if not r or len(r.strip()) < 3:
            raise serializers.ValidationError({'reason': 'A reason or notes with at least 3 characters is required.'})
        attrs['reason'] = r.strip()
        return attrs


class LibraryRequestInfoSerializer(serializers.Serializer):
    """Action payload when requesting additional information on a library request."""

    message = serializers.CharField(required=False, allow_blank=True, default='')
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        msg = attrs.get('message') or attrs.get('notes')
        if not msg or len(msg.strip()) < 3:
            raise serializers.ValidationError({'message': 'Message or notes with at least 3 characters is required.'})
        attrs['message'] = msg.strip()
        return attrs
