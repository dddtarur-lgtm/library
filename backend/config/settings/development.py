"""Development settings for LMS Platform backend."""
from .base import *  # noqa: F401, F403

DEBUG = True

DATABASES = {
    'default': env.db(  # noqa: F405
        'DATABASE_URL',
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',  # noqa: F405
    )
}

EMAIL_BACKEND = env(  # noqa: F405
    'EMAIL_BACKEND',
    default='django.core.mail.backends.console.EmailBackend',
)

# Static test OTP accepted for all active OTP verifications in development/testing
TEST_STATIC_OTP = '123456'

