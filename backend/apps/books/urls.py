"""URL routing for library book catalog, loans, and requests."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BookLoanViewSet, BookRequestViewSet, BookViewSet

# Register loans and requests before books so books/{pk}/ does not shadow them.
sub_router = DefaultRouter()
sub_router.register('books/loans', BookLoanViewSet, basename='library-book-loans')
sub_router.register('books/requests', BookRequestViewSet, basename='library-book-requests')

books_router = DefaultRouter()
books_router.register('books', BookViewSet, basename='library-books')

urlpatterns = [
    path('', include(sub_router.urls)),
    path('', include(books_router.urls)),
]
