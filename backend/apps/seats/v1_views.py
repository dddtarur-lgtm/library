"""Views for Section 12 (Library panel APIs: seats and lockers)."""
import uuid
from decimal import Decimal
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsLibraryAudience
from apps.core.exceptions import PlatformAPIException
from apps.core.context import get_current_org_id
from apps.libraries.models import Library, Branch, ActivityLog
from apps.students.models import Student
from apps.seats.models import (
    Floor, FloorRow, SeatCategory, Shift, Seat, SeatAllocation,
    SeatAllocationHistory, SeatReservation, SeatWaitingList,
    SeatChangeRequest, Locker
)
from apps.seats.v1_serializers import (
    FloorSerializer, FloorCreateUpdateSerializer, FloorRowSerializer,
    SeatCategorySerializer, SeatCategoryCreateUpdateSerializer,
    ShiftSerializer, ShiftCreateUpdateSerializer,
    SeatItemSerializer, SeatDetailSerializer, SeatCreateSerializer, SeatBulkCreateSerializer,
    SeatAllocationSerializer, SeatAllocationCreateSerializer, SeatAllocationChangeSerializer,
    SeatAllocationReleaseSerializer, SeatReservationSerializer, SeatWaitingListSerializer,
    SeatChangeRequestSerializer, LockerSerializer
)


