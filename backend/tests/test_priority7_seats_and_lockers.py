"""Tests for Priority 7: Seats, Layouts, Allocations, and Lockers (Section 12)."""
import uuid
import pytest
from django.utils import timezone
from rest_framework import status

from apps.accounts.models import User
from apps.libraries.models import Library, Branch
from apps.students.models import Student
from apps.seats.models import (
    Floor, FloorRow, SeatCategory, Shift, Seat, SeatAllocation,
    SeatReservation, SeatWaitingList, SeatChangeRequest, Locker
)
from apps.core.jwt import generate_access_token, AUDIENCE_LIBRARY


@pytest.fixture
def library_tenant(db):
    owner = User.objects.create_user(
        email='owner.seat@library.com',
        password='Password123!',
        first_name='Anand',
        last_name='Kumar',
        role='LIBRARY_OWNER',
        phone='9876543299',
    )
    lib = Library.objects.create(
        code='LIB-SEAT-01',
        name='Super30 Study Centre',
        owner=owner,
        city='Patna',
        state='Bihar',
        address='Boring Road',
        phone='9876543299',
        plan_status='Active',
        library_status='Active',
    )
    Branch.objects.create(
        library=lib,
        name='Patna Main',
        address='Boring Road',
        phone='9876543299',
        is_main=True,
    )
    owner.library = lib
    owner.save(update_fields=['library'])
    return lib


@pytest.fixture
def other_branch(library_tenant):
    return Branch.objects.create(
        library=library_tenant,
        name='Kankarbagh Branch',
        address='Kankarbagh Main Rd',
        phone='9876543298',
        is_main=False,
    )


@pytest.fixture
def library_admin_user(library_tenant):
    return library_tenant.owner


@pytest.fixture
def library_token(library_tenant, library_admin_user):
    return generate_access_token(
        user_id=library_admin_user.id,
        audience=AUDIENCE_LIBRARY,
        extra_claims={
            'org_id': str(library_tenant.id),
            'member_id': str(library_admin_user.id),
            'role': 'owner',
            'branch_ids': 'all',
            'perm_ver': 1,
        }
    )


@pytest.fixture
def male_student(library_tenant):
    branch = library_tenant.branches.filter(is_main=True).first()
    user = User.objects.create_user(
        email='male.student@example.com',
        password='Password123!',
        first_name='Aakash',
        last_name='Verma',
        role='LIBRARY_OWNER',
        phone='9900112233',
    )
    return Student.objects.create(
        library=library_tenant,
        branch=branch,
        user=user,
        name='Aakash Verma',
        email='male.student@example.com',
        phone='9900112233',
        gender='Male',
        status='Live',
    )


@pytest.fixture
def female_student(library_tenant):
    branch = library_tenant.branches.filter(is_main=True).first()
    user = User.objects.create_user(
        email='female.student@example.com',
        password='Password123!',
        first_name='Ananya',
        last_name='Pandey',
        role='LIBRARY_OWNER',
        phone='9900112244',
    )
    return Student.objects.create(
        library=library_tenant,
        branch=branch,
        user=user,
        name='Ananya Pandey',
        email='female.student@example.com',
        phone='9900112244',
        gender='Female',
        status='Live',
    )


