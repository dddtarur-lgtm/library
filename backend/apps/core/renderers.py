"""Standard DRF JSON response renderer with meta and data envelope."""
import uuid
from rest_framework.renderers import JSONRenderer


class StandardJSONRenderer(JSONRenderer):
    """
    Renders all successful JSON responses into the standard specification envelope:
    {
        "data": ...,
        "meta": { "request_id": "..." }
    }
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if renderer_context is None:
            return super().render(data, accepted_media_type, renderer_context)

        response = renderer_context.get('response')
        request = renderer_context.get('request')

        # If already formatted with "error" or "data" envelope, render as-is
        if isinstance(data, dict) and ('error' in data or ('data' in data and 'meta' in data)):
            return super().render(data, accepted_media_type, renderer_context)

        # 204 No Content
        if response and response.status_code == 204:
            return b''

        # If response is an error (4xx/5xx) that was returned directly without exception handler
        if response and response.status_code >= 400:
            request_id = getattr(request, 'request_id', f'req_{uuid.uuid4().hex[:8]}') if request else f'req_{uuid.uuid4().hex[:8]}'
            error_data = {
                'error': {
                    'code': 'bad_request',
                    'message': 'Request could not be processed.',
                    'details': data if isinstance(data, (list, dict)) else [{'detail': str(data)}],
                    'request_id': request_id,
                }
            }
            return super().render(error_data, accepted_media_type, renderer_context)

        request_id = getattr(request, 'request_id', f'req_{uuid.uuid4().hex[:8]}') if request else f'req_{uuid.uuid4().hex[:8]}'

        # Handle paginated results
        if isinstance(data, dict) and 'results' in data and ('count' in data or 'page' in data):
            results = data.pop('results')
            envelope = {
                'data': results,
                'meta': {
                    **data,
                    'request_id': request_id,
                },
            }
            return super().render(envelope, accepted_media_type, renderer_context)

        envelope = {
            'data': data if data is not None else {},
            'meta': {
                'request_id': request_id,
            },
        }
        return super().render(envelope, accepted_media_type, renderer_context)

