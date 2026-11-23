"""
Base Django settings for LMS Platform backend.
Shared across development and production environments.
"""
from datetime import timedelta
from pathlib import Path
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _
import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ['localhost', '127.0.0.1', 'testserver']),
    ACCESS_TOKEN_LIFETIME_MINUTES=(int, 60),
    REFRESH_TOKEN_LIFETIME_DAYS=(int, 30),
)

env_file = BASE_DIR / '.env'
if env_file.exists():
    environ.Env.read_env(str(env_file))

SECRET_KEY = env('SECRET_KEY', default='django-insecure-change-me-in-production')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')

AUTH_USER_MODEL = 'accounts.User'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

INSTALLED_APPS = [
    'unfold',
    'unfold.contrib.filters',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    # Shared utilities (for management commands)
    'utils',
    # Platform Core & Public APIs
    'apps.core',
    'apps.public',
    # Local apps
    'apps.accounts',
    'apps.libraries',
    'apps.students',
    'apps.seats',
    'apps.books',
    'apps.billing',
    'apps.notifications',
    'apps.platform_admin',
    'apps.audit',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'apps.core.middleware.TenantIsolationMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'apps.audit.middleware.AuditRequestMiddleware',
    'apps.core.middleware.LibraryStateGateMiddleware',
    'apps.core.middleware.IdempotencyMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = env('MEDIA_URL', default='/media/')
MEDIA_ROOT = BASE_DIR / env('MEDIA_ROOT', default='media/')

# CORS
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=['http://localhost:3000', 'http://localhost:3001'],
)
CORS_ALLOW_CREDENTIALS = True

# Email
EMAIL_BACKEND = env(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.console.EmailBackend',
)
EMAIL_HOST = env('EMAIL_HOST', default='')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='noreply@lmsplatform.com')

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'apps.core.authentication.MultiAudienceJWTAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'apps.core.renderers.StandardJSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'apps.core.pagination.StandardPlatformPagination',
    'PAGE_SIZE': 25,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'EXCEPTION_HANDLER': 'apps.core.exceptions.custom_standard_exception_handler',
}

# SimpleJWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=env.int('ACCESS_TOKEN_LIFETIME_MINUTES', default=60)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=env.int('REFRESH_TOKEN_LIFETIME_DAYS', default=30)
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'TOKEN_OBTAIN_SERIALIZER': 'apps.accounts.serializers.CustomTokenObtainSerializer',
}

# OpenAPI / Swagger
SPECTACULAR_SETTINGS = {
    'TITLE': 'LMS Platform API',
    'DESCRIPTION': 'REST API for LMS Platform (Super Admin) & Library Dashboard',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SWAGGER_UI_SETTINGS': {
        'persistAuthorization': True,
        'filter': True,
        'displayRequestDuration': True,
    },
}

