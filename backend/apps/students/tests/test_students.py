"""Automated tests for students and memberships endpoints."""
from datetime import date, timedelta
from decimal import Decimal
import pytest
from django.core import mail
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.libraries.models import Branch, Library
from apps.students.models import Student, StudentMembership


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def library_setup(db):
    owner = User.objects.create_user(
        email='libowner@example.com',
        password='StrongPass123',
        first_name='Lib',
        last_name='Owner',
        role='LIBRARY_OWNER',
        email_verified=True,
    )
    library = Library.objects.create(
        code='LIB-001',
        name='Central Study Library',
        owner=owner,
        city='Ahmedabad',
        state='Gujarat',
        address='123 Main St',
        phone='9999999999',
    )
    owner.library = library
    owner.save(update_fields=['library'])
    branch = Branch.objects.create(
        library=library,
        name='Main Branch',
        address='123 Main St',
        phone='9999999999',
        is_main=True,
    )
    return owner, library, branch


@pytest.fixture
def super_admin(db):
    return User.objects.create_superuser(
        email='admin@example.com',
        password='StrongPass123',
        first_name='Super',
        last_name='Admin',
    )


@pytest.mark.django_db
def test_student_crud_and_soft_delete(api_client, library_setup):
    owner, library, branch = library_setup
    api_client.force_authenticate(user=owner)

    create_res = api_client.post(
        '/api/v1/library/students/',
        {
            'name': 'Rohan Sharma',
            'email': 'rohan@example.com',
            'phone': '9876543210',
            'gender': 'Male',
            'branch': str(branch.id),
            'exam_target': 'UPSC',
        },
        format='json',
    )
    assert create_res.status_code == 201
    student_id = create_res.data['id']
    assert create_res.data['student_code'].startswith('STU-')

    list_res = api_client.get('/api/v1/library/students/')
    assert list_res.status_code == 200
    assert list_res.data['count'] == 1

    del_res = api_client.delete(f'/api/v1/library/students/{student_id}/')
    assert del_res.status_code == 204

    student = Student.objects.get(id=student_id)
    assert student.is_deleted is True
    assert student.status == 'Suspended'


@pytest.mark.django_db
def test_student_memberships_and_payments(api_client, library_setup):
    owner, library, branch = library_setup
    student = Student.objects.create(
        library=library,
        branch=branch,
        name='Priya Patel',
        email='priya@example.com',
        phone='9876500000',
        gender='Female',
    )
    api_client.force_authenticate(user=owner)

    today = date.today()
    post_res = api_client.post(
        f'/api/v1/library/students/{student.id}/memberships/',
        {
            'shift': 'Morning',
            'start_date': today.isoformat(),
            'end_date': (today + timedelta(days=30)).isoformat(),
            'status': 'Active',
            'amount_paid': '1500.00',
            'payment_mode': 'UPI',
        },
        format='json',
    )
    assert post_res.status_code == 201
    assert StudentMembership.objects.filter(student=student).count() == 1

    student.refresh_from_db()
    assert student.status == 'Live'

    pay_res = api_client.get(f'/api/v1/library/students/{student.id}/payments/')
    assert pay_res.status_code == 200
    assert len(pay_res.data['data']) == 1
    assert pay_res.data['data'][0]['amount_paid'] == '1500.00'


@pytest.mark.django_db
def test_student_suspend_and_send_reminder(api_client, library_setup):
    owner, library, branch = library_setup
    student = Student.objects.create(
        library=library,
        branch=branch,
        name='Amit Verma',
        email='amit@example.com',
        phone='9123456789',
        gender='Male',
        status='Live',
    )
    api_client.force_authenticate(user=owner)

    rem_res = api_client.post(f'/api/v1/library/students/{student.id}/send-reminder/')
    assert rem_res.status_code == 200
    assert len(mail.outbox) == 1

    susp_res = api_client.post(f'/api/v1/library/students/{student.id}/suspend/', {}, format='json')
    assert susp_res.status_code == 200
    student.refresh_from_db()
    assert student.status == 'Suspended'


@pytest.mark.django_db
def test_platform_students_super_admin_only(api_client, library_setup, super_admin):
    owner, library, branch = library_setup
    Student.objects.create(
        library=library,
        branch=branch,
        name='Neha Gupta',
        email='neha@example.com',
        phone='9000011111',
        gender='Female',
    )

    api_client.force_authenticate(user=owner)
    forbidden_res = api_client.get('/api/v1/platform/students/')
    assert forbidden_res.status_code == 403

    api_client.force_authenticate(user=super_admin)
    ok_res = api_client.get('/api/v1/platform/students/')
    assert ok_res.status_code == 200
    assert ok_res.data['count'] == 1
