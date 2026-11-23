"""Phase 4 Parity Test Suite: Books, Learning Resources & Physical Circulation Desk.
Covers Section 14 (Library Books, Desk Mode & Stock Audit) and Section 8.9 (Student Books & Requests).
"""
import uuid
from decimal import Decimal
import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.libraries.models import Library, Branch
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
from apps.core.jwt import generate_access_token, AUDIENCE_LIBRARY, AUDIENCE_STUDENT


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def library_tenant(db):
    owner = User.objects.create_user(
        email='owner.books@library.com',
        password='Password123!',
        first_name='Rabindranath',
        last_name='Tagore',
        role='LIBRARY_OWNER',
        phone='9876543444',
    )
    lib = Library.objects.create(
        code='LIB-BK-01',
        name='Visva Bharati Central Library',
        owner=owner,
        city='Kolkata',
        state='West Bengal',
        address='Shantiniketan',
        phone='9876543444',
        plan_status='Active',
        library_status='Active',
    )
    Branch.objects.create(
        library=lib,
        name='Main Reading Hall',
        address='Shantiniketan',
        phone='9876543444',
        is_main=True,
    )
    owner.library = lib
    owner.save(update_fields=['library'])
    return lib


@pytest.fixture
def library_token(library_tenant):
    owner = library_tenant.owner
    return generate_access_token(
        user_id=owner.id,
        audience=AUDIENCE_LIBRARY,
        extra_claims={
            'org_id': str(library_tenant.id),
            'member_id': str(owner.id),
            'role': 'owner',
            'branch_ids': 'all',
            'perm_ver': 1,
        }
    )


@pytest.fixture
def live_student(library_tenant):
    branch = library_tenant.branches.first()
    u = User.objects.create_user(
        email='student.book@example.com',
        password='Password123!',
        first_name='Sourav',
        last_name='Ganguly',
        role='LIBRARY_OWNER',
        phone='9833445566',
    )
    student = Student.objects.create(
        library=library_tenant,
        branch=branch,
        user=u,
        name='Sourav Ganguly',
        email='student.book@example.com',
        phone='9833445566',
        gender='Male',
        status='Live',
    )
    # Active membership
    StudentMembership.objects.create(
        student=student,
        shift='Morning',
        start_date=timezone.now().date() - timezone.timedelta(days=10),
        end_date=timezone.now().date() + timezone.timedelta(days=80),
        status='active',
        amount_paid=Decimal('1500.00'),
        payment_mode='Cash',
    )
    return student


@pytest.fixture
def live_student_token(library_tenant, live_student):
    return generate_access_token(
        user_id=live_student.user.id,
        audience=AUDIENCE_STUDENT,
        extra_claims={
            'student_id': str(live_student.id),
            'library_id': str(library_tenant.id),
            'branch_id': str(live_student.branch.id),
            'enrollment_id': str(live_student.id),
        }
    )


@pytest.mark.django_db
class TestPhase4BooksCatalogAndCopies:
    """Covers Section 14.1 Books Catalog, Categories, and Physical Copies."""

    def test_categories_and_catalog_crud(self, client, library_tenant, library_token):
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {library_token}')

        # 1. Create Category
        cat_res = client.post(
            '/v1/library/book-categories',
            {'name': 'UPSC Civil Services'},
            format='json'
        )
        assert cat_res.status_code == status.HTTP_201_CREATED
        cat_id = cat_res.data['id']

        # Duplicate name returns 409
        dup_res = client.post(
            '/v1/library/book-categories',
            {'name': 'UPSC Civil Services'},
            format='json'
        )
        assert dup_res.status_code == status.HTTP_409_CONFLICT
        assert dup_res.data['error']['code'] == 'duplicate_name'

        # 2. Create Book
        book_res = client.post(
            '/v1/library/books',
            {
                'title': 'Indian Polity 6th Edition',
                'author': 'M. Laxmikanth',
                'publisher': 'McGraw Hill',
                'isbn': '978-9353160197',
                'category_id': cat_id,
                'rack': 'Rack-A1',
                'copies_count': 3,
                'price': '850.00',
            },
            format='json'
        )
        assert book_res.status_code == status.HTTP_201_CREATED
        book_id = book_res.data['id']
        assert len(book_res.data['copies']) == 3
        copy_barcode = book_res.data['copies'][0]['barcode']

        # 3. Summary check
        sum_res = client.get('/v1/library/books/summary')
        assert sum_res.status_code == status.HTTP_200_OK
        assert sum_res.data['titles'] >= 1
        assert sum_res.data['copies'] >= 3

        # 4. Copy lookup by barcode
        lookup_res = client.get(f'/v1/library/book-copies/lookup?barcode={copy_barcode}')
        assert lookup_res.status_code == status.HTTP_200_OK
        assert lookup_res.data['copy']['barcode'] == copy_barcode
        assert lookup_res.data['book']['title'] == 'Indian Polity 6th Edition'

        # 5. Add more copies
        branch = library_tenant.branches.first()
        add_copies_res = client.post(
            f'/v1/library/books/{book_id}/copies',
            {'branch_id': str(branch.id), 'count': 2, 'rack': 'Rack-A2'},
            format='json'
        )
        assert add_copies_res.status_code == status.HTTP_201_CREATED
        assert len(add_copies_res.data) == 2

        # 6. Category in use cannot be deleted
        del_cat_res = client.delete(f'/v1/library/book-categories/{cat_id}')
        assert del_cat_res.status_code == status.HTTP_400_BAD_REQUEST
        assert del_cat_res.data['error']['code'] == 'category_in_use'