# Django Unfold Admin UI
UNFOLD = {
    'SITE_TITLE': 'LMS Platform HQ',
    'SITE_HEADER': 'LMS Multi-Tenant Admin',
    'SITE_SUBHEADER': 'Super Admin & Library Operations',
    'SITE_SYMBOL': 'local_library',
    'SHOW_HISTORY': True,
    'SHOW_VIEW_ON_SITE': True,
    'THEME': None,  # Enables Light / Dark / System switcher
    'DASHBOARD_CALLBACK': 'config.admin_dashboard.dashboard_callback',
    'COLORS': {
        'primary': {
            '50': '238 242 255',
            '100': '224 231 255',
            '200': '199 210 254',
            '300': '165 180 252',
            '400': '129 140 248',
            '500': '99 102 241',
            '600': '79 70 229',
            '700': '67 56 202',
            '800': '55 48 163',
            '900': '49 46 129',
            '950': '30 27 75',
        },
    },
    'SIDEBAR': {
        'show_search': True,
        'show_all_applications': False,
        'navigation': [
            {
                'title': _('Overview'),
                'separator': False,
                'collapsible': False,
                'items': [
                    {
                        'title': _('Dashboard'),
                        'icon': 'dashboard',
                        'link': reverse_lazy('admin:index'),
                    },
                    {
                        'title': _('Swagger API Docs'),
                        'icon': 'api',
                        'link': '/api/schema/swagger-ui/',
                    },
                ],
            },
            {
                'title': _('Users & Access'),
                'separator': True,
                'collapsible': True,
                'items': [
                    {
                        'title': _('Users'),
                        'icon': 'person',
                        'link': reverse_lazy('admin:accounts_user_changelist'),
                    },
                    {
                        'title': _('Staff Permissions'),
                        'icon': 'admin_panel_settings',
                        'link': reverse_lazy('admin:accounts_staffpermission_changelist'),
                    },
                    {
                        'title': _('Deletion Requests'),
                        'icon': 'delete_sweep',
                        'link': reverse_lazy('admin:accounts_deletionrequest_changelist'),
                    },
                ],
            },
            {
                'title': _('Libraries & Tenants'),
                'separator': True,
                'collapsible': True,
                'items': [
                    {
                        'title': _('Libraries'),
                        'icon': 'apartment',
                        'link': reverse_lazy('admin:libraries_library_changelist'),
                    },
                    {
                        'title': _('Branches'),
                        'icon': 'storefront',
                        'link': reverse_lazy('admin:libraries_branch_changelist'),
                    },
                    {
                        'title': _('Onboarding Requests'),
                        'icon': 'assignment_turned_in',
                        'link': reverse_lazy('admin:libraries_libraryrequest_changelist'),
                    },
                    {
                        'title': _('Library Settings'),
                        'icon': 'tune',
                        'link': reverse_lazy('admin:libraries_librarysettings_changelist'),
                    },
                ],
            },
            {
                'title': _('Students & Operations'),
                'separator': True,
                'collapsible': True,
                'items': [
                    {
                        'title': _('Students'),
                        'icon': 'school',
                        'link': reverse_lazy('admin:students_student_changelist'),
                    },
                    {
                        'title': _('Memberships'),
                        'icon': 'card_membership',
                        'link': reverse_lazy('admin:students_studentmembership_changelist'),
                    },
                    {
                        'title': _('Seats'),
                        'icon': 'chair',
                        'link': reverse_lazy('admin:seats_seat_changelist'),
                    },
                    {
                        'title': _('Attendance'),
                        'icon': 'qr_code_scanner',
                        'link': reverse_lazy('admin:seats_attendancerecord_changelist'),
                    },
                    {
                        'title': _('Books & Loans'),
                        'icon': 'menu_book',
                        'link': reverse_lazy('admin:books_book_changelist'),
                    },
                ],
            },
            {
                'title': _('Billing & Plans'),
                'separator': True,
                'collapsible': True,
                'items': [
                    {
                        'title': _('Subscription Plans'),
                        'icon': 'sell',
                        'link': reverse_lazy('admin:billing_subscriptionplan_changelist'),
                    },
                    {
                        'title': _('Library Subscriptions'),
                        'icon': 'subscriptions',
                        'link': reverse_lazy('admin:billing_librarysubscription_changelist'),
                    },
                    {
                        'title': _('Platform Payments'),
                        'icon': 'payments',
                        'link': reverse_lazy('admin:billing_platformpayment_changelist'),
                    },
                    {
                        'title': _('Student Fee Plans'),
                        'icon': 'receipt_long',
                        'link': reverse_lazy('admin:billing_feeplan_changelist'),
                    },
                    {
                        'title': _('Coupons'),
                        'icon': 'confirmation_number',
                        'link': reverse_lazy('admin:billing_coupon_changelist'),
                    },
                    {
                        'title': _('Cash Daybook'),
                        'icon': 'account_balance_wallet',
                        'link': reverse_lazy('admin:billing_cashdaybookentry_changelist'),
                    },
                ],
            },
            {
                'title': _('Support & System'),
                'separator': True,
                'collapsible': True,
                'items': [
                    {
                        'title': _('Support Tickets'),
                        'icon': 'support_agent',
                        'link': reverse_lazy('admin:platform_admin_supportticket_changelist'),
                    },
                    {
                        'title': _('Broadcast Notifications'),
                        'icon': 'notifications_active',
                        'link': reverse_lazy('admin:notifications_notificationbroadcast_changelist'),
                    },
                    {
                        'title': _('Website CMS'),
                        'icon': 'web',
                        'link': reverse_lazy('admin:platform_admin_websitecontentblock_changelist'),
                    },
                    {
                        'title': _('Feature Flags'),
                        'icon': 'flag',
                        'link': reverse_lazy('admin:platform_admin_appfeatureflag_changelist'),
                    },
                    {
                        'title': _('Email Health'),
                        'icon': 'mark_email_read',
                        'link': reverse_lazy('admin:platform_admin_emailconnectionhealth_changelist'),
                    },
                    {
                        'title': _('Audit Logs'),
                        'icon': 'history',
                        'link': reverse_lazy('admin:audit_auditlog_changelist'),
                    },
                ],
            },
        ],
    },
}