@pytest.mark.django_db
class TestPriority7SeatsAndFloors:
    """Tests covering Section 12.1 Floors, Rows, Map, and Summary."""

    def test_floors_crud_and_order(self, api_client, library_token, library_tenant):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")
        branch = library_tenant.branches.first()

        # POST /v1/library/floors
        f1_resp = api_client.post(
            "/v1/library/floors",
            {
                'branch_id': str(branch.id),
                'name': 'Ground Floor',
                'description': 'Main study hall',
                'sort_order': 0,
            },
            format="json"
        )
        assert f1_resp.status_code == status.HTTP_201_CREATED
        f1_id = f1_resp.json()["data"]["id"]

        # Duplicate name in branch -> 409
        dup_resp = api_client.post(
            "/v1/library/floors",
            {
                'branch_id': str(branch.id),
                'name': 'Ground Floor',
            },
            format="json"
        )
        assert dup_resp.status_code == status.HTTP_409_CONFLICT
        assert dup_resp.json()["error"]["code"] == "duplicate_name"

        f2_resp = api_client.post(
            "/v1/library/floors",
            {
                'branch_id': str(branch.id),
                'name': 'First Floor',
                'sort_order': 1,
            },
            format="json"
        )
        assert f2_resp.status_code == status.HTTP_201_CREATED
        f2_id = f2_resp.json()["data"]["id"]

        # PUT /v1/library/floors/order
        ord_resp = api_client.put(
            "/v1/library/floors/order",
            {'ids': [f2_id, f1_id]},
            format="json"
        )
        assert ord_resp.status_code == status.HTTP_204_NO_CONTENT

        # GET /v1/library/floors
        list_resp = api_client.get("/v1/library/floors")
        assert list_resp.status_code == status.HTTP_200_OK
        assert len(list_resp.json()["data"]) == 2

    def test_floor_rows_and_map_with_optimistic_layout_update(self, api_client, library_token, library_tenant):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")
        branch = library_tenant.branches.first()
        floor = Floor.objects.create(branch=branch, name='Reading Hall', version=1)

        # POST row
        row_resp = api_client.post(
            f"/v1/library/floors/{floor.id}/rows",
            {'label': 'Row A', 'sort_order': 1},
            format="json"
        )
        assert row_resp.status_code == status.HTTP_201_CREATED

        # Create seat on this floor
        seat = Seat.objects.create(
            branch=branch,
            floor_rel=floor,
            label='A-01',
            type='Desk',
            layout={'x': 10, 'y': 20, 'w': 40, 'h': 40},
        )

        # GET /v1/library/floors/{id}/map
        map_resp = api_client.get(f"/v1/library/floors/{floor.id}/map")
        assert map_resp.status_code == status.HTTP_200_OK
        map_data = map_resp.json()["data"]
        assert len(map_data["seats"]) == 1
        assert map_data["version"] == 1

        # PUT /v1/library/floors/{id}/layout with stale If-Match -> 409 version_conflict
        stale_resp = api_client.put(
            f"/v1/library/floors/{floor.id}/layout",
            {'seats': [{'id': str(seat.id), 'layout': {'x': 50, 'y': 60}}]},
            format="json",
            HTTP_IF_MATCH="99"
        )
        assert stale_resp.status_code == status.HTTP_409_CONFLICT
        assert stale_resp.json()["error"]["code"] == "version_conflict"

        # Valid update
        good_resp = api_client.put(
            f"/v1/library/floors/{floor.id}/layout",
            {'seats': [{'id': str(seat.id), 'layout': {'x': 50, 'y': 60}}]},
            format="json",
            HTTP_IF_MATCH="1"
        )
        assert good_resp.status_code == status.HTTP_200_OK
        assert good_resp.json()["data"]["version"] == 2


