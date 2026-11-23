"""Platform-wide and library-scoped analytics & reporting endpoints."""
from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView

from apps.accounts.permissions import IsLibraryOwner, IsSubAdminOrAbove, IsSuperAdmin
from apps.billing.models import (
    CashDayBookEntry,
    LibrarySubscription,
    PlatformPayment,
    SubscriptionPlan,
)
from apps.books.models import BookLoan
from apps.libraries.models import Library
from apps.notifications.models import NotificationBroadcast
from apps.seats.models import AttendanceRecord, Seat
from apps.students.models import Student, StudentMembership
from utils.responses import success

from .models import AppFeatureFlag


def _last_12_month_starts(today):
    """Return a chronological list of the first day of each of the last 12 months."""
    months = []
    year, month = today.year, today.month
    for _ in range(12):
        months.append(date(year, month, 1))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    months.reverse()
    return months


def _resolve_library_id(request):
    """Resolve the tenant library UUID for library-scoped report endpoints."""
    user = request.user
    if user.role == 'SUPER_ADMIN':
        library_id = request.query_params.get('library')
        if library_id:
            return library_id
    if getattr(user, 'library_id', None):
        return user.library_id
    owned = getattr(user, 'owned_library', None)
    if owned:
        return owned.id
    raise ValidationError({'library': 'User is not associated with a library.'})


# ---------------------------------------------------------------------------
# Platform Reports (Super Admin)
# ---------------------------------------------------------------------------


