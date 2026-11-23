"""URL routing for Section 6 Public APIs."""
from django.urls import path

from apps.public import views

urlpatterns = [
    path('meta', views.PublicMetaView.as_view(), name='public-meta'),
    path('libraries', views.PublicLibrariesListView.as_view(), name='public-libraries-list'),
    path('libraries/nearby', views.PublicLibrariesNearbyView.as_view(), name='public-libraries-nearby'),
    path('libraries/<slug:slug>', views.PublicLibraryDetailView.as_view(), name='public-library-detail'),
    path('libraries/<slug:slug>/plans', views.PublicLibraryPlansView.as_view(), name='public-library-plans'),
    path('libraries/<slug:slug>/facilities', views.PublicLibraryFacilitiesView.as_view(), name='public-library-facilities'),
    path('libraries/<slug:slug>/achievers', views.PublicLibraryAchieversView.as_view(), name='public-library-achievers'),
    path('libraries/<slug:slug>/gallery', views.PublicLibraryGalleryView.as_view(), name='public-library-gallery'),
    path('libraries/<slug:slug>/reviews', views.PublicLibraryReviewsView.as_view(), name='public-library-reviews'),
    path('libraries/<slug:slug>/faqs', views.PublicLibraryFaqsView.as_view(), name='public-library-faqs'),
    path('libraries/<slug:slug>/notices', views.PublicLibraryNoticesView.as_view(), name='public-library-notices'),
    path('libraries/<slug:slug>/branches', views.PublicLibraryBranchesView.as_view(), name='public-library-branches'),
    path('libraries/<slug:slug>/share', views.PublicLibraryShareView.as_view(), name='public-library-share'),
    path('libraries/<slug:slug>/enquiries', views.PublicLibraryEnquiriesView.as_view(), name='public-library-enquiries'),
    path('libraries/<slug:slug>/visits', views.PublicLibraryVisitsView.as_view(), name='public-library-visits'),
    path('resolve-domain', views.PublicResolveDomainView.as_view(), name='public-resolve-domain'),
]
