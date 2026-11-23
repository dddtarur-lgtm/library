"""Custom dashboard callback for Django Unfold Admin."""
from decimal import Decimal
from django.db.models import Sum

from apps.accounts.models import DeletionRequest, User
from apps.audit.models import AuditLog
from apps.billing.models import PlatformPayment
from apps.libraries.models import Library, LibraryRequest
from apps.platform_admin.models import SupportTicket
from apps.students.models import Student


def dashboard_callback(request, context):
    """Populate KPI cards and recent activity tables on the Admin home page."""
    total_libraries = Library.objects.count()
    active_libraries = Library.objects.filter(library_status='Active').count()
    pending_requests = LibraryRequest.objects.filter(status='Pending').count()
    live_students = Student.objects.filter(is_deleted=False, status='Live').count()
    total_students = Student.objects.filter(is_deleted=False).count()
    total_users = User.objects.filter(is_active=True).count()
    open_tickets = SupportTicket.objects.filter(status__in=['Open', 'In Progress']).count()
    pending_deletions = DeletionRequest.objects.filter(status='Pending').count()

    revenue_agg = PlatformPayment.objects.filter(status='Success').aggregate(
        total=Sum('amount')
    )
    total_revenue = revenue_agg['total'] or Decimal('0.00')

    recent_libraries = Library.objects.select_related('owner').order_by('-created_at')[:6]
    recent_audits = AuditLog.objects.select_related('actor', 'library').order_by('-created_at')[:8]

    context.update(
        {
            'kpis': [
                {
                    'title': 'Total Libraries',
                    'value': total_libraries,
                    'subtitle': f'{active_libraries} active tenants',
                    'icon': 'apartment',
                },
                {
                    'title': 'Pending Approvals',
                    'value': pending_requests,
                    'subtitle': f'{pending_deletions} deletion requests',
                    'icon': 'assignment_turned_in',
                },
                {
                    'title': 'Live Students',
                    'value': live_students,
                    'subtitle': f'{total_students} total enrolled ({total_users} users)',
                    'icon': 'school',
                },
                {
                    'title': 'Platform Revenue',
                    'value': f'₹{total_revenue:,.2f}',
                    'subtitle': f'{open_tickets} open support tickets',
                    'icon': 'payments',
                },
            ],
            'recent_libraries': recent_libraries,
            'recent_audits': recent_audits,
        }
    )
    return context