@extend_schema(tags=['Platform Reports'])
class PlatformRevenueReportView(APIView):
    """Platform revenue vs target over selected duration."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        today = timezone.localdate()
        range_param = request.query_params.get('range', 'this-month')
        date_from_str = request.query_params.get('date_from')
        date_to_str = request.query_params.get('date_to')

        if range_param == 'today':
            slots = [
                ('06:00', 6, 9),
                ('09:00', 9, 12),
                ('12:00', 12, 15),
                ('15:00', 15, 18),
                ('18:00', 18, 21),
                ('21:00', 21, 24),
            ]
            data = []
            for slot_label, h_start, h_end in slots:
                rev = PlatformPayment.objects.filter(
                    status='Success',
                    created_at__date=today,
                    created_at__hour__gte=h_start,
                    created_at__hour__lt=h_end,
                ).aggregate(total=Coalesce(Sum('amount'), Decimal('0.00')))['total']
                data.append({
                    'month': slot_label,
                    'label': f'Today {slot_label}',
                    'revenue': float(rev),
                    'target': float(max(Decimal('2500.00'), rev * Decimal('1.10'))),
                })
            return success(data=data)

        elif range_param == '7d':
            data = []
            for i in range(6, -1, -1):
                day = today - timedelta(days=i)
                rev = PlatformPayment.objects.filter(
                    status='Success',
                    created_at__date=day,
                ).aggregate(total=Coalesce(Sum('amount'), Decimal('0.00')))['total']
                data.append({
                    'month': day.strftime('%a'),
                    'label': day.strftime('%d %b %Y'),
                    'revenue': float(rev),
                    'target': float(max(Decimal('4000.00'), rev * Decimal('1.15'))),
                })
            return success(data=data)

        elif range_param == '30d':
            data = []
            for i in range(29, -1, -1):
                day = today - timedelta(days=i)
                rev = PlatformPayment.objects.filter(
                    status='Success',
                    created_at__date=day,
                ).aggregate(total=Coalesce(Sum('amount'), Decimal('0.00')))['total']
                data.append({
                    'month': day.strftime('%d %b'),
                    'label': day.strftime('%d %b %Y'),
                    'revenue': float(rev),
                    'target': float(max(Decimal('3000.00'), rev * Decimal('1.15'))),
                })
            return success(data=data)

        elif range_param == 'this-month':
            month_start = today.replace(day=1)
            num_days = (today - month_start).days + 1
            data = []
            for i in range(num_days):
                day = month_start + timedelta(days=i)
                rev = PlatformPayment.objects.filter(
                    status='Success',
                    created_at__date=day,
                ).aggregate(total=Coalesce(Sum('amount'), Decimal('0.00')))['total']
                data.append({
                    'month': day.strftime('%d %b'),
                    'label': day.strftime('%d %b %Y'),
                    'revenue': float(rev),
                    'target': float(max(Decimal('3500.00'), rev * Decimal('1.15'))),
                })
            return success(data=data)

        elif range_param == 'quarter':
            q_idx = (today.month - 1) // 3
            q_start_month = q_idx * 3 + 1
            data = []
            for m in range(q_start_month, q_start_month + 3):
                m_date = today.replace(month=m, day=1)
                next_m = (m_date.replace(day=28) + timedelta(days=4)).replace(day=1)
                rev = PlatformPayment.objects.filter(
                    status='Success',
                    created_at__date__gte=m_date,
                    created_at__date__lt=next_m,
                ).aggregate(total=Coalesce(Sum('amount'), Decimal('0.00')))['total']
                data.append({
                    'month': m_date.strftime('%b'),
                    'label': m_date.strftime('%b %Y'),
                    'revenue': float(rev),
                    'target': float(max(Decimal('50000.00'), rev * Decimal('1.10'))),
                })
            return success(data=data)

        elif range_param == 'custom' and date_from_str:
            import datetime
            try:
                start_date = datetime.date.fromisoformat(date_from_str)
                end_date = datetime.date.fromisoformat(date_to_str) if date_to_str else today
            except (ValueError, TypeError):
                start_date = today - timedelta(days=14)
                end_date = today

            span_days = max(1, (end_date - start_date).days + 1)
            data = []
            if span_days <= 31:
                for i in range(span_days):
                    day = start_date + timedelta(days=i)
                    rev = PlatformPayment.objects.filter(
                        status='Success',
                        created_at__date=day,
                    ).aggregate(total=Coalesce(Sum('amount'), Decimal('0.00')))['total']
                    data.append({
                        'month': day.strftime('%d %b'),
                        'label': day.strftime('%d %b %Y'),
                        'revenue': float(rev),
                        'target': float(max(Decimal('3000.00'), rev * Decimal('1.15'))),
                    })
            else:
                curr = start_date
                while curr <= end_date:
                    next_month = (curr.replace(day=28) + timedelta(days=4)).replace(day=1)
                    period_end = min(end_date, next_month - timedelta(days=1))
                    rev = PlatformPayment.objects.filter(
                        status='Success',
                        created_at__date__gte=curr,
                        created_at__date__lte=period_end,
                    ).aggregate(total=Coalesce(Sum('amount'), Decimal('0.00')))['total']
                    data.append({
                        'month': curr.strftime('%b %y'),
                        'label': f'{curr.strftime("%d %b")} - {period_end.strftime("%d %b %Y")}',
                        'revenue': float(rev),
                        'target': float(max(Decimal('40000.00'), rev * Decimal('1.10'))),
                    })
                    curr = next_month
            return success(data=data)

        # Default: 12 months
        month_starts = _last_12_month_starts(today)
        start_date = month_starts[0]

        monthly_rows = (
            PlatformPayment.objects.filter(
                status='Success',
                created_at__date__gte=start_date,
            )
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(total=Coalesce(Sum('amount'), Decimal('0.00')))
        )
        totals_by_ym = {
            (row['month'].year, row['month'].month): row['total']
            for row in monthly_rows
            if row['month'] is not None
        }

        data = []
        for m_date in month_starts:
            rev = totals_by_ym.get((m_date.year, m_date.month), Decimal('0.00'))
            target = max(Decimal('50000.00'), (rev * Decimal('1.10')).quantize(Decimal('0.01')))
            data.append(
                {
                    'month': m_date.strftime('%b'),
                    'label': m_date.strftime('%b %Y'),
                    'revenue': float(rev),
                    'target': float(target),
                }
            )
        return success(data=data)


@extend_schema(tags=['Platform Reports'])
class PlatformGrowthReportView(APIView):
    """Platform growth over selected duration."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        today = timezone.localdate()
        range_param = request.query_params.get('range', 'this-month')
        date_from_str = request.query_params.get('date_from')
        date_to_str = request.query_params.get('date_to')

        if range_param == '7d':
            data = []
            for i in range(6, -1, -1):
                day = today - timedelta(days=i)
                new_libs = Library.objects.filter(created_at__date=day).count()
                total_libs = Library.objects.filter(created_at__date__lte=day).count()
                data.append({
                    'month': day.strftime('%a'),
                    'label': day.strftime('%d %b %Y'),
                    'newLibraries': new_libs,
                    'totalLibraries': total_libs,
                    'activeLibraries': max(1, int(total_libs * 0.92)),
                })
            return success(data=data)

        elif range_param == '30d':
            data = []
            for i in range(29, -1, -1):
                day = today - timedelta(days=i)
                new_libs = Library.objects.filter(created_at__date=day).count()
                total_libs = Library.objects.filter(created_at__date__lte=day).count()
                data.append({
                    'month': day.strftime('%d %b'),
                    'label': day.strftime('%d %b %Y'),
                    'newLibraries': new_libs,
                    'totalLibraries': total_libs,
                    'activeLibraries': max(1, int(total_libs * 0.92)),
                })
            return success(data=data)

        elif range_param == 'this-month':
            month_start = today.replace(day=1)
            num_days = (today - month_start).days + 1
            data = []
            for i in range(num_days):
                day = month_start + timedelta(days=i)
                new_libs = Library.objects.filter(created_at__date=day).count()
                total_libs = Library.objects.filter(created_at__date__lte=day).count()
                data.append({
                    'month': day.strftime('%d %b'),
                    'label': day.strftime('%d %b %Y'),
                    'newLibraries': new_libs,
                    'totalLibraries': total_libs,
                    'activeLibraries': max(1, int(total_libs * 0.92)),
                })
            return success(data=data)

        elif range_param == 'quarter':
            q_idx = (today.month - 1) // 3
            q_start_month = q_idx * 3 + 1
            data = []
            for m in range(q_start_month, q_start_month + 3):
                m_date = today.replace(month=m, day=1)
                next_m = (m_date.replace(day=28) + timedelta(days=4)).replace(day=1)
                new_libs = Library.objects.filter(created_at__date__gte=m_date, created_at__date__lt=next_m).count()
                total_libs = Library.objects.filter(created_at__date__lt=next_m).count()
                data.append({
                    'month': m_date.strftime('%b'),
                    'label': m_date.strftime('%b %Y'),
                    'newLibraries': new_libs,
                    'totalLibraries': total_libs,
                    'activeLibraries': max(1, int(total_libs * 0.92)),
                })
            return success(data=data)

        elif range_param == 'custom' and date_from_str:
            import datetime
            try:
                start_date = datetime.date.fromisoformat(date_from_str)
                end_date = datetime.date.fromisoformat(date_to_str) if date_to_str else today
            except (ValueError, TypeError):
                start_date = today - timedelta(days=14)
                end_date = today

            span_days = max(1, (end_date - start_date).days + 1)
            data = []
            if span_days <= 31:
                for i in range(span_days):
                    day = start_date + timedelta(days=i)
                    new_libs = Library.objects.filter(created_at__date=day).count()
                    total_libs = Library.objects.filter(created_at__date__lte=day).count()
                    data.append({
                        'month': day.strftime('%d %b'),
                        'label': day.strftime('%d %b %Y'),
                        'newLibraries': new_libs,
                        'totalLibraries': total_libs,
                        'activeLibraries': max(1, int(total_libs * 0.92)),
                    })
            else:
                curr = start_date
                while curr <= end_date:
                    next_month = (curr.replace(day=28) + timedelta(days=4)).replace(day=1)
                    period_end = min(end_date, next_month - timedelta(days=1))
                    new_libs = Library.objects.filter(created_at__date__gte=curr, created_at__date__lte=period_end).count()
                    total_libs = Library.objects.filter(created_at__date__lte=period_end).count()
                    data.append({
                        'month': curr.strftime('%b %y'),
                        'label': f'{curr.strftime("%d %b")} - {period_end.strftime("%d %b %Y")}',
                        'newLibraries': new_libs,
                        'totalLibraries': total_libs,
                        'activeLibraries': max(1, int(total_libs * 0.92)),
                    })
                    curr = next_month
            return success(data=data)

        # Default: 12 months
        month_starts = _last_12_month_starts(today)
        start_date = month_starts[0]

        base_count = Library.objects.filter(created_at__date__lt=start_date).count()
        monthly_rows = (
            Library.objects.filter(created_at__date__gte=start_date)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(new_count=Count('id'))
        )
        counts_by_ym = {
            (row['month'].year, row['month'].month): row['new_count']
            for row in monthly_rows
            if row['month'] is not None
        }

        cumulative = base_count
        data = []
        for m_date in month_starts:
            new_libs = counts_by_ym.get((m_date.year, m_date.month), 0)
            cumulative += new_libs
            active_libs = max(1, int(cumulative * 0.92))
            data.append(
                {
                    'month': m_date.strftime('%b'),
                    'label': m_date.strftime('%b %Y'),
                    'newLibraries': new_libs,
                    'totalLibraries': cumulative,
                    'activeLibraries': active_libs,
                }
            )
        return success(data=data)


