"""Standard pagination conforming to Section 3.5."""
import math
import uuid
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPlatformPagination(PageNumberPagination):
    """
    Standard pagination matching API Design Document conventions:
    Query parameters:
    - ?page=1
    - ?limit=25 (max 100)
    """
    page_size = 25
    page_size_query_param = 'limit'
    max_page_size = 100

    def get_paginated_response(self, data):
        request_id = getattr(self.request, 'request_id', f'req_{uuid.uuid4().hex[:8]}')
        total = self.page.paginator.count
        limit = self.get_page_size(self.request)
        total_pages = math.ceil(total / limit) if limit else 1

        return Response({
            'data': data,
            'meta': {
                'page': self.page.number,
                'limit': limit,
                'total': total,
                'total_pages': total_pages,
                'request_id': request_id,
            },
        })

