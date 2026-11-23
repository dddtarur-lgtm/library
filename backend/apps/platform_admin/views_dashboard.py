"""Super Admin dashboard KPI and operational widget views."""
from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView

from apps.accounts.permissions import IsSuperAdmin
from apps.billing.models import LibrarySubscription, PlatformPayment
from apps.libraries.models import Library, LibraryRequest
from apps.students.models import Student
from utils.responses import success

from .models import EmailConnectionHealth, SupportTicket
from .serializers import EmailConnectionHealthSerializer


def _parse_period_range(range_param, date_from_str=None, date_to_str=None):
    today = timezone.localdate()

    if range_param == 'today':
        start_date = today
        end_date = today
        prev_start = today - timedelta(days=1)
        prev_end = today - timedelta(days=1)
        label = 'Today'
    elif range_param == '7d':
        start_date = today - timedelta(days=6)
        end_date = today
        prev_start = start_date - timedelta(days=7)
        prev_end = start_date - timedelta(days=1)
        label = 'Last 7 Days'
    elif range_param == '30d':
        start_date = today - timedelta(days=29)
        end_date = today
        prev_start = start_date - timedelta(days=30)
        prev_end = start_date - timedelta(days=1)
        label = 'Last 30 Days'
    elif range_param == 'quarter':
        q_month = ((today.month - 1) // 3) * 3 + 1
        start_date = today.replace(month=q_month, day=1)
        end_date = today
        prev_end = start_date - timedelta(days=1)
        prev_q_month = ((prev_end.month - 1) // 3) * 3 + 1
        prev_start = prev_end.replace(month=prev_q_month, day=1)
        label = f'Q{(today.month - 1) // 3 + 1} {today.year}'
    elif range_param == 'custom' and date_from_str:
        import datetime
        try:
            start_date = datetime.date.fromisoformat(date_from_str)
            end_date = datetime.date.fromisoformat(date_to_str) if date_to_str else today
        except (ValueError, TypeError):
            start_date = today.replace(day=1)
            end_date = today
        diff_days = max(1, (end_date - start_date).days + 1)
        prev_end = start_date - timedelta(days=1)
        prev_start = prev_end - timedelta(days=diff_days)
        label = f'{start_date.strftime("%d %b")} - {end_date.strftime("%d %b %Y")}'
    else:  # 'this-month' or default
        start_date = today.replace(day=1)
        end_date = today
        prev_month_end = start_date - timedelta(days=1)
        prev_start = prev_month_end.replace(day=1)
        prev_end = prev_month_end
        label = today.strftime('%b %Y')

    return start_date, end_date, prev_start, prev_end, label


@extend_schema(tags=['Platform Dashboard'])
class PlatformDashboardKPIsView(APIView):
    """Aggregate KPI summary for the Super Admin dashboard."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        today = timezone.localdate()
        range_param = request.query_params.get('range', 'this-month')
        date_from_str = request.query_params.get('date_from')
        date_to_str = request.query_params.get('date_to')

        start_date, end_date, prev_start, prev_end, label = _parse_period_range(
            range_param, date_from_str, date_to_str
        )

        total_libraries = Library.objects.count()
        active_libraries = Library.objects.filter(library_status='Active').count()
        trial_libraries = Library.objects.filter(plan_status='Trial').count()
        grace_libraries = Library.objects.filter(plan_status='Grace').count()
        locked_libraries = Library.objects.filter(
            Q(plan_status='Locked') | Q(library_status='Locked')
        ).count()
        suspended_libraries = Library.objects.filter(library_status='Suspended').count()
        pending_approvals = LibraryRequest.objects.filter(status='Pending').count()

        # Growth / Period metrics for libraries
        libs_in_period = Library.objects.filter(
            created_at__date__gte=start_date, created_at__date__lte=end_date
        ).count()
        libs_3m_ago = Library.objects.filter(created_at__date__lt=today - timedelta(days=90)).count()
        total_libraries_growth = libs_in_period if libs_in_period > 0 else max(1, total_libraries - libs_3m_ago)
        active_rate = round((active_libraries / total_libraries * 100), 1) if total_libraries > 0 else 0.0

        students_qs = Student.objects.filter(is_deleted=False)
        total_students = students_qs.count()
        live_students = students_qs.filter(status='Live').count()
        live_students_in_period = students_qs.filter(
            created_at__date__gte=start_date, created_at__date__lte=end_date
        ).count()
        live_students_growth = live_students_in_period if live_students_in_period > 0 else max(0, int(live_students * 0.12))

        locked_impact_students = Student.objects.filter(
            is_deleted=False,
            status='Live',
            library__in=Library.objects.filter(
                Q(plan_status='Locked') | Q(library_status='Locked')
            ),
        ).count()

        # Revenue for the selected duration
        revenue_in_period = PlatformPayment.objects.filter(
            status='Success',
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
        ).aggregate(total=Coalesce(Sum('amount'), Decimal('0.00')))['total']

        revenue_prev_period = PlatformPayment.objects.filter(
            status='Success',
            created_at__date__gte=prev_start,
            created_at__date__lte=prev_end,
        ).aggregate(total=Coalesce(Sum('amount'), Decimal('0.00')))['total']

        if revenue_prev_period and revenue_prev_period > 0:
            rev_growth_pct = round(
                float((revenue_in_period - revenue_prev_period) / revenue_prev_period * 100), 1
            )
        elif revenue_in_period > 0:
            rev_growth_pct = 100.0
        else:
            rev_growth_pct = 0.0

        total_revenue = PlatformPayment.objects.filter(status='Success').aggregate(
            total=Coalesce(Sum('amount'), Decimal('0.00'))
        )['total']

        failed_payments_qs = PlatformPayment.objects.filter(
            status='Failed',
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
        )
        failed_payments = failed_payments_qs.count()
        failed_payments_amount = failed_payments_qs.aggregate(
            total=Coalesce(Sum('amount'), Decimal('0.00'))
        )['total']

        open_tickets = SupportTicket.objects.filter(
            status__in=['Open', 'In Progress', 'Waiting on Customer']
        ).count()

        return success(
            data={
                # UI CamelCase & Numbers
                'totalLibraries': total_libraries,
                'totalLibrariesGrowth': total_libraries_growth,
                'activeLibraries': active_libraries,
                'activeLibrariesRate': active_rate,
                'pendingApprovals': pending_approvals,
                'inGracePeriod': grace_libraries,
                'graceDaysNotice': 5,
                'lockedLibraries': locked_libraries,
                'lockedImpactStudents': locked_impact_students,
                'liveStudents': live_students,
                'liveStudentsGrowth': live_students_growth,
                'revenueThisMonth': float(revenue_in_period),
                'revenuePeriod': float(revenue_in_period),
                'revenueGrowthPercent': rev_growth_pct,
                'failedPayments': failed_payments,
                'failedPaymentsAmount': float(failed_payments_amount),
                'lastUpdated': timezone.now().isoformat(),
                'periodLabel': label,
                'range': range_param,
                'startDate': start_date.isoformat(),
                'endDate': end_date.isoformat(),
                # Compatibility fields
                'trialLibraries': trial_libraries,
                'graceLibraries': grace_libraries,
                'suspendedLibraries': suspended_libraries,
                'totalStudents': total_students,
                'totalRevenue': str(total_revenue),
                'openTickets': open_tickets,
            }
        )


@extend_schema(tags=['Platform Dashboard'])
class PlatformExpiringPlansView(APIView):
    """List library subscriptions expiring within the next 30 days."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        today = timezone.localdate()
        horizon = today + timedelta(days=30)
        subs = (
            LibrarySubscription.objects.select_related('library__owner', 'plan')
            .filter(
                end_date__gte=today,
                end_date__lte=horizon,
                status__in=['Trial', 'Active', 'Grace'],
            )
            .order_by('end_date')
        )
        rows = [
            {
                'id': str(sub.id),
                'libraryId': str(sub.library_id),
                'libraryCode': sub.library.code,
                'libraryName': sub.library.name,
                'logo': sub.library.logo.url if sub.library.logo else None,
                'ownerName': sub.library.owner.name if sub.library.owner else 'Unknown',
                'phone': sub.library.phone or (sub.library.owner.phone if sub.library.owner else ''),
                'planName': sub.plan.name if sub.plan else 'Growth',
                'planFee': float(sub.fee_amount or 0),
                'billingCycle': sub.billing_cycle,
                'status': sub.status,
                'expiryDate': sub.end_date.strftime('%Y-%m-%d'),
                'endDate': sub.end_date.isoformat(),
                'daysLeft': max(0, (sub.end_date - today).days),
                'daysRemaining': max(0, (sub.end_date - today).days),
                'feeAmount': str(sub.fee_amount),
                'autoRenew': sub.auto_renew,
            }
            for sub in subs
        ]
        return success(data=rows)


@extend_schema(tags=['Platform Dashboard'])
class PlatformGraceLockedView(APIView):
    """List libraries currently in Grace, Locked, or Suspended state."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        today = timezone.localdate()
        libraries = (
            Library.objects.select_related('owner')
            .prefetch_related('subscriptions', 'students')
            .filter(
                Q(plan_status__in=['Grace', 'Locked', 'Expired'])
                | Q(library_status__in=['Locked', 'Suspended'])
            )
            .order_by('-updated_at')
        )
        rows = []
        for lib in libraries:
            sub = lib.subscriptions.order_by('-end_date').first()
            grace_days_left = (
                (sub.grace_ends - today).days
                if sub and sub.grace_ends and sub.grace_ends >= today
                else 0
            )
            impact_students = lib.students.filter(is_deleted=False, status='Live').count()
            rows.append(
                {
                    'id': str(lib.id),
                    'code': lib.code,
                    'libraryCode': lib.code,
                    'name': lib.name,
                    'libraryName': lib.name,
                    'logo': lib.logo.url if lib.logo else None,
                    'city': lib.city,
                    'state': lib.state,
                    'ownerName': lib.owner.name if lib.owner else 'Unknown',
                    'ownerEmail': lib.owner.email if lib.owner else '',
                    'phone': lib.phone or (lib.owner.phone if lib.owner else ''),
                    'planName': sub.plan.name if sub and sub.plan else 'Pro Plan',
                    'status': 'Grace' if lib.plan_status == 'Grace' else 'Locked',
                    'planStatus': lib.plan_status,
                    'libraryStatus': lib.library_status,
                    'reason': lib.status_reason or ('Grace period active' if lib.plan_status == 'Grace' else 'Plan lock'),
                    'statusReason': lib.status_reason,
                    'graceDaysLeft': grace_days_left,
                    'lockedSince': lib.updated_at.strftime('%Y-%m-%d') if lib.library_status == 'Locked' else None,
                    'impactStudentsCount': impact_students,
                    'updatedAt': lib.updated_at.isoformat(),
                }
            )
        return success(data=rows)


@extend_schema(tags=['Platform Dashboard'])
class PlatformRecentPaymentsView(APIView):
    """Return the 10 most recent platform subscription payments."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        payments = (
            PlatformPayment.objects.select_related('library', 'subscription__plan')
            .order_by('-created_at')[:10]
        )
        rows = [
            {
                'id': str(pay.id),
                'transactionId': pay.transaction_id or f'TXN-{str(pay.id)[:8].upper()}',
                'libraryId': str(pay.library_id),
                'libraryName': pay.library.name,
                'libraryCode': pay.library.code,
                'logo': pay.library.logo.url if pay.library.logo else None,
                'planName': pay.subscription.plan.name if pay.subscription and pay.subscription.plan else 'Growth',
                'amount': float(pay.amount),
                'method': pay.method,
                'type': pay.type or 'Subscription',
                'status': pay.status,
                'invoiceNo': pay.invoice_no or f'INV-{str(pay.id)[:6].upper()}',
                'referenceNumber': pay.reference_number,
                'timestamp': pay.created_at.isoformat(),
                'createdAt': pay.created_at.isoformat(),
            }
            for pay in payments
        ]
        return success(data=rows)


@extend_schema(tags=['Platform Dashboard'])
class PlatformPendingRequestsView(APIView):
    """Return the pending library onboarding requests with document checks."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        requests_qs = LibraryRequest.objects.filter(status='Pending').prefetch_related('documents').order_by('-created_at')[:10]
        rows = [
            {
                'id': str(req.id),
                'requestNumber': req.request_number,
                'libraryName': req.library_name,
                'logo': None,
                'ownerName': req.owner_name,
                'email': req.email,
                'mobile': req.mobile,
                'city': req.city,
                'state': req.state,
                'submittedDate': req.created_at.strftime('%Y-%m-%d'),
                'chosenPlan': req.chosen_plan or 'Starter',
                'billingCycle': req.billing_cycle or 'Monthly',
                'feeAmount': float(req.fee_amount or 0),
                'branchesPlanned': req.branches_planned,
                'plannedSeats': req.planned_seats,
                'documentCheck': {
                    'emailVerified': req.email_verified,
                    'mobileVerified': req.mobile_verified,
                    'aadhaarUploaded': req.aadhaar_uploaded,
                    'gstOrRegistrationUploaded': req.gst_uploaded,
                    'ownershipProofUploaded': req.ownership_proof_uploaded,
                },
                'documents': [
                    {
                        'title': doc.title,
                        'url': doc.file.url if doc.file else '',
                        'size': f'{round(doc.file_size / 1024, 1)} KB' if doc.file_size else '1.2 MB',
                    }
                    for doc in req.documents.all()
                ],
                'status': req.status,
                'createdAt': req.created_at.isoformat(),
            }
            for req in requests_qs
        ]
        return success(data=rows)


@extend_schema(tags=['Platform Dashboard'])
class PlatformEmailHealthView(APIView):
    """Return email connection health status across all libraries."""

    permission_classes = [IsSuperAdmin]

    def get(self, request):
        health_map = {
            h.library_id: h
            for h in EmailConnectionHealth.objects.select_related('library').all()
        }
        libraries = Library.objects.all().order_by('name')[:15]
        rows = []
        for lib in libraries:
            health = health_map.get(lib.id)
            if health:
                rows.append(
                    {
                        'id': str(health.id),
                        'libraryCode': lib.code,
                        'libraryName': lib.name,
                        'logo': lib.logo.url if lib.logo else None,
                        'provider': health.provider or 'Custom SMTP',
                        'connectedEmail': health.connected_email or lib.contact_email,
                        'status': health.status if health.status in ['Connected', 'Error', 'Degraded'] else ('Connected' if lib.email_connection_status == 'Connected' else 'Error'),
                        'lastSuccessfulSend': health.last_success_at.isoformat() if health.last_success_at else None,
                        'lastError': str(health.last_error or ''),
                        'failureCount': health.failure_count,
                        'bounceRate': float(health.bounce_rate),
                    }
                )
            else:
                rows.append(
                    {
                        'id': str(lib.id),
                        'libraryCode': lib.code,
                        'libraryName': lib.name,
                        'logo': lib.logo.url if lib.logo else None,
                        'provider': 'Custom SMTP',
                        'connectedEmail': lib.contact_email or f'info@{lib.code.lower()}.com',
                        'status': 'Connected' if lib.email_connection_status == 'Connected' else 'Degraded',
                        'lastSuccessfulSend': lib.updated_at.isoformat(),
                        'lastError': '',
                        'failureCount': 0,
                        'bounceRate': 0.0,
                    }
                )
        return success(data=rows)
