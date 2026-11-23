"""Django signal handlers that automatically record AuditLog entries on key model writes."""
from datetime import date, datetime, time
from decimal import Decimal
import uuid

from django.contrib.auth import get_user_model
from django.db import OperationalError, ProgrammingError
from django.db.models.fields.files import FieldFile
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from apps.billing.models import PlatformPayment, SubscriptionPlan
from apps.libraries.models import Library, LibraryRequest
from apps.students.models import Student, StudentMembership

from .middleware import get_current_request_context
from .models import AuditLog

User = get_user_model()

REDACTED_FIELDS = frozenset({'password', 'email_otp', 'password_reset_token'})
IGNORED_UPDATE_FIELDS = frozenset({'updated_at', 'last_login'})

MODEL_MODULE_MAP = {
    Library: 'Libraries',
    LibraryRequest: 'Libraries',
    Student: 'Students',
    StudentMembership: 'Fees & Plans',
    PlatformPayment: 'Billing',
    SubscriptionPlan: 'Billing',
    User: 'Security',
}


def _serialize_value(value):
    """Convert Django model field values into JSON-serializable primitives."""
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, (uuid.UUID, Decimal)):
        return str(value)
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    if isinstance(value, FieldFile):
        return value.name or ''
    if isinstance(value, (list, tuple)):
        return [_serialize_value(item) for item in value]
    if isinstance(value, dict):
        return {str(k): _serialize_value(v) for k, v in value.items()}
    return str(value)


def _snapshot_instance(instance):
    """Build a JSON-safe dict of concrete field values for a model instance."""
    snapshot = {}
    for field in instance._meta.concrete_fields:
        key = field.attname
        if field.name in REDACTED_FIELDS:
            snapshot[field.name] = '[REDACTED]'
            continue
        snapshot[field.name] = _serialize_value(getattr(instance, key, None))
    return snapshot


def _resolve_library_id(instance):
    """Resolve the tenant library UUID for a tracked model instance, if applicable."""
    if isinstance(instance, Library):
        return instance.id
    if isinstance(instance, LibraryRequest):
        return instance.approved_library_id
    if isinstance(instance, (Student, PlatformPayment, User)):
        return instance.library_id
    if isinstance(instance, StudentMembership):
        return instance.student.library_id if instance.student_id else None
    return None


def _is_risky_change(instance, created, deleted, before_data, after_data):
    """Determine whether an audit event represents a high-risk operation."""
    if deleted:
        return True
    if isinstance(instance, Library) and not created:
        if after_data.get('library_status') in ('Suspended', 'Locked', 'Closed'):
            if before_data.get('library_status') != after_data.get('library_status'):
                return True
        if after_data.get('plan_status') == 'Locked' and before_data.get('plan_status') != 'Locked':
            return True
    if isinstance(instance, User):
        if created and instance.role == 'SUPER_ADMIN':
            return True
        if not created:
            for field in ('role', 'is_active', 'is_staff', 'is_superuser'):
                if before_data.get(field) != after_data.get(field):
                    return True
    return False


def _write_audit_log(instance, module, action, diff, is_risky):
    """Persist an AuditLog row safely without breaking migrations or seed scripts."""
    ctx = get_current_request_context()
    actor = ctx.get('user')
    actor_id = getattr(actor, 'pk', None) if actor and getattr(actor, 'is_authenticated', False) else None
    library_id = _resolve_library_id(instance)

    try:
        AuditLog.objects.create(
            library_id=library_id,
            actor_id=actor_id,
            module=module,
            action=action,
            target_entity=instance.__class__.__name__,
            entity_id=str(instance.pk),
            ip_address=ctx.get('ip_address'),
            device=ctx.get('device', ''),
            is_risky=is_risky,
            diff=diff,
        )
    except (OperationalError, ProgrammingError):
        # Database tables may not exist yet during initial migrations.
        pass


def _capture_pre_save(sender, instance, **kwargs):
    """Capture pre-save field snapshot so post_save can compute a field-level diff."""
    if instance._state.adding or not instance.pk:
        instance._audit_before_snapshot = None
        return
    try:
        existing = sender.objects.filter(pk=instance.pk).first()
        instance._audit_before_snapshot = _snapshot_instance(existing) if existing else None
    except (OperationalError, ProgrammingError):
        instance._audit_before_snapshot = None


def _handle_post_save(sender, instance, created, **kwargs):
    """Record CREATE or UPDATE AuditLog entries for tracked models."""
    module = MODEL_MODULE_MAP.get(sender, 'Platform')
    model_name = sender.__name__
    after_snapshot = _snapshot_instance(instance)
    before_snapshot = getattr(instance, '_audit_before_snapshot', None)

    if created:
        action = f'Created {model_name}'
        diff = {'before': None, 'after': after_snapshot}
        is_risky = _is_risky_change(instance, True, False, {}, after_snapshot)
    else:
        before_changes = {}
        after_changes = {}
        if before_snapshot:
            for key, after_val in after_snapshot.items():
                if key in IGNORED_UPDATE_FIELDS:
                    continue
                before_val = before_snapshot.get(key)
                if before_val != after_val:
                    before_changes[key] = before_val
                    after_changes[key] = after_val
        if before_snapshot is not None and not after_changes:
            return
        action = f'Updated {model_name}'
        diff = {'before': before_changes, 'after': after_changes}
        is_risky = _is_risky_change(instance, False, False, before_snapshot or {}, after_snapshot)

    _write_audit_log(instance, module, action, diff, is_risky)


def _handle_post_delete(sender, instance, **kwargs):
    """Record DELETE AuditLog entries for tracked models."""
    module = MODEL_MODULE_MAP.get(sender, 'Platform')
    model_name = sender.__name__
    snapshot = _snapshot_instance(instance)
    _write_audit_log(
        instance=instance,
        module=module,
        action=f'Deleted {model_name}',
        diff={'before': snapshot, 'after': None},
        is_risky=True,
    )


for _tracked_model in MODEL_MODULE_MAP:
    pre_save.connect(_capture_pre_save, sender=_tracked_model, weak=False)
    post_save.connect(_handle_post_save, sender=_tracked_model, weak=False)
    post_delete.connect(_handle_post_delete, sender=_tracked_model, weak=False)
