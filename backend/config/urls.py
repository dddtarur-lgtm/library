"""Root URL configuration for LMS Platform API."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.accounts import urls as accounts_urls
from apps.audit import urls as audit_urls
from apps.billing import urls as billing_urls
from apps.libraries import urls as libraries_urls
from apps.notifications import urls as notifications_urls
from apps.platform_admin import urls as platform_admin_urls
from apps.students import urls as students_urls
from apps.billing.views_webhook import RazorpayWebhookView
from apps.core import v1_file_views as file_v1_views
from apps.billing import v1_webhook_views as webhook_v1_views
from apps.core import v1_realtime_views as realtime_v1_views


def api_root(request):
    """Root health & discovery endpoint."""
    return JsonResponse({
        'status': 'ok',
        'service': 'LMS Platform API',
        'version': '1.0.0',
        'docs': '/api/schema/swagger-ui/',
        'schema': '/api/schema/',
        'admin': '/admin/',
        'api_base': '/api/v1/',
    })


urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),

    # OpenAPI schema & Swagger UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path(
        'api/schema/swagger-ui/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui',
    ),

    # Auth (v1.0 Design Doc + Legacy compatibility)
    path('v1/auth/', include('apps.core.auth_urls')),
    path('api/v1/auth/', include('apps.core.auth_urls')),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/auth/legacy/', include('apps.accounts.urls')),

    # Public APIs (Section 6)
    path('v1/public/', include('apps.public.urls')),
    path('api/v1/public/', include('apps.public.urls')),

    # Platform (Super Admin)
    path('v1/platform/', include('apps.platform_admin.v1_urls')),
    path(
        'api/v1/platform/',
        include([
            path('', include('apps.platform_admin.v1_urls')),
            path('', include((accounts_urls.platform_urlpatterns, 'platform-users'))),
            path('', include((libraries_urls.platform_urlpatterns, 'platform-libraries'))),
            path('', include((students_urls.platform_urlpatterns, 'platform-students'))),
            path('', include((billing_urls.platform_urlpatterns, 'platform-billing'))),
            path('', include((notifications_urls.platform_urlpatterns, 'platform-notifications'))),
            path('', include((audit_urls.platform_urlpatterns, 'platform-audit'))),
            path('', include((platform_admin_urls.platform_urlpatterns, 'platform-admin'))),
        ]),
    ),

    # Library Panel (v1.0 Design Doc + Legacy)
    path('v1/library/', include('apps.libraries.v1_urls')),
    path(
        'api/v1/library/',
        include([
            path('', include((accounts_urls.library_urlpatterns, 'library-staff'))),
            path('', include((libraries_urls.library_urlpatterns, 'library-core'))),
            path('', include((students_urls.library_urlpatterns, 'library-students'))),
            path('', include('apps.seats.urls')),
            path('', include('apps.books.urls')),
            path('', include((billing_urls.library_urlpatterns, 'library-billing'))),
            path('', include((notifications_urls.library_urlpatterns, 'library-notifications'))),
            path('', include((audit_urls.library_urlpatterns, 'library-audit'))),
            path('', include((platform_admin_urls.library_urlpatterns, 'library-admin'))),
        ]),
    ),

    # Student Self-Service (v1.0 Design Doc + Legacy)
    path('v1/student/', include('apps.students.v1_urls')),
    path(
        'api/v1/student/',
        include((students_urls.student_urlpatterns, 'student-self')),
    ),

    # Section 16.6 Files
    path('v1/files/presign', file_v1_views.FilesPresignView.as_view(), name='files-presign'),
    path('v1/files/<uuid:id>/complete', file_v1_views.FilesCompleteView.as_view(), name='files-complete'),
    path('v1/files/<uuid:id>', file_v1_views.FileDetailView.as_view(), name='file-detail'),

    # Section 18: Webhooks
    path('v1/webhooks/razorpay/library/<str:webhook_key>', webhook_v1_views.RazorpayLibraryWebhookView.as_view(), name='webhook-razorpay-library'),
    path('v1/webhooks/razorpay/platform', webhook_v1_views.RazorpayPlatformWebhookView.as_view(), name='webhook-razorpay-platform'),
    path('oauth/callback/<str:provider>', webhook_v1_views.OAuthCallbackView.as_view(), name='oauth-callback'),
    path('v1/webhooks/email/<str:provider>', webhook_v1_views.EmailWebhookView.as_view(), name='webhook-email'),
    path('v1/webhooks/sms/<str:provider>', webhook_v1_views.MessagingWebhookView.as_view(), name='webhook-sms'),
    path('v1/webhooks/whatsapp/<str:provider>', webhook_v1_views.MessagingWebhookView.as_view(), name='webhook-whatsapp'),
    path('v1/webhooks/razorpay', RazorpayWebhookView.as_view(), name='webhook-razorpay'),
    path('api/v1/webhooks/razorpay', RazorpayWebhookView.as_view(), name='api-webhook-razorpay'),

    # Section 18.2: Realtime SSE stream
    path('v1/realtime/stream', realtime_v1_views.RealtimeStreamView.as_view(), name='realtime-stream'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

