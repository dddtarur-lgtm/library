"""Serializers for Book, BookLoan, and BookRequest models."""
from decimal import Decimal
from django.utils import timezone
from rest_framework import serializers

from .models import Book, BookLoan, BookRequest


class BookSerializer(serializers.ModelSerializer):
    """Serializer for library book catalog items."""

    available_copies = serializers.IntegerField(read_only=True)
    isbn = serializers.CharField(required=False, default='', allow_blank=True)
    category = serializers.CharField(required=False, default='General', allow_blank=True)

    class Meta:
        model = Book
        fields = [
            'id',
            'library',
            'book_number',
            'title',
            'author',
            'isbn',
            'category',
            'rack_location',
            'total_copies',
            'available_copies',
            'price',
            'publisher',
            'edition_year',
            'cover_image',
            'rating',
            'created_at',
        ]
        read_only_fields = ['id', 'library', 'created_at']


class BookLoanSerializer(serializers.ModelSerializer):
    """Serializer for book loan issuance, return, and fine tracking."""

    book_title = serializers.CharField(source='book.title', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_code = serializers.CharField(source='student.student_code', read_only=True)

    class Meta:
        model = BookLoan
        fields = [
            'id',
            'book',
            'book_title',
            'copy_barcode',
            'student',
            'student_name',
            'student_code',
            'issued_at',
            'due_date',
            'returned_at',
            'status',
            'fine_amount',
            'fine_status',
        ]
        read_only_fields = ['id', 'returned_at']
        extra_kwargs = {
            'issued_at': {'required': False},
            'status': {'required': False},
        }

    def validate(self, attrs):
        if self.instance is None:
            book = attrs.get('book')
            student = attrs.get('student')
            request = self.context.get('request')

            if book and student and book.library_id != student.library_id:
                raise serializers.ValidationError(
                    'Book and student must belong to the same library.'
                )
            if (
                book
                and request
                and request.user.is_authenticated
                and request.user.role != 'SUPER_ADMIN'
                and book.library_id != request.user.library_id
            ):
                raise serializers.ValidationError('Book does not belong to your library.')
            if book and book.available_copies <= 0:
                raise serializers.ValidationError(
                    {'book': 'No available copies left for this book.'}
                )
            if not attrs.get('issued_at'):
                attrs['issued_at'] = timezone.now()
            due_date = attrs.get('due_date')
            if due_date and due_date < attrs['issued_at'].date():
                raise serializers.ValidationError(
                    {'due_date': 'Due date cannot be earlier than issue date.'}
                )
            attrs.setdefault('status', 'Issued')
        return attrs


class BookLoanReturnSerializer(serializers.Serializer):
    """Optional payload when returning a loaned book."""

    fine_amount = serializers.DecimalField(
        max_digits=8, decimal_places=2, min_value=Decimal('0.00'), required=False
    )
    fine_status = serializers.ChoiceField(
        choices=['Unpaid', 'Paid', 'Waived', 'N/A'],
        required=False,
    )


class BookLoanLostSerializer(serializers.Serializer):
    """Optional payload when marking a loaned book as lost."""

    fine_amount = serializers.DecimalField(
        max_digits=8, decimal_places=2, min_value=Decimal('0.00'), required=False
    )


class BookRequestSerializer(serializers.ModelSerializer):
    """Serializer for student book requests."""

    student_name = serializers.CharField(source='student.name', read_only=True)
    category = serializers.CharField(required=False, default='General', allow_blank=True)

    class Meta:
        model = BookRequest
        fields = [
            'id',
            'library',
            'title',
            'author',
            'category',
            'student',
            'student_name',
            'upvotes',
            'status',
            'created_at',
        ]
        read_only_fields = ['id', 'library', 'created_at']

    def validate_student(self, student):
        request = self.context.get('request')
        if (
            student
            and request
            and request.user.is_authenticated
            and request.user.role != 'SUPER_ADMIN'
            and student.library_id != request.user.library_id
        ):
            raise serializers.ValidationError('Student does not belong to your library.')
        return student