@extend_schema(tags=['Platform Reports'])
class PlatformPlanDistributionView(APIView):
    """Subscription count and recurring fee distribution across SubscriptionPlans."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        plans = list(SubscriptionPlan.objects.all().order_by('tier'))
        palette = [
            '#0EA5E9',  # Sky Blue (Starter)
            '#8B5CF6',  # Violet / Purple (Growth)
            '#EC4899',  # Pink / Magenta (Pro)
            '#F59E0B',  # Amber / Gold (Enterprise)
            '#10B981',  # Emerald
            '#06B6D4',  # Cyan
        ]

        def resolve_plan_color(p, idx):
            p_name = (p.name or '').strip().lower()
            if 'starter' in p_name:
                return '#0EA5E9'
            if 'growth' in p_name:
                return '#8B5CF6'
            if 'pro' in p_name:
                return '#EC4899'
            if 'enterprise' in p_name:
                return '#F59E0B'
            if p.tier == 1:
                return '#0EA5E9'
            if p.tier == 2:
                return '#8B5CF6'
            if p.tier == 3:
                return '#F59E0B'
            if p.tier == 4:
                return '#10B981'
            return palette[idx % len(palette)]

        total_subs = LibrarySubscription.objects.filter(
            status__in=['Trial', 'Active', 'Grace']
        ).count() or 1

        data = []
        for idx, plan in enumerate(plans):
            active_subs = LibrarySubscription.objects.filter(
                plan=plan, status__in=['Trial', 'Active', 'Grace']
            )
            agg = active_subs.aggregate(
                count=Count('id'),
                revenue=Coalesce(Sum('fee_amount'), Decimal('0.00')),
            )
            cnt = agg['count']
            pct = round((cnt / total_subs * 100), 1)
            data.append(
                {
                    'id': str(plan.id),
                    'planId': str(plan.id),
                    'name': plan.name,
                    'planName': plan.name,
                    'tier': plan.tier,
                    'count': cnt,
                    'subscriptions': cnt,
                    'percentage': pct,
                    'color': resolve_plan_color(plan, idx),
                    'revenue': float(agg['revenue']),
                }
            )
        return success(data=data)


@extend_schema(tags=['Platform Reports'])
class PlatformStudentStatusView(APIView):
    """Platform-wide student breakdown by status."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        qs = Student.objects.filter(is_deleted=False)
        total_students = qs.count() or 1
        rows = qs.values('status').annotate(count=Count('id')).order_by('status')

        status_palette = {
            'ACTIVE': '#10B981',    # Emerald Green - Active
            'LIVE': '#10B981',      # Emerald Green - Live
            'PENDING': '#F59E0B',   # Amber - Pending
            'TRIAL': '#3B82F6',     # Blue - Trial
            'EXPIRED': '#EF4444',   # Red - Expired
            'SUSPENDED': '#8B5CF6', # Violet / Purple - Suspended
            'INACTIVE': '#64748B',  # Slate - Inactive
        }
        fallback_palette = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#EC4899', '#06B6D4']

        def resolve_student_color(st, idx):
            norm = (st or '').strip().upper()
            if norm in status_palette:
                return status_palette[norm]
            return fallback_palette[idx % len(fallback_palette)]

        data = []
        for idx, row in enumerate(rows):
            cnt = row['count']
            pct = round((cnt / total_students * 100), 1)
            data.append(
                {
                    'status': row['status'],
                    'count': cnt,
                    'percentage': pct,
                    'color': resolve_student_color(row['status'], idx),
                }
            )
        return success(data=data)


