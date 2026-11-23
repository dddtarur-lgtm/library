"""Thread-local & ContextVar tenant context management."""
import threading
from contextvars import ContextVar
from typing import Any, Optional

_tenant_org_id: ContextVar[Optional[Any]] = ContextVar('tenant_org_id', default=None)
_token_payload: ContextVar[Optional[dict]] = ContextVar('token_payload', default=None)

_thread_local = threading.local()


def set_current_org_id(org_id: Any) -> None:
    _tenant_org_id.set(org_id)
    _thread_local.org_id = org_id


def get_current_org_id() -> Optional[Any]:
    val = _tenant_org_id.get()
    if val is not None:
        return val
    return getattr(_thread_local, 'org_id', None)


def clear_current_org_id() -> None:
    _tenant_org_id.set(None)
    if hasattr(_thread_local, 'org_id'):
        delattr(_thread_local, 'org_id')


def set_current_token_payload(payload: dict) -> None:
    _token_payload.set(payload)
    _thread_local.token_payload = payload


def get_current_token_payload() -> Optional[dict]:
    val = _token_payload.get()
    if val is not None:
        return val
    return getattr(_thread_local, 'token_payload', None)


def clear_current_token_payload() -> None:
    _token_payload.set(None)
    if hasattr(_thread_local, 'token_payload'):
        delattr(_thread_local, 'token_payload')