def _get_current_library(request):
    org_id = get_current_org_id() or getattr(request, 'org_id', None)
    if not org_id:
        raise PlatformAPIException('Tenant organization context missing.', code='unauthorized', status_code=status.HTTP_401_UNAUTHORIZED)
    library = Library.objects.filter(pk=org_id).first()
    if not library:
        raise PlatformAPIException('Library tenant not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
    return library


# ==============================================================================
# 12.1 Summary, Floors, Rows
# ==============================================================================

class LibrarySeatsSummaryView(APIView):
    """GET /library/seats/summary"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        seats_qs = Seat.objects.filter(branch__library=library, is_active=True)

        branch_id = request.query_params.get('branch_id')
        if branch_id:
            seats_qs = seats_qs.filter(branch_id=branch_id)

        total = seats_qs.count()
        occupied = seats_qs.filter(Q(student__isnull=False) | Q(physical_status='occupied')).count()
        maintenance = seats_qs.filter(physical_status='maintenance').count()
        reserved = seats_qs.filter(physical_status='reserved').count()
        available = max(0, total - occupied - maintenance - reserved)
        occupancy_percent = round((occupied / total * 100), 1) if total > 0 else 0.0

        floors = Floor.objects.filter(branch__library=library, is_active=True).annotate(
            f_total=Count('seats', filter=Q(seats__is_active=True)),
            f_occ=Count('seats', filter=Q(seats__is_active=True) & (Q(seats__student__isnull=False) | Q(seats__physical_status='occupied')))
        )
        by_floor = [
            {
                'floor_id': str(f.id),
                'floor_name': f.name,
                'total': f.f_total,
                'occupied': f.f_occ,
                'available': max(0, f.f_total - f.f_occ),
            }
            for f in floors
        ]

        by_shift = []
        for s in Shift.objects.filter(library=library, is_active=True):
            s_allocs = SeatAllocation.objects.filter(shift=s, released_at__isnull=True).count()
            by_shift.append({
                'shift_id': str(s.id),
                'shift_name': s.name,
                'occupied': s_allocs,
            })

        by_category = []
        for c in SeatCategory.objects.filter(library=library):
            c_seats = seats_qs.filter(category=c)
            by_category.append({
                'category_id': str(c.id),
                'category_name': c.name,
                'total': c_seats.count(),
                'occupied': c_seats.filter(student__isnull=False).count(),
            })

        return Response({
            'total': total,
            'available': available,
            'occupied': occupied,
            'reserved': reserved,
            'maintenance': maintenance,
            'occupancy_percent': occupancy_percent,
            'by_floor': by_floor,
            'by_shift': by_shift,
            'by_category': by_category,
        })


class LibraryFloorsView(APIView):
    """GET /library/floors, POST /library/floors"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = Floor.objects.filter(branch__library=library)
        branch_id = request.query_params.get('branch_id')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        serializer = FloorSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        library = _get_current_library(request)
        serializer = FloorCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        branch_id = data.get('branch_id')
        branch = Branch.objects.filter(pk=branch_id, library=library).first() if branch_id else library.branches.first()
        if not branch:
            raise PlatformAPIException('Branch not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if Floor.objects.filter(branch=branch, name=data['name']).exists():
            raise PlatformAPIException('Floor with this name already exists.', code='duplicate_name', status_code=status.HTTP_409_CONFLICT)

        floor = Floor.objects.create(
            branch=branch,
            name=data['name'],
            description=data.get('description', ''),
            sort_order=data.get('sort_order', 0),
            is_active=data.get('is_active', True),
        )
        return Response(FloorSerializer(floor).data, status=status.HTTP_201_CREATED)


class LibraryFloorDetailView(APIView):
    """PATCH /library/floors/{id}, DELETE /library/floors/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def patch(self, request, pk):
        library = _get_current_library(request)
        floor = Floor.objects.filter(pk=pk, branch__library=library).first()
        if not floor:
            raise PlatformAPIException('Floor not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        serializer = FloorCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if 'name' in data:
            floor.name = data['name']
        if 'description' in data:
            floor.description = data['description']
        if 'sort_order' in data:
            floor.sort_order = data['sort_order']
        if 'is_active' in data:
            floor.is_active = data['is_active']
        floor.save()

        return Response(FloorSerializer(floor).data)

    def delete(self, request, pk):
        library = _get_current_library(request)
        floor = Floor.objects.filter(pk=pk, branch__library=library).first()
        if not floor:
            raise PlatformAPIException('Floor not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        has_allocations = SeatAllocation.objects.filter(seat__floor_rel=floor, released_at__isnull=True).exists()
        if has_allocations:
            raise PlatformAPIException('Cannot delete floor with active allocations.', code='floor_has_allocations', status_code=status.HTTP_409_CONFLICT)

        floor.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryFloorsOrderView(APIView):
    """PUT /library/floors/order"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def put(self, request):
        library = _get_current_library(request)
        ids = request.data.get('ids', [])
        for order, f_id in enumerate(ids):
            Floor.objects.filter(pk=f_id, branch__library=library).update(sort_order=order)
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryFloorMapView(APIView):
    """GET /library/floors/{id}/map"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request, pk):
        library = _get_current_library(request)
        floor = Floor.objects.filter(pk=pk, branch__library=library).first()
        if not floor:
            raise PlatformAPIException('Floor not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        rows = FloorRow.objects.filter(floor=floor)
        seats = Seat.objects.filter(floor_rel=floor, is_active=True)

        legend = {
            'available': seats.filter(physical_status='available', student__isnull=True).count(),
            'occupied': seats.filter(Q(student__isnull=False) | Q(physical_status='occupied')).count(),
            'reserved': seats.filter(physical_status='reserved').count(),
            'maintenance': seats.filter(physical_status='maintenance').count(),
        }

        return Response({
            'floor': FloorSerializer(floor).data,
            'rows': FloorRowSerializer(rows, many=True).data,
            'seats': SeatItemSerializer(seats, many=True).data,
            'elements': [],
            'legend': legend,
            'version': floor.version,
        })


class LibraryFloorLayoutUpdateView(APIView):
    """PUT /library/floors/{id}/layout"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def put(self, request, pk):
        library = _get_current_library(request)
        floor = Floor.objects.filter(pk=pk, branch__library=library).first()
        if not floor:
            raise PlatformAPIException('Floor not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if_match = request.headers.get('If-Match')
        if not if_match:
            raise PlatformAPIException('Missing required If-Match header.', code='precondition_required', status_code=status.HTTP_428_PRECONDITION_REQUIRED)
        try:
            if int(if_match) != floor.version:
                raise PlatformAPIException('Version conflict: another user updated the floor layout.', code='version_conflict', status_code=status.HTTP_409_CONFLICT)
        except ValueError:
            raise PlatformAPIException('Invalid If-Match version header.', code='invalid_header', status_code=status.HTTP_400_BAD_REQUEST)

        seats_data = request.data.get('seats', [])
        with transaction.atomic():
            for s_info in seats_data:
                Seat.objects.filter(pk=s_info['id'], floor_rel=floor).update(layout=s_info.get('layout', {}))

            floor.version += 1
            floor.save(update_fields=['version', 'updated_at'])

        return Response({
            'version': floor.version,
            'saved_at': str(floor.updated_at),
        })


class LibraryFloorRowsView(APIView):
    """POST /library/floors/{id}/rows"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        floor = Floor.objects.filter(pk=pk, branch__library=library).first()
        if not floor:
            raise PlatformAPIException('Floor not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        label = request.data.get('label')
        if not label:
            raise PlatformAPIException('Row label is required.', code='invalid_parameters', status_code=status.HTTP_400_BAD_REQUEST)

        row = FloorRow.objects.create(
            floor=floor,
            label=label,
            sort_order=request.data.get('sort_order', 0),
        )
        return Response(FloorRowSerializer(row).data, status=status.HTTP_201_CREATED)


class LibraryRowDetailView(APIView):
    """PATCH /library/rows/{id}, DELETE /library/rows/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def patch(self, request, pk):
        row = FloorRow.objects.filter(pk=pk, floor__branch__library=_get_current_library(request)).first()
        if not row:
            raise PlatformAPIException('Row not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if 'label' in request.data:
            row.label = request.data['label']
        if 'sort_order' in request.data:
            row.sort_order = request.data['sort_order']
        row.save()
        return Response(FloorRowSerializer(row).data)

    def delete(self, request, pk):
        row = FloorRow.objects.filter(pk=pk, floor__branch__library=_get_current_library(request)).first()
        if not row:
            raise PlatformAPIException('Row not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if row.seats.exists():
            raise PlatformAPIException('Cannot delete row containing seats.', code='row_has_seats', status_code=status.HTTP_409_CONFLICT)

        row.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==============================================================================
# 12.2 Seats, Bulk, Categories, Shifts
# ==============================================================================

class LibrarySeatsView(APIView):
    """GET /library/seats, POST /library/seats"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = Seat.objects.filter(branch__library=library, is_active=True)

        floor_id = request.query_params.get('floor_id')
        if floor_id:
            qs = qs.filter(floor_rel_id=floor_id)

        category_id = request.query_params.get('category_id')
        if category_id:
            qs = qs.filter(category_id=category_id)

        physical_status = request.query_params.get('physical_status') or request.query_params.get('status')
        if physical_status:
            if physical_status == 'occupied':
                qs = qs.filter(Q(student__isnull=False) | Q(physical_status='occupied'))
            elif physical_status == 'available':
                qs = qs.filter(student__isnull=True, physical_status='available')
            else:
                qs = qs.filter(physical_status=physical_status)

        q = request.query_params.get('q')
        if q:
            qs = qs.filter(Q(label__icontains=q) | Q(student__name__icontains=q))

        page = max(1, int(request.query_params.get('page', 1)))
        limit = min(100, max(1, int(request.query_params.get('limit', 25))))
        start = (page - 1) * limit
        items = qs[start:start + limit]

        return Response(SeatItemSerializer(items, many=True).data)

    def post(self, request):
        library = _get_current_library(request)
        serializer = SeatCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        floor = Floor.objects.filter(pk=data['floor_id'], branch__library=library).first()
        if not floor:
            raise PlatformAPIException('Floor not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        branch = floor.branch
        seat_num = data['seat_number'].strip()

        if Seat.objects.filter(branch=branch, label=seat_num).exists():
            raise PlatformAPIException(f'Seat {seat_num} already exists in this branch.', code='seat_number_conflict', status_code=status.HTTP_409_CONFLICT)

        category = None
        if data.get('category_id'):
            category = SeatCategory.objects.filter(pk=data['category_id'], library=library).first()

        row = None
        if data.get('row_id'):
            row = FloorRow.objects.filter(pk=data['row_id'], floor=floor).first()

        seat = Seat.objects.create(
            branch=branch,
            floor_rel=floor,
            row=row,
            category=category,
            label=seat_num,
            type=data.get('seat_type', 'Desk'),
            layout=data.get('layout', {}),
            notes=data.get('notes', ''),
        )
        return Response(SeatItemSerializer(seat).data, status=status.HTTP_201_CREATED)


class LibrarySeatsBulkCreateView(APIView):
    """POST /library/seats/bulk"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request):
        library = _get_current_library(request)
        serializer = SeatBulkCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        floor = Floor.objects.filter(pk=data['floor_id'], branch__library=library).first()
        if not floor:
            raise PlatformAPIException('Floor not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        branch = floor.branch
        prefix = data.get('prefix', '')
        from_num = data['from_number']
        to_num = data['to_number']

        if to_num < from_num:
            raise PlatformAPIException('to_number must be >= from_number.', code='invalid_parameters', status_code=status.HTTP_400_BAD_REQUEST)
        if (to_num - from_num + 1) > 500:
            raise PlatformAPIException('Maximum 500 seats per bulk call.', code='limit_exceeded', status_code=status.HTTP_400_BAD_REQUEST)

        row = None
        if data.get('row_id'):
            row = FloorRow.objects.filter(pk=data['row_id'], floor=floor).first()
        elif data.get('row_label'):
            row, _ = FloorRow.objects.get_or_create(floor=floor, label=data['row_label'])

        category = None
        if data.get('category_id'):
            category = SeatCategory.objects.filter(pk=data['category_id'], library=library).first()

        if data.get('preview'):
            planned = []
            for n in range(from_num, to_num + 1):
                lbl = f"{prefix}{n:02d}"
                conflict = Seat.objects.filter(branch=branch, label=lbl).exists()
                planned.append({'seat_number': lbl, 'conflict': conflict})
            return Response({'planned': planned})

        created = []
        with transaction.atomic():
            for n in range(from_num, to_num + 1):
                lbl = f"{prefix}{n:02d}"
                if not Seat.objects.filter(branch=branch, label=lbl).exists():
                    s = Seat.objects.create(
                        branch=branch,
                        floor_rel=floor,
                        row=row,
                        category=category,
                        label=lbl,
                        type=data.get('seat_type', 'Desk'),
                    )
                    created.append(s)

        return Response({'created': SeatItemSerializer(created, many=True).data}, status=status.HTTP_201_CREATED)


class LibrarySeatDetailView(APIView):
    """GET /library/seats/{id}, PATCH /library/seats/{id}, DELETE /library/seats/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request, pk):
        library = _get_current_library(request)
        seat = Seat.objects.filter(pk=pk, branch__library=library).first()
        if not seat:
            raise PlatformAPIException('Seat not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        return Response(SeatDetailSerializer(seat).data)

    def patch(self, request, pk):
        library = _get_current_library(request)
        seat = Seat.objects.filter(pk=pk, branch__library=library).first()
        if not seat:
            raise PlatformAPIException('Seat not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if 'category_id' in request.data:
            cat = SeatCategory.objects.filter(pk=request.data['category_id'], library=library).first()
            if cat and seat.student:
                if cat.allowed_gender == 'female' and seat.student.gender != 'Female':
                    raise PlatformAPIException('Seat occupant gender conflicts with category.', code='seat_gender_mismatch', status_code=status.HTTP_409_CONFLICT)
                if cat.allowed_gender == 'male' and seat.student.gender != 'Male':
                    raise PlatformAPIException('Seat occupant gender conflicts with category.', code='seat_gender_mismatch', status_code=status.HTTP_409_CONFLICT)
            seat.category = cat

        if 'seat_number' in request.data:
            new_num = request.data['seat_number']
            if Seat.objects.filter(branch=seat.branch, label=new_num).exclude(pk=seat.pk).exists():
                raise PlatformAPIException('Seat number conflict.', code='seat_number_conflict', status_code=status.HTTP_409_CONFLICT)
            seat.label = new_num

        if 'physical_status' in request.data:
            seat.physical_status = request.data['physical_status']
        if 'maintenance_reason' in request.data:
            seat.maintenance_reason = request.data['maintenance_reason']
        if 'notes' in request.data:
            seat.notes = request.data['notes']
        if 'layout' in request.data:
            seat.layout = request.data['layout']
        seat.save()

        return Response(SeatItemSerializer(seat).data)

    def delete(self, request, pk):
        library = _get_current_library(request)
        seat = Seat.objects.filter(pk=pk, branch__library=library).first()
        if not seat:
            raise PlatformAPIException('Seat not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if seat.allocations.exists():
            raise PlatformAPIException('Seat has history; use physical_status: "hidden" instead of deletion.', code='seat_has_history', status_code=status.HTTP_409_CONFLICT)

        seat.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibrarySeatBlockView(APIView):
    """POST /library/seats/{id}/block"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        seat = Seat.objects.filter(pk=pk, branch__library=library).first()
        if not seat:
            raise PlatformAPIException('Seat not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', 'Maintenance')
        seat.physical_status = 'maintenance'
        seat.maintenance_reason = reason
        seat.save()
        return Response(SeatItemSerializer(seat).data)


class LibrarySeatUnblockView(APIView):
    """POST /library/seats/{id}/unblock"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        seat = Seat.objects.filter(pk=pk, branch__library=library).first()
        if not seat:
            raise PlatformAPIException('Seat not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        seat.physical_status = 'occupied' if seat.student else 'available'
        seat.maintenance_reason = ''
        seat.save()
        return Response(SeatItemSerializer(seat).data)


class LibrarySeatCategoriesView(APIView):
    """GET /library/seat-categories, POST /library/seat-categories"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = SeatCategory.objects.filter(library=library)
        return Response(SeatCategorySerializer(qs, many=True).data)

    def post(self, request):
        library = _get_current_library(request)
        serializer = SeatCategoryCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if SeatCategory.objects.filter(library=library, code=data['code'].upper()).exists():
            raise PlatformAPIException('Seat category code already exists.', code='duplicate_code', status_code=status.HTTP_409_CONFLICT)

        cat = SeatCategory.objects.create(
            library=library,
            code=data['code'].upper(),
            name=data['name'],
            allowed_gender=data.get('allowed_gender', 'any'),
            color=data.get('color', '#4F46E5'),
        )
        return Response(SeatCategorySerializer(cat).data, status=status.HTTP_201_CREATED)


class LibrarySeatCategoryDetailView(APIView):
    """PATCH /library/seat-categories/{id}, DELETE /library/seat-categories/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def patch(self, request, pk):
        library = _get_current_library(request)
        cat = SeatCategory.objects.filter(pk=pk, library=library).first()
        if not cat:
            raise PlatformAPIException('Category not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if 'name' in request.data:
            cat.name = request.data['name']
        if 'color' in request.data:
            cat.color = request.data['color']
        if 'allowed_gender' in request.data:
            cat.allowed_gender = request.data['allowed_gender']
        cat.save()
        return Response(SeatCategorySerializer(cat).data)

    def delete(self, request, pk):
        library = _get_current_library(request)
        cat = SeatCategory.objects.filter(pk=pk, library=library).first()
        if not cat:
            raise PlatformAPIException('Category not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if cat.is_system:
            raise PlatformAPIException('System categories cannot be deleted.', code='category_is_system', status_code=status.HTTP_409_CONFLICT)
        if cat.seats.exists():
            raise PlatformAPIException('Category is assigned to seats and cannot be deleted.', code='category_in_use', status_code=status.HTTP_409_CONFLICT)

        cat.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryShiftsView(APIView):
    """GET /library/shifts, POST /library/shifts"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = Shift.objects.filter(library=library)
        branch_id = request.query_params.get('branch_id')
        if branch_id:
            qs = qs.filter(Q(branch_id=branch_id) | Q(branch__isnull=True))
        return Response(ShiftSerializer(qs, many=True).data)

    def post(self, request):
        library = _get_current_library(request)
        serializer = ShiftCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        branch = None
        if data.get('branch_id'):
            branch = Branch.objects.filter(pk=data['branch_id'], library=library).first()

        shift = Shift.objects.create(
            library=library,
            branch=branch,
            name=data['name'],
            start_minute=data['start_minute'],
            end_minute=data['end_minute'],
            is_full_day=data.get('is_full_day', False),
            is_active=data.get('is_active', True),
        )
        return Response(ShiftSerializer(shift).data, status=status.HTTP_201_CREATED)


class LibraryShiftDetailView(APIView):
    """PATCH /library/shifts/{id}, DELETE /library/shifts/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def patch(self, request, pk):
        library = _get_current_library(request)
        shift = Shift.objects.filter(pk=pk, library=library).first()
        if not shift:
            raise PlatformAPIException('Shift not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        for f in ['name', 'start_minute', 'end_minute', 'is_active', 'is_full_day']:
            if f in request.data:
                setattr(shift, f, request.data[f])
        shift.save()
        return Response(ShiftSerializer(shift).data)

    def delete(self, request, pk):
        library = _get_current_library(request)
        shift = Shift.objects.filter(pk=pk, library=library).first()
        if not shift:
            raise PlatformAPIException('Shift not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if shift.allocations.filter(released_at__isnull=True).exists():
            raise PlatformAPIException('Shift in active use by students.', code='shift_in_use', status_code=status.HTTP_409_CONFLICT)

        shift.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==============================================================================
# 12.3 Allocation, Reservations, Waiting list, Change requests
# ==============================================================================

class LibrarySeatsUnassignedStudentsView(APIView):
    """GET /library/seats/unassigned-students"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        branch_id = request.query_params.get('branch_id')

        # Active students with no active seat allocation
        qs = Student.objects.filter(library=library, status='Live', assigned_seats__isnull=True)
        if branch_id:
            qs = qs.filter(branch_id=branch_id)

        return Response([
            {
                'id': str(s.id),
                'name': s.name,
                'gender': s.gender,
                'phone': s.phone,
                'branch_name': s.branch.name if s.branch else None,
            }
            for s in qs[:50]
        ])


class LibrarySeatAllocationsView(APIView):
    """GET /library/seat-allocations, POST /library/seat-allocations"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = SeatAllocation.objects.filter(seat__branch__library=library)

        enrollment_id = request.query_params.get('enrollment_id')
        if enrollment_id:
            qs = qs.filter(student_id=enrollment_id)

        seat_id = request.query_params.get('seat_id')
        if seat_id:
            qs = qs.filter(seat_id=seat_id)

        if request.query_params.get('active_only') == 'true':
            qs = qs.filter(released_at__isnull=True)

        return Response(SeatAllocationSerializer(qs[:100], many=True).data)

    def post(self, request):
        library = _get_current_library(request)
        serializer = SeatAllocationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        student = Student.objects.filter(pk=data['enrollment_id'], library=library).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if student.status != 'Live':
            raise PlatformAPIException('Student must be in Live status to receive seat allocation.', code='student_not_active', status_code=status.HTTP_400_BAD_REQUEST)

        seat = Seat.objects.filter(pk=data['seat_id'], branch__library=library).first()
        if not seat:
            raise PlatformAPIException('Seat not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if seat.branch != student.branch:
            raise PlatformAPIException('Seat branch does not match student enrolled branch.', code='branch_mismatch', status_code=status.HTTP_400_BAD_REQUEST)

        if seat.physical_status in ['maintenance', 'hidden']:
            raise PlatformAPIException('Seat is currently under maintenance or hidden.', code='seat_not_available', status_code=status.HTTP_409_CONFLICT)

        # Shift
        shift = None
        if data.get('shift_id'):
            shift = Shift.objects.filter(pk=data['shift_id'], library=library).first()

        # Check gender category restrictions
        if seat.category:
            if seat.category.allowed_gender == 'female' and student.gender != 'Female':
                raise PlatformAPIException('Seat is reserved for female students.', code='seat_gender_mismatch', status_code=status.HTTP_409_CONFLICT)
            if seat.category.allowed_gender == 'male' and student.gender != 'Male':
                raise PlatformAPIException('Seat is reserved for male students.', code='seat_gender_mismatch', status_code=status.HTTP_409_CONFLICT)
        if seat.is_reserved_for_girls and student.gender != 'Female':
            raise PlatformAPIException('Seat is reserved for female students.', code='seat_gender_mismatch', status_code=status.HTTP_409_CONFLICT)

        # Check if student already has active allocation for same shift
        student_active = SeatAllocation.objects.filter(
            student=student,
            shift=shift,
            released_at__isnull=True
        ).first()
        if student_active:
            raise PlatformAPIException('Student already has an active seat in this shift.', code='student_has_seat', status_code=status.HTTP_409_CONFLICT)

        from_date = data.get('from_date') or timezone.now().date()
        to_date = data.get('to_date')

        with transaction.atomic():
            # Check if seat already occupied in this shift with row lock
            seat_clash = SeatAllocation.objects.select_for_update().filter(
                seat=seat,
                shift=shift,
                released_at__isnull=True
            ).first()
            if seat_clash:
                raise PlatformAPIException(
                    f'Seat already allocated to {seat_clash.student.name} in this shift.',
                    code='seat_conflict',
                    status_code=status.HTTP_409_CONFLICT
                )

            allocation = SeatAllocation.objects.create(
                seat=seat,
                student=student,
                shift=shift,
                membership_id=data.get('membership_id'),
                from_date=from_date,
                to_date=to_date,
                allocated_by=request.user if request.user.is_authenticated else None,
                reason=data.get('reason', ''),
            )

            # Assign seat to student and update status
            seat.student = student
            seat.physical_status = 'occupied'
            seat.save()

            SeatAllocationHistory.objects.create(
                seat=seat,
                student=student,
                allocated_at=timezone.now(),
                allocated_by=request.user if request.user.is_authenticated else None,
                reason=data.get('reason', 'Seat Allocation'),
            )

            ActivityLog.objects.create(
                library=library,
                user=request.user if request.user.is_authenticated else None,
                action='SEAT_ALLOCATED',
                entity_type='Seat',
                entity_id=str(seat.id),
                details={'student_id': str(student.id), 'seat': seat.label, 'shift': shift.name if shift else 'Full Day'},
                ip_address=request.META.get('REMOTE_ADDR'),
            )

        return Response(SeatAllocationSerializer(allocation).data, status=status.HTTP_201_CREATED)


class LibrarySeatAllocationChangeView(APIView):
    """POST /library/seat-allocations/{id}/change"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        alloc = SeatAllocation.objects.filter(pk=pk, seat__branch__library=library, released_at__isnull=True).first()
        if not alloc:
            raise PlatformAPIException('Active seat allocation not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        serializer = SeatAllocationChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        new_seat = Seat.objects.filter(pk=data['new_seat_id'], branch__library=library).first()
        if not new_seat:
            raise PlatformAPIException('New seat not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        shift = alloc.shift
        if data.get('shift_id'):
            shift = Shift.objects.filter(pk=data['shift_id'], library=library).first()

        # Check gender category
        if new_seat.category:
            if new_seat.category.allowed_gender == 'female' and alloc.student.gender != 'Female':
                raise PlatformAPIException('Seat is reserved for female students.', code='seat_gender_mismatch', status_code=status.HTTP_409_CONFLICT)
            if new_seat.category.allowed_gender == 'male' and alloc.student.gender != 'Male':
                raise PlatformAPIException('Seat is reserved for male students.', code='seat_gender_mismatch', status_code=status.HTTP_409_CONFLICT)

        # Check clash
        clash = SeatAllocation.objects.filter(seat=new_seat, shift=shift, released_at__isnull=True).first()
        if clash:
            raise PlatformAPIException('Target seat already allocated in this shift.', code='seat_conflict', status_code=status.HTTP_409_CONFLICT)

        with transaction.atomic():
            # Release old
            alloc.released_at = timezone.now()
            alloc.save()
            old_seat = alloc.seat
            old_seat.student = None
            old_seat.physical_status = 'available'
            old_seat.save()

            # Create new
            new_alloc = SeatAllocation.objects.create(
                seat=new_seat,
                student=alloc.student,
                shift=shift,
                membership=alloc.membership,
                from_date=data.get('effective_date') or timezone.now().date(),
                to_date=alloc.to_date,
                allocated_by=request.user if request.user.is_authenticated else None,
                reason=data['reason'],
            )

            new_seat.student = alloc.student
            new_seat.physical_status = 'occupied'
            new_seat.save()

            SeatAllocationHistory.objects.create(
                seat=new_seat,
                student=alloc.student,
                allocated_at=timezone.now(),
                allocated_by=request.user if request.user.is_authenticated else None,
                reason=f"Moved from {old_seat.label}: {data['reason']}",
            )

        return Response(SeatAllocationSerializer(new_alloc).data)


class LibrarySeatAllocationReleaseView(APIView):
    """POST /library/seat-allocations/{id}/release"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        alloc = SeatAllocation.objects.filter(pk=pk, seat__branch__library=library, released_at__isnull=True).first()
        if not alloc:
            raise PlatformAPIException('Active seat allocation not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        serializer = SeatAllocationReleaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data['reason']

        with transaction.atomic():
            alloc.released_at = timezone.now()
            alloc.reason = reason
            alloc.save()

            seat = alloc.seat
            seat.student = None
            seat.physical_status = 'available'
            seat.save()

            ActivityLog.objects.create(
                library=library,
                user=request.user if request.user.is_authenticated else None,
                action='SEAT_RELEASED',
                entity_type='Seat',
                entity_id=str(seat.id),
                details={'student_id': str(alloc.student.id), 'seat': seat.label, 'reason': reason},
                ip_address=request.META.get('REMOTE_ADDR'),
            )

        return Response(SeatAllocationSerializer(alloc).data)


class LibrarySeatHistoryView(APIView):
    """GET /library/seats/{id}/history, GET /library/seat-history"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request, pk=None):
        library = _get_current_library(request)
        qs = SeatAllocationHistory.objects.filter(seat__branch__library=library)
        if pk:
            qs = qs.filter(seat_id=pk)

        timeline = [
            {
                'id': str(h.id),
                'seat_label': h.seat.label,
                'student_name': h.student.name,
                'allocated_at': str(h.allocated_at),
                'released_at': str(h.released_at) if h.released_at else None,
                'allocated_by': h.allocated_by.name if h.allocated_by else None,
                'reason': h.reason,
            }
            for h in qs[:50]
        ]
        return Response(timeline)


class LibrarySeatReservationsView(APIView):
    """GET /library/seat-reservations, POST /library/seat-reservations"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = SeatReservation.objects.filter(seat__branch__library=library)
        return Response(SeatReservationSerializer(qs, many=True).data)

    def post(self, request):
        library = _get_current_library(request)
        seat = Seat.objects.filter(pk=request.data.get('seat_id'), branch__library=library).first()
        if not seat:
            raise PlatformAPIException('Seat not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        res = SeatReservation.objects.create(
            seat=seat,
            reserved_for=request.data.get('reserved_for', ''),
            reserved_until=request.data.get('reserved_until') or (timezone.now() + timezone.timedelta(hours=48)),
            status='active',
        )
        seat.physical_status = 'reserved'
        seat.save()

        return Response(SeatReservationSerializer(res).data, status=status.HTTP_201_CREATED)


class LibrarySeatReservationDeleteView(APIView):
    """DELETE /library/seat-reservations/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def delete(self, request, pk):
        library = _get_current_library(request)
        res = SeatReservation.objects.filter(pk=pk, seat__branch__library=library).first()
        if not res:
            raise PlatformAPIException('Reservation not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        seat = res.seat
        res.delete()
        seat.physical_status = 'available'
        seat.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibrarySeatReservationConvertView(APIView):
    """POST /library/seat-reservations/{id}/convert"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        reservation = SeatReservation.objects.filter(pk=pk, seat__branch__library=library).first()
        if not reservation:
            raise PlatformAPIException('Seat reservation not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if reservation.status != 'active':
            raise PlatformAPIException('Only active reservations can be converted.', code='invalid_state', status_code=status.HTTP_400_BAD_REQUEST)

        enrollment_id = request.data.get('enrollment_id')
        if not enrollment_id and reservation.student_id:
            enrollment_id = reservation.student_id

        if not enrollment_id:
            raise PlatformAPIException('enrollment_id is required.', code='validation_error', status_code=status.HTTP_400_BAD_REQUEST)

        student = Student.objects.filter(pk=enrollment_id, library=library).first()
        if not student:
            raise PlatformAPIException('Student not found in this library.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        today = timezone.now().date()
        allocation = SeatAllocation.objects.create(
            seat=reservation.seat,
            student=student,
            shift=reservation.shift,
            from_date=today,
            allocated_by=request.user if request.user.is_authenticated else None,
            reason='Converted from reservation',
        )

        reservation.status = 'converted'
        reservation.student = student
        reservation.save()

        # Update seat physical status
        reservation.seat.physical_status = 'occupied'
        reservation.seat.student = student
        reservation.seat.save()

        return Response(SeatAllocationSerializer(allocation).data, status=status.HTTP_201_CREATED)



class LibrarySeatWaitingListView(APIView):
    """GET /library/seat-waiting-list, POST /library/seat-waiting-list"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = SeatWaitingList.objects.filter(library=library)
        return Response(SeatWaitingListSerializer(qs, many=True).data)

    def post(self, request):
        library = _get_current_library(request)
        student = Student.objects.filter(pk=request.data.get('enrollment_id'), library=library).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        entry = SeatWaitingList.objects.create(
            library=library,
            student=student,
            shift_id=request.data.get('shift_id'),
            category_id=request.data.get('category_id'),
            status='waiting',
        )
        return Response(SeatWaitingListSerializer(entry).data, status=status.HTTP_201_CREATED)


class LibrarySeatWaitingListOfferView(APIView):
    """POST /library/seat-waiting-list/{id}/offer"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        entry = SeatWaitingList.objects.filter(pk=pk, library=library).first()
        if not entry:
            raise PlatformAPIException('Waiting list entry not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        seat_id = request.data.get('seat_id')
        entry.offered_seat_id = seat_id
        entry.status = 'offered'
        entry.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibrarySeatWaitingListDeleteView(APIView):
    """DELETE /library/seat-waiting-list/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def delete(self, request, pk):
        library = _get_current_library(request)
        entry = SeatWaitingList.objects.filter(pk=pk, library=library).first()
        if not entry:
            raise PlatformAPIException('Waiting list entry not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibrarySeatChangeRequestsView(APIView):
    """GET /library/seat-change-requests"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = SeatChangeRequest.objects.filter(library=library)
        return Response(SeatChangeRequestSerializer(qs, many=True).data)


class LibrarySeatChangeRequestApproveView(APIView):
    """POST /library/seat-change-requests/{id}/approve"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        cr = SeatChangeRequest.objects.filter(pk=pk, library=library, status='pending').first()
        if not cr:
            raise PlatformAPIException('Pending request not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        target_seat_id = request.data.get('seat_id') or (cr.requested_seat_id)
        target_seat = Seat.objects.filter(pk=target_seat_id, branch__library=library).first()
        if not target_seat:
            raise PlatformAPIException('Target seat not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            # Release old seat
            if cr.current_seat:
                old_seat = cr.current_seat
                old_seat.student = None
                old_seat.physical_status = 'available'
                old_seat.save()
                SeatAllocation.objects.filter(seat=old_seat, student=cr.student, released_at__isnull=True).update(released_at=timezone.now())

            # Assign new seat
            target_seat.student = cr.student
            target_seat.physical_status = 'occupied'
            target_seat.save()

            SeatAllocation.objects.create(
                seat=target_seat,
                student=cr.student,
                from_date=timezone.now().date(),
                allocated_by=request.user if request.user.is_authenticated else None,
                reason='Seat Change Request Approved',
            )

            cr.status = 'approved'
            cr.note = request.data.get('note', '')
            cr.save()

        return Response(SeatChangeRequestSerializer(cr).data)


class LibrarySeatChangeRequestRejectView(APIView):
    """POST /library/seat-change-requests/{id}/reject"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        cr = SeatChangeRequest.objects.filter(pk=pk, library=library, status='pending').first()
        if not cr:
            raise PlatformAPIException('Pending request not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        note = request.data.get('note')
        if not note:
            raise PlatformAPIException('Rejection note is required.', code='invalid_parameters', status_code=status.HTTP_400_BAD_REQUEST)

        cr.status = 'rejected'
        cr.note = note
        cr.save()
        return Response(SeatChangeRequestSerializer(cr).data)


# ==============================================================================
# 12.4 Lockers
# ==============================================================================

class LibraryLockersView(APIView):
    """GET /library/lockers, POST /library/lockers"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def get(self, request):
        library = _get_current_library(request)
        qs = Locker.objects.filter(branch__library=library)

        branch_id = request.query_params.get('branch_id')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)

        status_param = request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        return Response(LockerSerializer(qs, many=True).data)

    def post(self, request):
        library = _get_current_library(request)
        branch_id = request.data.get('branch_id')
        branch = Branch.objects.filter(pk=branch_id, library=library).first() if branch_id else library.branches.first()
        if not branch:
            raise PlatformAPIException('Branch not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        number = request.data.get('number')
        if number:
            if Locker.objects.filter(branch=branch, number=number).exists():
                raise PlatformAPIException('Locker already exists.', code='duplicate_number', status_code=status.HTTP_409_CONFLICT)
            locker = Locker.objects.create(branch=branch, number=number)
            return Response([LockerSerializer(locker).data], status=status.HTTP_201_CREATED)

        # Bulk
        prefix = request.data.get('prefix', 'L-')
        from_num = int(request.data.get('from_number', 1))
        to_num = int(request.data.get('to_number', 10))
        created = []
        for n in range(from_num, to_num + 1):
            num = f"{prefix}{n:02d}"
            if not Locker.objects.filter(branch=branch, number=num).exists():
                lk = Locker.objects.create(branch=branch, number=num)
                created.append(lk)

        return Response(LockerSerializer(created, many=True).data, status=status.HTTP_201_CREATED)


class LibraryLockerDetailView(APIView):
    """PATCH /library/lockers/{id}, DELETE /library/lockers/{id}"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def patch(self, request, pk):
        locker = Locker.objects.filter(pk=pk, branch__library=_get_current_library(request)).first()
        if not locker:
            raise PlatformAPIException('Locker not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if 'number' in request.data:
            locker.number = request.data['number']
        if 'status' in request.data:
            locker.status = request.data['status']
        locker.save()
        return Response(LockerSerializer(locker).data)

    def delete(self, request, pk):
        locker = Locker.objects.filter(pk=pk, branch__library=_get_current_library(request)).first()
        if not locker:
            raise PlatformAPIException('Locker not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        locker.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryLockerAssignView(APIView):
    """POST /library/lockers/{id}/assign"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        library = _get_current_library(request)
        locker = Locker.objects.filter(pk=pk, branch__library=library).first()
        if not locker:
            raise PlatformAPIException('Locker not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        if locker.status == 'occupied':
            raise PlatformAPIException('Locker is already assigned.', code='locker_conflict', status_code=status.HTTP_409_CONFLICT)

        student = Student.objects.filter(pk=request.data.get('enrollment_id'), library=library).first()
        if not student:
            raise PlatformAPIException('Student not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        locker.student = student
        locker.status = 'occupied'
        locker.from_date = request.data.get('from_date') or timezone.now().date()
        locker.to_date = request.data.get('to_date')
        locker.save()

        return Response(LockerSerializer(locker).data)


class LibraryLockerReleaseView(APIView):
    """POST /library/lockers/{id}/release"""
    permission_classes = [permissions.IsAuthenticated, IsLibraryAudience]

    def post(self, request, pk):
        locker = Locker.objects.filter(pk=pk, branch__library=_get_current_library(request)).first()
        if not locker:
            raise PlatformAPIException('Locker not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        locker.student = None
        locker.status = 'available'
        locker.from_date = None
        locker.to_date = None
        locker.save()

        return Response(LockerSerializer(locker).data)