@pytest.mark.django_db
class TestPriority7SeatAllocationsAndRules:
    """Tests covering Section 12.2 and 12.3: Allocation Rules, Conflicts & Gender checks."""

    def test_seat_allocation_gender_restriction(self, api_client, library_token, library_tenant, male_student, female_student):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")
        branch = library_tenant.branches.first()
        floor = Floor.objects.create(branch=branch, name='Main Hall')

        # Create a Girls-Only category
        girls_cat = SeatCategory.objects.create(
            library=library_tenant,
            code='GIRLS',
            name='Girls Only Zone',
            allowed_gender='female',
        )

        seat = Seat.objects.create(
            branch=branch,
            floor_rel=floor,
            category=girls_cat,
            label='G-01',
        )

        # 1. Attempt allocating male student -> 409 seat_gender_mismatch
        male_alloc_resp = api_client.post(
            "/v1/library/seat-allocations",
            {
                'enrollment_id': str(male_student.id),
                'seat_id': str(seat.id),
            },
            format="json"
        )
        assert male_alloc_resp.status_code == status.HTTP_409_CONFLICT
        assert male_alloc_resp.json()["error"]["code"] == "seat_gender_mismatch"

        # 2. Allocating female student -> 201 Created
        female_alloc_resp = api_client.post(
            "/v1/library/seat-allocations",
            {
                'enrollment_id': str(female_student.id),
                'seat_id': str(seat.id),
            },
            format="json"
        )
        assert female_alloc_resp.status_code == status.HTTP_201_CREATED
        seat.refresh_from_db()
        assert seat.student == female_student
        assert seat.physical_status == "occupied"

    def test_seat_conflict_and_branch_mismatch_rules(self, api_client, library_token, library_tenant, other_branch, male_student):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")
        main_branch = library_tenant.branches.filter(is_main=True).first()
        floor = Floor.objects.create(branch=main_branch, name='Quiet Area')
        seat = Seat.objects.create(branch=main_branch, floor_rel=floor, label='Q-01')

        # Seat in other branch
        other_floor = Floor.objects.create(branch=other_branch, name='KB Floor 1')
        other_seat = Seat.objects.create(branch=other_branch, floor_rel=other_floor, label='KB-01')

        # Branch mismatch: male_student enrolled in main_branch, seat in other_branch -> 400 branch_mismatch
        mismatch_resp = api_client.post(
            "/v1/library/seat-allocations",
            {
                'enrollment_id': str(male_student.id),
                'seat_id': str(other_seat.id),
            },
            format="json"
        )
        assert mismatch_resp.status_code == status.HTTP_400_BAD_REQUEST
        assert mismatch_resp.json()["error"]["code"] == "branch_mismatch"

        # Create another student in main_branch
        u2 = User.objects.create_user(
            email='student2@example.com',
            password='Password123!',
            first_name='Dev',
            last_name='Anand',
            role='LIBRARY_OWNER',
            phone='9900112255',
        )
        s2 = Student.objects.create(
            library=library_tenant,
            branch=main_branch,
            user=u2,
            name='Dev Anand',
            email='student2@example.com',
            phone='9900112255',
            gender='Male',
            status='Live',
        )

        # Allocate seat to male_student
        api_client.post(
            "/v1/library/seat-allocations",
            {'enrollment_id': str(male_student.id), 'seat_id': str(seat.id)},
            format="json"
        )

        # Attempt to allocate same seat to s2 -> 409 seat_conflict
        clash_resp = api_client.post(
            "/v1/library/seat-allocations",
            {'enrollment_id': str(s2.id), 'seat_id': str(seat.id)},
            format="json"
        )
        assert clash_resp.status_code == status.HTTP_409_CONFLICT
        assert clash_resp.json()["error"]["code"] == "seat_conflict"

    def test_seat_change_and_release_lifecycle(self, api_client, library_token, library_tenant, male_student):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")
        branch = library_tenant.branches.first()
        floor = Floor.objects.create(branch=branch, name='Hall')
        seat1 = Seat.objects.create(branch=branch, floor_rel=floor, label='S-01')
        seat2 = Seat.objects.create(branch=branch, floor_rel=floor, label='S-02')

        # Allocate seat1
        alloc_resp = api_client.post(
            "/v1/library/seat-allocations",
            {'enrollment_id': str(male_student.id), 'seat_id': str(seat1.id)},
            format="json"
        )
        assert alloc_resp.status_code == status.HTTP_201_CREATED
        alloc_id = alloc_resp.json()["data"]["id"]

        # Move to seat2
        change_resp = api_client.post(
            f"/v1/library/seat-allocations/{alloc_id}/change",
            {
                'new_seat_id': str(seat2.id),
                'reason': 'Requested window-side seat',
            },
            format="json"
        )
        assert change_resp.status_code == status.HTTP_200_OK
        new_alloc_id = change_resp.json()["data"]["id"]

        seat1.refresh_from_db()
        seat2.refresh_from_db()
        assert seat1.student is None
        assert seat1.physical_status == "available"
        assert seat2.student == male_student
        assert seat2.physical_status == "occupied"

        # Release seat2
        rel_resp = api_client.post(
            f"/v1/library/seat-allocations/{new_alloc_id}/release",
            {'reason': 'Course completed early'},
            format="json"
        )
        assert rel_resp.status_code == status.HTTP_200_OK
        assert rel_resp.json()["data"]["released_at"] is not None

        seat2.refresh_from_db()
        assert seat2.student is None
        assert seat2.physical_status == "available"


@pytest.mark.django_db
class TestPriority7Lockers:
    """Tests covering Section 12.4 Lockers."""

    def test_locker_crud_and_assignment(self, api_client, library_token, library_tenant, male_student):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {library_token}")
        branch = library_tenant.branches.first()

        # Create bulk lockers
        bulk_resp = api_client.post(
            "/v1/library/lockers",
            {
                'branch_id': str(branch.id),
                'prefix': 'LK-',
                'from_number': 1,
                'to_number': 3,
            },
            format="json"
        )
        assert bulk_resp.status_code == status.HTTP_201_CREATED
        lockers = bulk_resp.json()["data"]
        assert len(lockers) == 3
        locker_id = lockers[0]["id"]

        # Assign locker to student
        assign_resp = api_client.post(
            f"/v1/library/lockers/{locker_id}/assign",
            {'enrollment_id': str(male_student.id)},
            format="json"
        )
        assert assign_resp.status_code == status.HTTP_200_OK
        assert assign_resp.json()["data"]["status"] == "occupied"
        assert assign_resp.json()["data"]["student_name"] == male_student.name

        # Release locker
        rel_resp = api_client.post(f"/v1/library/lockers/{locker_id}/release")
        assert rel_resp.status_code == status.HTTP_200_OK
        assert rel_resp.json()["data"]["status"] == "available"

