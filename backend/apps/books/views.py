"""Views for Book catalog, BookLoan management, and BookRequest workflow."""
from decimal import Decimal

from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError

from apps.accounts.permissions import IsSameLibrary, IsStaffOrAbove
from utils.responses import error, success

from .models import Book, BookLoan, BookRequest
from .serializers import (
    BookLoanLostSerializer,
    BookLoanReturnSerializer,
    BookLoanSerializer,
    BookRequestSerializer,
    BookSerializer,
)


@extend_schema(tags=['Books'])
class BookViewSet(viewsets.ModelViewSet):
    """CRUD for library book catalog."""

    serializer_class = BookSerializer
    permission_classes = [IsStaffOrAbove, IsSameLibrary]
    filterset_fields = ['category']
    search_fields = ['title', 'author', 'isbn', 'book_number']
    ordering_fields = ['created_at', 'title', 'rating', 'total_copies']

    def get_queryset(self):
        user = self.request.user
        qs = Book.objects.select_related('library').prefetch_related('loans')
        if user.role == 'SUPER_ADMIN':
            library_id = self.request.query_params.get('library')
            if library_id:
                qs = qs.filter(library_id=library_id)
            return qs
        if not user.library_id:
            return qs.none()
        return qs.filter(library_id=user.library_id)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'SUPER_ADMIN' and self.request.data.get('library'):
            serializer.save(library_id=self.request.data['library'])
        elif user.library_id:
            serializer.save(library=user.library)
        else:
            raise ValidationError({'library': 'User is not associated with a library.'})


@extend_schema(tags=['Books'])
class BookLoanViewSet(viewsets.ModelViewSet):
    """Issue, list, return, and mark-lost actions for book loans."""

    serializer_class = BookLoanSerializer
    permission_classes = [IsStaffOrAbove, IsSameLibrary]
    filterset_fields = ['status', 'student', 'book', 'fine_status']
    search_fields = ['book__title', 'student__name', 'student__student_code', 'copy_barcode']
    ordering_fields = ['issued_at', 'due_date', 'returned_at']

    def get_queryset(self):
        user = self.request.user
        qs = BookLoan.objects.select_related('book', 'student')
        if user.role == 'SUPER_ADMIN':
            library_id = self.request.query_params.get('library')
            if library_id:
                qs = qs.filter(book__library_id=library_id)
            return qs
        if not user.library_id:
            return qs.none()
        return qs.filter(book__library_id=user.library_id)

    @action(detail=True, methods=['post'], url_path='return')
    def return_book(self, request, pk=None):
        """Mark an issued/overdue book loan as returned."""
        loan = self.get_object()
        if loan.status == 'Returned':
            return error('Book loan is already returned.', status=status.HTTP_400_BAD_REQUEST)

        serializer = BookLoanReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        now = timezone.now()
        loan.returned_at = now
        loan.status = 'Returned'
        if 'fine_amount' in data:
            loan.fine_amount = data['fine_amount']
            loan.fine_status = data.get(
                'fine_status', 'Unpaid' if data['fine_amount'] > 0 else 'N/A'
            )
        elif now.date() > loan.due_date:
            overdue_days = (now.date() - loan.due_date).days
            loan.fine_amount = Decimal(overdue_days * 5)
            loan.fine_status = 'Unpaid'
        loan.save(update_fields=['returned_at', 'status', 'fine_amount', 'fine_status'])

        return success(
            data=BookLoanSerializer(loan).data,
            message='Book returned successfully',
        )

    @action(detail=True, methods=['post'], url_path='mark-lost')
    def mark_lost(self, request, pk=None):
        """Mark a book loan as lost and generate an unpaid fine."""
        loan = self.get_object()
        if loan.status == 'Returned':
            return error(
                'Cannot mark a returned book as lost.',
                status=status.HTTP_400_BAD_REQUEST,
            )
        if loan.status == 'Lost':
            return error(
                'Book loan is already marked as lost.',
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = BookLoanLostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        loan.status = 'Lost'
        loan.fine_amount = serializer.validated_data.get('fine_amount', loan.book.price)
        loan.fine_status = 'Unpaid'
        loan.save(update_fields=['status', 'fine_amount', 'fine_status'])

        return success(
            data=BookLoanSerializer(loan).data,
            message='Book marked as lost and fine generated',
        )


@extend_schema(tags=['Books'])
class BookRequestViewSet(viewsets.ModelViewSet):
    """Manage student book requests."""

    serializer_class = BookRequestSerializer
    permission_classes = [IsStaffOrAbove, IsSameLibrary]
    filterset_fields = ['status', 'category']
    search_fields = ['title', 'author', 'student__name']
    ordering_fields = ['upvotes', 'created_at']

    def get_queryset(self):
        user = self.request.user
        qs = BookRequest.objects.select_related('library', 'student')
        if user.role == 'SUPER_ADMIN':
            library_id = self.request.query_params.get('library')
            if library_id:
                qs = qs.filter(library_id=library_id)
            return qs
        if not user.library_id:
            return qs.none()
        return qs.filter(library_id=user.library_id)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'SUPER_ADMIN' and self.request.data.get('library'):
            serializer.save(library_id=self.request.data['library'])
        elif user.library_id:
            serializer.save(library=user.library)
        else:
            raise ValidationError({'library': 'User is not associated with a library.'})