@extend_schema(tags=['Platform Reports'])
class PlatformExpiryForecastView(APIView):
    """Upcoming subscription expiry counts grouped into periods."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        today = timezone.localdate()
        qs = LibrarySubscription.objects.filter(
            status__in=['Trial', 'Active', 'Grace'],
            end_date__gte=today,
        )
        b1 = qs.filter(end_date__lte=today + timedelta(days=7)).aggregate(
            count=Count('id'), value=Coalesce(Sum('fee_amount'), Decimal('0.00'))
        )
        b2 = qs.filter(end_date__gt=today + timedelta(days=7), end_date__lte=today + timedelta(days=15)).aggregate(
            count=Count('id'), value=Coalesce(Sum('fee_amount'), Decimal('0.00'))
        )
        b3 = qs.filter(end_date__gt=today + timedelta(days=15), end_date__lte=today + timedelta(days=30)).aggregate(
            count=Count('id'), value=Coalesce(Sum('fee_amount'), Decimal('0.00'))
        )
        b4 = qs.filter(end_date__gt=today + timedelta(days=30), end_date__lte=today + timedelta(days=60)).aggregate(
            count=Count('id'), value=Coalesce(Sum('fee_amount'), Decimal('0.00'))
        )

        data = [
            {'period': '1-7 Days', 'count': b1['count'], 'value': f"₹{float(b1['value']):,.0f}", 'risk': 'High'},
            {'period': '8-15 Days', 'count': b2['count'], 'value': f"₹{float(b2['value']):,.0f}", 'risk': 'Medium'},
            {'period': '16-30 Days', 'count': b3['count'], 'value': f"₹{float(b3['value']):,.0f}", 'risk': 'Low'},
            {'period': '31-60 Days', 'count': b4['count'], 'value': f"₹{float(b4['value']):,.0f}", 'risk': 'Low'},
        ]
        return success(data=data)


@extend_schema(tags=['Platform Reports'])
class PlatformOccupancyReportView(APIView):
    """Seat occupancy summary across all active libraries and branches."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        active_seats = Seat.objects.filter(is_active=True)
        total_seats = active_seats.count()
        occupied_seats = active_seats.filter(student__isnull=False).count()
        occupancy_rate = (
            round((occupied_seats / total_seats) * 100, 2) if total_seats else 0.0
        )

        by_library = (
            Library.objects.annotate(
                total_seats=Count('branches__seats', filter=Q(branches__seats__is_active=True)),
                occupied_seats=Count(
                    'branches__seats',
                    filter=Q(
                        branches__seats__is_active=True,
                        branches__seats__student__isnull=False,
                    ),
                ),
            )
            .values('id', 'code', 'name', 'total_seats', 'occupied_seats')
            .order_by('name')
        )
        libraries_data = [
            {
                'libraryId': str(row['id']),
                'libraryCode': row['code'],
                'libraryName': row['name'],
                'totalSeats': row['total_seats'],
                'occupiedSeats': row['occupied_seats'],
                'occupancyRate': (
                    round((row['occupied_seats'] / row['total_seats']) * 100, 2)
                    if row['total_seats']
                    else 0.0
                ),
            }
            for row in by_library
        ]

        return success(
            data={
                'totalSeats': total_seats,
                'occupiedSeats': occupied_seats,
                'vacantSeats': total_seats - occupied_seats,
                'occupancyRate': occupancy_rate,
                'libraries': libraries_data,
            }
        )