@pytest.mark.django_db
class TestPhase4DeskModeFlow1912:
    """Covers Section 14.2 Desk Mode: Issue, Return, and Renew (Flow 19.12)."""

    def test_desk_lookup_issue_return_and_renew(self, client, library_tenant, library_token, live_student):
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {library_token}')

        # Create book and copy
        book = Book.objects.create(
            library=library_tenant,
            title='Concepts of Physics Vol 1',
            author='H.C. Verma',
            isbn='978-8177091878',
            category='Physics',
            price=Decimal('450.00'),
            total_copies=1,
        )
        copy = BookCopy.objects.create(
            book=book,
            branch=library_tenant.branches.first(),
            barcode='BC-PHY-001',
            status='available',
        )

        # 1. Desk Student Lookup (Flow 19.12 Step 1)
        lookup_res = client.get(f'/v1/library/desk/student-lookup?code={live_student.phone}')
        assert lookup_res.status_code == status.HTTP_200_OK
        assert lookup_res.data['student']['name'] == 'Sourav Ganguly'
        assert lookup_res.data['can_borrow'] is True

        # 2. Issue Book (Step 3a)
        issue_res = client.post(
            '/v1/library/loans',
            {
                'enrollment_id': str(live_student.id),
                'barcode': copy.barcode,
            },
            format='json'
        )
        assert issue_res.status_code == status.HTTP_201_CREATED
        loan_id = issue_res.data['id']

        # Copy status is now issued
        copy.refresh_from_db()
        assert copy.status == 'issued'

        # Attempt to issue already issued copy fails
        dup_issue = client.post(
            '/v1/library/loans',
            {'enrollment_id': str(live_student.id), 'barcode': copy.barcode},
            format='json'
        )
        assert dup_issue.status_code == status.HTTP_409_CONFLICT
        assert dup_issue.data['error']['code'] == 'copy_not_available'

        # 3. Renew Book (Step 4)
        renew_res = client.post(f'/v1/library/loans/{loan_id}/renew', {}, format='json')
        assert renew_res.status_code == status.HTTP_200_OK

        # 4. Return Book (Step 3b)
        return_res = client.post(
            f'/v1/library/loans/{loan_id}/return',
            {'condition': 'ok'},
            format='json'
        )
        assert return_res.status_code == status.HTTP_200_OK
        assert return_res.data['loan']['status'] == 'Returned'

        copy.refresh_from_db()
        assert copy.status == 'available'

        # 5. Overdue Reminders
        remind_res = client.post('/v1/library/loans/remind-overdue', {}, format='json')
        assert remind_res.status_code == status.HTTP_202_ACCEPTED


