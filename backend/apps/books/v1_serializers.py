"""Serializers for Section 14 (Library Books & Loans) and Student Books (Section 8.9)."""
from rest_framework import serializers
from apps.books.models import BookCategory, Book, BookCopy, BookLoan, BookRequest, BookFine, StockAudit


class BookCategorySerializer(serializers.ModelSerializer):
    book_count = serializers.SerializerMethodField()

    class Meta:
        model = BookCategory
        fields = ['id', 'name', 'book_count', 'created_at']

    def get_book_count(self, obj):
        return obj.books.count()


class BookCopySerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True, default=None)

    class Meta:
        model = BookCopy
        fields = ['id', 'book_id', 'branch_id', 'branch_name', 'barcode', 'rack', 'status', 'created_at']


class BookItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category_ref.name', read_only=True, default='')
    available_copies = serializers.IntegerField(read_only=True)
    price = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            'id',
            'book_number',
            'title',
            'author',
            'isbn',
            'category_ref_id',
            'category_name',
            'category',
            'rack_location',
            'total_copies',
            'available_copies',
            'price',
            'publisher',
            'edition_year',
            'created_at',
        ]

    def get_price(self, obj):
        return f"{obj.price:.2f}"


class BookDetailSerializer(BookItemSerializer):
    copies = BookCopySerializer(many=True, read_only=True)

    class Meta(BookItemSerializer.Meta):
        fields = BookItemSerializer.Meta.fields + ['copies']


class BookCreateUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500, required=True)
    author = serializers.CharField(max_length=255, required=True)
    publisher = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    edition_year = serializers.IntegerField(required=False, allow_null=True)
    isbn = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')
    category_id = serializers.UUIDField(required=False, allow_null=True)
    rack = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    price = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, default=0.00)
    copies_count = serializers.IntegerField(required=False, default=1, min_value=1)
    branch_id = serializers.UUIDField(required=False, allow_null=True)


class BookLoanItemSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    fine_amount = serializers.SerializerMethodField()

    class Meta:
        model = BookLoan
        fields = [
            'id',
            'book_id',
            'book_title',
            'copy_barcode',
            'student_id',
            'student_name',
            'issued_at',
            'due_date',
            'returned_at',
            'status',
            'fine_amount',
            'fine_status',
        ]

    def get_fine_amount(self, obj):
        return f"{obj.fine_amount:.2f}"


class BookLoanCreateSerializer(serializers.Serializer):
    enrollment_id = serializers.UUIDField(required=True)
    barcode = serializers.CharField(max_length=50, required=True)
    due_on = serializers.DateField(required=False)


class BookLoanReturnSerializer(serializers.Serializer):
    condition = serializers.ChoiceField(choices=['ok', 'damaged', 'lost'], default='ok')
    collect_fine = serializers.JSONField(required=False, allow_null=True)
    note = serializers.CharField(required=False, allow_blank=True, default='')


class BookFineSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    amount = serializers.SerializerMethodField()

    class Meta:
        model = BookFine
        fields = ['id', 'loan_id', 'student_id', 'student_name', 'amount', 'reason', 'status', 'created_at']

    def get_amount(self, obj):
        return f"{obj.amount:.2f}"


class BookRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)

    class Meta:
        model = BookRequest
        fields = ['id', 'title', 'author', 'category', 'student_id', 'student_name', 'upvotes', 'status', 'created_at']


class StockAuditSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    scanned_count = serializers.SerializerMethodField()

    class Meta:
        model = StockAudit
        fields = ['id', 'branch_id', 'branch_name', 'rack', 'status', 'expected_count', 'scanned_count', 'created_at']

    def get_scanned_count(self, obj):
        return len(obj.scanned_barcodes or [])

