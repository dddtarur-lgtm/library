"""Unified views for Section 14 (Library Books & Circulation Desk) and Section 8.9 (Student Books)."""
import uuid
from decimal import Decimal
from django.db import models, transaction
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import PlatformAPIException
from apps.core.permissions import IsLibraryAudience, IsStudentAudience
from apps.core.context import get_current_org_id
from apps.libraries.models import Library, Branch, ActivityLog
from apps.students.models import Student, StudentMembership
from apps.books.models import (
    BookCategory,
    Book,
    BookCopy,
    BookLoan,
    BookRequest,
    BookFine,
    StockAudit,
)
from apps.books.v1_serializers import (
    BookCategorySerializer,
    BookCopySerializer,
    BookItemSerializer,
    BookDetailSerializer,
    BookCreateUpdateSerializer,
    BookLoanItemSerializer,
    BookLoanCreateSerializer,
    BookLoanReturnSerializer,
    BookFineSerializer,
    BookRequestSerializer,
    StockAuditSerializer,
)


def _get_current_library(request) -> Library:
    org_id = get_current_org_id() or getattr(request, 'org_id', None)
    if not org_id:
        raise PlatformAPIException('Tenant organization context missing.', code='unauthorized', status_code=status.HTTP_401_UNAUTHORIZED)
    library = Library.objects.filter(pk=org_id).first()
    if not library:
        raise PlatformAPIException('Library tenant not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
    return library


def _get_student_for_request(request) -> Student | None:
    enrollment_id = getattr(request, 'token_payload', {}).get('enrollment_id')
    if enrollment_id:
        student = Student.objects.filter(pk=enrollment_id).first()
        if student:
            return student
    return Student.objects.filter(user=request.user).first()


# ==============================================================================
# 14.1 Catalog APIs
# ==============================================================================

class LibraryBooksSummaryView(APIView):
    """GET /library/books/summary"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        branch_id = request.query_params.get('branch_id')

        books_qs = Book.objects.filter(library=library)
        copies_qs = BookCopy.objects.filter(book__library=library)
        loans_qs = BookLoan.objects.filter(book__library=library)

        if branch_id:
            copies_qs = copies_qs.filter(branch_id=branch_id)
            loans_qs = loans_qs.filter(copy__branch_id=branch_id)

        titles = books_qs.count()
        copies = copies_qs.count()
        available = copies_qs.filter(status='available').count()
        issued = copies_qs.filter(status='issued').count()
        overdue = loans_qs.filter(status='Overdue').count()
        lost_damaged = copies_qs.filter(status__in=['lost', 'damaged']).count()

        return Response({
            'titles': titles,
            'copies': copies,
            'available': available,
            'issued': issued,
            'overdue': overdue,
            'lost_damaged': lost_damaged,
        })


class LibraryBookCategoriesView(APIView):
    """GET & POST /library/book-categories"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = BookCategory.objects.filter(library=library).order_by('name')
        return Response(BookCategorySerializer(qs, many=True).data)

    def post(self, request):
        library = _get_current_library(request)
        name = request.data.get('name', '').strip()
        if not name:
            raise PlatformAPIException('Category name is required.', code='validation_error', status_code=status.HTTP_400_BAD_REQUEST)

        if BookCategory.objects.filter(library=library, name__iexact=name).exists():
            raise PlatformAPIException('Category with this name already exists.', code='duplicate_name', status_code=status.HTTP_409_CONFLICT)

        cat = BookCategory.objects.create(library=library, name=name)
        return Response(BookCategorySerializer(cat).data, status=status.HTTP_201_CREATED)


class LibraryBookCategoryDetailView(APIView):
    """PATCH & DELETE /library/book-categories/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def patch(self, request, pk):
        library = _get_current_library(request)
        cat = BookCategory.objects.filter(pk=pk, library=library).first()
        if not cat:
            raise PlatformAPIException('Category not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        name = request.data.get('name', '').strip()
        if name:
            if BookCategory.objects.filter(library=library, name__iexact=name).exclude(pk=pk).exists():
                raise PlatformAPIException('Category with this name already exists.', code='duplicate_name', status_code=status.HTTP_409_CONFLICT)
            cat.name = name
            cat.save()

        return Response(BookCategorySerializer(cat).data)

    def delete(self, request, pk):
        library = _get_current_library(request)
        cat = BookCategory.objects.filter(pk=pk, library=library).first()
        if not cat:
            raise PlatformAPIException('Category not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if cat.books.exists():
            raise PlatformAPIException('Cannot delete category in use by books.', code='category_in_use', status_code=status.HTTP_400_BAD_REQUEST)

        cat.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryBooksView(APIView):
    """GET & POST /library/books"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = Book.objects.filter(library=library).select_related('category_ref').prefetch_related('copies')

        q = request.query_params.get('q')
        if q:
            qs = qs.filter(models.Q(title__icontains=q) | models.Q(author__icontains=q) | models.Q(isbn__icontains=q))

        category_id = request.query_params.get('category_id')
        if category_id:
            qs = qs.filter(category_ref_id=category_id)

        rack = request.query_params.get('rack')
        if rack:
            qs = qs.filter(rack_location__icontains=rack)

        branch_id = request.query_params.get('branch_id')
        if branch_id:
            qs = qs.filter(copies__branch_id=branch_id).distinct()

        availability = request.query_params.get('availability')
        if availability == 'available':
            qs = [b for b in qs if b.available_copies > 0]
        elif availability == 'all_issued':
            qs = [b for b in qs if b.available_copies == 0]

        return Response(BookItemSerializer(qs[:100], many=True).data)

    def post(self, request):
        library = _get_current_library(request)
        serializer = BookCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        isbn = data.get('isbn', '').strip()
        if isbn and Book.objects.filter(library=library, isbn=isbn).exists():
            raise PlatformAPIException('A book with this ISBN already exists.', code='duplicate_isbn', status_code=status.HTTP_409_CONFLICT)

        category_ref = None
        if data.get('category_id'):
            category_ref = BookCategory.objects.filter(pk=data['category_id'], library=library).first()

        branch = None
        if data.get('branch_id'):
            branch = Branch.objects.filter(pk=data['branch_id'], library=library).first()
        if not branch:
            branch = library.branches.first()

        copies_count = data.get('copies_count', 1)

        with transaction.atomic():
            book = Book.objects.create(
                library=library,
                category_ref=category_ref,
                title=data['title'],
                author=data['author'],
                publisher=data.get('publisher', ''),
                edition_year=data.get('edition_year'),
                isbn=isbn,
                category=category_ref.name if category_ref else '',
                rack_location=data.get('rack', ''),
                total_copies=copies_count,
                price=data.get('price', Decimal('0.00')),
            )

            # Generate physical copies
            for _ in range(copies_count):
                barcode = f"BC-{uuid.uuid4().hex[:8].upper()}"
                BookCopy.objects.create(
                    book=book,
                    branch=branch,
                    barcode=barcode,
                    rack=data.get('rack', ''),
                    status='available',
                )

        return Response(BookDetailSerializer(book).data, status=status.HTTP_201_CREATED)


class LibraryBookDetailView(APIView):
    """GET, PATCH, DELETE /library/books/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request, pk):
        library = _get_current_library(request)
        book = Book.objects.filter(pk=pk, library=library).select_related('category_ref').prefetch_related('copies').first()
        if not book:
            raise PlatformAPIException('Book not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        holders = BookLoan.objects.filter(book=book, status__in=['Issued', 'Overdue']).order_by('-issued_at')
        history = BookLoan.objects.filter(book=book, status='Returned').order_by('-returned_at')[:10]

        data = BookDetailSerializer(book).data
        data['holders'] = BookLoanItemSerializer(holders, many=True).data
        data['history'] = BookLoanItemSerializer(history, many=True).data
        return Response(data)

    def patch(self, request, pk):
        library = _get_current_library(request)
        book = Book.objects.filter(pk=pk, library=library).first()
        if not book:
            raise PlatformAPIException('Book not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        for field in ['title', 'author', 'publisher', 'edition_year', 'isbn', 'rack_location', 'price']:
            if field in request.data:
                setattr(book, field, request.data[field])

        if 'category_id' in request.data:
            cat = BookCategory.objects.filter(pk=request.data['category_id'], library=library).first()
            book.category_ref = cat
            if cat:
                book.category = cat.name

        book.save()
        return Response(BookDetailSerializer(book).data)

    def delete(self, request, pk):
        library = _get_current_library(request)
        book = Book.objects.filter(pk=pk, library=library).first()
        if not book:
            raise PlatformAPIException('Book not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if book.loans.filter(status__in=['Issued', 'Overdue']).exists():
            raise PlatformAPIException('Cannot delete book with active loans.', code='book_has_open_loans', status_code=status.HTTP_400_BAD_REQUEST)

        book.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryBookCopiesView(APIView):
    """POST /library/books/{id}/copies"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        book = Book.objects.filter(pk=pk, library=library).first()
        if not book:
            raise PlatformAPIException('Book not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        branch_id = request.data.get('branch_id')
        branch = Branch.objects.filter(pk=branch_id, library=library).first() if branch_id else library.branches.first()
        rack = request.data.get('rack', book.rack_location)
        count = int(request.data.get('count', 1))

        created = []
        with transaction.atomic():
            for _ in range(count):
                barcode = request.data.get('barcode') if count == 1 else None
                if not barcode:
                    barcode = f"BC-{uuid.uuid4().hex[:8].upper()}"
                copy = BookCopy.objects.create(
                    book=book,
                    branch=branch,
                    barcode=barcode,
                    rack=rack,
                    status='available',
                )
                created.append(copy)

            book.total_copies += count
            book.save(update_fields=['total_copies'])

        return Response(BookCopySerializer(created, many=True).data, status=status.HTTP_201_CREATED)


class LibraryBookCopyDetailView(APIView):
    """PATCH /library/book-copies/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def patch(self, request, pk):
        library = _get_current_library(request)
        copy = BookCopy.objects.filter(pk=pk, book__library=library).first()
        if not copy:
            raise PlatformAPIException('Book copy not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if 'rack' in request.data:
            copy.rack = request.data['rack']
        if 'status' in request.data:
            copy.status = request.data['status']
        copy.save()

        return Response(BookCopySerializer(copy).data)


class LibraryBookCopyLookupView(APIView):
    """GET /library/book-copies/lookup?barcode=..."""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        barcode = request.query_params.get('barcode', '').strip()
        if not barcode:
            raise PlatformAPIException('Barcode is required.', code='validation_error', status_code=status.HTTP_400_BAD_REQUEST)

        copy = BookCopy.objects.filter(barcode=barcode, book__library=library).select_related('book', 'branch').first()
        if not copy:
            raise PlatformAPIException('Book copy not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        current_loan = BookLoan.objects.filter(copy_barcode=copy.barcode, status__in=['Issued', 'Overdue']).first()

        return Response({
            'copy': BookCopySerializer(copy).data,
            'book': BookItemSerializer(copy.book).data,
            'current_loan': BookLoanItemSerializer(current_loan).data if current_loan else None,
        })


class LibraryBooksLabelsView(APIView):
    """POST /library/books/labels"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request):
        return Response({'file_url': 'https://storage.example.com/labels/barcode_labels.pdf'}, status=status.HTTP_202_ACCEPTED)


# ==============================================================================
# 14.2 Desk Mode: Issue, Return, Renew (Flow 19.12)
# ==============================================================================

class LibraryDeskStudentLookupView(APIView):
    """GET /library/desk/student-lookup?code=..."""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        code = request.query_params.get('code', '').strip()
        if not code:
            raise PlatformAPIException('Student code, mobile, or card ID is required.', code='validation_error', status_code=status.HTTP_400_BAD_REQUEST)

        student = Student.objects.filter(
            models.Q(student_code__iexact=code) | models.Q(phone=code) | models.Q(qr_card_id__iexact=code),
            library=library,
        ).first()

        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        block_reasons = []

        # 1. Live status check
        if student.status != 'Live':
            block_reasons.append('not_live')

        # 2. Plan check
        active_mem = StudentMembership.objects.filter(student=student, status='active').first()
        plan_end = active_mem.end_date if active_mem else None
        if not active_mem or (plan_end and plan_end < timezone.now().date()):
            block_reasons.append('plan_expired')

        # 3. Book limit check (max 3 books)
        active_loans = BookLoan.objects.filter(student=student, status__in=['Issued', 'Overdue'])
        if active_loans.count() >= 3:
            block_reasons.append('limit_reached')

        # 4. Fines due check (limit 100)
        unpaid_fines = BookFine.objects.filter(student=student, status='unpaid').aggregate(s=models.Sum('amount'))['s'] or Decimal('0.00')
        if unpaid_fines >= Decimal('100.00'):
            block_reasons.append('fine_limit')

        can_borrow = (len(block_reasons) == 0)

        return Response({
            'student': {
                'id': str(student.id),
                'name': student.name,
                'student_code': student.student_code,
                'phone': student.phone,
                'status': student.status,
            },
            'plan_end_date': str(plan_end) if plan_end else None,
            'books_out': BookLoanItemSerializer(active_loans, many=True).data,
            'fines_due': str(unpaid_fines),
            'can_borrow': can_borrow,
            'block_reasons': block_reasons,
        })


class LibraryLoansView(APIView):
    """GET & POST /library/loans"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = BookLoan.objects.filter(book__library=library).select_related('book', 'student')

        loan_status = request.query_params.get('status')
        if loan_status:
            qs = qs.filter(status__iexact=loan_status)

        if request.query_params.get('overdue') == 'true':
            qs = qs.filter(status='Overdue')

        enrollment_id = request.query_params.get('enrollment_id')
        if enrollment_id:
            qs = qs.filter(student_id=enrollment_id)

        q = request.query_params.get('q')
        if q:
            qs = qs.filter(models.Q(book__title__icontains=q) | models.Q(student__name__icontains=q) | models.Q(copy_barcode__icontains=q))

        return Response(BookLoanItemSerializer(qs[:100], many=True).data)

    def post(self, request):
        library = _get_current_library(request)
        serializer = BookLoanCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        student = Student.objects.filter(pk=data['enrollment_id'], library=library).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if student.status != 'Live':
            raise PlatformAPIException('Student must be in Live status to borrow books.', code='student_not_live', status_code=status.HTTP_403_FORBIDDEN)

        # Unpaid fine check
        unpaid = BookFine.objects.filter(student=student, status='unpaid').aggregate(s=models.Sum('amount'))['s'] or Decimal('0.00')
        if unpaid >= Decimal('100.00'):
            raise PlatformAPIException('Student has unpaid fines exceeding limit.', code='unpaid_fine_limit', status_code=status.HTTP_400_BAD_REQUEST)

        # Max book limit check
        active_loans = BookLoan.objects.filter(student=student, status__in=['Issued', 'Overdue']).count()
        if active_loans >= 3:
            raise PlatformAPIException('Maximum book borrow limit reached.', code='book_limit_reached', status_code=status.HTTP_400_BAD_REQUEST)

        # Find Copy
        copy = BookCopy.objects.filter(barcode=data['barcode'], book__library=library).first()
        if not copy:
            raise PlatformAPIException('Book copy not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if copy.status != 'available':
            raise PlatformAPIException(f'Copy is not available ({copy.status}).', code='copy_not_available', status_code=status.HTTP_409_CONFLICT)

        due_date = data.get('due_on') or (timezone.now().date() + timezone.timedelta(days=14))

        with transaction.atomic():
            loan = BookLoan.objects.create(
                book=copy.book,
                copy=copy,
                copy_barcode=copy.barcode,
                student=student,
                issued_at=timezone.now(),
                due_date=due_date,
                status='Issued',
            )
            copy.status = 'issued'
            copy.save()

        return Response(BookLoanItemSerializer(loan).data, status=status.HTTP_201_CREATED)


class LibraryLoanReturnView(APIView):
    """POST /library/loans/{id}/return"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        loan = BookLoan.objects.filter(pk=pk, book__library=library).first()
        if not loan:
            raise PlatformAPIException('Loan not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if loan.status == 'Returned':
            raise PlatformAPIException('Book has already been returned.', code='already_returned', status_code=status.HTTP_400_BAD_REQUEST)

        serializer = BookLoanReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        now = timezone.now()
        condition = data.get('condition', 'ok')

        loan.returned_at = now
        loan.status = 'Returned' if condition != 'lost' else 'Lost'

        fine = None
        # Check late fine
        if now.date() > loan.due_date:
            days_late = (now.date() - loan.due_date).days
            fine_amount = Decimal(days_late * 5)
            loan.fine_amount = fine_amount
            loan.fine_status = 'Unpaid'

            fine = BookFine.objects.create(
                loan=loan,
                student=loan.student,
                amount=fine_amount,
                reason=f'Late return ({days_late} days)',
                status='unpaid',
            )

        # Check damaged/lost fine
        if condition in ['damaged', 'lost']:
            charge = loan.book.price if condition == 'lost' else Decimal('50.00')
            loan.fine_amount += charge
            loan.fine_status = 'Unpaid'
            fine = BookFine.objects.create(
                loan=loan,
                student=loan.student,
                amount=charge,
                reason=f'Book {condition}',
                status='unpaid',
            )

        # Handle copy status
        if loan.copy:
            loan.copy.status = 'available' if condition == 'ok' else condition
            loan.copy.save()

        # Handle collect fine in call
        payment_info = None
        if data.get('collect_fine') and fine:
            fine.status = 'paid'
            fine.save()
            loan.fine_status = 'Paid'
            payment_info = {
                'amount': str(fine.amount),
                'mode': data['collect_fine'].get('mode', 'cash'),
                'status': 'success',
            }

        loan.save()

        return Response({
            'loan': BookLoanItemSerializer(loan).data,
            'fine': BookFineSerializer(fine).data if fine else None,
            'payment': payment_info,
        })


class LibraryLoanRenewView(APIView):
    """POST /library/loans/{id}/renew"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        loan = BookLoan.objects.filter(pk=pk, book__library=library).first()
        if not loan:
            raise PlatformAPIException('Loan not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if loan.renew_count >= 2:
            raise PlatformAPIException('Maximum renewal limit reached (2 times).', code='renew_limit_reached', status_code=status.HTTP_400_BAD_REQUEST)

        # Check if requested by another student
        if BookRequest.objects.filter(book=loan.book, status='Requested').exclude(student=loan.student).exists():
            raise PlatformAPIException('Cannot renew: book has been requested by another student.', code='reserved_by_other', status_code=status.HTTP_409_CONFLICT)

        due_on = request.data.get('due_on') or (loan.due_date + timezone.timedelta(days=14))
        loan.due_date = due_on
        loan.renew_count += 1
        loan.save()

        return Response(BookLoanItemSerializer(loan).data)


class LibraryLoanRemindView(APIView):
    """POST /library/loans/{id}/remind"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryLoansRemindOverdueView(APIView):
    """POST /library/loans/remind-overdue"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request):
        library = _get_current_library(request)
        count = BookLoan.objects.filter(book__library=library, status='Overdue').count()
        return Response({'recipient_count': count}, status=status.HTTP_202_ACCEPTED)


# ==============================================================================
# 14.3 Requests, Fines & Stock Audit
# ==============================================================================

class LibraryBookRequestsView(APIView):
    """GET /library/book-requests"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = BookRequest.objects.filter(library=library)
        req_status = request.query_params.get('status')
        if req_status:
            qs = qs.filter(status__iexact=req_status)
        return Response(BookRequestSerializer(qs[:100], many=True).data)


class LibraryBookRequestReadyView(APIView):
    """POST /library/book-requests/{id}/ready"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        req = BookRequest.objects.filter(pk=pk, library=library).first()
        if not req:
            raise PlatformAPIException('Book request not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        req.status = 'ready'
        req.save()
        return Response(BookRequestSerializer(req).data)


class LibraryBookRequestRejectView(APIView):
    """POST /library/book-requests/{id}/reject"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        req = BookRequest.objects.filter(pk=pk, library=library).first()
        if not req:
            raise PlatformAPIException('Book request not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', 'Not available')
        req.status = 'rejected'
        req.note = reason
        req.save()
        return Response(BookRequestSerializer(req).data)


class LibraryBookRequestCollectedView(APIView):
    """POST /library/book-requests/{id}/collected"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        req = BookRequest.objects.filter(pk=pk, library=library).first()
        if not req:
            raise PlatformAPIException('Book request not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        book = req.book or Book.objects.filter(library=library, title__iexact=req.title).first()
        if not book:
            raise PlatformAPIException('Book catalog entry not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        copy = req.copy or book.copies.filter(status='available').first()
        if not copy:
            raise PlatformAPIException('No available copy to issue.', code='copy_not_available', status_code=status.HTTP_409_CONFLICT)

        with transaction.atomic():
            loan = BookLoan.objects.create(
                book=book,
                copy=copy,
                copy_barcode=copy.barcode,
                student=req.student,
                issued_at=timezone.now(),
                due_date=timezone.now().date() + timezone.timedelta(days=14),
                status='Issued',
            )
            copy.status = 'issued'
            copy.save()

            req.status = 'collected'
            req.save()

        return Response(BookLoanItemSerializer(loan).data, status=status.HTTP_201_CREATED)


class LibraryBookFinesView(APIView):
    """GET /library/book-fines"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = BookFine.objects.filter(student__library=library)

        fine_status = request.query_params.get('status')
        if fine_status:
            qs = qs.filter(status__iexact=fine_status)

        enrollment_id = request.query_params.get('enrollment_id')
        if enrollment_id:
            qs = qs.filter(student_id=enrollment_id)

        total_due = qs.filter(status='unpaid').aggregate(s=models.Sum('amount'))['s'] or Decimal('0.00')

        return Response({
            'fines': BookFineSerializer(qs[:100], many=True).data,
            'meta': {'total_due': f"{total_due:.2f}"},
        })


class LibraryBookFinePayView(APIView):
    """POST /library/book-fines/{id}/pay"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        fine = BookFine.objects.filter(pk=pk, student__library=library).first()
        if not fine:
            raise PlatformAPIException('Fine not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        fine.status = 'paid'
        fine.save()
        if fine.loan:
            fine.loan.fine_status = 'Paid'
            fine.loan.save()

        return Response(BookFineSerializer(fine).data)


class LibraryBookFineWaiveView(APIView):
    """POST /library/book-fines/{id}/waive"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        fine = BookFine.objects.filter(pk=pk, student__library=library).first()
        if not fine:
            raise PlatformAPIException('Fine not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        fine.status = 'waived'
        fine.save()
        if fine.loan:
            fine.loan.fine_status = 'Waived'
            fine.loan.save()

        return Response(BookFineSerializer(fine).data)


class LibraryStockAuditsView(APIView):
    """POST /library/stock-audits"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request):
        library = _get_current_library(request)
        branch_id = request.data.get('branch_id')
        branch = Branch.objects.filter(pk=branch_id, library=library).first() if branch_id else library.branches.first()

        rack = request.data.get('rack', '')
        copies_qs = BookCopy.objects.filter(branch=branch)
        if rack:
            copies_qs = copies_qs.filter(rack__iexact=rack)

        audit = StockAudit.objects.create(
            library=library,
            branch=branch,
            rack=rack,
            status='open',
            expected_count=copies_qs.count(),
        )

        return Response({
            'id': str(audit.id),
            'status': audit.status,
            'expected_count': audit.expected_count,
        }, status=status.HTTP_201_CREATED)


class LibraryStockAuditScansView(APIView):
    """POST /library/stock-audits/{id}/scans"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        audit = StockAudit.objects.filter(pk=pk, library=library).first()
        if not audit:
            raise PlatformAPIException('Stock audit not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        barcodes = request.data.get('barcodes', [])
        scanned = list(audit.scanned_barcodes or [])
        unknown = []

        for bc in barcodes:
            if not BookCopy.objects.filter(barcode=bc, branch=audit.branch).exists():
                unknown.append(bc)
            if bc not in scanned:
                scanned.append(bc)

        audit.scanned_barcodes = scanned
        audit.save()

        return Response({
            'scanned': len(scanned),
            'unknown': unknown,
        })


class LibraryStockAuditDetailView(APIView):
    """GET /library/stock-audits/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request, pk):
        library = _get_current_library(request)
        audit = StockAudit.objects.filter(pk=pk, library=library).first()
        if not audit:
            raise PlatformAPIException('Stock audit not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        copies_qs = BookCopy.objects.filter(branch=audit.branch)
        if audit.rack:
            copies_qs = copies_qs.filter(rack__iexact=audit.rack)

        expected_barcodes = set(copies_qs.values_list('barcode', flat=True))
        scanned_barcodes = set(audit.scanned_barcodes or [])

        missing = list(expected_barcodes - scanned_barcodes)
        extra = list(scanned_barcodes - expected_barcodes)

        return Response({
            'id': str(audit.id),
            'expected': len(expected_barcodes),
            'scanned': len(scanned_barcodes),
            'missing': missing,
            'extra': extra,
            'status': audit.status,
        })


class LibraryStockAuditCompleteView(APIView):
    """POST /library/stock-audits/{id}/complete"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        audit = StockAudit.objects.filter(pk=pk, library=library).first()
        if not audit:
            raise PlatformAPIException('Stock audit not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        mark_missing_as = request.data.get('mark_missing_as')
        copies_qs = BookCopy.objects.filter(branch=audit.branch)
        if audit.rack:
            copies_qs = copies_qs.filter(rack__iexact=audit.rack)

        expected_barcodes = set(copies_qs.values_list('barcode', flat=True))
        scanned_barcodes = set(audit.scanned_barcodes or [])
        missing = expected_barcodes - scanned_barcodes

        if mark_missing_as == 'lost':
            BookCopy.objects.filter(barcode__in=missing).update(status='lost')

        audit.status = 'completed'
        audit.save()

        return Response({
            'id': str(audit.id),
            'status': 'completed',
            'missing_count': len(missing),
            'marked_as': mark_missing_as or 'none',
        })


# ==============================================================================
# 8.9 Student App APIs: Books & Requests
# ==============================================================================

class StudentBookCategoriesView(APIView):
    """GET /student/book-categories"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = _get_student_for_request(request)
        if not student:
            return Response([])

        qs = BookCategory.objects.filter(library=student.library).order_by('name')
        return Response([
            {
                'id': str(c.id),
                'name': c.name,
                'book_count': c.books.count(),
            }
            for c in qs
        ])


class StudentBooksView(APIView):
    """GET /student/books"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = _get_student_for_request(request)
        if not student:
            return Response([])

        qs = Book.objects.filter(library=student.library).select_related('category_ref')

        q = request.query_params.get('q')
        if q:
            qs = qs.filter(models.Q(title__icontains=q) | models.Q(author__icontains=q))

        category_id = request.query_params.get('category_id')
        if category_id:
            qs = qs.filter(category_ref_id=category_id)

        available_only = request.query_params.get('available_only')
        if available_only == 'true':
            qs = [b for b in qs if b.available_copies > 0]

        return Response(BookItemSerializer(qs[:50], many=True).data)


class StudentBookDetailView(APIView):
    """GET /student/books/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request, pk):
        student = _get_student_for_request(request)
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        book = Book.objects.filter(pk=pk, library=student.library).first()
        if not book:
            raise PlatformAPIException('Book not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        my_req = BookRequest.objects.filter(book=book, student=student, status__in=['Requested', 'new', 'ready']).first()
        my_loan = BookLoan.objects.filter(book=book, student=student, status__in=['Issued', 'Overdue']).first()

        data = BookItemSerializer(book).data
        data['my_request'] = BookRequestSerializer(my_req).data if my_req else None
        data['my_loan'] = BookLoanItemSerializer(my_loan).data if my_loan else None
        return Response(data)


class StudentBookRequestCreateView(APIView):
    """POST /student/books/{id}/requests"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def post(self, request, pk):
        student = _get_student_for_request(request)
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        book = Book.objects.filter(pk=pk, library=student.library).first()
        if not book:
            raise PlatformAPIException('Book not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if BookRequest.objects.filter(book=book, student=student, status__in=['Requested', 'new', 'ready']).exists():
            raise PlatformAPIException('You already have an active request for this book.', code='already_requested', status_code=status.HTTP_400_BAD_REQUEST)

        active_req_count = BookRequest.objects.filter(student=student, status__in=['Requested', 'new', 'ready']).count()
        if active_req_count >= 3:
            raise PlatformAPIException('Maximum book request limit reached.', code='request_limit_reached', status_code=status.HTTP_400_BAD_REQUEST)

        req = BookRequest.objects.create(
            library=student.library,
            book=book,
            title=book.title,
            author=book.author,
            category=book.category,
            student=student,
            note=request.data.get('note', ''),
            status='new',
        )

        return Response(BookRequestSerializer(req).data, status=status.HTTP_201_CREATED)


class StudentBookRequestsListView(APIView):
    """GET /student/book-requests"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = _get_student_for_request(request)
        if not student:
            return Response([])

        qs = BookRequest.objects.filter(student=student).order_by('-created_at')
        req_status = request.query_params.get('status')
        if req_status:
            qs = qs.filter(status__iexact=req_status)

        return Response(BookRequestSerializer(qs[:50], many=True).data)


class StudentBookRequestDeleteView(APIView):
    """DELETE /student/book-requests/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def delete(self, request, pk):
        student = _get_student_for_request(request)
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        req = BookRequest.objects.filter(pk=pk, student=student).first()
        if not req:
            raise PlatformAPIException('Request not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if req.status not in ['Requested', 'new', 'ready']:
            raise PlatformAPIException('Only new or ready requests can be cancelled.', code='invalid_state', status_code=status.HTTP_400_BAD_REQUEST)

        req.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StudentBookLoansView(APIView):
    """GET /student/loans"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = _get_student_for_request(request)
        if not student:
            return Response([])

        qs = BookLoan.objects.filter(student=student).select_related('book').order_by('-issued_at')
        loan_status = request.query_params.get('status')
        if loan_status:
            qs = qs.filter(status__iexact=loan_status)

        return Response(BookLoanItemSerializer(qs[:50], many=True).data)


class StudentBookLoanRenewView(APIView):
    """POST /student/loans/{id}/renew"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def post(self, request, pk):
        student = _get_student_for_request(request)
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        loan = BookLoan.objects.filter(pk=pk, student=student, status__in=['Issued', 'Overdue']).first()
        if not loan:
            raise PlatformAPIException('Active loan not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if loan.renew_count >= 2:
            raise PlatformAPIException('Maximum renewal limit reached.', code='renew_limit_reached', status_code=status.HTTP_400_BAD_REQUEST)

        if BookRequest.objects.filter(book=loan.book, status__in=['Requested', 'new']).exclude(student=student).exists():
            raise PlatformAPIException('Cannot renew: book has been requested by another student.', code='reserved_by_other', status_code=status.HTTP_409_CONFLICT)

        loan.due_date = loan.due_date + timezone.timedelta(days=14)
        loan.renew_count += 1
        loan.save()

        return Response({
            'status': 'renewed',
            'due_on': str(loan.due_date),
            'loan': BookLoanItemSerializer(loan).data,
        })


class StudentBookFinesView(APIView):
    """GET /student/fines"""
    permission_classes = [permissions.IsAuthenticated, IsStudentAudience]

    def get(self, request):
        student = _get_student_for_request(request)
        if not student:
            return Response({'fines': [], 'total_due': '0.00'})

        qs = BookFine.objects.filter(student=student).order_by('-created_at')
        fine_status = request.query_params.get('status')
        if fine_status:
            qs = qs.filter(status__iexact=fine_status)

        total_due = qs.filter(status='unpaid').aggregate(s=models.Sum('amount'))['s'] or Decimal('0.00')

        return Response({
            'fines': BookFineSerializer(qs[:50], many=True).data,
            'total_due': f"{total_due:.2f}",
        })
