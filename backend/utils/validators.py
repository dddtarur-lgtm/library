"""Shared field validators mirroring frontend Zod schemas."""
import re
from django.core.exceptions import ValidationError


def validate_password_strength(value: str) -> str:
    """
    Validate password strength to mirror frontend Zod SignIn/Register/NewPassword schemas:
      - minimum 8 characters
      - maximum 250 characters
      - at least 1 letter
      - at least 1 number
    """
    if not isinstance(value, str):
        raise ValidationError('Password must be a string.')
    if len(value) < 8:
        raise ValidationError('Password must be at least 8 characters long.')
    if len(value) > 250:
        raise ValidationError('Password must be at most 250 characters long.')
    if not re.search(r'[A-Za-z]', value):
        raise ValidationError('Password must contain at least one letter.')
    if not re.search(r'[0-9]', value):
        raise ValidationError('Password must contain at least one number.')
    return value

