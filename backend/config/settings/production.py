"""Production settings for LMS Platform backend."""
from .base import *  # noqa: F401, F403

DEBUG = False

DATABASES = {
    'default': env.db('DATABASE_URL'),  # noqa: F405
}

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