@extend_schema(tags=['Platform Reports'])
class PlatformUsageReportView(APIView):
    """Platform-wide module & feature usage statistics."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        today = timezone.localdate()
        last_30_days = today - timedelta(days=30)

        flags = AppFeatureFlag.objects.all()
        enabled_flags = flags.filter(is_enabled=True).count()
        attendance_30d = AttendanceRecord.objects.filter(date__gte=last_30_days).count()
        active_book_loans = BookLoan.objects.filter(status__in=['Issued', 'Overdue']).count()
        broadcasts_sent = NotificationBroadcast.objects.filter(status='Sent').count()

        return success(
            data={
                'totalFeatureFlags': flags.count(),
                'enabledFeatureFlags': enabled_flags,
                'attendanceCheckins30d': attendance_30d,
                'activeBookLoans': active_book_loans,
                'notificationsSent': broadcasts_sent,
            }
        )


# ---------------------------------------------------------------------------
# Library Reports (Owner / Sub-Admin)
# ---------------------------------------------------------------------------


@extend_schema(tags=['Library Reports'])
class LibraryReportsOverviewView(APIView):
    """Library-scoped KPI & operational overview report."""

    permission_classes = [IsLibraryOwner]

    def get(self, request):
        library_id = _resolve_library_id(request)
        today = timezone.localdate()
        month_start = today.replace(day=1)

        students_qs = Student.objects.filter(library_id=library_id, is_deleted=False)
        seats_qs = Seat.objects.filter(branch__library_id=library_id, is_active=True)
        total_seats = seats_qs.count()
        occupied_seats = seats_qs.filter(student__isnull=False).count()

        membership_rev = StudentMembership.objects.filter(
            student__library_id=library_id,
            created_at__date__gte=month_start,
        ).aggregate(total=Coalesce(Sum('amount_paid'), Decimal('0.00')))['total']

        cashbook_rev = CashDayBookEntry.objects.filter(
            library_id=library_id,
            date__gte=month_start,
        ).aggregate(total=Coalesce(Sum('amount'), Decimal('0.00')))['total']

        today_attendance = AttendanceRecord.objects.filter(
            branch__library_id=library_id,
            date=today,
        ).count()

        return success(
            data={
                'totalStudents': students_qs.count(),
                'liveStudents': students_qs.filter(status='Live').count(),
                'totalSeats': total_seats,
                'occupiedSeats': occupied_seats,
                'occupancyRate': (
                    round((occupied_seats / total_seats) * 100, 2) if total_seats else 0.0
                ),
                'membershipRevenueThisMonth': str(membership_rev),
                'cashbookRevenueThisMonth': str(cashbook_rev),
                'todayAttendanceCount': today_attendance,
            }
        )


@extend_schema(tags=['Library Reports'])
class LibraryRevenueReportView(APIView):
    """12-month revenue trend for a single library from memberships & cashbook."""

    permission_classes = [IsLibraryOwner]

    def get(self, request):
        library_id = _resolve_library_id(request)
        today = timezone.localdate()
        month_starts = _last_12_month_starts(today)
        start_date = month_starts[0]

        membership_rows = (
            StudentMembership.objects.filter(
                student__library_id=library_id,
                created_at__date__gte=start_date,
            )
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(total=Coalesce(Sum('amount_paid'), Decimal('0.00')))
        )
        membership_map = {
            (row['month'].year, row['month'].month): row['total']
            for row in membership_rows
            if row['month'] is not None
        }

        cashbook_rows = (
            CashDayBookEntry.objects.filter(
                library_id=library_id,
                date__gte=start_date,
            )
            .annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(total=Coalesce(Sum('amount'), Decimal('0.00')))
        )
        cashbook_map = {
            (row['month'].year, row['month'].month): row['total']
            for row in cashbook_rows
            if row['month'] is not None
        }

        data = []
        for m_date in month_starts:
            ym = (m_date.year, m_date.month)
            m_rev = membership_map.get(ym, Decimal('0.00'))
            c_rev = cashbook_map.get(ym, Decimal('0.00'))
            data.append(
                {
                    'month': m_date.strftime('%Y-%m'),
                    'label': m_date.strftime('%b %Y'),
                    'membershipRevenue': str(m_rev),
                    'cashbookRevenue': str(c_rev),
                    'totalRevenue': str(m_rev + c_rev),
                }
            )
        return success(data=data)


@extend_schema(tags=['Library Reports'])
class LibraryAttendanceReportView(APIView):
    """Library attendance summary report (status breakdown + last 30 days)."""

    permission_classes = [IsSubAdminOrAbove]

    def get(self, request):
        library_id = _resolve_library_id(request)
        today = timezone.localdate()
        last_30_days = today - timedelta(days=30)

        qs = AttendanceRecord.objects.filter(
            branch__library_id=library_id,
            date__gte=last_30_days,
        )
        by_status = qs.values('status').annotate(count=Count('id')).order_by('status')
        by_method = qs.values('method').annotate(count=Count('id')).order_by('method')

        return success(
            data={
                'totalRecords30d': qs.count(),
                'todayCount': qs.filter(date=today).count(),
                'byStatus': [
                    {'status': row['status'], 'count': row['count']} for row in by_status
                ],
                'byMethod': [
                    {'method': row['method'], 'count': row['count']} for row in by_method
                ],
            }
        )
