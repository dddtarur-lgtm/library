"""Automated tests for books, book loans, and book requests endpoints."""
from datetime import date, timedelta
import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.books.models import Book, BookLoan, BookRequest
from apps.libraries.models import Library
from apps.students.models import Student


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def book_setup(db):
    owner = User.objects.create_user(
        email='bookowner@example.com',
        password='StrongPass123',
        first_name='Book',
        last_name='Owner',
        role='LIBRARY_OWNER',
        email_verified=True,
    )
    library = Library.objects.create(
        code='LIB-BOOK',
        name='Book Library',
        owner=owner,
        city='Delhi',
        state='Delhi',
        address='10 Connaught Place',
        phone='7777777777',
    )
    owner.library = library
    owner.save(update_fields=['library'])
    student = Student.objects.create(
        library=library,
        name='Sonia Verma',
        email='sonia@example.com',
        phone='9777766666',
        gender='Female',
    )
    book = Book.objects.create(
        library=library,
        title='Indian Polity',
        author='M. Laxmikanth',
        isbn='9789352603633',
        category='UPSC',
        total_copies=2,
        price='650.00',
    )
    return owner, library, student, book


@pytest.mark.django_db
def test_book_catalog_crud(api_client, book_setup):
    owner, library, student, book = book_setup
    api_client.force_authenticate(user=owner)

    list_res = api_client.get('/api/v1/library/books/')
    assert list_res.status_code == 200
    assert list_res.data['count'] == 1

    create_res = api_client.post(
        '/api/v1/library/books/',
        {
            'title': 'Modern History',
            'author': 'Spectrum',
            'isbn': '9788179307212',
            'category': 'UPSC',
            'total_copies': 3,
            'price': '450.00',
        },
        format='json',
    )
    assert create_res.status_code == 201
    assert create_res.data['available_copies'] == 3


@pytest.mark.django_db
def test_book_loan_issue_return_and_mark_lost(api_client, book_setup):
    owner, library, student, book = book_setup
    api_client.force_authenticate(user=owner)

    due = (date.today() + timedelta(days=14)).isoformat()
    issue_res = api_client.post(
        '/api/v1/library/books/loans/',
        {
            'book': str(book.id),
            'copy_barcode': 'BK-001-A',
            'student': str(student.id),
            'due_date': due,
        },
        format='json',
    )
    assert issue_res.status_code == 201
    loan_id = issue_res.data['id']
    assert book.available_copies == 1

    ret_res = api_client.post(
        f'/api/v1/library/books/loans/{loan_id}/return/',
        {},
        format='json',
    )
    assert ret_res.status_code == 200
    assert BookLoan.objects.get(id=loan_id).status == 'Returned'
    assert book.available_copies == 2

    issue2_res = api_client.post(
        '/api/v1/library/books/loans/',
        {
            'book': str(book.id),
            'copy_barcode': 'BK-001-B',
            'student': str(student.id),
            'due_date': due,
        },
        format='json',
    )
    loan2_id = issue2_res.data['id']
    lost_res = api_client.post(
        f'/api/v1/library/books/loans/{loan2_id}/mark-lost/',
        {},
        format='json',
    )
    assert lost_res.status_code == 200
    loan2 = BookLoan.objects.get(id=loan2_id)
    assert loan2.status == 'Lost'
    assert loan2.fine_status == 'Unpaid'
    assert str(loan2.fine_amount) == '650.00'


@pytest.mark.django_db
def test_book_requests_create_and_update(api_client, book_setup):
    owner, library, student, book = book_setup
    api_client.force_authenticate(user=owner)

    req_res = api_client.post(
        '/api/v1/library/books/requests/',
        {
            'title': 'Indian Economy',
            'author': 'Ramesh Singh',
            'category': 'UPSC',
            'student': str(student.id),
        },
        format='json',
    )
    assert req_res.status_code == 201
    req_id = req_res.data['id']

    patch_res = api_client.patch(
        f'/api/v1/library/books/requests/{req_id}/',
        {'status': 'Approved'},
        format='json',
    )
    assert patch_res.status_code == 200
    assert BookRequest.objects.get(id=req_id).status == 'Approved'
