"""Views for Section 16.1 Leads (Enquiries) - Library Admin Panel."""
import uuid
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import PlatformAPIException
from apps.core.pagination import StandardPlatformPagination
from apps.libraries.models import Branch, Library
from apps.public.models import LibraryEnquiry
from apps.students.models import Student, StudentMembership


def _get_request_library(request):
    """Retrieve tenant library from request org_id or user."""
    library_id = getattr(request, 'org_id', None) or getattr(request.user, 'library_id', None)
    if not library_id and getattr(request.user, 'owned_library', None):
        return request.user.owned_library
    if not library_id:
        raise PlatformAPIException('Tenant library context required.', code='unauthorized', status_code=status.HTTP_401_UNAUTHORIZED)
    lib = Library.objects.filter(pk=library_id).first()
    if not lib:
        raise PlatformAPIException('Library not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
    return lib


def _serialize_lead(lead):
    return {
        'id': str(lead.id),
        'name': lead.name,
        'mobile': lead.mobile,
        'email': lead.email,
        'source': lead.source,
        'status': lead.status,
        'branch_id': str(lead.branch_id) if lead.branch_id else None,
        'assigned_to': str(lead.assigned_to_id) if lead.assigned_to_id else None,
        'next_follow_up_at': lead.next_follow_up_at.isoformat() if lead.next_follow_up_at else None,
        'lost_reason': lead.lost_reason,
        'notes': lead.notes,
        'enrollment_id': str(lead.enrollment_id) if lead.enrollment_id else None,
        'created_at': lead.created_at.isoformat(),
        'updated_at': lead.updated_at.isoformat() if hasattr(lead, 'updated_at') else lead.created_at.isoformat(),
    }


class LibraryLeadsListView(APIView):
    """GET & POST /v1/library/leads"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        library = _get_request_library(request)
        qs = LibraryEnquiry.objects.filter(library=library)

        status_param = request.GET.get('status')
        if status_param:
            qs = qs.filter(status__iexact=status_param)

        source = request.GET.get('source')
        if source:
            qs = qs.filter(source__iexact=source)

        assigned_to = request.GET.get('assigned_to')
        if assigned_to:
            qs = qs.filter(assigned_to_id=assigned_to)

        branch_id = request.GET.get('branch_id')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)

        follow_up = request.GET.get('follow_up')
        now = timezone.now()
        if follow_up == 'today':
            qs = qs.filter(next_follow_up_at__date=now.date())
        elif follow_up == 'overdue':
            qs = qs.filter(next_follow_up_at__lt=now, status__in=['new', 'contacted', 'visited'])

        q = request.GET.get('q')
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(mobile__icontains=q) | Q(email__icontains=q))

        # Status counts & conversion percentage
        all_leads = LibraryEnquiry.objects.filter(library=library)
        total_count = all_leads.count()
        joined_count = all_leads.filter(status__iexact='joined').count()
        conversion_pct = round((joined_count / total_count * 100), 1) if total_count > 0 else 0.0

        status_counts = {}
        for s in ['new', 'contacted', 'visited', 'joined', 'lost']:
            status_counts[s] = all_leads.filter(status__iexact=s).count()

        paginator = StandardPlatformPagination()
        page = paginator.paginate_queryset(qs.order_by('-created_at'), request, view=self)
        items = [_serialize_lead(l) for l in page]

        resp = paginator.get_paginated_response(items)
        resp.data['meta'] = resp.data.get('meta', {})
        resp.data['meta']['counts'] = status_counts
        resp.data['meta']['conversion_percent'] = conversion_pct
        return resp

    def post(self, request):
        library = _get_request_library(request)
        name = request.data.get('name')
        if not name:
            raise PlatformAPIException('name is required.', code='validation_error')

        branch = None
        branch_id = request.data.get('branch_id')
        if branch_id:
            branch = Branch.objects.filter(pk=branch_id, library=library).first()

        note_text = request.data.get('note')
        notes = [{'text': note_text, 'added_at': timezone.now().isoformat()}] if note_text else []

        lead = LibraryEnquiry.objects.create(
            library=library,
            branch=branch,
            name=name,
            mobile=request.data.get('mobile', ''),
            email=request.data.get('email', ''),
            source=request.data.get('source', 'manual'),
            status='new',
            assigned_to_id=request.data.get('assigned_to'),
            next_follow_up_at=request.data.get('next_follow_up_at'),
            notes=notes,
        )
        return Response(_serialize_lead(lead), status=status.HTTP_201_CREATED)


class LibraryLeadDetailView(APIView):
    """GET & PATCH & DELETE /v1/library/leads/{id}"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        library = _get_request_library(request)
        lead = LibraryEnquiry.objects.filter(pk=id, library=library).first()
        if not lead:
            raise PlatformAPIException('Lead not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        return Response(_serialize_lead(lead))

    def patch(self, request, id):
        library = _get_request_library(request)
        lead = LibraryEnquiry.objects.filter(pk=id, library=library).first()
        if not lead:
            raise PlatformAPIException('Lead not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        data = request.data
        if 'status' in data:
            new_status = data['status'].lower()
            if new_status == 'lost' and not data.get('lost_reason'):
                raise PlatformAPIException('lost_reason is required when marking status as lost.', code='validation_error')
            lead.status = new_status
            if 'lost_reason' in data:
                lead.lost_reason = data['lost_reason']

        for field in ['name', 'mobile', 'email', 'next_follow_up_at']:
            if field in data:
                setattr(lead, field, data[field])

        if 'assigned_to' in data:
            lead.assigned_to_id = data['assigned_to']

        lead.save()
        return Response(_serialize_lead(lead))

    def delete(self, request, id):
        library = _get_request_library(request)
        lead = LibraryEnquiry.objects.filter(pk=id, library=library).first()
        if not lead:
            raise PlatformAPIException('Lead not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)
        lead.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LibraryLeadNotesView(APIView):
    """POST /v1/library/leads/{id}/notes"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        library = _get_request_library(request)
        lead = LibraryEnquiry.objects.filter(pk=id, library=library).first()
        if not lead:
            raise PlatformAPIException('Lead not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        note_text = request.data.get('note')
        if not note_text:
            raise PlatformAPIException('note is required.', code='validation_error')

        note_entry = {
            'id': uuid.uuid4().hex[:8],
            'text': note_text,
            'author': request.user.get_full_name() or request.user.email,
            'added_at': timezone.now().isoformat(),
        }
        lead.notes.append(note_entry)
        lead.save(update_fields=['notes', 'updated_at'])
        return Response(note_entry, status=status.HTTP_201_CREATED)


class LibraryLeadConvertView(APIView):
    """POST /v1/library/leads/{id}/convert"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        library = _get_request_library(request)
        lead = LibraryEnquiry.objects.filter(pk=id, library=library).first()
        if not lead:
            raise PlatformAPIException('Lead not found.', code='not_found', status_code=status.HTTP_404_NOT_FOUND)

        branch_id = request.data.get('branch_id') or (lead.branch_id if lead.branch else None)
        branch = Branch.objects.filter(pk=branch_id, library=library).first() if branch_id else library.branches.first()
        if not branch:
            raise PlatformAPIException('Valid branch_id is required to convert lead to student.', code='validation_error')

        # Check or create student
        from apps.accounts.models import User
        user = User.objects.filter(phone=lead.mobile).first()
        if not user:
            user = User.objects.create_user(
                email=lead.email or f"{lead.mobile}@student.shelfspace.in",
                phone=lead.mobile,
                password='Password123!',
                first_name=lead.name.split()[0],
                last_name=' '.join(lead.name.split()[1:]) if len(lead.name.split()) > 1 else '',
                role='STUDENT',
            )

        student = Student.objects.filter(user=user, library=library).first()
        if not student:
            student = Student.objects.create(
                user=user,
                library=library,
                branch=branch,
                name=lead.name,
                phone=lead.mobile,
                email=lead.email,
                status='Live',
            )

        plan_id = request.data.get('plan_id')
        if plan_id:
            from apps.billing.models import FeePlan
            plan = FeePlan.objects.filter(pk=plan_id, library=library).first()
            if plan:
                StudentMembership.objects.create(
                    student=student,
                    plan=plan,
                    start_date=timezone.now().date(),
                    end_date=timezone.now().date() + timezone.timedelta(days=plan.duration_days or 30),
                    status='Active',
                    amount_paid=plan.price or 0,
                    payment_mode='Cash',
                )

        lead.status = 'joined'
        lead.enrollment_id = student.id
        lead.save(update_fields=['status', 'enrollment_id', 'updated_at'])

        return Response({'enrollment_id': str(student.id)}, status=status.HTTP_200_OK)


class LibraryLeadsStatsView(APIView):
    """GET /v1/library/leads/stats"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        library = _get_request_library(request)
        all_leads = LibraryEnquiry.objects.filter(library=library)

        funnel = [
            {'stage': 'new', 'count': all_leads.filter(status='new').count()},
            {'stage': 'contacted', 'count': all_leads.filter(status='contacted').count()},
            {'stage': 'visited', 'count': all_leads.filter(status='visited').count()},
            {'stage': 'joined', 'count': all_leads.filter(status='joined').count()},
            {'stage': 'lost', 'count': all_leads.filter(status='lost').count()},
        ]

        sources_agg = all_leads.values('source').annotate(count=Count('id')).order_by('-count')
        by_source = [{'source': s['source'] or 'unknown', 'count': s['count']} for s in sources_agg]

        now = timezone.now()
        follow_ups_due = all_leads.filter(next_follow_up_at__lte=now, status__in=['new', 'contacted', 'visited']).count()

        return Response({
            'funnel': funnel,
            'by_source': by_source,
            'follow_ups_due': follow_ups_due,
        })