@pytest.mark.django_db
class TestPhase4RequestsFinesAndStockAudit:
    """Covers Section 14.3 Requests, Fines, and Stock Audits."""

    def test_requests_fines_and_stock_audit_lifecycle(self, client, library_tenant, library_token, live_student):
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {library_token}')
        branch = library_tenant.branches.first()

        # 1. Book Request Ready & Collected
        book = Book.objects.create(
            library=library_tenant,
            title='Modern Indian History',
            author='Bipan Chandra',
            price=Decimal('350.00'),
            total_copies=1,
        )
        copy = BookCopy.objects.create(
            book=book,
            branch=branch,
            barcode='BC-HIS-001',
            status='available',
        )
        req = BookRequest.objects.create(
            library=library_tenant,
            book=book,
            student=live_student,
            title=book.title,
            status='new',
        )

        ready_res = client.post(f'/v1/library/book-requests/{req.id}/ready', {}, format='json')
        assert ready_res.status_code == status.HTTP_200_OK
        assert ready_res.data['status'] == 'ready'

        collected_res = client.post(f'/v1/library/book-requests/{req.id}/collected', {}, format='json')
        assert collected_res.status_code == status.HTTP_201_CREATED
        assert collected_res.data['book_title'] == book.title

        # 2. Book Fines: Pay and Waive
        fine = BookFine.objects.create(
            student=live_student,
            amount=Decimal('50.00'),
            reason='Late return',
            status='unpaid',
        )
        fines_res = client.get('/v1/library/book-fines')
        assert fines_res.status_code == status.HTTP_200_OK
        assert len(fines_res.data['fines']) >= 1

        pay_res = client.post(f'/v1/library/book-fines/{fine.id}/pay', {'mode': 'cash'}, format='json')
        assert pay_res.status_code == status.HTTP_200_OK
        assert pay_res.data['status'] == 'paid'

        # 3. Stock Audit Lifecycle
        audit_res = client.post(
            '/v1/library/stock-audits',
            {'branch_id': str(branch.id), 'rack': 'Rack-A1'},
            format='json'
        )
        assert audit_res.status_code == status.HTTP_201_CREATED
        audit_id = audit_res.data['id']

        scans_res = client.post(
            f'/v1/library/stock-audits/{audit_id}/scans',
            {'barcodes': [copy.barcode]},
            format='json'
        )
        assert scans_res.status_code == status.HTTP_200_OK

        audit_detail = client.get(f'/v1/library/stock-audits/{audit_id}')
        assert audit_detail.status_code == status.HTTP_200_OK
        assert 'expected' in audit_detail.data

        complete_res = client.post(
            f'/v1/library/stock-audits/{audit_id}/complete',
            {'mark_missing_as': 'none'},
            format='json'
        )
        assert complete_res.status_code == status.HTTP_200_OK
        assert complete_res.data['status'] == 'completed'


@pytest.mark.django_db
class TestPhase4StudentBooksAndSelfService:
    """Covers Section 8.9 Student App Catalog, Requests, Loans, and Fines."""

    def test_student_book_catalog_and_requests(self, client, library_tenant, live_student, live_student_token):
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {live_student_token}')

        cat = BookCategory.objects.create(library=library_tenant, name='General Knowledge')
        book = Book.objects.create(
            library=library_tenant,
            category_ref=cat,
            title='Lucent General Knowledge',
            author='Lucent Team',
            category=cat.name,
            price=Decimal('220.00'),
            total_copies=1,
        )

        # 1. Student Categories
        cats_res = client.get('/v1/student/book-categories')
        assert cats_res.status_code == status.HTTP_200_OK
        assert any(c['name'] == 'General Knowledge' for c in cats_res.data)

        # 2. Student Books Catalog
        books_res = client.get('/v1/student/books')
        assert books_res.status_code == status.HTTP_200_OK
        assert len(books_res.data) >= 1

        # 3. Student Book Detail
        detail_res = client.get(f'/v1/student/books/{book.id}')
        assert detail_res.status_code == status.HTTP_200_OK
        assert detail_res.data['title'] == 'Lucent General Knowledge'

        # 4. Student Book Request Create
        req_res = client.post(
            f'/v1/student/books/{book.id}/requests',
            {'note': 'Need for upcoming preliminary exam'},
            format='json'
        )
        assert req_res.status_code == status.HTTP_201_CREATED
        req_id = req_res.data['id']

        # Duplicate active request fails
        dup_req = client.post(
            f'/v1/student/books/{book.id}/requests',
            {},
            format='json'
        )
        assert dup_req.status_code == status.HTTP_400_BAD_REQUEST
        assert dup_req.data['error']['code'] == 'already_requested'

        # 5. List Student Requests
        list_req = client.get('/v1/student/book-requests')
        assert list_req.status_code == status.HTTP_200_OK
        assert len(list_req.data) >= 1

        # 6. Cancel Request
        del_req = client.delete(f'/v1/student/book-requests/{req_id}')
        assert del_req.status_code == status.HTTP_204_NO_CONTENT

        # 7. Student Fines List
        fines_res = client.get('/v1/student/fines')
        assert fines_res.status_code == status.HTTP_200_OK
        assert 'total_due' in fines_res.data
